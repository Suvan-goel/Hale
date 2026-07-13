import { HistoryStore, createMemoryFs } from '../../history';
import {
  buildMovementProfileV2ProgressViewModel,
  movementProfileV2ProgressProfileBySourceCheckUpId,
  validOfficialMovementProfileV2Assessments,
} from '../../pearlFlow';
import { movementProfileV2ResultsViewModelForRecord } from '../../movementProfileV2/viewModel';
import { EMPTY_PROFILE } from '../../profile';
import { defaultProgrammeState } from '../../programme';
import { generateMockJourney } from '../mockData';

function onboardedState() {
  const base = defaultProgrammeState();
  return {
    ...base,
    onboardingCompletedAtIso: '2026-03-01T00:00:00.000Z',
    profile: { ...base.profile, activityLevel: 'lightly_active' as const, consentHealthData: true },
  };
}

const PROFILE = { ...EMPTY_PROFILE, exactAge: 55, age: 55, referenceSex: 'female' as const };
const NOW = new Date('2026-07-08T12:00:00.000Z');

describe('generateMockJourney', () => {
  it('seeds check-ups that render through the real Progress view model', async () => {
    const journey = generateMockJourney({
      profile: PROFILE,
      programmeState: onboardedState(),
      checkUpCount: 3,
      sessionCount: 9,
      now: NOW,
    });

    expect(journey.checkUps).toHaveLength(3);
    expect(journey.checkUps[0].checkupType).toBe('baseline');
    expect(journey.checkUps[1].checkupType).toBe('official_retest');
    expect(journey.checkUps.every(({ checkUp }) => checkUp.items.length === 2)).toBe(true);
    expect(
      journey.checkUps.every(
        ({ checkUp }) =>
          checkUp.measurementProtocol?.protocolVariant ===
          'pearl_monthly_strength_balance_v1'
      )
    ).toBe(true);

    // Persist through the production store + serializer, then read back.
    const store = new HistoryStore(createMemoryFs());
    for (const { checkUp, checkupType } of journey.checkUps) {
      store.save(checkUp, { checkupType });
    }
    const history = await store.loadAll();

    // Every seeded check-up materialized into an official V2 assessment.
    expect(validOfficialMovementProfileV2Assessments(history)).toHaveLength(3);

    const progress = buildMovementProfileV2ProgressViewModel({
      history,
    });
    expect(progress.status).toBe('ready');
    if (progress.status !== 'ready') throw new Error(progress.status);
    expect(progress.officialHistory).toHaveLength(3);

    // Each check-up resolves to a per-check-up Results view model.
    for (const { checkUp } of journey.checkUps) {
      const record = movementProfileV2ProgressProfileBySourceCheckUpId(history, checkUp.startedAt);
      expect(record).not.toBeNull();
      const vm = movementProfileV2ResultsViewModelForRecord(record!, { comparisonOptIn: true });
      expect(vm.domainCards.length).toBeGreaterThan(0);
    }
  });

  it('advances the programme state to reflect completed sessions', () => {
    const journey = generateMockJourney({
      profile: PROFILE,
      programmeState: onboardedState(),
      checkUpCount: 3,
      sessionCount: 9,
      now: NOW,
    });
    expect(journey.programmeState.completedSessionCount).toBe(9);
    expect(journey.programmeState.profile.firstSessionStarted).toBe(true);
    expect(journey.programmeState.profile.assessmentStatus).toBe('done');
    expect(journey.programmeState.journey.status).toBe('active');
    expect(journey.programmeState.journey.currentPhase).toBe(3);
    expect(journey.programmeState.journey.sessionCredits).toHaveLength(9);
    // At least one ladder climbed above the fresh entry level.
    const climbed = Object.values(journey.programmeState.ladders).some((l) => l.currentLevel > 1);
    expect(climbed).toBe(true);
  });
});
