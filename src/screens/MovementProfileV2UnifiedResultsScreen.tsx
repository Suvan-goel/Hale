import * as React from 'react';

import { CheckUpResultsShell } from '../results/CheckUpResultsShell';
import {
  buildMovementProfileV2UnifiedResultsPresentation,
  type MovementProfileV2PopulationComparisonInput,
} from '../results/movementProfileV2ResultsAdapter';
import type { UnifiedCheckUpResultsAction } from '../results/types';
import type { MovementProfileV2ResultsViewModel } from '../movementProfileV2/viewModel';

/**
 * The per-check-up results page, restored 2026-07-08 (founder direction) in a
 * v2 trim: fresh results after a check-up ('standard' / 'onboarding' for the
 * first-ever) and saved history from Progress (read-only 'history' variant)
 * render through the same shared shell. The old engine's plan and
 * block-report actions did not return.
 */
export function MovementProfileV2UnifiedResultsScreen({
  viewModel,
  variant = 'standard',
  populationComparison,
  onTogglePopulationComparison,
  onDone,
}: {
  viewModel: MovementProfileV2ResultsViewModel;
  variant?: 'standard' | 'onboarding' | 'history';
  populationComparison?: MovementProfileV2PopulationComparisonInput;
  onTogglePopulationComparison?: () => void;
  onDone: () => void;
}) {
  const presentation = React.useMemo(
    () =>
      buildMovementProfileV2UnifiedResultsPresentation({
        viewModel,
        variant,
        populationComparison,
      }),
    [populationComparison, variant, viewModel]
  );

  const handleAction = React.useCallback(
    (action: UnifiedCheckUpResultsAction) => {
      if (action.type === 'toggle_population_comparison') {
        onTogglePopulationComparison?.();
        return;
      }
      if (action.type === 'done') {
        onDone();
      }
    },
    [onDone, onTogglePopulationComparison]
  );

  return <CheckUpResultsShell presentation={presentation} onAction={handleAction} />;
}
