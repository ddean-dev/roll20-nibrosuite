export namespace NibroCore {
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

  export interface NibroCoreInterface {
    onChatMessage: (messageOriginal: Message) => void;
    registerChatCommand: (command: ChatCommand) => void;
    whisperGM: (text: string) => void;
    whisperReply: (ctx: Context, text: string) => void;
    reply: (ctx: Context, text: string, speakingAs?: string) => void;
    isGM: (ctx: Context) => boolean;
    direct: (text: string) => void;
    registerMacro: (macro: ManagedMacro) => void;
    getAttributeId: (character_id: string, name: string) => string;
    registerSetupHook: (callback: () => void) => void;
  }

  export class NibroCoreImplementation implements NibroCoreInterface {
    private chatCommands: { [key: string]: ChatCommand } = {};
    private chatCommandsArray: ChatCommand[] = [];
    private managedMacros: ManagedMacro[] = [];
    private advancedMacros: { [id: string]: ManagedMacro } = {};
    private setupCallbacks: (() => void)[] = [];

    constructor() {
      this.registerChatCommand({
        primaryName: "NibroHelp",
        helpText: "Provides a list of available NibroCore functions",
        run: (ctx: Context, args: Arguments) => this._help(ctx, args),
      });
      this.registerChatCommand({
        primaryName: "NibroSetup",
        helpText:
          "Initializes NibroCore, creating macros for all managed macros",
        run: (ctx: Context, args: Arguments) => this._setup(ctx, args),
      });
      this.registerChatCommand({
        primaryName: "NibroMacro",
        run: (ctx: Context, args: Arguments) => this._advanced_macro(ctx, args),
        auth: (ctx: Context) => this._advanced_macro_auth(ctx),
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
      on("chat:message", (msg) => this.onChatMessage(msg));
    }

    public onChatMessage(messageOriginal: Message) {
      try {
        const msg: Message = { ...messageOriginal };

        // Aborts if message is not api
        if (msg.type !== "api") {
          return;
        }

        // Lookup command
        const commandName = msg.content.split(" ")[0].slice(1).toUpperCase();
        let command: ChatCommand;
        if (this.chatCommands.hasOwnProperty(commandName)) {
          command = this.chatCommands[commandName];
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
        if (!(command.auth ? command.auth(ctx) : this.isGM(ctx))) {
          this.whisperReply(
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
        this.whisperGM("An error occurred, see API console for details");
      }
    }

    public isGM(ctx: Context): boolean {
      if (!ctx) {
        return false;
      }
      return playerIsGM(ctx.msg.playerid);
    }

    public registerChatCommand(command: ChatCommand) {
      this.chatCommands[command.primaryName.toUpperCase()] = command;
      this.chatCommandsArray.push(command);
      command.aliases?.forEach((alias) => {
        this.chatCommands[alias.toUpperCase()] = command;
      });
      log(`Registered NibroCore Command: !${command.primaryName}`);
    }

    public registerMacro(macro: ManagedMacro) {
      if (macro.advancedAction) {
        this.advancedMacros[macro.name] = macro;
        if (macro.advancedArgs) {
          macro.action = () =>
            `!NibroMacro --macro ${
              macro.name
            } --args ${macro?.advancedArgs?.join(";")}`;
        } else {
          macro.action = () => `!NibroMacro --macro ${macro.name}`;
        }
      }
      let i = this.managedMacros.findIndex((m) => m.name == macro.name);
      if (i == -1) {
        this.managedMacros.push(macro);
      } else {
        this.managedMacros[i] = macro;
      }
      log(`Registered NibroCore Macro: #${macro.name}`);
    }

    public whisperGM(text: string) {
      sendChat("NibroCore", `/w gm ${text}`, undefined, { noarchive: true });
    }

    public whisperReply(ctx: Context, text: string) {
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

    public getAttributeId(character_id: string, name: string): string {
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

    public direct(text: string) {
      sendChat("NibroCore", `/direct ${text}`, undefined, { noarchive: true });
    }

    public reply(ctx: Context, text: string, speakingAs: string = "NibroCore") {
      if (!ctx) {
        log("NibroCore Reply:" + text);
        return;
      }
      sendChat(speakingAs, text, undefined, { use3d: true });
    }

    public registerSetupHook(callback: () => void): void {
      this.setupCallbacks.push(callback);
    }

    private _help(ctx: Context, _: Arguments) {
      let output = "";
      output = output + "NibroCore has the following commands registered:";
      this.chatCommandsArray.forEach((com) => {
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
      this.direct(output);
    }

    private _setup(ctx: Context, _: Arguments) {
      this.setupCallbacks.forEach((callback) => callback());
      const GMList = findObjs({ _type: "player" })
        .filter((player: Player) => playerIsGM(player.id))
        .map((player) => player.id)
        .join(",");
      const existingMacros: Macro[] = findObjs({
        _type: "macro",
      });
      this.managedMacros.forEach((macro) => {
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
      this.whisperGM("Macros Updated");
    }

    private _advanced_macro(
      ctx: Context,
      args: { args?: string; macro?: string },
    ) {
      this.advancedMacros[args.macro || ""].advancedAction?.(
        ctx,
        args.args ? args.args.split(";") : [],
      );
    }

    private _advanced_macro_auth(ctx: Context): boolean {
      return (
        this.advancedMacros[ctx.args.macro]?.isVisibleToAll || this.isGM(ctx)
      );
    }
  }

  export let NibroCore: NibroCoreInterface = new NibroCoreImplementation();
}
