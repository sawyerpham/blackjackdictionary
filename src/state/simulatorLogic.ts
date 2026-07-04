import {
  cardsLeft,
  freshShoe,
  rankIndex,
  RANKS,
  type Rank,
  type Rules,
  type Shoe,
} from '../engine/blackjack-engine';

export const DEFAULT_BALANCE = 250_000;
export const BET_STEP = 1_000;
export const MIN_BET = 100;

export const PENETRATION_OPTIONS = [
  { label: '1/4', value: 0.25 },
  { label: '1/2', value: 0.5 },
  { label: '3/4', value: 0.75 },
];

export type HandOutcome = 'win' | 'lose' | 'push' | 'blackjack' | 'surrender';

export interface HandState {
  cards: Rank[];
  bet: number;
  isSplitAces: boolean;
  splitsSoFar: number;
  done: boolean;
  outcome?: HandOutcome;
}

export type Phase = 'betting' | 'player-turn' | 'round-over';

export interface SimState {
  balance: number;
  defaultBalance: number;
  currentBet: number;
  decks: number;
  penetrationIdx: number;
  shoe: Shoe;
  dealerCards: Rank[];
  dealerHoleHidden: boolean;
  hands: HandState[];
  activeHandIdx: number;
  phase: Phase;
  message: string;
}

export function initialSimState(decks: number, balance: number, defaultBalance: number): SimState {
  return {
    balance,
    defaultBalance,
    currentBet: Math.max(MIN_BET, BET_STEP),
    decks,
    penetrationIdx: 1,
    shoe: freshShoe(decks),
    dealerCards: [],
    dealerHoleHidden: false,
    hands: [],
    activeHandIdx: 0,
    phase: 'betting',
    message: '',
  };
}

export type SimAction =
  | { type: 'DEAL'; rules: Rules }
  | { type: 'HIT'; rules: Rules }
  | { type: 'STAND'; rules: Rules }
  | { type: 'DOUBLE'; rules: Rules }
  | { type: 'SPLIT'; rules: Rules }
  | { type: 'SURRENDER'; rules: Rules }
  | { type: 'ADJUST_BET'; delta: number }
  | { type: 'SET_BET'; value: number }
  | { type: 'SET_BALANCE'; value: number }
  | { type: 'RESET_BALANCE' }
  | { type: 'CYCLE_PENETRATION' }
  | { type: 'FORCE_SHUFFLE' }
  | { type: 'SET_DECKS'; decks: number };

function drawCard(shoe: Shoe): [Rank, Shoe] {
  const total = cardsLeft(shoe);
  let r = Math.random() * total;
  for (let i = 0; i < 10; i++) {
    if (shoe[i] <= 0) continue;
    if (r < shoe[i]) {
      const next = shoe.slice();
      next[i] -= 1;
      return [RANKS[i], next];
    }
    r -= shoe[i];
  }
  const i = shoe.findIndex((c) => c > 0);
  const next = shoe.slice();
  next[i] -= 1;
  return [RANKS[i], next];
}

export function handTotal(cards: Rank[]): { total: number; soft: boolean } {
  let t = 0;
  let aces = 0;
  for (const c of cards) {
    const i = rankIndex(c);
    t += i === 0 ? 1 : i === 9 ? 10 : i + 1;
    if (i === 0) aces += 1;
  }
  const soft = aces > 0 && t + 10 <= 21;
  return { total: soft ? t + 10 : t, soft };
}

function isBlackjackHand(cards: Rank[]): boolean {
  return cards.length === 2 && handTotal(cards).total === 21;
}

/**
 * The shoe as the PLAYER can see it: every dealt card is removed except the
 * dealer's hidden hole card, which stays uncertain from their perspective —
 * matching how evaluate()'s dealerDist treats the hole card as an unknown
 * draw from the shoe, not a known-removed one.
 */
export function visibleShoe(state: SimState): Shoe {
  if (!state.dealerHoleHidden || state.dealerCards.length < 2) return state.shoe;
  const shoe = state.shoe.slice();
  shoe[rankIndex(state.dealerCards[1])] += 1;
  return shoe;
}

function advanceIfNeeded(state: SimState, rules: Rules): SimState {
  const hand = state.hands[state.activeHandIdx];
  if (hand && !hand.done) return state;
  const nextIdx = state.hands.findIndex((h, i) => i > state.activeHandIdx && !h.done);
  if (nextIdx !== -1) return { ...state, activeHandIdx: nextIdx };
  return playDealerAndSettle(state, rules);
}

function playDealerAndSettle(state: SimState, rules: Rules): SimState {
  let shoe = state.shoe;
  let dealerCards = state.dealerCards;
  const anyLive = state.hands.some((h) => h.outcome !== 'lose' && h.outcome !== 'surrender');

  if (anyLive) {
    let { total, soft } = handTotal(dealerCards);
    while (total < 17 || (total === 17 && soft && rules.hitSoft17)) {
      const [card, nextShoe] = drawCard(shoe);
      shoe = nextShoe;
      dealerCards = [...dealerCards, card];
      ({ total, soft } = handTotal(dealerCards));
    }
  }

  const { total: dealerTotal } = handTotal(dealerCards);
  const dealerBust = dealerTotal > 21;

  let balance = state.balance;
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  const hands = state.hands.map((h) => {
    if (h.outcome === 'surrender') {
      balance += h.bet * 0.5;
      return h;
    }
    if (h.outcome === 'lose') {
      losses += 1;
      return h;
    }
    const { total: pt } = handTotal(h.cards);
    let outcome: HandOutcome;
    if (dealerBust || pt > dealerTotal) {
      outcome = 'win';
      balance += h.bet * 2;
      wins += 1;
    } else if (pt === dealerTotal) {
      outcome = 'push';
      balance += h.bet;
      pushes += 1;
    } else {
      outcome = 'lose';
      losses += 1;
    }
    return { ...h, outcome, done: true };
  });

  const parts: string[] = [];
  if (dealerBust) parts.push('Dealer busts.');
  if (wins) parts.push(`Win x${wins}`);
  if (losses) parts.push(`Loss x${losses}`);
  if (pushes) parts.push(`Push x${pushes}`);

  return {
    ...state,
    shoe,
    dealerCards,
    dealerHoleHidden: false,
    hands,
    balance,
    phase: 'round-over',
    message: parts.join(' '),
  };
}

export function simulatorReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'DEAL': {
      if (state.phase === 'player-turn') return state;
      if (state.balance < state.currentBet) return state;

      const fullSize = cardsLeft(freshShoe(state.decks));
      const penetration = PENETRATION_OPTIONS[state.penetrationIdx].value;
      let shoe = state.shoe;
      if (cardsLeft(shoe) <= fullSize * (1 - penetration) || cardsLeft(shoe) < 15) {
        shoe = freshShoe(state.decks);
      }

      let p1: Rank, p2: Rank, d1: Rank, d2: Rank;
      [p1, shoe] = drawCard(shoe);
      [d1, shoe] = drawCard(shoe);
      [p2, shoe] = drawCard(shoe);
      [d2, shoe] = drawCard(shoe);

      const bet = state.currentBet;
      const playerCards: Rank[] = [p1, p2];
      const dealerCards: Rank[] = [d1, d2];
      const playerBJ = isBlackjackHand(playerCards);
      const dealerBJ = isBlackjackHand(dealerCards);

      let balance = state.balance - bet;
      let hand: HandState = {
        cards: playerCards,
        bet,
        isSplitAces: false,
        splitsSoFar: 0,
        done: true,
      };
      let phase: Phase = 'round-over';
      let message = '';
      let dealerHoleHidden = false;

      if (playerBJ || dealerBJ) {
        if (playerBJ && dealerBJ) {
          hand = { ...hand, outcome: 'push' };
          balance += bet;
          message = 'Push — both have blackjack.';
        } else if (playerBJ) {
          const winnings = bet * action.rules.blackjackPays;
          hand = { ...hand, outcome: 'blackjack' };
          balance += bet + winnings;
          message = `Blackjack! You win $${winnings.toLocaleString()}.`;
        } else {
          hand = { ...hand, outcome: 'lose' };
          message = 'Dealer has blackjack.';
        }
      } else {
        hand = { ...hand, done: false };
        phase = 'player-turn';
        dealerHoleHidden = true;
      }

      return {
        ...state,
        shoe,
        balance,
        dealerCards,
        dealerHoleHidden,
        hands: [hand],
        activeHandIdx: 0,
        phase,
        message,
      };
    }

    case 'HIT': {
      if (state.phase !== 'player-turn') return state;
      const hand = state.hands[state.activeHandIdx];
      if (!hand || hand.done) return state;
      const [card, shoe] = drawCard(state.shoe);
      const newCards = [...hand.cards, card];
      const { total } = handTotal(newCards);
      const busted = total > 21;
      const newHand: HandState = {
        ...hand,
        cards: newCards,
        done: busted,
        outcome: busted ? 'lose' : undefined,
      };
      const hands = state.hands.map((h, i) => (i === state.activeHandIdx ? newHand : h));
      return advanceIfNeeded({ ...state, hands, shoe }, action.rules);
    }

    case 'STAND': {
      if (state.phase !== 'player-turn') return state;
      const hand = state.hands[state.activeHandIdx];
      if (!hand || hand.done) return state;
      const newHand: HandState = { ...hand, done: true };
      const hands = state.hands.map((h, i) => (i === state.activeHandIdx ? newHand : h));
      return advanceIfNeeded({ ...state, hands }, action.rules);
    }

    case 'DOUBLE': {
      if (state.phase !== 'player-turn') return state;
      const hand = state.hands[state.activeHandIdx];
      if (!hand || hand.done || hand.cards.length !== 2) return state;
      if (state.balance < hand.bet) return state;
      const [card, shoe] = drawCard(state.shoe);
      const newCards = [...hand.cards, card];
      const { total } = handTotal(newCards);
      const busted = total > 21;
      const newHand: HandState = {
        ...hand,
        cards: newCards,
        bet: hand.bet * 2,
        done: true,
        outcome: busted ? 'lose' : undefined,
      };
      const hands = state.hands.map((h, i) => (i === state.activeHandIdx ? newHand : h));
      const balance = state.balance - hand.bet;
      return advanceIfNeeded({ ...state, hands, shoe, balance }, action.rules);
    }

    case 'SPLIT': {
      if (state.phase !== 'player-turn') return state;
      const hand = state.hands[state.activeHandIdx];
      if (!hand || hand.done || hand.cards.length !== 2) return state;
      const pairIdx = rankIndex(hand.cards[0]);
      if (pairIdx !== rankIndex(hand.cards[1])) return state;
      if (hand.splitsSoFar >= action.rules.maxSplits) return state;
      if (hand.isSplitAces && !action.rules.allowResplitAces) return state;
      if (state.balance < hand.bet) return state;

      let shoe = state.shoe;
      let card1: Rank, card2: Rank;
      [card1, shoe] = drawCard(shoe);
      [card2, shoe] = drawCard(shoe);

      const isAces = pairIdx === 0;
      const forcedStand = isAces && !action.rules.allowDrawAfterSplitAces;

      const hand1: HandState = {
        cards: [hand.cards[0], card1],
        bet: hand.bet,
        isSplitAces: isAces,
        splitsSoFar: hand.splitsSoFar + 1,
        done: forcedStand,
      };
      const hand2: HandState = {
        cards: [hand.cards[1], card2],
        bet: hand.bet,
        isSplitAces: isAces,
        splitsSoFar: hand.splitsSoFar + 1,
        done: forcedStand,
      };

      const hands = [
        ...state.hands.slice(0, state.activeHandIdx),
        hand1,
        hand2,
        ...state.hands.slice(state.activeHandIdx + 1),
      ];
      const balance = state.balance - hand.bet;
      return advanceIfNeeded({ ...state, hands, shoe, balance }, action.rules);
    }

    case 'SURRENDER': {
      if (state.phase !== 'player-turn') return state;
      const hand = state.hands[state.activeHandIdx];
      if (!hand || hand.done || hand.cards.length !== 2) return state;
      const newHand: HandState = { ...hand, done: true, outcome: 'surrender' };
      const hands = state.hands.map((h, i) => (i === state.activeHandIdx ? newHand : h));
      return advanceIfNeeded({ ...state, hands }, action.rules);
    }

    case 'ADJUST_BET': {
      if (state.phase === 'player-turn') return state;
      const next = Math.min(state.balance, Math.max(MIN_BET, state.currentBet + action.delta));
      return { ...state, currentBet: next };
    }

    case 'SET_BET': {
      if (state.phase === 'player-turn') return state;
      const next = Math.min(state.balance, Math.max(MIN_BET, Math.round(action.value)));
      return { ...state, currentBet: next };
    }

    case 'RESET_BALANCE':
      if (state.phase === 'player-turn') return state;
      return { ...state, balance: state.defaultBalance };

    case 'SET_BALANCE': {
      if (state.phase === 'player-turn') return state;
      const value = Math.max(0, Math.round(action.value));
      return { ...state, balance: value, defaultBalance: value };
    }

    case 'CYCLE_PENETRATION':
      if (state.phase === 'player-turn') return state;
      return { ...state, penetrationIdx: (state.penetrationIdx + 1) % PENETRATION_OPTIONS.length };

    case 'FORCE_SHUFFLE':
      if (state.phase === 'player-turn') return state;
      return { ...state, shoe: freshShoe(state.decks) };

    case 'SET_DECKS':
      if (state.phase === 'player-turn') return state;
      return { ...state, decks: action.decks, shoe: freshShoe(action.decks) };

    default:
      return state;
  }
}
