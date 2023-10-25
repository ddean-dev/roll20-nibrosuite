import NibroUtils from "./NibroUtils";

namespace NibroCore {
  const chatCommands: { [key: string]: ChatCommand } = {};
  const chatCommandsArray: ChatCommand[] = [];
  const managedMacros: ManagedMacro[] = [];
  const advancedMacros: { [id: string]: ManagedMacro } = {};
  const setupCallbacks: (() => void)[] = [];

  export interface ChatCommand {
    primaryName: string;
    run: (ctx: Context, args: Arguments) => void;
    auth?: (ctx: Context) => boolean;
    aliases?: string[];
    helpText: string;
    args?: { [arg: string]: { required: boolean; description?: string } };
  }

  export interface ManagedMacro {
    name: string;
    action?: () => string;
    isVisibleToAll: boolean;
    isTokenAction: boolean;
    advancedAction?: (ctx: Context, args: string[]) => void;
    advancedArgs?: string[];
  }

  interface context {
    msg: Message;
    command: ChatCommand;
    args: Arguments;
  }

  export type Context = context | undefined;

  export interface Arguments {
    [key: string]: string;
  }

  export function registerChatCommand(command: ChatCommand): ChatCommand {
    chatCommands[command.primaryName.toUpperCase()] = command;
    chatCommandsArray.push(command);
    command.aliases?.forEach((alias) => {
      chatCommands[alias.toUpperCase()] = command;
    });
    log(`Registered NibroCore Command: !${command.primaryName}`);
    return command;
  }

  export function registerMacro(macro: ManagedMacro) {
    if (macro.advancedAction) {
      advancedMacros[macro.name] = macro;
      if (macro.advancedArgs) {
        macro.action = () =>
          `!NibroMacro --macro ${macro.name} --args ${macro?.advancedArgs?.join(
            ";",
          )}`;
      } else {
        macro.action = () => `!NibroMacro --macro ${macro.name}`;
      }
    }
    const i = managedMacros.findIndex((m) => m.name == macro.name);
    if (i == -1) {
      managedMacros.push(macro);
    } else {
      managedMacros[i] = macro;
    }
    log(`Registered NibroCore Macro: #${macro.name}`);
  }

  export function registerSetupHook(callback: () => void): void {
    setupCallbacks.push(callback);
  }

  export const Command_NibroHelp = registerChatCommand({
    primaryName: "NibroHelp",
    helpText: "Provides a list of available NibroCore functions",
    run: (ctx: Context) => {
      let output = "";
      output = output + "NibroCore has the following commands registered:";
      chatCommandsArray.forEach((com) => {
        if (com.auth && !com.auth(ctx)) {
          return;
        }
        output += `<br><br><b>!${com.primaryName}</b>`;
        output += `: ${com?.helpText}`;
        if (com.args) {
          Object.keys(com.args).forEach((arg) => {
            output += `<br>  --${arg}`;
          });
        }
        if (com.aliases && com.aliases.length > 0) {
          output += `<br><i>Aliases:</i> ${com.aliases.join(", ")}`;
        }
      });
      NibroUtils.Chat.direct(output);
    },
  });

  export const Command_NibroSetup = registerChatCommand({
    primaryName: "NibroSetup",
    helpText: "Initializes NibroCore, creating macros for all managed macros",
    run: (ctx: Context) => {
      if (!ctx) {
        return;
      }
      setupCallbacks.forEach((callback) => callback());
      const GMList = NibroUtils.getGMPlayerIds().join(",");
      const existingMacros: Macro[] = findObjs({
        _type: "macro",
      });
      managedMacros.forEach((macro) => {
        const existing = existingMacros.find(
          (existing) => existing.get("name") === macro.name,
        );
        if (existing) {
          existing.set("action", macro.action?.() || "");
          if (macro.isVisibleToAll) {
            existing.set("visibleto", "all");
          } else {
            existing.set("visibleto", GMList);
          }
        } else {
          createObj("macro", {
            name: macro.name,
            action: macro.action?.() || "",
            visibleto: macro.isVisibleToAll ? "all" : GMList,
            istokenaction: macro.isTokenAction,
            playerid: ctx.msg.playerid,
          });
        }
      });
      NibroUtils.Chat.whisperGM(`Macros Updated`);
    },
  });

  export const Command_NibroMacro = registerChatCommand({
    primaryName: "NibroMacro",
    run: (ctx: Context, args: Arguments) => {
      advancedMacros[args.macro || ""].advancedAction?.(
        ctx,
        args.args ? args.args.split(";") : [],
      );
    },
    auth: (ctx: Context) => {
      return (
        advancedMacros[ctx?.args.macro || ""]?.isVisibleToAll ||
        NibroUtils.isGM(ctx)
      );
    },
    helpText:
      "Provides scripting functions for macros that need api functionality",
    args: {
      macro: { required: true, description: "the name of the macro" },
      args: {
        required: false,
        description: "arguments, seperated by semicolon",
      },
    },
  });

  export function onChatMessage(messageOriginal: Message) {
    try {
      const msg: Message = { ...messageOriginal };

      // Aborts if message is not api
      if (msg.type !== "api") {
        return;
      }

      // Lookup command
      const commandName = msg.content.split(" ")[0].slice(1).toUpperCase();
      let command: ChatCommand;
      if (Object.hasOwn(chatCommands, commandName)) {
        command = chatCommands[commandName];
      } else {
        return;
      }

      // Converts arguments into an object
      const args: Arguments = {};
      msg.content
        .split(" --")
        ?.slice(1)
        ?.forEach((arg) => {
          const parts = arg.split(" ");
          args[parts[0].toLowerCase()] =
            parts.length >= 2 ? parts.slice(1).join(" ") : "";
        });

      // Construct context
      const ctx: Context = { msg, command, args };

      // Check Auth
      if (!(command.auth ? command.auth(ctx) : NibroUtils.isGM(ctx))) {
        NibroUtils.Chat.whisperReply(
          ctx,
          "You do not have permission to use that command",
        );
        return;
      }

      // Call the command
      command.run(ctx, args);
    } catch (e) {
      const output = "NibroCore Error: " + e + (e as Error).stack;
      log(output);
      NibroUtils.Chat.whisperGM(
        "An error occurred, see API console for details",
      );
    }
  }
  on("chat:message", (msg) => onChatMessage(msg as Message));
}
export default NibroCore;
