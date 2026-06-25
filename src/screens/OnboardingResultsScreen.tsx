import * as React from 'react';

import type { MovementAssessment, MovementBlock } from '../adherence';
import type { CheckUp } from '../checkup';
import { CheckUpResultsShell } from '../results/CheckUpResultsShell';
import type { UnifiedCheckUpResultsAction } from '../results/types';
import { buildV1OnboardingResultsPresentation } from '../results/v1ResultsAdapter';
import type { CheckUpScore, VersionedCheckUpScoreSnapshot } from '../scoring';

export function OnboardingResultsScreen({
  checkUp: _checkUp,
  assessment,
  score,
  scoreSnapshot,
  plannedBlock,
  onContinue,
  onRetake,
  onDone,
}: {
  checkUp: CheckUp;
  assessment?: MovementAssessment | null;
  score?: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  plannedBlock?: MovementBlock | null;
  onContinue: () => void;
  onRetake: () => void;
  onDone: () => void;
}) {
  const presentation = React.useMemo(
    () =>
      buildV1OnboardingResultsPresentation({
        assessment,
        score,
        scoreSnapshot,
        plannedBlock,
      }),
    [assessment, plannedBlock, score, scoreSnapshot]
  );

  const handleAction = React.useCallback(
    (action: UnifiedCheckUpResultsAction) => {
      if (action.type === 'complete_onboarding') {
        onContinue();
        return;
      }
      if (action.type === 'retry_checkup') {
        onRetake();
        return;
      }
      if (action.type === 'done') {
        onDone();
      }
    },
    [onContinue, onDone, onRetake]
  );

  return <CheckUpResultsShell presentation={presentation} onAction={handleAction} />;
}
