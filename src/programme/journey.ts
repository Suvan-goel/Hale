/**
 * Pure 12-week programme-journey policy.
 *
 * Three four-week phases are separated by accepted official assessments.
 * Session credits describe adherence only: three are planned each week and
 * two is sufficient. Neither count gates the 28-day re-test.
 */

import type { MovementProfileV2Assessment } from '../reference/movementProfileV2/assessment';
import { deterministicFingerprint } from '../reference/movementProfileV2/fingerprint';
import {
  PROGRAMME_PHASE_PRESCRIPTION_POLICY_FINGERPRINT,
  createProgrammePhasePrescription,
  derivePhysicalTrainingFocus,
  type PhysicalTrainingFocus,
  type ProgrammePhaseNumber,
  type ProgrammePhasePrescription,
} from './prescription';

export const PROGRAMME_JOURNEY_SCHEMA_VERSION = 1 as const;
export const PROGRAMME_JOURNEY_POLICY_VERSION = 1 as const;
export const PROGRAMME_JOURNEY_PHASE_COUNT = 3 as const;
export const PROGRAMME_JOURNEY_WEEKS_PER_PHASE = 4 as const;
export const PROGRAMME_JOURNEY_TOTAL_WEEK_COUNT = 12 as const;
export const PROGRAMME_JOURNEY_PHASE_CALENDAR_DAYS = 28 as const;
export const PROGRAMME_JOURNEY_PLANNED_SESSIONS_PER_WEEK = 3 as const;
export const PROGRAMME_JOURNEY_SUFFICIENT_SESSIONS_PER_WEEK = 2 as const;
export const PROGRAMME_JOURNEY_PLANNED_SESSION_COUNT = 36 as const;
export const PROGRAMME_JOURNEY_SUFFICIENT_SESSION_COUNT = 24 as const;

export const PROGRAMME_JOURNEY_CHECKPOINT_KINDS = [
  'baseline',
  'week4',
  'week8',
  'week12',
] as const;
export type ProgrammeJourneyCheckpointKind =
  (typeof PROGRAMME_JOURNEY_CHECKPOINT_KINDS)[number];

export type ProgrammeJourneyStatus = 'awaiting_baseline' | 'active' | 'completed';

export interface ProgrammeJourneyCheckpoint {
  readonly checkpointId: string;
  readonly kind: ProgrammeJourneyCheckpointKind;
  readonly completedAtIso: string;
  readonly sourceCheckUpId: string;
  readonly sourceCheckUpType: MovementProfileV2Assessment['sourceCheckUpType'];
  readonly sourceAssessmentId: string;
  readonly sourceAssessmentFingerprint: string;
  readonly physicalFocus: PhysicalTrainingFocus;
  /** Null only for the final week-12 checkpoint, which starts no new phase. */
  readonly startedPhase: ProgrammePhaseNumber | null;
  readonly prescriptionId: string | null;
}

export interface ProgrammeJourneySessionCredit {
  readonly creditId: string;
  readonly sessionId: string;
  readonly completedAtIso: string;
  readonly localDateKey: string;
  readonly phase: ProgrammePhaseNumber;
  /**
   * The four-week UI/reporting bucket. A phase may remain active while its
   * re-test is delayed, so weekly credit enforcement derives an unbounded
   * week index from completedAtIso instead of using this persisted value.
   * Keeping this clamped preserves the v1 on-device schema and old credits.
   */
  readonly phaseWeek: 1 | 2 | 3 | 4;
  readonly templateId: string;
}

export interface ProgrammeJourneyState {
  readonly schemaVersion: typeof PROGRAMME_JOURNEY_SCHEMA_VERSION;
  readonly policyVersion: typeof PROGRAMME_JOURNEY_POLICY_VERSION;
  readonly policyFingerprint: string;
  readonly status: ProgrammeJourneyStatus;
  readonly startedAtIso: string | null;
  readonly completedAtIso: string | null;
  readonly currentPhase: ProgrammePhaseNumber | null;
  readonly currentPhaseStartedAtIso: string | null;
  readonly checkpoints: Readonly<
    Partial<Record<ProgrammeJourneyCheckpointKind, ProgrammeJourneyCheckpoint>>
  >;
  readonly phasePrescriptions: Readonly<
    Partial<Record<ProgrammePhaseNumber, ProgrammePhasePrescription>>
  >;
  readonly sessionCredits: readonly ProgrammeJourneySessionCredit[];
}

export interface ProgrammeJourneyWeekSummary {
  readonly phase: ProgrammePhaseNumber;
  readonly week: 1 | 2 | 3 | 4;
  readonly creditedSessions: number;
  readonly plannedSessions: typeof PROGRAMME_JOURNEY_PLANNED_SESSIONS_PER_WEEK;
  readonly sufficientSessions: typeof PROGRAMME_JOURNEY_SUFFICIENT_SESSIONS_PER_WEEK;
  readonly sufficient: boolean;
  readonly plannedComplete: boolean;
}

export interface ProgrammeJourneyProgress {
  readonly status: ProgrammeJourneyStatus;
  readonly currentPhase: ProgrammePhaseNumber | null;
  readonly currentWeek: 1 | 2 | 3 | 4 | null;
  readonly phaseStartedAtIso: string | null;
  readonly retestDueAtIso: string | null;
  readonly retestDue: boolean;
  readonly currentWeekSummary: ProgrammeJourneyWeekSummary | null;
  readonly phaseCreditedSessions: number;
  readonly phaseSufficientWeeks: number;
  readonly totalCreditedSessions: number;
}

export type ProgrammeJourneyAssessmentRejectionReason =
  | 'invalid_timestamp'
  | 'invalid_source_id'
  | 'wrong_source_type'
  | 'not_due'
  | 'needs_retake'
  | 'unsupported_focus_domain'
  | 'journey_completed';

export type ApplyProgrammeJourneyAssessmentResult =
  | {
      readonly kind: 'advanced';
      readonly state: ProgrammeJourneyState;
      readonly checkpoint: ProgrammeJourneyCheckpoint;
      readonly startedPhase: ProgrammePhaseNumber;
    }
  | {
      readonly kind: 'completed';
      readonly state: ProgrammeJourneyState;
      readonly checkpoint: ProgrammeJourneyCheckpoint;
    }
  | {
      readonly kind: 'already_applied';
      readonly state: ProgrammeJourneyState;
      readonly checkpoint: ProgrammeJourneyCheckpoint;
    }
  | {
      readonly kind: 'rejected';
      readonly state: ProgrammeJourneyState;
      readonly reason: ProgrammeJourneyAssessmentRejectionReason;
      readonly dueAtIso: string | null;
    };

export interface ProgrammeJourneySessionInput {
  readonly sessionId: string;
  readonly completedAtIso: string;
  readonly templateId: string;
}

export type ProgrammeJourneySessionRejectionReason =
  | 'invalid_session_id'
  | 'invalid_template_id'
  | 'invalid_timestamp'
  | 'journey_not_active'
  | 'before_current_phase'
  | 'daily_credit_already_used'
  | 'weekly_plan_complete';

export type RecordProgrammeJourneySessionResult =
  | {
      readonly kind: 'credited';
      readonly state: ProgrammeJourneyState;
      readonly credit: ProgrammeJourneySessionCredit;
    }
  | {
      readonly kind: 'already_recorded';
      readonly state: ProgrammeJourneyState;
      readonly credit: ProgrammeJourneySessionCredit;
    }
  | {
      readonly kind: 'rejected';
      readonly state: ProgrammeJourneyState;
      readonly reason: ProgrammeJourneySessionRejectionReason;
    };

export const PROGRAMME_JOURNEY_POLICY_FINGERPRINT = deterministicFingerprint(
  'programme-journey-policy-v1',
  {
    version: PROGRAMME_JOURNEY_POLICY_VERSION,
    phases: PROGRAMME_JOURNEY_PHASE_COUNT,
    weeksPerPhase: PROGRAMME_JOURNEY_WEEKS_PER_PHASE,
    phaseCalendarDays: PROGRAMME_JOURNEY_PHASE_CALENDAR_DAYS,
    plannedSessionsPerWeek: PROGRAMME_JOURNEY_PLANNED_SESSIONS_PER_WEEK,
    sufficientSessionsPerWeek: PROGRAMME_JOURNEY_SUFFICIENT_SESSIONS_PER_WEEK,
    maximumCreditsPerLocalDay: 1,
    delayedRetestStartsNextPhaseAtAcceptance: true,
    prescriptionPolicyFingerprint: PROGRAMME_PHASE_PRESCRIPTION_POLICY_FINGERPRINT,
  }
);

export function createEmptyProgrammeJourneyState(): ProgrammeJourneyState {
  return {
    schemaVersion: PROGRAMME_JOURNEY_SCHEMA_VERSION,
    policyVersion: PROGRAMME_JOURNEY_POLICY_VERSION,
    policyFingerprint: PROGRAMME_JOURNEY_POLICY_FINGERPRINT,
    status: 'awaiting_baseline',
    startedAtIso: null,
    completedAtIso: null,
    currentPhase: null,
    currentPhaseStartedAtIso: null,
    checkpoints: {},
    phasePrescriptions: {},
    sessionCredits: [],
  };
}

export function expectedProgrammeJourneyCheckpoint(
  state: ProgrammeJourneyState
): ProgrammeJourneyCheckpointKind | null {
  if (state.status === 'awaiting_baseline') return 'baseline';
  if (state.status === 'completed' || state.currentPhase === null) return null;
  if (state.currentPhase === 1) return 'week4';
  if (state.currentPhase === 2) return 'week8';
  return 'week12';
}

/**
 * Apply the next accepted official assessment. Replaying the same source
 * check-up or assessment id is a no-op. Active phases cannot advance before
 * their 28-day due time, regardless of session count.
 */
export function applyOfficialAssessmentToProgrammeJourney(
  state: ProgrammeJourneyState,
  input: {
    readonly assessment: MovementProfileV2Assessment;
    readonly completedAtIso: string;
  }
): ApplyProgrammeJourneyAssessmentResult {
  const { assessment } = input;
  const priorCheckpoint = checkpointForAssessment(state, assessment);
  if (priorCheckpoint) {
    return {
      kind: 'already_applied',
      state,
      checkpoint: priorCheckpoint,
    };
  }

  if (!assessment.sourceCheckUpId.trim() || !assessment.assessmentId.trim()) {
    return rejectedAssessment(state, 'invalid_source_id');
  }

  const completedAt = validDate(input.completedAtIso);
  if (!completedAt) return rejectedAssessment(state, 'invalid_timestamp');
  const completedAtIso = completedAt.toISOString();

  const expectedKind = expectedProgrammeJourneyCheckpoint(state);
  if (!expectedKind) return rejectedAssessment(state, 'journey_completed');

  if (!sourceTypeMatchesCheckpoint(expectedKind, assessment.sourceCheckUpType)) {
    return rejectedAssessment(state, 'wrong_source_type');
  }

  if (state.status === 'active') {
    const dueAtIso = programmeJourneyRetestDueAtIso(state);
    if (!dueAtIso || completedAt.getTime() < Date.parse(dueAtIso)) {
      return rejectedAssessment(state, 'not_due', dueAtIso);
    }
  }

  const physicalFocus = derivePhysicalTrainingFocus(assessment);
  if (!physicalFocus.ok) {
    return rejectedAssessment(state, physicalFocus.reason);
  }

  const startedPhase = phaseStartedByCheckpoint(expectedKind);
  const prescriptionResult =
    startedPhase === null
      ? null
      : createProgrammePhasePrescription(assessment, startedPhase);
  if (prescriptionResult && !prescriptionResult.ok) {
    return rejectedAssessment(state, prescriptionResult.reason);
  }
  const prescription = prescriptionResult?.ok ? prescriptionResult.prescription : null;
  const checkpoint: ProgrammeJourneyCheckpoint = {
    checkpointId: deterministicFingerprint('programme-journey-checkpoint-v1', {
      kind: expectedKind,
      sourceCheckUpId: assessment.sourceCheckUpId,
    }),
    kind: expectedKind,
    completedAtIso,
    sourceCheckUpId: assessment.sourceCheckUpId,
    sourceCheckUpType: assessment.sourceCheckUpType,
    sourceAssessmentId: assessment.assessmentId,
    sourceAssessmentFingerprint: assessment.assessmentFingerprint,
    physicalFocus: physicalFocus.physicalFocus,
    startedPhase,
    prescriptionId: prescription?.prescriptionId ?? null,
  };
  const checkpoints = {
    ...state.checkpoints,
    [expectedKind]: checkpoint,
  };

  if (startedPhase === null) {
    const nextState: ProgrammeJourneyState = {
      ...state,
      status: 'completed',
      completedAtIso,
      currentPhase: null,
      currentPhaseStartedAtIso: null,
      checkpoints,
    };
    return { kind: 'completed', state: nextState, checkpoint };
  }

  const nextState: ProgrammeJourneyState = {
    ...state,
    status: 'active',
    startedAtIso: state.startedAtIso ?? completedAtIso,
    completedAtIso: null,
    currentPhase: startedPhase,
    // A delayed re-test starts a full new four-week phase at its actual time.
    currentPhaseStartedAtIso: completedAtIso,
    checkpoints,
    phasePrescriptions: {
      ...state.phasePrescriptions,
      [startedPhase]: prescription as ProgrammePhasePrescription,
    },
  };
  return {
    kind: 'advanced',
    state: nextState,
    checkpoint,
    startedPhase,
  };
}

/**
 * Record at most one journey credit per local calendar day and three per
 * real seven-day phase week, including week 5+ while a re-test is delayed.
 */
export function recordProgrammeJourneySession(
  state: ProgrammeJourneyState,
  input: ProgrammeJourneySessionInput
): RecordProgrammeJourneySessionResult {
  const sessionId = input.sessionId.trim();
  if (!sessionId) return rejectedSession(state, 'invalid_session_id');

  const prior = state.sessionCredits.find((credit) => credit.sessionId === sessionId);
  if (prior) return { kind: 'already_recorded', state, credit: prior };

  const templateId = input.templateId.trim();
  if (!templateId) return rejectedSession(state, 'invalid_template_id');

  const completedAt = validDate(input.completedAtIso);
  if (!completedAt) return rejectedSession(state, 'invalid_timestamp');
  if (
    state.status !== 'active' ||
    state.currentPhase === null ||
    state.currentPhaseStartedAtIso === null
  ) {
    return rejectedSession(state, 'journey_not_active');
  }

  const phaseStart = validDate(state.currentPhaseStartedAtIso);
  if (!phaseStart) return rejectedSession(state, 'journey_not_active');
  const elapsedLocalDays = localCalendarDayDifference(phaseStart, completedAt);
  if (elapsedLocalDays < 0) return rejectedSession(state, 'before_current_phase');

  const localDateKey = programmeJourneyLocalDateKey(completedAt);
  if (state.sessionCredits.some((credit) => credit.localDateKey === localDateKey)) {
    return rejectedSession(state, 'daily_credit_already_used');
  }

  const creditWeekIndex = Math.floor(elapsedLocalDays / 7) + 1;
  const phaseWeek = Math.min(
    PROGRAMME_JOURNEY_WEEKS_PER_PHASE,
    creditWeekIndex
  ) as 1 | 2 | 3 | 4;
  const weekCredits = state.sessionCredits.filter(
    (credit) =>
      credit.phase === state.currentPhase &&
      creditWeekIndexFor(phaseStart, credit) === creditWeekIndex
  ).length;
  if (weekCredits >= PROGRAMME_JOURNEY_PLANNED_SESSIONS_PER_WEEK) {
    return rejectedSession(state, 'weekly_plan_complete');
  }

  const completedAtIso = completedAt.toISOString();
  const credit: ProgrammeJourneySessionCredit = {
    creditId: deterministicFingerprint('programme-journey-session-credit-v1', {
      sessionId,
    }),
    sessionId,
    completedAtIso,
    localDateKey,
    phase: state.currentPhase,
    phaseWeek,
    templateId,
  };
  return {
    kind: 'credited',
    state: {
      ...state,
      sessionCredits: [...state.sessionCredits, credit],
    },
    credit,
  };
}

export function programmeJourneyRetestDueAtIso(
  state: ProgrammeJourneyState
): string | null {
  if (state.status !== 'active' || state.currentPhaseStartedAtIso === null) return null;
  const start = validDate(state.currentPhaseStartedAtIso);
  if (!start) return null;
  const due = new Date(start.getTime());
  due.setDate(due.getDate() + PROGRAMME_JOURNEY_PHASE_CALENDAR_DAYS);
  return due.toISOString();
}

export function isProgrammeJourneyRetestDue(
  state: ProgrammeJourneyState,
  atIso: string
): boolean {
  const dueAtIso = programmeJourneyRetestDueAtIso(state);
  const at = validDate(atIso);
  return dueAtIso !== null && at !== null && at.getTime() >= Date.parse(dueAtIso);
}

export function programmeJourneyPhaseWeekAt(
  state: ProgrammeJourneyState,
  atIso: string
): 1 | 2 | 3 | 4 | null {
  if (state.status !== 'active' || state.currentPhaseStartedAtIso === null) return null;
  const start = validDate(state.currentPhaseStartedAtIso);
  const at = validDate(atIso);
  if (!start || !at) return null;
  const elapsedLocalDays = localCalendarDayDifference(start, at);
  if (elapsedLocalDays < 0) return null;
  return Math.min(
    PROGRAMME_JOURNEY_WEEKS_PER_PHASE,
    Math.floor(elapsedLocalDays / 7) + 1
  ) as 1 | 2 | 3 | 4;
}

export function programmeJourneyWeekSummaries(
  state: ProgrammeJourneyState,
  phase: ProgrammePhaseNumber
): readonly ProgrammeJourneyWeekSummary[] {
  const phaseStart = phaseStartedAt(state, phase);
  return ([1, 2, 3, 4] as const).map((week) =>
    weekSummary(state, phase, phaseStart, week, week)
  );
}

export function programmeJourneyProgressAt(
  state: ProgrammeJourneyState,
  atIso: string
): ProgrammeJourneyProgress {
  const currentWeek = programmeJourneyPhaseWeekAt(state, atIso);
  const phaseStart =
    state.currentPhase === null ? null : phaseStartedAt(state, state.currentPhase);
  const at = validDate(atIso);
  const actualCurrentWeek =
    phaseStart === null || at === null ? null : phaseWeekIndex(phaseStart, at);
  const summaries =
    state.currentPhase === null ? [] : programmeJourneyWeekSummaries(state, state.currentPhase);
  const currentWeekSummary =
    currentWeek === null ||
    state.currentPhase === null ||
    phaseStart === null ||
    actualCurrentWeek === null
      ? null
      : weekSummary(
          state,
          state.currentPhase,
          phaseStart,
          actualCurrentWeek,
          currentWeek
        );
  return {
    status: state.status,
    currentPhase: state.currentPhase,
    currentWeek,
    phaseStartedAtIso: state.currentPhaseStartedAtIso,
    retestDueAtIso: programmeJourneyRetestDueAtIso(state),
    retestDue: isProgrammeJourneyRetestDue(state, atIso),
    currentWeekSummary,
    phaseCreditedSessions:
      state.currentPhase === null
        ? 0
        : state.sessionCredits.filter((credit) => credit.phase === state.currentPhase).length,
    phaseSufficientWeeks: summaries.filter((summary) => summary.sufficient).length,
    totalCreditedSessions: state.sessionCredits.length,
  };
}

/** User-local YYYY-MM-DD, intentionally not the UTC slice of an ISO string. */
export function programmeJourneyLocalDateKey(value: Date): string {
  return [
    String(value.getFullYear()).padStart(4, '0'),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
}

function phaseStartedByCheckpoint(
  kind: ProgrammeJourneyCheckpointKind
): ProgrammePhaseNumber | null {
  if (kind === 'baseline') return 1;
  if (kind === 'week4') return 2;
  if (kind === 'week8') return 3;
  return null;
}

function sourceTypeMatchesCheckpoint(
  kind: ProgrammeJourneyCheckpointKind,
  sourceType: MovementProfileV2Assessment['sourceCheckUpType']
): boolean {
  if (kind === 'baseline') return sourceType === 'baseline' || sourceType === 'baseline_retake';
  return sourceType === 'official_retest';
}

function checkpointForAssessment(
  state: ProgrammeJourneyState,
  assessment: MovementProfileV2Assessment
): ProgrammeJourneyCheckpoint | null {
  for (const kind of PROGRAMME_JOURNEY_CHECKPOINT_KINDS) {
    const checkpoint = state.checkpoints[kind];
    if (
      checkpoint &&
      (checkpoint.sourceCheckUpId === assessment.sourceCheckUpId ||
        checkpoint.sourceAssessmentId === assessment.assessmentId)
    ) {
      return checkpoint;
    }
  }
  return null;
}

function validDate(value: string): Date | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function localCalendarDayDifference(start: Date, end: Date): number {
  const startOrdinal = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endOrdinal = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endOrdinal - startOrdinal) / 86_400_000);
}

/** Unbounded, one-based week within a phase; null means before phase start. */
function phaseWeekIndex(phaseStart: Date, at: Date): number | null {
  const elapsedLocalDays = localCalendarDayDifference(phaseStart, at);
  return elapsedLocalDays < 0 ? null : Math.floor(elapsedLocalDays / 7) + 1;
}

function creditWeekIndexFor(
  phaseStart: Date,
  credit: ProgrammeJourneySessionCredit
): number | null {
  const completedAt = validDate(credit.completedAtIso);
  return completedAt === null ? null : phaseWeekIndex(phaseStart, completedAt);
}

function phaseStartedAt(
  state: ProgrammeJourneyState,
  phase: ProgrammePhaseNumber
): Date | null {
  for (const kind of PROGRAMME_JOURNEY_CHECKPOINT_KINDS) {
    const checkpoint = state.checkpoints[kind];
    if (checkpoint?.startedPhase === phase) {
      return validDate(checkpoint.completedAtIso);
    }
  }
  if (state.currentPhase === phase && state.currentPhaseStartedAtIso !== null) {
    return validDate(state.currentPhaseStartedAtIso);
  }
  return null;
}

function weekSummary(
  state: ProgrammeJourneyState,
  phase: ProgrammePhaseNumber,
  phaseStart: Date | null,
  creditWeekIndex: number,
  displayWeek: 1 | 2 | 3 | 4
): ProgrammeJourneyWeekSummary {
  const creditedSessions = state.sessionCredits.filter((credit) => {
    if (credit.phase !== phase) return false;
    // The fallback keeps manually constructed/legacy state useful if its
    // phase checkpoint is absent; normal persisted state always has a start.
    return phaseStart === null
      ? credit.phaseWeek === displayWeek
      : creditWeekIndexFor(phaseStart, credit) === creditWeekIndex;
  }).length;
  return {
    phase,
    week: displayWeek,
    creditedSessions,
    plannedSessions: PROGRAMME_JOURNEY_PLANNED_SESSIONS_PER_WEEK,
    sufficientSessions: PROGRAMME_JOURNEY_SUFFICIENT_SESSIONS_PER_WEEK,
    sufficient: creditedSessions >= PROGRAMME_JOURNEY_SUFFICIENT_SESSIONS_PER_WEEK,
    plannedComplete: creditedSessions >= PROGRAMME_JOURNEY_PLANNED_SESSIONS_PER_WEEK,
  };
}

function rejectedAssessment(
  state: ProgrammeJourneyState,
  reason: ProgrammeJourneyAssessmentRejectionReason,
  dueAtIso: string | null = null
): ApplyProgrammeJourneyAssessmentResult {
  return { kind: 'rejected', state, reason, dueAtIso };
}

function rejectedSession(
  state: ProgrammeJourneyState,
  reason: ProgrammeJourneySessionRejectionReason
): RecordProgrammeJourneySessionResult {
  return { kind: 'rejected', state, reason };
}
