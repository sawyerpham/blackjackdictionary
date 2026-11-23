import type { ReactNode } from 'react';
import {
  PRESETS,
  useSettingsStore,
  type BlackjackPayout,
  type DoubleDownRestriction,
  type GameSettings,
} from '../state/settingsStore';

/** Rule keys a preset sets; used to tell which preset (if any) is active. */
const PRESET_KEYS: (keyof GameSettings)[] = [
  'decks', 'blackjackPayout', 'hitSoft17', 'allowDoubleAfterSplit', 'allowLateSurrender', 'dealerPeeks',
  'maxSplits', 'allowResplitAces', 'allowDrawAfterSplitAces', 'allowDoubleDown', 'doubleDownRestriction',
];

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
        checked ? 'bg-[var(--accent)]' : 'bg-white/15'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex flex-wrap rounded-lg bg-white/[0.06] p-0.5 ${disabled ? 'opacity-40' : ''}`}
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 text-sm transition-colors ${
            value === o.value
              ? 'bg-[var(--bg-third)] text-[var(--text-primary)] shadow ring-1 ring-white/10'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-sm text-[var(--text-primary)]">{title}</p>
        {hint && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{title}</h3>
      <div className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--bg-second)] px-4">
        {children}
      </div>
    </section>
  );
}

export function PresetPicker({ compact = false }: { compact?: boolean }) {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
      {PRESETS.map((p) => {
        const active = PRESET_KEYS.every((k) => settings[k] === p.settings[k]);
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => update(Object.fromEntries(PRESET_KEYS.map((k) => [k, p.settings[k]])))}
            aria-pressed={active}
            className={`rounded-xl border p-4 text-left transition-colors ${
              active
                ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]'
                : 'border-[var(--line)] bg-[var(--bg-second)] hover:border-white/20'
            }`}
          >
            <p className="font-medium">{p.label}</p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{p.description}</p>
          </button>
        );
      })}
    </div>
  );
}

/** Every rule that changes play (and therefore the strategy chart). Auto-saves. */
export function RuleGroups() {
  const s = useSettingsStore((st) => st.settings);
  const update = useSettingsStore((st) => st.update);
  const set =
    <K extends keyof GameSettings>(key: K) =>
    (value: GameSettings[K]) =>
      update({ [key]: value } as Partial<GameSettings>);

  return (
    <div className="space-y-6">
      <Group title="Table">
        <Row title="Decks" hint="Cards in the shoe">
          <Segmented
            label="Decks"
            value={s.decks}
            options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: n, label: String(n) }))}
            onChange={set('decks')}
          />
        </Row>
        <Row title="Blackjack pays">
          <Segmented<BlackjackPayout>
            label="Blackjack payout"
            value={s.blackjackPayout}
            options={[
              { value: 1.5, label: '3:2' },
              { value: 1.2, label: '6:5' },
              { value: 1, label: '1:1' },
            ]}
            onChange={set('blackjackPayout')}
          />
        </Row>
        <Row title="Dealer hits soft 17" hint="On = H17, off = S17">
          <Toggle label="Dealer hits soft 17" checked={s.hitSoft17} onChange={set('hitSoft17')} />
        </Row>
        <Row title="Dealer peeks for blackjack" hint="Checks the hole card under an Ace or 10">
          <Toggle label="Dealer peeks" checked={s.dealerPeeks} onChange={set('dealerPeeks')} />
        </Row>
        <Row title="Late surrender" hint="Give up half your bet after the peek">
          <Toggle label="Late surrender" checked={s.allowLateSurrender} onChange={set('allowLateSurrender')} />
        </Row>
      </Group>

      <Group title="Doubling">
        <Row title="Allow double down">
          <Toggle label="Allow double down" checked={s.allowDoubleDown} onChange={set('allowDoubleDown')} />
        </Row>
        <Row title="Double on">
          <Segmented<DoubleDownRestriction>
            label="Double down restriction"
            value={s.doubleDownRestriction}
            disabled={!s.allowDoubleDown}
            options={[
              { value: 'any', label: 'Any two' },
              { value: 'hard9to11', label: '9–11' },
              { value: 'hard10or11', label: '10–11' },
              { value: 'hard9to11AndSoft', label: '9–11 + soft' },
            ]}
            onChange={set('doubleDownRestriction')}
          />
        </Row>
        <Row title="Double after split" hint="DAS">
          <Toggle
            label="Double after split"
            checked={s.allowDoubleAfterSplit}
            disabled={!s.allowDoubleDown}
            onChange={set('allowDoubleAfterSplit')}
          />
        </Row>
      </Group>

      <Group title="Splitting">
        <Row title="Max splits" hint="Hands = splits + 1">
          <Segmented
            label="Max splits"
            value={s.maxSplits}
            options={[1, 2, 3].map((n) => ({ value: n, label: String(n) }))}
            onChange={set('maxSplits')}
          />
        </Row>
        <Row title="Resplit aces">
          <Toggle label="Resplit aces" checked={s.allowResplitAces} onChange={set('allowResplitAces')} />
        </Row>
        <Row title="Hit split aces" hint="Off = one card per ace">
          <Toggle
            label="Hit split aces"
            checked={s.allowDrawAfterSplitAces}
            onChange={set('allowDrawAfterSplitAces')}
          />
        </Row>
        <Row title="Split unlike tens" hint="e.g. K + Q">
          <Toggle label="Split unlike tens" checked={s.allowTenValueSplit} onChange={set('allowTenValueSplit')} />
        </Row>
      </Group>
    </div>
  );
}

/** One-line summary like "6D · H17 · DAS · LS · 3:2". */
export function rulesSummary(s: GameSettings): string {
  return [
    `${s.decks}D`,
    s.hitSoft17 ? 'H17' : 'S17',
    s.allowDoubleDown && s.allowDoubleAfterSplit ? 'DAS' : 'NDAS',
    s.allowLateSurrender ? 'LS' : 'NS',
    s.dealerPeeks ? 'Peek' : 'No peek',
    s.blackjackPayout === 1.5 ? '3:2' : s.blackjackPayout === 1.2 ? '6:5' : '1:1',
  ].join(' · ');
}
