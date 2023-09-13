import NibroCore from "./NibroCore";

namespace NibroMapUtils {
  export const PUBLIC_MAP_PREFIX: string = "*";

  export function ChangeMap(ctx: NibroCore.Context, args: { mapid?: string }) {
    if (!ctx) {
      return;
    }
    let playerPages = Campaign().get("playerspecificpages") as
      | { [playerId: string]: string }
      | false;
    if (!args.mapid || args.mapid === "rejoin") {
      if (playerPages !== false && ctx.msg.playerid in playerPages) {
        delete playerPages[ctx.msg.playerid];
        setPlayerSpecificPages(playerPages);
        NibroCore.whisperReply(ctx, "Rejoined active map");
      } else {
        NibroCore.whisperReply(ctx, "You are already on the active map");
      }
    } else {
      if (playerPages === false) {
        playerPages = {};
      }
      if (playerPages[ctx.msg.playerid] !== args.mapid) {
        if (playerPages[ctx.msg.playerid]) {
          delete playerPages[ctx.msg.playerid];
          setPlayerSpecificPages(playerPages);
        }
        playerPages[ctx.msg.playerid] = args.mapid;
        setPlayerSpecificPages(playerPages);
        NibroCore.whisperReply(ctx, "Changed map");
      } else {
        NibroCore.whisperReply(ctx, "You are already on the selected map");
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
          playerPages.hasOwnProperty(playerId) &&
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
      const maps = (findObjs({ _type: "page" }) as Page[]).filter((map) =>
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
