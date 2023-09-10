import { CardUtils } from "./CardUtils";
import { NibroCore } from "./NibroCore";

export namespace NibroTokenMarkerUtils {
  export interface TokenMarkerUtilsInterface {
    SetTokenMarker: (ctx: NibroCore.Context, args: NibroCore.Arguments) => void;
    SetTokenMarkerTooltip: (obj: Graphic) => void;
  }

  export class TokenMarkerUtilsImplementation
    implements TokenMarkerUtilsInterface
  {
    private static TOKEN_MARKER_PREFIX = "condition-";

    constructor() {
      NibroCore.NibroCore.registerChatCommand({
        primaryName: "SetTokenMarker",
        run: this.SetTokenMarker,
        args: {
          marker: { required: true },
          value: { required: false },
        },
        aliases: [],
        auth: () => true,
        helpText: "Sets a token marker on the selected tokens",
      });
      NibroCore.NibroCore.registerMacro({
        name: "Condition",
        action: () => {
          const markers: TokenMarker[] = JSON.parse(
            Campaign().get("token_markers"),
          );
          const markerChoices: string = markers
            .filter((marker) =>
              marker.name.startsWith(
                TokenMarkerUtilsImplementation.TOKEN_MARKER_PREFIX,
              ),
            )
            .map((marker) => {
              const name = TokenMarkerUtilsImplementation.tokenMarkerName(
                marker.tag,
              );
              return `${name},${marker.tag}`;
            })
            .sort()
            .join("|");
          return `!SetTokenMarker --marker ?{Marker|${markerChoices}} --value ?{Value| , |Clear,-1|1|2|3|4|5|6|7|8|9|0}`;
        },
        isVisibleToAll: true,
        isTokenAction: true,
      });
      on("change:graphic:statusmarkers", this.SetTokenMarkerTooltip);
    }

    public SetTokenMarker(
      ctx: NibroCore.Context,
      args: { marker?: string; value?: string },
    ) {
      //Validate arguments
      if (args.marker == undefined) {
        NibroCore.NibroCore.whisperReply(ctx, "Argument 'marker' required");
        return;
      }
      let tag: string = args.marker;
      let asdf = "";
      let val: number = parseInt(args.value || "");
      if (!isNaN(val) && (val > 9 || val < -1)) {
        NibroCore.NibroCore.whisperReply(
          ctx,
          "Argument 'value' must be between -1 and 9",
        );
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
        NibroCore.NibroCore.whisperReply(ctx, "Marker not found");
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
          this.SetTokenMarkerTooltip(obj);
          count += 1;
        });
      if (count >= 1) {
        NibroCore.NibroCore.whisperReply(
          ctx,
          `Marker set on ${count} token(s)`,
        );
      } else {
        NibroCore.NibroCore.whisperReply(ctx, "No selected tokens found");
      }
    }

    public SetTokenMarkerTooltip(obj: Graphic) {
      let tooltip: string = obj.get("tooltip");
      if (tooltip && !tooltip.startsWith("[")) {
        return;
      }
      let currentMarkers: string[] = (obj.get("statusmarkers") as string).split(
        ",",
      );
      currentMarkers = currentMarkers.filter((tm) => {
        return (
          !!tm &&
          tm.startsWith(TokenMarkerUtilsImplementation.TOKEN_MARKER_PREFIX)
        );
      });
      obj.set(
        "tooltip",
        currentMarkers
          .map((tm) => {
            let tag = `[${TokenMarkerUtilsImplementation.tokenMarkerName(tm)}]`;
            const split = tm.indexOf("@");
            if (split !== -1) {
              tag = `[${TokenMarkerUtilsImplementation.tokenMarkerName(
                tm,
              )} ${tm.slice(split + 1)}]`;
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
          CardUtils.CardUtils.PruneCards(
            playerId,
            "Conditions",
            currentMarkers.map((tm) =>
              TokenMarkerUtilsImplementation.tokenMarkerName(tm),
            ),
          );
        });
    }

    private static toTitleCase(str: string): string {
      return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
      );
    }

    private static tokenMarkerName(tm: string): string {
      const tag: string = tm.split(":")[0];
      const name: string = tag.slice(
        TokenMarkerUtilsImplementation.TOKEN_MARKER_PREFIX.length,
      );
      return TokenMarkerUtilsImplementation.toTitleCase(name.replace("-", " "));
    }
  }

  export let TokenMarkerUtils: TokenMarkerUtilsInterface =
    new TokenMarkerUtilsImplementation();
}
