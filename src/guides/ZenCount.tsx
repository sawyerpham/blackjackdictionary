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
      <GuideP>
        The tags net to zero over a full deck, so the standard running-to-true-count conversion
        from the overview applies unchanged, and a correctly counted deck returns to zero.
      </GuideP>

      <GuideH2 id="why-zen">Why Zen</GuideH2>
      <GuideP>
        The ace is counted as -1 rather than left neutral. That single choice is the system's main
        advantage. Counting the ace keeps betting accuracy high without a separate ace side count,
        so Zen delivers most of the level-2 benefit while remaining runnable for long sessions. It
        is the level-2 system with the least overhead.
      </GuideP>

    </>
  );
}

export const zenCountGuide: Guide = {
  slug: 'zen',
  title: 'Zen Count',
  description: 'The practical level-2 count: it tags the ace directly, so no side count needed',
  sections: [
    { id: 'profile', title: 'Profile' },
    { id: 'tags', title: 'The Card Tags' },
    { id: 'why-zen', title: 'Why Zen' },
  ],
  Content,
};
