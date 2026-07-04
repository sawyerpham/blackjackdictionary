import type { ComponentType } from 'react';
import { flatBettingGuide } from './FlatBetting';
import { basicStrategyGuide } from './BasicStrategyChart';
import { hiLoIllustrious18Guide } from './HiLoIllustrious18';
import { cardCountingOverviewGuide } from './CardCountingOverview';
import { knockOutGuide } from './KnockOut';

export interface GuideSection {
  /** Anchor id of the h2 this entry links to. */
  id: string;
  title: string;
}

export interface Guide {
  slug: string;
  title: string;
  /** One-liner shown under the title in the article header. */
  description: string;
  /** Drives the "On this page" outline; ids must match the GuideH2 ids in Content. */
  sections: GuideSection[];
  Content: ComponentType;
}

/** Sidebar order. Add new guides here. */
export const GUIDES: Guide[] = [
  basicStrategyGuide,
  flatBettingGuide,
  cardCountingOverviewGuide,
  hiLoIllustrious18Guide,
  knockOutGuide,
];
