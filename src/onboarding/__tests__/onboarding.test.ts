import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  type MovementSafetyProfile,
} from '../../adherence';
import { DEFAULT_BATTERY } from '../../checkup';
import { syntheticCheckUp } from '../../checkup/devFixture';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../history';
import { TUG_ID } from '../../movements';
import { defaultPreferences } from '../../profile';
import { scoreCheckUp } from '../../scoring';
import {
  DEFAULT_EQUIPMENT,
  buildBlock,
  defaultTrainingState,
  startBlock,
} from '../../training';
import { planTodayHaleSession } from '../../haleFlow';
import { onboardingDomainSummaries, onboardingFocusDomain } from '../results';
import { V1_BASELINE_MOVEMENT_IDS, deriveOnboardingStep } from '../state';

const START = '2026-06-16T08:00:00.000Z';

function safetyProfile(equipment: MovementSafetyProfile['availableEquipment'] = ['chair', 'wall']): MovementSafetyProfile {
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
  };
}

function storedCheckUp(): StoredCheckUp {
  return { schemaVersion: HISTORY_SCHEMA_VERSION, checkUp: syntheticCheckUp(START) };
}

function onboardingPrefs() {
  const prefs = defaultPreferences();
  prefs.profile.lifeGoal = createLifeGoal({ category: 'stairs', nowIso: START });
  prefs.profile.goal = 'Climb stairs more easily';
  prefs.profile.age = 60;
  prefs.profile.safetyProfile = safetyProfile();
  prefs.onboarding.currentStep = 'camera_setup';
  prefs.onboarding.selectedEquipment = ['chair', 'wall'];
  return prefs;
}

function movementBlock() {
  const checkUp = syntheticCheckUp(START);
  return createMovementBlockFromAssessment({
    latestAssessment: { id: checkUp.startedAt, score: scoreCheckUp(checkUp) },
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

  it('moves from baseline history to results until a block exists', () => {
    const prefs = onboardingPrefs();
    prefs.onboarding.currentStep = 'results';
    expect(deriveOnboardingStep({ prefs, history: [storedCheckUp()] })).toBe('results');
  });

  it('treats an active 4-week block as onboarding complete', () => {
    const prefs = onboardingPrefs();
    expect(deriveOnboardingStep({ prefs, history: [storedCheckUp()], activeBlock: movementBlock() })).toBe('complete');
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
      'Strength / Power',
      'Balance',
      'Mobility',
    ]);
  });

  it('feeds onboarding equipment into dynamic session generation', () => {
    const checkUp = syntheticCheckUp(START);
    const score = scoreCheckUp(checkUp);
    const training = startBlock(defaultTrainingState(), buildBlock(score, DEFAULT_EQUIPMENT, START));
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
});
