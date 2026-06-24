import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../../checkup/protocolPolicy';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../../checkup/protocolSetup';
import type { CheckUp } from '../../../checkup/types';
import type { LifeGoal, LifeGoalCategory, MovementAssessment, MovementDomain } from '../../../adherence/types';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../../movements/oneLegBalanceV2';
import type { ChairPercentileRange } from '../types';
import {
  MOVEMENT_PROFILE_V2_ASSESSMENT_KIND,
  MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION,
  MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_FINGERPRINT,
  MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_VERSION,
  MOVEMENT_PROFILE_V2_FOCUS_POLICY_FINGERPRINT,
  MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION,
  MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION,
  MOVEMENT_PROFILE_V2_LIFE_GOAL_MAPPING_FINGERPRINT,
  createMovementProfileV2Assessment,
  createMovementProfileV2Snapshot,
  deriveMovementProfileV2DomainEvidence,
  movementProfileV2AssessmentFingerprint,
  movementProfileV2AssessmentIdForSnapshot,
  movementProfileV2LifeGoalMappingFingerprint,
  movementProfileV2SnapshotFingerprint,
  normalizeMovementProfileV2LifeGoalContext,
  normalizeMovementProfileV2PriorFocusContext,
  parseMovementProfileV2Assessment,
  selectMovementProfileV2SuggestedFocus,
  type MovementProfileV2Assessment,
  type MovementProfileV2DomainEvidence,
  type MovementProfileV2LifeGoalContext,
  type MovementProfileV2PriorFocusContext,
  type StoredMovementProfileV2Snapshot,
} from '../index';

const STARTED_AT = '2026-06-23T12:00:00.000Z';
const RETEST_AT = '2026-07-23T12:00:00.000Z';
const CREATED_AT = '2026-06-23T12:08:00.000Z';
const REFERENCE_PROFILE = {
  ageAtTest: 62,
  ageBasis: 'exact_age_at_test' as const,
  referenceSex: 'female' as const,
};

describe('Movement Profile V2 assessment contract', () => {
  it('exposes independent V2 policy versions and deterministic fingerprints', () => {
    expect(MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_VERSION).toBe(1);
    expect(MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION).toBe(1);
    expect(MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION).toBe(1);
    expect(MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION).toBe(1);
    expect(MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_FINGERPRINT).toMatch(/^mpv2-domain-evidence-policy-v1-/);
    expect(MOVEMENT_PROFILE_V2_FOCUS_POLICY_FINGERPRINT).toMatch(/^mpv2-focus-policy-v1-/);
    expect(MOVEMENT_PROFILE_V2_LIFE_GOAL_MAPPING_FINGERPRINT).toBe(movementProfileV2LifeGoalMappingFingerprint());
  });

  it('derives stable domain evidence from a frozen production V2 snapshot', () => {
    const snapshot = mustCreateSnapshot(v2CheckUp({
      balance: balanceResult({ bestHoldSec: 3 }),
      shoulder: shoulderResult({ peakFlexionDeg: 120 }),
    }));

    const evidence = deriveMovementProfileV2DomainEvidence(snapshot);

    expect(evidence).toEqual([
      expect.objectContaining({
        domain: 'strength_power',
        category: 'raw_only_valid',
        evidenceSource: 'raw_only',
        focusEligible: false,
        reasons: expect.arrayContaining(['chair_warden_transform_disabled', 'raw_only_source_transform_unapproved']),
      }),
      expect.objectContaining({
        domain: 'balance',
        category: 'hale_starting_point',
        evidenceSource: 'hale_task_band',
        focusEligible: true,
        reasons: expect.arrayContaining(['balance_hale_starting_point_band', 'balance_springer_benchmark_not_focus_severity']),
      }),
      expect.objectContaining({
        domain: 'mobility',
        category: 'below_reference',
        evidenceSource: 'published_reference',
        focusEligible: true,
        reasons: expect.arrayContaining(['shoulder_below_published_middle_range']),
      }),
    ]);
    expect(JSON.stringify(evidence)).not.toMatch(/movementAge|bodyAge|weakestDomain|scoreSnapshot|MovementBlock/);
  });

  it('keeps future chair percentile evidence explicit and focus-neutral for bounded ranges', () => {
    const base = mustCreateSnapshot(v2CheckUp());

    expect(chairEvidence(base, { kind: 'below_10' })).toMatchObject({
      category: 'below_reference',
      evidenceSource: 'published_reference',
      focusEligible: true,
    });
    expect(chairEvidence(base, { kind: 'above_90' })).toMatchObject({
      category: 'above_reference_or_ceiling',
      evidenceSource: 'published_reference',
      focusEligible: false,
    });
    expect(chairEvidence(base, { kind: 'range', low: 20, high: 40 })).toMatchObject({
      category: 'raw_only_valid',
      evidenceSource: 'published_reference',
      focusEligible: false,
      reasons: expect.arrayContaining(['chair_percentile_focus_threshold_not_approved']),
    });
  });

  it('maps balance bands, pain-limited evidence, and shoulder IQR categories without benchmark arithmetic', () => {
    expect(evidenceFor({ balance: balanceResult({ bestHoldSec: 8 }) }).balance).toMatchObject({
      category: 'hale_starting_point',
      evidenceSource: 'hale_task_band',
      focusEligible: true,
    });
    expect(evidenceFor({ balance: balanceResult({ bestHoldSec: 30 }) }).balance).toMatchObject({
      category: 'hale_building',
      evidenceSource: 'hale_task_band',
      focusEligible: false,
    });
    expect(evidenceFor({ balance: balanceResult({ bestHoldSec: 45 }) }).balance).toMatchObject({
      category: 'above_reference_or_ceiling',
      evidenceSource: 'hale_task_band',
      focusEligible: false,
    });
    expect(evidenceFor({ balance: balanceResult({ evidenceStatus: 'raw_only_pain_limited' }) }).balance).toMatchObject({
      category: 'raw_only_valid',
      evidenceSource: 'raw_only',
      focusEligible: false,
    });
    expect(evidenceFor({ shoulder: shoulderResult({ peakFlexionDeg: 151 }) }).mobility).toMatchObject({
      category: 'within_reference',
      evidenceSource: 'published_reference',
    });
    expect(evidenceFor({ shoulder: shoulderResult({ peakFlexionDeg: 170 }) }).mobility).toMatchObject({
      category: 'above_reference_or_ceiling',
      evidenceSource: 'published_reference',
    });
    expect(evidenceFor({ shoulder: shoulderResult({ painLimited: true, evidenceStatus: 'raw_only_pain_limited' }) }).mobility).toMatchObject({
      category: 'raw_only_valid',
      evidenceSource: 'raw_only',
      focusEligible: false,
    });
  });

  it('freezes life-goal context from the existing product mapping and fails unsupported goals closed', () => {
    const expected: Record<LifeGoalCategory, readonly MovementDomain[]> = {
      grandchildren: ['strength_power', 'mobility'],
      stairs: ['strength_power', 'balance'],
      travel: ['strength_power', 'balance', 'mobility'],
      walking_hiking_sport: ['strength_power', 'balance'],
      gardening_hobbies: ['strength_power', 'mobility'],
      floor_confidence: ['strength_power', 'mobility'],
      carrying_loads: ['strength_power'],
      independence: ['strength_power', 'balance', 'mobility'],
      noticed_decline: ['strength_power', 'balance', 'mobility'],
      custom: ['strength_power', 'balance', 'mobility'],
    };

    for (const [category, mappedDomains] of Object.entries(expected) as [LifeGoalCategory, readonly MovementDomain[]][]) {
      expect(normalizeMovementProfileV2LifeGoalContext(goal(category))).toEqual({
        kind: 'selected',
        goalId: `goal-${category}`,
        goalCategory: category,
        mappingAdapterVersion: MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION,
        mappingFingerprint: MOVEMENT_PROFILE_V2_LIFE_GOAL_MAPPING_FINGERPRINT,
        mappedDomains,
      });
    }
    expect(normalizeMovementProfileV2LifeGoalContext(null)).toMatchObject({ kind: 'none', mappedDomains: [] });
    expect(
      normalizeMovementProfileV2LifeGoalContext({ ...goal('custom'), category: 'unsupported_goal' as LifeGoalCategory })
    ).toMatchObject({ kind: 'unknown_or_unsupported', mappedDomains: [] });
  });

  it('applies baseline focus priority without hidden numeric or strength-first tie breaks', () => {
    const belowCheckUp = v2CheckUp({
      balance: balanceResult({ bestHoldSec: 30 }),
      shoulder: shoulderResult({ peakFlexionDeg: 120 }),
    });
    const snapshot = mustCreateSnapshot(belowCheckUp);
    expect(mustAssess({ snapshot, checkUp: belowCheckUp, lifeGoal: goal('carrying_loads') }).focus).toMatchObject({
      kind: 'domain',
      focusDomain: 'mobility',
      planMode: 'checkup_reference_focus',
      reason: 'v2_focus_clear_signal_overrides_goal',
    });

    const multipleBelow = selectFromEvidence({
      domainEvidence: [
        evidence('strength_power', 'below_reference', true),
        evidence('balance', 'hale_building'),
        evidence('mobility', 'below_reference', true),
      ],
      lifeGoalContext: normalizeMovementProfileV2LifeGoalContext(goal('carrying_loads')),
    });
    expect(multipleBelow.focus).toMatchObject({
      kind: 'domain',
      focusDomain: 'strength_power',
      reason: 'v2_focus_multiple_below_goal_tiebreak',
    });

    const ambiguousBelow = selectFromEvidence({
      domainEvidence: [
        evidence('strength_power', 'below_reference', true),
        evidence('balance', 'hale_building'),
        evidence('mobility', 'below_reference', true),
      ],
      lifeGoalContext: normalizeMovementProfileV2LifeGoalContext(goal('floor_confidence')),
    });
    expect(ambiguousBelow.focus).toMatchObject({
      kind: 'balanced',
      reason: 'v2_focus_multiple_below_balanced',
      candidateDomains: ['strength_power', 'mobility'],
    });
    expect(ambiguousBelow.focus).not.toMatchObject({ focusDomain: 'strength_power' });

    const startingPoint = mustAssess({
      checkUp: v2CheckUp({ balance: balanceResult({ bestHoldSec: 8 }) }),
      lifeGoal: goal('carrying_loads'),
    });
    expect(startingPoint.focus).toMatchObject({
      kind: 'domain',
      focusDomain: 'balance',
      planMode: 'checkup_hale_band_focus',
      reason: 'v2_focus_single_hale_starting_point',
    });

    const goalLed = mustAssess({ lifeGoal: goal('carrying_loads') });
    expect(goalLed.focus).toMatchObject({
      kind: 'domain',
      focusDomain: 'strength_power',
      planMode: 'goal_led_reference_supported',
      reason: 'v2_focus_goal_led',
    });
    expect(mustAssess().focus).toMatchObject({
      kind: 'balanced',
      reason: 'v2_focus_balanced_no_unique_signal',
    });
  });

  it('returns needs-retake for invalid headline evidence and supports multi-starting-point ambiguity', () => {
    const invalid = selectFromEvidence({
      domainEvidence: [
        evidence('strength_power', 'raw_only_valid'),
        evidence('balance', 'invalid_or_missing'),
        evidence('mobility', 'within_reference'),
      ],
    });
    expect(invalid.focus).toEqual({
      kind: 'needs_retake',
      planMode: 'needs_retake',
      reason: 'v2_focus_needs_retake',
      invalidDomains: ['balance'],
    });

    const startingPointGoal = selectFromEvidence({
      domainEvidence: [
        evidence('strength_power', 'hale_starting_point', true),
        evidence('balance', 'hale_starting_point', true),
        evidence('mobility', 'within_reference'),
      ],
      lifeGoalContext: normalizeMovementProfileV2LifeGoalContext(goal('carrying_loads')),
    });
    expect(startingPointGoal.focus).toMatchObject({
      kind: 'domain',
      focusDomain: 'strength_power',
      reason: 'v2_focus_starting_point_goal_tiebreak',
    });

    const startingPointBalanced = selectFromEvidence({
      domainEvidence: [
        evidence('strength_power', 'hale_starting_point', true),
        evidence('balance', 'hale_starting_point', true),
        evidence('mobility', 'within_reference'),
      ],
    });
    expect(startingPointBalanced.focus).toMatchObject({
      kind: 'balanced',
      reason: 'v2_focus_starting_point_balanced',
      candidateDomains: ['strength_power', 'balance'],
    });
  });

  it('preserves prior V2 focus only for official retests when ambiguity remains', () => {
    const priorMobility = mustAssess({
      checkUp: v2CheckUp({ shoulder: shoulderResult({ peakFlexionDeg: 120 }) }),
    });
    const priorBalanced = mustAssess();

    expect(
      selectFromEvidence({
        sourceCheckUpType: 'official_retest',
        domainEvidence: [
          evidence('strength_power', 'below_reference', true),
          evidence('balance', 'hale_building'),
          evidence('mobility', 'below_reference', true),
        ],
        priorFocusContext: normalizeMovementProfileV2PriorFocusContext(priorMobility),
      }).focus
    ).toMatchObject({
      kind: 'domain',
      focusDomain: 'mobility',
      reason: 'v2_focus_multiple_below_preserve_current',
    });

    expect(
      selectFromEvidence({
        sourceCheckUpType: 'official_retest',
        domainEvidence: [
          evidence('strength_power', 'below_reference', true),
          evidence('balance', 'hale_building'),
          evidence('mobility', 'within_reference'),
        ],
        priorFocusContext: normalizeMovementProfileV2PriorFocusContext(priorMobility),
      }).focus
    ).toMatchObject({
      kind: 'domain',
      focusDomain: 'strength_power',
      reason: 'v2_focus_single_below_reference',
    });

    expect(
      selectFromEvidence({
        sourceCheckUpType: 'official_retest',
        domainEvidence: [
          evidence('strength_power', 'raw_only_valid'),
          evidence('balance', 'hale_building'),
          evidence('mobility', 'within_reference'),
        ],
        priorFocusContext: normalizeMovementProfileV2PriorFocusContext(priorMobility),
      }).focus
    ).toMatchObject({
      kind: 'domain',
      focusDomain: 'mobility',
      reason: 'v2_focus_preserve_current_no_clear_candidate',
    });

    expect(
      selectFromEvidence({
        sourceCheckUpType: 'official_retest',
        domainEvidence: [
          evidence('strength_power', 'raw_only_valid'),
          evidence('balance', 'hale_building'),
          evidence('mobility', 'within_reference'),
        ],
        priorFocusContext: normalizeMovementProfileV2PriorFocusContext(priorBalanced),
      }).focus
    ).toMatchObject({
      kind: 'balanced',
      reason: 'v2_focus_preserve_current_no_clear_candidate',
    });

    expect(
      selectFromEvidence({
        sourceCheckUpType: 'baseline',
        domainEvidence: [
          evidence('strength_power', 'below_reference', true),
          evidence('balance', 'hale_building'),
          evidence('mobility', 'below_reference', true),
        ],
        priorFocusContext: normalizeMovementProfileV2PriorFocusContext(priorMobility),
      }).focus
    ).toMatchObject({ kind: 'balanced', reason: 'v2_focus_multiple_below_balanced' });
  });

  it('builds a source-bound immutable assessment with stable ID, fingerprint, and complete provenance', () => {
    const checkUp = v2CheckUp();
    const snapshot = mustCreateSnapshot(checkUp);
    const beforeCheckUp = JSON.stringify(checkUp);
    const beforeSnapshot = JSON.stringify(snapshot);
    const assessment = mustAssess({ checkUp, snapshot, lifeGoal: goal('carrying_loads') });
    const same = mustAssess({ checkUp, snapshot, lifeGoal: goal('carrying_loads') });
    const changedGoal = mustAssess({ checkUp, snapshot, lifeGoal: goal('travel') });

    expect(assessment).toMatchObject({
      kind: MOVEMENT_PROFILE_V2_ASSESSMENT_KIND,
      schemaVersion: MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION,
      assessmentId: movementProfileV2AssessmentIdForSnapshot(snapshot.snapshotId),
      sourceSnapshotId: snapshot.snapshotId,
      sourceSnapshotFingerprint: snapshot.snapshotFingerprint,
      sourceCheckUpId: STARTED_AT,
      sourceCheckUpType: 'baseline',
    });
    expect(assessment.assessmentFingerprint).toBe(same.assessmentFingerprint);
    expect(changedGoal.assessmentId).toBe(assessment.assessmentId);
    expect(changedGoal.assessmentFingerprint).not.toBe(assessment.assessmentFingerprint);
    expect(parseMovementProfileV2Assessment(JSON.parse(JSON.stringify(assessment)))).toMatchObject({ ok: true });
    expect(JSON.stringify(assessment)).not.toMatch(/movementAge|bodyAge|weakestDomain|MovementBlock|trainingPlan|displayCopy/);
    expect(JSON.stringify(snapshot)).not.toMatch(/suggestedFocus|focusProvenance|movement_profile_v2_assessment/);
    expect(JSON.stringify(checkUp)).toBe(beforeCheckUp);
    expect(JSON.stringify(snapshot)).toBe(beforeSnapshot);
  });

  it('changes ID when the source snapshot changes and fingerprint when prior focus changes', () => {
    const baseline = mustAssess();
    const retestCheckUp = v2CheckUp({ startedAt: RETEST_AT });
    const retestSnapshot = mustCreateSnapshot(retestCheckUp, CREATED_AT, 'official_retest');
    const noPrior = mustAssess({
      checkUp: retestCheckUp,
      snapshot: retestSnapshot,
      checkupType: 'official_retest',
    });
    const withPrior = mustAssess({
      checkUp: retestCheckUp,
      snapshot: retestSnapshot,
      checkupType: 'official_retest',
      priorFocus: baseline,
    });

    expect(retestSnapshot.snapshotId).not.toBe(mustCreateSnapshot(v2CheckUp()).snapshotId);
    expect(noPrior.assessmentId).toBe(withPrior.assessmentId);
    expect(noPrior.assessmentFingerprint).not.toBe(withPrior.assessmentFingerprint);
    expect(noPrior.assessmentId).not.toBe(baseline.assessmentId);
  });

  it('fails closed for source mismatch, incomplete raw snapshots, malformed snapshots, and future assessments', () => {
    const checkUp = v2CheckUp();
    const snapshot = mustCreateSnapshot(checkUp);
    const mismatched = createMovementProfileV2Assessment({
      checkUp: v2CheckUp({ chair: chairResult({ reps: 13 }) }),
      snapshot,
      createdAt: CREATED_AT,
    });
    expect(mismatched).toMatchObject({ ok: false, reason: 'v2_assessment_source_mismatch' });

    const incompleteSnapshot = rawIncompleteSnapshot(snapshot);
    expect(createMovementProfileV2Assessment({ checkUp, snapshot: incompleteSnapshot, createdAt: CREATED_AT })).toMatchObject({
      ok: false,
      reason: 'v2_assessment_raw_incomplete',
    });
    expect(createMovementProfileV2Assessment({ checkUp, snapshot: { kind: 'legacy' }, createdAt: CREATED_AT })).toMatchObject({
      ok: false,
      reason: 'v2_assessment_snapshot_invalid',
    });
    expect(parseMovementProfileV2Assessment({ ...mustAssess(), schemaVersion: 2 })).toMatchObject({
      ok: false,
      diagnostic: { code: 'v2_assessment_future_schema' },
    });
  });

  it('creates assessments from usable raw-only evidence while keeping reference claims separate', () => {
    const lowBalanceCheckUp = v2CheckUp({
      balance: balanceResult({
        evidenceStatus: 'raw_only_protocol_incomplete',
        bestHoldSec: 2,
        validTrialCount: 1,
        attemptedTrialCount: 1,
      }),
    });
    const lowBalanceSnapshot = mustCreateSnapshot(lowBalanceCheckUp);

    expect(lowBalanceSnapshot.interpretation.rawCompleteness).toMatchObject({
      referenceComplete: true,
      missingHeadlineMovementIds: [],
      evidenceStatusByMovementId: {
        [ONE_LEG_BALANCE_V2_ID]: 'raw_only_protocol_incomplete',
      },
    });
    expect(lowBalanceSnapshot.interpretation.balance).toMatchObject({
      claimEligibility: 'raw_only_protocol_incomplete',
      taskBand: 'starting_point_low',
    });

    const lowBalanceAssessment = createMovementProfileV2Assessment({
      checkUp: lowBalanceCheckUp,
      snapshot: lowBalanceSnapshot,
      createdAt: CREATED_AT,
    });
    expect(lowBalanceAssessment).toMatchObject({
      ok: true,
      assessment: {
        focus: {
          kind: 'domain',
          focusDomain: 'balance',
          reason: 'v2_focus_single_hale_starting_point',
        },
      },
    });

    const rawOnlyBalancedCheckUp = v2CheckUp({
      chair: chairResult({ evidenceStatus: 'raw_only_setup_uncertain' }),
      balance: balanceResult({
        evidenceStatus: 'raw_only_protocol_incomplete',
        bestHoldSec: 30,
      }),
      shoulder: shoulderResult({
        evidenceStatus: 'raw_only_tracking_uncertain',
        peakFlexionDeg: 151,
      }),
    });
    const rawOnlyBalancedSnapshot = mustCreateSnapshot(rawOnlyBalancedCheckUp);
    const rawOnlyBalancedAssessment = createMovementProfileV2Assessment({
      checkUp: rawOnlyBalancedCheckUp,
      snapshot: rawOnlyBalancedSnapshot,
      createdAt: CREATED_AT,
    });

    expect(rawOnlyBalancedSnapshot.interpretation.rawCompleteness.referenceComplete).toBe(true);
    expect(rawOnlyBalancedAssessment).toMatchObject({
      ok: true,
      assessment: {
        focus: {
          kind: 'balanced',
          reason: 'v2_focus_balanced_no_unique_signal',
        },
      },
    });
  });

  it('strictly parses focus/provenance cross-field compatibility', () => {
    const valid = mustAssess({ lifeGoal: goal('carrying_loads') });
    expect(parseMovementProfileV2Assessment(valid)).toMatchObject({ ok: true });
    expect(parseMovementProfileV2Assessment({ ...valid, assessmentFingerprint: 'wrong' })).toMatchObject({
      ok: false,
      diagnostic: { code: 'v2_assessment_fingerprint_invalid' },
    });
    expect(parseMovementProfileV2Assessment({ ...valid, movementAge: 72 })).toMatchObject({
      ok: false,
      diagnostic: { code: 'v2_assessment_malformed' },
    });
    expect(
      parseMovementProfileV2Assessment(refingerprint(malformedAssessment({
        ...valid,
        focusProvenance: { ...valid.focusProvenance, focusPolicyVersion: 999 },
      })))
    ).toMatchObject({ ok: false, diagnostic: { code: 'v2_assessment_malformed' } });
    expect(
      parseMovementProfileV2Assessment(refingerprint(malformedAssessment({
        ...valid,
        focus: { ...valid.focus, planMode: 'checkup_reference_focus' },
      })))
    ).toMatchObject({ ok: false, diagnostic: { code: 'v2_assessment_malformed' } });
    expect(
      parseMovementProfileV2Assessment(refingerprint(malformedAssessment({
        ...valid,
        focus: { ...valid.focus, focusDomain: 'balance' },
      })))
    ).toMatchObject({ ok: false, diagnostic: { code: 'v2_assessment_malformed' } });
    expect(
      parseMovementProfileV2Assessment(refingerprint(malformedAssessment({
        ...valid,
        focus: { ...valid.focus, kind: 'balanced', planMode: 'balanced_insufficient_reference', focusDomain: 'strength_power' },
      })))
    ).toMatchObject({ ok: false, diagnostic: { code: 'v2_assessment_malformed' } });

    const rawOnlyAsBelow = refingerprint({
      ...valid,
      focusProvenance: {
        ...valid.focusProvenance,
        domainEvidence: valid.focusProvenance.domainEvidence.map((item) =>
          item.domain === 'strength_power'
            ? { ...item, category: 'below_reference' as const, evidenceSource: 'raw_only' as const }
            : item
        ),
      },
    });
    expect(parseMovementProfileV2Assessment(rawOnlyAsBelow)).toMatchObject({
      ok: false,
      diagnostic: { code: 'v2_assessment_malformed' },
    });
  });

  it('keeps V1 assessments out of V2 prior-focus normalization and parsing', () => {
    const legacy: MovementAssessment = {
      id: 'assessment-legacy',
      userId: 'local-device-user',
      type: 'official_retest',
      status: 'completed',
      createdAt: CREATED_AT,
      completedAt: CREATED_AT,
      isOfficialForProgress: true,
      results: {
        weakestDomain: 'balance',
        rawMetrics: {
          focusSelectionPolicyVersion: 1,
        },
      },
    };

    expect(normalizeMovementProfileV2PriorFocusContext(legacy)).toEqual({ kind: 'none' });
    expect(
      normalizeMovementProfileV2PriorFocusContext({
        kind: 'domain',
        focusDomain: 'balance',
        sourceAssessmentId: 'assessment-legacy',
        sourceAssessmentFingerprint: 'legacy-fingerprint',
      })
    ).toEqual({ kind: 'none' });
    expect(parseMovementProfileV2Assessment(legacy)).toMatchObject({
      ok: false,
      diagnostic: { code: 'v2_assessment_malformed' },
    });
  });
});

function evidenceFor(overrides: {
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
}): Record<MovementDomain, MovementProfileV2DomainEvidence> {
  const snapshot = mustCreateSnapshot(v2CheckUp(overrides));
  return Object.fromEntries(deriveMovementProfileV2DomainEvidence(snapshot).map((item) => [item.domain, item])) as Record<
    MovementDomain,
    MovementProfileV2DomainEvidence
  >;
}

function chairEvidence(snapshot: StoredMovementProfileV2Snapshot, percentileRange: ChairPercentileRange): MovementProfileV2DomainEvidence {
  const next = futureChairSnapshot(snapshot, percentileRange);
  return deriveMovementProfileV2DomainEvidence(next)[0];
}

function futureChairSnapshot(
  snapshot: StoredMovementProfileV2Snapshot,
  percentileRange: ChairPercentileRange
): StoredMovementProfileV2Snapshot {
  return {
    ...snapshot,
    interpretation: {
      ...snapshot.interpretation,
      chair: {
        ...snapshot.interpretation.chair,
        resultKind: 'percentile_range',
        claimEligibility: 'reference_eligible',
        eligibilityReasons: ['reference_eligible'],
        transformation: {
          ...snapshot.interpretation.chair.transformation,
          enabled: true,
          productCreated: true,
        },
        percentileRange,
      },
    },
  };
}

function rawIncompleteSnapshot(snapshot: StoredMovementProfileV2Snapshot): StoredMovementProfileV2Snapshot {
  const next: StoredMovementProfileV2Snapshot = {
    ...snapshot,
    interpretation: {
      ...snapshot.interpretation,
      rawCompleteness: {
        ...snapshot.interpretation.rawCompleteness,
        referenceComplete: false,
        missingHeadlineMovementIds: [CHAIR_RISE_V2_ID],
      },
    },
  };
  return {
    ...next,
    snapshotFingerprint: movementProfileV2SnapshotFingerprint(next),
  };
}

function mustAssess({
  checkUp = v2CheckUp(),
  snapshot,
  checkupType = 'baseline',
  lifeGoal,
  priorFocus,
}: {
  checkUp?: CheckUp;
  snapshot?: StoredMovementProfileV2Snapshot;
  checkupType?: 'baseline' | 'baseline_retake' | 'official_retest';
  lifeGoal?: LifeGoal | null;
  priorFocus?: unknown;
} = {}): MovementProfileV2Assessment {
  const sourceSnapshot = snapshot ?? mustCreateSnapshot(checkUp, CREATED_AT, checkupType);
  const created = createMovementProfileV2Assessment({
    checkUp,
    snapshot: sourceSnapshot,
    lifeGoal,
    priorFocus,
    createdAt: CREATED_AT,
  });
  if (!created.ok) throw new Error(`assessment was not created: ${created.reason}`);
  return created.assessment;
}

function mustCreateSnapshot(
  checkUp: CheckUp,
  createdAt = CREATED_AT,
  checkupType: 'baseline' | 'baseline_retake' | 'official_retest' = 'baseline'
): StoredMovementProfileV2Snapshot {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType,
    referenceProfile: REFERENCE_PROFILE,
    createdAt,
  });
  if (!created.ok) throw new Error(`snapshot was not created: ${created.reason}`);
  return created.snapshot;
}

function selectFromEvidence({
  sourceCheckUpType = 'baseline',
  domainEvidence,
  lifeGoalContext = normalizeMovementProfileV2LifeGoalContext(null),
  priorFocusContext = { kind: 'none' },
}: {
  sourceCheckUpType?: 'baseline' | 'baseline_retake' | 'official_retest';
  domainEvidence: readonly MovementProfileV2DomainEvidence[];
  lifeGoalContext?: MovementProfileV2LifeGoalContext;
  priorFocusContext?: MovementProfileV2PriorFocusContext;
}) {
  return selectMovementProfileV2SuggestedFocus({
    sourceSnapshotId: 'movement-profile-v2-snapshot:test',
    sourceSnapshotFingerprint: 'mpv2-snapshot-v1-test',
    sourceCheckUpId: STARTED_AT,
    sourceCheckUpType,
    domainEvidence,
    lifeGoalContext,
    priorFocusContext,
  });
}

function evidence(
  domain: MovementDomain,
  category: MovementProfileV2DomainEvidence['category'],
  focusEligible = false
): MovementProfileV2DomainEvidence {
  return {
    domain,
    category,
    evidenceSource:
      category === 'below_reference' || category === 'within_reference' || category === 'above_reference_or_ceiling'
        ? 'published_reference'
        : category === 'hale_starting_point' || category === 'hale_building'
          ? 'hale_task_band'
          : category === 'invalid_or_missing'
            ? 'invalid'
            : 'raw_only',
    sourceResultKind: category === 'invalid_or_missing' ? 'missing' : 'test_result',
    claimEligibility: category === 'invalid_or_missing' ? 'invalid_measurement' : 'reference_eligible',
    focusEligible,
    reasons: [`test_${domain}_${category}`],
  };
}

function goal(category: LifeGoalCategory): LifeGoal {
  return {
    id: `goal-${category}`,
    userId: 'local-device-user',
    category,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    isPrimary: true,
  };
}

function refingerprint(assessment: MovementProfileV2Assessment): MovementProfileV2Assessment {
  return {
    ...assessment,
    assessmentFingerprint: movementProfileV2AssessmentFingerprint(assessment),
  };
}

function malformedAssessment(value: unknown): MovementProfileV2Assessment {
  return value as MovementProfileV2Assessment;
}

function v2CheckUp(overrides: {
  startedAt?: string;
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
} = {}): CheckUp {
  const startedAt = overrides.startedAt ?? STARTED_AT;
  return {
    startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, startedAt),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: overrides.chair ?? chairResult() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: overrides.balance ?? balanceResult() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: overrides.shoulder ?? shoulderResult() },
    ],
  };
}

function chairResult(overrides: Partial<ChairRiseV2Result> = {}): ChairRiseV2Result {
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
    ...overrides,
  };
}

function balanceResult(overrides: Partial<OneLegBalanceV2Result> = {}): OneLegBalanceV2Result {
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
    ...overrides,
  };
}

function shoulderResult(overrides: Partial<ActiveShoulderReachV2Result> = {}): ActiveShoulderReachV2Result {
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
    ...overrides,
  };
}
