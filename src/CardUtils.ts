import NibroCore from "./NibroCore";
import NibroUtils from "./NibroUtils";

namespace NibroCardUtils {
  export function DealCard(
    ctx: NibroCore.Context,
    args: {
      cardid?: string;
      deckname?: string;
      cardname?: string;
      playername?: string;
      playerid?: string;
    },
  ) {
    if (!args) {
      return;
    }
    if (!(args.cardid || (args.deckname && args.cardname))) {
      if (ctx)
        NibroUtils.Chat.whisperReply(
          ctx,
          "Argument 'cardId' or 'deckName' and 'cardName' required",
        );
      return;
    }

    let cardId: string | undefined = args.cardid;
    const deckName: string | undefined = args.deckname;
    const cardName: string | undefined = args.cardname;
    let playerId: string =
      (args.playerid ? args.playerid : ctx?.msg?.playerid) || "";

    // Get playerId by name
    if (args.playername) {
      const player = findObjs(
        {
          _type: "player",
          _displayname: args.playername,
        },
        { caseInsensitive: true },
      )?.[0] as Player;
      if (player) {
        playerId = player.get("_id");
      }
    }

    // Set cardId based on cardName and deckName
    if (!cardId && deckName && cardName) {
      cardId = GetCardIdByName(deckName, cardName);
      if (!cardId) {
        if (ctx) NibroUtils.Chat.whisperReply(ctx, "Card not found");
        return;
      }
    }

    // Check if card already held
    for (const hand of findObjs({ _type: "hand", _parentid: playerId })) {
      const cards: string = hand.get("currentHand");
      if (cards.split(",").find((card) => card === cardId)) {
        if (ctx) NibroUtils.Chat.whisperReply(ctx, "Card already held");
        return;
      }
    }

    if (!cardId) {
      if (ctx) NibroUtils.Chat.whisperReply(ctx, "Card not found");
      return;
    }

    giveCardToPlayer(cardId, playerId);
    if (ctx) NibroUtils.Chat.whisperReply(ctx, "Card granted");
  }

  export function SafetyCard(
    ctx: NibroCore.Context,
    args: {
      cardid?: string;
    },
  ) {
    findObjs({ _type: "player" }).forEach((player: Player) => {
      DealCard(ctx, {
        cardid: args.cardid ?? "",
        playerid: player.id,
      });
    });
    sendChat(
      "NibroCore",
      `A safety card has been played anonymously`,
      undefined,
      {
        noarchive: true,
      },
    );
  }

  export function CreateDealCardMacros() {
    findObjs(
      {
        _type: "deck",
      },
      { caseInsensitive: true },
    ).forEach((deck: Deck) => {
      const cards: Card[] = (
        findObjs({
          _type: "card",
          _deckid: deck.id,
        }) as Card[]
      ).sort((a, b) => {
        return a
          .get("name")
          ?.toUpperCase()
          ?.localeCompare(b.get("name")?.toLocaleUpperCase());
      });
      const cardMacro: string = `?{Card|${cards
        .map((card) => `${card.get("name")},${card.id}`)
        .join("|")}}`;
      if (deck.get("name") == "Safety Deck") {
        NibroCore.registerMacro({
          name: "SafetyCard",
          action: () => `!SafetyCard --cardid ${cardMacro}`,
          isVisibleToAll: true,
          isTokenAction: false,
        });
        return;
      }
      const macroName = `Deal_${deck.get("name").replace(" ", "-")}`;
      NibroCore.registerMacro({
        name: macroName,
        action: () =>
          `!DealCard --playerid ${getPlayerListMacro()} --cardid ${cardMacro}`,
        isVisibleToAll: false,
        isTokenAction: false,
      });
    });
  }

  export function DiscardCard(
    ctx: NibroCore.Context,
    args: {
      playerid?: string;
      cardid?: string;
    },
  ) {
    if (args?.cardid) {
      const playerId: string =
        (args?.playerid ? args.playerid : ctx?.msg?.playerid) || "";
      const success = takeCardFromPlayer(playerId, { cardid: args.cardid });
      if (success) {
        if (ctx) NibroUtils.Chat.whisperReply(ctx, "Card discarded");
      } else {
        if (ctx)
          NibroUtils.Chat.whisperReply(ctx, "Card was unable to be discarded");
      }
      return;
    }
    if (ctx)
      NibroUtils.Chat.whisperReply(
        ctx,
        `&{template:default} {{name=Discard Cards}} ${findObjs({
          _type: "player",
        })
          .map((player: Player): string => {
            const playerId = player.get("_id");
            const playerName = player.get("_displayname");
            const discardCardButtons = findObjs({
              _type: "hand",
              _parentid: playerId,
            })
              .map((hand: Hand): string => {
                const cards: Card[] = (hand.get("currentHand") as string)
                  .split(",")
                  .filter((id) => id !== "")
                  .map((id) => {
                    return getObj("card", id);
                  })
                  .sort((a, b) => {
                    return a
                      .get("name")
                      ?.toUpperCase()
                      ?.localeCompare(b.get("name")?.toLocaleUpperCase());
                  });
                return cards
                  .map((card) => {
                    return `[Discard: ${card.get(
                      "name",
                    )}](!DiscardCard --playerid ${playerId} --cardid ${
                      card.id
                    })`;
                  })
                  .join(" ");
              })
              .join(" ");
            NibroUtils.Chat.whisperReply(ctx, discardCardButtons);
            return `{{${playerName}=${discardCardButtons}}}`;
          })
          .filter((str) => !str.endsWith("=}}"))
          .join(" ")}`,
      );
  }

  export function getPlayerListMacro(): string {
    const players: Player[] = findObjs({
      _type: "player",
    });
    if (players.length === 1) {
      return players[0].id;
    }
    return `?{Player|${players
      .map((player) => `${player.get("_displayname")},${player.id}`)
      .join("|")}}`;
  }

  export function GetCardIdByName(deckName: string, cardName: string): string {
    const deck: Deck = findObjs(
      {
        _type: "deck",
        name: deckName,
      },
      { caseInsensitive: true },
    )?.[0];
    if (!deck) {
      log("Nibrocore - error finding deck: " + deckName);
      return "";
    }
    const card: Card = findObjs(
      {
        _type: "card",
        name: cardName,
        _deckid: deck.id,
      },
      { caseInsensitive: true },
    )?.[0];
    if (!card) {
      log("Nibrocore - error finding card: " + cardName);
      return "";
    }
    return card.id;
  }

  export function SortDeck(ctx: NibroCore.Context, args: { deck?: string }) {
    if (!args.deck) {
      NibroUtils.Chat.whisperReply(ctx, "Argument 'deck' required");
      return;
    }
    const deck: Deck = findObjs(
      {
        _type: "deck",
        name: args.deck,
      },
      { caseInsensitive: true },
    )?.[0];
    if (!deck) {
      NibroUtils.Chat.whisperReply(ctx, "Deck not found");
      return;
    }
    const cards: Card[] = (deck.get("_currentDeck") as string)
      .split(",")
      .filter((id) => id !== "")
      .map((id) => {
        return getObj("card", id);
      })
      .sort((a, b) => {
        return a
          .get("name")
          ?.toUpperCase()
          ?.localeCompare(b.get("name")?.toLocaleUpperCase());
      });
    shuffleDeck(
      deck.get("_id"),
      true,
      cards.map((card) => card.get("_id")),
    );
    NibroUtils.Chat.whisperReply(ctx, "Deck sorted");
  }

  export function PruneCards(
    playerId: string,
    deckName: string,
    cardNames: string[],
  ) {
    //Get Deck ID
    const deck: Deck = findObjs(
      {
        _type: "deck",
        name: deckName,
      },
      { caseInsensitive: true },
    )?.[0];
    if (!deck) {
      log("Nibrocore - Deck not found: " + deckName);
      return;
    }

    for (const hand of findObjs({ _type: "hand", _parentid: playerId })) {
      const cards: Card[] = hand
        .get("currentHand")
        .split(",")
        .map((cardId: string): Card => getObj("card", cardId))
        .filter((card: Card) => !!card && card.get("_deckid") === deck.id);
      for (const card of cards) {
        if (!cardNames.includes(card.get("name"))) {
          DiscardCard(undefined, {
            playerid: playerId,
            cardid: card.id,
          });
        }
      }
      for (const cardName of cardNames) {
        DealCard(undefined, {
          playerid: playerId,
          deckname: deckName,
          cardname: cardName,
        });
      }
    }
  }

  NibroCore.registerChatCommand({
    primaryName: "SortDeck",
    run: SortDeck,
    args: {
      deck: { required: true },
    },
    aliases: [],
    helpText: "Sorts the selected deck alphabetically",
  });
  NibroCore.registerChatCommand({
    primaryName: "DealCard",
    run: DealCard,
    args: {
      cardid: { required: false },
      deckname: { required: false },
      cardname: { required: false },
      playername: { required: false },
      playerid: { required: false },
    },
    aliases: [],
    helpText:
      "Deals the selected card from the selected deck to the selected player",
  });
  NibroCore.registerChatCommand({
    primaryName: "SafetyCard",
    run: SafetyCard,
    args: {
      cardid: { required: true },
    },
    aliases: [],
    helpText:
      "Deals the selected safety card to all players and announces that a card has been played",
    auth: () => true,
  });
  NibroCore.registerChatCommand({
    primaryName: "DiscardCard",
    run: DiscardCard,
    args: {
      playername: { required: false },
      playerid: { required: false },
    },
    aliases: [],
    helpText: "Removes a card from a players hand",
  });
  NibroCore.registerMacro({
    name: "DiscardCard",
    action: () => `!DiscardCard`,
    isVisibleToAll: false,
    isTokenAction: false,
  });
  NibroCore.registerMacro({
    name: "SortDeck",
    action: () => {
      const decks = findObjs({ _type: "deck" })
        .map((deck: Deck) => deck.get("name"))
        .sort()
        .join("|");
      return `!SortDeck --deck ?{Deck|${decks}}`;
    },
    isTokenAction: false,
    isVisibleToAll: false,
  });
  NibroCore.registerSetupHook(() => {
    CreateDealCardMacros();
  });
}
export default NibroCardUtils;
