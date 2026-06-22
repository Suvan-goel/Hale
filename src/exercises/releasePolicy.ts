import type { ExerciseLadder, ExerciseLevel } from './ladders';
import type { ReleaseStatus } from './types';

export type TrainingReleaseChannel = 'controlled_beta' | 'internal_development';

export type ExerciseLevelAvailabilityReason =
  | 'v1_core'
  | 'optional_hidden_in_controlled_beta'
  | 'future_domain_review_required'
  | 'load_policy_not_approved'
  | 'capability_prerequisite_not_approved'
  | 'unsupported_release_status'
  | 'unknown_level';

export type ExerciseLevelAvailability =
  | {
      available: true;
      channel: TrainingReleaseChannel;
      reason: 'v1_core';
    }
  | {
      available: false;
      channel: TrainingReleaseChannel;
      reason: Exclude<ExerciseLevelAvailabilityReason, 'v1_core'>;
    };

export interface ReleaseEffectiveLevelSelection {
  requestedLevelId: string;
  selectedLevel: ExerciseLevel;
  selectedIndex: number;
  releaseCapped: boolean;
  availability: ExerciseLevelAvailability;
}

export interface PlannedTrainingReleasePolicyExerciseSnapshot {
  exerciseId: string;
  ladderId?: string;
  levelId: string;
  requestedLevelId?: string;
  selectedDailyLevelId?: string;
  releaseStatus?: ReleaseStatus;
  availability: ExerciseLevelAvailability;
  adjustmentReasons?: readonly string[];
}

export interface PlannedTrainingReleasePolicySnapshot {
  schemaVersion: typeof TRAINING_RELEASE_POLICY_SCHEMA_VERSION;
  channel: TrainingReleaseChannel;
  policyFingerprint: string;
  fingerprint: string;
  exercises: readonly PlannedTrainingReleasePolicyExerciseSnapshot[];
}

export type ReleasePolicyExerciseSnapshotInput = {
  exerciseId: string;
  ladderId?: string;
  levelId?: string;
  requestedLevelId?: string;
  selectedDailyLevelId?: string;
  releaseStatus?: ReleaseStatus;
  adjustmentReasons?: readonly string[];
};

export const TRAINING_RELEASE_POLICY_SCHEMA_VERSION = 1;
export const CONTROLLED_BETA_RELEASE_CHANNEL: TrainingReleaseChannel = 'controlled_beta';
export const INTERNAL_DEVELOPMENT_RELEASE_CHANNEL: TrainingReleaseChannel = 'internal_development';

export const CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS = [
  'loaded-sit-to-stand',
  'squat-slow-eccentric',
  'squat-loaded',
  'chair-supported-split-squat',
  'push-up-standard',
  'mini-band-lateral-walk',
  'neck-rotation',
] as const;

type ControlledBetaHiddenOptionalLevelId = typeof CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS[number];

const CONTROLLED_BETA_OPTIONAL_REASON_BY_LEVEL_ID: Record<
  ControlledBetaHiddenOptionalLevelId,
  Exclude<ExerciseLevelAvailabilityReason, 'v1_core' | 'unsupported_release_status' | 'unknown_level'>
> = {
  'loaded-sit-to-stand': 'load_policy_not_approved',
  'squat-slow-eccentric': 'future_domain_review_required',
  'squat-loaded': 'load_policy_not_approved',
  'chair-supported-split-squat': 'capability_prerequisite_not_approved',
  'push-up-standard': 'capability_prerequisite_not_approved',
  'mini-band-lateral-walk': 'future_domain_review_required',
  'neck-rotation': 'future_domain_review_required',
};

const HIDDEN_OPTIONAL_LEVEL_ID_SET = new Set<string>(CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS);

export function isTrainingReleaseChannel(value: unknown): value is TrainingReleaseChannel {
  return value === CONTROLLED_BETA_RELEASE_CHANNEL || value === INTERNAL_DEVELOPMENT_RELEASE_CHANNEL;
}

export function releasePolicyFingerprint(
  channel: TrainingReleaseChannel = CONTROLLED_BETA_RELEASE_CHANNEL
): string {
  return [
    `schema:${TRAINING_RELEASE_POLICY_SCHEMA_VERSION}`,
    `channel:${channel}`,
    `hidden:${CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS.join(',')}`,
  ].join('|');
}

export function exerciseLevelAvailability(
  level: Pick<ExerciseLevel, 'id' | 'releaseStatus'> | { levelId?: string; releaseStatus?: ReleaseStatus } | string | null | undefined,
  channel: TrainingReleaseChannel = CONTROLLED_BETA_RELEASE_CHANNEL
): ExerciseLevelAvailability {
  const levelId =
    typeof level === 'string'
      ? level
      : level && 'id' in level
        ? level.id
        : level?.levelId;
  const releaseStatus = typeof level === 'string' ? undefined : level?.releaseStatus;

  if (!levelId) {
    return { available: false, channel, reason: 'unknown_level' };
  }
  if (releaseStatus === 'v1_core') {
    return { available: true, channel, reason: 'v1_core' };
  }
  if (releaseStatus === 'v1_optional') {
    return {
      available: false,
      channel,
      reason: controlledBetaOptionalReason(levelId),
    };
  }
  if (!releaseStatus) {
    return {
      available: false,
      channel,
      reason: HIDDEN_OPTIONAL_LEVEL_ID_SET.has(levelId) ? controlledBetaOptionalReason(levelId) : 'unknown_level',
    };
  }
  return { available: false, channel, reason: 'unsupported_release_status' };
}

export function isExerciseLevelAvailableForRelease(
  level: Pick<ExerciseLevel, 'id' | 'releaseStatus'> | null | undefined,
  channel: TrainingReleaseChannel = CONTROLLED_BETA_RELEASE_CHANNEL
): boolean {
  return exerciseLevelAvailability(level, channel).available;
}

export function availableLevelsForRelease(
  ladder: Pick<ExerciseLadder, 'levels'>,
  channel: TrainingReleaseChannel = CONTROLLED_BETA_RELEASE_CHANNEL
): ExerciseLevel[] {
  return ladder.levels.filter((level) => isExerciseLevelAvailableForRelease(level, channel));
}

export function effectiveLevelForRelease(
  ladder: Pick<ExerciseLadder, 'defaultLevelId' | 'levels'>,
  requestedLevelId: string | undefined,
  channel: TrainingReleaseChannel = CONTROLLED_BETA_RELEASE_CHANNEL
): ReleaseEffectiveLevelSelection | null {
  const requestedIndex = requestedIndexFor(ladder, requestedLevelId);
  const requested = ladder.levels[requestedIndex];
  if (!requested) return null;
  const availability = exerciseLevelAvailability(requested, channel);
  if (availability.available) {
    return {
      requestedLevelId: requested.id,
      selectedLevel: requested,
      selectedIndex: requestedIndex,
      releaseCapped: false,
      availability,
    };
  }

  for (let idx = requestedIndex - 1; idx >= 0; idx--) {
    const candidate = ladder.levels[idx];
    if (!candidate) continue;
    if (!isExerciseLevelAvailableForRelease(candidate, channel)) continue;
    return {
      requestedLevelId: requested.id,
      selectedLevel: candidate,
      selectedIndex: idx,
      releaseCapped: true,
      availability,
    };
  }

  return null;
}

export function adjacentAvailableLevelId(
  ladder: Pick<ExerciseLadder, 'defaultLevelId' | 'levels'>,
  currentLevelId: string,
  direction: -1 | 1,
  channel: TrainingReleaseChannel = CONTROLLED_BETA_RELEASE_CHANNEL
): string {
  const current = effectiveLevelForRelease(ladder, currentLevelId, channel);
  if (!current) return currentLevelId;
  const start = current.selectedIndex;
  if (direction > 0) {
    for (let idx = start + 1; idx < ladder.levels.length; idx++) {
      const candidate = ladder.levels[idx];
      if (candidate && isExerciseLevelAvailableForRelease(candidate, channel)) return candidate.id;
    }
  } else {
    for (let idx = start - 1; idx >= 0; idx--) {
      const candidate = ladder.levels[idx];
      if (candidate && isExerciseLevelAvailableForRelease(candidate, channel)) return candidate.id;
    }
  }
  return current.selectedLevel.id;
}

export function highestAvailableLevelForRelease(
  ladder: Pick<ExerciseLadder, 'levels'>,
  channel: TrainingReleaseChannel = CONTROLLED_BETA_RELEASE_CHANNEL
): ExerciseLevel | null {
  for (let idx = ladder.levels.length - 1; idx >= 0; idx--) {
    const candidate = ladder.levels[idx];
    if (candidate && isExerciseLevelAvailableForRelease(candidate, channel)) return candidate;
  }
  return null;
}

export function isControlledBetaHiddenOptionalLevelId(levelId: string): boolean {
  return HIDDEN_OPTIONAL_LEVEL_ID_SET.has(levelId);
}

export function plannedTrainingReleasePolicySnapshotForExercises(
  exercises: readonly ReleasePolicyExerciseSnapshotInput[],
  channel: TrainingReleaseChannel = CONTROLLED_BETA_RELEASE_CHANNEL
): PlannedTrainingReleasePolicySnapshot {
  const items = normalizeExerciseSnapshots(
    exercises.map((exercise) => {
      const levelId = exercise.selectedDailyLevelId ?? exercise.levelId ?? exercise.exerciseId;
      return {
        exerciseId: exercise.exerciseId,
        ladderId: exercise.ladderId,
        levelId,
        requestedLevelId: exercise.requestedLevelId,
        selectedDailyLevelId: exercise.selectedDailyLevelId,
        releaseStatus: exercise.releaseStatus,
        availability: exerciseLevelAvailability({ levelId, releaseStatus: exercise.releaseStatus }, channel),
        adjustmentReasons: exercise.adjustmentReasons,
      };
    })
  );
  const policyFingerprint = releasePolicyFingerprint(channel);
  return {
    schemaVersion: TRAINING_RELEASE_POLICY_SCHEMA_VERSION,
    channel,
    policyFingerprint,
    fingerprint: releasePolicySnapshotFingerprint(channel, policyFingerprint, items),
    exercises: items,
  };
}

export function isPlannedTrainingReleasePolicySnapshot(value: unknown): value is PlannedTrainingReleasePolicySnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<PlannedTrainingReleasePolicySnapshot>;
  if (snapshot.schemaVersion !== TRAINING_RELEASE_POLICY_SCHEMA_VERSION) return false;
  if (!isTrainingReleaseChannel(snapshot.channel)) return false;
  if (typeof snapshot.policyFingerprint !== 'string' || typeof snapshot.fingerprint !== 'string') return false;
  if (!Array.isArray(snapshot.exercises)) return false;
  return snapshot.exercises.every(isPlannedTrainingReleasePolicyExerciseSnapshot);
}

function controlledBetaOptionalReason(levelId: string): Exclude<ExerciseLevelAvailabilityReason, 'v1_core'> {
  return isControlledBetaHiddenOptionalLevelId(levelId)
    ? CONTROLLED_BETA_OPTIONAL_REASON_BY_LEVEL_ID[levelId as ControlledBetaHiddenOptionalLevelId]
    : 'optional_hidden_in_controlled_beta';
}

function requestedIndexFor(
  ladder: Pick<ExerciseLadder, 'defaultLevelId' | 'levels'>,
  requestedLevelId: string | undefined
): number {
  const direct = requestedLevelId ? ladder.levels.findIndex((level) => level.id === requestedLevelId) : -1;
  if (direct >= 0) return direct;
  const defaultIndex = ladder.levels.findIndex((level) => level.id === ladder.defaultLevelId);
  return Math.max(0, defaultIndex);
}

function normalizeExerciseSnapshots(
  exercises: readonly PlannedTrainingReleasePolicyExerciseSnapshot[]
): PlannedTrainingReleasePolicyExerciseSnapshot[] {
  return exercises
    .map((exercise) => ({
      ...exercise,
      adjustmentReasons: normalizeStrings(exercise.adjustmentReasons),
    }))
    .sort((a, b) =>
      [
        a.exerciseId.localeCompare(b.exerciseId),
        a.levelId.localeCompare(b.levelId),
        (a.ladderId ?? '').localeCompare(b.ladderId ?? ''),
      ].find((value) => value !== 0) ?? 0
    );
}

function releasePolicySnapshotFingerprint(
  channel: TrainingReleaseChannel,
  policyFingerprint: string,
  exercises: readonly PlannedTrainingReleasePolicyExerciseSnapshot[]
): string {
  const exerciseFingerprint = exercises
    .map((exercise) =>
      [
        exercise.exerciseId,
        exercise.ladderId ?? '',
        exercise.levelId,
        exercise.requestedLevelId ?? '',
        exercise.selectedDailyLevelId ?? '',
        exercise.releaseStatus ?? '',
        exercise.availability.available ? 'available' : 'unavailable',
        exercise.availability.reason,
        ...(exercise.adjustmentReasons ?? []),
      ].join(':')
    )
    .join('|');
  return `release:${TRAINING_RELEASE_POLICY_SCHEMA_VERSION}|${channel}|${policyFingerprint}|${exerciseFingerprint}`;
}

function isPlannedTrainingReleasePolicyExerciseSnapshot(value: unknown): value is PlannedTrainingReleasePolicyExerciseSnapshot {
  if (!value || typeof value !== 'object') return false;
  const exercise = value as Partial<PlannedTrainingReleasePolicyExerciseSnapshot>;
  if (typeof exercise.exerciseId !== 'string' || typeof exercise.levelId !== 'string') return false;
  if (exercise.ladderId !== undefined && typeof exercise.ladderId !== 'string') return false;
  if (exercise.requestedLevelId !== undefined && typeof exercise.requestedLevelId !== 'string') return false;
  if (exercise.selectedDailyLevelId !== undefined && typeof exercise.selectedDailyLevelId !== 'string') return false;
  if (
    exercise.releaseStatus !== undefined &&
    exercise.releaseStatus !== 'v1_core' &&
    exercise.releaseStatus !== 'v1_optional' &&
    exercise.releaseStatus !== 'post_v1_beta' &&
    exercise.releaseStatus !== 'hidden_legacy'
  ) {
    return false;
  }
  if (!exercise.availability || typeof exercise.availability !== 'object') return false;
  const availability = exercise.availability as Partial<ExerciseLevelAvailability>;
  if (availability.available !== true && availability.available !== false) return false;
  if (!isTrainingReleaseChannel(availability.channel)) return false;
  if (!isAvailabilityReason(availability.reason)) return false;
  if (exercise.adjustmentReasons !== undefined && !Array.isArray(exercise.adjustmentReasons)) return false;
  return true;
}

function isAvailabilityReason(value: unknown): value is ExerciseLevelAvailabilityReason {
  return (
    value === 'v1_core' ||
    value === 'optional_hidden_in_controlled_beta' ||
    value === 'future_domain_review_required' ||
    value === 'load_policy_not_approved' ||
    value === 'capability_prerequisite_not_approved' ||
    value === 'unsupported_release_status' ||
    value === 'unknown_level'
  );
}

function normalizeStrings(values: readonly string[] | undefined): string[] | undefined {
  if (!values) return undefined;
  const out: string[] = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    if (out.includes(value)) continue;
    out.push(value);
  }
  return out.length > 0 ? out : undefined;
}
