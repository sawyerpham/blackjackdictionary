import { Group, PresetPicker, Row, RuleGroups, Segmented, Toggle } from '../components/RuleControls';
import { COUNTING_SYSTEMS } from '../engine/countingSystems';
import { useSettingsStore } from '../state/settingsStore';

export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const reset = useSettingsStore((s) => s.resetToDefaults);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Casino presets
          </h2>
          <PresetPicker />
        </section>

        <RuleGroups />

        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Counting system
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {COUNTING_SYSTEMS.map((system) => {
              const active = settings.countingSystem === system.key;
              return (
                <button
                  key={system.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ countingSystem: system.key })}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]'
                      : 'border-[var(--line)] bg-[var(--bg-second)] hover:border-white/20'
                  }`}
                >
                  <p className="font-medium">{system.label}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{system.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <Group title="Realistic mode">
          <Row title="Decision timer" hint="Seconds before heat starts building">
            <Segmented
              label="Decision timer"
              value={settings.realisticDecisionSeconds}
              options={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ value: n, label: `${n}s` }))}
              onChange={(v) => update({ realisticDecisionSeconds: v })}
            />
          </Row>
          <Row title="Table clear time" hint="Per hand on the table, before the next deal">
            <Segmented
              label="Table clear time"
              value={settings.realisticHandClearSeconds}
              options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}s` }))}
              onChange={(v) => update({ realisticHandClearSeconds: v })}
            />
          </Row>
        </Group>

        <Group title="Appearance">
          <Row title="Animations" hint="Cards are dealt from the shoe one at a time">
            <Toggle label="Animations" checked={settings.animations} onChange={(v) => update({ animations: v })} />
          </Row>
        </Group>

        <div className="flex justify-end border-t border-[var(--line)] pt-6">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm hover:border-white/20"
          >
            Reset rules
          </button>
        </div>
      </div>
    </main>
  );
}
