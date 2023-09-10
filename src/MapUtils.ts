import { NibroCore } from "./NibroCore";

export namespace NibroMapUtils {
  export interface MapUtilsInterface {
    ChangeMap: (ctx: NibroCore.Context, args: NibroCore.Arguments) => void;
  }

  export class MapUtilsImplementation implements MapUtilsInterface {
    PUBLIC_MAP_PREFIX: string = "*";

    constructor(NibroCore: NibroCore.NibroCoreInterface) {
      NibroCore.registerChatCommand({
        primaryName: "ChangeMap",
        run: this.ChangeMap,
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
            map.get("name").startsWith(this.PUBLIC_MAP_PREFIX),
          );
          const mapMacro: string = `?{Map|Rejoin,rejoin|${maps
            .map((map) => `${map.get("name").slice(1)},${map.id}`)
            .join("|")}}`;
          return `!ChangeMap --mapid ${mapMacro}`;
        },
        isVisibleToAll: true,
      });
    }

    public ChangeMap(ctx: NibroCore.Context, args: { mapid?: string }) {
      let playerPages = Campaign().get("playerspecificpages") as
        | { [playerId: string]: string }
        | false;
      if (!args.mapid || args.mapid === "rejoin") {
        if (playerPages !== false && ctx.msg.playerid in playerPages) {
          delete playerPages[ctx.msg.playerid];
          MapUtilsImplementation.setPlayerSpecificPages(playerPages);
          NibroCore.NibroCore.whisperReply(ctx, "Rejoined active map");
        } else {
          NibroCore.NibroCore.whisperReply(
            ctx,
            "You are already on the active map",
          );
        }
      } else {
        if (playerPages === false) {
          playerPages = {};
        }
        if (playerPages[ctx.msg.playerid] !== args.mapid) {
          if (playerPages[ctx.msg.playerid]) {
            delete playerPages[ctx.msg.playerid];
            MapUtilsImplementation.setPlayerSpecificPages(playerPages);
          }
          playerPages[ctx.msg.playerid] = args.mapid;
          MapUtilsImplementation.setPlayerSpecificPages(playerPages);
          NibroCore.NibroCore.whisperReply(ctx, "Changed map");
        } else {
          NibroCore.NibroCore.whisperReply(
            ctx,
            "You are already on the selected map",
          );
        }
      }
    }

    private static setPlayerSpecificPages(
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
  }

  export let MapUtils: MapUtilsInterface = new MapUtilsImplementation(
    NibroCore.NibroCore,
  );
}
