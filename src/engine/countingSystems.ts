import { cardsLeft, freshShoe, type Shoe } from './blackjack-engine';

export type CountingSystemKey =
  | 'hiLo'
  | 'ko'
  | 'hiOpt2'
  | 'omega2'
  | 'zen'
  | 'halves';

export interface CountingSystem {
  key: CountingSystemKey;
  label: string;
  /** One-line description of how the count is kept. */
  description: string;
  balanced: boolean;
  /** Whether the displayed count is running / estimated decks remaining. */
  usesTrueCount: boolean;
  /** Count value per rank, indexed like RANKS: [A, 2, 3, 4, 5, 6, 7, 8, 9, 10]. */
  values: number[];
  /** Starting running count for a fresh shoe (nonzero for unbalanced systems). */
  initialRunningCount?: (decks: number) => number;
}

export const COUNTING_SYSTEMS: CountingSystem[] = [
  {
    key: 'hiLo',
    label: 'Hi-Lo',
    description: 'Count 2-6 as +1, 7-9 as 0, 10s and aces as -1',
    balanced: true,
    usesTrueCount: true,
    values: [-1, 1, 1, 1, 1, 1, 0, 0, 0, -1],
  },
  {
    key: 'ko',
    label: 'KO',
    description: 'Count 2-7 as +1, 10s and aces as -1; no true count needed',
    balanced: false,
    usesTrueCount: false,
    values: [-1, 1, 1, 1, 1, 1, 1, 0, 0, -1],
    initialRunningCount: (decks) => -4 * (decks - 1),
  },
  {
    key: 'hiOpt2',
    label: 'Hi-Opt II',
    description: 'Count 2-3 and 6-7 as +1, 4-5 as +2, 10s as -2; aces neutral',
    balanced: true,
    usesTrueCount: true,
    values: [0, 1, 1, 2, 2, 1, 1, 0, 0, -2],
  },
  {
    key: 'omega2',
    label: 'Omega II',
    description: 'Count 4-6 as +2, 2-3 and 7 as +1, 9 as -1, 10s as -2',
    balanced: true,
    usesTrueCount: true,
    values: [0, 1, 1, 2, 2, 2, 1, 0, -1, -2],
  },
  {
    key: 'zen',
    label: 'Zen Count',
    description: 'Count 4-6 as +2, 2-3 and 7 as +1, 10s as -2, aces as -1',
    balanced: true,
    usesTrueCount: true,
    values: [-1, 1, 1, 2, 2, 2, 1, 0, 0, -2],
  },
  {
    key: 'halves',
    label: 'Wong Halves',
    description: 'Half-point steps: 5s +1.5, 2s and 7s +0.5, 9s -0.5, 10s and aces -1',
    balanced: true,
    usesTrueCount: true,
    values: [-1, 0.5, 1, 1, 1.5, 1, 0.5, 0, -0.5, -1],
  },
];

export const DEFAULT_COUNTING_SYSTEM: CountingSystemKey = 'hiLo';

/** Falls back to Hi-Lo for unknown/missing keys (e.g. settings persisted before this feature). */
export function getCountingSystem(key: CountingSystemKey | undefined): CountingSystem {
  return COUNTING_SYSTEMS.find((s) => s.key === key) ?? COUNTING_SYSTEMS[0];
}

/**
 * Running count derived from what has left the shoe: every card the player
 * has seen is a fresh-shoe card no longer in `unseenShoe`. Pass the shoe as
 * the player sees it (hole card still "in" the shoe) so the hidden card
 * doesn't move the count. Resets automatically whenever the shoe is fresh.
 */
export function runningCount(system: CountingSystem, decks: number, unseenShoe: Shoe): number {
  const full = freshShoe(decks);
  let count = system.initialRunningCount?.(decks) ?? 0;
  for (let i = 0; i < full.length; i++) {
    count += system.values[i] * (full[i] - unseenShoe[i]);
  }
  return count;
}

/** Eyeballed decks remaining in quarter-deck steps, never below 0.25. */
export function estimatedDecksRemaining(cardsRemaining: number): number {
  return Math.max(0.25, Math.round((cardsRemaining / 52) * 4) / 4);
}

function formatSigned(value: number, decimals: number): string {
  const v = value === 0 ? 0 : value; // normalize -0
  const abs = Math.abs(v);
  return `${v < 0 ? '-' : '+'}${decimals === 0 && Number.isInteger(abs) ? abs : abs.toFixed(Math.max(decimals, 1))}`;
}

/** The one line shown under the optimal-play text, e.g. "True Count: +1.5". */
export function countDisplay(system: CountingSystem, decks: number, unseenShoe: Shoe): string {
  const running = runningCount(system, decks, unseenShoe);
  if (!system.usesTrueCount) return `Running Count: ${formatSigned(running, 0)}`;
  const decksRemaining = estimatedDecksRemaining(cardsLeft(unseenShoe));
  return `True Count: ${formatSigned(running / decksRemaining, 1)}`;
}
