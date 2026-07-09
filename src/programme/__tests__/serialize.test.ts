import {
  defaultProgrammeProfile,
  defaultProgrammeState,
  deserializeProgrammeState,
  PROGRAMME_STATE_SCHEMA_VERSION,
  serializeProgrammeState,
} from '../serialize';
import {
  PROGRAMME_JOURNEY_POLICY_FINGERPRINT,
  createEmptyProgrammeJourneyState,
  type ProgrammeJourneyCheckpoint,
  type ProgrammeJourneySessionCredit,
  type ProgrammeJourneyState,
} from '../journey';
import {
  PROGRAMME_PHASE_PRESCRIPTION_POLICY_FINGERPRINT,
  type ProgrammePhasePrescription,
} from '../prescription';
import { programmePolicyFingerprint, validateProgrammePolicyFingerprint } from '../policy';
import { freshPatternLadderState, recordGatewayDemoWatched } from '../promotion';

describe('conservative defaults', () => {
  it('starts with no consent, no prior, empty placement, everything safe-side', () => {
    const profile = defaultProgrammeProfile();
    expect(profile.consentHealthData).toBe(false);
    expect(profile.activityLevel).toBeNull();
    expect(profile.gentleStartActive).toBe(false);
    expect(profile.pelvicRouting).toBe('none');
    expect(profile.hasStairs).toBeNull();
    expect(profile.hasBand).toBeNull();
    expect(profile.placement).toEqual({});
    expect(profile.assessmentStatus).toBeNull();
    expect(profile.firstSessionStarted).toBe(false);
  });

  it('starts every ladder at L1 with a 20-contact finisher budget', () => {
    const state = defaultProgrammeState();
    for (const ladder of Object.values(state.ladders)) {
      expect(ladder.currentLevel).toBe(1);
    }
    expect(state.finisher).toEqual({
      track: 'quiet_power',
      completedSessions: 0,
      currentContacts: 20,
    });
    expect(state.policyFingerprint).toBe(programmePolicyFingerprint());
    expect(state.journey).toEqual(createEmptyProgrammeJourneyState());
  });
});

describe('round-trip', () => {
  it('preserves a populated state exactly', () => {
    const state = defaultProgrammeState();
    state.profile = {
      ...defaultProgrammeProfile(),
      consentHealthData: true,
      activityLevel: 'moderately_active',
      pelvicRouting: 'low_impact',
      quietMode: true,
      jointFlags: ['knee', 'wrist'],
      hasStairs: true,
      placement: { squat: 2, push: 2 },
      assessmentStatus: 'deferred',
      chosenDays: ['mon', 'wed', 'sat'],
      firstSessionStarted: true,
    };
    state.ladders.hinge = recordGatewayDemoWatched(freshPatternLadderState('hinge', 4), 5);
    state.ladders.squat = {
      ...freshPatternLadderState('squat', 3),
      consecutiveTopSessions: 1,
      recentPainFlags: [false, true],
      lastPainFreeLevel: 2,
      bonusSetSuspended: true,
      lastPerformedAtIso: '2026-07-06T10:00:00.000Z',
    };
    state.lastSessionAtIso = '2026-07-06T10:00:00.000Z';
    state.lastSessionEffort = 'a_few';

    const json = serializeProgrammeState(state);
    expect(JSON.parse(json).schemaVersion).toBe(PROGRAMME_STATE_SCHEMA_VERSION);
    expect(deserializeProgrammeState(json)).toEqual(state);
  });
});

describe('defensive parsing', () => {
  it('rejects unparseable or non-object input', () => {
    expect(deserializeProgrammeState('not json')).toBeNull();
    expect(deserializeProgrammeState('42')).toBeNull();
  });

  it('drops unknown enum values and foreign fields back to safe defaults', () => {
    const json = JSON.stringify({
      schemaVersion: 99,
      profile: {
        consentHealthData: 'yes', // wrong type → false
        activityLevel: 'olympian', // unknown → null
        pelvicRouting: 'high_impact', // unknown → 'none'
        jointFlags: ['knee', 'elbow', 'knee'], // unknown + duplicate dropped
        chosenDays: ['mon', 'someday'],
        assessmentStatus: 'basically_done',
        placement: { squat: 99, hinge: 'three', pelvis: 2 },
        surprise: true,
      },
      ladders: {
        squat: { currentLevel: 42, consecutiveTopSessions: -3, recentPainFlags: [true, 'x', false, true] },
      },
      finisher: { track: 'impact', completedSessions: -1, currentContacts: 500 },
      lastSessionEffort: 'maximum', // unknown → null (never promotes on unknown effort)
    });
    const state = deserializeProgrammeState(json);
    expect(state).not.toBeNull();
    expect(state?.profile.consentHealthData).toBe(false);
    expect(state?.profile.activityLevel).toBeNull();
    expect(state?.profile.pelvicRouting).toBe('none');
    expect(state?.profile.jointFlags).toEqual(['knee']);
    expect(state?.profile.chosenDays).toEqual(['mon']);
    expect(state?.profile.assessmentStatus).toBeNull();
    expect(state?.profile.placement).toEqual({ squat: 9 }); // clamped to the ladder top
    expect(state?.ladders.squat.currentLevel).toBe(9);
    expect(state?.ladders.squat.consecutiveTopSessions).toBe(0);
    expect(state?.ladders.squat.recentPainFlags).toEqual([false, true]); // booleans only, last 2
    expect(state?.ladders.hinge.currentLevel).toBe(1); // absent ladder → fresh default
    expect(state?.finisher.track).toBe('quiet_power'); // impact is not a v1 value
    expect(state?.finisher.completedSessions).toBe(0);
    expect(state?.finisher.currentContacts).toBe(50); // clamped into 20–50
    expect(state?.lastSessionEffort).toBeNull();
    expect(state?.journey).toEqual(createEmptyProgrammeJourneyState());
  });

  it('migrates v1 without losing valid programme progress', () => {
    const v1 = JSON.parse(serializeProgrammeState(defaultProgrammeState()));
    v1.schemaVersion = 1;
    delete v1.journey;
    v1.completedSessionCount = 7;
    v1.profile.chosenDays = ['mon', 'thu'];
    v1.ladders.squat.currentLevel = 4;

    const migrated = deserializeProgrammeState(JSON.stringify(v1));
    expect(migrated?.completedSessionCount).toBe(7);
    expect(migrated?.profile.chosenDays).toEqual(['mon', 'thu']);
    expect(migrated?.ladders.squat.currentLevel).toBe(4);
    expect(migrated?.journey).toEqual(createEmptyProgrammeJourneyState());
  });

  it.each([1, 2, 3, 'completed'] as const)(
    'round-trips a coherent journey through %s',
    (stage) => {
      const state = defaultProgrammeState();
      state.journey = journeyFixture(stage);
      expect(deserializeProgrammeState(serializeProgrammeState(state))).toEqual(state);
    }
  );

  it('preserves a baseline-retake journey when checkpoint and prescription provenance agree', () => {
    const state = defaultProgrammeState();
    const journey = journeyFixture(1);
    state.journey = {
      ...journey,
      checkpoints: {
        ...journey.checkpoints,
        baseline: {
          ...journey.checkpoints.baseline!,
          sourceCheckUpType: 'baseline_retake',
        },
      },
      phasePrescriptions: {
        ...journey.phasePrescriptions,
        1: {
          ...journey.phasePrescriptions[1]!,
          sourceCheckUpType: 'baseline_retake',
        },
      },
    };
    expect(deserializeProgrammeState(serializeProgrammeState(state))).toEqual(state);
  });

  it.each([
    [
      'checkpoint',
      (raw: any) => {
        raw.journey.checkpoints.baseline.completedAtIso = 'soon';
      },
    ],
    [
      'prescription',
      (raw: any) => {
        raw.journey.phasePrescriptions['1'].canonicalFocus.domain = 'mobility';
      },
    ],
    [
      'session credit',
      (raw: any) => {
        raw.journey.sessionCredits[0].phaseWeek = 5;
      },
    ],
    [
      'journey policy fingerprint',
      (raw: any) => {
        raw.journey.policyFingerprint = 'foreign-journey-policy';
      },
    ],
    [
      'prescription policy fingerprint',
      (raw: any) => {
        raw.journey.phasePrescriptions['1'].policyFingerprint = 'foreign-focus-policy';
      },
    ],
  ])(
    'resets the whole journey for a malformed nested %s without discarding programme data',
    (_label, corrupt) => {
      const state = defaultProgrammeState();
      state.completedSessionCount = 11;
      state.profile.chosenDays = ['tue', 'fri'];
      state.ladders.hinge.currentLevel = 3;
      state.journey = activeJourneyFixture();
      const raw = JSON.parse(serializeProgrammeState(state));
      corrupt(raw);

      const parsed = deserializeProgrammeState(JSON.stringify(raw));
      expect(parsed?.journey).toEqual(createEmptyProgrammeJourneyState());
      expect(parsed?.completedSessionCount).toBe(11);
      expect(parsed?.profile.chosenDays).toEqual(['tue', 'fri']);
      expect(parsed?.ladders.hinge.currentLevel).toBe(3);
    }
  );

  it.each([
    [
      'awaiting-baseline state retaining phase records',
      (raw: any) => {
        const active = activeJourneyFixture();
        raw.journey = {
          ...active,
          status: 'awaiting_baseline',
          startedAtIso: null,
          currentPhase: null,
          currentPhaseStartedAtIso: null,
          completedAtIso: null,
        };
      },
    ],
    [
      'missing earlier checkpoint',
      (raw: any) => {
        raw.journey = journeyFixture(2);
        delete raw.journey.checkpoints.baseline;
      },
    ],
    [
      'future checkpoint and prescription',
      (raw: any) => {
        const phaseTwo = journeyFixture(2) as any;
        raw.journey.checkpoints.week4 = phaseTwo.checkpoints.week4;
        raw.journey.phasePrescriptions['2'] = phaseTwo.phasePrescriptions['2'];
      },
    ],
    [
      'missing required phase prescription',
      (raw: any) => {
        raw.journey = journeyFixture(2);
        delete raw.journey.phasePrescriptions['2'];
      },
    ],
    [
      'future phase prescription without its checkpoint',
      (raw: any) => {
        raw.journey.phasePrescriptions['2'] = (journeyFixture(2) as any)
          .phasePrescriptions['2'];
      },
    ],
    [
      'checkpoint starting the wrong phase',
      (raw: any) => {
        raw.journey.checkpoints.baseline.startedPhase = 2;
      },
    ],
    [
      'checkpoint linked to a different prescription id',
      (raw: any) => {
        raw.journey.checkpoints.baseline.prescriptionId = 'other-prescription';
      },
    ],
    [
      'checkpoint and prescription source mismatch',
      (raw: any) => {
        raw.journey.phasePrescriptions['1'].sourceAssessmentFingerprint =
          'other-assessment-fingerprint';
      },
    ],
    [
      'checkpoint and prescription physical-focus mismatch',
      (raw: any) => {
        raw.journey.checkpoints.baseline.physicalFocus = 'balance';
      },
    ],
    [
      'internally inconsistent prescription focus',
      (raw: any) => {
        raw.journey.phasePrescriptions['1'].canonicalFocus.domain = 'balance';
      },
    ],
    [
      'wrong source type for checkpoint position',
      (raw: any) => {
        raw.journey.checkpoints.baseline.sourceCheckUpType = 'official_retest';
        raw.journey.phasePrescriptions['1'].sourceCheckUpType = 'official_retest';
      },
    ],
    [
      'started-at timestamp not anchored to baseline',
      (raw: any) => {
        raw.journey.startedAtIso = '2026-01-02T09:00:00.000Z';
      },
    ],
    [
      'current-phase timestamp not anchored to its checkpoint',
      (raw: any) => {
        raw.journey.currentPhaseStartedAtIso = '2026-01-02T09:00:00.000Z';
      },
    ],
    [
      'out-of-order checkpoint timestamps',
      (raw: any) => {
        raw.journey = journeyFixture(2);
        raw.journey.checkpoints.week4.completedAtIso = '2025-12-01T09:00:00.000Z';
        raw.journey.currentPhaseStartedAtIso = '2025-12-01T09:00:00.000Z';
      },
    ],
    [
      'completed-at timestamp not anchored to week 12',
      (raw: any) => {
        raw.journey = journeyFixture('completed');
        raw.journey.completedAtIso = '2026-03-27T09:00:00.000Z';
      },
    ],
    [
      'week-12 checkpoint attempting to start another phase',
      (raw: any) => {
        raw.journey = journeyFixture('completed');
        raw.journey.checkpoints.week12.startedPhase = 3;
      },
    ],
    [
      'session credit for a phase that has not started',
      (raw: any) => {
        raw.journey.sessionCredits[0].phase = 2;
      },
    ],
  ])('resets the whole journey for relationally invalid topology: %s', (_label, corrupt) => {
    const state = defaultProgrammeState();
    state.completedSessionCount = 11;
    state.journey = activeJourneyFixture();
    const raw = JSON.parse(serializeProgrammeState(state));
    corrupt(raw);

    const parsed = deserializeProgrammeState(JSON.stringify(raw));
    expect(parsed?.journey).toEqual(createEmptyProgrammeJourneyState());
    expect(parsed?.completedSessionCount).toBe(11);
  });
});

function activeJourneyFixture(): ProgrammeJourneyState {
  return journeyFixture(1);
}

function journeyFixture(stage: 1 | 2 | 3 | 'completed'): ProgrammeJourneyState {
  const phaseCount = stage === 'completed' ? 3 : stage;
  const checkpointKinds = ['baseline', 'week4', 'week8'] as const;
  const checkpointTimes = [
    '2026-01-01T09:00:00.000Z',
    '2026-01-29T09:00:00.000Z',
    '2026-02-26T09:00:00.000Z',
  ] as const;
  const checkpoints: Record<string, ProgrammeJourneyCheckpoint> = {};
  const phasePrescriptions: Record<string, ProgrammePhasePrescription> = {};
  const sessionCredits: ProgrammeJourneySessionCredit[] = [];

  for (let index = 0; index < phaseCount; index += 1) {
    const phase = (index + 1) as 1 | 2 | 3;
    const kind = checkpointKinds[index];
    const completedAtIso = checkpointTimes[index];
    const prescription = prescriptionFixture(phase, completedAtIso);
    phasePrescriptions[String(phase)] = prescription;
    checkpoints[kind] = {
      checkpointId: `checkpoint-${kind}`,
      kind,
      completedAtIso,
      sourceCheckUpId: prescription.sourceCheckUpId,
      sourceCheckUpType: prescription.sourceCheckUpType,
      sourceAssessmentId: prescription.sourceAssessmentId,
      sourceAssessmentFingerprint: prescription.sourceAssessmentFingerprint,
      physicalFocus: prescription.physicalFocus,
      startedPhase: phase,
      prescriptionId: prescription.prescriptionId,
    };
    sessionCredits.push({
      creditId: `credit-${phase}`,
      sessionId: `session-${phase}`,
      completedAtIso: `${completedAtIso.slice(0, 8)}${String(Number(completedAtIso.slice(8, 10)) + 1).padStart(2, '0')}T09:00:00.000Z`,
      localDateKey: `${completedAtIso.slice(0, 8)}${String(Number(completedAtIso.slice(8, 10)) + 1).padStart(2, '0')}`,
      phase,
      phaseWeek: 1,
      templateId: 'A',
    });
  }

  if (stage === 'completed') {
    checkpoints.week12 = {
      checkpointId: 'checkpoint-week12',
      kind: 'week12',
      completedAtIso: '2026-03-26T09:00:00.000Z',
      sourceCheckUpId: 'checkup-week12',
      sourceCheckUpType: 'official_retest',
      sourceAssessmentId: 'assessment-week12',
      sourceAssessmentFingerprint: 'assessment-fingerprint-week12',
      physicalFocus: 'strength',
      startedPhase: null,
      prescriptionId: null,
    };
  }

  const currentPhase = stage === 'completed' ? null : stage;
  return {
    schemaVersion: 1,
    policyVersion: 1,
    policyFingerprint: PROGRAMME_JOURNEY_POLICY_FINGERPRINT,
    status: stage === 'completed' ? 'completed' : 'active',
    startedAtIso: checkpointTimes[0],
    completedAtIso: stage === 'completed' ? '2026-03-26T09:00:00.000Z' : null,
    currentPhase,
    currentPhaseStartedAtIso:
      currentPhase === null ? null : checkpointTimes[currentPhase - 1],
    checkpoints,
    phasePrescriptions,
    sessionCredits,
  };
}

function prescriptionFixture(
  phase: 1 | 2 | 3,
  completedAtIso: string
): ProgrammePhasePrescription {
  const kind = (['baseline', 'week4', 'week8'] as const)[phase - 1];
  const sourceCheckUpType = phase === 1 ? 'baseline' : 'official_retest';
  const prescription: ProgrammePhasePrescription = {
    schemaVersion: 1,
    policyVersion: 1,
    policyFingerprint: PROGRAMME_PHASE_PRESCRIPTION_POLICY_FINGERPRINT,
    prescriptionId: `prescription-phase-${phase}`,
    phase,
    physicalFocus: 'strength',
    dosePolicy: {
      plannedFocusBlocksPerWeek: 3,
      focusBlockStrategy: 'strength_each_session',
    },
    canonicalFocus: {
      kind: 'domain',
      domain: 'strength_power',
      planMode: 'checkup_reference_focus',
      decisionReason: 'v2_focus_single_below_reference',
    },
    sourceAssessmentId: `assessment-${kind}`,
    sourceAssessmentFingerprint: `assessment-fingerprint-${kind}`,
    sourceCheckUpId: `checkup-${kind}`,
    sourceCheckUpType,
    createdAtIso: completedAtIso,
  };
  return prescription;
}

describe('policy fingerprint (reviewed-snapshot discipline, C4)', () => {
  it('is stable across calls and validates as current', () => {
    const fingerprint = programmePolicyFingerprint();
    expect(programmePolicyFingerprint()).toBe(fingerprint);
    expect(validateProgrammePolicyFingerprint(fingerprint)).toEqual({ status: 'current' });
  });

  it('changes when the promotion config changes and flags stored state as stale', () => {
    const doctored = programmePolicyFingerprint({
      standardConsecutiveSessions: 3,
      bottomNoneSessionsForHoldReduce: 2,
      inactivityRegressionDays: 14,
    });
    expect(doctored).not.toBe(programmePolicyFingerprint());
    const validation = validateProgrammePolicyFingerprint(doctored);
    expect(validation.status).toBe('stale_policy');
  });
});
