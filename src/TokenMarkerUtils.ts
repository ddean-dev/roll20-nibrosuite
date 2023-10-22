import NibroCore from "./NibroCore";
import NibroPF2E from "./PF2E";

namespace NibroTokenMarkerUtils {
  export function SetTokenMarker(
    ctx: NibroCore.Context,
    args: { marker?: string; value?: string },
  ) {
    if (!ctx) return;

    //Validate arguments
    if (args.marker == undefined) {
      NibroCore.whisperReply(ctx, "Argument 'marker' required");
      return;
    }
    let tag: string = args.marker;
    const val: number = parseInt(args.value || "");
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
        count += 1;
        NibroPF2E.setConditionsTooltip(obj);
        NibroPF2E.dealConditionCards(obj);
      });
    if (count >= 1) {
      NibroCore.whisperReply(ctx, `Marker set on ${count} token(s)`);
    } else {
      NibroCore.whisperReply(ctx, "No selected tokens found");
    }
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
}

export default NibroTokenMarkerUtils;
