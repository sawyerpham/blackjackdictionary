import type { Guide } from './registry';
import { GuideH2, GuideP, GuideUl, TagValuesTable } from './ui';

const ZEN_TAGS = [
  { cards: '4, 5, 6', value: '+2', tone: 'plus' as const },
  { cards: '2, 3, 7', value: '+1', tone: 'plus' as const },
  { cards: '8, 9', value: '0', tone: 'zero' as const },
  { cards: 'A', value: '-1', tone: 'minus' as const },
  { cards: '10, J, Q, K', value: '-2', tone: 'minus' as const },
];

function Content() {
  return (
    <>
      <GuideP>
        The Zen Count is a balanced, level-2 system often regarded as the best practical level-2
        count. It captures most of the accuracy of a level-2 system while counting the ace
        directly, which removes the ace side count that Hi-Opt II and Omega II require. This guide
        covers only what is specific to the Zen Count and assumes the shared card counting
        overview.
      </GuideP>

      <GuideH2 id="profile">Profile</GuideH2>
      <GuideUl>
        <li>Level 2, balanced.</li>
        <li>Betting correlation 0.96, playing efficiency 0.63, insurance correlation 0.85.</li>
        <li>
          Strong all around. High betting accuracy for a level-2 system, good playing efficiency,
          and no side count.
        </li>
      </GuideUl>

      <GuideH2 id="tags">The Card Tags</GuideH2>
      <TagValuesTable rows={ZEN_TAGS} />
      <GuideP>The tags net to zero over a full deck.</GuideP>

      <GuideH2 id="why-zen">Why Zen</GuideH2>
      <GuideP>
        The ace is counted as -1 rather than left neutral. That single choice is the system's main
        advantage. Counting the ace keeps betting accuracy high without a separate ace side count,
        so Zen delivers most of the level-2 benefit while remaining runnable for long sessions. It
        is the level-2 system with the least overhead.
      </GuideP>

      <GuideH2 id="running-true-count">Running and True Count</GuideH2>
      <GuideP>
        Zen is balanced and uses the standard approach from the overview. Start at zero, add each
        tag, then divide the running count by decks remaining to get the true count. Bet and
        deviate off the true count.
      </GuideP>

      <GuideH2 id="deviations">Deviations</GuideH2>
      <GuideP>
        The Zen Count uses index plays specific to the system, supplied with its strategy tables.
        Insurance is the most valuable deviation.
      </GuideP>

      <GuideH2 id="accuracy-check">Accuracy Check</GuideH2>
      <GuideP>A full deck counted correctly returns to zero.</GuideP>
    </>
  );
}

export const zenCountGuide: Guide = {
  slug: 'zen',
  title: 'The Zen Count',
  description: 'The practical level-2 count: it tags the ace directly, so no side count needed',
  sections: [
    { id: 'profile', title: 'Profile' },
    { id: 'tags', title: 'The Card Tags' },
    { id: 'why-zen', title: 'Why Zen' },
    { id: 'running-true-count', title: 'Running and True Count' },
    { id: 'deviations', title: 'Deviations' },
    { id: 'accuracy-check', title: 'Accuracy Check' },
  ],
  Content,
};
