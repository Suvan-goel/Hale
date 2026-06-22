/**
 * Persisted training records: schema-versioned from day one (CLAUDE.md data
 * rule), pure (de)serialization + migration with no I/O — fully unit-testable
 * with the in-memory HistoryFs. Two stored shapes:
 *
 *   TrainingState   — the single mutable record (active block + progression +
 *                     equipment profile + block progress). Overwritten in place.
 *   MicroCheckResult — append-only log (one file per micro-check), feeding the
 *                     trend line between full check-ups.
 *
 * Non-finite numbers (NaN for an unmeasured micro-check value) serialise as null
 * and read back as null; every consumer already guards with Number.isFinite.
 * Forward-compatible: a record from an unknown schema version is skipped, not
 * crashed (mirrors history/serialize.ts).
 */

import { DEFAULT_EQUIPMENT, EquipmentProfile, TrainingBlock } from './block';
import {
  PersistedGeneratedExerciseSummary,
  PersistedGeneratedSessionSummary,
  PersistedPostSessionFeedback,
  emptyLadderProgress,
  normalizeAppliedProgressionEventIds,
} from './dynamicState';
import { MicroCheckResult, MicroCheckType } from './microCheck';
import { ProgressionState, initialProgressionState } from './progression';
import type {
  DailyReadiness,
  GeneratedExerciseDose,
  LadderProgress,
  PainArea,
  SessionSlotType,
  SlotStimulusReason,
  SlotStimulusRole,
  TrackingQuality,
  TrainingDomain,
} from './workoutGeneration';
import type {
  DailyTrainingInputStatus,
  DailyTrainingReasonCode,
  NormalizedDailyTrainingContext,
  ProgressionEvidencePolicy,
} from './dailyTrainingContext';
import {
  CANONICAL_EQUIPMENT_SCHEMA_VERSION,
  equipmentSnapshotFingerprint,
  isCanonicalEquipmentCapability,
  isCanonicalEquipmentStatus,
  sortCapabilities,
  type PlannedEquipmentSnapshot,
} from '../profile/equipment';
import {
  isPlannedMovementCapabilitySnapshot,
  type PlannedMovementCapabilitySnapshot,
} from '../profile/movementCapabilities';
import {
  isPlannedProgressionPolicySnapshot,
  type ProgressionPolicyDiagnosticCode,
  type ProgressionPolicySelectionReason,
} from '../exercises';
import { isPlannedCollectionSelection } from './collectionSelection';

export const TRAINING_SCHEMA_VERSION = 4;

export interface BlockProgress {
  /** Sessions of the active block completed so far. */
  completedSessions: number;
  lastSessionAt: string | null;
  /** Set once the block is finished — the in-app "time to re-test" trigger. */
  retestDueAt: string | null;
}

export interface TrainingState {
  block: TrainingBlock | null;
  progression: ProgressionState;
  equipment: EquipmentProfile;
  progress: BlockProgress;
  ladderProgressById: Record<string, LadderProgress>;
  appliedProgressionEventIds: string[];
  generatedSessionSummaries: PersistedGeneratedSessionSummary[];
  lastPostSessionFeedback: PersistedPostSessionFeedback | null;
  planPreferences: TrainingPlanPreferences;
}

export type TrainingIntensityPreference = 'gentle' | 'standard' | 'more_challenge';

export interface TrainingPlanPreferences {
  preferredIntensity: TrainingIntensityPreference;
}

export function defaultBlockProgress(): BlockProgress {
  return { completedSessions: 0, lastSessionAt: null, retestDueAt: null };
}

export function defaultTrainingState(): TrainingState {
  return {
    block: null,
    progression: initialProgressionState(),
    equipment: { ...DEFAULT_EQUIPMENT },
    progress: defaultBlockProgress(),
    ladderProgressById: emptyLadderProgress(),
    appliedProgressionEventIds: [],
    generatedSessionSummaries: [],
    lastPostSessionFeedback: null,
    planPreferences: defaultTrainingPlanPreferences(),
  };
}

export function defaultTrainingPlanPreferences(): TrainingPlanPreferences {
  return { preferredIntensity: 'standard' };
}

function nanReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'number' && !Number.isFinite(value) ? null : value;
}

interface Envelope<T> {
  schemaVersion: number;
  payload: T;
}

export function serializeTrainingState(state: TrainingState): string {
  const env: Envelope<TrainingState> = { schemaVersion: TRAINING_SCHEMA_VERSION, payload: state };
  return JSON.stringify(env, nanReplacer);
}

export function deserializeTrainingState(json: string): TrainingState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const env = parsed as Partial<Envelope<TrainingState>>;
  if (
    env.schemaVersion !== 1 &&
    env.schemaVersion !== 2 &&
    env.schemaVersion !== 3 &&
    env.schemaVersion !== TRAINING_SCHEMA_VERSION
  ) {
    return null;
  }
  const p = env.payload;
  if (!p || typeof p !== 'object') return null;
  const def = defaultTrainingState();
  // Defensive: fill missing sub-records with defaults rather than crash.
  return {
    block: p.block ?? null,
    progression: validProgression(p.progression) ?? def.progression,
    equipment: validEquipment(p.equipment) ?? def.equipment,
    progress: validProgress(p.progress) ?? def.progress,
    ladderProgressById: validLadderProgressById(p.ladderProgressById),
    appliedProgressionEventIds: validAppliedProgressionEventIds(p.appliedProgressionEventIds),
    generatedSessionSummaries: validGeneratedSessionSummaries(p.generatedSessionSummaries),
    lastPostSessionFeedback: validPostSessionFeedback(p.lastPostSessionFeedback),
    planPreferences: validTrainingPlanPreferences(p.planPreferences),
  };
}

function validProgression(v: unknown): ProgressionState | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Partial<ProgressionState>;
  if (typeof p.levels !== 'object' || typeof p.velHistory !== 'object') return null;
  return { levels: p.levels as Record<string, number>, velHistory: p.velHistory as Record<string, number[]> };
}

function validEquipment(v: unknown): EquipmentProfile | null {
  if (!v || typeof v !== 'object') return null;
  const e = v as Partial<EquipmentProfile>;
  return { stair: !!e.stair, band: !!e.band, miniBand: !!e.miniBand, load: !!e.load };
}

function validProgress(v: unknown): BlockProgress | null {
  if (!v || typeof v !== 'object') return null;
  const g = v as Partial<BlockProgress>;
  if (typeof g.completedSessions !== 'number') return null;
  return {
    completedSessions: g.completedSessions,
    lastSessionAt: typeof g.lastSessionAt === 'string' ? g.lastSessionAt : null,
    retestDueAt: typeof g.retestDueAt === 'string' ? g.retestDueAt : null,
  };
}

function validTrainingPlanPreferences(v: unknown): TrainingPlanPreferences {
  const def = defaultTrainingPlanPreferences();
  if (!v || typeof v !== 'object') return def;
  const p = v as Partial<TrainingPlanPreferences>;
  return {
    preferredIntensity:
      p.preferredIntensity === 'gentle' || p.preferredIntensity === 'standard' || p.preferredIntensity === 'more_challenge'
        ? p.preferredIntensity
        : def.preferredIntensity,
  };
}

const TRACKING_QUALITIES: TrackingQuality[] = ['good', 'usable', 'poor'];
const PAIN_AREAS: PainArea[] = ['knee', 'hip', 'back', 'shoulder', 'ankle', 'neck', 'other'];
const READINESS: DailyReadiness[] = ['ready', 'a_bit_stiff', 'low_energy', 'something_hurts', 'short_on_time'];
const DAILY_INPUT_STATUSES: DailyTrainingInputStatus[] = ['valid', 'defaulted_cautious', 'malformed_fail_closed'];
const PROGRESSION_EVIDENCE_POLICIES: ProgressionEvidencePolicy[] = ['normal', 'hold_only', 'ineligible'];
const DAILY_REASON_CODES: DailyTrainingReasonCode[] = [
  'readiness_valid',
  'readiness_missing_default_ready',
  'readiness_missing_default_cautious',
  'readiness_malformed_cautious',
  'discomfort_explicit_none',
  'discomfort_reported',
  'discomfort_deduped',
  'discomfort_malformed_fail_closed',
  'legacy_context_cautious',
  'short_on_time',
  'reduced_readiness',
  'controlled_beta_release_cap',
  'auto_progression_cap',
  'non_linear_default',
  'legacy_progression_policy_capped',
];
const SLOT_TYPES: SessionSlotType[] = [
  'lower_body_strength',
  'upper_body_push',
  'upper_body_pull',
  'balance',
  'dynamic_balance',
  'lateral_stability',
  'mobility',
  'posterior_chain',
  'ankle',
  'shoulder_mobility',
  'trunk_mobility',
  'hip_mobility',
  'posterior_chain_mobility',
];

function validLadderProgressById(v: unknown): Record<string, LadderProgress> {
  if (!v || typeof v !== 'object') return {};
  const out: Record<string, LadderProgress> = {};
  for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
    const progress = validLadderProgress(value);
    if (progress) out[progress.ladderId || key] = progress;
  }
  return out;
}

function validLadderProgress(v: unknown): LadderProgress | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Partial<LadderProgress>;
  if (typeof p.ladderId !== 'string' || typeof p.currentLevelId !== 'string') return null;
  return {
    ladderId: p.ladderId,
    currentLevelId: p.currentLevelId,
    currentLevelIndex: finiteNumber(p.currentLevelIndex),
    recentCompletions: finiteNumber(p.recentCompletions),
    recentFailures: finiteNumber(p.recentFailures),
    completedSessionsAtLevel: finiteNumber(p.completedSessionsAtLevel) ?? 0,
    failedSessionsAtLevel: finiteNumber(p.failedSessionsAtLevel) ?? 0,
    recentCompletionRates: numberArray(p.recentCompletionRates),
    recentRpe: numberArray(p.recentRpe),
    recentPain: booleanArray(p.recentPain),
    lastRpe: finiteNumber(p.lastRpe),
    lastPain: typeof p.lastPain === 'boolean' ? p.lastPain : undefined,
    lastPainArea: isPainArea(p.lastPainArea) ? p.lastPainArea : undefined,
    lastTrackingQuality: isTrackingQuality(p.lastTrackingQuality) ? p.lastTrackingQuality : undefined,
    lastCompletedAt: typeof p.lastCompletedAt === 'string' ? p.lastCompletedAt : undefined,
    readyToProgress: typeof p.readyToProgress === 'boolean' ? p.readyToProgress : undefined,
    transitionEvidenceKey: typeof p.transitionEvidenceKey === 'string' ? p.transitionEvidenceKey : undefined,
    progressionPolicyFingerprint:
      typeof p.progressionPolicyFingerprint === 'string' ? p.progressionPolicyFingerprint : undefined,
    lastProgressionDecisionReason:
      isProgressionDecisionReason(p.lastProgressionDecisionReason) ? p.lastProgressionDecisionReason : undefined,
    updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date(0).toISOString(),
  };
}

function validAppliedProgressionEventIds(v: unknown): string[] {
  return normalizeAppliedProgressionEventIds(Array.isArray(v) ? v : []);
}

function validGeneratedSessionSummaries(v: unknown): PersistedGeneratedSessionSummary[] {
  if (!Array.isArray(v)) return [];
  return v.map(validGeneratedSessionSummary).filter((item): item is PersistedGeneratedSessionSummary => !!item);
}

function validGeneratedSessionSummary(v: unknown): PersistedGeneratedSessionSummary | null {
  if (!v || typeof v !== 'object') return null;
  const s = v as Partial<PersistedGeneratedSessionSummary>;
  if (typeof s.id !== 'string' || typeof s.title !== 'string' || !Array.isArray(s.exerciseIds)) return null;
  const source =
    s.source === 'block_generated' || s.source === 'preset' || s.source === 'manual' || s.source === 'legacy'
      ? s.source
      : 'legacy';
  return {
    id: s.id,
    blockId: typeof s.blockId === 'string' ? s.blockId : undefined,
    source,
    templateId: typeof s.templateId === 'string' ? s.templateId : undefined,
    plannedDateKey: typeof s.plannedDateKey === 'string' ? s.plannedDateKey : undefined,
    sessionType: isTrainingSessionCompletionType(s.sessionType) ? s.sessionType : undefined,
    completionSource: isTrainingSessionCompletionSource(s.completionSource) ? s.completionSource : undefined,
    status: isGeneratedSessionStatus(s.status) ? s.status : undefined,
    mainPlanCredit: typeof s.mainPlanCredit === 'boolean' ? s.mainPlanCredit : undefined,
    scheduleCredit: validScheduleCredit(s.scheduleCredit),
    workEvidence: validWorkEvidence(s.workEvidence),
    focusStimulusEvidence: validFocusStimulusEvidence(s.focusStimulusEvidence),
    title: s.title,
    focus: typeof s.focus === 'string' ? s.focus : undefined,
    generatedAt: typeof s.generatedAt === 'string' ? s.generatedAt : undefined,
    completedAt: typeof s.completedAt === 'string' ? s.completedAt : undefined,
    exerciseIds: s.exerciseIds.filter((id): id is string => typeof id === 'string'),
    ladderIds: Array.isArray(s.ladderIds) ? s.ladderIds.filter((id): id is string => typeof id === 'string') : undefined,
    readiness: isReadiness(s.readiness) ? s.readiness : undefined,
    painArea: isPainArea(s.painArea) ? s.painArea : undefined,
    dailyContext: validDailyContext(s.dailyContext),
    progressionEvidencePolicy: isProgressionEvidencePolicy(s.progressionEvidencePolicy)
      ? s.progressionEvidencePolicy
      : 'ineligible',
    adjustmentReasons: validReasonCodes(s.adjustmentReasons),
    durationMinutes: finiteNumber(s.durationMinutes),
    equipmentSnapshot: validPlannedEquipmentSnapshot(s.equipmentSnapshot),
    movementCapabilitySnapshot: validPlannedMovementCapabilitySnapshot(s.movementCapabilitySnapshot),
    progressionPolicySnapshot: validPlannedProgressionPolicySnapshot(s.progressionPolicySnapshot),
    exercises: validGeneratedExerciseSummaries(s.exercises),
    feedback: validPostSessionFeedback(s.feedback) ?? undefined,
  };
}

function validScheduleCredit(v: unknown): PersistedGeneratedSessionSummary['scheduleCredit'] {
  if (!v || typeof v !== 'object') return undefined;
  const s = v as NonNullable<PersistedGeneratedSessionSummary['scheduleCredit']>;
  if (typeof s.credited !== 'boolean') return undefined;
  if (s.status !== 'credited' && s.status !== 'denied' && s.status !== 'not_applicable') return undefined;
  return {
    policyVersion:
      typeof s.policyVersion === 'number' && Number.isFinite(s.policyVersion)
        ? s.policyVersion
        : 0,
    credited: s.credited,
    status: s.status,
    reason: typeof s.reason === 'string' ? s.reason : undefined,
    weekIndex:
      typeof s.weekIndex === 'number' && Number.isFinite(s.weekIndex)
        ? s.weekIndex
        : undefined,
    weekNumber:
      typeof s.weekNumber === 'number' && Number.isFinite(s.weekNumber)
        ? s.weekNumber
        : undefined,
    dateKey: typeof s.dateKey === 'string' ? s.dateKey : undefined,
    templateId: typeof s.templateId === 'string' ? s.templateId : undefined,
    creditId: typeof s.creditId === 'string' ? s.creditId : undefined,
  };
}

function validPlannedEquipmentSnapshot(v: unknown): PlannedEquipmentSnapshot | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const s = v as Partial<PlannedEquipmentSnapshot>;
  if (s.schemaVersion !== CANONICAL_EQUIPMENT_SCHEMA_VERSION || !Array.isArray(s.capabilities) || !isCanonicalEquipmentStatus(s.status)) {
    return undefined;
  }
  const capabilities = sortCapabilities(
    s.capabilities.filter((capability): capability is PlannedEquipmentSnapshot['capabilities'][number] =>
      isCanonicalEquipmentCapability(capability)
    )
  );
  const expected = equipmentSnapshotFingerprint({
    schemaVersion: CANONICAL_EQUIPMENT_SCHEMA_VERSION,
    capabilities,
    status: s.status,
  });
  if (typeof s.fingerprint !== 'string' || s.fingerprint !== expected) return undefined;
  return {
    schemaVersion: CANONICAL_EQUIPMENT_SCHEMA_VERSION,
    capabilities,
    status: s.status,
    fingerprint: s.fingerprint,
    sourceRevision:
      typeof s.sourceRevision === 'number' && Number.isFinite(s.sourceRevision)
        ? s.sourceRevision
        : undefined,
    sourceUpdatedAt: typeof s.sourceUpdatedAt === 'string' ? s.sourceUpdatedAt : undefined,
  };
}

function validPlannedMovementCapabilitySnapshot(v: unknown): PlannedMovementCapabilitySnapshot | undefined {
  return isPlannedMovementCapabilitySnapshot(v) ? v : undefined;
}

function validPlannedProgressionPolicySnapshot(v: unknown) {
  return isPlannedProgressionPolicySnapshot(v) ? v : undefined;
}

function validGeneratedExerciseSummaries(v: unknown): PersistedGeneratedExerciseSummary[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v
    .map((item): PersistedGeneratedExerciseSummary | null => {
      if (!item || typeof item !== 'object') return null;
      const e = item as Partial<PersistedGeneratedExerciseSummary>;
      if (typeof e.exerciseId !== 'string') return null;
      const progressionPolicyDiagnostics = validProgressionPolicyDiagnostics(e.progressionPolicyDiagnostics);
      return {
        exerciseId: e.exerciseId,
        ladderId: typeof e.ladderId === 'string' ? e.ladderId : undefined,
        levelId: typeof e.levelId === 'string' ? e.levelId : undefined,
        slotType: isSlotType(e.slotType) ? e.slotType : undefined,
        sets: finiteNumber(e.sets),
        repsPerSet: finiteNumber(e.repsPerSet),
        secondsPerSet: finiteNumber(e.secondsPerSet),
        measurementTier:
          e.measurementTier === 'measured' || e.measurementTier === 'camera_assisted' || e.measurementTier === 'voice_guided'
            ? e.measurementTier
            : undefined,
        intendedDomain: isTrainingDomain(e.intendedDomain) ? e.intendedDomain : undefined,
        stimulusRole: isStimulusRole(e.stimulusRole) ? e.stimulusRole : undefined,
        stimulusReason: isStimulusReason(e.stimulusReason) ? e.stimulusReason : undefined,
        requestedLevelId: typeof e.requestedLevelId === 'string' ? e.requestedLevelId : undefined,
        storedLevelId: typeof e.storedLevelId === 'string' ? e.storedLevelId : undefined,
        selectedDailyLevelId: typeof e.selectedDailyLevelId === 'string' ? e.selectedDailyLevelId : undefined,
        progressionPolicySelectionReason: isProgressionPolicySelectionReason(e.progressionPolicySelectionReason)
          ? e.progressionPolicySelectionReason
          : undefined,
        ...(progressionPolicyDiagnostics ? { progressionPolicyDiagnostics } : {}),
        doseBeforeAdjustment: validGeneratedExerciseDose(e.doseBeforeAdjustment),
        adjustmentReasons: validReasonCodes(e.adjustmentReasons),
        collectionSelection: isPlannedCollectionSelection(e.collectionSelection) ? e.collectionSelection : undefined,
      };
    })
    .filter((item): item is PersistedGeneratedExerciseSummary => !!item);
}

function isTrainingDomain(v: unknown): v is TrainingDomain {
  return v === 'strength_power' || v === 'balance_stability' || v === 'mobility_flexibility';
}

function isTrainingSessionCompletionType(v: unknown): v is PersistedGeneratedSessionSummary['sessionType'] {
  return v === 'standard' || v === 'starter' || v === 'restart' || v === 'micro_check' || v === 'retest_prep' || v === 'retest';
}

function isTrainingSessionCompletionSource(v: unknown): v is PersistedGeneratedSessionSummary['completionSource'] {
  return v === 'block_generated' || v === 'preset' || v === 'manual' || v === 'legacy_fallback';
}

function isGeneratedSessionStatus(v: unknown): v is NonNullable<PersistedGeneratedSessionSummary['status']> {
  return v === 'completed' || v === 'partial' || v === 'skipped';
}

function validWorkEvidence(v: unknown): PersistedGeneratedSessionSummary['workEvidence'] {
  if (!v || typeof v !== 'object') return undefined;
  const e = v as Partial<NonNullable<PersistedGeneratedSessionSummary['workEvidence']>>;
  const summary = {
    plannedExerciseCount: finiteNumber(e.plannedExerciseCount),
    resultItemCount: finiteNumber(e.resultItemCount),
    completedExerciseCount: finiteNumber(e.completedExerciseCount),
    skippedExerciseCount: finiteNumber(e.skippedExerciseCount),
    missingResultCount: finiteNumber(e.missingResultCount),
    duplicateResultCount: finiteNumber(e.duplicateResultCount),
    malformedResultCount: finiteNumber(e.malformedResultCount),
    unmatchedResultCount: finiteNumber(e.unmatchedResultCount),
  };
  return Object.values(summary).every((value) => typeof value === 'number') ? summary as NonNullable<PersistedGeneratedSessionSummary['workEvidence']> : undefined;
}

function validFocusStimulusEvidence(v: unknown): PersistedGeneratedSessionSummary['focusStimulusEvidence'] {
  if (!v || typeof v !== 'object') return undefined;
  const e = v as Partial<NonNullable<PersistedGeneratedSessionSummary['focusStimulusEvidence']>>;
  if (!isFocusPlanStatus(e.planStatus) || !isFocusCompletionStatus(e.status) || !isFocusExclusionReason(e.exclusionReason)) {
    return undefined;
  }
  const summary = {
    planStatus: e.planStatus,
    status: e.status,
    exclusionReason: e.exclusionReason,
    mainPlanCredit: e.mainPlanCredit === true,
    blockFocusDomain: isMovementDomain(e.blockFocusDomain) ? e.blockFocusDomain : undefined,
    plannedPrimaryFocusExerciseCount: finiteNumber(e.plannedPrimaryFocusExerciseCount),
    completedPrimaryFocusExerciseCount: finiteNumber(e.completedPrimaryFocusExerciseCount),
    completedSupportingExerciseCount: finiteNumber(e.completedSupportingExerciseCount),
    completedFallbackExerciseCount: finiteNumber(e.completedFallbackExerciseCount),
    completedCrossDomainExerciseCount: finiteNumber(e.completedCrossDomainExerciseCount),
    plannedPrimaryFocusExerciseIds: stringArray(e.plannedPrimaryFocusExerciseIds),
    completedPrimaryFocusExerciseIds: stringArray(e.completedPrimaryFocusExerciseIds),
    completedSupportingExerciseIds: stringArray(e.completedSupportingExerciseIds),
    completedFallbackExerciseIds: stringArray(e.completedFallbackExerciseIds),
    completedCrossDomainExerciseIds: stringArray(e.completedCrossDomainExerciseIds),
    fallbackFocusSlotIds: stringArray(e.fallbackFocusSlotIds),
    skippedFocusSlotIds: stringArray(e.skippedFocusSlotIds),
    focusStimulusExclusionReasons: stringArray(e.focusStimulusExclusionReasons),
    missingMetadataExerciseIds: stringArray(e.missingMetadataExerciseIds),
    malformedMetadataExerciseIds: stringArray(e.malformedMetadataExerciseIds),
    focusMismatchExerciseIds: stringArray(e.focusMismatchExerciseIds),
    mainPlanClassifierReason: typeof e.mainPlanClassifierReason === 'string' ? e.mainPlanClassifierReason : undefined,
  };
  return typeof summary.plannedPrimaryFocusExerciseCount === 'number' &&
    typeof summary.completedPrimaryFocusExerciseCount === 'number' &&
    typeof summary.completedSupportingExerciseCount === 'number' &&
    typeof summary.completedFallbackExerciseCount === 'number' &&
    typeof summary.completedCrossDomainExerciseCount === 'number'
    ? summary as NonNullable<PersistedGeneratedSessionSummary['focusStimulusEvidence']>
    : undefined;
}

function isStimulusRole(v: unknown): v is SlotStimulusRole {
  return v === 'primary' || v === 'supporting' || v === 'fallback' || v === 'skipped' || v === 'invalid';
}

function isStimulusReason(v: unknown): v is SlotStimulusReason {
  return (
    v === 'direct_match' ||
    v === 'equipment_limited' ||
    v === 'safety_limited' ||
    v === 'supporting_maintenance' ||
    v === 'no_safe_option' ||
    v === 'band_required' ||
    v === 'floor_required' ||
    v === 'support_required' ||
    v === 'stair_support_required' ||
    v === 'movement_setup_required'
  );
}

function isProgressionPolicySelectionReason(v: unknown): v is ProgressionPolicySelectionReason {
  return (
    v === 'stored_level' ||
    v === 'release_cap' ||
    v === 'auto_progression_cap' ||
    v === 'non_linear_default' ||
    v === 'explicit_template_member' ||
    v === 'daily_regression'
  );
}

function validProgressionPolicyDiagnostics(v: unknown): ProgressionPolicyDiagnosticCode[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter(isProgressionPolicyDiagnosticCode);
  return out.length > 0 ? Array.from(new Set(out)) : undefined;
}

function isProgressionPolicyDiagnosticCode(v: unknown): v is ProgressionPolicyDiagnosticCode {
  return (
    v === 'stored_level_invalid' ||
    v === 'release_cap_applied' ||
    v === 'auto_progression_cap_applied' ||
    v === 'non_linear_default_selected' ||
    v === 'legacy_progression_policy_capped' ||
    v === 'daily_regression_applied'
  );
}

function isProgressionDecisionReason(v: unknown): v is LadderProgress['lastProgressionDecisionReason'] {
  return (
    v === 'progression_allowed_transition' ||
    v === 'transition_not_auto_approved' ||
    v === 'non_linear_progression_model' ||
    v === 'device_validation_required' ||
    v === 'domain_review_required' ||
    v === 'manual_only_transition' ||
    v === 'auto_progression_cap_reached' ||
    v === 'progression_maintained' ||
    v === 'conservative_regression'
  );
}

function validPostSessionFeedback(v: unknown): PersistedPostSessionFeedback | null {
  if (!v || typeof v !== 'object') return null;
  const f = v as Partial<PersistedPostSessionFeedback>;
  if (typeof f.submittedAt !== 'string') return null;
  return {
    sessionId: typeof f.sessionId === 'string' ? f.sessionId : undefined,
    rpe: f.rpe === 1 || f.rpe === 2 || f.rpe === 3 || f.rpe === 4 || f.rpe === 5 ? f.rpe : undefined,
    discomfort: typeof f.discomfort === 'boolean' ? f.discomfort : undefined,
    painArea: isPainArea(f.painArea) ? f.painArea : undefined,
    completed: typeof f.completed === 'boolean' ? f.completed : undefined,
    trackingQuality: isTrackingQuality(f.trackingQuality) ? f.trackingQuality : undefined,
    submittedAt: f.submittedAt,
  };
}

function finiteNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function numberArray(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((item): item is number => typeof item === 'number' && Number.isFinite(item)) : [];
}

function stringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((item): item is string => typeof item === 'string') : [];
}

function booleanArray(v: unknown): boolean[] {
  return Array.isArray(v) ? v.filter((item): item is boolean => typeof item === 'boolean') : [];
}

function isTrackingQuality(v: unknown): v is TrackingQuality {
  return typeof v === 'string' && TRACKING_QUALITIES.includes(v as TrackingQuality);
}

function isPainArea(v: unknown): v is PainArea {
  return typeof v === 'string' && PAIN_AREAS.includes(v as PainArea);
}

function isReadiness(v: unknown): v is DailyReadiness {
  return typeof v === 'string' && READINESS.includes(v as DailyReadiness);
}

function isProgressionEvidencePolicy(v: unknown): v is ProgressionEvidencePolicy {
  return typeof v === 'string' && PROGRESSION_EVIDENCE_POLICIES.includes(v as ProgressionEvidencePolicy);
}

function validDailyContext(v: unknown): NormalizedDailyTrainingContext | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const c = v as Partial<NormalizedDailyTrainingContext>;
  if (
    !isReadiness(c.readiness) ||
    typeof c.shortOnTime !== 'boolean' ||
    !Array.isArray(c.discomfortAreas) ||
    typeof c.discomfortReported !== 'boolean' ||
    !isDailyInputStatus(c.inputStatus) ||
    !isDailyContextSource(c.source)
  ) {
    return undefined;
  }
  return {
    readiness: c.readiness,
    shortOnTime: c.shortOnTime,
    discomfortAreas: c.discomfortAreas.filter(isPainArea),
    discomfortReported: c.discomfortReported,
    inputStatus: c.inputStatus,
    source: c.source,
    reasonCodes: validReasonCodes(c.reasonCodes) ?? [],
  };
}

function validGeneratedExerciseDose(v: unknown): GeneratedExerciseDose | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const d = v as Partial<GeneratedExerciseDose>;
  const sets = finiteNumber(d.sets);
  if (typeof sets !== 'number') return undefined;
  return {
    sets,
    repsPerSet: finiteNumber(d.repsPerSet),
    secondsPerSet: finiteNumber(d.secondsPerSet),
  };
}

function validReasonCodes(v: unknown): DailyTrainingReasonCode[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter(isDailyReasonCode);
  return out.length > 0 ? Array.from(new Set(out)) : undefined;
}

function isDailyReasonCode(v: unknown): v is DailyTrainingReasonCode {
  return typeof v === 'string' && DAILY_REASON_CODES.includes(v as DailyTrainingReasonCode);
}

function isDailyInputStatus(v: unknown): v is DailyTrainingInputStatus {
  return typeof v === 'string' && DAILY_INPUT_STATUSES.includes(v as DailyTrainingInputStatus);
}

function isDailyContextSource(v: unknown): v is NormalizedDailyTrainingContext['source'] {
  return (
    v === 'user_daily_check' ||
    v === 'plan_preference' ||
    v === 'planned_restart' ||
    v === 'restored' ||
    v === 'legacy_unknown'
  );
}

function isSlotType(v: unknown): v is SessionSlotType {
  return typeof v === 'string' && SLOT_TYPES.includes(v as SessionSlotType);
}

function isMovementDomain(v: unknown): v is NonNullable<PersistedGeneratedSessionSummary['focusStimulusEvidence']>['blockFocusDomain'] {
  return v === 'strength_power' || v === 'balance' || v === 'mobility';
}

function isFocusPlanStatus(v: unknown): boolean {
  return (
    v === 'eligible' ||
    v === 'not_main_plan' ||
    v === 'missing_block_focus' ||
    v === 'missing_stimulus_metadata' ||
    v === 'focus_mismatch' ||
    v === 'no_primary_focus_planned'
  );
}

function isFocusCompletionStatus(v: unknown): boolean {
  return (
    v === 'credited_focus_work' ||
    v === 'not_main_plan' ||
    v === 'missing_block_focus' ||
    v === 'missing_stimulus_metadata' ||
    v === 'focus_mismatch' ||
    v === 'no_primary_focus_planned' ||
    v === 'no_completed_work' ||
    v === 'primary_focus_not_completed'
  );
}

function isFocusExclusionReason(v: unknown): boolean {
  return (
    v === 'none' ||
    v === 'not_main_plan' ||
    v === 'missing_block_focus' ||
    v === 'missing_stimulus_metadata' ||
    v === 'focus_mismatch' ||
    v === 'no_primary_focus_planned' ||
    v === 'no_completed_work' ||
    v === 'supporting_only' ||
    v === 'fallback_only' ||
    v === 'supporting_and_fallback_only' ||
    v === 'cross_domain_only' ||
    v === 'primary_focus_not_completed'
  );
}

const MICRO_TYPES: MicroCheckType[] = ['chair-power', 'single-leg-balance', 'mobility-reach'];

export function serializeMicroCheck(result: MicroCheckResult): string {
  const env: Envelope<MicroCheckResult> = { schemaVersion: TRAINING_SCHEMA_VERSION, payload: result };
  return JSON.stringify(env, nanReplacer);
}

export function deserializeMicroCheck(json: string): MicroCheckResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const env = parsed as Partial<Envelope<MicroCheckResult>>;
  if (
    env.schemaVersion !== 1 &&
    env.schemaVersion !== 2 &&
    env.schemaVersion !== 3 &&
    env.schemaVersion !== TRAINING_SCHEMA_VERSION
  ) {
    return null;
  }
  const p = env.payload;
  if (!p || typeof p !== 'object') return null;
  const r = p as Partial<MicroCheckResult>;
  if (!r.type || !MICRO_TYPES.includes(r.type) || typeof r.startedAt !== 'string') return null;
  return {
    type: r.type,
    startedAt: r.startedAt,
    value: typeof r.value === 'number' ? r.value : NaN, // null → NaN
    reps: typeof r.reps === 'number' ? r.reps : 0,
    measured: !!r.measured,
  };
}
