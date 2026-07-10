/**
 * DEV-ONLY mock journey generator.
 *
 * Produces the on-device state of a user who has been in the app for a few
 * months — several completed voice sessions (advanced ladder levels, journey
 * credits) and a series of official Movement Check-Ups (a longitudinal Movement
 * Profile with an improving trend). Lets you look at Home, Progress, and the
 * per-check-up Results screens fully populated without performing a single
 * camera-graded battery (which can't run on an emulator anyway — see
 * mediapipe-emulator-incompatible).
 *
 * Everything here is built through the SAME production reducers, materializers,
 * and serializers the live flow uses, so the seeded records render through the
 * real view models and survive a reload byte-identically to real data:
 *   - check-ups: syntheticCheckUp-style raw capture → materializeOfficial…
 *     Artifacts (snapshot + assessment) → HistoryStore.save
 *   - programme: applyAssessmentPlacement (from the first check-up) then
 *     applyProgrammeSessionResults over generated plans.
 *
 * Not imported by any production path — gate every call site on `__DEV__`.
 */

import type { CheckUp } from '../checkup/types';
import type { StoredCheckUpType } from '../history';
import {
  createCapturedChairRiseV2Result,
  createCapturedOneLegBalanceV2Result,
  createMovementProfileV2InternalFlow,
  movementProfileV2InternalFlowReducer,
  movementProfileV2RawCheckUpFromFlow,
} from '../movementProfileV2/internalCheckupFlow';
import {
  applyAssessmentPlacement,
  applyOfficialAssessmentToProgrammeJourney,
  applyProgrammeSessionResults,
  assessmentInputsFromCheckUp,
  generateProgrammeSession,
  markFirstSessionStarted,
  recordProgrammeJourneySession,
  type EffortAnswer,
  type PatternSessionOutcome,
  type ProgrammeState,
  type SessionTemplateId,
} from '../programme';
import type { UserProfile } from '../profile';
import {
  materializeOfficialMovementProfileV2Artifacts,
  type MovementProfileV2AssessmentHistoryRecord,
  type MovementProfileV2ReferenceProfile,
} from '../reference/movementProfileV2';

/** One materialized check-up ready to hand to HistoryStore.save. */
export interface MockCheckUp {
  checkUp: CheckUp;
  checkupType: StoredCheckUpType;
}

export interface MockJourney {
  /** Oldest-first; index 0 is the baseline, the rest official retests. */
  checkUps: readonly MockCheckUp[];
  /** Advanced programme state reflecting the simulated sessions. */
  programmeState: ProgrammeState;
}

export interface GenerateMockJourneyInput {
  /** The user's real profile — drives the reference group for comparisons. */
  profile: UserProfile;
  /** The current (post-onboarding) programme state to build on. */
  programmeState: ProgrammeState;
  /** Number of official check-ups, one per month back from now. Default 4. */
  checkUpCount?: number;
  /** Number of completed voice sessions to simulate. Default 18. */
  sessionCount?: number;
  /** Clock injection for deterministic tests. Defaults to now. */
  now?: Date;
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Per-check-up measured values, biased to improve over time (index 0 oldest). */
function checkUpSample(index: number) {
  const clampHold = (value: number) => Math.max(2, Math.min(45, value));
  return {
    chairReps: 10 + index * 2,
    meanVelocity: 0.9 + index * 0.08,
    peakVelocity: 1.15 + index * 0.1,
    holdsSec: [clampHold(6 + index * 3), clampHold(5 + index * 3), clampHold(5 + index * 2)],
    clarityItemScore: Math.max(0, 2 - Math.floor(index / 2)) as 0 | 1 | 2,
  };
}

function buildRawCheckUp(startedAt: string, index: number): CheckUp {
  const sample = checkUpSample(index);
  let flow = createMovementProfileV2InternalFlow({
    startedAt,
    batterySequence: ['balance', 'chair'],
  });
  flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_balance_setup', standingLeg: 'left' });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_balance',
    result: createCapturedOneLegBalanceV2Result({ standingLeg: 'left', holdsSec: sample.holdsSec }),
  });
  flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_chair_setup' });
  flow = movementProfileV2InternalFlowReducer(flow, { type: 'complete_chair_practice' });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_chair',
    result: createCapturedChairRiseV2Result({
      reps: sample.chairReps,
      meanVelocity: sample.meanVelocity,
      peakVelocity: sample.peakVelocity,
    }),
  });
  const checkUp = movementProfileV2RawCheckUpFromFlow(flow);
  if (!checkUp) throw new Error('[mockData] synthetic check-up did not complete');
  return {
    ...checkUp,
    selfReport: {
      schemaVersion: 1,
      clarity: {
        itemSetId: 'clarity_items_v1',
        itemScores: Array.from({ length: 5 }, () => sample.clarityItemScore),
      },
      covariates: {
        sleepQuality: index % 3 === 0 ? 2 : 3,
      },
    },
  };
}

function referenceProfileFor(profile: UserProfile): MovementProfileV2ReferenceProfile {
  const ageAtTest = profile.exactAge ?? profile.age ?? 55;
  return {
    ageAtTest,
    ageBasis: 'exact_age_at_test',
    // The app is women-first; fall back to the primary reference group.
    referenceSex: profile.referenceSex ?? 'female',
  };
}

/** Build the improving series of official, materialized check-ups. */
function buildCheckUps(input: GenerateMockJourneyInput): MockCheckUp[] {
  const now = input.now ?? new Date();
  const count = Math.max(1, input.checkUpCount ?? 4);
  const referenceProfile = referenceProfileFor(input.profile);
  const acceptedHistory: MovementProfileV2AssessmentHistoryRecord[] = [];
  const checkUps: MockCheckUp[] = [];
  const latestOffset = count < 4 ? 14 * DAY_MS : 0;
  for (let index = 0; index < count; index++) {
    const startedAt = new Date(
      now.getTime() - latestOffset - (count - 1 - index) * MONTH_MS
    ).toISOString();
    const raw = buildRawCheckUp(startedAt, index);
    const checkupType: StoredCheckUpType = index === 0 ? 'baseline' : 'official_retest';
    const result = materializeOfficialMovementProfileV2Artifacts({
      checkUp: raw,
      checkupType,
      referenceProfile,
      lifeGoal: input.profile.lifeGoal ?? null,
      acceptedHistory,
      snapshotCreatedAt: startedAt,
      assessmentCreatedAt: startedAt,
    });
    if (!result.ok) {
      throw new Error(`[mockData] check-up materialization failed: ${result.reason}`);
    }
    checkUps.push({ checkUp: result.checkUp, checkupType });
    acceptedHistory.push({
      checkUp: result.checkUp,
      checkupType,
      movementProfileV2Snapshot: result.snapshot,
      movementProfileV2Assessment: result.assessment,
    });
  }
  return checkUps;
}

/** Simulate `sessionCount` completed sessions on top of the placed state. */
function simulateSessions(
  base: ProgrammeState,
  sessionCount: number,
  phaseStartedAt: Date,
  phase: number
): ProgrammeState {
  let state = markFirstSessionStarted(base);
  // Alternate 'lots'/'a_few' so ladders climb without every pattern pinning
  // to the top of the range — a realistic mid-journey spread.
  for (let session = 0; session < sessionCount; session++) {
    const template: SessionTemplateId = state.completedSessionCount % 2 === 0 ? 'A' : 'B';
    const plan = generateProgrammeSession({
      state,
      template,
      preset: 'standard',
      lastSessionEffort: state.lastSessionEffort,
    });
    const completedAtIso = new Date(
      phaseStartedAt.getTime() + (2 + session * 3) * DAY_MS
    ).toISOString();
    const effort: EffortAnswer = session % 3 === 2 ? 'lots' : 'a_few';
    const outcomes: PatternSessionOutcome[] = plan.main.map((exercise) => ({
      pattern: exercise.pattern,
      levelPerformed: exercise.level,
      sets: Array.from({ length: exercise.sets }, () => ({ achieved: exercise.repTargetPerSet })),
      effort,
      painFlag: false,
      performedAtIso: completedAtIso,
    }));
    const applied = applyProgrammeSessionResults(state, plan, {
      outcomes,
      prepCompleted: true,
      finisherCompleted: true,
      completedAtIso,
      sessionEffort: effort,
    });
    const credit = recordProgrammeJourneySession(applied.state.journey, {
      sessionId: `mock-phase-${phase}-session-${session + 1}`,
      completedAtIso,
      templateId: template,
    });
    state =
      credit.kind === 'credited' || credit.kind === 'already_recorded'
        ? { ...applied.state, journey: credit.state }
        : applied.state;
  }
  return state;
}

/**
 * Build a full mock journey: an improving series of official check-ups and an
 * advanced programme state. Pure — persistence is the caller's job.
 */
export function generateMockJourney(input: GenerateMockJourneyInput): MockJourney {
  const now = input.now ?? new Date();
  const checkUps = buildCheckUps(input);
  const sessionCount = Math.max(0, input.sessionCount ?? 18);

  // Place off the first (oldest) check-up, exactly like the shell does for a
  // fresh check-up (`deferred: false` → exact placement), then run sessions.
  const firstCheckUp = checkUps[0].checkUp;
  const placed = applyAssessmentPlacement(
    input.programmeState,
    assessmentInputsFromCheckUp(firstCheckUp),
    { deferred: false, completedAtIso: firstCheckUp.startedAt }
  );
  let programmeState = placed;
  const phaseCount = Math.min(3, checkUps.length);
  let remainingSessions = sessionCount;
  for (let index = 0; index < checkUps.length; index++) {
    const assessment = checkUps[index].checkUp.movementProfileV2Assessment;
    if (!assessment) throw new Error('[mockData] materialized assessment missing');
    const advanced = applyOfficialAssessmentToProgrammeJourney(programmeState.journey, {
      assessment,
      completedAtIso: checkUps[index].checkUp.startedAt,
    });
    if (advanced.kind !== 'advanced' && advanced.kind !== 'completed') {
      throw new Error(`[mockData] journey checkpoint rejected: ${advanced.kind}`);
    }
    programmeState = { ...programmeState, journey: advanced.state };
    if (advanced.kind === 'advanced') {
      const phasesRemaining = phaseCount - index;
      const phaseSessions = Math.ceil(remainingSessions / Math.max(1, phasesRemaining));
      remainingSessions -= phaseSessions;
      programmeState = simulateSessions(
        programmeState,
        phaseSessions,
        new Date(checkUps[index].checkUp.startedAt),
        advanced.startedPhase
      );
    }
  }

  // Reflect the most recent check-up as the one that resets the cadence clock.
  const latestCheckUp = checkUps[checkUps.length - 1].checkUp;
  programmeState = {
    ...programmeState,
    profile: {
      ...programmeState.profile,
      assessmentStatus: 'done',
      lastAssessmentAtIso: latestCheckUp.startedAt,
    },
  };

  return { checkUps, programmeState };
}
