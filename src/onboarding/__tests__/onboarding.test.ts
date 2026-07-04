import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  type MovementAssessment,
  type MovementSafetyProfile,
} from '../../adherence';
import { DEFAULT_BATTERY } from '../../checkup';
import { legacySyntheticCheckUp as syntheticCheckUp } from '../../checkup/testing/legacyCheckUpFixture';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../history';
import { TUG_ID } from '../../movements';
import { defaultPreferences } from '../../profile';
import { createCurrentVersionedScoreSnapshot, scoreCheckUp } from '../../scoring';
import { defaultTrainingState, type TrainingBlock } from '../../training';
import { createMovementAssessment, requireHaleSessionPlan as planTodayHaleSession } from '../../haleFlow';
import {
  onboardingDomainSummaries,
  onboardingFocusDomain,
  plannedOnboardingFocusDomain,
} from '../results';
import { V1_BASELINE_MOVEMENT_IDS, deriveOnboardingStep } from '../state';

const START = '2026-06-16T08:00:00.000Z';

function safetyProfile(
  equipment: MovementSafetyProfile['availableEquipment'] = ['chair', 'wall'],
  overrides: Partial<MovementSafetyProfile> = {}
): MovementSafetyProfile {
  return {
    id: 'safety-1',
    userId: 'local-device-user',
    age: 60,
    activityLevel: 'lightly_active',
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: equipment,
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: START,
    updatedAt: START,
    ...overrides,
  };
}

function storedCheckUp(): StoredCheckUp {
  const checkUp = syntheticCheckUp(START);
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType: 'baseline',
    checkUp,
    scoreSnapshot: scored.snapshot ?? undefined,
    scoreSnapshotCompatibility: scored.snapshot ? 'current' : 'invalid_snapshot',
  };
}

function noMeasurementStoredCheckUp(): StoredCheckUp {
  const checkUp = {
    startedAt: START,
    bodyUnit: 1,
    items: DEFAULT_BATTERY.map((movementId) => ({
      movementId,
      status: 'measured' as const,
      result: { movementId, flags: ['no-measurement'], interruptions: 0 },
    })),
  };
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType: 'baseline',
    checkUp,
    scoreSnapshot: scored.snapshot ?? undefined,
    scoreSnapshotCompatibility: scored.snapshot ? 'current' : 'invalid_snapshot',
  };
}

function storedAssessment(): MovementAssessment {
  const checkUp = storedCheckUp().checkUp;
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return createMovementAssessment({
    checkUpId: checkUp.startedAt,
    type: 'baseline',
    score: scored.score,
    scoreSnapshot: scored.snapshot,
    completedAt: checkUp.startedAt,
    isOfficialForProgress: true,
  });
}

function onboardingPrefs() {
  const prefs = defaultPreferences();
  prefs.profile.lifeGoal = createLifeGoal({ category: 'stairs', nowIso: START });
  prefs.profile.goal = 'Climb stairs easily';
  prefs.profile.exactAge = 60;
  prefs.profile.referenceSex = 'female';
  prefs.profile.age = 60;
  prefs.profile.ageBand = '55_64';
  prefs.profile.safetyProfile = safetyProfile();
  prefs.onboarding.currentStep = 'camera_setup';
  return prefs;
}

function movementBlock() {
  const checkUp = syntheticCheckUp(START);
  const assessment = storedAssessment();
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return createMovementBlockFromAssessment({
    latestAssessment: { id: checkUp.startedAt, score: scored.score, scoreSnapshot: scored.snapshot, assessment },
    lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
    startDate: START,
  });
}

describe('Hale V1 onboarding state', () => {
  it('starts a brand-new user at welcome', () => {
    expect(deriveOnboardingStep({ prefs: defaultPreferences(), history: [] })).toBe('welcome');
  });

  it('resumes camera setup after profile and equipment are complete', () => {
    const prefs = onboardingPrefs();
    expect(deriveOnboardingStep({ prefs, history: [] })).toBe('camera_setup');
  });

  it('allows onboarding to finish when the first check-up is deferred', () => {
    const prefs = onboardingPrefs();
    prefs.onboarding.currentStep = 'complete';
    prefs.onboarding.completedAt = START;

    expect(deriveOnboardingStep({ prefs, history: [] })).toBe('complete');
  });

  it('moves from baseline history to results until a block exists', () => {
    const prefs = onboardingPrefs();
    prefs.onboarding.currentStep = 'results';
    expect(deriveOnboardingStep({ prefs, history: [storedCheckUp()], assessments: [storedAssessment()] })).toBe('results');
  });

  it('does not treat an invalid baseline attempt as onboarding-ready on restart', () => {
    const prefs = onboardingPrefs();
    prefs.onboarding.currentStep = 'results';
    expect(deriveOnboardingStep({ prefs, history: [noMeasurementStoredCheckUp()] })).toBe('camera_setup');
  });

  it('treats an active 4-week block as onboarding complete', () => {
    const prefs = onboardingPrefs();
    expect(deriveOnboardingStep({ prefs, history: [storedCheckUp()], assessments: [storedAssessment()], activeBlock: movementBlock() })).toBe('complete');
  });

  it('uses the V1 baseline battery without Timed Up and Go', () => {
    expect(V1_BASELINE_MOVEMENT_IDS).toEqual([
      'chair-stand-30s',
      'balance-ladder',
      'shoulder-flexion-peak',
      'hinge-reach',
    ]);
    expect(DEFAULT_BATTERY).toEqual([...V1_BASELINE_MOVEMENT_IDS]);
    expect(V1_BASELINE_MOVEMENT_IDS).not.toContain(TUG_ID);
  });
});

describe('Hale V1 onboarding results and equipment', () => {
  it('summarises the baseline focus from measured results', () => {
    const score = scoreCheckUp(syntheticCheckUp(START));

    expect(onboardingFocusDomain(score)).toBe('balance_stability');
    expect(onboardingDomainSummaries(score).map((summary) => summary.title)).toEqual([
      'Strength & Power',
      'Balance',
      'Mobility',
    ]);
  });

  it('reads result bands against the user\'s own age when known', () => {
    const score = scoreCheckUp(syntheticCheckUp(START));
    const measured = score.domains.filter((domain) => domain.measured);
    expect(measured.length).toBeGreaterThan(0);

    // The same movement ages read as strong to an older user and as a
    // starting point to a much younger one.
    const keyForDomain = {
      strength: 'strength_power',
      balance: 'balance_stability',
      mobility: 'mobility_flexibility',
    } as const;
    const asOlderUser = onboardingDomainSummaries(score, 120);
    const asYoungerUser = onboardingDomainSummaries(score, 18);
    for (const domain of score.domains) {
      if (!domain.measured) continue;
      const key = keyForDomain[domain.domain];
      expect(asOlderUser.find((summary) => summary.key === key)?.band).toBe('strong');
      expect(asYoungerUser.find((summary) => summary.key === key)?.band).toBe('starting_point');
    }

    // Without a known age the historical absolute cutoffs still apply.
    const withoutAge = onboardingDomainSummaries(score);
    for (const summary of withoutAge) {
      expect(['strong', 'building', 'starting_point', 'baseline_pending']).toContain(summary.band);
    }
  });

  it('uses the planned block focus when onboarding display focus differs from the raw score', () => {
    const score = scoreCheckUp(syntheticCheckUp(START));

    expect(onboardingFocusDomain(score)).toBe('balance_stability');
    expect(
      plannedOnboardingFocusDomain({
        score,
        plannedBlock: { focusDomain: 'mobility' },
      })
    ).toBe('mobility_flexibility');
  });

  it('feeds onboarding equipment into dynamic session generation', () => {
    const checkUp = syntheticCheckUp(START);
    const score = scoreCheckUp(checkUp);
    const training = {
      ...defaultTrainingState(),
      block: { createdAt: START, weeks: 4, sessionsPerWeek: 3, weakestDomain: 'strength', sessions: [] } as TrainingBlock,
    };
    const plan = planTodayHaleSession({
      activeBlock: movementBlock(),
      training: { ...training, equipment: { stair: false, band: false, miniBand: false, load: false } },
      safetyProfile: safetyProfile(['chair', 'wall']),
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
      today: START,
    });
    const required = plan.exercises.flatMap((exercise) => exercise.requiresEquipment ?? []);

    expect(plan.metadata?.source).toBe('block_generated');
    expect(required).not.toContain('stair');
    expect(required).not.toContain('long_band');
    expect(required).not.toContain('mini_band');
    expect(required).not.toContain('backpack_or_weight');
  });

  it('feeds onboarding discomfort into dynamic session generation', () => {
    const checkUp = syntheticCheckUp(START);
    const score = scoreCheckUp(checkUp);
    const training = {
      ...defaultTrainingState(),
      block: { createdAt: START, weeks: 4, sessionsPerWeek: 3, weakestDomain: 'strength', sessions: [] } as TrainingBlock,
    };
    const plan = planTodayHaleSession({
      activeBlock: movementBlock(),
      training,
      safetyProfile: safetyProfile(['chair', 'wall', 'resistance_band'], {
        hasCurrentPain: true,
        painNotes: 'shoulder',
      }),
      lifeGoal: createLifeGoal({ category: 'noticed_decline', nowIso: START }),
      today: START,
    });

    expect(plan.metadata?.dailyContext?.discomfortAreas).toEqual(['shoulder']);
    expect(plan.metadata?.guidance?.join(' ')).toContain('area you marked in setup');
  });
});
