import { rankIndex, type Rank } from '../engine/blackjack-engine';
import { HARD_TOTALS, PAIRS, SOFT_TOTALS, type ActionCode } from '../guides/BasicStrategyChart';

/**
 * NPC decision logic: a straight lookup into the published basic strategy
 * chart — the exact rows the guide renders. Deliberately no engine calls and
 * no EV math; NPCs exist only to move more cards through the shoe.
 */

export type NpcAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

export interface NpcContext {
  total: number;
  soft: boolean;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
}

/** Chart columns run 2–9, 10, A; map a dealer upcard to its column. */
function dealerColumn(up: Rank): number {
  const i = rankIndex(up);
  return i === 0 ? 9 : i - 1;
}

function keyedRows(
  rows: { hand: string; cells: ActionCode[] }[],
  keyOf: (hand: string) => number,
): Map<number, ActionCode[]> {
  const map = new Map<number, ActionCode[]>();
  for (const r of rows) map.set(keyOf(r.hand), r.cells);
  return map;
}

const HARD = keyedRows(HARD_TOTALS, (h) => parseInt(h, 10)); // '17+' → 17
const SOFT = keyedRows(SOFT_TOTALS, (h) => 11 + Number(h.split(',')[1])); // 'A,7' → soft 18
const PAIR = keyedRows(PAIRS, (h) => (h.startsWith('A') ? 0 : Number(h.split(',')[0]) - 1)); // rankIndex

export function chartDecision(cards: Rank[], dealerUp: Rank, ctx: NpcContext): NpcAction {
  const col = dealerColumn(dealerUp);
  const isPair = cards.length === 2 && rankIndex(cards[0]) === rankIndex(cards[1]);

  let code: ActionCode | undefined;
  if (isPair && ctx.canSplit) code = PAIR.get(rankIndex(cards[0]))?.[col];
  if (!code) {
    code = ctx.soft
      ? SOFT.get(ctx.total)?.[col]
      : HARD.get(Math.min(17, Math.max(8, ctx.total)))?.[col];
  }
  // Off-chart soft totals: soft 12 (ace pair that can't split) hits; 21s stand upstream.
  if (!code) return ctx.total >= 19 ? 'stand' : 'hit';

  switch (code) {
    case 'S':
      return 'stand';
    case 'H':
      return 'hit';
    case 'D':
      return ctx.canDouble ? 'double' : 'hit';
    case 'Ds':
      return ctx.canDouble ? 'double' : 'stand';
    case 'P':
      return 'split';
    case 'Rh':
      return ctx.canSurrender ? 'surrender' : 'hit';
    case 'Rp':
      return ctx.canSurrender ? 'surrender' : ctx.canSplit ? 'split' : 'hit';
  }
}
