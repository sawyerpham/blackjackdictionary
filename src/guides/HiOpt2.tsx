import type { Guide } from './registry';
import { GuideH2, GuideP, GuideUl, TagValuesTable } from './ui';

const HI_OPT_2_TAGS = [
  { cards: '4, 5', value: '+2', tone: 'plus' as const },
  { cards: '2, 3, 6, 7', value: '+1', tone: 'plus' as const },
  { cards: '8, 9, A', value: '0', tone: 'zero' as const },
  { cards: '10, J, Q, K', value: '-2', tone: 'minus' as const },
];

function Content() {
  return (
    <>
      <GuideP>
        Hi-Opt II is a balanced, level-2 system built for accuracy. It is one of the strongest
        systems for playing decisions and the best common system for insurance. It counts the ace
        as neutral and pairs with a separate ace side count for betting. This guide covers only
        what is specific to Hi-Opt II and assumes the shared card counting overview.
      </GuideP>

      <GuideH2 id="profile">Profile</GuideH2>
      <GuideUl>
        <li>Level 2, balanced.</li>
        <li>Betting correlation 0.91, playing efficiency 0.67, insurance correlation 0.91.</li>
        <li>
          Excellent at playing deviations and insurance. The cost is difficulty: level-2 tags plus
          a side count.
        </li>
      </GuideUl>

      <GuideH2 id="tags">The Card Tags</GuideH2>
      <TagValuesTable rows={HI_OPT_2_TAGS} />
      <GuideP>
        The tags net to zero over a full deck. The ace is neutral, which is handled by the side
        count below.
      </GuideP>

      <GuideH2 id="running-true-count">Running and True Count</GuideH2>
      <GuideP>
        Hi-Opt II is balanced, so it uses the standard approach from the overview. Start at zero,
        add each tag, then convert to a true count by dividing the running count by the decks
        remaining. Bet and deviate off the true count.
      </GuideP>

      <GuideH2 id="ace-side-count">The Ace Side Count</GuideH2>
      <GuideP>
        Because the ace is tagged zero, the main count reads the ten-density very well for playing
        decisions, but it is weaker for betting, since aces are what create blackjacks. To fix
        betting, keep a separate tally of aces as they appear.
      </GuideP>
      <GuideP>
        Compare the aces seen to the expected rate of about one per thirteen cards, or four per
        deck. When aces are richer than expected for how many cards have been dealt, nudge your
        true count upward for betting decisions. When poorer, nudge it downward. This side count is
        the source of Hi-Opt II's betting accuracy and also its main difficulty, since it runs
        alongside the primary count.
      </GuideP>

      <GuideH2 id="deviations">Deviations</GuideH2>
      <GuideP>
        Hi-Opt II uses index plays like any balanced system. The index numbers are specific to
        Hi-Opt II and differ from other systems, and the full set comes with the system's strategy
        tables. Insurance is the most valuable deviation, and Hi-Opt II calls it more accurately
        than most systems.
      </GuideP>

      <GuideH2 id="accuracy-check">Accuracy Check</GuideH2>
      <GuideP>
        A full deck counted correctly returns to zero. The ace side count is tracked separately and
        does not affect that check.
      </GuideP>
    </>
  );
}

export const hiOpt2Guide: Guide = {
  slug: 'hi-opt-2',
  title: 'The Hi-Opt II System',
  description: 'A level-2 count built for playing accuracy and insurance, with an ace side count',
  sections: [
    { id: 'profile', title: 'Profile' },
    { id: 'tags', title: 'The Card Tags' },
    { id: 'running-true-count', title: 'Running and True Count' },
    { id: 'ace-side-count', title: 'The Ace Side Count' },
    { id: 'deviations', title: 'Deviations' },
    { id: 'accuracy-check', title: 'Accuracy Check' },
  ],
  Content,
};
