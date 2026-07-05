import type { Guide } from './registry';
import { GuideH2, GuideNote } from './ui';

export type ActionCode = 'S' | 'H' | 'D' | 'Ds' | 'P' | 'Rh' | 'Rp';

const CODE_STYLE: Record<ActionCode, string> = {
  S: 'bg-emerald-600 text-white',
  H: 'bg-red-500 text-white',
  D: 'bg-amber-400 text-gray-900',
  Ds: 'bg-amber-400 text-gray-900',
  P: 'bg-blue-500 text-white',
  Rh: 'bg-violet-500 text-white',
  Rp: 'bg-violet-500 text-white',
};

const CODE_LABEL: Record<ActionCode, string> = {
  S: 'Stand',
  H: 'Hit',
  D: 'Double, else hit',
  Ds: 'Double, else stand',
  P: 'Split',
  Rh: 'Surrender, else hit',
  Rp: 'Surrender, else split',
};

const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

interface ChartRow {
  hand: string;
  cells: ActionCode[];
}

function row(hand: string, codes: string): ChartRow {
  return { hand, cells: codes.split(' ') as ActionCode[] };
}

export const HARD_TOTALS: ChartRow[] = [
  row('17+', 'S S S S S S S S S S'),
  row('16', 'S S S S S H H Rh Rh Rh'),
  row('15', 'S S S S S H H H Rh Rh'),
  row('14', 'S S S S S H H H H H'),
  row('13', 'S S S S S H H H H H'),
  row('12', 'H H S S S H H H H H'),
  row('11', 'D D D D D D D D D D'),
  row('10', 'D D D D D D D D H H'),
  row('9', 'H D D D D H H H H H'),
  row('8', 'H H H H H H H H H H'),
];

export const SOFT_TOTALS: ChartRow[] = [
  row('A,9', 'S S S S S S S S S S'),
  row('A,8', 'S S S S Ds S S S S S'),
  row('A,7', 'Ds Ds Ds Ds Ds S S H H H'),
  row('A,6', 'H D D D D H H H H H'),
  row('A,5', 'H H D D D H H H H H'),
  row('A,4', 'H H D D D H H H H H'),
  row('A,3', 'H H H D D H H H H H'),
  row('A,2', 'H H H D D H H H H H'),
];

export const PAIRS: ChartRow[] = [
  row('A,A', 'P P P P P P P P P P'),
  row('10,10', 'S S S S S S S S S S'),
  row('9,9', 'P P P P P S P P S S'),
  row('8,8', 'P P P P P P P P P Rp'),
  row('7,7', 'P P P P P P H H H H'),
  row('6,6', 'P P P P P H H H H H'),
  row('5,5', 'D D D D D D D D H H'),
  row('4,4', 'H H H P P H H H H H'),
  row('3,3', 'P P P P P P H H H H'),
  row('2,2', 'P P P P P P H H H H'),
];

export function StrategyTable({ rows }: { rows: ChartRow[] }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="border-separate border-spacing-0.5 text-center text-xs font-semibold">
        <thead>
          <tr>
            <th className="rounded bg-[var(--bg-third)] px-2 py-1.5 text-[var(--text-primary)]">Hand</th>
            {DEALER_UPCARDS.map((up) => (
              <th key={up} className="min-w-8 rounded bg-[var(--bg-third)] px-1 py-1.5 text-[var(--text-primary)]">
                {up}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.hand}>
              <td className="rounded bg-[var(--bg-third)] px-2 py-1.5 text-[var(--text-primary)]">{r.hand}</td>
              {r.cells.map((code, i) => (
                <td key={i} title={CODE_LABEL[code]} className={`rounded px-1 py-1.5 ${CODE_STYLE[code]}`}>
                  {code}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Legend() {
  const entries: ActionCode[] = ['S', 'H', 'D', 'Ds', 'P', 'Rh', 'Rp'];
  return (
    <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {entries.map((code) => (
        <div key={code} className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm font-semibold ${CODE_STYLE[code]}`}
          >
            {code}
          </span>
          <span className="text-sm text-[var(--text-primary)]">{CODE_LABEL[code]}</span>
        </div>
      ))}
    </div>
  );
}

function Content() {
  return (
    <>
      <GuideH2 id="legend">Legend</GuideH2>
      <Legend />

      <GuideH2 id="hard-totals">Hard Totals</GuideH2>
      <StrategyTable rows={HARD_TOTALS} />

      <GuideH2 id="soft-totals">Soft Totals</GuideH2>
      <StrategyTable rows={SOFT_TOTALS} />

      <GuideH2 id="pairs">Pairs</GuideH2>
      <StrategyTable rows={PAIRS} />

      <GuideH2 id="notes">Notes</GuideH2>
      <GuideNote>
        Dealer 2–6 = weak (let the dealer bust) · 7–A = strong (fight for a total).
      </GuideNote>
    </>
  );
}

export const basicStrategyGuide: Guide = {
  slug: 'basic-strategy-chart',
  title: 'Basic Strategy Chart',
  description: 'The full chart for 4–8 decks, H17, DAS, late surrender',
  sections: [
    { id: 'legend', title: 'How to Read the Chart' },
    { id: 'hard-totals', title: 'Hard Totals' },
    { id: 'soft-totals', title: 'Soft Totals' },
    { id: 'pairs', title: 'Pairs' },
    { id: 'notes', title: 'Notes' },
  ],
  Content,
};
