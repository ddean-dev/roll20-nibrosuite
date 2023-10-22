import NibroCore from "./NibroCore";
import NibroUtils from "./NibroUtils";

namespace NibroTokenUtils {
  export function setSelected(
    ctx: NibroCore.Context,
    values: {
      [property in GraphicSettableProperty]?: {
        value?: boolean | number | string;
        attribute_name?: string;
        attribute_value_type?: "current" | "max";
        mod?: (
          ctx: NibroCore.Context,
          token: Graphic,
          character_id: string,
          current: boolean | number | string,
        ) => void;
        attribute_mod?: (current: string) => boolean | number | string;
        link?: string;
      };
    },
  ): string[] {
    if (!ctx) return [];
    const names: string[] = [];
    ctx.msg.selected?.forEach((selection) => {
      if (selection._type != "graphic") {
        return;
      }
      const token = getObj(selection._type, selection._id);
      const character_id = token.get("represents") as string;
      if (!character_id) {
        return;
      }
      names.push(getAttrByName(character_id, "character_name"));
      Object.entries(values).forEach(([property, val]) => {
        if (val.attribute_name) {
          let value = getAttrByName(
            character_id,
            val.attribute_name,
            val.attribute_value_type,
          );
          if (val.attribute_mod) {
            value = val.attribute_mod(value);
          }
          if (value != undefined) {
            token.set(property as GraphicSettableProperty, value);
          }
        } else if (val.value) {
          token.set(property as GraphicSettableProperty, val.value);
        } else if (val.mod) {
          let value = token.get(property as GraphicSettableProperty);
          value = val.mod(ctx, token, character_id, value);
          token.set(property as GraphicSettableProperty, value);
        } else if (val.link) {
          token.set(
            property as GraphicSettableProperty,
            NibroUtils.getAttributeId(character_id, val.link),
          );
        }
      });
    });
    return names;
  }
}
export default NibroTokenUtils;
