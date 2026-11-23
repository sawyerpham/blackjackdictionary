import { useEffect, useState } from 'react';
import type { Rules } from '../engine/blackjack-engine';

export type ActionCode = 'S' | 'H' | 'D' | 'Ds' | 'P' | 'Rh' | 'Rs' | 'Rp';

export interface ChartRow {
  hand: string;
  cells: ActionCode[];
}

export interface StrategyChartData {
  hard: ChartRow[];
  soft: ChartRow[];
  pairs: ChartRow[];
}

export const CODE_STYLE: Record<ActionCode, string> = {
  S: 'bg-emerald-500/85 text-white',
  H: 'bg-rose-500/85 text-white',
  D: 'bg-amber-400 text-zinc-900',
  Ds: 'bg-amber-200 text-zinc-900',
  P: 'bg-sky-500/90 text-white',
  Rh: 'bg-violet-500/85 text-white',
  Rs: 'bg-violet-500/85 text-white',
  Rp: 'bg-violet-500/85 text-white',
};

export const CODE_LABEL: Record<ActionCode, string> = {
  S: 'Stand',
  H: 'Hit',
  D: 'Double, else hit',
  Ds: 'Double, else stand',
  P: 'Split',
  Rh: 'Surrender, else hit',
  Rs: 'Surrender, else stand',
  Rp: 'Surrender, else split',
};

const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

function row(hand: string, codes: string): ChartRow {
  return { hand, cells: codes.split(' ') as ActionCode[] };
}

/** The chart for the default rules (6D, H17, DAS, no surrender), as the backend computes it.
 *  NPCs play from it, and the BSC tab shows it until the rule-specific chart arrives. */
export const DEFAULT_CHART: StrategyChartData = {
  hard: [
    row('17+', 'S S S S S S S S S S'),
    row('16', 'S S S S S H H H H H'),
    row('15', 'S S S S S H H H H H'),
    row('14', 'S S S S S H H H H H'),
    row('13', 'S S S S S H H H H H'),
    row('12', 'H H S S S H H H H H'),
    row('11', 'D D D D D D D D D D'),
    row('10', 'D D D D D D D D H H'),
    row('9', 'H D D D D H H H H H'),
    row('8', 'H H H H H H H H H H'),
  ],
  soft: [
    row('A,9', 'S S S S S S S S S S'),
    row('A,8', 'S S S S Ds S S S S S'),
    row('A,7', 'Ds Ds Ds Ds Ds S S H H H'),
    row('A,6', 'H D D D D H H H H H'),
    row('A,5', 'H H D D D H H H H H'),
    row('A,4', 'H H D D D H H H H H'),
    row('A,3', 'H H H D D H H H H H'),
    row('A,2', 'H H H D D H H H H H'),
  ],
  pairs: [
    row('A,A', 'P P P P P P P P P P'),
    row('10,10', 'S S S S S S S S S S'),
    row('9,9', 'P P P P P S P P S S'),
    row('8,8', 'P P P P P P P P P P'),
    row('7,7', 'P P P P P P H H H H'),
    row('6,6', 'P P P P P H H H H H'),
    row('5,5', 'D D D D D D D D H H'),
    row('4,4', 'H H H P P H H H H H'),
    row('3,3', 'P P P P P P H H H H'),
    row('2,2', 'P P P P P P H H H H'),
  ],
};

const chartCache = new Map<string, StrategyChartData>();

/** Rule-specific chart computed by the Python backend (POST /api/chart).
 *  Returns the last chart it had while a new one loads. */
export function useStrategyChart(rules: Rules) {
  const key = JSON.stringify(rules);
  const [state, setState] = useState<{ key?: string; chart?: StrategyChartData; error?: boolean }>(() => ({
    key: chartCache.has(key) ? key : undefined,
    chart: chartCache.get(key),
  }));

  useEffect(() => {
    const cached = chartCache.get(key);
    if (cached) {
      setState({ key, chart: cached });
      return;
    }
    const ctrl = new AbortController();
    fetch('/api/chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: key,
      signal: ctrl.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<StrategyChartData>;
      })
      .then((chart) => {
        chartCache.set(key, chart);
        setState({ key, chart });
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== 'AbortError') setState((s) => ({ ...s, error: true }));
      });
    return () => ctrl.abort();
  }, [key]);

  return {
    chart: state.chart ?? DEFAULT_CHART,
    loading: state.key !== key && !state.error,
    error: !!state.error && state.key !== key,
  };
}

export function StrategyTable({ rows, compact = false }: { rows: ChartRow[]; compact?: boolean }) {
  const cell = compact ? 'py-1 text-[clamp(0.55rem,2.3vw,0.7rem)]' : 'py-2 text-[clamp(0.6rem,2.6vw,0.8rem)]';
  return (
    // table-fixed + percentage columns: never wider than its container, so all 11 columns fit a phone.
    <table className="w-full table-fixed border-separate border-spacing-[2px] text-center font-semibold">
      <colgroup>
        <col className="w-[16%]" />
        {DEALER_UPCARDS.map((up) => (
          <col key={up} className="w-[8.4%]" />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className={`rounded-md bg-[var(--bg-third)] px-0 whitespace-nowrap text-[var(--text-muted)] ${cell}`}>
            Hand
          </th>
          {DEALER_UPCARDS.map((up) => (
            <th key={up} className={`rounded-md bg-[var(--bg-third)] px-0 text-[var(--text-primary)] ${cell}`}>
              {up}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.hand}>
            <td
              className={`rounded-md bg-[var(--bg-third)] px-0 tracking-tight whitespace-nowrap text-[var(--text-primary)] ${cell}`}
            >
              {r.hand}
            </td>
            {r.cells.map((code, i) => (
              <td
                key={i}
                title={`${r.hand} vs ${DEALER_UPCARDS[i]}: ${CODE_LABEL[code]}`}
                aria-label={`${r.hand} vs ${DEALER_UPCARDS[i]}: ${CODE_LABEL[code]}`}
                className={`rounded-md px-0 tracking-tight transition-colors duration-300 ${cell} ${CODE_STYLE[code]}`}
              >
                {code}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Legend({ codes }: { codes?: ActionCode[] }) {
  const entries = codes ?? (Object.keys(CODE_LABEL) as ActionCode[]);
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {entries.map((code) => (
        <div key={code} className="flex items-center gap-2">
          <span
            className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1 text-xs font-semibold ${CODE_STYLE[code]}`}
          >
            {code}
          </span>
          <span className="text-sm text-[var(--text-muted)]">{CODE_LABEL[code]}</span>
        </div>
      ))}
    </div>
  );
}
