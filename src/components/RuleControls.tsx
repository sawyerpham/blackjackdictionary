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

/** iOS switch: 51 x 31 track, 27 pt knob. */
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
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40 ${
        checked ? 'bg-[var(--accent)]' : 'bg-[rgb(120_120_128/0.32)]'
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_3px_1px_rgb(0_0_0/0.06)] transition-transform duration-200 ease-[cubic-bezier(0.3,1.4,0.5,1)] ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

/** iOS segmented control: gray track, raised thumb on the selected segment. */
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
      className={`inline-flex flex-wrap rounded-[9px] bg-[var(--fill)] p-[2px] ${disabled ? 'opacity-40' : ''}`}
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`min-h-7 min-w-8 rounded-[7px] px-2 text-[13px] font-medium transition-colors ${
            value === o.value
              ? 'bg-[#636366] text-white shadow-[0_3px_8px_rgb(0_0_0/0.12),0_3px_1px_rgb(0_0_0/0.04)]'
              : 'text-[var(--text-primary)] hover:bg-white/[0.06]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Small header above a grouped list (iOS inset grouped style). */
export function SectionHeader({ children }: { children: ReactNode }) {
  return <h2 className="text-footnote mb-1.5 px-4 text-[var(--text-muted)] uppercase">{children}</h2>;
}

/** One row of a grouped list: 44 pt minimum, separator inset from the left like iOS. */
export function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="pl-4 [&+&>div]:border-t [&+&>div]:border-[var(--line)]">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2.5 pr-4">
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-[17px] leading-snug text-[var(--text-primary)]">{title}</p>
          {hint && <p className="text-footnote mt-0.5 text-[var(--text-muted)]">{hint}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <SectionHeader>{title}</SectionHeader>
      <div className="overflow-hidden rounded-[10px] bg-[var(--bg-second)]">{children}</div>
    </section>
  );
}

/** iOS selection list: one row per choice, a checkmark on the selected one. */
export function ChoiceList({
  items,
}: {
  items: { key: string; label: string; description?: string; active: boolean; onSelect: () => void }[];
}) {
  return (
    <div className="overflow-hidden rounded-[10px] bg-[var(--bg-second)]">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          onClick={it.onSelect}
          aria-pressed={it.active}
          className="block w-full pl-4 text-left transition-colors active:bg-white/[0.08] [&+&>span]:border-t [&+&>span]:border-[var(--line)]"
        >
          <span className="flex min-h-11 items-center gap-3 py-2.5 pr-4">
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] leading-snug">{it.label}</span>
              {it.description && (
                <span className="text-footnote block text-[var(--text-muted)]">{it.description}</span>
              )}
            </span>
            <svg
              viewBox="0 0 16 16"
              className={`h-4 w-4 shrink-0 text-[var(--accent)] ${it.active ? '' : 'invisible'}`}
              aria-hidden
            >
              <path
                d="M2.5 8.5l3.5 3.5 7.5-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      ))}
    </div>
  );
}

/** Casino presets; the one matching the current rules is checked. */
export function PresetPicker() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  return (
    <ChoiceList
      items={PRESETS.map((p) => ({
        key: p.key,
        label: p.label,
        description: p.description,
        active: PRESET_KEYS.every((k) => settings[k] === p.settings[k]),
        onSelect: () => update(Object.fromEntries(PRESET_KEYS.map((k) => [k, p.settings[k]]))),
      }))}
    />
  );
}

/** Full-width text button styled as a grouped-list row (e.g. "Reset Rules"). */
export function ActionRow({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 w-full rounded-[10px] bg-[var(--bg-second)] px-4 text-[17px] text-[var(--accent)] transition-colors active:bg-white/[0.08]"
    >
      {children}
    </button>
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
    <div className="space-y-8">
      <Group title="Table">
        <Row title="Decks">
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
