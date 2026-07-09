import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup';
import type { CheckUp } from '../../checkup';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../checkup/protocolSetup';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  CHAIR_RISE_V2_ID,
  ONE_LEG_BALANCE_V2_ID,
  type ActiveShoulderReachV2Result,
  type ChairRiseV2Result,
  type OneLegBalanceV2Result,
} from '../../movements';
import {
  createMovementProfileV2Assessment,
  createMovementProfileV2Snapshot,
} from '../../reference/movementProfileV2';
import { buildMovementProfileV2ResultsViewModel } from '../viewModel';

describe('Movement Profile V2 view model', () => {
  it('uses only frozen V2 artifacts and avoids trend, age, and diagnostic-code language', () => {
    const checkUp = makeV2CheckUp();
    const snapshot = createMovementProfileV2Snapshot({
      checkUp,
      checkupType: 'baseline',
      referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'female' },
      createdAt: '2026-06-24T09:01:00.000Z',
    });
    if (!snapshot.ok) throw new Error(snapshot.reason);
    const assessment = createMovementProfileV2Assessment({
      checkUp,
      snapshot: snapshot.snapshot,
      createdAt: '2026-06-24T09:02:00.000Z',
    });
    if (!assessment.ok) throw new Error(assessment.reason);

    const model = buildMovementProfileV2ResultsViewModel({
      snapshot: snapshot.snapshot,
      assessment: assessment.assessment,
    });
    const text = JSON.stringify(model);

    expect(model.domainCards.map((card) => card.domain)).toEqual(['strength_power', 'balance']);
    expect(model.focusTitle).toMatch(/^Suggested focus:/);
    expect(text).not.toMatch(/movement age|improved|declined|fingerprint|v2_|reason|published comparison|published middle range|diagnos|fall risk/i);

    // Baseline-relative default (reposition slice 5): population comparison
    // never renders without the opt-in.
    expect(text).not.toMatch(/percentile|for your age group/i);
    expect(text).toContain('Adds to your own strength trend');
  });

  it('renders population comparison copy only behind the opt-in, still claim-gated', () => {
    const { snapshot, assessment } = makeArtifacts();

    const optedIn = buildMovementProfileV2ResultsViewModel({
      snapshot,
      assessment,
      comparisonOptIn: true,
    });
    const optedInText = JSON.stringify(optedIn);
    expect(optedInText).toContain('Around the 10th-40th percentile');

    const optedOut = buildMovementProfileV2ResultsViewModel({
      snapshot,
      assessment,
      comparisonOptIn: false,
    });
    expect(JSON.stringify(optedOut)).not.toMatch(/percentile/i);
    // Reversible in place: same artifacts, same tiers, only comparison copy moves.
    expect(optedOut.domainCards.map((c) => c.status)).toEqual(
      optedIn.domainCards.map((c) => c.status)
    );
  });

  // Diagnosis-shaped first assessment (REPOSITION_TDD §2.3): strongest asset +
  // biggest opportunity, ordinal-only from the focus engine's own evidence,
  // honest fallback when eligibility can't support a ranking.
  describe('diagnosis-shaped focus body', () => {
    const { snapshot } = makeArtifacts();

    function focusBodyFor(
      evidence: { domain: 'strength_power' | 'balance' | 'mobility'; category: string }[]
    ): string {
      const assessment = {
        focus: { kind: 'domain', focusDomain: 'balance', planMode: 'checkup_reference_focus' },
        focusProvenance: {
          domainEvidence: evidence.map((item) => ({ ...item, focusEligible: true })),
        },
      } as unknown as Parameters<typeof buildMovementProfileV2ResultsViewModel>[0]['assessment'];
      return buildMovementProfileV2ResultsViewModel({ snapshot, assessment }).focus.body;
    }

    it('names a single strongest asset and the opportunity, plan-first', () => {
      expect(
        focusBodyFor([
          { domain: 'strength_power', category: 'within_reference' },
          { domain: 'balance', category: 'below_reference' },
          { domain: 'mobility', category: 'raw_only_valid' },
        ])
      ).toBe('Strength is your strongest asset. Balance is your biggest opportunity — your plan starts there.');
    });

    it('ignores legacy Mobility evidence when naming the active product asset', () => {
      expect(
        focusBodyFor([
          { domain: 'strength_power', category: 'within_reference' },
          { domain: 'balance', category: 'below_reference' },
          { domain: 'mobility', category: 'above_reference_or_ceiling' },
        ])
      ).toBe('Strength is your strongest asset. Balance is your biggest opportunity — your plan starts there.');
    });

    it('does not pull a legacy Mobility tie into Strength + Balance framing', () => {
      expect(
        focusBodyFor([
          { domain: 'strength_power', category: 'within_reference' },
          { domain: 'balance', category: 'below_reference' },
          { domain: 'mobility', category: 'pearl_building' },
        ])
      ).toBe('Strength is your strongest asset. Balance is your biggest opportunity — your plan starts there.');
    });

    it('falls back to the honest focus line when no reference-supported asset exists', () => {
      expect(
        focusBodyFor([
          { domain: 'strength_power', category: 'raw_only_valid' },
          { domain: 'balance', category: 'below_reference' },
          { domain: 'mobility', category: 'invalid_or_missing' },
        ])
      ).toBe("This was the clearest area to build from today's Check-Up.");
    });

    it('keeps a legacy Mobility focus out of the active Strength + Balance framing', () => {
      const assessment = {
        focus: {
          kind: 'domain',
          focusDomain: 'mobility',
          planMode: 'checkup_reference_focus',
        },
        focusProvenance: { domainEvidence: [] },
      } as unknown as Parameters<typeof buildMovementProfileV2ResultsViewModel>[0]['assessment'];
      const focus = buildMovementProfileV2ResultsViewModel({ snapshot, assessment }).focus;
      expect(focus).toMatchObject({ kind: 'balanced', title: 'Balanced' });
      expect(focus.body).toContain('current programmes use Strength and Balance');
    });
  });
});

function makeArtifacts() {
  const checkUp = makeV2CheckUp();
  const snapshot = createMovementProfileV2Snapshot({
    checkUp,
    checkupType: 'baseline',
    referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'female' },
    createdAt: '2026-06-24T09:01:00.000Z',
  });
  if (!snapshot.ok) throw new Error(snapshot.reason);
  const assessment = createMovementProfileV2Assessment({
    checkUp,
    snapshot: snapshot.snapshot,
    createdAt: '2026-06-24T09:02:00.000Z',
  });
  if (!assessment.ok) throw new Error(assessment.reason);
  return { snapshot: snapshot.snapshot, assessment: assessment.assessment };
}

function makeV2CheckUp(): CheckUp {
  return {
    startedAt: '2026-06-24T09:00:00.000Z',
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, '2026-06-24T09:00:00.000Z'),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: chairResult() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: balanceResult() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: shoulderResult() },
    ],
  };
}

function chairResult(): ChairRiseV2Result {
  return {
    movementId: CHAIR_RISE_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createChairRiseV2Setup({ confirmed: true }),
    setupConfidence: 'confirmed',
    practiceRepCompleted: true,
    activeWindowMs: 30000,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 30000, valid: true, reason: 'scheduled_active_window' }],
    fullStandRule: 'stand_completed_at_or_before_window_end',
    reps: 12,
    repStats: [],
    sessionMeanVel: 1.1,
    sessionMeanPeakVel: 1.4,
    pushOffDetected: false,
    fullStandAtExpiryCounted: false,
    invalidReasons: [],
    flags: [],
    interruptions: 0,
  };
}

function balanceResult(): OneLegBalanceV2Result {
  return {
    movementId: ONE_LEG_BALANCE_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createOneLegBalanceV2Setup({ standingLeg: 'left', confirmed: true }),
    standingLeg: 'left',
    setupConfidence: 'confirmed',
    bestHoldSec: 32,
    bestTrialNumber: 1,
    validTrialCount: 3,
    attemptedTrialCount: 3,
    trials: [],
    rests: [],
    retryCount: 0,
    declinedRemainingTrials: false,
    hardCapReached: false,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 45000, valid: true, reason: 'trial_window' }],
    invalidReasons: [],
    flags: [],
    interruptions: 0,
  };
}

function shoulderResult(): ActiveShoulderReachV2Result {
  return {
    movementId: ACTIVE_SHOULDER_REACH_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createActiveShoulderReachV2Setup({ selectedSide: 'right', confirmed: true }),
    selectedSide: 'right',
    setupConfidence: 'confirmed',
    peakFlexionDeg: 151,
    retryCount: 0,
    painLimited: false,
    validTrackingMs: 5000,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 9000, valid: true, reason: 'valid_capture' }],
    invalidReasons: [],
    flags: [],
    interruptions: 0,
  };
}
