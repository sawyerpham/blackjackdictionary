import type { Guide } from './registry';
import { GuideFormula, GuideH2, GuideNote, GuideOl, GuideP, GuideUl } from './ui';

interface SystemRow {
  system: string;
  level: number;
  balanced: boolean;
  bc: string;
  pe: string;
  ic: string;
}

const SYSTEM_ROWS: SystemRow[] = [
  { system: 'Hi-Lo', level: 1, balanced: true, bc: '0.97', pe: '0.51', ic: '0.76' },
  { system: 'KO', level: 1, balanced: false, bc: '0.98', pe: '0.55', ic: '0.78' },
  { system: 'Zen Count', level: 2, balanced: true, bc: '0.96', pe: '0.63', ic: '0.85' },
  { system: 'Omega II', level: 2, balanced: true, bc: '0.92', pe: '0.67', ic: '0.85' },
  { system: 'Hi-Opt II', level: 2, balanced: true, bc: '0.91', pe: '0.67', ic: '0.91' },
  { system: 'Wong Halves', level: 3, balanced: true, bc: '0.99', pe: '0.56', ic: '0.72' },
];

function SystemComparisonTable() {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full min-w-[30rem] border-separate border-spacing-0.5 text-center text-sm">
        <thead>
          <tr>
            <th className="rounded bg-[var(--bg-third)] p-2 text-left font-semibold text-[var(--text-primary)]">
              System
            </th>
            <th className="w-16 rounded bg-[var(--bg-third)] p-2 font-semibold text-[var(--text-primary)]">Level</th>
            <th className="w-24 rounded bg-[var(--bg-third)] p-2 font-semibold text-[var(--text-primary)]">
              Balanced
            </th>
            <th className="w-16 rounded bg-[var(--bg-third)] p-2 font-semibold text-[var(--text-primary)]">BC</th>
            <th className="w-16 rounded bg-[var(--bg-third)] p-2 font-semibold text-[var(--text-primary)]">PE</th>
            <th className="w-16 rounded bg-[var(--bg-third)] p-2 font-semibold text-[var(--text-primary)]">IC</th>
          </tr>
        </thead>
        <tbody>
          {SYSTEM_ROWS.map((r) => (
            <tr key={r.system}>
              <td className="rounded bg-[var(--bg-second)] p-2 text-left font-semibold text-[var(--text-primary)]">
                {r.system}
              </td>
              <td className="rounded bg-[var(--bg-second)] p-2">
                <span className="inline-block w-8 rounded bg-[var(--bg-third)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)]">
                  {r.level}
                </span>
              </td>
              <td className="rounded bg-[var(--bg-second)] p-2">
                <span
                  className={`inline-block rounded px-2.5 py-1 text-xs font-semibold ${
                    r.balanced ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-gray-900'
                  }`}
                >
                  {r.balanced ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="rounded bg-[var(--bg-second)] p-2 text-[var(--text-primary)]">{r.bc}</td>
              <td className="rounded bg-[var(--bg-second)] p-2 text-[var(--text-primary)]">{r.pe}</td>
              <td className="rounded bg-[var(--bg-second)] p-2 text-[var(--text-primary)]">{r.ic}</td>
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
        This is the introduction to card counting. Each counting system guide covers  
        what is specific to that system, and assumes the concepts here.
      </GuideP>

      <GuideH2 id="what-counting-does">What Counting Does</GuideH2>
      <GuideP>
        High cards (tens and aces) favor the player: more blackjacks, more dealer busts,
        stronger doubles. Low cards favor the dealer. Counting tracks the ratio of high to low
        cards left in the shoe, so you can bet more when the remaining cards favor you and less
        when they do not.
      </GuideP>
      <GuideP>
        Counting is legal, but casinos are
        private property. They can ask you for your ID, limit your bets, ask you to stop playing blackjack, or trespass you and blacklist you from their properties, if they suspect it, in that order.
      </GuideP>

      <GuideP>
        Do not count cards at a CSM table. CSM stands for continuous shuffling machine which constantly recycles cards, making counting impossible as you cannot know what cards remain.
      </GuideP>

      <GuideH2 id="where-the-edge-comes-from">Where the Edge Comes From</GuideH2>
      <GuideP>
        Counting turns the roughly 0.5% house edge into a small player edge, usually in the range
        of 0.5% to 1.5% when done well. It works over many hours and requires a bankroll large
        enough to absorb the swings.
      </GuideP>
      <GuideP>
        The edge comes from bet sizing, not from changing how you play hands. Betting more
        at high counts and the minimum at low counts is the single most important skill in counting. 
        Deviations from basic strategy add only a small amount on top, and are secondary to betting.
      </GuideP>

      <GuideH2 id="running-count">The Running Count</GuideH2>
      <GuideP>
        Every system assigns each card a value, called a tag. You keep a running tally, adding each
        card's tag as it appears. Count every card on the table: your cards, the other players'
        cards, and the dealer's. This single number is the running count.
      </GuideP>

      <GuideH2 id="balanced-unbalanced">Balanced and Unbalanced Systems</GuideH2>
      <GuideP>Systems come in two kinds.</GuideP>
      <GuideP>
        A balanced system uses tags that net to zero over a full deck. Balanced systems require a
        second step, converting the running count to a true count, described below. Their built-in
        accuracy check is that a full deck counted correctly returns to zero.
      </GuideP>
      <GuideP>
        An unbalanced system uses tags that do not net to zero over a deck. Instead of converting
        continuously, an unbalanced system builds the deck adjustment into a fixed starting number,
        which removes the true-count step. These systems trade a little accuracy for that
        convenience.
      </GuideP>

      <GuideH2 id="true-count">The True Count (balanced systems only)</GuideH2>
      <GuideP>
        The running count alone is ambiguous, because the same number means very different things
        depending on how many cards remain. A count of +6 with six decks left is weak; the same +6
        with one deck left is strong.
      </GuideP>
      <GuideFormula>True count = running count / decks remaining</GuideFormula>
      <GuideP>
        Estimate decks remaining by eye from the discard tray, where roughly one inch of stacked
        cards is one deck. You bet and deviate off the true count, not the running count.
        Unbalanced systems skip this entirely.
      </GuideP>

      <GuideH2 id="levels">Levels</GuideH2>
      <GuideP>A system's level is the range of tag values it uses.</GuideP>
      <GuideUl>
        <li>
          <strong>Level 1:</strong> tags never exceed +1 or -1. Easiest to run.
        </li>
        <li>
          <strong>Level 2:</strong> tags extend to +2 and -2. More accurate, more mental effort.
        </li>
        <li>
          <strong>Level 3 and fractional:</strong> tags reach +3, -3, or use half-points. Most
          accurate on paper, hardest to sustain live.
        </li>
      </GuideUl>
      <GuideP>
        Higher levels make finer distinctions between cards, which improves accuracy, but the added
        mental load produces more errors under real casino speed. A simple system run cleanly often
        beats a complex one run poorly.
      </GuideP>

      <GuideH2 id="measuring">How Systems Are Measured</GuideH2>
      <GuideP>Three numbers, each from 0 to 1, describe a system's accuracy.</GuideP>
      <GuideUl>
        <li>
          <strong>Betting Correlation (BC):</strong> how well the tags predict the right bet size.
          This is the most important metric in six and eight deck shoe games.
        </li>
        <li>
          <strong>Playing Efficiency (PE):</strong> how well the count signals when to deviate from
          basic strategy. More important in one and two deck games.
        </li>
        <li>
          <strong>Insurance Correlation (IC):</strong> how well the count calls the insurance
          decision.
        </li>
      </GuideUl>
      <GuideP>
        One tradeoff worth knowing: counting the ace as a high card helps betting correlation,
        because aces drive blackjacks. Some level-2 systems treat the ace as neutral to raise
        playing efficiency, then keep a separate side count of aces to restore betting accuracy.
      </GuideP>
      <SystemComparisonTable />
      <GuideNote>
        The differences between systems are small. Table selection and bet spread affect your
        results far more than which of these you choose.
      </GuideNote>

      <GuideH2 id="bet-spread">The Bet Spread</GuideH2>
      <GuideP>
        The bet spread is the ratio between your maximum and minimum bet. It drives most of the
        edge. A wider spread earns more, swings harder, and draws more attention. A spread that is
        too tight does not beat the game at all, no matter how well you count. For a single player
        on a shoe, a 1-to-8 spread is already aggressive.
      </GuideP>
      <GuideP>
        To reduce attention, raise your bet after a win and lower it after a loss where possible,
        so the changes look like ordinary streak play.
      </GuideP>

      <GuideH2 id="deviations">Deviations</GuideH2>
      <GuideP>
        At extreme counts, a small number of basic-strategy plays become incorrect and change.
        These are called deviations or index plays, and each has a trigger number. Deviations are
        secondary to betting and add only a small amount on top. Insurance is the single most
        valuable deviation across every system. Learn deviations only after your count and bet
        spread are reliable.
      </GuideP>

      <GuideH2 id="edge-factors">What Determines Your Edge</GuideH2>
      <GuideP>Ranked by impact, largest first.</GuideP>
      <GuideOl>
        <li>
          <strong>Payout.</strong> A 6:5 table adds about 1.4% to the house edge and makes counting
          nearly pointless. Only play 3:2.
        </li>
        <li>
          <strong>Penetration.</strong> How deep the dealer goes before shuffling. Deeper dealing
          is worth more than the system you use.
        </li>
        <li>
          <strong>Bet spread and bankroll.</strong>
        </li>
        <li>
          <strong>Rules.</strong> Dealer stands on soft 17, double after split, and surrender all
          help.
        </li>
        <li>
          <strong>System choice.</strong> The smallest factor of the five.
        </li>
      </GuideOl>

      <GuideH2 id="bankroll">Bankroll and Risk</GuideH2>
      <GuideP>
        Counting wins slowly and loses often in the short run. Bankroll is measured in units, where
        one unit is your minimum bet. Too small a bankroll relative to your spread means a normal
        losing streak can wipe you out before the edge appears. A real spread wants a bankroll on
        the order of hundreds of units. Only ever play with money you can afford to lose.
      </GuideP>

      <GuideH2 id="heat">Heat</GuideH2>
      <GuideP>
        Because casinos can act against suspected counters, the goal is to not look like one. The
        bet spread is the main tell, since a counter's bets rise and fall with the count while a
        flat bettor's do not. Cover behavior, such as drinking, talking, and betting a beat
        imperfectly, lowers attention. Sessions that are short, lower-stakes, and clean draw the
        least scrutiny.
      </GuideP>

      <GuideH2 id="learning-order">Learning Order</GuideH2>
      <GuideP>Every system follows the same path.</GuideP>
      <GuideOl>
        <li>Make the tags automatic.</li>
        <li>Count down a full deck or shoe without error.</li>
        <li>For balanced systems, add the true-count conversion.</li>
        <li>Build a bet spread.</li>
        <li>Add deviations, starting with insurance.</li>
      </GuideOl>
    </>
  );
}

export const cardCountingOverviewGuide: Guide = {
  slug: 'card-counting-overview',
  title: 'Card Counting: Overview',
  description: 'The shared foundation and common concepts behind every counting system',
  sections: [
    { id: 'what-counting-does', title: 'What Counting Does' },
    { id: 'where-the-edge-comes-from', title: 'Where the Edge Comes From' },
    { id: 'running-count', title: 'The Running Count' },
    { id: 'balanced-unbalanced', title: 'Balanced and Unbalanced Systems' },
    { id: 'true-count', title: 'The True Count' },
    { id: 'levels', title: 'Levels' },
    { id: 'measuring', title: 'How Systems Are Measured' },
    { id: 'bet-spread', title: 'The Bet Spread' },
    { id: 'deviations', title: 'Deviations' },
    { id: 'edge-factors', title: 'What Determines Your Edge' },
    { id: 'bankroll', title: 'Bankroll and Risk' },
    { id: 'heat', title: 'Heat' },
    { id: 'learning-order', title: 'Learning Order' },
  ],
  Content,
};
