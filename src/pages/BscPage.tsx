import { useEffect, useMemo, useState } from 'react';
import type { Rules } from '../engine/blackjack-engine';
import { Legend, StrategyTable, useStrategyChart } from '../components/StrategyChart';
import { PresetPicker, RuleGroups, rulesSummary } from '../components/RuleControls';
import { toEngineRules, useSettingsStore } from '../state/settingsStore';

/** POST /api/house-edge: base game, each rule's effect (in house-edge %), and the total. */
interface EdgeBreakdown {
  base: number;
  factors: { factor: string; setting: string; delta: number; isBase: boolean }[];
  total: number;
}

const edgeCache = new Map<string, EdgeBreakdown>();

/** Keeps the last breakdown while a new one loads (the backend can take a second or two). */
function useHouseEdge(rules: Rules) {
  const key = JSON.stringify(rules);
  const [state, setState] = useState<{ key?: string; data?: EdgeBreakdown }>(() => ({
    key: edgeCache.has(key) ? key : undefined,
    data: edgeCache.get(key),
  }));
  useEffect(() => {
    const cached = edgeCache.get(key);
    if (cached) {
      setState({ key, data: cached });
      return;
    }
    const ctrl = new AbortController();
    fetch('/api/house-edge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: key, signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<EdgeBreakdown>) : undefined))
      .then((data) => {
        if (!data) return;
        edgeCache.set(key, data);
        setState({ key, data });
      })
      .catch(() => {}); // aborted or offline: keep showing the last value
    return () => ctrl.abort();
  }, [key]);
  return { data: state.data, loading: state.key !== key };
}

const pct = (n: number) => `${Math.abs(n).toFixed(2)}%`;
const signed = (n: number) => (Math.abs(n) < 0.005 ? '—' : `${n > 0 ? '+' : '−'}${pct(n)}`);

function EdgeBreakdownPanel({ data, loading }: { data?: EdgeBreakdown; loading: boolean }) {
  const playerEdge = data !== undefined && data.total < 0;
  return (
    <section
      id="house-edge"
      aria-label="House edge breakdown"
      className={`scroll-mt-20 rounded-xl border border-[var(--line)] bg-[var(--bg-second)] p-3 transition-opacity sm:p-5 ${
        loading ? 'opacity-60' : ''
      }`}
    >
      <h2 className="mb-3 text-sm font-medium text-[var(--text-muted)]">House edge breakdown</h2>
      {!data ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">Calculating…</p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-[var(--line)]">
            <tr>
              <td className="py-2 pr-2 text-[var(--text-primary)]" colSpan={2}>
                Base game
                <span className="block text-xs text-[var(--text-muted)]">
                  6 decks · S17 · 3:2 · peek · double any · DAS · no surrender
                </span>
              </td>
              <td className="py-2 text-right font-mono tabular-nums">{pct(data.base)}</td>
            </tr>
            {data.factors.map((f) => (
              <tr key={f.factor}>
                <td className="py-2 pr-2 text-[var(--text-muted)]">{f.factor}</td>
                <td className={`py-2 pr-2 ${f.isBase ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                  {f.setting}
                </td>
                <td
                  className={`py-2 text-right font-mono tabular-nums ${
                    Math.abs(f.delta) < 0.005
                      ? 'text-[var(--text-muted)]'
                      : f.delta > 0
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                  }`}
                >
                  {signed(f.delta)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-white/15">
              <td className="pt-3 font-medium" colSpan={2}>
                {playerEdge ? 'Player edge' : 'House edge'}
              </td>
              <td
                className={`pt-3 text-right font-mono text-base font-semibold tabular-nums ${
                  playerEdge ? 'text-emerald-400' : ''
                }`}
              >
                {pct(data.total)}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );
}

/** House edge for the current rules; keeps showing the last value (dimmed) while a new one loads. */
function HouseEdge({ edge, loading, compact = false }: { edge?: number; loading: boolean; compact?: boolean }) {
  const player = edge !== undefined && edge < 0;
  return (
    <div className={`text-right transition-opacity ${loading ? 'opacity-50' : ''}`} aria-live="polite">
      <p className="text-[11px] tracking-wide text-[var(--text-muted)] uppercase">{player ? 'Player edge' : 'House edge'}</p>
      <p
        className={`font-mono font-semibold tabular-nums ${compact ? 'text-lg' : 'text-2xl'} ${
          player ? 'text-emerald-400' : 'text-[var(--text-primary)]'
        }`}
      >
        {edge === undefined ? '—' : `${Math.abs(edge).toFixed(2)}%`}
      </p>
    </div>
  );
}

function QuickSettings({
  open,
  onClose,
  edge,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  edge?: number;
  loading: boolean;
}) {
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
          </div>
          <div className="ml-auto pr-4">
            <HouseEdge compact edge={edge} loading={loading} />
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
  const edge = useHouseEdge(rules);
  const [quickOpen, setQuickOpen] = useState(false);

  // Links like /bsc#house-edge: the router doesn't scroll to hashes itself.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

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
        <div className="flex items-end gap-5">
          <HouseEdge edge={edge.data?.total} loading={edge.loading} />
          <button
            type="button"
            onClick={() => setQuickOpen(true)}
            className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]"
          >
            Quick settings
          </button>
        </div>
      </div>

      <div className="mb-6">
        <Legend surrender={settings.allowLateSurrender} />
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
        <EdgeBreakdownPanel data={edge.data} loading={edge.loading} />
      </div>

      <QuickSettings
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        edge={edge.data?.total}
        loading={edge.loading}
      />
    </main>
  );
}
