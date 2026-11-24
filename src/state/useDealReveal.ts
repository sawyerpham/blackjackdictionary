import { useEffect, useRef, useState } from 'react';
import { firstBaseSeats, type SimState } from './simulatorLogic';

/**
 * Presentation-only dealing: the reducer resolves each action instantly, and this hook lets the
 * table catch up one card at a time in real dealing order. Every card gets a slot id and, the first
 * time it appears, a sequence number; `isShown(id)` turns true as the reveal pointer passes it.
 *
 * Slot ids: dealer `d-{i}`, hole-card flip `d-flip`, player `p{hand}-{i}`, NPC `n{seat}-{hand}-{i}`.
 *
 * Order within one state change (a deal, a hit, the end of the round):
 *   1. initial two passes: card 1 to every seat from first base, then the dealer up card;
 *      card 2 the same way, then the dealer hole card
 *   2. hits and splits, seat by seat in table order (first-base NPCs, the user, the rest)
 *   3. the hole card flips
 *   4. dealer draws
 */

const STEP_MS = 300;

function slotIds(state: SimState): string[] {
  const ids: string[] = [];
  state.dealerCards.forEach((_, i) => ids.push(`d-${i}`));
  if (state.dealerCards.length >= 2 && !state.dealerHoleHidden) ids.push('d-flip');
  state.hands.forEach((h, hi) => h.cards.forEach((_, i) => ids.push(`p${hi}-${i}`)));
  state.npcs.forEach((seat, s) => seat.forEach((h, hi) => h.cards.forEach((_, i) => ids.push(`n${s}-${hi}-${i}`))));
  return ids;
}

/** Sort key for cards that appear in the same state change (see the order above). */
function sortKey(id: string, npcCount: number): number[] {
  const k = firstBaseSeats(npcCount);
  if (id === 'd-flip') return [2];
  let m = /^d-(\d+)$/.exec(id);
  if (m) {
    const i = Number(m[1]);
    return i <= 1 ? [0, i, 999] : [3, i];
  }
  // Table position: first-base seats 0..k-1, then the user at k, then the remaining seats.
  let pos: number;
  let hand: number;
  let card: number;
  m = /^p(\d+)-(\d+)$/.exec(id);
  if (m) {
    pos = k;
    hand = Number(m[1]);
    card = Number(m[2]);
  } else {
    m = /^n(\d+)-(\d+)-(\d+)$/.exec(id)!;
    const seat = Number(m[1]);
    pos = seat < k ? seat : seat + 1;
    hand = Number(m[2]);
    card = Number(m[3]);
  }
  return hand === 0 && card <= 1 ? [0, card, pos] : [1, pos, hand, card];
}

const compareKeys = (a: number[], b: number[]) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return d;
  }
  return 0;
};

export function useDealReveal(state: SimState, enabled: boolean) {
  // Sequence numbers for the current round. Updated during render, but deterministically
  // (same state in, same numbers out), so a repeated render is harmless.
  const seq = useRef({
    round: -1,
    order: new Map<string, number>(),
    next: 0,
    handCount: 0,
    activeHand: 0,
    npcHandCounts: [] as number[],
  });
  if (seq.current.round !== state.round) {
    const mounting = seq.current.round === -1;
    seq.current = { round: state.round, order: new Map(), next: 0, handCount: 0, activeHand: 0, npcHandCounts: [] };
    // Coming back to a hand in progress: whatever is already on the table was dealt before.
    if (mounting) for (const id of slotIds(state)) seq.current.order.set(id, -1);
  }
  const cur = seq.current;
  const { order } = cur;

  // A split reuses slot ids for different cards: the active hand is replaced by two hands (later
  // hands shift up one). Re-register the affected slots: each new hand's first card was moved, not
  // dealt (shown at once), cards after it are dealt fresh, and shifted hands keep their cards.
  if (state.hands.length > cur.handCount && cur.handCount > 0) {
    const a = cur.activeHand;
    for (const id of [...order.keys()]) {
      const m = /^p(\d+)-\d+$/.exec(id);
      if (m && Number(m[1]) >= a) order.delete(id);
    }
    state.hands.forEach((h, hi) => {
      if (hi < a) return;
      h.cards.forEach((_, i) => {
        if (hi > a + 1 || i === 0) order.set(`p${hi}-${i}`, -1);
      });
    });
  }
  state.npcs.forEach((seat, s) => {
    const before = cur.npcHandCounts[s] ?? 0;
    if (before === 0 || seat.length <= before) return;
    for (const id of [...order.keys()]) if (id.startsWith(`n${s}-`)) order.delete(id);
    seat.forEach((_, hi) => order.set(`n${s}-${hi}-0`, -1));
  });
  cur.handCount = state.hands.length;
  cur.activeHand = state.activeHandIdx;
  cur.npcHandCounts = state.npcs.map((seat) => seat.length);

  const fresh = slotIds(state).filter((id) => !order.has(id));
  fresh.sort((a, b) => compareKeys(sortKey(a, state.npcs.length), sortKey(b, state.npcs.length)));
  for (const id of fresh) order.set(id, cur.next++);
  const total = cur.next;

  // How many sequence numbers have been revealed, tagged with the round they belong to.
  const [revealed, setRevealed] = useState({ round: state.round, n: 0 });
  const shown = !enabled ? Infinity : revealed.round === state.round ? revealed.n : 0;

  useEffect(() => {
    if (!enabled || shown >= total) return;
    const id = window.setTimeout(() => setRevealed({ round: state.round, n: shown + 1 }), shown === 0 ? 60 : STEP_MS);
    return () => window.clearTimeout(id);
  }, [enabled, shown, total, state.round]);

  return {
    isShown: (id: string) => (order.get(id) ?? Infinity) < shown,
    /** Every card that exists in the state has been dealt on screen. */
    settled: shown >= total,
  };
}
