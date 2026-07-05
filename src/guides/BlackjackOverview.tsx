import type { Guide } from './registry';
import { GuideH2, GuideH3, GuideP, GuideUl } from './ui';

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
        How blackjack works, where the house edge comes from, and how to lose the least before you
        ever learn to count. Start here, then move to the basic strategy chart.
      </GuideP>

      

      <GuideH2 id="the-game">The Game</GuideH2>
      <GuideP>
        You play against the dealer, not the other players. The goal is a hand total closer to 21
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
          <strong>Decks:</strong> Number of standard 52-card decks used in the game. Fewer decks generally favor the player, while more decks increase the house edge.
        </li>
      </GuideUl>
      <GuideH2 id="how-a-round-plays">How a Round Plays</GuideH2>
      <GuideP>
        You bet, every player gets two cards, and the dealer shows one card while hiding the other.
        Acting in turn, you choose from up to five moves:
      </GuideP>
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
      <GuideP>
        The dealer then plays by fixed rules — drawing to at least 17 with no choices — and the
        higher total wins. Going over 21 is a bust and an immediate loss, and equal totals push.
      </GuideP>

      <GuideH2 id="the-house-edge">The House Edge</GuideH2>
      <GuideP>
        The house wins because you act first: if you bust and the dealer later busts too, you still
        lose. Correct play shrinks that advantage to roughly half a percent, and the table's rules
        set exactly where it lands. All figures below assume 3:2 payouts and correct basic
        strategy.
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
        If a table pays 6:5 instead of 3:2 on a blackjack, add roughly 1.4% to any figure above —
        several times worse for the identical strategy.
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
        Only card counting can turn the edge positive because it allows you to know when to increase bets as the odds improve
      </GuideP>

      <GuideH2 id="table-selection">Table Selection</GuideH2>
      <GuideP>Ranked by impact on the house edge:</GuideP>
      <GuideUl>
        <li>
          <strong>Payout:</strong> insist on 3:2. Never sit at 6:5 — it is the largest single
          factor, worth about 1.4%.
        </li>
        <li>
          <strong>Soft 17:</strong> prefer a dealer who stands on soft 17, worth about 0.2%.
        </li>
        <li>
          <strong>Deck count:</strong> fewer decks lower the edge. Single deck beats eight deck by
          roughly 0.5%.
        </li>
        <li>
          <strong>Surrender and double-after-split:</strong> take them when offered; each shaves a
          small amount.
        </li>
      </GuideUl>
      <GuideP>
        These effects stack. A 3:2 table with S17, few decks, and surrender can run under 0.35%,
        while a 6:5 table runs near 2.0% for the identical strategy.
      </GuideP>

      <GuideH2 id="bankroll">Bankroll</GuideH2>
      <GuideP>
        Bring only money you can afford to lose, set a loss limit before sitting down, and stop
        when you reach it. At a $25 flat bet, a session bankroll of a few hundred dollars absorbs
        normal swings; higher bet sizes require proportionally more.
      </GuideP>

      <GuideH2 id="where-next">Where Next</GuideH2>
      <GuideP>
        Learn the basic strategy chart until every play is automatic — that alone gets you to the
        edges in the table above. When you want the edge on your side instead, start with the card
        counting overview.
      </GuideP>
    </>
  );
}

export const blackjackOverviewGuide: Guide = {
  slug: 'blackjack-overview',
  title: 'Blackjack: Overview',
  description: 'How the game works, the house edge, and betting it correctly',
  sections: [
    { id: 'the-game', title: 'The Game' },
    { id: 'how-a-round-plays', title: 'How a Round Plays' },
    { id: 'the-house-edge', title: 'The House Edge' },
    { id: 'flat-betting', title: 'Flat Betting' },
    { id: 'table-selection', title: 'Table Selection' },
    { id: 'bankroll', title: 'Bankroll' },
    { id: 'where-next', title: 'Where Next' },
  ],
  Content,
};
