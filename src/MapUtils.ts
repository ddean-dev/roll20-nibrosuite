import NibroCore from "./NibroCore";
import NibroUtils from "./NibroUtils";

namespace NibroMapUtils {
  export const PUBLIC_MAP_PREFIX: string = "*";

  export function ChangeMap(ctx: NibroCore.Context, args: { mapid?: string }) {
    if (!ctx) {
      return;
    }
    let playerPages = Campaign().get("playerspecificpages");
    if (!args.mapid || args.mapid === "rejoin") {
      if (playerPages && ctx.msg.playerid in playerPages) {
        delete playerPages[ctx.msg.playerid];
        setPlayerSpecificPages(playerPages);
        NibroUtils.Chat.whisperReply(ctx, "Rejoined active map");
      } else {
        NibroUtils.Chat.whisperReply(ctx, "You are already on the active map");
      }
    } else {
      if (!playerPages) {
        playerPages = {};
      }
      if (playerPages[ctx.msg.playerid] !== args.mapid) {
        if (playerPages[ctx.msg.playerid]) {
          delete playerPages[ctx.msg.playerid];
          setPlayerSpecificPages(playerPages);
        }
        playerPages[ctx.msg.playerid] = args.mapid;
        setPlayerSpecificPages(playerPages);
        NibroUtils.Chat.whisperReply(ctx, "Changed map");
      } else {
        NibroUtils.Chat.whisperReply(
          ctx,
          "You are already on the selected map",
        );
      }
    }
  }

  export function setPlayerSpecificPages(
    playerPages: { [playerId: string]: string } | false,
  ) {
    const pageIds: string[] = findObjs({ _type: "page" }).map(
      (page: Page) => page.id,
    );
    if (playerPages !== false) {
      for (const playerId in playerPages) {
        if (
          Object.hasOwn(playerPages, playerId) &&
          pageIds.indexOf(playerPages[playerId]) === -1
        ) {
          delete playerPages[playerId];
        }
      }
      if (Object.keys(playerPages).length === 0) {
        playerPages = false;
      }
    }
    Campaign().set("playerspecificpages", playerPages);
  }

  NibroCore.registerChatCommand({
    primaryName: "ChangeMap",
    run: ChangeMap,
    args: {
      mapid: { required: false },
    },
    aliases: [],
    auth: () => true,
    helpText: "Changes the current user to the specified map ID",
  });
  NibroCore.registerMacro({
    name: "ChangeMap",
    isTokenAction: false,
    action: () => {
      const maps = findObjs({ _type: "page" }).filter((map) =>
        map.get("name").startsWith(PUBLIC_MAP_PREFIX),
      );
      const mapMacro: string = `?{Map|Rejoin,rejoin|${maps
        .map((map) => `${map.get("name").slice(1)},${map.id}`)
        .join("|")}}`;
      return `!ChangeMap --mapid ${mapMacro}`;
    },
    isVisibleToAll: true,
  });
}
export default NibroMapUtils;
