import NibroCardUtils from "./CardUtils";
import NibroCore from "./NibroCore";

namespace NibroTokenMarkerUtils {
  export const TOKEN_MARKER_PREFIX = "condition-";

  export function SetTokenMarker(
    ctx: NibroCore.Context,
    args: { marker?: string; value?: string },
  ) {
    //Validate arguments
    if (args.marker == undefined) {
      NibroCore.whisperReply(ctx, "Argument 'marker' required");
      return;
    }
    let tag: string = args.marker;
    let asdf = "";
    let val: number = parseInt(args.value || "");
    if (!isNaN(val) && (val > 9 || val < -1)) {
      NibroCore.whisperReply(ctx, "Argument 'value' must be between -1 and 9");
      return;
    }

    // Check if valid marker
    const markers: TokenMarker[] = JSON.parse(
      Campaign().get("token_markers"),
    ) as TokenMarker[];
    const marker: TokenMarker | undefined = markers.find(
      (tm) => tm.tag === args.marker,
    );
    if (!marker) {
      NibroCore.whisperReply(ctx, "Marker not found");
      return;
    }

    let count: number = 0;
    ctx.msg.selected
      ?.filter((key) => key._type === "graphic")
      .forEach((key) => {
        const obj = getObj("graphic", key._id);

        // Only apply to tokens
        if (!(obj && obj.get("_subtype") === "token")) {
          return;
        }

        //get existing markers
        const currentMarkers: string[] = (
          obj.get("statusmarkers") as string
        ).split(",");
        const markerIndex: number = currentMarkers
          .map((mark) => mark.split("@")[0])
          .indexOf(args.marker || "");

        if (!isNaN(val)) {
          tag = `${tag}@${val}`;
        }

        //add, delete, or replace marker
        if (markerIndex === -1 && val !== -1) {
          currentMarkers.push(tag);
        } else if (val === -1) {
          currentMarkers.splice(markerIndex, 1);
        } else {
          currentMarkers[markerIndex] = tag;
        }
        obj.set("statusmarkers", currentMarkers.join(","));
        SetTokenMarkerTooltip(obj);
        count += 1;
      });
    if (count >= 1) {
      NibroCore.whisperReply(ctx, `Marker set on ${count} token(s)`);
    } else {
      NibroCore.whisperReply(ctx, "No selected tokens found");
    }
  }

  export function SetTokenMarkerTooltip(obj: Graphic) {
    let tooltip: string = obj.get("tooltip");
    if (tooltip && !tooltip.startsWith("[")) {
      return;
    }
    let currentMarkers: string[] = (obj.get("statusmarkers") as string).split(
      ",",
    );
    currentMarkers = currentMarkers.filter((tm) => {
      return !!tm && tm.startsWith(TOKEN_MARKER_PREFIX);
    });
    obj.set(
      "tooltip",
      currentMarkers
        .map((tm) => {
          let tag = `[${tokenMarkerName(tm)}]`;
          const split = tm.indexOf("@");
          if (split !== -1) {
            tag = `[${tokenMarkerName(tm)} ${tm.slice(split + 1)}]`;
          }
          return tag;
        })
        .join(" "),
    );
    obj.set("show_tooltip", true);
    obj
      .get("controlledby")
      .split(",")
      .filter((x: string) => x !== "all")
      .forEach((playerId: string) => {
        NibroCardUtils.PruneCards(
          playerId,
          "Conditions",
          currentMarkers.map((tm) => tokenMarkerName(tm)),
        );
      });
  }

  export function toTitleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
  }

  export function tokenMarkerName(tm: string): string {
    const tag: string = tm.split(":")[0];
    const name: string = tag.slice(TOKEN_MARKER_PREFIX.length);
    return toTitleCase(name.replace("-", " "));
  }

  NibroCore.registerChatCommand({
    primaryName: "SetTokenMarker",
    run: SetTokenMarker,
    args: {
      marker: { required: true },
      value: { required: false },
    },
    aliases: [],
    auth: () => true,
    helpText: "Sets a token marker on the selected tokens",
  });
  NibroCore.registerMacro({
    name: "Condition",
    action: () => {
      const markers: TokenMarker[] = JSON.parse(
        Campaign().get("token_markers"),
      );
      const markerChoices: string = markers
        .filter((marker) => marker.name.startsWith(TOKEN_MARKER_PREFIX))
        .map((marker) => {
          const name = tokenMarkerName(marker.tag);
          return `${name},${marker.tag}`;
        })
        .sort()
        .join("|");
      return `!SetTokenMarker --marker ?{Marker|${markerChoices}} --value ?{Value| , |Clear,-1|1|2|3|4|5|6|7|8|9|0}`;
    },
    isVisibleToAll: true,
    isTokenAction: true,
  });
  on("change:graphic:statusmarkers", SetTokenMarkerTooltip);
}
export default NibroTokenMarkerUtils;
