namespace NibroCore {
  export let chatCommands: { [key: string]: ChatCommand } = {};
  export let chatCommandsArray: ChatCommand[] = [];
  export let managedMacros: ManagedMacro[] = [];
  export let advancedMacros: { [id: string]: ManagedMacro } = {};
  export let setupCallbacks: (() => void)[] = [];

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

  export interface Context {
    msg: Message;
    command: ChatCommand;
    args: Arguments;
  }

  export interface Arguments {
    [key: string]: string;
  }

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
      if (chatCommands.hasOwnProperty(commandName)) {
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
      if (!(command.auth ? command.auth(ctx) : isGM(ctx))) {
        whisperReply(ctx, "You do not have permission to use that command");
        return;
      }

      // Call the command
      command.run(ctx, args);
    } catch (e) {
      const output = "NibroCore Error: " + e + (e as Error).stack;
      log(output);
      whisperGM("An error occurred, see API console for details");
    }
  }

  export function isGM(ctx: Context): boolean {
    if (!ctx) {
      return false;
    }
    return playerIsGM(ctx.msg.playerid);
  }

  export function registerChatCommand(command: ChatCommand) {
    chatCommands[command.primaryName.toUpperCase()] = command;
    chatCommandsArray.push(command);
    command.aliases?.forEach((alias) => {
      chatCommands[alias.toUpperCase()] = command;
    });
    log(`Registered NibroCore Command: !${command.primaryName}`);
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
    let i = managedMacros.findIndex((m) => m.name == macro.name);
    if (i == -1) {
      managedMacros.push(macro);
    } else {
      managedMacros[i] = macro;
    }
    log(`Registered NibroCore Macro: #${macro.name}`);
  }

  export function whisperGM(text: string) {
    sendChat("NibroCore", `/w gm ${text}`, undefined, { noarchive: true });
  }

  export function whisperReply(ctx: Context, text: string) {
    if (!ctx) {
      log("NibroCore Whisper Reply: " + text);
      return;
    }
    let who: string = ctx.msg.who;
    if (who.slice(-5) === " (GM)") {
      who = who.slice(0, -5);
    }
    sendChat("NibroCore", `/w "${who}" ${text}`, undefined, {
      noarchive: true,
    });
  }

  export function getAttributeId(character_id: string, name: string): string {
    let results = findObjs({
      _type: "attribute",
      _characterid: character_id,
      name: name,
    });
    if (results.length < 1) {
      return "";
    } else {
      return (results[0] as Attribute).get("_id");
    }
  }

  export function direct(text: string) {
    sendChat("NibroCore", `/direct ${text}`, undefined, { noarchive: true });
  }

  export function reply(
    ctx: Context,
    text: string,
    speakingAs: string = "NibroCore",
  ) {
    if (!ctx) {
      log("NibroCore Reply:" + text);
      return;
    }
    sendChat(speakingAs, text, undefined, { use3d: true });
  }

  export function registerSetupHook(callback: () => void): void {
    setupCallbacks.push(callback);
  }

  function _help(ctx: Context, _: Arguments) {
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
    direct(output);
  }

  function _setup(ctx: Context, _: Arguments) {
    setupCallbacks.forEach((callback) => callback());
    const GMList = findObjs({ _type: "player" })
      .filter((player: Player) => playerIsGM(player.id))
      .map((player) => player.id)
      .join(",");
    const existingMacros: Macro[] = findObjs({
      _type: "macro",
    });
    managedMacros.forEach((macro) => {
      const existing = existingMacros.find(
        (existing) => existing.get("name") === macro.name,
      );
      if (existing) {
        existing.set("action", macro.action?.());
        if (macro.isVisibleToAll) {
          existing.set("visibleto", "all");
        } else {
          existing.set("visibleto", GMList);
        }
      } else {
        createObj("macro", {
          name: macro.name,
          action: macro.action?.(),
          visibleto: macro.isVisibleToAll ? "all" : GMList,
          istokenaction: macro.isTokenAction,
          playerid: ctx.msg.playerid,
        });
      }
    });
    whisperGM("Macros Updated");
  }

  function _advanced_macro(
    ctx: Context,
    args: { args?: string; macro?: string },
  ) {
    advancedMacros[args.macro || ""].advancedAction?.(
      ctx,
      args.args ? args.args.split(";") : [],
    );
  }

  function _advanced_macro_auth(ctx: Context): boolean {
    return advancedMacros[ctx.args.macro]?.isVisibleToAll || isGM(ctx);
  }

  registerChatCommand({
    primaryName: "NibroHelp",
    helpText: "Provides a list of available NibroCore functions",
    run: (ctx: Context, args: Arguments) => _help(ctx, args),
  });
  registerChatCommand({
    primaryName: "NibroSetup",
    helpText: "Initializes NibroCore, creating macros for all managed macros",
    run: (ctx: Context, args: Arguments) => _setup(ctx, args),
  });
  registerChatCommand({
    primaryName: "NibroMacro",
    run: (ctx: Context, args: Arguments) => _advanced_macro(ctx, args),
    auth: (ctx: Context) => _advanced_macro_auth(ctx),
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
  on("chat:message", (msg) => onChatMessage(msg));
}
export default NibroCore;
