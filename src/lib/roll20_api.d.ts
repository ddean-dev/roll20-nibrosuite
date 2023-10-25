interface Roll20Object<T> {
  id: string;
  get: getter<T, keyof T>;
  set: setter<T, keyof T>;
}

type getter<T, P extends keyof T> = (property: P) => T[P];
type setter<T, P extends keyof T> = (property: P, value: T[P]) => void;

declare type Player = Roll20Object<PlayerProperties>;
declare type Page = Roll20Object<PageProperties>;
declare type Deck = Roll20Object<DeckProperties>;
declare type Card = Roll20Object<CardProperties>;
declare type Hand = Roll20Object<HandProperties>;
declare type Graphic = Roll20Object<GraphicProperties>;
declare type Text = Roll20Object<GraphicProperties>;
declare type Path = Roll20Object<GraphicProperties>;
declare type Character = Roll20Object<CharacterProperties>;
declare type Ability = Roll20Object<AbilityProperties>;
declare type Attribute = Roll20Object<AttributeProperties>;
declare type Handout = Roll20Object<HandoutProperties>;
declare type RollableTable = Roll20Object<RollableTableProperties>;
declare type TableItem = Roll20Object<TableTtemProperties>;
declare type Macro = Roll20Object<MacroProperties>;

type Roll20Type =
  | Message
  | Player
  | Page
  | Deck
  | Card
  | Hand
  | Graphic
  | Text
  | Path
  | Character
  | Ability
  | Attribute
  | Handout
  | RollableTable
  | TableItem
  | Macro;

type Roll20GettableType = {
  readonly player: Player;
  readonly page: Page;
  readonly deck: Deck;
  readonly card: Card;
  readonly hand: Hand;
  graphic: Graphic;
  text: Graphic;
  path: Graphic;
  character: Character;
  ability: Ability;
  attribute: Attribute;
  handout: Handout;
  rollabletable: RollableTable;
  tableitem: TableItem;
  macro: Macro;
};

type Roll20CreateableType = {
  graphic: GraphicProperties;
  text: GraphicProperties;
  path: GraphicProperties;
  character: CharacterProperties;
  ability: AbilityProperties;
  attribute: AttributeProperties;
  handout: HandoutProperties;
  rollabletable: RollableTableProperties;
  tableitem: TableitemProperties;
  macro: MacroProperties;
};

declare function getObj<T extends keyof Roll20GettableType>(
  type: T,
  id: string,
): Roll20GettableType[T];

declare function findObjs<T extends keyof Roll20GettableType>(
  attributes: {
    _type: T;
    _id?: string;
    [key: string]: string;
  },
  options?: {
    caseInsensitive: boolean;
  },
): Roll20GettableType[T][];

declare function createObj<
  T extends keyof Roll20CreateableType,
  P extends keyof Roll20CreateableType[T],
>(type: T, attributes: { [key: P]: Roll20CreateableType[T][P] });

declare function Campaign(): Campaign;

declare function giveCardToPlayer(cardId: string, playerId: string);

declare function log(text: string);

declare function on(
  event: string,
  callback: (obj: Roll20Type, prev: Roll20Type) => void,
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
  character_id: string,
  attribute_name: string,
  value_type?: "current" | "max",
): string;

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
  selected?: {
    _id: string;
    _type: "graphic" | "path" | "text";
  }[];
}

declare type DeckProperties = {
  readonly _id: string;
  readonly _type: "deck";
  readonly name: string;
  readonly _currentDeck: string;
  readonly _currentIndex: string;
  readonly _currentCardShown: string;
  showplayers: boolean;
  playerscandraw: boolean;
  avatar: string;
  shown: boolean;
  players_seenumcards: boolean;
  players_seefrontofcards: boolean;
  gm_seenumcards: boolean;
  gm_seefrontofcards: boolean;
  infinitecards: boolean;
  readonly _cardSequencer: string;
  cardsplayed: number;
  defaultheight: number;
  defaultwidth: number;
  discardpilemode: string;
  readonly _discardPile: string;
};

declare type CardProperties = {
  name: string;
  avatar: string;
  readonly _deckid: string;
  readonly _type: "string";
  readonly _id: string;
};

declare type HandProperties = {
  currentHand: string;
  currentView: string;
  readonly _parentid: string;
  readonly _type: "hand";
  readonly _id: string;
};

declare type PlayerProperties = {
  readonly _id: string;
  readonly _type: "player";
  readonly _d20userid: string;
  readonly _displayname: string;
  readonly _online: boolean;
  readonly _lastpage: string;
  readonly _macrobar: string;
  speakingas: string;
  color: string;
  showmacrobar: boolean;
};

declare type CampaignProperties = {
  readonly _id: string;
  readonly _type: "Campaign";
  token_markers: string;
  turnorder: string;
  initiativepage: string;
  playerpageid: { [playerId: string]: string };
  readonly _journalfolder: string;
  readonly _jukeboxfolder: string;
};

declare type TokenMarker = {
  id: number;
  name: string;
  tag: string;
  url: string;
};

declare type GraphicProperties = {
  readonly _id: string;
  readonly _type: "graphic";
  readonly _subtype: string;
  readonly _cardid: string;
  readonly _pageid: string;
  name: string;
  gmnotes: string;
  tooltip: string;

  //Properties
  imgsrc: string;
  represents: string;
  controlledby: string;
  isdrawing: boolean;
  flipv: number;
  fliph: number;

  //Positioning
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: number;
  lastmove: unknown;
  layer: unknown;

  //Bars
  bar1_link: string;
  bar2_link: string;
  bar3_link: string;
  bar1_value: string;
  bar2_value: string;
  bar3_value: string;
  bar1_max: string;
  bar2_max: string;
  bar3_max: string;

  //Auras
  aura1_radius: number;
  aura2_radius: number;
  aura1_color: string;
  aura2_color: string;
  aura1_square: boolean;
  aura2_square: boolean;
  tint_color: string;

  //Markers
  /** @deprecated use token_markers */
  statusmarkers: string;
  token_markers: string;

  //Visibility
  showname: boolean;
  show_tooltip: boolean;
  showplayers_name: boolean;
  showplayers_bar1: boolean;
  showplayers_bar2: boolean;
  showplayers_bar3: boolean;
  showplayers_aura1: boolean;
  showplayers_aura2: boolean;

  //Edit
  playersedit_name: boolean;
  playersedit_bar1: boolean;
  playersedit_bar2: boolean;
  playersedit_bar3: boolean;
  playersedit_aura1: boolean;
  playersedit_aura2: boolean;

  //Bars
  bar_location: boolean;
  compact_bar: boolean;

  //Vision
  has_bright_light_vision: boolean;
  light_sensitivity_multiplier: number;
  has_night_vision: number;
  night_vision_distance: number;
  night_vision_effect: string;

  //Light
  emits_bright_light: boolean;
  bright_light_distance: number;
  emits_low_light: boolean;
  low_light_distance: number;
};

declare type PageProperties = {
  _id: string;
  _type: "page";
  name: string;
  snapping_increment;
  background_color;
  gridcolor: string;
  grid_type;
  scale_units: string;
  gridlabels;
  diagonaltype;
  _zorder;
  width;
  height;
  grid_opacity;
  fog_opacity;
  scale_number;
  showgrid;
  showdarkness;
  showlighting;
  lightupdatedrop;
  lightglobalillum;
  archived;
  lightrestrictmove;
  lightenforcelos;
  name;
  showgrid;
  showdarkness;
  showlighting;
  width;
  height;
  snapping_increment;
  grid_opacity;
  fog_opacity;
  background_color;
  gridcolor;
  grid_type;
  scale_number;
  scale_units;
  gridlabels;
  diagonaltype;
  archived;
  lightupdatedrop;
  lightenforcelos;
  lightrestrictmove;
  lightglobalillum;
};

declare type MacroProperties = {
  readonly _id: string;
  readonly _type: "macro";
  readonly _playerid: string;
  name: string;
  action: string;
  visibleto: string;
  istokenaction: boolean;
};

declare type PlayerProperties = {
  _id: string;
  _type: "player";
  _d20userid: string;
  _displayname: string;
  _online: boolean;
  _lastpage: string;
  _macrobar: unknown;
  speakingas: string;
  color: string;
  showmacrobar: boolean;
};

declare type CharacterProperties = {
  readonly _id: string;
  readonly _type: "character";
  avatar: string;
  name: string;
  bio: string;
  gmnotes: string;
  archived: boolean;
  inplayerjournals: string;
  controlledby: string;
  readonly _defaulttoken: unknown;
};

declare type AttributeProperties = {
  readonly _id: string;
  readonly _type: "attribute";
  readonly _characterid: string;
  name: string;
  current: string;
  max: string;
};

declare type AbilityProperties = {
  _id: string;
  _type: "ability";
  _characterid: string;
  name: string;
  description: string;
  action: string;
  istokenaction: boolean;
};
