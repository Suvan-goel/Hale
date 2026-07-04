/**
 * Ladder progress cards for the Progress tab's training section. The rest of
 * the legacy V1 progress view models were removed with the legacy check-up
 * (2026-07-04); Movement Profile V2 progress is built in
 * movementProfileV2ProgressViewModel.ts.
 */

import { getExerciseLadder, ladderPresentationForLadder } from '../exercises';
import type { LadderProgress } from '../training';

export interface LadderProgressCard {
  ladderId: string;
  title: string;
  levelName: string;
  status: 'Building' | 'Ready for next step' | 'Same level for now' | 'Recently included' | 'Available in plan';
}

const LADDER_ROWS: readonly { id: string; title: string }[] = [
  { id: 'sit-to-stand', title: 'Sit-to-Stand' },
  { id: 'squat', title: 'Squat' },
  { id: 'balance', title: 'Balance' },
  { id: 'push', title: 'Push' },
  { id: 'pull-upper-back', title: 'Pull / Upper Back' },
  { id: 'mobility-flexibility', title: 'Mobility' },
];

export function getLadderProgressCards(
  ladderProgressById: Record<string, LadderProgress> | null | undefined
): LadderProgressCard[] {
  const progress = ladderProgressById ?? {};
  return LADDER_ROWS.map((row) => {
    const item = progress[row.id];
    if (!item) return null;
    const ladder = safeLadder(row.id);
    const presentation = ladder ? ladderPresentationForLadder(ladder) : null;
    return {
      ladderId: row.id,
      title: row.title,
      levelName: presentation?.showCurrentLevel === false
        ? presentation.listTitle
        : levelLabel(row.id, item.currentLevelId),
      status: presentation?.showCurrentLevel === false
        ? nonLinearStatus(item)
        : ladderStatus(item),
    };
  }).filter((item): item is LadderProgressCard => !!item);
}

function ladderStatus(progress: LadderProgress): LadderProgressCard['status'] {
  if (progress.readyToProgress) return 'Ready for next step';
  if (progress.lastPain || progress.lastTrackingQuality === 'poor') return 'Same level for now';
  return 'Building';
}

function nonLinearStatus(progress: LadderProgress): LadderProgressCard['status'] {
  return progress.lastCompletedAt ? 'Recently included' : 'Available in plan';
}

function levelLabel(ladderId: string, levelId: string): string {
  try {
    return getExerciseLadder(ladderId).levels.find((level) => level.id === levelId)?.name ?? 'Current level';
  } catch {
    return 'Current level';
  }
}

function safeLadder(ladderId: string) {
  try {
    return getExerciseLadder(ladderId);
  } catch {
    return null;
  }
}

