import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DoubleDownRestriction, Rules } from '../engine/blackjack-engine';
import { DEFAULT_COUNTING_SYSTEM, type CountingSystemKey } from '../engine/countingSystems';

export type BlackjackPayout = 1.5 | 1.2 | 1;
export type { DoubleDownRestriction };

export type ThemeKey = 'default' | 'obsidian' | 'midnight';

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
}

export const THEMES: Theme[] = [
  {
    key: 'default',
    label: 'Default',
    bgMain: '#111827',
    bgSecond: '#1f2937',
    bgThird: '#374151',
    textMuted: '#9ca3af',
    textPrimary: '#f3f4f6',
  },
  {
    key: 'obsidian',
    label: 'Obsidian',
    bgMain: '#070709',
    bgSecond: '#0c0c0e',
    bgThird: '#1a1a1f',
    textMuted: '#717279',
    textPrimary: '#ffffff',
  },
  {
    key: 'midnight',
    label: 'Midnight',
    bgMain: '#0b0f1a',
    bgSecond: '#141b2e',
    bgThird: '#1e293b',
    textMuted: '#7a8699',
    textPrimary: '#f1f5f9',
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
