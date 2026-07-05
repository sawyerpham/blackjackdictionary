import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DoubleDownRestriction, Rules } from '../engine/blackjack-engine';
import { DEFAULT_COUNTING_SYSTEM, type CountingSystemKey } from '../engine/countingSystems';

export type BlackjackPayout = 1.5 | 1.2 | 1;
export type { DoubleDownRestriction };

export type ThemeKey = 'default' | 'obsidian' | 'crimson' | 'ocean' | 'highroller' | 'amethyst';

export interface Theme {
  key: ThemeKey;
  label: string;
  /** Outermost page/nav background. */
  bgMain: string;
  /** Card/panel/tile background. */
  bgSecond: string;
  /** Nested/sub-card background — one step lighter than bgSecond for fill contrast. */
  bgThird: string;
  /** Hint/description/category text. */
  textMuted: string;
  /** Primary readable text. */
  textPrimary: string;
  /** Signature accent: headings, selected/hover borders, active nav. */
  accent: string;
  /** Lighter accent for secondary text (subheadings, hints, highlighted values). */
  accentSoft: string;
  /** Darker accent for filled buttons; `accent` is their hover state. */
  accentStrong: string;
}

export const THEMES: Theme[] = [
  {
    key: 'default',
    label: 'Default',
    bgMain: '#06131d',
    bgSecond: '#0b2130',
    bgThird: '#143349',
    textMuted: '#7f96a3',
    textPrimary: '#eef6fa',
    accent: '#06b6d4',
    accentSoft: '#22d3ee',
    accentStrong: '#0891b2',
  },
  {
    key: 'obsidian',
    label: 'Obsidian',
    bgMain: '#070709',
    bgSecond: '#0c0c0e',
    bgThird: '#1a1a1f',
    textMuted: '#717279',
    textPrimary: '#ffffff',
    accent: '#10b981',
    accentSoft: '#34d399',
    accentStrong: '#059669',
  },
  {
    key: 'crimson',
    label: 'Crimson',
    bgMain: '#150a0d',
    bgSecond: '#1f1014',
    bgThird: '#331a22',
    textMuted: '#9b8b90',
    textPrimary: '#f5f0f1',
    accent: '#f43f5e',
    accentSoft: '#fb7185',
    accentStrong: '#e11d48',
  },
  {
    key: 'highroller',
    label: 'High Roller',
    bgMain: '#0c0b09',
    bgSecond: '#161511',
    bgThird: '#26241d',
    textMuted: '#a29a84',
    textPrimary: '#f7f4ec',
    accent: '#f59e0b',
    accentSoft: '#fbbf24',
    accentStrong: '#d97706',
  },
  {
    key: 'amethyst',
    label: 'Amethyst',
    bgMain: '#110b1c',
    bgSecond: '#1a1229',
    bgThird: '#2b1f42',
    textMuted: '#9c8fae',
    textPrimary: '#f4f1f8',
    accent: '#a855f7',
    accentSoft: '#c084fc',
    accentStrong: '#9333ea',
  },
];

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
  theme: ThemeKey;
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
  theme: 'default',
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
  setSettings: (settings: GameSettings) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      setSettings: (settings) => set({ settings }),
      resetToDefaults: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'blackjack-settings',
      // Backfill settings persisted before newer keys (e.g. countingSystem) existed.
      merge: (persisted, current) => {
        const stored = persisted as Partial<SettingsStore> | undefined;
        return {
          ...current,
          ...stored,
          settings: { ...DEFAULT_SETTINGS, ...stored?.settings },
        };
      },
    },
  ),
);
