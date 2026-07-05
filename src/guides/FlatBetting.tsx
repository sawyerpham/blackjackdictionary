import type { Guide } from './registry';
import { GuideH2, GuideH3, GuideNote, GuideP, GuideUl } from './ui';

const HOUSE_EDGE_ROWS = [
  {
    ruleset: 'Vegas Strip (standard)',
    rules: '6–8 decks, dealer hits soft 17, double after split',
    edge: '~0.60%',
  },
  {
    ruleset: 'Vegas Strip (better tables)',
    rules: '6 decks, dealer stands soft 17, double after split',
    edge: '~0.40%',
  },
  {
    ruleset: 'Atlantic City',
    rules: '8 decks, dealer stands soft 17, double after split, late surrender',
    edge: '~0.45%',
  },
  {
    ruleset: 'European (no-hole-card)',
    rules: '2–6 decks, dealer stands soft 17, double on 9–11 only, no surrender',
    edge: '~0.55%',
  },
];

function Content() {
  return (
    <>
      <GuideP>
        Flat betting means wagering the same fixed amount on every hand, regardless of prior wins,
        losses, or streaks. This guide covers why it is the correct approach for a basic-strategy
        player and how table rules affect the outcome.
      </GuideP>

      <GuideH2 id="what-it-is">What It Is</GuideH2>
      <GuideP>
        You pick one bet size and keep it constant. A $25 flat bettor bets $25 every hand, whether
        they just won five in a row or lost five in a row. Bet size never reacts to results.
      </GuideP>

      <GuideH2 id="why-flat-bet">Why Flat Bet</GuideH2>
      <GuideP>
        Flat betting produces the lowest variance of any betting approach. Results track the house
        edge directly, without the large swings that betting progressions create.
      </GuideP>
      <GuideP>
        Betting systems such as Martingale or Paroli do not change the house edge. They only change
        the order in which wins and losses arrive. A progression can produce many small wins
        followed by one large loss that erases them. Flat betting avoids that trap.
      </GuideP>
      <GuideP>
        For a player using basic strategy and not counting cards, no information justifies changing
        the bet. Raising or lowering it adds risk without adding value.
      </GuideP>

      <GuideH2 id="what-it-does-not-do">What It Does Not Do</GuideH2>
      <GuideP>
        Flat betting does not beat the house. Basic strategy combined with flat betting minimizes
        the loss rate; it does not make the game profitable. Over enough hands, a flat bettor loses
        at the house-edge rate for the table.
      </GuideP>
      <GuideP>
        Only card counting, which varies bet size in response to a real change in the odds, can
        produce a player edge. That is a separate skill and is not flat betting.
      </GuideP>

      <GuideH2 id="house-edge">House Edge by Ruleset</GuideH2>
      <GuideP>
        Table rules set the house edge, which determines how fast a flat bettor loses. All figures
        below assume 3:2 payouts and correct basic strategy. Exact numbers depend on the full rule
        set; these are representative.
      </GuideP>
      <div className="mb-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--bg-third)] text-left">
              <th className="rounded-tl-lg p-3 font-semibold text-[var(--text-primary)]">Ruleset</th>
              <th className="p-3 font-semibold text-[var(--text-primary)]">Typical rules</th>
              <th className="rounded-tr-lg p-3 font-semibold text-[var(--text-primary)]">House edge</th>
            </tr>
          </thead>
          <tbody>
            {HOUSE_EDGE_ROWS.map((row) => (
              <tr key={row.ruleset} className="border-b border-white/10">
                <td className="p-3 font-medium text-[var(--text-primary)]">{row.ruleset}</td>
                <td className="p-3 text-[var(--text-muted)]">{row.rules}</td>
                <td className="p-3 font-medium text-[var(--accent-soft)]">{row.edge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GuideH3>The 6:5 Penalty</GuideH3>
      <GuideP>
        If a table pays 6:5 instead of 3:2 on a blackjack, add roughly 1.4% to any figure above. A
        standard Vegas Strip game at 6:5 runs close to 2.0%, several times worse than the same game
        at 3:2.
      </GuideP>
      <GuideNote>Always confirm the felt reads "Blackjack pays 3 to 2."</GuideNote>

      <GuideH2 id="rule-effects">Rule Effects That Matter</GuideH2>
      <GuideP>Ranked by impact on the house edge:</GuideP>
      <GuideUl>
        <li>
          <strong>Payout:</strong> 3:2 versus 6:5 is the largest single factor, worth about 1.4%.
        </li>
        <li>
          <strong>Soft 17:</strong> a dealer who stands on soft 17 is better for the player than
          one who hits it, worth about 0.2%.
        </li>
        <li>
          <strong>Deck count:</strong> fewer decks lower the edge. Single deck beats eight deck by
          roughly 0.5%.
        </li>
        <li>
          <strong>Surrender and double-after-split:</strong> each lowers the edge by a small amount
          when offered.
        </li>
      </GuideUl>

      <GuideH2 id="table-selection">Table Selection</GuideH2>
      <GuideP>For the lowest loss rate as a flat bettor:</GuideP>
      <GuideUl>
        <li>Insist on 3:2. Never sit at 6:5.</li>
        <li>Prefer dealer stands on soft 17.</li>
        <li>Choose fewer decks when available.</li>
        <li>Take tables that offer surrender and double-after-split.</li>
      </GuideUl>
      <GuideP>
        These effects stack. A 3:2 table with S17, few decks, and surrender can run under 0.35%,
        while a 6:5 table runs near 2.0% for the identical strategy.
      </GuideP>

      <GuideH2 id="bankroll">Bankroll</GuideH2>
      <GuideP>
        Because the bet never escalates, flat betting is predictable to budget. Bring only money
        you can afford to lose, set a loss limit before sitting down, and stop when you reach it.
        At a $25 flat bet, a session bankroll of a few hundred dollars absorbs normal swings;
        higher bet sizes require proportionally more.
      </GuideP>
    </>
  );
}

export const flatBettingGuide: Guide = {
  slug: 'flat-betting',
  title: 'Flat Betting',
  description: 'Why a constant bet is correct for basic-strategy play',
  sections: [
    { id: 'what-it-is', title: 'What It Is' },
    { id: 'why-flat-bet', title: 'Why Flat Bet' },
    { id: 'what-it-does-not-do', title: 'What It Does Not Do' },
    { id: 'house-edge', title: 'House Edge by Ruleset' },
    { id: 'rule-effects', title: 'Rule Effects That Matter' },
    { id: 'table-selection', title: 'Table Selection' },
    { id: 'bankroll', title: 'Bankroll' },
  ],
  Content,
};
