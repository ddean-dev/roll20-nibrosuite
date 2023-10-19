import NibroCore from "./NibroCore";
import NibroCardUtils from "./CardUtils";
import NibroTokenUtils from "./TokenUtils";

namespace NibroPF2E {
  const TOKEN_MARKER_CONDITION_PREFIX = "condition-";

  function getSelectedCharacters(ctx: NibroCore.Context): Character[] {
    if (!ctx) return [];
    return ctx.msg.selected
      ?.map((graphic) => {
        if (graphic._type != "graphic") {
          return null;
        }
        const charId = getObj(graphic._type, graphic._id).get("represents");
        if (!charId) {
          return null;
        }
        return getObj("character", charId);
      })
      .filter((x) => !!x) as Character[];
  }

  function getConditionMarkers(obj: Graphic): string[] {
    return (obj.get("statusmarkers") as string).split(",").filter((tm) => {
      return !!tm && tm.startsWith(TOKEN_MARKER_CONDITION_PREFIX);
    });
  }

  export function setConditionsTooltip(obj: Graphic): string[] {
    let tooltip: string = obj.get("tooltip");
    if (tooltip && !tooltip.startsWith("[")) {
      return [];
    }
    let currentMarkers = getConditionMarkers(obj);
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

    return currentMarkers;
  }

  export function dealConditionCards(obj: Graphic): void {
    let currentMarkers = getConditionMarkers(obj);
    let character_id = obj.get("represents");
    let controlledBy: string = character_id
      ? (getObj("character", character_id) as Character).get("controlledby")
      : obj.get("controlledby");
    let playerIds: string[] = controlledBy
      .split(",")
      .filter((x: string) => x !== "all" && x !== "");
    if (playerIds.length == 0) {
      playerIds = NibroCore.getGMPlayerIds();
    }
    playerIds.forEach((playerId: string) => {
      NibroCardUtils.PruneCards(
        playerId,
        "Conditions",
        currentMarkers.map((tm: string) => tokenMarkerName(tm)),
      );
    });
  }

  function toTitleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
    );
  }

  function tokenMarkerName(tm: string): string {
    const tag: string = tm.split(":")[0];
    const name: string = tag.slice(TOKEN_MARKER_CONDITION_PREFIX.length);
    return toTitleCase(name.replace("-", " "));
  }

  NibroCore.registerMacro({
    name: "Initiative",
    isTokenAction: true,
    isVisibleToAll: true,
    action: () => "%{selected|initiative}",
  });

  NibroCore.registerMacro({
    name: "LongRest",
    isTokenAction: true,
    isVisibleToAll: false,
    advancedAction: (ctx: NibroCore.Context) => {
      const names = NibroTokenUtils.setSelected(ctx, {
        bar1_value: {
          mod: (_, __, character_id, ___) => {
            const current_hp = parseInt(
              getAttrByName(character_id, "hit_points"),
            );
            const max_hp = parseInt(
              getAttrByName(character_id, "hit_points", "max"),
            );
            const constitution_modifier = parseInt(
              getAttrByName(character_id, "constitution_modifier"),
            );
            const level = parseInt(getAttrByName(character_id, "level"));
            return Math.min(
              current_hp + Math.max(level, 1) * constitution_modifier,
              max_hp,
            );
          },
        },
      });
      NibroCore.whisperReply(
        ctx,
        "Long rest healing applied to: " + names.join(", "),
      );
    },
  });

  NibroCore.registerMacro({
    name: "PersistentDamage",
    isTokenAction: false,
    isVisibleToAll: false,
    action: () =>
      "&{template:rolls} {{header=Persistent Damage}} {{roll01=[[?{Damage|1d6}]]}} {{roll01_type=damage}} {{notes_show=[[floor(1d20/15)]]}} {{notes=Persistent damage ends}}",
  });

  NibroCore.registerMacro({
    name: "PCSetup",
    isTokenAction: false,
    isVisibleToAll: false,
    advancedArgs: ["?{Vision|Standard Vision|Low-Light Vision|Dark Vision}"],
    advancedAction: (ctx, args) => {
      const low_light_vision = args[0] != "Standard Vision";
      const dark_vision = args[0] == "Dark Vision";
      const names = NibroTokenUtils.setSelected(ctx, {
        //Name
        name: { attribute_name: "character_name" },
        showname: { value: true },
        showplayers_name: { value: true },
        playersedit_name: { value: true },
        //Bars
        bar_location: { value: "overlap_top" },
        bar1_link: { link: "hit_points" },
        showplayers_bar1: { value: true },
        playersedit_bar1: { value: true },
        bar2_link: { link: "perception" },
        showplayers_bar2: { value: false },
        playersedit_bar2: { value: false },
        bar3_link: { link: "armor_class" },
        showplayers_bar3: { value: false },
        playersedit_bar3: { value: false },
        //Aura
        showplayers_aura1: { value: false },
        playersedit_aura1: { value: false },
        showplayers_aura2: { value: true },
        playersedit_aura2: { value: false },
        aura2_radius: { value: 0.5 },
        aura2_color: { value: "#ffff00" },
        //Vision
        has_bright_light_vision: { value: true },
        light_sensitivity_multiplier: {
          value: low_light_vision ? 200 : 100,
        },
        has_night_vision: { value: dark_vision },
        night_vision_distance: { value: 60 },
        night_vision_effect: { value: "" },
        //Light
        emits_bright_light: { value: false },
        bright_light_distance: { value: 20 },
        emits_low_light: { value: false },
        low_light_distance: { value: 40 },
      });
      NibroCore.whisperReply(ctx, "PC Token Configured: " + names.join(", "));
    },
  });

  NibroCore.registerMacro({
    name: "NPCSetup",
    isTokenAction: false,
    isVisibleToAll: false,
    advancedAction: (ctx) => {
      const names = NibroTokenUtils.setSelected(ctx, {
        //Name
        name: { attribute_name: "character_name" },
        showname: { value: true },
        showplayers_name: { value: true },
        playersedit_name: { value: true },
        //Bars
        bar_location: { value: "overlap_top" },
        bar1_value: { attribute_name: "hit_points" },
        bar1_max: { attribute_name: "hit_points|max" },
        showplayers_bar1: { value: true },
        playersedit_bar1: { value: true },
        bar2_value: {
          attribute_name: "perception",
          attribute_mod: (x) => parseInt(x) + 10,
        },
        showplayers_bar2: { value: false },
        playersedit_bar2: { value: false },
        bar3_value: { attribute_name: "armor_class" },
        showplayers_bar3: { value: false },
        playersedit_bar3: { value: false },

        //Aura
        showplayers_aura1: { value: false },
        playersedit_aura1: { value: false },
        showplayers_aura2: { value: true },
        playersedit_aura2: { value: false },
        aura2_color: { value: "#ffff00" },

        //Vision
        has_bright_light_vision: { value: false },
        has_night_vision: { value: false },
        //Light
        emits_bright_light: { value: false },
        bright_light_distance: { value: 20 },
        emits_low_light: { value: false },
        low_light_distance: { value: 40 },
      });
      NibroCore.whisperReply(ctx, "NPC Tokens Configured: " + names.join(", "));
    },
  });

  NibroCore.registerMacro({
    name: "ToggleTorch",
    isTokenAction: true,
    isVisibleToAll: true,
    advancedAction: (ctx) => {
      NibroTokenUtils.setSelected(ctx, {
        //Toggle Lights
        emits_bright_light: { mod: (_, __, ___, current) => !current },
        emits_low_light: { mod: (_, __, ___, current) => !current },
        //Set light distance
        bright_light_distance: { value: 20 },
        low_light_distance: { value: 40 },
        //Set aura visibility and color
        showplayers_aura2: { value: true },
        aura2_color: { value: "#ffff00" },
        //Toggle Aura
        aura2_radius: {
          mod: (_, __, ___, current) => (current == 0.5 ? "" : 0.5),
        },
      });
    },
  });

  NibroCore.registerMacro({
    name: "Saves",
    isTokenAction: true,
    isVisibleToAll: false,
    advancedArgs: ["?{Saves|DCs|Fortitude|Reflex|Will}"],
    advancedAction: (ctx, args) => {
      const characters = getSelectedCharacters(ctx);
      switch (args[0]) {
        case "Perception": {
          NibroCore.reply(
            ctx,
            `
                              &{template:rolls}
                              {{header=^{perception}}}
                              ${characters
                                .map(
                                  (char, i) => `
                                          {{roll0${i + 1}_name=${char.get(
                                            "name",
                                          )}}}
                                          {{roll0${i + 1}=[[1d20 + @{${char.get(
                                            "name",
                                          )}|perception}]]}}
                                          {{roll0${i + 1}_type=perception}}
                                      `,
                                )
                                .join()}
                          `.replace(/\s{2,}/g, " "),
            `player|${ctx?.msg.playerid}`,
          );
          break;
        }
        case "Fortitude": {
          NibroCore.reply(
            ctx,
            `
                              &{template:rolls}
                              {{header=Fortitude}}
                              {{subheader=^{saving_throw}}}
                              ${characters
                                .map(
                                  (char, i) => `
                                          {{roll0${i + 1}_name=${char.get(
                                            "name",
                                          )}}}
                                          {{roll0${i + 1}=[[1d20 + @{${char.get(
                                            "name",
                                          )}|saving_throws_fortitude}]]}}
                                          {{roll0${i + 1}_type=saving-throw}}
                                      `,
                                )
                                .join()}
                          `.replace(/\s{2,}/g, " "),
            `player|${ctx?.msg.playerid}`,
          );
          break;
        }
        case "Reflex": {
          NibroCore.reply(
            ctx,
            `
                              &{template:rolls}
                              {{header=Reflex}}
                              {{subheader=^{saving_throw}}}
                              ${characters
                                .map(
                                  (char, i) => `
                                          {{roll0${i + 1}_name=${char.get(
                                            "name",
                                          )}}}
                                          {{roll0${i + 1}=[[1d20 + @{${char.get(
                                            "name",
                                          )}|saving_throws_reflex}]]}} (DC)
                                          {{roll0${i + 1}_type=saving-throw}}
                                      `,
                                )
                                .join()}
                              `.replace(/\s{2,}/g, " "),
            `player|${ctx?.msg.playerid}`,
          );
          break;
        }
        case "Will": {
          NibroCore.reply(
            ctx,
            `
                              &{template:rolls}
                              {{header=Will}}
                              {{subheader=^{saving_throw}}}
                              ${characters
                                .map(
                                  (char, i) => `
                                          {{roll0${i + 1}_name=${char.get(
                                            "name",
                                          )}}}
                                          {{roll0${i + 1}=[[1d20 + @{${char.get(
                                            "name",
                                          )}|saving_throws_will}]]}}
                                          {{roll0${i + 1}_type=saving-throw}}
                                      `,
                                )
                                .join()}
                          `.replace(/\s{2,}/g, " "),
            `player|${ctx?.msg.playerid}`,
          );
          break;
        }
        default: {
          NibroCore.whisperReply(
            ctx,
            characters
              .map((char) =>
                `
                                  &{template:rolls}
                                  {{charactername=${char.get("name")}}}
                                  {{header=Saves and DCs}}
                                  {{roll01_name=Perception}}
                                  {{roll01=[Roll](~${char.get(
                                    "name",
                                  )}|PERCEPTION) DC [[10+@{${char.get(
                                    "name",
                                  )}|perception}]]}}
                                  {{roll02_name=Fortitude}}
                                  {{roll02=[Roll](~${char.get(
                                    "name",
                                  )}|FORT) DC [[10+@{${char.get(
                                    "name",
                                  )}|saving_throws_fortitude}]]}}
                                  {{roll03_name=Reflex}}
                                  {{roll03=[Roll](~${char.get(
                                    "name",
                                  )}|REF) DC [[10+@{${char.get(
                                    "name",
                                  )}|saving_throws_reflex}]]}}
                                  {{roll04_name=Will}}
                                  {{roll04=[Roll](~${char.get(
                                    "name",
                                  )}|WILL) DC [[10+@{${char.get(
                                    "name",
                                  )}|saving_throws_will}]]}}
                              `.replace(/\s{2,}/g, " "),
              )
              .join("\n"),
          );
          break;
        }
      }
    },
  });

  NibroCore.registerMacro({
    name: "Skills",
    isTokenAction: true,
    isVisibleToAll: false,
    advancedArgs: [
      "?{Skill|Perception|Acrobatics|Arcana|Athletics|Crafting|Deception|Diplomacy|Intimidation|Medicine|Nature|Occultism|Performance|Religion|Society|Stealth|Survival|Thievery}",
    ],
    advancedAction: (ctx, args) => {
      const characters = getSelectedCharacters(ctx);
      NibroCore.reply(
        ctx,
        `
                      &{template:rolls}
                      {{header=^{${args[0].toLowerCase()}}}}
                      {{subheader=^{skill}}}
                      ${characters
                        .map(
                          (char, i) => `
                                  {{roll0${i + 1}_name=${char.get("name")}}}
                                  {{roll0${i + 1}=[[1d20 + @{${char.get(
                                    "name",
                                  )}|${args[0].toLowerCase()}}]]}}
                                  {{roll0${i + 1}_type=${
                                    args[0] == "Perception"
                                      ? "perception"
                                      : "skill"
                                  }}}
                              `,
                        )
                        .join()}
                  `.replace(/\s{2,}/g, " "),
        `player|${ctx?.msg.playerid}`,
      );
    },
  });

  NibroCore.registerMacro({
    name: "QuickRoll",
    action: () => {
      return "&{template:rolls} {{charactername=@{selected|character_name}}} {{header=Quick Roll}} {{roll01=[[1d20+?{Modifier}]]}}";
    },
    isVisibleToAll: false,
    isTokenAction: true,
  });

  NibroCore.registerMacro({
    name: "Condition",
    action: () => {
      const markers: TokenMarker[] = JSON.parse(
        Campaign().get("token_markers"),
      );
      const markerChoices: string = markers
        .filter((marker) =>
          marker.name.startsWith(TOKEN_MARKER_CONDITION_PREFIX),
        )
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

  on("change:graphic:statusmarkers", (obj: Graphic) => {
    setConditionsTooltip(obj);
    dealConditionCards(obj);
  });
}
export default NibroPF2E;
