import { useEffect, useMemo, useState } from 'react';
import { Legend, StrategyTable, useStrategyChart } from '../components/StrategyChart';
import { PresetPicker, RuleGroups, rulesSummary } from '../components/RuleControls';
import { toEngineRules, useSettingsStore } from '../state/settingsStore';

function QuickSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reset = useSettingsStore((s) => s.resetToDefaults);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden />
      <aside
        aria-label="Quick settings"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md animate-[reference-slide-in_0.2s_ease-out] no-scrollbar overflow-y-auto border-l border-[var(--line)] bg-[var(--bg-main)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg-main)] px-5 py-4">
          <div>
            <h2 className="font-semibold">Quick settings</h2>
            <p className="text-xs text-[var(--text-muted)]">Changes apply instantly and save everywhere</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm hover:border-white/20"
          >
            Done
          </button>
        </div>
        <div className="space-y-6 px-5 py-6">
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Presets</h3>
            <PresetPicker compact />
          </section>
          <RuleGroups />
          <button
            type="button"
            onClick={reset}
            className="text-sm text-[var(--text-muted)] underline-offset-4 hover:text-[var(--text-primary)] hover:underline"
          >
            Reset rules to defaults
          </button>
        </div>
      </aside>
    </>
  );
}

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-second)] p-3 sm:p-5">
      <h2 className="mb-3 text-sm font-medium text-[var(--text-muted)]">{title}</h2>
      {children}
    </section>
  );
}

export function BscPage() {
  const settings = useSettingsStore((s) => s.settings);
  const rules = useMemo(() => toEngineRules(settings), [settings]);
  const { chart, loading, error } = useStrategyChart(rules);
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Basic Strategy Chart</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
            <span className="font-mono text-[var(--text-primary)]">{rulesSummary(settings)}</span>
            {loading && <span className="text-[var(--accent-soft)]">Updating…</span>}
            {error && <span className="text-rose-400">Couldn't reach the server, showing the standard chart</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setQuickOpen(true)}
          className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]"
        >
          Quick settings
        </button>
      </div>

      <div className="mb-6">
        <Legend />
      </div>

      <div className={`grid gap-4 transition-opacity lg:grid-cols-2 ${loading ? 'opacity-60' : ''}`}>
        <ChartSection title="Hard totals">
          <StrategyTable rows={chart.hard} />
        </ChartSection>
        <ChartSection title="Soft totals">
          <StrategyTable rows={chart.soft} />
        </ChartSection>
        <ChartSection title="Pairs">
          <StrategyTable rows={chart.pairs} />
        </ChartSection>
        <section className="rounded-xl border border-[var(--line)] p-5 text-sm leading-relaxed text-[var(--text-muted)]">
          <h2 className="mb-2 font-medium text-[var(--text-primary)]">How this chart is made</h2>
          <p className="mb-2">
            Every cell is the highest expected-value play for that hand against the dealer upcard, computed for the
            exact rules above. Change a rule and the chart is recalculated.
          </p>
          <p>
            Columns are the dealer's upcard. "Else" tells you what to do when the first choice isn't allowed (for
            example, you can't double after taking a third card).
          </p>
        </section>
      </div>

      <QuickSettings open={quickOpen} onClose={() => setQuickOpen(false)} />
    </main>
  );
}
