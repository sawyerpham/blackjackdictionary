import type { Guide } from './registry';
import { GuideFormula, GuideH2, GuideNote, GuideP, TagValuesTable } from './ui';

const KO_TAGS = [
  { cards: '2, 3, 4, 5, 6, 7', value: '+1', tone: 'plus' as const },
  { cards: '8, 9', value: '0', tone: 'zero' as const },
  { cards: '10, J, Q, K, A', value: '-1', tone: 'minus' as const },
];

/** Two-column decks table with signed count chips, matching the deviation-table look. */
function DeckCountTable({ valueHeader, rows }: { valueHeader: string; rows: [number, number][] }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full min-w-[16rem] border-separate border-spacing-0.5 text-center text-sm font-semibold">
        <thead>
          <tr>
            <th className="rounded bg-[var(--bg-third)] p-2 text-[var(--text-primary)]">Decks</th>
            <th className="rounded bg-[var(--bg-third)] p-2 text-[var(--text-primary)]">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([decks, value]) => (
            <tr key={decks}>
              <td className="rounded bg-[var(--bg-second)] p-2 text-[var(--text-primary)]">{decks}</td>
              <td className="rounded bg-[var(--bg-second)] p-2">
                <span className="inline-block w-12 rounded bg-[var(--bg-third)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)]">
                  {value > 0 ? `+${value}` : value}
                </span>
              </td>
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
        KO is an unbalanced, level-1 system. Its one defining feature is that it removes the
        true-count conversion, so you work with a single running number from start to finish. This
        guide covers only what is specific to KO and assumes the shared card counting overview for
        the general concepts.
      </GuideP>

      <GuideH2 id="why-ko-exists">Why KO Exists</GuideH2>
      <GuideP>
        Balanced systems make you divide the running count by the decks remaining on every betting
        decision. KO removes that step. It builds all of the deck adjustment into the number you
        start with, so you never convert anything during play. That is the entire appeal, and the
        reason it trades away a small amount of accuracy.
      </GuideP>

      <GuideH2 id="tags">The Card Tags</GuideH2>
      <TagValuesTable rows={KO_TAGS} />
      <GuideNote>
        The one tag that is easy to miss: the 7 counts as +1, grouped with the low cards. That
        single card is what makes the system unbalanced. There are 24 cards tagged +1 and 20 tagged
        -1, so a full deck nets to +4 rather than zero.
      </GuideNote>

      <GuideH2 id="starting-count">The Starting Count</GuideH2>
      <GuideP>
        You do not start at zero. Your starting number, called the initial running count, is set by
        the number of decks.
      </GuideP>
      <GuideFormula>Initial running count = 4 - (4 x number of decks)</GuideFormula>
      <DeckCountTable
        valueHeader="Start at"
        rows={[
          [1, 0],
          [2, -4],
          [6, -20],
          [8, -28],
        ]}
      />
      <GuideP>
        This starting number is the mechanism that lets KO skip conversion. By starting further
        negative for more decks, the two thresholds below always land on the same fixed numbers no
        matter the deck count.
      </GuideP>

      <GuideH2 id="key-count">The Key Count</GuideH2>
      <GuideP>
        The key count is the running count at which the deck turns favorable and you begin raising
        your bet. Below it, bet the table minimum.
      </GuideP>
      <DeckCountTable
        valueHeader="Key count"
        rows={[
          [1, 2],
          [2, 1],
          [6, -4],
          [8, -6],
        ]}
      />

      <GuideH2 id="pivot">The Pivot</GuideH2>
      <GuideP>
        The pivot is +4, and it is the same for every deck count. It is the point where your
        advantage is known most reliably and where you place your largest bets. Between the key
        count and the pivot, raise your bet as the count climbs; at the pivot and above, bet your
        top amounts.
      </GuideP>

      <GuideH2 id="insurance">Insurance</GuideH2>
      <GuideP>
        Take insurance when the running count is +3 or higher, at any deck count. Two things that
        are easy to miss and matter: this is the plain running count, since KO uses no true count,
        so +3 means +3 as-is; and because the starting number normalizes everything, this same +3
        applies whether you are at a single-deck or an eight-deck game.
      </GuideP>

      <GuideH2 id="accuracy-check">The Accuracy Check</GuideH2>
      <GuideP>
        A balanced system checks itself by returning to zero at the end of a deck. KO returns to
        +4. Because you start at 4 minus 4 per deck and each deck adds +4 over its life, a full
        shoe counted correctly ends at exactly +4. Landing on any other number means you made an
        error.
      </GuideP>
    </>
  );
}

export const knockOutGuide: Guide = {
  slug: 'ko',
  title: 'Knock-Out System',
  description: 'A level-1 unbalanced count that trades a little accuracy for no true-count math',
  sections: [
    { id: 'why-ko-exists', title: 'Why KO Exists' },
    { id: 'tags', title: 'The Card Tags' },
    { id: 'starting-count', title: 'The Starting Count' },
    { id: 'key-count', title: 'The Key Count' },
    { id: 'pivot', title: 'The Pivot' },
    { id: 'insurance', title: 'Insurance' },
    { id: 'accuracy-check', title: 'The Accuracy Check' },
  ],
  Content,
};
