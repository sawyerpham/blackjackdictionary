import type { Guide } from './registry';
import { GuideH2, GuideNote, GuideP, GuideUl, TagValuesTable } from './ui';

const HALVES_TAGS = [
  { cards: '5', value: '+1.5', tone: 'plus' as const },
  { cards: '3, 4, 6', value: '+1', tone: 'plus' as const },
  { cards: '2, 7', value: '+0.5', tone: 'plus' as const },
  { cards: '8', value: '0', tone: 'zero' as const },
  { cards: '9', value: '-0.5', tone: 'minus' as const },
  { cards: '10, J, Q, K, A', value: '-1', tone: 'minus' as const },
];

const DOUBLED_TAGS = [
  { cards: '5', value: '+3', tone: 'plus' as const },
  { cards: '3, 4, 6', value: '+2', tone: 'plus' as const },
  { cards: '2, 7', value: '+1', tone: 'plus' as const },
  { cards: '8', value: '0', tone: 'zero' as const },
  { cards: '9', value: '-1', tone: 'minus' as const },
  { cards: '10, J, Q, K, A', value: '-2', tone: 'minus' as const },
];

function Content() {
  return (
    <>
      <GuideP>
        Wong Halves is a balanced, fractional system with the highest betting accuracy of any
        practical count. Its difficulty is entirely in execution, because several cards carry
        half-point values. This guide covers only what is specific to Wong Halves and assumes the
        shared card counting overview.
      </GuideP>

      <GuideH2 id="profile">Profile</GuideH2>
      <GuideUl>
        <li>Level 3, balanced, fractional tags.</li>
        <li>Betting correlation 0.99, playing efficiency 0.56, insurance correlation 0.72.</li>
        <li>
          The best betting accuracy available. The ace is counted directly, so no side count is
          needed. The catch is the fractions.
        </li>
      </GuideUl>

      <GuideH2 id="tags">The Card Tags</GuideH2>
      <TagValuesTable rows={HALVES_TAGS} />
      <GuideP>The tags net to zero over a full deck.</GuideP>

      <GuideH2 id="doubling-fix">The Fractions and the Doubling Fix</GuideH2>
      <GuideP>
        Adding and subtracting halves on every card is slow and error-prone at casino speed. Most
        players avoid this by doubling every tag to work in whole numbers.
      </GuideP>
      <TagValuesTable rows={DOUBLED_TAGS} />
      <GuideP>
        Running the doubled tags removes the fractions during the count. The tradeoff is that you
        must undo the doubling when you convert. Either halve the running count before dividing, or
        divide by twice the decks remaining. Either way, one extra halving step is added to the
        conversion.
      </GuideP>

      <GuideH2 id="running-true-count">Running and True Count</GuideH2>
      <GuideP>
        Wong Halves is balanced and uses the standard approach from the overview. Start at zero,
        add each tag, then divide by decks remaining for the true count. If you are using the
        doubled tags, remember to remove the doubling at conversion. Bet and deviate off the true
        count.
      </GuideP>

      <GuideH2 id="reality-check">Reality Check</GuideH2>
      <GuideNote>
        Wong Halves has the best betting correlation of any workable system, but its lead over
        simpler counts is small and is easily erased by the errors the fractions cause under real
        conditions. It is worth using only if you can run it cleanly for hours. If the fractions
        cost you accuracy, a simpler system will earn more.
      </GuideNote>

      <GuideH2 id="accuracy-check">Accuracy Check</GuideH2>
      <GuideP>
        A full deck counted correctly returns to zero. If you are using doubled tags, a full deck
        returns to zero on the doubled scale as well.
      </GuideP>
    </>
  );
}

export const wongHalvesGuide: Guide = {
  slug: 'wong-halves',
  title: 'The Wong Halves System',
  description: 'The highest betting accuracy of any practical count — if you can run the fractions',
  sections: [
    { id: 'profile', title: 'Profile' },
    { id: 'tags', title: 'The Card Tags' },
    { id: 'doubling-fix', title: 'The Fractions and the Doubling Fix' },
    { id: 'running-true-count', title: 'Running and True Count' },
    { id: 'reality-check', title: 'Reality Check' },
    { id: 'accuracy-check', title: 'Accuracy Check' },
  ],
  Content,
};
