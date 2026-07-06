import {
  defaultProgrammeProfile,
  defaultProgrammeState,
  deserializeProgrammeState,
  PROGRAMME_STATE_SCHEMA_VERSION,
  serializeProgrammeState,
} from '../serialize';
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
  });
});

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
