import type { Guide } from './registry';
import { GuideH2, GuideH3, GuideOl, GuideP, GuideUl } from './ui';

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

  const RULE_ROWS = [
    { rule: 'Single deck', edge: '0.48%' },
    { rule: 'Early surrender against ten', edge: '0.24%' },
    { rule: 'Player may double on any number of cards', edge: '0.23%' },
    { rule: 'Double deck', edge: '0.19%' },
    { rule: 'Player may draw to split aces', edge: '0.19%' },
    { rule: 'Six-card Charlie', edge: '0.16%' },
    { rule: 'Player may resplit aces', edge: '0.08%' },
    { rule: 'Late surrender', edge: '0.08%' },
    { rule: 'Four decks', edge: '0.06%' },
    { rule: 'Five decks', edge: '0.03%' },
    { rule: 'Six decks', edge: '0.02%' },
    { rule: 'Split to only 3 hands', edge: '-0.01%' },
    { rule: 'Player may double on 9–11 only', edge: '-0.09%' },
    { rule: 'Split to only 2 hands', edge: '-0.10%' },
    { rule: 'European no hole card', edge: '-0.11%' },
    { rule: 'Player may not double after splitting', edge: '-0.14%' },
    { rule: 'Player may double on 10,11 only', edge: '-0.18%' },
    { rule: 'Dealer hits on soft 17', edge: '-0.22%' },
    { rule: 'Blackjack pays 7–5', edge: '-0.45%' },
    { rule: 'Blackjack pays 6–5', edge: '-1.39%' },
    { rule: 'Blackjacks pay 1 to 1', edge: '-2.27%' },
  ];

function Content() {
  return (
    <>
      <GuideP>
        How blackjack works, where the house edge comes from, and how to lose the least before you
        ever learn to count. Start here, then move to the basic strategy chart.
      </GuideP>

      

      <GuideH2 id="the-game">The Game</GuideH2>
      <GuideP>
        You play against the dealer, not the other players. The goal is to beat the dealer by having a hand total closer to 21
        than the dealer's without going over. Cards 2 through 10 count face value, face cards count
        10, and an ace counts 1 or 11, whichever helps. A two-card 21 (ace and ten-value card) is a blackjack, and it pays 3:2 at a full-payout table.
      </GuideP>

      <GuideH2 id="legend">Terminology</GuideH2>
      <GuideUl>
        <li>
          <strong>Soft [number]:</strong> refers to a hand with an Ace that can be counted as either 1 or 11 without exceeding 21
        </li>
        
        <li>
          <strong>3:2 and 6:5 tables</strong> refer to the payout ratios for blackjack hands.
        </li>
        <GuideUl>
          <li>
             3:2 tables pay $1.50 for every $1, always play here.
          </li>
          <li>
            6:5 tables pay $1.20 for every $1, increasing the house edge significantly.
          </li>
        </GuideUl>
        <li>
          <strong>House edge:</strong> mathematical advantage that casinos have over players, expressed as a percentage of each bet that the casino expects to keep over the long term.
        </li>
        <li>
          <strong>Low Stakes:</strong> $5 - $25
        </li>
        <li>
          <strong>Medium Stakes:</strong> $25 - $100
        </li>
        <li>
          <strong>High Stakes:</strong> $100 - $500+
        </li>
      </GuideUl>
      <GuideH2 id="how-a-round-plays">How a Round Plays</GuideH2>
      <GuideP>
        <GuideOl>
          <li>
            Everyone bets.
          </li>
          <li>
            Every player gets dealt two cards, then the dealer is dealt two cards. One of the dealer cards is dealt face up. The facedown card is called the "hole card."
          </li>
          <li>
            If the dealer has an ace showing, he will offer a side bet called "insurance." This side wager pays 2 to 1 if the dealer's hole card is any 10-point card. Insurance wagers are optional and may not exceed half the original wager.
          </li>
          <li>
            If the dealer has a ten or an ace showing (after offering insurance with an ace showing), then he will peek at his facedown card to see if he has a blackjack. If he does, then he will turn it over immediately.
          </li>
          <li>
            If the dealer does have a blackjack, then all wagers (except insurance) will lose, unless the player also has a blackjack, which will result in a push. The dealer will resolve insurance wagers at this time.
          </li>
          <li>
            Play begins with the player to the dealer's left. The following are the choices available to the player:
            <GuideUl>
              <li>
                <strong>Hit:</strong> take another card. Repeatable until you stand or bust.
              </li>
              <li>
                <strong>Stand:</strong> keep your total and end your turn.
              </li>
              <li>
                <strong>Double:</strong> double your bet, take exactly one more card.
              </li>
              <li>
                <strong>Split:</strong> turn a pair into two new hands, each with its own bet.
              </li>
              <li>
                <strong>Surrender:</strong> where offered, give up the hand and keep half your bet.
              </li>
            </GuideUl>  
          </li>
          <li>
            After each player has had his turn, the dealer will turn over his hole card. If the dealer has 16 or less, then he will draw another card. A special situation is when the dealer has an ace and any number of cards totaling six points (known as a "soft 17"). At some tables, the dealer will also hit a soft 17.
          </li>
          <li>
            If the dealer goes over 21 points, then any player who didn't already bust will win.
          </li>
          <li>
            If the dealer does not bust, then the higher point total between the player and dealer will win.
          </li>
          <li>
            Winning wagers pay even money, except a winning player blackjack usually pays 3 to 2.
          </li>
        </GuideOl>
      </GuideP>
      

      <GuideH2 id="the-house-edge">The House Edge</GuideH2>
      <GuideP>
        The house wins because you act first: if you bust and the dealer later busts too, you still
        lose. All figures below assume 3:2 payouts and correct basic
        strategy. As stakes get higher, rules usually favor the player, so the house edge can drop to ~0.35% at high-stakes tables.
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
        If a table pays 6:5 instead of 3:2 on a blackjack, add ~1.4% to the house edge.
      </GuideP>

      <GuideH2 id="flat-betting">Flat Betting</GuideH2>
      <GuideP>
        Unless you count cards, bet the same fixed amount every hand. Progressions like Martingale
        do not change the house edge; they only rearrange when the losses arrive, and often trade
        many small wins for one large loss. Without a count, no information justifies changing the
        bet, so varying it adds risk without adding value.
      </GuideP>
      <GuideP>
        Flat betting does not beat the house and only minimizes your losses.
        Only card counting can turn the edge positive because it allows you to know when to increase bets as odds improve.
      </GuideP>

      <GuideH2 id="table-selection">Table Selection</GuideH2>
      <GuideP>Ranked by impact on the house edge:</GuideP>
      <div className="mb-4 max-h-64 overflow-y-auto">
      <table className="w-full border-separate border-spacing-0.5 text-sm">
        <thead>
          <tr>
            <th className="rounded bg-[var(--bg-third)] p-2 text-left font-semibold text-[var(--text-primary)]">
              Rule Variation
            </th>
            <th className="rounded bg-[var(--bg-third)] p-2 text-right font-semibold text-[var(--text-primary)]">
              House Edge Change
            </th>
          </tr>
        </thead>
        <tbody>
          {RULE_ROWS.map((r) => (
            <tr key={r.rule}>
              <td className="rounded bg-[var(--bg-second)] p-2 text-left font-semibold text-[var(--text-primary)]">
                {r.rule}
              </td>
              <td className="rounded bg-[var(--bg-second)] p-2 text-right text-[var(--text-primary)]">
                {r.edge}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
      <GuideP>
        <b>Example: </b>A 3:2 table with S17, few decks, and surrender can run under 0.35%,
        while a 6:5 table runs near 2.0% for the identical strategy.
      </GuideP>

      <GuideH2 id="bankroll">Bankroll</GuideH2>
      <GuideP>
        Bring only money you can afford to lose, set a loss limit before sitting down, and stop
        when you reach it. At a $25 flat bet, a session bankroll of a few hundred dollars absorbs
        normal swings; higher bet sizes require proportionally more.
      </GuideP>
    </>
  );
}

export const blackjackOverviewGuide: Guide = {
  slug: 'blackjack-overview',
  title: 'Blackjack: Overview',
  description: 'How the game works, the house edge, and table selection',
  sections: [
    { id: 'the-game', title: 'The Game' },
    { id: 'legend', title: 'Terminology' },
    { id: 'how-a-round-plays', title: 'How a Round Plays' },
    { id: 'the-house-edge', title: 'The House Edge' },
    { id: 'flat-betting', title: 'Flat Betting' },
    { id: 'table-selection', title: 'Table Selection' },
    { id: 'bankroll', title: 'Bankroll' },
    { id: 'next', title: 'Next' },
  ],
  Content,
};
