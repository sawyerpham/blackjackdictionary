// ============================================================================
// blackjack-engine.ts
//
// Shared types and cheap helpers. The EV math itself lives in the Python
// backend (backend/engine.py), served at POST /api/evaluate.
// ============================================================================

// Ranks collapse to 10 value-buckets. Suit is irrelevant to EV, so it's gone.
// Index 0 = Ace, 1..8 = 2..9, 9 = ten-value (10/J/Q/K).
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

/** Remaining-card composition: counts[i] = cards of RANKS[i] left in the shoe. */
export type Shoe = number[]; // length 10

export type Action = 'stand' | 'hit' | 'double' | 'split' | 'surrender';

export type DoubleDownRestriction =
  | 'any' // double on any two cards
  | 'hard9to11' // hard 9, 10, or 11 only
  | 'hard10or11' // hard 10 or 11 only
  | 'hard9to11AndSoft'; // hard 9-11, plus all soft hands

export interface Rules {
  decks: number;
  hitSoft17: boolean; // dealer hits soft 17 (H17) vs stands (S17)
  doubleAfterSplit: boolean;
  lateSurrender: boolean;
  blackjackPays: number; // 1.5 = 3:2, 1.2 = 6:5
  dealerPeeks: boolean; // dealer checks hole card for BJ before further action
  allowDoubleDown: boolean;
  doubleDownRestriction: DoubleDownRestriction;
  maxSplits: number; // total splits allowed; hands = maxSplits + 1
  allowResplitAces: boolean;
  allowDrawAfterSplitAces: boolean; // false = split aces get exactly one card
}

export const VEGAS_6DECK: Rules = {
  decks: 6,
  hitSoft17: true,
  doubleAfterSplit: true,
  lateSurrender: true,
  blackjackPays: 1.5,
  dealerPeeks: true,
  allowDoubleDown: true,
  doubleDownRestriction: 'any',
  maxSplits: 3,
  allowResplitAces: false,
  allowDrawAfterSplitAces: false,
};

export interface Evaluation {
  best: Action;
  ev: Partial<Record<Action, number>>; // EV in units of the base bet; undefined = N/A
  isBlackjack: boolean;
}

// ---------------------------------------------------------------------------
// Shoe helpers (used by the callers to build/mutate composition)
// ---------------------------------------------------------------------------

export function freshShoe(decks: number): Shoe {
  const s = new Array(10).fill(4 * decks); // 4 of each rank per deck...
  s[9] = 16 * decks; // ...but 16 ten-value cards per deck.
  return s;
}

export const rankIndex = (r: Rank): number => RANKS.indexOf(r);
export const cardsLeft = (shoe: Shoe): number => shoe.reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------------------
// Hand value. State is (t, aces): t counts every ace as 1; a soft hand upgrades
// one ace to 11 when it fits. bust iff t > 21 (the +10 upgrade only ever applies
// when it keeps us <= 21).
// ---------------------------------------------------------------------------

interface Hand { t: number; aces: number; }

const rankValue = (i: number): number => (i === 0 ? 1 : i === 9 ? 10 : i + 1);

function handOf(cards: Rank[]): Hand {
  let t = 0, aces = 0;
  for (const c of cards) {
    const i = rankIndex(c);
    t += rankValue(i);
    if (i === 0) aces += 1;
  }
  return { t, aces };
}

const bestTotal = (h: Hand): number =>
  h.aces > 0 && h.t + 10 <= 21 ? h.t + 10 : h.t;
const isSoft = (h: Hand): boolean => h.aces > 0 && h.t + 10 <= 21;

function isDoubleAllowed(h: Hand, restriction: DoubleDownRestriction): boolean {
  const total = bestTotal(h);
  const soft = isSoft(h);
  switch (restriction) {
    case 'any':
      return true;
    case 'hard9to11':
      return !soft && total >= 9 && total <= 11;
    case 'hard10or11':
      return !soft && total >= 10 && total <= 11;
    case 'hard9to11AndSoft':
      return soft || (total >= 9 && total <= 11);
  }
}

/**
 * The actions the backend's evaluate() would price for this hand, without any
 * EV math. Mirrors backend/engine.py's legality gates exactly so the UI can
 * render action buttons before the (slow) EV request returns.
 */
export function availableActions(
  player: Rank[],
  rules: Rules = VEGAS_6DECK,
  splitsAlreadyTaken: number = 0,
): Action[] {
  const h = handOf(player);
  const isTwoCard = player.length === 2;
  const isPair = isTwoCard && rankIndex(player[0]) === rankIndex(player[1]);
  const actions: Action[] = ['stand', 'hit'];
  if (isTwoCard && rules.allowDoubleDown && isDoubleAllowed(h, rules.doubleDownRestriction)) {
    actions.push('double');
  }
  if (isPair && splitsAlreadyTaken < rules.maxSplits) actions.push('split');
  if (isTwoCard && rules.lateSurrender) actions.push('surrender');
  return actions;
}
