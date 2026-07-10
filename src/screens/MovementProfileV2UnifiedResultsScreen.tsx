import * as React from 'react';

import { CheckUpResultsShell } from '../results/CheckUpResultsShell';
import { buildMovementProfileV2UnifiedResultsPresentation } from '../results/movementProfileV2ResultsAdapter';
import type { UnifiedCheckUpResultsAction } from '../results/types';
import type { MovementProfileV2ResultsViewModel } from '../movementProfileV2/viewModel';

/**
 * The per-check-up results page, restored 2026-07-08 (founder direction) in a
 * v2 trim: fresh results after a check-up ('standard' / 'onboarding' for the
 * first-ever) are concise, while saved history from Progress keeps the detailed
 * read-only variant. Clarity lives on Progress and comparison preferences live
 * in Settings, so neither adds controls to this completion path.
 */
export function MovementProfileV2UnifiedResultsScreen({
  viewModel,
  variant = 'standard',
  onDone,
}: {
  viewModel: MovementProfileV2ResultsViewModel;
  variant?: 'standard' | 'onboarding' | 'history';
  onDone: () => void;
}) {
  const presentation = React.useMemo(
    () =>
      buildMovementProfileV2UnifiedResultsPresentation({
        viewModel,
        variant,
      }),
    [variant, viewModel]
  );

  const handleAction = React.useCallback(
    (action: UnifiedCheckUpResultsAction) => {
      if (action.type === 'done') {
        onDone();
      }
    },
    [onDone]
  );

  return <CheckUpResultsShell presentation={presentation} onAction={handleAction} />;
}
