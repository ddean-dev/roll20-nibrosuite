import NibroCore from "./NibroCore";

namespace NibroUtils {
  export function isGM(ctx: NibroCore.Context): boolean {
    if (!ctx) {
      return false;
    }
    return playerIsGM(ctx.msg.playerid);
  }

  export function getGMPlayerIds(): string[] {
    return findObjs({ _type: "player" })
      .filter((player: Player) => playerIsGM(player.id))
      .map((player) => player.id);
  }

  export function getAttributeId(character_id: string, name: string): string {
    const results = findObjs({
      _type: "attribute",
      _characterid: character_id,
      name: name,
    });
    if (results.length < 1) {
      return "";
    } else {
      return results[0].get("_id");
    }
  }

  export namespace Chat {
    export function reply(
      ctx: NibroCore.Context,
      text: string,
      speakingAs: string = "NibroCore",
    ) {
      if (!ctx) {
        log("NibroCore Reply:" + text);
        return;
      }
      sendChat(speakingAs, text, undefined, { use3d: true });
    }

    export function direct(text: string) {
      sendChat("NibroCore", `/direct ${text}`, undefined, { noarchive: true });
    }

    export function whisperReply(ctx: NibroCore.Context, text?: string) {
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

    export function whisperGM(text: string) {
      sendChat("NibroCore", `/w gm ${text}`, undefined, { noarchive: true });
    }
  }
}
export default NibroUtils;
