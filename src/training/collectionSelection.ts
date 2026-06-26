import type { AvailableEquipment } from '../adherence';
import {
  HAMSTRING_REACH_ID,
  HIP_FLEXOR_STRETCH_ID,
  THORACIC_ROTATION_ID,
  WALL_CALF_STRETCH_ID,
  getExerciseLadder,
  isExerciseLevelAvailableForRelease,
  type ExerciseLadder,
  type ExerciseLevel,
} from '../exercises';
import type { NormalizedMovementCapabilityProfile } from '../profile';
import type { PersistedGeneratedSessionSummary } from './dynamicState';
import type { DiscomfortConstraint } from './dailyTrainingContext';
import { isExerciseExcludedByDiscomfort } from './dailyTrainingContext';
import { equipmentSupportsTags } from './equipmentSafety';
import { deriveFloorExerciseEligibility } from './floorExerciseEligibility';
import { movementCapabilitySupportsLevel } from './movementCapabilitySafety';

export const MOBILITY_COLLECTION_ID = 'mobility-flexibility';

export const MOBILITY_COLLECTION_CORE_MEMBER_IDS = [
  HAMSTRING_REACH_ID,
  THORACIC_ROTATION_ID,
  HIP_FLEXOR_STRETCH_ID,
  WALL_CALF_STRETCH_ID,
] as const;

export type MobilityCollectionCoreMemberId = typeof MOBILITY_COLLECTION_CORE_MEMBER_IDS[number];

export type CollectionSelectionReason =
  | 'explicit_template_member'
  | 'never_practised_first'
  | 'least_recently_practised'
  | 'only_eligible_member'
  | 'canonical_fallback'
  | 'no_eligible_member';

export interface CollectionExposure {
  blockId: string;
  exerciseId: string;
  plannedDateKey: string;
  completedAt?: string;
  completionId: string;
}

export type CollectionSelectionResult =
  | {
      available: true;
      collectionId: string;
      selectedExerciseId: string;
      reason: CollectionSelectionReason;
      eligibleExerciseIds: readonly string[];
      practisedExerciseIds: readonly string[];
      unpractisedExerciseIds: readonly string[];
    }
  | {
      available: false;
      reason: 'no_eligible_member' | 'invalid_collection';
    };

export interface CollectionCoverageSummary {
  collectionId: string;
  totalEligibleMembers: number;
  practisedMemberIds: readonly string[];
  unpractisedMemberIds: readonly string[];
  completedExposureCount: number;
  coverageLabel: string;
  varietyLabel: string;
}

export interface PlannedCollectionSelection {
  schemaVersion: 1;
  policyFingerprint: string;
  collectionId: string;
  selectedExerciseId: string;
  reason: CollectionSelectionReason;
}

export interface CollectionEligibilityInput {
  collectionId: string;
  availableEquipment: readonly AvailableEquipment[];
  movementCapabilities: NormalizedMovementCapabilityProfile;
  discomfortConstraint: DiscomfortConstraint;
  alreadySelectedExerciseIds?: ReadonlySet<string> | readonly string[];
}

export interface CollectionSelectionInput extends CollectionEligibilityInput {
  blockId: string;
  exposures?: readonly CollectionExposure[];
  explicitExerciseId?: string;
}

export function collectionSelectionPolicyFingerprint(collectionId = MOBILITY_COLLECTION_ID): string {
  return [
    'collection-selection',
    1,
    collectionId,
    MOBILITY_COLLECTION_CORE_MEMBER_IDS.join(','),
  ].join(':');
}

export function plannedCollectionSelectionFromResult(
  result: Extract<CollectionSelectionResult, { available: true }>
): PlannedCollectionSelection {
  return {
    schemaVersion: 1,
    policyFingerprint: collectionSelectionPolicyFingerprint(result.collectionId),
    collectionId: result.collectionId,
    selectedExerciseId: result.selectedExerciseId,
    reason: result.reason,
  };
}

export function isPlannedCollectionSelection(value: unknown): value is PlannedCollectionSelection {
  if (!value || typeof value !== 'object') return false;
  const selection = value as Partial<PlannedCollectionSelection>;
  return (
    selection.schemaVersion === 1 &&
    typeof selection.policyFingerprint === 'string' &&
    typeof selection.collectionId === 'string' &&
    typeof selection.selectedExerciseId === 'string' &&
    isCollectionSelectionReason(selection.reason)
  );
}

export function mobilityCollectionMemberIds(): readonly MobilityCollectionCoreMemberId[] {
  return MOBILITY_COLLECTION_CORE_MEMBER_IDS;
}

export function eligibleCollectionMemberIds(input: CollectionEligibilityInput): string[] {
  const ladder = validCollectionLadder(input.collectionId);
  if (!ladder) return [];
  return collectionMembers(ladder)
    .filter((level) => isEligibleCollectionLevel(level, ladder, input))
    .map((level) => level.id);
}

export function selectCollectionMember(input: CollectionSelectionInput): CollectionSelectionResult {
  const ladder = validCollectionLadder(input.collectionId);
  if (!ladder) return { available: false, reason: 'invalid_collection' };

  const baseEligible = collectionMembers(ladder)
    .filter((level) => isEligibleCollectionLevel(level, ladder, input))
    .map((level) => level.id);

  if (baseEligible.length === 0) return { available: false, reason: 'no_eligible_member' };

  const alreadySelected = normalizeSelected(input.alreadySelectedExerciseIds);
  const notAlreadySelected = baseEligible.filter((id) => !alreadySelected.has(id));
  const eligible = notAlreadySelected.length > 0 ? notAlreadySelected : baseEligible;
  const history = exposureHistory(input.exposures ?? [], input.blockId);
  const practised = baseEligible.filter((id) => history.lastByExerciseId.has(id));
  const unpractised = baseEligible.filter((id) => !history.lastByExerciseId.has(id));

  if (input.explicitExerciseId && eligible.includes(input.explicitExerciseId)) {
    return availableResult(input.collectionId, input.explicitExerciseId, 'explicit_template_member', eligible, practised, unpractised);
  }

  if (eligible.length === 1) {
    return availableResult(input.collectionId, eligible[0], 'only_eligible_member', eligible, practised, unpractised);
  }

  const unpractisedEligible = eligible.filter((id) => !history.lastByExerciseId.has(id));
  if (unpractisedEligible.length > 0) {
    return availableResult(
      input.collectionId,
      firstCanonical(unpractisedEligible),
      'never_practised_first',
      eligible,
      practised,
      unpractised
    );
  }

  const selected = eligible
    .slice()
    .sort((a, b) => compareLastExposure(a, b, history.lastByExerciseId))[0];

  return availableResult(
    input.collectionId,
    selected ?? firstCanonical(eligible),
    selected ? 'least_recently_practised' : 'canonical_fallback',
    eligible,
    practised,
    unpractised
  );
}

export function collectionCoverageSummary(input: CollectionSelectionInput): CollectionCoverageSummary {
  const eligible = eligibleCollectionMemberIds(input);
  const history = exposureHistory(input.exposures ?? [], input.blockId);
  const practised = eligible.filter((id) => history.lastByExerciseId.has(id));
  const unpractised = eligible.filter((id) => !history.lastByExerciseId.has(id));
  return {
    collectionId: input.collectionId,
    totalEligibleMembers: eligible.length,
    practisedMemberIds: practised,
    unpractisedMemberIds: unpractised,
    completedExposureCount: history.count,
    coverageLabel: coverageLabel(practised.length, eligible.length),
    varietyLabel: varietyLabel(practised.length, eligible.length),
  };
}

export function collectionExposuresFromGeneratedSessionSummaries(input: {
  blockId: string;
  summaries?: readonly PersistedGeneratedSessionSummary[] | null;
  collectionId?: string;
}): CollectionExposure[] {
  const collectionId = input.collectionId ?? MOBILITY_COLLECTION_ID;
  const validIds = new Set(collectionMembers(validCollectionLadder(collectionId)).map((level) => level.id));
  const out: CollectionExposure[] = [];
  const seen = new Set<string>();

  for (const summary of input.summaries ?? []) {
    if (!isAuthoritativeBlockGeneratedSummary(summary, input.blockId)) continue;
    const completedIds = authoritativeCompletedCollectionIds(summary, validIds);
    if (completedIds.length === 0) continue;
    const completionId = summary.scheduleCredit?.creditId ?? summary.id;
    if (!completionId || !summary.plannedDateKey) continue;
    for (const exerciseId of completedIds) {
      const key = `${completionId}:${exerciseId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        blockId: input.blockId,
        exerciseId,
        plannedDateKey: summary.plannedDateKey,
        completedAt: summary.completedAt,
        completionId,
      });
    }
  }

  return out.sort(compareExposures);
}

function validCollectionLadder(collectionId: string): ExerciseLadder | null {
  let ladder: ExerciseLadder;
  try {
    ladder = getExerciseLadder(collectionId);
  } catch {
    return null;
  }
  return ladder.progressionModel === 'collection' ? ladder : null;
}

function collectionMembers(ladder: ExerciseLadder | null): ExerciseLevel[] {
  if (!ladder || ladder.id !== MOBILITY_COLLECTION_ID) return [];
  const coreIds = new Set<string>(MOBILITY_COLLECTION_CORE_MEMBER_IDS);
  return ladder.levels.filter((level) => coreIds.has(level.id));
}

function isEligibleCollectionLevel(
  level: ExerciseLevel,
  ladder: ExerciseLadder,
  input: CollectionEligibilityInput
): boolean {
  return (
    isExerciseLevelAvailableForRelease(level) &&
    deriveFloorExerciseEligibility({
      level,
      ladder,
      availableEquipment: input.availableEquipment,
      movementCapabilities: input.movementCapabilities,
      discomfortConstraint: input.discomfortConstraint,
    }).eligible &&
    equipmentSupportsTags(level.equipment, input.availableEquipment) &&
    movementCapabilitySupportsLevel(level, input.movementCapabilities) &&
    !isExerciseExcludedByDiscomfort(ladder, level, input.discomfortConstraint)
  );
}

function exposureHistory(exposures: readonly CollectionExposure[], blockId: string): {
  count: number;
  lastByExerciseId: Map<string, CollectionExposure>;
} {
  const validIds = new Set<string>(MOBILITY_COLLECTION_CORE_MEMBER_IDS);
  const seen = new Set<string>();
  const lastByExerciseId = new Map<string, CollectionExposure>();
  let count = 0;

  for (const exposure of exposures) {
    if (exposure.blockId !== blockId) continue;
    if (!validIds.has(exposure.exerciseId)) continue;
    if (!exposure.completionId || !exposure.plannedDateKey) continue;
    const key = `${exposure.completionId}:${exposure.exerciseId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    count += 1;
    const existing = lastByExerciseId.get(exposure.exerciseId);
    if (!existing || compareExposureRecency(exposure, existing) > 0) {
      lastByExerciseId.set(exposure.exerciseId, exposure);
    }
  }

  return { count, lastByExerciseId };
}

function availableResult(
  collectionId: string,
  selectedExerciseId: string,
  reason: CollectionSelectionReason,
  eligibleExerciseIds: readonly string[],
  practisedExerciseIds: readonly string[],
  unpractisedExerciseIds: readonly string[]
): Extract<CollectionSelectionResult, { available: true }> {
  return {
    available: true,
    collectionId,
    selectedExerciseId,
    reason,
    eligibleExerciseIds: canonicalSort(eligibleExerciseIds),
    practisedExerciseIds: canonicalSort(practisedExerciseIds),
    unpractisedExerciseIds: canonicalSort(unpractisedExerciseIds),
  };
}

function compareLastExposure(a: string, b: string, lastByExerciseId: Map<string, CollectionExposure>): number {
  const aExposure = lastByExerciseId.get(a);
  const bExposure = lastByExerciseId.get(b);
  if (!aExposure && !bExposure) return canonicalIndex(a) - canonicalIndex(b);
  if (!aExposure) return -1;
  if (!bExposure) return 1;
  const recency = compareExposureRecency(aExposure, bExposure);
  if (recency !== 0) return recency;
  const canonical = canonicalIndex(a) - canonicalIndex(b);
  if (canonical !== 0) return canonical;
  return aExposure.completionId.localeCompare(bExposure.completionId);
}

function compareExposureRecency(a: CollectionExposure, b: CollectionExposure): number {
  const aKey = exposureSortKey(a);
  const bKey = exposureSortKey(b);
  if (aKey !== bKey) return aKey.localeCompare(bKey);
  return a.completionId.localeCompare(b.completionId);
}

function compareExposures(a: CollectionExposure, b: CollectionExposure): number {
  return [
    a.blockId.localeCompare(b.blockId),
    a.plannedDateKey.localeCompare(b.plannedDateKey),
    (a.completedAt ?? '').localeCompare(b.completedAt ?? ''),
    a.completionId.localeCompare(b.completionId),
    canonicalIndex(a.exerciseId) - canonicalIndex(b.exerciseId),
  ].find((value) => value !== 0) ?? 0;
}

function exposureSortKey(exposure: CollectionExposure): string {
  return exposure.completedAt ?? exposure.plannedDateKey;
}

function firstCanonical(ids: readonly string[]): string {
  return canonicalSort(ids)[0] ?? ids[0];
}

function canonicalSort(ids: readonly string[]): string[] {
  return [...new Set(ids)].sort((a, b) => canonicalIndex(a) - canonicalIndex(b) || a.localeCompare(b));
}

function canonicalIndex(id: string): number {
  const idx = MOBILITY_COLLECTION_CORE_MEMBER_IDS.findIndex((item) => item === id);
  return idx >= 0 ? idx : Number.MAX_SAFE_INTEGER;
}

function normalizeSelected(value: ReadonlySet<string> | readonly string[] | undefined): Set<string> {
  if (!value) return new Set();
  return value instanceof Set ? new Set(value) : new Set(value);
}

function authoritativeCompletedCollectionIds(
  summary: PersistedGeneratedSessionSummary,
  validIds: ReadonlySet<string>
): string[] {
  const focus = summary.focusStimulusEvidence;
  if (!focus) return [];
  const completedIds = [
    ...(focus.completedPrimaryFocusExerciseIds ?? []),
    ...(focus.completedSupportingExerciseIds ?? []),
  ];
  const planned = summary.exercises ?? [];
  const plannedNonFallback = new Set(
    planned
      .filter((exercise) => exercise.stimulusRole === 'primary' || exercise.stimulusRole === 'supporting')
      .map((exercise) => exercise.exerciseId)
  );
  return canonicalSort(
    completedIds.filter((id) => validIds.has(id) && plannedNonFallback.has(id))
  );
}

function isAuthoritativeBlockGeneratedSummary(summary: PersistedGeneratedSessionSummary, blockId: string): boolean {
  if (summary.blockId !== blockId) return false;
  if (summary.source !== 'block_generated') return false;
  if (summary.completionSource !== 'block_generated') return false;
  if (summary.sessionType !== 'starter' && summary.sessionType !== 'standard' && summary.sessionType !== 'restart') return false;
  if (summary.status === 'skipped') return false;
  if (!summary.plannedDateKey || !summary.completedAt) return false;
  if (!summary.workEvidence || summary.workEvidence.completedExerciseCount <= 0) return false;
  if (summary.workEvidence.duplicateResultCount > 0 || summary.workEvidence.malformedResultCount > 0) return false;
  if (summary.workEvidence.unmatchedResultCount > 0) return false;
  if (!summary.focusStimulusEvidence) return false;
  if (summary.focusStimulusEvidence.completedFallbackExerciseCount > 0 && summary.focusStimulusEvidence.completedPrimaryFocusExerciseCount === 0 && summary.focusStimulusEvidence.completedSupportingExerciseCount === 0) {
    return false;
  }
  return true;
}

function coverageLabel(practised: number, total: number): string {
  if (total <= 0) return 'No mobility areas are currently available with this setup.';
  if (practised >= total) return 'All currently available mobility areas have been practised.';
  return `${practised} of ${total} mobility areas practised this block.`;
}

function varietyLabel(practised: number, total: number): string {
  if (total <= 0) return 'Review your setup to unlock mobility movements.';
  if (practised >= total) return 'Hale will continue varying these movements across your block.';
  return 'Hale varies these movements across your block.';
}

function isCollectionSelectionReason(value: unknown): value is CollectionSelectionReason {
  return (
    value === 'explicit_template_member' ||
    value === 'never_practised_first' ||
    value === 'least_recently_practised' ||
    value === 'only_eligible_member' ||
    value === 'canonical_fallback' ||
    value === 'no_eligible_member'
  );
}
