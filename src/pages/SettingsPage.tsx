import {
  ActionRow,
  ChoiceList,
  Group,
  PresetPicker,
  Row,
  RuleGroups,
  SectionHeader,
  Segmented,
  Toggle,
} from '../components/RuleControls';
import { COUNTING_SYSTEMS } from '../engine/countingSystems';
import { useSettingsStore } from '../state/settingsStore';

export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const reset = useSettingsStore((s) => s.resetToDefaults);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <h1 className="text-large-title mb-8 px-1">Settings</h1>

      <div className="space-y-8">
        <section>
          <SectionHeader>Casino presets</SectionHeader>
          <PresetPicker />
        </section>

        <RuleGroups />

        <section>
          <SectionHeader>Counting system</SectionHeader>
          <ChoiceList
            items={COUNTING_SYSTEMS.map((system) => ({
              key: system.key,
              label: system.label,
              description: system.description,
              active: settings.countingSystem === system.key,
              onSelect: () => update({ countingSystem: system.key }),
            }))}
          />
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

        <ActionRow onClick={reset}>Reset Rules</ActionRow>
      </div>
    </main>
  );
}
