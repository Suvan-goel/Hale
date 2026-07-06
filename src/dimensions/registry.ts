/**
 * Dimension registry (REPOSITION_TDD §4, approved 2026-07-06).
 *
 * One N-dimensional model for the presentation/trend layer: results cards,
 * progress summaries, trend readings, and copy lookup iterate THIS registry so
 * adding a dimension is a registry entry + flag flip, never a component edit.
 *
 * Scope discipline (recorded in the TDD): this rationalizes presentation and
 * trend identity only. The training-side enums (ExerciseDomain,
 * TrainingDomain, …) are deliberately not rewritten — Clarity has no training
 * domain by design (one training prescription trains everything), and the
 * measurement engine's own domain keys (chair/balance/shoulder) stay engine
 * property. Adapters between worlds live here.
 *
 * RULE OF RECORD (v1): no dimension may fold into a composite/headline result.
 * `compositeEligible` is the literal type `false` — a future composite is a
 * recorded decision gated on observed noise characteristics, and it starts by
 * changing that type, which fails the registry guard test on purpose.
 */

import { isClarityDimensionEnabled } from '../config/clarityDimension';
import type { MovementDomain } from '../adherence/types';
import type { TrainingDomain } from '../training/workoutGeneration';

export type DimensionId = 'strength' | 'balance' | 'mobility' | 'clarity';

export type DimensionMeasurementBasis = 'objective_camera' | 'self_report';

export interface DimensionDefinition {
  readonly id: DimensionId;
  /** Canonical long display name (surfaces may keep local short labels). */
  readonly displayName: string;
  readonly iconToken: 'strength' | 'balance' | 'mobility' | 'clarity';
  readonly measurement: DimensionMeasurementBasis;
  /**
   * Surface ordering: strength leads every hierarchy (launch villain —
   * REPOSITION_TDD Part 1). Lower renders first.
   */
  readonly surfaceHierarchy: number;
  /** v1 rule of record — see module doc. */
  readonly compositeEligible: false;
  /**
   * Legacy identity adapters into the existing unions. Null where a world
   * genuinely has no such concept (Clarity is not a training domain and has
   * no camera-measured movement domain).
   */
  readonly movementDomain: MovementDomain | null;
  readonly trainingDomain: TrainingDomain | null;
}

export const DIMENSIONS: readonly DimensionDefinition[] = [
  {
    id: 'strength',
    displayName: 'Strength & Power',
    iconToken: 'strength',
    measurement: 'objective_camera',
    surfaceHierarchy: 0,
    compositeEligible: false,
    movementDomain: 'strength_power',
    trainingDomain: 'strength_power',
  },
  {
    id: 'balance',
    displayName: 'Balance',
    iconToken: 'balance',
    measurement: 'objective_camera',
    surfaceHierarchy: 1,
    compositeEligible: false,
    movementDomain: 'balance',
    trainingDomain: 'balance_stability',
  },
  {
    id: 'mobility',
    displayName: 'Mobility',
    iconToken: 'mobility',
    measurement: 'objective_camera',
    surfaceHierarchy: 2,
    compositeEligible: false,
    movementDomain: 'mobility',
    trainingDomain: 'mobility_flexibility',
  },
  {
    id: 'clarity',
    displayName: 'Clarity',
    iconToken: 'clarity',
    measurement: 'self_report',
    surfaceHierarchy: 3,
    compositeEligible: false,
    movementDomain: null,
    trainingDomain: null,
  },
];

export function dimensionById(id: DimensionId): DimensionDefinition {
  const found = DIMENSIONS.find((d) => d.id === id);
  if (!found) throw new Error(`unknown dimension '${id}'`);
  return found;
}

/**
 * Dimensions allowed on scoring surfaces. Clarity registers now but stays off
 * scoring surfaces until its flag flips (and even then it gets its OWN trend
 * surface — see objectiveMovementDomains for the camera-card iteration).
 */
export function activeScoringDimensions(
  clarityEnabled: boolean = isClarityDimensionEnabled()
): readonly DimensionDefinition[] {
  return DIMENSIONS.filter((d) => d.id !== 'clarity' || clarityEnabled).slice().sort(
    (a, b) => a.surfaceHierarchy - b.surfaceHierarchy
  );
}

/**
 * The camera-measured domain iteration order for V2 results/progress surfaces.
 * Registry-derived so a future objective dimension slots in; Clarity is
 * structurally excluded here regardless of its flag (self-report never renders
 * as a measurement card — REPOSITION_TDD §5.4).
 */
export function objectiveMovementDomains(): readonly MovementDomain[] {
  return DIMENSIONS.filter(
    (d): d is DimensionDefinition & { movementDomain: MovementDomain } =>
      d.measurement === 'objective_camera' && d.movementDomain !== null
  )
    .sort((a, b) => a.surfaceHierarchy - b.surfaceHierarchy)
    .map((d) => d.movementDomain);
}
