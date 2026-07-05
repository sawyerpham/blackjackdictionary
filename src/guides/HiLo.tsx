import type { Guide } from './registry';
import { GuideH2, GuideH3, GuideNote, GuideP, TagValuesTable } from './ui';

type Action = 'Stand' | 'Double' | 'Split' | 'Insurance' | 'Surrender';

const ACTION_STYLE: Record<Action, string> = {
  Stand: 'bg-emerald-600 text-white',
  Double: 'bg-amber-400 text-gray-900',
  Split: 'bg-blue-500 text-white',
  Insurance: 'bg-violet-500 text-white',
  Surrender: 'bg-violet-500 text-white',
};

function ActionBadge({ action, label }: { action: Action; label?: string }) {
  return (
    <span
      className={`inline-block rounded px-2.5 py-1 text-xs font-semibold ${ACTION_STYLE[action]}`}
    >
      {label ?? action}
    </span>
  );
}

function IndexChip({ index }: { index: number }) {
  return (
    <span className="inline-block w-10 rounded bg-[var(--bg-third)] px-2 py-1 text-center text-xs font-semibold text-[var(--text-primary)]">
      {index > 0 ? `+${index}` : index}
    </span>
  );
}

const HI_LO_TAGS = [
  { cards: '2, 3, 4, 5, 6', value: '+1', tone: 'plus' as const },
  { cards: '7, 8, 9', value: '0', tone: 'zero' as const },
  { cards: '10, J, Q, K, A', value: '-1', tone: 'minus' as const },
];

interface DeviationRow {
  order: number;
  play: string;
  index: number;
  action: Action;
  actionLabel?: string;
}

const ILLUSTRIOUS_18: DeviationRow[] = [
  { order: 1, play: 'Insurance', index: 3, action: 'Insurance', actionLabel: 'Take insurance' },
  { order: 2, play: '16 vs 10', index: 0, action: 'Stand' },
  { order: 3, play: '15 vs 10', index: 4, action: 'Stand' },
  { order: 4, play: '10,10 vs 5', index: 5, action: 'Split' },
  { order: 5, play: '10,10 vs 6', index: 4, action: 'Split' },
  { order: 6, play: '10 vs 10', index: 4, action: 'Double' },
  { order: 7, play: '12 vs 3', index: 2, action: 'Stand' },
  { order: 8, play: '12 vs 2', index: 3, action: 'Stand' },
  { order: 9, play: '11 vs A', index: 1, action: 'Double' },
  { order: 10, play: '9 vs 2', index: 1, action: 'Double' },
  { order: 11, play: '10 vs A', index: 4, action: 'Double' },
  { order: 12, play: '9 vs 7', index: 3, action: 'Double' },
  { order: 13, play: '16 vs 9', index: 5, action: 'Stand' },
  { order: 14, play: '13 vs 2', index: -1, action: 'Stand' },
  { order: 15, play: '12 vs 4', index: 0, action: 'Stand' },
  { order: 16, play: '12 vs 5', index: -2, action: 'Stand' },
  { order: 17, play: '12 vs 6', index: -1, action: 'Stand' },
  { order: 18, play: '13 vs 3', index: -2, action: 'Stand' },
];

const FAB_4: DeviationRow[] = [
  { order: 1, play: '14 vs 10', index: 3, action: 'Surrender' },
  { order: 2, play: '15 vs 10', index: 0, action: 'Surrender' },
  { order: 3, play: '15 vs 9', index: 2, action: 'Surrender' },
  { order: 4, play: '15 vs A', index: 1, action: 'Surrender' },
];

function DeviationTable({ rows, actionHeader }: { rows: DeviationRow[]; actionHeader: string }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full min-w-[28rem] border-separate border-spacing-0.5 text-center text-sm">
        <thead>
          <tr>
            <th className="w-16 rounded bg-[var(--bg-third)] p-2 font-semibold text-[var(--text-primary)]">#</th>
            <th className="rounded bg-[var(--bg-third)] p-2 font-semibold text-[var(--text-primary)]">Play</th>
            <th className="w-20 rounded bg-[var(--bg-third)] p-2 font-semibold text-[var(--text-primary)]">Index</th>
            <th className="rounded bg-[var(--bg-third)] p-2 font-semibold text-[var(--text-primary)]">
              {actionHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.order}>
              <td className="rounded bg-[var(--bg-second)] p-2 text-[var(--text-muted)]">{r.order}</td>
              <td className="rounded bg-[var(--bg-second)] p-2 font-semibold text-[var(--text-primary)]">
                {r.play}
              </td>
              <td className="rounded bg-[var(--bg-second)] p-2">
                <IndexChip index={r.index} />
              </td>
              <td className="rounded bg-[var(--bg-second)] p-2">
                <ActionBadge action={r.action} label={r.actionLabel} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BetSpreadTable() {
  const rows = [
    { spread: '1 to 5 units', penetration: '4.5 decks', advantage: '~0.30%' },
    { spread: '1 to 10 units', penetration: '4.5 decks', advantage: '~0.59%' },
    { spread: '1 to 15 units', penetration: '5 decks', advantage: '~1.15%' },
  ];
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full min-w-[24rem] border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--bg-third)] text-left">
            <th className="rounded-tl-lg p-3 font-semibold text-[var(--text-primary)]">Bet spread</th>
            <th className="p-3 font-semibold text-[var(--text-primary)]">Penetration</th>
            <th className="rounded-tr-lg p-3 font-semibold text-[var(--text-primary)]">Player advantage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.spread} className="border-b border-white/10">
              <td className="p-3 font-medium text-[var(--text-primary)]">{r.spread}</td>
              <td className="p-3 text-[var(--text-muted)]">{r.penetration}</td>
              <td className="p-3 font-medium text-[var(--accent-soft)]">{r.advantage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Content() {
  return (
    <>
      <GuideP>
        Hi-Lo is the most widely used card counting system: a balanced, level-1 count that is easy
        to run and gives up little accuracy for its simplicity. This guide covers what is specific
        to Hi-Lo and its deviations, and assumes basic strategy and the shared card counting
        overview.
      </GuideP>

      <GuideH2 id="hi-lo-count">The Hi-Lo Count</GuideH2>
      <GuideP>
        Each card is assigned a value. You keep a single running tally as cards appear.
      </GuideP>
      <TagValuesTable rows={HI_LO_TAGS} />
      <GuideP>
        The system is balanced. A full shoe counted correctly nets to exactly zero, which is a
        built-in accuracy check.
      </GuideP>

      <GuideH2 id="running-count">Counting in Practice</GuideH2>
      <GuideP>Start at zero when the shoe is shuffled and keep the tally as cards appear.</GuideP>
      <GuideH3>Example</GuideH3>
      <GuideP>
        The first ten cards that appear on a table are 3, 5, K, 7, Q, A, 8, 5, 4, 2. The running
        count is +1, +1, -1, 0, -1, -1, 0, +1, +1, +1, for a total of +2.
      </GuideP>
      <GuideP>
        Hi-Lo is balanced, so convert to a true count as the overview describes before betting or
        deviating.
      </GuideP>
      <GuideH3>Example</GuideH3>
      <GuideP>
        The running count is +7 with about 4 decks left. True count is 7 / 4, or roughly +2. Round
        to keep it simple.
      </GuideP>

      <GuideH2 id="betting">Betting the Count</GuideH2>
      <GuideP>
        
        In a six-deck game, a 1-to-15 spread is about as aggressive as is practical for Hi-Lo.
        Approximate player advantage for a six-deck S17 game with the Illustrious 18 and Fab 4 in
        use:
      </GuideP>
      <BetSpreadTable />

      <GuideH2 id="illustrious-18">The Illustrious 18</GuideH2>
      <GuideP>
        These are the eighteen most valuable deviations for Hi-Lo, ranked by value, calculated for
        a multi-deck S17 game. They capture roughly 80 to 85 percent of the total gain available
        from all deviations, adding about 0.1% to 0.2% on top of betting. Learn them from the top
        of the list down: insurance and 16 vs 10 first.
      </GuideP>
      <GuideNote>
        Reading rule: stand, double, or split if the true count is equal to or greater than the
        index; otherwise hit. Take insurance if the true count is +3 or higher.
      </GuideNote>
      <DeviationTable rows={ILLUSTRIOUS_18} actionHeader="Action at or above index" />
      <GuideP>
        Items 14 through 18 are the reverse pattern. Basic strategy already stands on these hands.
        The deviation is to hit when the count drops below the index, because a low count means
        fewer tens and less reason to stand on a stiff hand.
      </GuideP>

      <GuideH2 id="fab-4">The Fab 4 Surrenders</GuideH2>
      <GuideP>
        These four surrender deviations are separate from the Illustrious 18 but also high value.
        Use them only if the table offers late surrender.
      </GuideP>
      <GuideNote>
        Reading rule: surrender if the true count is equal to or greater than the index; otherwise
        follow basic strategy.
      </GuideNote>
      <DeviationTable rows={FAB_4} actionHeader="Action at or above index" />

      <GuideH2 id="notes">Notes and Cautions</GuideH2>
      <GuideP>
        These indices are for S17 games. On an H17 game a few shift by about one point. The most
        notable difference is 11 vs A, which is already a basic-strategy double in H17 and needs no
        deviation.
      </GuideP>
      <GuideP>
        Splitting tens, items 4 and 5, draws heavy attention from the pit because ordinary players
        never break a 20. Some counters drop those two plays and use the remaining set, known as
        the Sweet 16, to reduce heat.
      </GuideP>
    </>
  );
}

export const hiloGuide: Guide = {
  slug: 'hi-lo-illustrious-18',
  title: 'Hi-Lo System',
  description: 'A balanced level-1 count with valuable deviations',
  sections: [
    { id: 'hi-lo-count', title: 'The Hi-Lo Count' },
    { id: 'running-count', title: 'Counting in Practice' },
    { id: 'betting', title: 'Betting the Count' },
    { id: 'illustrious-18', title: 'The Illustrious 18' },
    { id: 'fab-4', title: 'The Fab 4 Surrenders' },
    { id: 'notes', title: 'Notes and Cautions' },
  ],
  Content,
};
