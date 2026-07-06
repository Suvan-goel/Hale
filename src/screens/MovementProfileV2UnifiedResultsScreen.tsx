import * as React from 'react';

import { CheckUpResultsShell } from '../results/CheckUpResultsShell';
import {
  buildMovementProfileV2UnifiedResultsPresentation,
  type MovementProfileV2PopulationComparisonInput,
  type MovementProfileV2UnifiedPlanState,
} from '../results/movementProfileV2ResultsAdapter';
import type { UnifiedCheckUpResultsAction } from '../results/types';
import type { MovementProfileV2RetestComparison } from '../adherence';
import type { MovementProfileV2ResultsViewModel } from '../movementProfileV2/viewModel';

export function MovementProfileV2UnifiedResultsScreen({
  viewModel,
  planState,
  variant = 'standard',
  retestComparison,
  populationComparison,
  onTogglePopulationComparison,
  onViewPlan,
  onViewBlockReport,
  onDone,
}: {
  viewModel: MovementProfileV2ResultsViewModel;
  planState: MovementProfileV2UnifiedPlanState;
  variant?: 'standard' | 'onboarding' | 'history';
  retestComparison?: MovementProfileV2RetestComparison | null;
  populationComparison?: MovementProfileV2PopulationComparisonInput;
  onTogglePopulationComparison?: () => void;
  onViewPlan?: () => void;
  onViewBlockReport?: () => void;
  onDone: () => void;
}) {
  const presentation = React.useMemo(
    () =>
      buildMovementProfileV2UnifiedResultsPresentation({
        viewModel,
        planState,
        variant,
        retestComparison,
        populationComparison,
      }),
    [planState, populationComparison, retestComparison, variant, viewModel]
  );

  const handleAction = React.useCallback(
    (action: UnifiedCheckUpResultsAction) => {
      if (action.type === 'view_plan') {
        onViewPlan?.();
        return;
      }
      if (action.type === 'view_block_report') {
        onViewBlockReport?.();
        return;
      }
      if (action.type === 'toggle_population_comparison') {
        onTogglePopulationComparison?.();
        return;
      }
      if (action.type === 'done') {
        onDone();
      }
    },
    [onDone, onTogglePopulationComparison, onViewBlockReport, onViewPlan]
  );

  return <CheckUpResultsShell presentation={presentation} onAction={handleAction} />;
}
