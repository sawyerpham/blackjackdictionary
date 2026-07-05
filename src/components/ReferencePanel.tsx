import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HARD_TOTALS,
  Legend,
  PAIRS,
  SOFT_TOTALS,
  StrategyTable,
} from '../guides/BasicStrategyChart';
import { getCountingSystem, type CountingSystemKey } from '../engine/countingSystems';
import { TagValuesTable, type TagTone } from '../guides/ui';

/** Full-guide slug for each counting system, matching the guide registry. */
const SYSTEM_GUIDE_SLUGS: Record<CountingSystemKey, string> = {
  hiLo: 'hi-lo-illustrious-18',
  ko: 'ko',
  hiOpt2: 'hi-opt-2',
  omega2: 'omega-2',
  zen: 'zen',
  halves: 'wong-halves',
};

/** Rank labels indexed like CountingSystem.values: [A, 2..9, 10]. */
function rankLabel(i: number): string {
  if (i === 0) return 'A';
  if (i === 9) return '10, J, Q, K';
  return String(i + 1);
}

/** Groups a system's per-rank values into chart-style rows (2..10 first, ace last). */
function tagRows(values: number[]) {
  const order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  const groups = new Map<number, string[]>();
  for (const i of order) {
    const cards = groups.get(values[i]) ?? [];
    cards.push(rankLabel(i));
    groups.set(values[i], cards);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([value, cards]) => ({
      cards: cards.join(', '),
      value: value > 0 ? `+${value}` : String(value),
      tone: (value > 0 ? 'plus' : value < 0 ? 'minus' : 'zero') as TagTone,
    }));
}

/** Section heading that links to the full guide. */
function PanelHeading({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <h3 className="mb-4 border-b border-white/10 pb-2 text-xl font-semibold">
      <Link
        to={to}
        className="text-[var(--text-primary)] transition-colors hover:text-[var(--accent)] hover:underline"
      >
        {children} →
      </Link>
    </h3>
  );
}

function PanelSubheading({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-2 mt-4 text-sm font-semibold text-[var(--accent-soft)]">{children}</h4>;
}

export function ReferencePanel({
  open,
  onClose,
  systemKey,
  decks,
}: {
  open: boolean;
  onClose: () => void;
  systemKey: CountingSystemKey | undefined;
  decks: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const system = getCountingSystem(systemKey);
  const irc = system.initialRunningCount?.(decks) ?? 0;

  return (
    <aside
      aria-label="Reference"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md animate-[reference-slide-in_0.25s_ease-out] overflow-y-auto border-l border-white/10 bg-[var(--bg-main)] shadow-2xl"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[var(--bg-main)] px-4 py-4">
        <h2 className="text-lg font-bold text-[var(--accent)]">Reference</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Close
        </button>
      </div>

      <div className="space-y-10 px-4 py-6">
        <section>
          <PanelHeading to={`/guides/${SYSTEM_GUIDE_SLUGS[system.key]}`}>
            Counting: {system.label}
          </PanelHeading>
          <p className="mb-4 text-sm leading-relaxed text-[var(--text-muted)]">
            {system.description}.
          </p>
          <TagValuesTable rows={tagRows(system.values)} />
          <p className="mb-4 text-sm leading-relaxed text-[var(--text-primary)]">
            {system.balanced
              ? 'Balanced count: start at 0 on a fresh shoe.'
              : `Unbalanced count: start a fresh ${decks}-deck shoe at ${irc}.`}{' '}
            {system.usesTrueCount
              ? 'Divide the running count by the decks remaining to get the true count, and bet off that.'
              : 'No true-count conversion needed — bet off the running count directly.'}
          </p>
          <p className="mb-2 text-xs leading-relaxed text-[var(--text-muted)]">
            Changes when you change the counting system
          </p>
        </section>
        <section>
          <PanelHeading to="/guides/basic-strategy-chart">Basic Strategy</PanelHeading>
          <Legend />
          <PanelSubheading>Hard Totals</PanelSubheading>
          <StrategyTable rows={HARD_TOTALS} />
          <PanelSubheading>Soft Totals</PanelSubheading>
          <StrategyTable rows={SOFT_TOTALS} />
          <PanelSubheading>Pairs</PanelSubheading>
          <StrategyTable rows={PAIRS} />
        </section>

      </div>
    </aside>
  );
}
