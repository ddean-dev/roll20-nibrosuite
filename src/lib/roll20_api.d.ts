declare type Roll20TypeName =
  | CreatableRoll20TypeName
  | "player"
  | "page"
  | "deck"
  | "card"
  | "hand";

declare type Roll20Object = Player | Page | Deck | Card | Hand;

declare type CreatableRoll20TypeName =
  | "graphic"
  | "text"
  | "path"
  | "character"
  | "ability"
  | "attribute"
  | "handout"
  | "rollabletable"
  | "tableitem"
  | "macro"
  | "attribute";

declare function Campaign(): Campaign;

declare function createObj(type: CreatableRoll20TypeName, attributes: object);

declare function findObjs(
  attributes: {
    _type?: Roll20TypeName;
    _id?: string;
    [key: string]: Roll20Object;
  },
  options?: {
    caseInsensitive: boolean;
  },
): Roll20Object[];

declare function getObj(type: "deck", id: string): Deck;

declare function getObj(type: "card", id: string): Card;

declare function getObj(type: "player", id: string): Player;

declare function getObj(type: "graphic", id: string): Graphic;

declare function getObj(type: "hand", id: string): Hand;

declare function getObj(type: "macro", id: string): Macro;

declare function getObj(type: "character", id: string): Character;

declare function getObj(type: "ability", id: string): Ability;

declare function giveCardToPlayer(cardId: string, playerId: string);

declare function log(text: string);

declare function on(
  event: string,
  callback: (obj: Roll20Object, prev: Roll20Object) => void,
);

declare function playerIsGM(playerId: string): boolean;

declare function sendChat(
  speakingAs: string,
  input: string,
  callback?: () => void,
  options?: {
    noarchive?: boolean;
    use3d?: boolean;
  },
);

declare function shuffleDeck(deckid: string, deckOrder?: string[]);

declare function shuffleDeck(
  deckId: string,
  discard?: boolean,
  deckOrder?: string[],
);

declare function takeCardFromPlayer(
  playerid: string,
  options: {
    cardid?: string;
    index?: number;
    steal?: string;
  },
): string;

declare function getAttrByName(
  character_id,
  attribute_name,
  value_type?: "current" | "max",
): boolean | number | string | undefined;

declare interface Message {
  who: string;
  playerid: string;
  type:
    | "general"
    | "rollresult"
    | "gmrollresult"
    | "emote"
    | "whisper"
    | "desc"
    | "api";
  content: string;
  origRoll?: string;
  inlinerolls?: object[];
  rolltemplate?: string;
  target?: string;
  target_name?: string;
  selected?: Selected[];
}

declare interface Deck {
  id: string;
  get: (
    property:
      | "_id"
      | "_type"
      | "name"
      | "_currentDeck"
      | "_currentIndex"
      | "_currentCardShown"
      | "showplayers"
      | "playerscandraw"
      | "avatar"
      | "shown"
      | "players_seenumcards"
      | "players_seefrontofcards"
      | "gm_seenumcards"
      | "gm_seefrontofcards"
      | "infinitecards"
      | "_cardSequencer"
      | "cardsplayed"
      | "defaultheight"
      | "defaultwidth"
      | "discardpilemode"
      | "_discardPile",
  ) => boolean | number | string;
  set: (
    property:
      | "name"
      | "showplayers"
      | "playerscandraw"
      | "avatar"
      | "shown"
      | "players_seenumcards"
      | "players_seefrontofcards"
      | "gm_seenumcards"
      | "gm_seefrontofcards"
      | "infinitecards"
      | "cardsplayed"
      | "defaultheight"
      | "defaultwidth"
      | "discardpilemode",
    value: boolean | number | string,
  ) => void;
}

declare interface Card {
  id: string;
  get: (property: "name" | "avatar" | "_deckid" | "_type" | "_id") => string;
  set: (property: "name" | "avatar", value: string) => void;
}

declare interface Hand {
  id: string;
  get: (
    property: "currentHand" | "currentView" | "_parentid" | "_type" | "_id",
  ) => string;
  set: (property: "currentHand" | "currentView", value: string) => void;
}

declare interface Player {
  id: string;
  get: (
    property:
      | "_id"
      | "_type"
      | "_d20userid"
      | "_displayname"
      | "_online"
      | "_lastpage"
      | "_macrobar"
      | "speakingas"
      | "color"
      | "showmacrobar",
  ) => boolean | string;
  set: (
    property: "speakingas" | "color" | "showmacrobar",
    value: string,
  ) => void;
}

declare interface Campaign {
  id: string;
  get: (
    property:
      | "_id"
      | "_type"
      | "token_markers"
      | "turnorder"
      | "initiativepage"
      | "playerpageid"
      | "playerspecificpages"
      | "_journalfolder"
      | "_jukeboxfolder",
  ) => boolean | string;
  set: (
    property:
      | "token_markers"
      | "turnorder"
      | "initiativepage"
      | "playerpageid"
      | "playerspecificpages",
    value: boolean | string,
  ) => void;
}

declare interface TokenMarker {
  id: number;
  name: string;
  tag: string;
  url: string;
}

declare type GraphicSettableProperty =
  | "name"
  | "gmnotes"
  | "tooltip"
  //Properties
  | "imgsrc"
  | "represents"
  | "controlledby"
  | "isdrawing"
  | "flipv"
  | "fliph"
  //Positioning
  | "left"
  | "top"
  | "width"
  | "height"
  | "rotation"
  | "lastmove"
  | "layer"
  //Bars
  | "bar1_link"
  | "bar2_link"
  | "bar3_link"
  | "bar1_value"
  | "bar2_value"
  | "bar3_value"
  | "bar1_max"
  | "bar2_max"
  | "bar3_max"
  //Auras
  | "aura1_radius"
  | "aura2_radius"
  | "aura1_color"
  | "aura2_color"
  | "aura1_square"
  | "aura2_square"
  | "tint_color"
  //Markers
  | "statusmarkers"
  | "token_markers"
  //Visibility
  | "showname"
  | "show_tooltip"
  | "showplayers_name"
  | "showplayers_bar1"
  | "showplayers_bar2"
  | "showplayers_bar3"
  | "showplayers_aura1"
  | "showplayers_aura2"
  //Edit
  | "playersedit_name"
  | "playersedit_bar1"
  | "playersedit_bar2"
  | "playersedit_bar3"
  | "playersedit_aura1"
  | "playersedit_aura2"
  //Bars
  | "bar_location"
  | "compact_bar"
  //Vision
  | "has_bright_light_vision"
  | "light_sensitivity_multiplier"
  | "has_night_vision"
  | "night_vision_distance"
  | "night_vision_effect"
  //Light
  | "emits_bright_light"
  | "bright_light_distance"
  | "emits_low_light"
  | "low_light_distance";

declare interface Graphic {
  id: string;
  get: (
    property:
      | "_id"
      | "_type"
      | "_subtype"
      | "_cardid"
      | "_pageid"
      | GraphicSettableProperty,
  ) => boolean | number | string;
  set: (
    property: GraphicSettableProperty,
    value: boolean | number | string,
  ) => void;
}

declare interface Selected {
  _id: string;
  _type: "graphic" | "path" | "text";
}

declare interface Page {
  id: string;
  get: (
    property:
      | "_id"
      | "_type"
      | "_zorder"
      | "name"
      | "showgrid"
      | "showdarkness"
      | "showlighting"
      | "width"
      | "height"
      | "snapping_increment"
      | "grid_opacity"
      | "fog_opacity"
      | "background_color"
      | "gridcolor"
      | "grid_type"
      | "scale_number"
      | "scale_units"
      | "gridlabels"
      | "diagonaltype"
      | "archived"
      | "lightupdatedrop"
      | "lightenforcelos"
      | "lightrestrictmove"
      | "lightglobalillum",
  ) => boolean | number | string;
  set: (
    property:
      | "name"
      | "showgrid"
      | "showdarkness"
      | "showlighting"
      | "width"
      | "height"
      | "snapping_increment"
      | "grid_opacity"
      | "fog_opacity"
      | "background_color"
      | "gridcolor"
      | "grid_type"
      | "scale_number"
      | "scale_units"
      | "gridlabels"
      | "diagonaltype"
      | "archived"
      | "lightupdatedrop"
      | "lightenforcelos"
      | "lightrestrictmove"
      | "lightglobalillum",
    value: boolean | number | string,
  ) => void;
}

declare interface Macro {
  id: string;
  get: (
    property:
      | "_id"
      | "_type"
      | "_playerid"
      | "name"
      | "action"
      | "visibleto"
      | "istokenaction",
  ) => boolean | string;
  set: (
    property: "name" | "action" | "visibleto" | "istokenaction",
    value: boolean | string,
  ) => void;
}

declare interface Player {
  id: string;
  get: (
    property:
      | "_id"
      | "_type"
      | "_d20userid"
      | "_displayname"
      | "_online"
      | "_lastpage"
      | "_macrobar"
      | "speakingas"
      | "color"
      | "showmacrobar",
  ) => boolean | number | string;
  set: (
    property: "speakingas" | "color" | "showmacrobar",
    value: boolean | string,
  ) => void;
}

declare interface Character {
  id: string;
  get: (
    property:
      | "_id"
      | "_type"
      | "avatar"
      | "name"
      | "bio"
      | "gmnotes"
      | "archived"
      | "inplayerjournals"
      | "controlledby"
      | "_defaulttoken",
  ) => boolean | number | string;
  set: (
    property:
      | "avatar"
      | "name"
      | "bio"
      | "gmnotes"
      | "archived"
      | "inplayerjournals"
      | "controlledby",
    value: boolean | string,
  ) => void;
}

declare interface Attribute {
  id: string;
  get: (
    property: "_id" | "_type" | "_characterid" | "name" | "current" | "max",
  ) => boolean | number | string;
  set: (property: "name" | "current" | "max") => void;
}

declare interface Ability {
  id: string;
  get: (
    property:
      | "_id"
      | "_type"
      | "_characterid"
      | "name"
      | "description"
      | "action"
      | "istokenaction",
  ) => boolean | number | string;
  set: (property: "name" | "description" | "action" | "istokenaction") => void;
}
