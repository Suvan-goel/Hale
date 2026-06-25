import * as React from 'react';

import { CheckUpResultsShell } from '../results/CheckUpResultsShell';
import {
  buildMovementProfileV2UnifiedResultsPresentation,
  type MovementProfileV2UnifiedPlanState,
} from '../results/movementProfileV2ResultsAdapter';
import type { UnifiedCheckUpResultsAction } from '../results/types';
import type { MovementProfileV2RetestComparison } from '../adherence';
import type {
  MovementProfileV2Domain,
  MovementProfileV2ResultsViewModel,
} from '../movementProfileV2/viewModel';

export function MovementProfileV2UnifiedResultsScreen({
  viewModel,
  planState,
  variant = 'standard',
  retestComparison,
  onOpenDomain,
  onViewPlan,
  onViewBlockReport,
  onDone,
}: {
  viewModel: MovementProfileV2ResultsViewModel;
  planState: MovementProfileV2UnifiedPlanState;
  variant?: 'standard' | 'onboarding';
  retestComparison?: MovementProfileV2RetestComparison | null;
  onOpenDomain: (domain: MovementProfileV2Domain) => void;
  onViewPlan?: () => void;
  onViewBlockReport?: () => void;
  onDone: () => void;
}) {
  const presentation = React.useMemo(
    () => buildMovementProfileV2UnifiedResultsPresentation({ viewModel, planState, variant, retestComparison }),
    [planState, retestComparison, variant, viewModel]
  );

  const handleAction = React.useCallback(
    (action: UnifiedCheckUpResultsAction) => {
      if (action.type === 'view_domain_detail') {
        onOpenDomain(action.domain);
        return;
      }
      if (action.type === 'view_plan') {
        onViewPlan?.();
        return;
      }
      if (action.type === 'view_block_report') {
        onViewBlockReport?.();
        return;
      }
      if (action.type === 'done') {
        onDone();
      }
    },
    [onDone, onOpenDomain, onViewBlockReport, onViewPlan]
  );

  return <CheckUpResultsShell presentation={presentation} onAction={handleAction} />;
}
