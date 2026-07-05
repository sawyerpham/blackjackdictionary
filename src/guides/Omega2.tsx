import type { Guide } from './registry';
import { GuideH2, GuideP, GuideUl, TagValuesTable } from './ui';

const OMEGA_2_TAGS = [
  { cards: '4, 5, 6', value: '+2', tone: 'plus' as const },
  { cards: '2, 3, 7', value: '+1', tone: 'plus' as const },
  { cards: '8, A', value: '0', tone: 'zero' as const },
  { cards: '9', value: '-1', tone: 'minus' as const },
  { cards: '10, J, Q, K', value: '-2', tone: 'minus' as const },
];

function Content() {
  return (
    <>
      <GuideP>
        Omega II is a balanced, level-2 system with strong playing efficiency. Like Hi-Opt II, it
        counts the ace as neutral and relies on an ace side count for betting. It also tags the 9,
        which most simpler systems ignore, giving it extra precision. This guide covers only what
        is specific to Omega II and assumes the shared card counting overview.
      </GuideP>

      <GuideH2 id="profile">Profile</GuideH2>
      <GuideUl>
        <li>Level 2, balanced.</li>
        <li>Betting correlation 0.92, playing efficiency 0.67, insurance correlation 0.85.</li>
        <li>
          Among the best systems for playing decisions. Similar in power and difficulty to Hi-Opt
          II.
        </li>
      </GuideUl>

      <GuideH2 id="tags">The Card Tags</GuideH2>
      <TagValuesTable rows={OMEGA_2_TAGS} />
      <GuideP>
        The tags net to zero over a full deck. Note the 9 is counted as -1, a distinction most
        level-1 systems do not make. The ace is neutral, handled by the side count below.
      </GuideP>

      <GuideH2 id="running-true-count">Running and True Count</GuideH2>
      <GuideP>
        Omega II is balanced and uses the standard approach from the overview. Start at zero, add
        each tag, then divide the running count by decks remaining to get the true count. Bet and
        deviate off the true count.
      </GuideP>

      <GuideH2 id="ace-side-count">The Ace Side Count</GuideH2>
      <GuideP>
        The ace is tagged zero, so the primary count is strong for playing decisions but weak for
        betting, because aces drive blackjacks. Keep a separate count of aces seen and compare it
        to the expected rate of four per deck. When aces run rich for the cards dealt, adjust the
        true count upward for betting; when they run poor, adjust downward. This side count is the
        main difficulty of the system.
      </GuideP>

      <GuideH2 id="omega-vs-zen">Omega II vs Zen</GuideH2>
      <GuideP>
        Omega II and the Zen Count perform about the same. The practical difference is that Omega
        II needs the ace side count, while Zen counts the ace directly and does not. Many players
        choose Zen for that reason. If you want the extra precision of tagging the 9 and are
        willing to run a side count, Omega II is the more granular of the two.
      </GuideP>

      <GuideH2 id="deviations">Deviations</GuideH2>
      <GuideP>
        Omega II uses index plays specific to the system, supplied with its strategy tables.
        Insurance is the most valuable deviation.
      </GuideP>

      <GuideH2 id="accuracy-check">Accuracy Check</GuideH2>
      <GuideP>
        A full deck counted correctly returns to zero. The ace side count is separate and does not
        affect that check.
      </GuideP>
    </>
  );
}

export const omega2Guide: Guide = {
  slug: 'omega-2',
  title: 'The Omega II System',
  description: 'A precise level-2 count that tags the 9 and pairs with an ace side count',
  sections: [
    { id: 'profile', title: 'Profile' },
    { id: 'tags', title: 'The Card Tags' },
    { id: 'running-true-count', title: 'Running and True Count' },
    { id: 'ace-side-count', title: 'The Ace Side Count' },
    { id: 'omega-vs-zen', title: 'Omega II vs Zen' },
    { id: 'deviations', title: 'Deviations' },
    { id: 'accuracy-check', title: 'Accuracy Check' },
  ],
  Content,
};
