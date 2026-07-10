/**
 * Programme state (de)serialization — schema-versioned from day one, with
 * the repo's defensive-parse discipline: any malformed or foreign field falls
 * back to its default so a bad file degrades to a fresh (conservative) state
 * rather than crashing. Pure — no native imports, fully unit-testable.
 *
 * LOCAL-ONLY BY RULING (2026-07-06, ambiguity 6): this state contains
 * special-category health flags and is never included in Supabase backup
 * shapes — pinned by programmeLocalOnly.test.ts. Sync, if ever wanted, is
 * its own feature behind its own consent + encryption review.
 */

import type { ActivityLevel } from '../adherence';
import { deterministicFingerprint } from '../reference/movementProfileV2/fingerprint';
import {
  PROGRAMME_JOURNEY_PHASE_CALENDAR_DAYS,
  PROGRAMME_JOURNEY_CHECKPOINT_KINDS,
  PROGRAMME_JOURNEY_POLICY_FINGERPRINT,
  PROGRAMME_JOURNEY_POLICY_VERSION,
  PROGRAMME_JOURNEY_SCHEMA_VERSION,
  createEmptyProgrammeJourneyState,
  type ProgrammeJourneyCheckpoint,
  type ProgrammeJourneyCheckpointKind,
  type ProgrammeJourneySessionCredit,
  type ProgrammeJourneyState,
  type ProgrammeJourneyStatus,
} from './journey';
import {
  PHYSICAL_TRAINING_FOCI,
  PROGRAMME_PHASE_PRESCRIPTION_POLICY_FINGERPRINT,
  PROGRAMME_PHASE_NUMBERS,
  PROGRAMME_PHASE_PRESCRIPTION_POLICY_VERSION,
  PROGRAMME_PHASE_PRESCRIPTION_SCHEMA_VERSION,
  type ProgrammeCanonicalFocusReference,
  type ProgrammeFocusBlockStrategy,
  type ProgrammePhaseNumber,
  type ProgrammePhasePrescription,
} from './prescription';
import { clampLevel, freshPatternLadderState } from './promotion';
import { programmePolicyFingerprint } from './policy';
import {
  PROGRAMME_PATTERNS,
  type AssessmentStatus,
  type EffortAnswer,
  type FinisherState,
  type GatewayProgress,
  type JointFlag,
  type PatternLadderState,
  type PelvicRouting,
  type ProgrammePattern,
  type ProgrammeProfile,
  type ProgrammeState,
  type Weekday,
} from './types';

export const PROGRAMME_STATE_SCHEMA_VERSION = 2;

const ACTIVITY_LEVELS: readonly ActivityLevel[] = [
  'very_inactive',
  'lightly_active',
  'moderately_active',
  'very_active',
];
const ASSESSMENT_STATUSES: readonly AssessmentStatus[] = ['done', 'deferred', 'skipped', 'bypassed_b1'];
const EFFORT_ANSWERS: readonly EffortAnswer[] = ['none', 'a_few', 'lots'];
const JOINT_FLAGS: readonly JointFlag[] = ['knee', 'hip', 'shoulder', 'wrist', 'low_back'];
const WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const JOURNEY_STATUSES: readonly ProgrammeJourneyStatus[] = [
  'awaiting_baseline',
  'active',
  'completed',
];
const OFFICIAL_SOURCE_TYPES = ['baseline', 'baseline_retake', 'official_retest'] as const;
const FOCUS_BLOCK_STRATEGIES: readonly ProgrammeFocusBlockStrategy[] = [
  'strength_each_session',
  'balance_each_session',
  'alternate_strength_balance',
];
const DOMAIN_FOCUS_PLAN_MODES = [
  'checkup_reference_focus',
  'checkup_pearl_band_focus',
  'prior_focus_reference_supported',
] as const;
const FOCUS_DECISION_REASONS = [
  'v2_focus_single_below_reference',
  'v2_focus_multiple_below_preserve_current',
  'v2_focus_multiple_below_goal_tiebreak',
  'v2_focus_multiple_below_balanced',
  'v2_focus_single_pearl_starting_point',
  'v2_focus_starting_point_preserve_current',
  'v2_focus_starting_point_goal_tiebreak',
  'v2_focus_starting_point_balanced',
  'v2_focus_preserve_current_no_clear_candidate',
  'v2_focus_balanced_no_unique_signal',
  'v2_focus_needs_retake',
] as const;

/** Conservative defaults: unanswered always routes to the safe side. */
export function defaultProgrammeProfile(): ProgrammeProfile {
  return {
    consentHealthData: false,
    activityLevel: null,
    gentleStartActive: false,
    gpConfirmed: false,
    pelvicRouting: 'none',
    quietMode: false,
    jointFlags: [],
    balanceSupportDefault: false,
    hasStairs: null,
    hasBand: null,
    diastasisFlag: false,
    placement: {},
    assessmentStatus: null,
    lastAssessmentAtIso: null,
    chosenDays: [],
    firstSessionStarted: false,
    oneTimeSurfacesShown: [],
  };
}

export function defaultProgrammeState(): ProgrammeState {
  const ladders = {} as Record<ProgrammePattern, PatternLadderState>;
  for (const pattern of PROGRAMME_PATTERNS) {
    ladders[pattern] = freshPatternLadderState(pattern, 1);
  }
  return {
    profile: defaultProgrammeProfile(),
    ladders,
    finisher: { track: 'quiet_power', completedSessions: 0, currentContacts: 20 },
    journey: createEmptyProgrammeJourneyState(),
    onboardingCompletedAtIso: null,
    completedSessionCount: 0,
    lastSessionAtIso: null,
    lastSessionEffort: null,
    inactivityRegressionAppliedForGapEndingAtIso: null,
    policyFingerprint: programmePolicyFingerprint(),
  };
}

export function serializeProgrammeState(state: ProgrammeState): string {
  return JSON.stringify({ schemaVersion: PROGRAMME_STATE_SCHEMA_VERSION, ...state });
}

export function deserializeProgrammeState(json: string): ProgrammeState | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  // v1 had no journey field. Unknown/future top-level schemas retain the
  // independently parseable programme data but never import journey state.
  const journey =
    obj.schemaVersion === PROGRAMME_STATE_SCHEMA_VERSION
      ? validProgrammeJourney(obj.journey) ?? createEmptyProgrammeJourneyState()
      : createEmptyProgrammeJourneyState();
  return {
    profile: validProfile(obj.profile),
    ladders: validLadders(obj.ladders),
    finisher: validFinisher(obj.finisher),
    journey,
    onboardingCompletedAtIso: isoOrNull(obj.onboardingCompletedAtIso),
    completedSessionCount: nonNegativeInt(obj.completedSessionCount),
    lastSessionAtIso: isoOrNull(obj.lastSessionAtIso),
    lastSessionEffort: oneOf(obj.lastSessionEffort, EFFORT_ANSWERS) ?? null,
    inactivityRegressionAppliedForGapEndingAtIso: isoOrNull(
      obj.inactivityRegressionAppliedForGapEndingAtIso
    ),
    policyFingerprint:
      typeof obj.policyFingerprint === 'string' ? obj.policyFingerprint : '',
  };
}

function validProfile(v: unknown): ProgrammeProfile {
  const def = defaultProgrammeProfile();
  if (typeof v !== 'object' || v === null) return def;
  const p = v as Partial<ProgrammeProfile>;
  return {
    consentHealthData: p.consentHealthData === true,
    activityLevel: oneOf(p.activityLevel, ACTIVITY_LEVELS) ?? null,
    gentleStartActive: p.gentleStartActive === true,
    gpConfirmed: p.gpConfirmed === true,
    pelvicRouting: (oneOf(p.pelvicRouting, ['none', 'low_impact'] as const) ??
      'none') as PelvicRouting,
    quietMode: p.quietMode === true,
    jointFlags: stringSubset(p.jointFlags, JOINT_FLAGS),
    balanceSupportDefault: p.balanceSupportDefault === true,
    hasStairs: typeof p.hasStairs === 'boolean' ? p.hasStairs : null,
    hasBand: typeof p.hasBand === 'boolean' ? p.hasBand : null,
    diastasisFlag: p.diastasisFlag === true,
    placement: validPlacement(p.placement),
    assessmentStatus: oneOf(p.assessmentStatus, ASSESSMENT_STATUSES) ?? null,
    lastAssessmentAtIso: isoOrNull(p.lastAssessmentAtIso),
    chosenDays: stringSubset(p.chosenDays, WEEKDAYS),
    firstSessionStarted: p.firstSessionStarted === true,
    oneTimeSurfacesShown: Array.isArray(p.oneTimeSurfacesShown)
      ? p.oneTimeSurfacesShown.filter((v): v is string => typeof v === 'string')
      : [],
  };
}

function validPlacement(v: unknown): Partial<Record<ProgrammePattern, number>> {
  if (typeof v !== 'object' || v === null) return {};
  const out: Partial<Record<ProgrammePattern, number>> = {};
  for (const pattern of PROGRAMME_PATTERNS) {
    const value = (v as Record<string, unknown>)[pattern];
    if (typeof value === 'number' && Number.isFinite(value)) {
      out[pattern] = clampLevel(pattern, value);
    }
  }
  return out;
}

function validLadders(v: unknown): Record<ProgrammePattern, PatternLadderState> {
  const out = {} as Record<ProgrammePattern, PatternLadderState>;
  const source = typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  for (const pattern of PROGRAMME_PATTERNS) {
    out[pattern] = validLadderState(pattern, source[pattern]);
  }
  return out;
}

function validLadderState(pattern: ProgrammePattern, v: unknown): PatternLadderState {
  const def = freshPatternLadderState(pattern, 1);
  if (typeof v !== 'object' || v === null) return def;
  const s = v as Partial<PatternLadderState>;
  return {
    pattern,
    currentLevel:
      typeof s.currentLevel === 'number' && Number.isFinite(s.currentLevel)
        ? clampLevel(pattern, s.currentLevel)
        : def.currentLevel,
    consecutiveTopSessions: nonNegativeInt(s.consecutiveTopSessions),
    consecutiveBottomNoneSessions: nonNegativeInt(s.consecutiveBottomNoneSessions),
    recentPainFlags: Array.isArray(s.recentPainFlags)
      ? s.recentPainFlags.filter((f): f is boolean => typeof f === 'boolean').slice(-2)
      : [],
    lastPainFreeLevel:
      typeof s.lastPainFreeLevel === 'number' && Number.isFinite(s.lastPainFreeLevel)
        ? clampLevel(pattern, s.lastPainFreeLevel)
        : null,
    gatewayProgress: validGatewayProgress(s.gatewayProgress),
    bonusSetSuspended: s.bonusSetSuspended === true,
    currentRepTarget:
      typeof s.currentRepTarget === 'number' && Number.isFinite(s.currentRepTarget)
        ? s.currentRepTarget
        : null,
    lastPerformedAtIso: isoOrNull(s.lastPerformedAtIso),
  };
}

function validGatewayProgress(v: unknown): Record<number, GatewayProgress> {
  if (typeof v !== 'object' || v === null) return {};
  const out: Record<number, GatewayProgress> = {};
  for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1) continue;
    if (typeof value !== 'object' || value === null) continue;
    const p = value as Partial<GatewayProgress>;
    out[level] = {
      demoWatched: p.demoWatched === true,
      rehearsalExposures: nonNegativeInt(p.rehearsalExposures),
      selfConfirmed: p.selfConfirmed === true,
    };
  }
  return out;
}

function validFinisher(v: unknown): FinisherState {
  const def: FinisherState = { track: 'quiet_power', completedSessions: 0, currentContacts: 20 };
  if (typeof v !== 'object' || v === null) return def;
  const f = v as Partial<FinisherState>;
  return {
    track: 'quiet_power',
    completedSessions: nonNegativeInt(f.completedSessions),
    currentContacts:
      typeof f.currentContacts === 'number' && Number.isFinite(f.currentContacts)
        ? Math.min(Math.max(20, Math.round(f.currentContacts)), 50)
        : def.currentContacts,
  };
}

/**
 * Journey persistence is deliberately all-or-nothing. Its records jointly
 * describe one frozen phase decision, so retaining only the valid fragments
 * could silently pair a session or checkpoint with the wrong prescription.
 */
function validProgrammeJourney(v: unknown): ProgrammeJourneyState | null {
  if (!isRecord(v)) return null;
  if (
    v.schemaVersion !== PROGRAMME_JOURNEY_SCHEMA_VERSION ||
    v.policyVersion !== PROGRAMME_JOURNEY_POLICY_VERSION ||
    v.policyFingerprint !== PROGRAMME_JOURNEY_POLICY_FINGERPRINT
  ) {
    return null;
  }

  const status = oneOf(v.status, JOURNEY_STATUSES);
  const currentPhase = nullablePhase(v.currentPhase);
  if (
    status === undefined ||
    currentPhase === undefined ||
    !nullableIso(v.startedAtIso) ||
    !nullableIso(v.completedAtIso) ||
    !nullableIso(v.currentPhaseStartedAtIso)
  ) {
    return null;
  }

  if (
    (status === 'awaiting_baseline' &&
      (v.startedAtIso !== null ||
        v.completedAtIso !== null ||
        currentPhase !== null ||
        v.currentPhaseStartedAtIso !== null)) ||
    (status === 'active' &&
      (v.startedAtIso === null ||
        v.completedAtIso !== null ||
        currentPhase === null ||
        v.currentPhaseStartedAtIso === null)) ||
    (status === 'completed' &&
      (v.startedAtIso === null ||
        v.completedAtIso === null ||
        currentPhase !== null ||
        v.currentPhaseStartedAtIso !== null))
  ) {
    return null;
  }

  const checkpoints = validJourneyCheckpoints(v.checkpoints);
  const phasePrescriptions = validPhasePrescriptions(v.phasePrescriptions);
  const sessionCredits = validJourneySessionCredits(v.sessionCredits);
  if (!checkpoints || !phasePrescriptions || !sessionCredits) return null;

  const journey: ProgrammeJourneyState = {
    schemaVersion: PROGRAMME_JOURNEY_SCHEMA_VERSION,
    policyVersion: PROGRAMME_JOURNEY_POLICY_VERSION,
    policyFingerprint: v.policyFingerprint,
    status,
    startedAtIso: v.startedAtIso,
    completedAtIso: v.completedAtIso,
    currentPhase,
    currentPhaseStartedAtIso: v.currentPhaseStartedAtIso,
    checkpoints,
    phasePrescriptions,
    sessionCredits,
  };
  return validProgrammeJourneyTopology(journey) ? journey : null;
}

/**
 * Structural parsing above proves each record is safe to read. This second
 * pass proves the records describe one journey that the state machine could
 * actually have produced. Journey persistence remains all-or-nothing: a
 * relational mismatch must never leave a plausible-looking partial phase.
 */
function validProgrammeJourneyTopology(journey: ProgrammeJourneyState): boolean {
  if (journey.status === 'awaiting_baseline') {
    return (
      knownCheckpointKinds(journey).length === 0 &&
      knownPrescriptionPhases(journey).length === 0 &&
      journey.sessionCredits.length === 0
    );
  }

  const expectedCheckpointKinds: readonly ProgrammeJourneyCheckpointKind[] =
    journey.status === 'completed'
      ? PROGRAMME_JOURNEY_CHECKPOINT_KINDS
      : PROGRAMME_JOURNEY_CHECKPOINT_KINDS.slice(0, journey.currentPhase ?? 0);
  const expectedPrescriptionPhases: readonly ProgrammePhaseNumber[] =
    journey.status === 'completed'
      ? PROGRAMME_PHASE_NUMBERS
      : PROGRAMME_PHASE_NUMBERS.slice(0, journey.currentPhase ?? 0);

  if (
    !sameOrderedValues(knownCheckpointKinds(journey), expectedCheckpointKinds) ||
    !sameOrderedValues(knownPrescriptionPhases(journey), expectedPrescriptionPhases)
  ) {
    return false;
  }

  const checkpointIds = new Set<string>();
  const sourceCheckUpIds = new Set<string>();
  const sourceAssessmentIds = new Set<string>();
  let priorCheckpointTime = Number.NEGATIVE_INFINITY;

  for (const kind of expectedCheckpointKinds) {
    const checkpoint = journey.checkpoints[kind];
    if (!checkpoint) return false;

    const expectedStartedPhase = phaseStartedByPersistedCheckpoint(kind);
    const expectedSourceType =
      kind === 'baseline'
        ? checkpoint.sourceCheckUpType === 'baseline' ||
          checkpoint.sourceCheckUpType === 'baseline_retake'
        : checkpoint.sourceCheckUpType === 'official_retest';
    const checkpointTime = Date.parse(checkpoint.completedAtIso);
    const expectedCheckpointId = deterministicFingerprint(
      'programme-journey-checkpoint-v1',
      {
        kind,
        sourceCheckUpId: checkpoint.sourceCheckUpId,
      }
    );
    if (
      checkpoint.startedPhase !== expectedStartedPhase ||
      !expectedSourceType ||
      checkpointTime <= priorCheckpointTime ||
      (priorCheckpointTime !== Number.NEGATIVE_INFINITY &&
        !checkpointIsAtOrAfterPhaseDue(priorCheckpointTime, checkpointTime)) ||
      checkpoint.checkpointId !== expectedCheckpointId ||
      checkpointIds.has(checkpoint.checkpointId) ||
      sourceCheckUpIds.has(checkpoint.sourceCheckUpId) ||
      sourceAssessmentIds.has(checkpoint.sourceAssessmentId)
    ) {
      return false;
    }
    priorCheckpointTime = checkpointTime;
    checkpointIds.add(checkpoint.checkpointId);
    sourceCheckUpIds.add(checkpoint.sourceCheckUpId);
    sourceAssessmentIds.add(checkpoint.sourceAssessmentId);

    if (expectedStartedPhase === null) {
      if (checkpoint.prescriptionId !== null) return false;
      continue;
    }

    const prescription = journey.phasePrescriptions[expectedStartedPhase];
    if (!prescription || !checkpointMatchesPrescription(checkpoint, prescription)) {
      return false;
    }
  }

  const baseline = journey.checkpoints.baseline;
  if (!baseline || journey.startedAtIso !== baseline.completedAtIso) return false;

  if (journey.status === 'active') {
    const currentPhase = journey.currentPhase;
    if (currentPhase === null) return false;
    const phaseCheckpoint = journey.checkpoints[checkpointStartingPhase(currentPhase)];
    if (
      !phaseCheckpoint ||
      journey.currentPhaseStartedAtIso !== phaseCheckpoint.completedAtIso
    ) {
      return false;
    }
  } else {
    const finalCheckpoint = journey.checkpoints.week12;
    if (!finalCheckpoint || journey.completedAtIso !== finalCheckpoint.completedAtIso) {
      return false;
    }
  }

  const startedPhases = new Set(expectedPrescriptionPhases);
  return journey.sessionCredits.every(
    (credit) =>
      startedPhases.has(credit.phase) &&
      validJourneySessionCreditTopology(journey, credit)
  );
}

/**
 * Mirrors the journey runtime's local-calendar `Date#setDate` cadence. The
 * comparison is minimum-only: a delayed re-test remains valid and starts the
 * next phase at its actual accepted time.
 */
function checkpointIsAtOrAfterPhaseDue(
  priorCheckpointTime: number,
  checkpointTime: number
): boolean {
  const due = new Date(priorCheckpointTime);
  due.setDate(due.getDate() + PROGRAMME_JOURNEY_PHASE_CALENDAR_DAYS);
  return checkpointTime >= due.getTime();
}

function validJourneySessionCreditTopology(
  journey: ProgrammeJourneyState,
  credit: ProgrammeJourneySessionCredit
): boolean {
  const expectedCreditId = deterministicFingerprint(
    'programme-journey-session-credit-v1',
    { sessionId: credit.sessionId }
  );
  if (credit.creditId !== expectedCreditId) return false;

  const phaseStart = journey.checkpoints[checkpointStartingPhase(credit.phase)];
  if (!phaseStart) return false;
  const creditTime = Date.parse(credit.completedAtIso);
  if (creditTime < Date.parse(phaseStart.completedAtIso)) return false;

  const nextCheckpointKind = checkpointAfterPhase(credit.phase);
  const nextCheckpoint = journey.checkpoints[nextCheckpointKind];
  if (nextCheckpoint && creditTime > Date.parse(nextCheckpoint.completedAtIso)) {
    return false;
  }

  return localDateKeyCouldDescribeInstant(credit.localDateKey, creditTime);
}

function checkpointAfterPhase(
  phase: ProgrammePhaseNumber
): ProgrammeJourneyCheckpointKind {
  if (phase === 1) return 'week4';
  if (phase === 2) return 'week8';
  return 'week12';
}

/**
 * The originating UTC offset is intentionally not persisted. Any real-world
 * offset can move an instant's local date by at most one day from its UTC
 * date, so this catches impossible/tampered keys without breaking travellers.
 */
function localDateKeyCouldDescribeInstant(
  localDateKey: string,
  instantTime: number
): boolean {
  const localDay = Date.parse(`${localDateKey}T00:00:00.000Z`);
  const utcDay = Date.parse(new Date(instantTime).toISOString().slice(0, 10));
  return Math.abs(localDay - utcDay) <= 86_400_000;
}

function knownCheckpointKinds(
  journey: ProgrammeJourneyState
): ProgrammeJourneyCheckpointKind[] {
  return PROGRAMME_JOURNEY_CHECKPOINT_KINDS.filter(
    (kind) => journey.checkpoints[kind] !== undefined
  );
}

function knownPrescriptionPhases(journey: ProgrammeJourneyState): ProgrammePhaseNumber[] {
  return PROGRAMME_PHASE_NUMBERS.filter(
    (phase) => journey.phasePrescriptions[phase] !== undefined
  );
}

function sameOrderedValues<T>(actual: readonly T[], expected: readonly T[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function phaseStartedByPersistedCheckpoint(
  kind: ProgrammeJourneyCheckpointKind
): ProgrammePhaseNumber | null {
  if (kind === 'baseline') return 1;
  if (kind === 'week4') return 2;
  if (kind === 'week8') return 3;
  return null;
}

function checkpointStartingPhase(
  phase: ProgrammePhaseNumber
): ProgrammeJourneyCheckpointKind {
  if (phase === 1) return 'baseline';
  if (phase === 2) return 'week4';
  return 'week8';
}

function checkpointMatchesPrescription(
  checkpoint: ProgrammeJourneyCheckpoint,
  prescription: ProgrammePhasePrescription
): boolean {
  return (
    checkpoint.prescriptionId === prescription.prescriptionId &&
    checkpoint.startedPhase === prescription.phase &&
    checkpoint.sourceCheckUpId === prescription.sourceCheckUpId &&
    checkpoint.sourceCheckUpType === prescription.sourceCheckUpType &&
    checkpoint.sourceAssessmentId === prescription.sourceAssessmentId &&
    checkpoint.sourceAssessmentFingerprint === prescription.sourceAssessmentFingerprint &&
    checkpoint.physicalFocus === prescription.physicalFocus &&
    validPrescriptionId(prescription) &&
    validPrescriptionFocusTopology(prescription)
  );
}

function validPrescriptionId(prescription: ProgrammePhasePrescription): boolean {
  return (
    prescription.prescriptionId ===
    deterministicFingerprint('programme-phase-prescription-v1', {
      schemaVersion: prescription.schemaVersion,
      policyVersion: prescription.policyVersion,
      policyFingerprint: prescription.policyFingerprint,
      phase: prescription.phase,
      physicalFocus: prescription.physicalFocus,
      dosePolicy: prescription.dosePolicy,
      canonicalFocus: prescription.canonicalFocus,
      sourceAssessmentId: prescription.sourceAssessmentId,
      sourceAssessmentFingerprint: prescription.sourceAssessmentFingerprint,
      sourceCheckUpId: prescription.sourceCheckUpId,
      sourceCheckUpType: prescription.sourceCheckUpType,
      createdAtIso: prescription.createdAtIso,
    })
  );
}

function validPrescriptionFocusTopology(
  prescription: ProgrammePhasePrescription
): boolean {
  if (prescription.physicalFocus === 'strength') {
    return (
      prescription.canonicalFocus.kind === 'domain' &&
      prescription.canonicalFocus.domain === 'strength_power' &&
      prescription.dosePolicy.focusBlockStrategy === 'strength_each_session'
    );
  }
  if (prescription.physicalFocus === 'balance') {
    return (
      prescription.canonicalFocus.kind === 'domain' &&
      prescription.canonicalFocus.domain === 'balance' &&
      prescription.dosePolicy.focusBlockStrategy === 'balance_each_session'
    );
  }
  return (
    prescription.canonicalFocus.kind === 'balanced' &&
    prescription.canonicalFocus.domain === null &&
    prescription.dosePolicy.focusBlockStrategy === 'alternate_strength_balance'
  );
}

function validJourneyCheckpoints(
  v: unknown
): Partial<Record<ProgrammeJourneyCheckpointKind, ProgrammeJourneyCheckpoint>> | null {
  if (!isRecord(v)) return null;
  const out: Partial<
    Record<ProgrammeJourneyCheckpointKind, ProgrammeJourneyCheckpoint>
  > = {};
  for (const kind of PROGRAMME_JOURNEY_CHECKPOINT_KINDS) {
    const raw = v[kind];
    if (raw === undefined) continue;
    const checkpoint = validJourneyCheckpoint(raw, kind);
    if (!checkpoint) return null;
    out[kind] = checkpoint;
  }
  return out;
}

function validJourneyCheckpoint(
  v: unknown,
  expectedKind: ProgrammeJourneyCheckpointKind
): ProgrammeJourneyCheckpoint | null {
  if (!isRecord(v)) return null;
  const sourceCheckUpType = oneOf(v.sourceCheckUpType, OFFICIAL_SOURCE_TYPES);
  const physicalFocus = oneOf(v.physicalFocus, PHYSICAL_TRAINING_FOCI);
  const startedPhase = nullablePhase(v.startedPhase);
  if (
    v.kind !== expectedKind ||
    !nonEmptyString(v.checkpointId) ||
    !isIso(v.completedAtIso) ||
    !nonEmptyString(v.sourceCheckUpId) ||
    sourceCheckUpType === undefined ||
    !nonEmptyString(v.sourceAssessmentId) ||
    !nonEmptyString(v.sourceAssessmentFingerprint) ||
    physicalFocus === undefined ||
    startedPhase === undefined ||
    !nullableNonEmptyString(v.prescriptionId)
  ) {
    return null;
  }
  return {
    checkpointId: v.checkpointId,
    kind: expectedKind,
    completedAtIso: v.completedAtIso,
    sourceCheckUpId: v.sourceCheckUpId,
    sourceCheckUpType,
    sourceAssessmentId: v.sourceAssessmentId,
    sourceAssessmentFingerprint: v.sourceAssessmentFingerprint,
    physicalFocus,
    startedPhase,
    prescriptionId: v.prescriptionId,
  };
}

function validPhasePrescriptions(
  v: unknown
): Partial<Record<ProgrammePhaseNumber, ProgrammePhasePrescription>> | null {
  if (!isRecord(v)) return null;
  const out: Partial<Record<ProgrammePhaseNumber, ProgrammePhasePrescription>> = {};
  for (const phase of PROGRAMME_PHASE_NUMBERS) {
    const raw = v[String(phase)];
    if (raw === undefined) continue;
    const prescription = validPhasePrescription(raw, phase);
    if (!prescription) return null;
    out[phase] = prescription;
  }
  return out;
}

function validPhasePrescription(
  v: unknown,
  expectedPhase: ProgrammePhaseNumber
): ProgrammePhasePrescription | null {
  if (!isRecord(v) || !isRecord(v.dosePolicy)) return null;
  const physicalFocus = oneOf(v.physicalFocus, PHYSICAL_TRAINING_FOCI);
  const focusBlockStrategy = oneOf(
    v.dosePolicy.focusBlockStrategy,
    FOCUS_BLOCK_STRATEGIES
  );
  const canonicalFocus = validCanonicalFocus(v.canonicalFocus);
  const sourceCheckUpType = oneOf(v.sourceCheckUpType, OFFICIAL_SOURCE_TYPES);
  if (
    v.schemaVersion !== PROGRAMME_PHASE_PRESCRIPTION_SCHEMA_VERSION ||
    v.policyVersion !== PROGRAMME_PHASE_PRESCRIPTION_POLICY_VERSION ||
    v.policyFingerprint !== PROGRAMME_PHASE_PRESCRIPTION_POLICY_FINGERPRINT ||
    !nonEmptyString(v.prescriptionId) ||
    v.phase !== expectedPhase ||
    physicalFocus === undefined ||
    v.dosePolicy.plannedFocusBlocksPerWeek !== 3 ||
    focusBlockStrategy === undefined ||
    canonicalFocus === null ||
    !nonEmptyString(v.sourceAssessmentId) ||
    !nonEmptyString(v.sourceAssessmentFingerprint) ||
    !nonEmptyString(v.sourceCheckUpId) ||
    sourceCheckUpType === undefined ||
    !isIso(v.createdAtIso)
  ) {
    return null;
  }
  return {
    schemaVersion: PROGRAMME_PHASE_PRESCRIPTION_SCHEMA_VERSION,
    policyVersion: PROGRAMME_PHASE_PRESCRIPTION_POLICY_VERSION,
    policyFingerprint: v.policyFingerprint,
    prescriptionId: v.prescriptionId,
    phase: expectedPhase,
    physicalFocus,
    dosePolicy: {
      plannedFocusBlocksPerWeek: 3,
      focusBlockStrategy,
    },
    canonicalFocus,
    sourceAssessmentId: v.sourceAssessmentId,
    sourceAssessmentFingerprint: v.sourceAssessmentFingerprint,
    sourceCheckUpId: v.sourceCheckUpId,
    sourceCheckUpType,
    createdAtIso: v.createdAtIso,
  };
}

function validCanonicalFocus(v: unknown): ProgrammeCanonicalFocusReference | null {
  if (!isRecord(v)) return null;
  const decisionReason = oneOf(v.decisionReason, FOCUS_DECISION_REASONS);
  if (decisionReason === undefined) return null;
  const domainPlanMode = oneOf(v.planMode, DOMAIN_FOCUS_PLAN_MODES);
  if (
    v.kind === 'domain' &&
    (v.domain === 'strength_power' || v.domain === 'balance') &&
    domainPlanMode !== undefined
  ) {
    return {
      kind: 'domain',
      domain: v.domain,
      planMode: domainPlanMode,
      decisionReason,
    };
  }
  if (
    v.kind === 'balanced' &&
    v.domain === null &&
    v.planMode === 'balanced_insufficient_reference'
  ) {
    return {
      kind: 'balanced',
      domain: null,
      planMode: 'balanced_insufficient_reference',
      decisionReason,
    };
  }
  return null;
}

function validJourneySessionCredits(
  v: unknown
): readonly ProgrammeJourneySessionCredit[] | null {
  if (!Array.isArray(v)) return null;
  const out: ProgrammeJourneySessionCredit[] = [];
  const creditIds = new Set<string>();
  const sessionIds = new Set<string>();
  const localDateKeys = new Set<string>();
  for (const raw of v) {
    const credit = validJourneySessionCredit(raw);
    if (
      !credit ||
      creditIds.has(credit.creditId) ||
      sessionIds.has(credit.sessionId) ||
      localDateKeys.has(credit.localDateKey)
    ) {
      return null;
    }
    creditIds.add(credit.creditId);
    sessionIds.add(credit.sessionId);
    localDateKeys.add(credit.localDateKey);
    out.push(credit);
  }
  return out;
}

function validJourneySessionCredit(v: unknown): ProgrammeJourneySessionCredit | null {
  if (!isRecord(v)) return null;
  const phase = oneOfNumber(v.phase, PROGRAMME_PHASE_NUMBERS);
  const phaseWeek = oneOfNumber(v.phaseWeek, [1, 2, 3, 4] as const);
  if (
    !nonEmptyString(v.creditId) ||
    !nonEmptyString(v.sessionId) ||
    !isIso(v.completedAtIso) ||
    !isLocalDateKey(v.localDateKey) ||
    phase === undefined ||
    phaseWeek === undefined ||
    !nonEmptyString(v.templateId)
  ) {
    return null;
  }
  return {
    creditId: v.creditId,
    sessionId: v.sessionId,
    completedAtIso: v.completedAtIso,
    localDateKey: v.localDateKey,
    phase,
    phaseWeek,
    templateId: v.templateId,
  };
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function oneOfNumber<T extends number>(
  value: unknown,
  allowed: readonly T[]
): T | undefined {
  return typeof value === 'number' && (allowed as readonly number[]).includes(value)
    ? (value as T)
    : undefined;
}

function nullablePhase(value: unknown): ProgrammePhaseNumber | null | undefined {
  if (value === null) return null;
  return oneOfNumber(value, PROGRAMME_PHASE_NUMBERS);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nullableNonEmptyString(value: unknown): value is string | null {
  return value === null || nonEmptyString(value);
}

function isIso(value: unknown): value is string {
  return nonEmptyString(value) && Number.isFinite(new Date(value).getTime());
}

function nullableIso(value: unknown): value is string | null {
  return value === null || isIso(value);
}

function isLocalDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function stringSubset<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    if (typeof item === 'string' && (allowed as readonly string[]).includes(item) && !out.includes(item as T)) {
      out.push(item as T);
    }
  }
  return out;
}

function nonNegativeInt(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

function isoOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
