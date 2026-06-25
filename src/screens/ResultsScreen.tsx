import * as React from 'react';

import type { MovementAssessment } from '../adherence';
import type { AgeBand } from '../adherence';
import type { CheckUp } from '../checkup/types';
import type { ExtraTrendPoint, StoredCheckUp } from '../history';
import { CheckUpResultsShell } from '../results/CheckUpResultsShell';
import { buildV1StandardResultsPresentation } from '../results/v1ResultsAdapter';
import type { UnifiedCheckUpResultsAction } from '../results/types';
import type { CheckUpScore, VersionedCheckUpScoreSnapshot } from '../scoring';

export function ResultsScreen({
  checkUp: _checkUp,
  history,
  onDone,
  onRetake,
  onViewPlan,
  nextPlanReady = false,
  showBackButton = false,
  extraTrendPoints = [],
  assessment,
  score,
  scoreSnapshot,
  age,
  ageBand,
}: {
  checkUp: CheckUp;
  history: StoredCheckUp[];
  assessment?: MovementAssessment | null;
  score?: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  age?: number | null;
  ageBand?: AgeBand | null;
  onDone: () => void;
  onRetake?: () => void;
  onViewPlan?: () => void;
  nextPlanReady?: boolean;
  showBackButton?: boolean;
  /** Weekly micro-check points to merge into the trend line. */
  extraTrendPoints?: ExtraTrendPoint[];
}) {
  const presentation = React.useMemo(
    () =>
      buildV1StandardResultsPresentation({
        history,
        assessment,
        score,
        scoreSnapshot,
        age,
        ageBand,
        nextPlanReady,
        showBackButton,
        canViewPlan: !!onViewPlan,
        canRetake: !!onRetake,
        extraTrendPoints,
      }),
    [
      age,
      ageBand,
      assessment,
      extraTrendPoints,
      history,
      nextPlanReady,
      onRetake,
      onViewPlan,
      score,
      scoreSnapshot,
      showBackButton,
    ]
  );

  const handleAction = React.useCallback(
    (action: UnifiedCheckUpResultsAction) => {
      if (action.type === 'view_plan') {
        onViewPlan?.();
        return;
      }
      if (action.type === 'retry_checkup') {
        onRetake?.();
        return;
      }
      if (action.type === 'done') {
        onDone();
      }
    },
    [onDone, onRetake, onViewPlan]
  );

  return <CheckUpResultsShell presentation={presentation} onAction={handleAction} />;
}
