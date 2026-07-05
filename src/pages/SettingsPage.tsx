import { useState } from 'react';
import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react';
import {
  DEFAULT_SETTINGS,
  PRESETS,
  THEMES,
  useSettingsStore,
  type BlackjackPayout,
  type DoubleDownRestriction,
  type GameSettings,
  type Theme,
} from '../state/settingsStore';
import { COUNTING_SYSTEMS } from '../engine/countingSystems';

function Checkbox({
  id,
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-600 bg-gray-800 disabled:opacity-50"
      />
      <label htmlFor={id} className="ml-2 text-[var(--text-primary)]">
        {label}
        <span className="mt-1 block text-sm text-[var(--text-muted)]">{description}</span>
      </label>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-[var(--bg-third)] p-6">
      <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pb-4">
      <h3 className="mb-4 text-lg font-medium text-[var(--accent-soft)]">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

const DIVIDER = <div className="my-4 border-t border-gray-600" />;

function ThemeSwatch({ theme, selected, onClick }: { theme: Theme; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-24 select-none overflow-hidden rounded-2xl border-2 transition-all duration-75 active:translate-y-0.5 active:scale-95 ${
        selected ? 'border-[var(--accent)]' : 'border-transparent hover:border-[color-mix(in_srgb,var(--accent)_60%,transparent)]'
      }`}
      style={{
        background: `linear-gradient(to top right, ${theme.bgMain} 50%, ${theme.accent} 50%)`,
        // Keep the gradient out of the (transparent) border area so it doesn't bleed to the edges.
        backgroundClip: 'padding-box',
      }}
    >
      <span className="absolute inset-0 flex items-center justify-center text-lg font-medium text-white [text-shadow:0_1px_3px_rgb(0_0_0_/_0.6)]">
        {theme.label}
      </span>
    </button>
  );
}

function CardCountingSection({
  draft,
  setDraft,
  setSavedMessage,
}: {
  draft: GameSettings;
  setDraft: Dispatch<SetStateAction<GameSettings>>;
  setSavedMessage: (v: boolean) => void;
}) {
  return (
    <SectionCard title="Card Counting Technique">
      <p className="mb-4 text-[var(--text-primary)]">
        Choose the counting system shown beneath the optimal play in the simulator.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {COUNTING_SYSTEMS.map((system) => (
          <button
            key={system.key}
            type="button"
            onClick={() => {
              setDraft((d) => ({ ...d, countingSystem: system.key }));
              setSavedMessage(false);
            }}
            className={`select-none rounded-lg border bg-[var(--bg-second)] p-4 text-center transition-all duration-75 active:translate-y-0.5 active:scale-95 ${
              draft.countingSystem === system.key
                ? 'border-[var(--accent)]'
                : 'border-white/10 hover:border-[color-mix(in_srgb,var(--accent)_60%,transparent)]'
            }`}
          >
            <h3 className="mb-1 text-lg font-medium text-[var(--accent)]">{system.label}</h3>
            <p className="text-sm text-[var(--text-muted)]">{system.description}</p>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

function AppearanceSection({
  draft,
  setDraft,
  setSavedMessage,
}: {
  draft: GameSettings;
  setDraft: Dispatch<SetStateAction<GameSettings>>;
  setSavedMessage: (v: boolean) => void;
}) {
  return (
    <SectionCard title="Appearance">
      <SubSection title="Themes">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {THEMES.map((theme) => (
            <ThemeSwatch
              key={theme.key}
              theme={theme}
              selected={draft.theme === theme.key}
              onClick={() => {
                setDraft((d) => ({ ...d, theme: theme.key }));
                setSavedMessage(false);
              }}
            />
          ))}
        </div>
      </SubSection>
    </SectionCard>
  );
}

export function SettingsPage() {
  const persisted = useSettingsStore((s) => s.settings);
  const setPersisted = useSettingsStore((s) => s.setSettings);
  const [draft, setDraft] = useState<GameSettings>(persisted);
  const [savedMessage, setSavedMessage] = useState(false);

  const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSavedMessage(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPersisted(draft);
    setSavedMessage(true);
  };

  const handleRestoreDefaults = () => {
    setDraft(DEFAULT_SETTINGS);
    setSavedMessage(false);
  };

  return (
    <div className="container mx-auto flex-1 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-lg bg-[var(--bg-second)] p-8">
          <h1 className="mb-6 text-3xl font-bold text-[var(--accent)]">Game Settings</h1>
          <p className="mb-8 text-[var(--text-primary)]">
            Configure the rules and parameters for your blackjack game. Different casinos use
            different rules which can affect the optimal strategy.
          </p>

          <form className="space-y-8" onSubmit={handleSave}>
            <SectionCard title="Basic Rules">
              <div className="mt-6 grid grid-cols-1 gap-20 px-8 text-center md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[var(--text-primary)]">Number of Decks</label>
                  <div className="flex flex-col items-center">
                    <input
                      type="range"
                      min={1}
                      max={8}
                      step={1}
                      value={draft.decks}
                      onChange={(e) => update('decks', Number(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-600"
                    />
                    <span className="mt-2 w-10 text-center text-[var(--text-primary)]">{draft.decks}</span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[var(--text-primary)]">Blackjack Payout</label>
                  <select
                    value={draft.blackjackPayout}
                    onChange={(e) =>
                      update('blackjackPayout', Number(e.target.value) as BlackjackPayout)
                    }
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-center text-[var(--text-primary)]"
                  >
                    <option value={1.5}>3:2 ($1.50 per $1.00)</option>
                    <option value={1.2}>6:5 ($1.20 per $1.00)</option>
                    <option value={1}>1:1 ($1.00 per $1.00)</option>
                  </select>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Advanced Rules">
              <SubSection title="Splitting Rules">
                <div className="pl-6">
                  <label className="mb-2 block text-[var(--text-primary)]">
                    Maximum Splits Allowed
                    <span className="mt-1 block text-sm text-[var(--text-muted)]">
                      Maximum number of times a player can split their hand
                    </span>
                  </label>
                  <select
                    value={draft.maxSplits}
                    onChange={(e) => update('maxSplits', Number(e.target.value))}
                    className="w-64 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-center text-[var(--text-primary)]"
                  >
                    <option value={1}>1 Time (2 Hands)</option>
                    <option value={2}>2 Times (3 Hands)</option>
                    <option value={3}>3 Times (4 Hands)</option>
                  </select>
                </div>
                <Checkbox
                  id="allowTenValueSplit"
                  checked={draft.allowTenValueSplit}
                  onChange={(v) => update('allowTenValueSplit', v)}
                  label="Allow Ten-Value Split"
                  description="Player can split different ten-value cards (e.g., K-Q, J-10)"
                />
                <Checkbox
                  id="allowResplitAces"
                  checked={draft.allowResplitAces}
                  onChange={(v) => update('allowResplitAces', v)}
                  label="Allow Resplit Aces"
                  description="Player can split aces more than once if another ace is dealt"
                />
                <Checkbox
                  id="allowDrawAfterSplitAces"
                  checked={draft.allowDrawAfterSplitAces}
                  onChange={(v) => update('allowDrawAfterSplitAces', v)}
                  label="Allow Draw After Split Aces"
                  description="Player can hit multiple times on split aces (otherwise only one card per ace)"
                />
              </SubSection>

              {DIVIDER}

              <SubSection title="Double Down Rules">
                <Checkbox
                  id="allowDoubleDown"
                  checked={draft.allowDoubleDown}
                  onChange={(v) => update('allowDoubleDown', v)}
                  label="Allow Double Down"
                  description="Player can double their bet and receive exactly one more card"
                />
                <div className="pl-6">
                  <label
                    htmlFor="doubleDownRestriction"
                    className="mb-2 block text-[var(--text-primary)]"
                  >
                    Double Down Restriction
                    <span className="mt-1 block text-sm text-[var(--text-muted)]">
                      Specify which hands can be doubled down
                    </span>
                  </label>
                  <select
                    id="doubleDownRestriction"
                    value={draft.doubleDownRestriction}
                    disabled={!draft.allowDoubleDown}
                    onChange={(e) =>
                      update('doubleDownRestriction', e.target.value as DoubleDownRestriction)
                    }
                    className="w-64 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-center text-[var(--text-primary)] disabled:opacity-50"
                  >
                    <option value="any">Double on Any Two</option>
                    <option value="hard9to11">Double on Hard 9, 10, or 11</option>
                    <option value="hard10or11">Double on Hard 10 or 11</option>
                    <option value="hard9to11AndSoft">Hard 9-11 and All Soft Hands</option>
                  </select>
                </div>
                <Checkbox
                  id="allowDoubleAfterSplit"
                  checked={draft.allowDoubleAfterSplit}
                  disabled={!draft.allowDoubleDown}
                  onChange={(v) => update('allowDoubleAfterSplit', v)}
                  label="Allow Double After Split"
                  description="Player can double down on hands created by splitting"
                />
              </SubSection>

              {DIVIDER}

              <SubSection title="Dealer Rules">
                <Checkbox
                  id="hitSoft17"
                  checked={draft.hitSoft17}
                  onChange={(v) => update('hitSoft17', v)}
                  label="Dealer Hits on Soft 17"
                  description="Dealer must hit when holding Ace-6 (soft 17)"
                />
                <Checkbox
                  id="dealerPeeks"
                  checked={draft.dealerPeeks}
                  onChange={(v) => update('dealerPeeks', v)}
                  label="Dealer Peeks for Blackjack"
                  description="Dealer checks for blackjack when showing an Ace or 10-value card"
                />
              </SubSection>

              {DIVIDER}

              <div>
                <h3 className="mb-4 text-lg font-medium text-[var(--accent-soft)]">Player Options</h3>
                <div className="space-y-4">
                  <Checkbox
                    id="allowLateSurrender"
                    checked={draft.allowLateSurrender}
                    onChange={(v) => update('allowLateSurrender', v)}
                    label="Allow Late Surrender"
                    description="Player can surrender and get back half their bet after checking for dealer blackjack"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Preset Configurations">
              <p className="mb-4 text-[var(--text-primary)]">
                Load predefined settings for common casino rule sets.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => {
                      setDraft({
                        ...preset.settings,
                        theme: draft.theme,
                        countingSystem: draft.countingSystem,
                      });
                      setSavedMessage(false);
                    }}
                    className="select-none rounded-lg border border-white/10 bg-[var(--bg-second)] p-4 text-center transition-all duration-75 hover:border-[var(--accent)] active:translate-y-0.5 active:scale-95"
                  >
                    <h3 className="mb-1 text-lg font-medium text-[var(--accent)]">{preset.label}</h3>
                    <p className="text-sm text-[var(--text-muted)]">{preset.description}</p>
                  </button>
                ))}
              </div>
            </SectionCard>

            <CardCountingSection draft={draft} setDraft={setDraft} setSavedMessage={setSavedMessage} />

            <AppearanceSection draft={draft} setDraft={setDraft} setSavedMessage={setSavedMessage} />

            <div className="flex flex-col items-start justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="rounded-lg bg-[var(--bg-third)] px-4 py-2 font-medium text-[var(--text-primary)] transition-colors hover:brightness-125"
                >
                  Restore Defaults
                </button>
              </div>
              <div className="flex items-center gap-4">
                {savedMessage && <span className="text-sm text-[var(--accent-soft)]">Settings saved</span>}
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent)]"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
