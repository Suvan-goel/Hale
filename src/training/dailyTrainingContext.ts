import {
  BALANCE_SINGLE_LEG_ID,
  BAND_PULL_APART_ID,
  BRIDGE_HOLD_ID,
  BRIDGE_REPS_ID,
  HAMSTRING_REACH_ID,
  HIP_FLEXOR_STRETCH_ID,
  LOADED_MARCH_ID,
  LOADED_STS_ID,
  OVERHEAD_PRESS_ID,
  OVERHEAD_REACH_ID,
  PUSHUP_INCLINE_ID,
  PUSHUP_STANDARD_ID,
  PUSHUP_WALL_ID,
  SQUAT_FREE_ID,
  SQUAT_LOADED_ID,
  SQUAT_SLOW_ECC_ID,
  SQUAT_SUPPORTED_ID,
  SPLIT_SQUAT_SUPPORTED_ID,
  STS_POWER_ID,
  WALL_CALF_STRETCH_ID,
  type ExerciseLadder,
  type ExerciseLevel,
} from '../exercises';
import type { ExerciseLadderStimulusKind } from '../exercises/ladders';
import type { MovementSafetyProfile } from '../adherence';
import type { DailyReadiness, PainArea, SessionSource } from './workoutGeneration';

export type NormalizedReadiness = DailyReadiness;

export type DailyTrainingInputStatus =
  | 'valid'
  | 'defaulted_cautious'
  | 'malformed_fail_closed';

export type DailyTrainingContextSource =
  | 'user_daily_check'
  | 'plan_preference'
  | 'planned_restart'
  | 'restored'
  | 'legacy_unknown';

export type DailyTrainingReasonCode =
  | 'readiness_valid'
  | 'readiness_missing_default_ready'
  | 'readiness_missing_default_cautious'
  | 'readiness_malformed_cautious'
  | 'discomfort_explicit_none'
  | 'discomfort_reported'
  | 'setup_discomfort_reported'
  | 'discomfort_deduped'
  | 'discomfort_malformed_fail_closed'
  | 'legacy_context_cautious'
  | 'short_on_time'
  | 'reduced_readiness'
  | 'activity_level_gentle_start'
  | 'activity_level_regular_start'
  | 'age_recovery_buffer'
  | 'controlled_beta_release_cap'
  | 'auto_progression_cap'
  | 'non_linear_default'
  | 'legacy_progression_policy_capped';

export type DiscomfortConstraintReason =
  | 'knee_conservative_beta'
  | 'hip_back_conservative_beta'
  | 'shoulder_conservative_beta'
  | 'ankle_foot_conservative_beta'
  | 'neck_conservative_beta'
  | 'malformed_discomfort_fail_closed';

export type ProgressionEvidencePolicy =
  | 'normal'
  | 'hold_only'
  | 'ineligible';

export interface NormalizedDailyTrainingContext {
  readiness: NormalizedReadiness;
  shortOnTime: boolean;
  discomfortAreas: PainArea[];
  discomfortReported: boolean;
  inputStatus: DailyTrainingInputStatus;
  source: DailyTrainingContextSource;
  reasonCodes: DailyTrainingReasonCode[];
}

export interface DiscomfortConstraint {
  blockedStimulusKinds: ExerciseLadderStimulusKind[];
  blockedLadderIds: string[];
  blockedExerciseIds: string[];
  reasonCodes: DiscomfortConstraintReason[];
}

const READINESS: readonly DailyReadiness[] = [
  'ready',
  'a_bit_stiff',
  'low_energy',
  'something_hurts',
  'short_on_time',
];

const DISCOMFORT_ORDER: readonly PainArea[] = [
  'knee',
  'hip',
  'back',
  'shoulder',
  'ankle',
  'neck',
  'other',
];

const FAIL_CLOSED_DISCOMFORT_AREAS: readonly PainArea[] = DISCOMFORT_ORDER;

const EMPTY_CONSTRAINT: DiscomfortConstraint = {
  blockedStimulusKinds: [],
  blockedLadderIds: [],
  blockedExerciseIds: [],
  reasonCodes: [],
};

export function normalizeDailyTrainingContext(input: {
  readiness?: unknown;
  discomfortAreas?: unknown;
  painAreas?: unknown;
  discomfortSource?: unknown;
  source?: unknown;
  readinessOptional?: boolean;
} = {}): NormalizedDailyTrainingContext {
  const source = normalizeContextSource(input.source);
  const reasonCodes: DailyTrainingReasonCode[] = [];
  let inputStatus: DailyTrainingInputStatus = 'valid';
  let readiness: DailyReadiness = 'ready';

  if (source === 'legacy_unknown') {
    readiness = 'low_energy';
    inputStatus = 'defaulted_cautious';
    reasonCodes.push('legacy_context_cautious');
  } else if (input.readiness === undefined || input.readiness === null) {
    if (input.readinessOptional !== false) {
      readiness = 'ready';
      reasonCodes.push('readiness_missing_default_ready');
    } else {
      readiness = 'low_energy';
      inputStatus = 'defaulted_cautious';
      reasonCodes.push('readiness_missing_default_cautious');
    }
  } else if (isReadiness(input.readiness)) {
    readiness = input.readiness;
    reasonCodes.push('readiness_valid');
  } else {
    readiness = 'low_energy';
    inputStatus = 'malformed_fail_closed';
    reasonCodes.push('readiness_malformed_cautious');
  }

  const discomfortInput = input.discomfortAreas ?? input.painAreas;
  const discomfort = normalizeDiscomfortAreas(discomfortInput);
  if (!discomfort.valid) {
    inputStatus = 'malformed_fail_closed';
    reasonCodes.push('discomfort_malformed_fail_closed');
  } else if (discomfort.areas.length === 0) {
    reasonCodes.push('discomfort_explicit_none');
  } else {
    reasonCodes.push('discomfort_reported');
    if (input.discomfortSource === 'safety_profile') reasonCodes.push('setup_discomfort_reported');
    if (discomfort.deduped) reasonCodes.push('discomfort_deduped');
  }

  if (readiness === 'short_on_time') reasonCodes.push('short_on_time');
  if (readiness === 'a_bit_stiff' || readiness === 'low_energy' || readiness === 'something_hurts') {
    reasonCodes.push('reduced_readiness');
  }

  const discomfortAreas = discomfort.valid ? discomfort.areas : [...FAIL_CLOSED_DISCOMFORT_AREAS];
  return {
    readiness,
    shortOnTime: readiness === 'short_on_time',
    discomfortAreas,
    discomfortReported: discomfortAreas.length > 0,
    inputStatus,
    source,
    reasonCodes: unique(reasonCodes),
  };
}

export function painAreasFromSafetyProfile(
  safetyProfile: Pick<MovementSafetyProfile, 'hasCurrentPain' | 'painNotes'> | null | undefined
): PainArea[] {
  if (!safetyProfile || safetyProfile.hasCurrentPain === false) return [];
  const notes = safetyProfile.painNotes?.trim().toLowerCase();
  if (!notes) return safetyProfile.hasCurrentPain === true ? ['other'] : [];
  if (notes === 'none') return [];

  const areas: PainArea[] = [];
  if (/\bknees?\b/.test(notes)) areas.push('knee');
  if (/\bhips?\b/.test(notes)) areas.push('hip');
  if (/\bbacks?\b|\blow back\b|\blower back\b/.test(notes)) areas.push('back');
  if (/\bshoulders?\b/.test(notes)) areas.push('shoulder');
  if (/\bankles?\b|\bfeet\b|\bfoot\b/.test(notes)) areas.push('ankle');
  if (/\bnecks?\b/.test(notes)) areas.push('neck');

  return areas.length > 0 ? uniquePainAreas(areas) : safetyProfile.hasCurrentPain === true ? ['other'] : [];
}

export function discomfortConstraintForContext(
  context: NormalizedDailyTrainingContext
): DiscomfortConstraint {
  const base = discomfortConstraintForAreas(context.discomfortAreas);
  if (context.inputStatus !== 'malformed_fail_closed') return base;
  return mergeConstraints(base, {
    blockedStimulusKinds: [],
    blockedLadderIds: [],
    blockedExerciseIds: [],
    reasonCodes: ['malformed_discomfort_fail_closed'],
  });
}

export function discomfortConstraintForAreas(areas: readonly PainArea[]): DiscomfortConstraint {
  let constraint = EMPTY_CONSTRAINT;
  for (const area of uniquePainAreas(areas)) {
    if (area === 'knee') {
      constraint = mergeConstraints(constraint, {
        blockedStimulusKinds: ['dynamic_balance'],
        blockedLadderIds: ['squat', 'step-up'],
        blockedExerciseIds: [STS_POWER_ID, LOADED_STS_ID, SQUAT_SUPPORTED_ID, SQUAT_FREE_ID, SQUAT_SLOW_ECC_ID, SQUAT_LOADED_ID, SPLIT_SQUAT_SUPPORTED_ID],
        reasonCodes: ['knee_conservative_beta'],
      });
    } else if (area === 'hip' || area === 'back') {
      constraint = mergeConstraints(constraint, {
        blockedStimulusKinds: ['posterior_chain_strength'],
        blockedLadderIds: ['hinge-glutes', 'squat', 'step-up'],
        blockedExerciseIds: [
          BRIDGE_HOLD_ID,
          BRIDGE_REPS_ID,
          HAMSTRING_REACH_ID,
          HIP_FLEXOR_STRETCH_ID,
          SQUAT_SUPPORTED_ID,
          SQUAT_FREE_ID,
          SQUAT_SLOW_ECC_ID,
          SQUAT_LOADED_ID,
          SPLIT_SQUAT_SUPPORTED_ID,
        ],
        reasonCodes: ['hip_back_conservative_beta'],
      });
    } else if (area === 'shoulder') {
      constraint = mergeConstraints(constraint, {
        blockedStimulusKinds: ['upper_push', 'upper_pull', 'shoulder_mobility'],
        blockedLadderIds: ['push', 'pull-upper-back', 'shoulder-reach-press'],
        blockedExerciseIds: [
          PUSHUP_WALL_ID,
          PUSHUP_INCLINE_ID,
          PUSHUP_STANDARD_ID,
          OVERHEAD_REACH_ID,
          OVERHEAD_PRESS_ID,
          BAND_PULL_APART_ID,
        ],
        reasonCodes: ['shoulder_conservative_beta'],
      });
    } else if (area === 'ankle') {
      constraint = mergeConstraints(constraint, {
        blockedStimulusKinds: ['ankle_strength', 'dynamic_balance'],
        blockedLadderIds: ['heel-toe-raise', 'step-up', 'lateral-stability'],
        blockedExerciseIds: [BALANCE_SINGLE_LEG_ID, LOADED_MARCH_ID, WALL_CALF_STRETCH_ID],
        reasonCodes: ['ankle_foot_conservative_beta'],
      });
    } else if (area === 'neck') {
      constraint = mergeConstraints(constraint, {
        blockedStimulusKinds: [],
        blockedLadderIds: [],
        blockedExerciseIds: ['neck-rotation'],
        reasonCodes: ['neck_conservative_beta'],
      });
    }
  }
  return constraint;
}

export function isExerciseExcludedByDiscomfort(
  ladder: Pick<ExerciseLadder, 'id' | 'stimulusKind'>,
  level: Pick<ExerciseLevel, 'id'>,
  constraint: DiscomfortConstraint
): boolean {
  return (
    constraint.blockedLadderIds.includes(ladder.id) ||
    constraint.blockedStimulusKinds.includes(ladder.stimulusKind) ||
    constraint.blockedExerciseIds.includes(level.id)
  );
}

export function progressionEvidencePolicyFor(input: {
  context: NormalizedDailyTrainingContext;
  source: SessionSource;
}): ProgressionEvidencePolicy {
  if (input.source !== 'block_generated') return 'ineligible';
  if (input.context.inputStatus === 'malformed_fail_closed' || input.context.source === 'legacy_unknown') {
    return 'ineligible';
  }
  if (
    input.context.shortOnTime ||
    input.context.discomfortReported ||
    input.context.readiness === 'a_bit_stiff' ||
    input.context.readiness === 'low_energy' ||
    input.context.readiness === 'something_hurts' ||
    input.context.inputStatus === 'defaulted_cautious'
  ) {
    return 'hold_only';
  }
  return 'normal';
}

function normalizeContextSource(value: unknown): DailyTrainingContextSource {
  if (
    value === 'restored' ||
    value === 'legacy_unknown' ||
    value === 'user_daily_check' ||
    value === 'plan_preference' ||
    value === 'planned_restart'
  ) {
    return value;
  }
  return 'user_daily_check';
}

function normalizeDiscomfortAreas(value: unknown): { valid: true; areas: PainArea[]; deduped: boolean } | { valid: false } {
  if (value === undefined || value === null) return { valid: true, areas: [], deduped: false };
  if (!Array.isArray(value)) return { valid: false };
  const areas: PainArea[] = [];
  let deduped = false;
  for (const item of value) {
    if (!isPainArea(item)) return { valid: false };
    if (areas.includes(item)) {
      deduped = true;
      continue;
    }
    areas.push(item);
  }
  return { valid: true, areas: uniquePainAreas(areas), deduped };
}

function isReadiness(value: unknown): value is DailyReadiness {
  return typeof value === 'string' && READINESS.includes(value as DailyReadiness);
}

function isPainArea(value: unknown): value is PainArea {
  return typeof value === 'string' && DISCOMFORT_ORDER.includes(value as PainArea);
}

function uniquePainAreas(values: readonly PainArea[]): PainArea[] {
  return DISCOMFORT_ORDER.filter((area) => values.includes(area));
}

function mergeConstraints(a: DiscomfortConstraint, b: DiscomfortConstraint): DiscomfortConstraint {
  return {
    blockedStimulusKinds: unique([...a.blockedStimulusKinds, ...b.blockedStimulusKinds]),
    blockedLadderIds: unique([...a.blockedLadderIds, ...b.blockedLadderIds]).sort(),
    blockedExerciseIds: unique([...a.blockedExerciseIds, ...b.blockedExerciseIds]).sort(),
    reasonCodes: unique([...a.reasonCodes, ...b.reasonCodes]),
  };
}

function unique<T>(values: readonly T[]): T[] {
  const out: T[] = [];
  for (const value of values) {
    if (!out.includes(value)) out.push(value);
  }
  return out;
}
