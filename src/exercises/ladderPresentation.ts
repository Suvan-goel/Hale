import type { ExerciseLadder, ExerciseLadderProgressionModel } from './ladders';

export type LadderPresentationMode = 'levels' | 'movement_set' | 'collection';

export interface LadderPresentation {
  mode: LadderPresentationMode;
  itemNoun: 'level' | 'movement' | 'mobility movement';
  pluralNoun: string;
  showRank: boolean;
  showEasierHarder: boolean;
  showCurrentLevel: boolean;
  showCoverage: boolean;
  currentLabel: string;
  listTitle: string;
}

export function ladderPresentationForModel(model: ExerciseLadderProgressionModel): LadderPresentation {
  if (model === 'collection') {
    return {
      mode: 'collection',
      itemNoun: 'mobility movement',
      pluralNoun: 'mobility movements',
      showRank: false,
      showEasierHarder: false,
      showCurrentLevel: false,
      showCoverage: true,
      currentLabel: 'Coverage this block',
      listTitle: 'Mobility movements',
    };
  }
  if (model === 'supporting_set') {
    return {
      mode: 'movement_set',
      itemNoun: 'movement',
      pluralNoun: 'practice options',
      showRank: false,
      showEasierHarder: false,
      showCurrentLevel: false,
      showCoverage: false,
      currentLabel: 'Recently included',
      listTitle: 'Movements in this set',
    };
  }
  return {
    mode: 'levels',
    itemNoun: 'level',
    pluralNoun: 'levels',
    showRank: true,
    showEasierHarder: true,
    showCurrentLevel: true,
    showCoverage: false,
    currentLabel: 'Current level',
    listTitle: 'Levels',
  };
}

export function ladderPresentationForLadder(ladder: Pick<ExerciseLadder, 'progressionModel'>): LadderPresentation {
  return ladderPresentationForModel(ladder.progressionModel);
}
