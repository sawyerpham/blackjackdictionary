import type { ComponentType } from 'react';
import { blackjackOverviewGuide } from './BlackjackOverview';
import { basicStrategyGuide } from './BasicStrategyChart';
import { hiloGuide } from './hilo';
import { cardCountingOverviewGuide } from './CardCountingOverview';
import { knockOutGuide } from './KnockOut';
import { hiOpt2Guide } from './HiOpt2';
import { omega2Guide } from './Omega2';
import { zenCountGuide } from './ZenCount';
import { wongHalvesGuide } from './WongHalves';

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
  blackjackOverviewGuide,
  basicStrategyGuide,
  cardCountingOverviewGuide,
  hiloGuide,
  knockOutGuide,
  hiOpt2Guide,
  omega2Guide,
  zenCountGuide,
  wongHalvesGuide,
];
