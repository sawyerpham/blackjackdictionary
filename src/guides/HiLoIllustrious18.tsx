import type { Guide } from './registry';
import { GuideFormula, GuideH2, GuideH3, GuideNote, GuideOl, GuideP, TagValuesTable } from './ui';

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
              <td className="p-3 font-medium text-emerald-400">{r.advantage}</td>
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
        Hi-Lo is the most widely used card counting system. This guide covers how it works, how to
        bet with it, and the Illustrious 18 deviations that adjust play at high and low counts. It
        assumes you already know basic strategy.
      </GuideP>

      <GuideH2 id="what-counting-does">What Counting Does</GuideH2>
      <GuideP>
        Hi-Lo tracks whether the cards left in the shoe favor the player or the dealer. A shoe rich
        in tens and aces favors the player: more blackjacks, more dealer busts, better doubles. A
        shoe rich in low cards favors the dealer.
      </GuideP>
      <GuideP>
        Counting turns the roughly 0.5% house edge into a small player edge, usually in the range
        of 0.5% to 1.5% when done well. It works over many hours and requires a large bankroll to
        survive normal swings. It is legal, but casinos are private property and can bar players
        they suspect of counting.
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

      <GuideH2 id="running-count">Running Count</GuideH2>
      <GuideP>
        Start at zero when the shoe is shuffled. Add each card's value as it appears, including
        your cards, other players' cards, and the dealer's.
      </GuideP>
      <GuideH3>Example</GuideH3>
      <GuideP>
        The first ten cards that appear on a table are 3, 5, K, 7, Q, A, 8, 5, 4, 2. The running count is +1, +1, -1, 0,
        -1, -1, 0, +1, +1, +1, for a total of +2.
      </GuideP>

      <GuideH2 id="true-count">True Count</GuideH2>
      <GuideP>
        The running count alone is not enough to bet on, because the same number means different
        things depending on how many cards remain. The true count corrects for this.
      </GuideP>
      <GuideFormula>True count = running count / decks remaining</GuideFormula>
      <GuideP>
        Estimate decks remaining by eye, using the discard tray. One deck is about one inch of
        stacked cards.
      </GuideP>
      <GuideH3>Example</GuideH3>
      <GuideP>
        The running count is +7 with about 4 decks left. True count is 7 / 4, or roughly +2. Round
        to keep it simple.
      </GuideP>
      <GuideNote>
        The true count, not the running count, drives every betting and playing decision.
      </GuideNote>

      <GuideH2 id="betting">Betting the Count</GuideH2>
      <GuideP>
        Bet more as the true count rises, and drop to the minimum when it is low or negative. This
        bet spread is where most of the counting edge comes from.
      </GuideP>
      <GuideP>
        The larger the spread, the larger the edge and the larger the swings. A wider spread also
        draws more attention. In a six-deck game, a 1-to-15 spread is about as aggressive as is
        practical.
      </GuideP>
      <GuideP>
        Approximate player advantage for a six-deck S17 game with the Illustrious 18 and Fab 4 in
        use:
      </GuideP>
      <BetSpreadTable />
      <GuideP>
        Deeper penetration and a wider spread both raise the edge. To reduce heat, raise the bet
        only after a win and lower it only after a loss.
      </GuideP>

      <GuideH2 id="deviations">Playing Deviations</GuideH2>
      <GuideP>
        Basic strategy is calculated for a neutral count. At high or low counts, a small number of
        plays change. A deviation is a departure from the chart triggered when the true count
        is at or above a set number, called the index.
      </GuideP>
      <GuideP>
        Deviations are secondary to betting. Betting the count correctly captures most of the edge.
        Deviations add roughly 0.1% to 0.2% on top. Learn them only after your count and bet spread
        are solid.
      </GuideP>

      <GuideH2 id="illustrious-18">The Illustrious 18</GuideH2>
      <GuideP>
        These are the eighteen most valuable deviations, ranked by value, calculated for Hi-Lo on a
        multi-deck S17 game. They capture roughly 80 to 85 percent of the total gain available from
        all deviations.
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

      <GuideH2 id="learning-order">Learning Order</GuideH2>
      <GuideOl>
        <li>Get the running count automatic. Count down a full deck to zero in under 30 seconds.</li>
        <li>Add true-count conversion. Divide the running count by decks remaining.</li>
        <li>Add the bet spread. This is where the edge lives.</li>
        <li>
          Add deviations last, starting from the top of the list. Insurance and 16 vs 10 come
          first, then work down.
        </li>
      </GuideOl>
    </>
  );
}

export const hiLoIllustrious18Guide: Guide = {
  slug: 'hi-lo-illustrious-18',
  title: 'Hi-Lo & the Illustrious 18',
  description: 'Counting the shoe, betting the count, and the deviations that matter',
  sections: [
    { id: 'what-counting-does', title: 'What Counting Does' },
    { id: 'hi-lo-count', title: 'The Hi-Lo Count' },
    { id: 'running-count', title: 'Running Count' },
    { id: 'true-count', title: 'True Count' },
    { id: 'betting', title: 'Betting the Count' },
    { id: 'deviations', title: 'Playing Deviations' },
    { id: 'illustrious-18', title: 'The Illustrious 18' },
    { id: 'fab-4', title: 'The Fab 4 Surrenders' },
    { id: 'notes', title: 'Notes and Cautions' },
    { id: 'learning-order', title: 'Learning Order' },
  ],
  Content,
};
