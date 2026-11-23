import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DoubleDownRestriction, Rules } from '../engine/blackjack-engine';
import { DEFAULT_COUNTING_SYSTEM, type CountingSystemKey } from '../engine/countingSystems';

export type BlackjackPayout = 1.5 | 1.2 | 1;
export type { DoubleDownRestriction };

export interface GameSettings {
  decks: number;
  blackjackPayout: BlackjackPayout;
  maxSplits: number;
  /** UI-level only: the engine buckets 10/J/Q/K into one rank and can't tell
   *  a same-face pair from a mixed-ten pair, so this must be enforced by
   *  whatever component tracks the actual card faces, not by evaluate(). */
  allowTenValueSplit: boolean;
  allowResplitAces: boolean;
  allowDrawAfterSplitAces: boolean;
  allowDoubleDown: boolean;
  doubleDownRestriction: DoubleDownRestriction;
  allowDoubleAfterSplit: boolean;
  hitSoft17: boolean;
  dealerPeeks: boolean;
  allowLateSurrender: boolean;
  countingSystem: CountingSystemKey;
  /** Realistic mode: seconds the table is "cleared" before the next hand auto-deals (1–5). */
  realisticHandClearSeconds: number;
  /** Realistic mode: decision countdown length in seconds; expiring carries no penalty. */
  realisticDecisionSeconds: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  decks: 6,
  blackjackPayout: 1.5,
  maxSplits: 3,
  allowTenValueSplit: true,
  allowResplitAces: false,
  allowDrawAfterSplitAces: false,
  allowDoubleDown: true,
  doubleDownRestriction: 'any',
  allowDoubleAfterSplit: true,
  hitSoft17: true,
  dealerPeeks: true,
  allowLateSurrender: true,
  countingSystem: DEFAULT_COUNTING_SYSTEM,
  realisticHandClearSeconds: 2,
  realisticDecisionSeconds: 8,
};

export interface Preset {
  key: string;
  label: string;
  description: string;
  settings: GameSettings;
}

export const PRESETS: Preset[] = [
  {
    key: 'vegas',
    label: 'Las Vegas Strip',
    description: '6 decks, 3:2 payout, DAS',
    settings: {
      ...DEFAULT_SETTINGS,
      decks: 6,
      blackjackPayout: 1.5,
      hitSoft17: true,
      allowDoubleAfterSplit: true,
      allowLateSurrender: true,
      dealerPeeks: true,
    },
  },
  {
    key: 'atlanticCity',
    label: 'Atlantic City',
    description: '8 decks, 3:2 payout, S17',
    settings: {
      ...DEFAULT_SETTINGS,
      decks: 8,
      blackjackPayout: 1.5,
      hitSoft17: false,
      allowDoubleAfterSplit: true,
      allowLateSurrender: true,
      dealerPeeks: true,
    },
  },
  {
    key: 'european',
    label: 'European Style',
    description: '6 decks, no surrender, H17',
    settings: {
      ...DEFAULT_SETTINGS,
      decks: 6,
      blackjackPayout: 1.5,
      hitSoft17: true,
      allowDoubleAfterSplit: false,
      allowLateSurrender: false,
      dealerPeeks: false,
    },
  },
];

/**
 * Maps the full settings form to engine Rules. `allowTenValueSplit` is
 * deliberately not included — see the comment on GameSettings.
 */
export function toEngineRules(settings: GameSettings): Rules {
  return {
    decks: settings.decks,
    hitSoft17: settings.hitSoft17,
    doubleAfterSplit: settings.allowDoubleAfterSplit,
    lateSurrender: settings.allowLateSurrender,
    blackjackPays: settings.blackjackPayout,
    dealerPeeks: settings.dealerPeeks,
    allowDoubleDown: settings.allowDoubleDown,
    doubleDownRestriction: settings.doubleDownRestriction,
    maxSplits: settings.maxSplits,
    allowResplitAces: settings.allowResplitAces,
    allowDrawAfterSplitAces: settings.allowDrawAfterSplitAces,
  };
}

interface SettingsStore {
  settings: GameSettings;
  /** Applies immediately (settings auto-save). */
  update: (patch: Partial<GameSettings>) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      update: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetToDefaults: () => set((s) => ({ settings: { ...DEFAULT_SETTINGS, countingSystem: s.settings.countingSystem } })),
    }),
    {
      name: 'blackjack-settings',
      // Backfill settings persisted before newer keys (e.g. countingSystem) existed.
      merge: (persisted, current) => {
        const stored = persisted as Partial<SettingsStore> | undefined;
        const { theme: _dropped, ...saved } = (stored?.settings ?? {}) as Partial<GameSettings> & { theme?: unknown };
        return { ...current, settings: { ...DEFAULT_SETTINGS, ...saved } };
      },
    },
  ),
);
