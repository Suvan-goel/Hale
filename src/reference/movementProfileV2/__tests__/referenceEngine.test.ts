import fs from 'fs';
import path from 'path';
import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../../checkup/protocolPolicy';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../../checkup/protocolSetup';
import type { CheckUp } from '../../../checkup/types';
import { DEFAULT_BATTERY } from '../../../checkup/checkup';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../../movements/chairRiseV2';
import {
  BALANCE_EYES_OPEN_V2_ID,
  type BalanceEyesOpenV2Result,
} from '../../../movements/balanceEyesOpenV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../../movements/oneLegBalanceV2';
import { createCapturedBalanceEyesOpenV2Result } from '../../../movementProfileV2/internalCheckupFlow';
import {
  type ApprovedChairPercentileTransform,
  balanceTaskBand,
  buildChairPercentileRange,
  createReferenceTransformations,
  GILL_2020_SHOULDER_FLEXION_IQR_ROWS,
  interpretMovementProfileV2,
  movementProfileV2SourceSetFingerprint,
  REFERENCE_SOURCES,
  REFERENCE_TRANSFORMATIONS,
  SPRINGER_2007_BALANCE_BENCHMARKS,
  validateBalanceBenchmarkTable,
  validateGillShoulderTable,
} from '../index';

describe('Movement Profile V2 reference engine', () => {
  it('normalizes valid V2 raw results into raw-first domain interpretations', () => {
    const result = interpretMovementProfileV2({
      checkUp: v2CheckUp(),
      referenceProfile: {
        ageAtTest: 62,
        ageBasis: 'exact_age_at_test',
        referenceSex: 'female',
      },
    });

    expect(result.protocolSupported).toBe(true);
    expect(result.rawCompleteness.referenceComplete).toBe(true);
    expect(result.chair.rawMetric).toMatchObject({ metricId: 'chair_rises_30s', value: 12 });
    expect(result.chair.claimEligibility).toBe('raw_only_source_transform_unapproved');
    expect(result.chair.percentileRange).toBeNull();
    expect(result.balance.taskBand).toBe('building');
    expect(result.balance.sourceBenchmark).toMatchObject({
      sourceAgeGroupId: 'springer_60_69',
      meanBestOfThreeSeconds: 32.1,
      measuredSeconds: 32,
      trialCeilingSeconds: 45,
    });
    expect(result.shoulder.iqr).toMatchObject({
      sourceAgeGroupId: 'gill_60_64',
      referenceSex: 'female',
      side: 'right',
      q1Degrees: 140,
      medianDegrees: 150,
      q3Degrees: 163,
      measuredDegrees: 151,
      category: 'within_published_middle_range',
    });
    expect(JSON.stringify(result)).not.toMatch(/movementAge|weakestDomain|scoreSnapshot|CheckUpScore/);
  });

  it('fails locally when one domain lacks profile fields', () => {
    const result = interpretMovementProfileV2({
      checkUp: v2CheckUp(),
      referenceProfile: {
        ageAtTest: 62,
        ageBasis: 'exact_age_at_test',
        referenceSex: 'prefer_not_to_say',
      },
    });

    expect(result.chair.claimEligibility).toBe('raw_only_profile_incomplete');
    expect(result.balance.claimEligibility).toBe('reference_eligible');
    expect(result.balance.sourceBenchmark?.sourceAgeGroupId).toBe('springer_60_69');
    expect(result.shoulder.claimEligibility).toBe('raw_only_profile_incomplete');
    expect(result.shoulder.rawMetric?.value).toBe(151);
  });

  it('treats age-group-only labels as source-specific rather than exact age', () => {
    const balanceGrouped = interpretMovementProfileV2({
      checkUp: v2CheckUp(),
      referenceProfile: {
        ageBasis: 'age_group_only',
        ageGroupLabel: 'springer_70_79',
        referenceSex: 'female',
      },
    });
    expect(balanceGrouped.chair.claimEligibility).toBe('raw_only_profile_incomplete');
    expect(balanceGrouped.balance.sourceBenchmark?.sourceAgeGroupId).toBe('springer_70_79');
    expect(balanceGrouped.shoulder.claimEligibility).toBe('raw_only_outside_reference_age');

    const shoulderGrouped = interpretMovementProfileV2({
      checkUp: v2CheckUp(),
      referenceProfile: {
        ageBasis: 'age_group_only',
        ageGroupLabel: 'gill_60_64',
        referenceSex: 'female',
      },
    });
    expect(shoulderGrouped.balance.claimEligibility).toBe('raw_only_outside_reference_age');
    expect(shoulderGrouped.shoulder.iqr?.sourceAgeGroupId).toBe('gill_60_64');
  });

  it('does not let legacy representative age bands masquerade as exact age', () => {
    const result = interpretMovementProfileV2({
      checkUp: v2CheckUp(),
      referenceProfile: {
        ageAtTest: 62,
        ageBasis: 'legacy_age_band_representative',
        referenceSex: 'female',
      },
    });

    expect(result.chair.claimEligibility).toBe('raw_only_profile_incomplete');
    expect(result.balance.claimEligibility).toBe('raw_only_outside_reference_age');
    expect(result.shoulder.claimEligibility).toBe('raw_only_outside_reference_age');
  });

  it('keeps other domains when one raw metric is invalid or pain-limited', () => {
    const result = interpretMovementProfileV2({
      checkUp: v2CheckUp({
        balance: balanceResult({ bestHoldSec: 46 }),
        shoulder: shoulderResult({
          evidenceStatus: 'raw_only_pain_limited',
          painLimited: true,
        }),
      }),
      referenceProfile: {
        ageAtTest: 62,
        ageBasis: 'exact_age_at_test',
        referenceSex: 'female',
      },
    });

    expect(result.chair.rawMetric?.value).toBe(12);
    expect(result.balance.rawMetric).toBeNull();
    expect(result.balance.claimEligibility).toBe('invalid_measurement');
    expect(result.shoulder.rawMetric?.value).toBe(151);
    expect(result.shoulder.claimEligibility).toBe('raw_only_pain_limited');
  });

  it('keeps eyes-open balance V2 raw-only without using old 45-second scoring', () => {
    const result = interpretMovementProfileV2({
      checkUp: v2CheckUp({
        balance: createCapturedBalanceEyesOpenV2Result({
          standingLeg: 'right',
          stageDurationsMs: [10000, 6500],
        }),
      }),
      referenceProfile: {
        ageAtTest: 62,
        ageBasis: 'exact_age_at_test',
        referenceSex: 'female',
      },
    });

    expect(result.rawCompleteness.referenceComplete).toBe(true);
    expect(result.balance).toMatchObject({
      movementId: BALANCE_EYES_OPEN_V2_ID,
      resultKind: 'raw_only',
      taskBand: null,
      sourceBenchmark: null,
      claimEligibility: 'raw_only_reference_unavailable',
      selectedStandingLeg: 'right',
    });
    expect(result.balance.rawMetric).toMatchObject({
      metricId: 'balance_eyes_open_total',
      value: 16.5,
      completedStageCount: 1,
      totalCapSeconds: 42,
    });
  });

  it('keeps current reference claims but marks changed side and leg non-comparable longitudinally', () => {
    const result = interpretMovementProfileV2({
      checkUp: v2CheckUp({
        balance: balanceResult({
          setup: createOneLegBalanceV2Setup({
            standingLeg: 'right',
            confirmed: true,
            priorStandingLeg: 'left',
          }),
          standingLeg: 'right',
        }),
        shoulder: shoulderResult({
          setup: createActiveShoulderReachV2Setup({
            selectedSide: 'left',
            confirmed: true,
            priorSelectedSide: 'right',
          }),
          selectedSide: 'left',
          peakFlexionDeg: 145,
        }),
      }),
      referenceProfile: {
        ageAtTest: 62,
        ageBasis: 'exact_age_at_test',
        referenceSex: 'female',
      },
    });

    expect(result.balance.claimEligibility).toBe('reference_eligible');
    expect(result.balance.longitudinalComparableToPrior).toBe(false);
    expect(result.shoulder.claimEligibility).toBe('reference_eligible');
    expect(result.shoulder.longitudinalComparableToPrior).toBe(false);
  });

  it('returns a typed unsupported result for non-V2 records', () => {
    const result = interpretMovementProfileV2({
      checkUp: {
        startedAt: STARTED_AT,
        bodyUnit: 1,
        items: [],
      },
      referenceProfile: {
        ageAtTest: 62,
        ageBasis: 'exact_age_at_test',
        referenceSex: 'female',
      },
    });

    expect(result.protocolSupported).toBe(false);
    expect(result.unsupportedReason).toBe('unsupported_checkup_protocol');
    expect(result.chair.rawMetric).toBeNull();
    expect(result.balance.rawMetric).toBeNull();
    expect(result.shoulder.rawMetric).toBeNull();
  });
});

describe('Movement Profile V2 balance references', () => {
  it.each([
    [0, 'starting_point_low'],
    [4.999, 'starting_point_low'],
    [5, 'starting_point'],
    [19.999, 'starting_point'],
    [20, 'building'],
    [44.999, 'building'],
    [45, 'ceiling_complete'],
    [45.001, null],
    [-0.001, null],
    [Number.NaN, null],
    [Number.POSITIVE_INFINITY, null],
  ] as const)('maps %s seconds to %s', (seconds, expected) => {
    expect(balanceTaskBand(seconds)).toBe(expected);
  });

  it('stores only verified total eyes-open best-of-three Springer means', () => {
    expect(validateBalanceBenchmarkTable()).toEqual([]);
    expect(SPRINGER_2007_BALANCE_BENCHMARKS.map((row) => [row.sourceAgeGroupId, row.meanBestOfThreeSeconds])).toEqual([
      ['springer_18_39', 44.7],
      ['springer_40_49', 41.9],
      ['springer_50_59', 41.2],
      ['springer_60_69', 32.1],
      ['springer_70_79', 21.5],
      ['springer_80_99', 9.4],
    ]);
  });
});

describe('Movement Profile V2 shoulder references', () => {
  it('keeps Gill active flexion IQR rows complete and plausible', () => {
    expect(validateGillShoulderTable()).toEqual([]);
    expect(GILL_2020_SHOULDER_FLEXION_IQR_ROWS).toHaveLength(56);
    expect(
      GILL_2020_SHOULDER_FLEXION_IQR_ROWS.find(
        (row) => row.sourceAgeGroupId === 'gill_60_64' && row.referenceSex === 'female' && row.side === 'right'
      )
    ).toMatchObject({ q1Degrees: 140, medianDegrees: 150, q3Degrees: 163 });
    expect(
      GILL_2020_SHOULDER_FLEXION_IQR_ROWS.find(
        (row) => row.sourceAgeGroupId === 'gill_85_plus' && row.referenceSex === 'male' && row.side === 'left'
      )
    ).toMatchObject({ q1Degrees: 112, medianDegrees: 136.1, q3Degrees: 150 });
  });
});

describe('Movement Profile V2 chair transform gate', () => {
  it('structures approved percentile ranges without exposing exact percentiles', () => {
    const provider = fakeChairProvider([47, 52, 54]);
    expect(
      buildChairPercentileRange({
        repetitions: 12,
        ageAtTest: 62,
        referenceSex: 'female',
        provider,
      })
    ).toEqual({ kind: 'range', low: 40, high: 60 });
  });

  it('handles lower and upper percentile boundaries', () => {
    expect(buildChairPercentileRange({ repetitions: 1, ageAtTest: 62, referenceSex: 'female', provider: fakeChairProvider([1, 4, 8]) })).toEqual({
      kind: 'below_10',
    });
    expect(buildChairPercentileRange({ repetitions: 30, ageAtTest: 62, referenceSex: 'female', provider: fakeChairProvider([91, 94, 97]) })).toEqual({
      kind: 'above_90',
    });
  });

  it('requires explicit enabled transformation, matching fingerprints, and approval', () => {
    const defaultResult = interpretMovementProfileV2({
      checkUp: v2CheckUp(),
      referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'female' },
    });
    expect(defaultResult.chair.claimEligibility).toBe('raw_only_source_transform_unapproved');

    const transformations = createReferenceTransformations({
      chairPercentileEnabled: true,
      chairApprovalId: 'unit-test-approved-transform',
    });
    const warden = REFERENCE_SOURCES.find((source) => source.sourceId === 'warden_2022_30s_sts')!;
    const chairTransform = transformations.find(
      (transformation) => transformation.transformationId === 'chair_percentile_range_v1_pending_transform'
    )!;
    const approvedProvider = fakeChairProvider([47, 52, 54], {
      sourceFingerprint: warden.sourceFingerprint,
      transformationFingerprint: chairTransform.transformationFingerprint,
      approvalId: 'unit-test-approved-transform',
    });
    const approvedResult = interpretMovementProfileV2(
      {
        checkUp: v2CheckUp(),
        referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'female' },
      },
      { transformations, chairPercentileTransform: approvedProvider }
    );
    expect(approvedResult.chair.claimEligibility).toBe('reference_eligible');
    expect(approvedResult.chair.percentileRange).toEqual({ kind: 'range', low: 40, high: 60 });

    const wrongProvider = { ...approvedProvider, sourceFingerprint: 'wrong' };
    const wrongResult = interpretMovementProfileV2(
      {
        checkUp: v2CheckUp(),
        referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'female' },
      },
      { transformations, chairPercentileTransform: wrongProvider }
    );
    expect(wrongResult.chair.claimEligibility).toBe('raw_only_source_transform_unapproved');
    expect(wrongResult.chair.percentileRange).toBeNull();
  });
});

describe('Movement Profile V2 source-set integrity', () => {
  it('fingerprints are deterministic and change when transform state changes', () => {
    const defaultFingerprint = movementProfileV2SourceSetFingerprint();
    expect(movementProfileV2SourceSetFingerprint()).toBe(defaultFingerprint);
    expect(
      movementProfileV2SourceSetFingerprint(
        REFERENCE_SOURCES,
        createReferenceTransformations({ chairPercentileEnabled: true, chairApprovalId: 'unit-test-approved-transform' })
      )
    ).not.toBe(defaultFingerprint);
  });

  it('fails reference claims closed when source identity is corrupted', () => {
    const corruptedSources = REFERENCE_SOURCES.map((source) =>
      source.sourceId === 'gill_2020_active_shoulder_flexion'
        ? { ...source, sourceDataFingerprint: 'corrupted-source-data' }
        : source
    );
    const result = interpretMovementProfileV2(
      {
        checkUp: v2CheckUp(),
        referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'female' },
      },
      { sources: corruptedSources }
    );

    expect(result.shoulder.claimEligibility).toBe('raw_only_reference_unavailable');
    expect(result.shoulder.iqr).toBeNull();
    expect(result.shoulder.rawMetric?.value).toBe(151);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('reference_source_fingerprint_mismatch');
  });

  it('does not import V1 norms or wire the engine into public V1 surfaces', () => {
    const referenceDir = path.resolve(__dirname, '..');
    const referenceFiles = walk(referenceDir).filter((file) => file.endsWith('.ts') && !file.includes(`${path.sep}__tests__${path.sep}`));
    for (const file of referenceFiles) {
      const contents = fs.readFileSync(file, 'utf8');
      expect(contents).not.toMatch(/scoring\/norms|inferAge|scoreCheckUp|focusSelection|MovementBlock|ScoreSnapshot/);
    }
    expect(DEFAULT_BATTERY).toEqual(['chair-stand-30s', 'balance-ladder', 'shoulder-flexion-peak', 'hinge-reach']);
    for (const appFile of ['src/screens/CheckUpScreen.tsx', 'src/screens/OnboardingResultsScreen.tsx', 'src/screens/ProgressScreen.tsx']) {
      expect(fs.readFileSync(path.resolve(process.cwd(), appFile), 'utf8')).not.toContain('interpretMovementProfileV2');
    }
  });
});

const STARTED_AT = '2026-06-23T12:00:00.000Z';

function v2CheckUp(overrides: {
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result | BalanceEyesOpenV2Result;
  shoulder?: ActiveShoulderReachV2Result;
} = {}): CheckUp {
  const chair = overrides.chair ?? chairResult();
  const balance = overrides.balance ?? balanceResult();
  const shoulder = overrides.shoulder ?? shoulderResult();
  return {
    startedAt: STARTED_AT,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, STARTED_AT),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: chair },
      { movementId: balance.movementId, status: 'measured', result: balance },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: shoulder },
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

function fakeChairProvider(
  percentiles: readonly number[],
  identity: Partial<ApprovedChairPercentileTransform> = {}
): ApprovedChairPercentileTransform {
  let index = 0;
  return {
    sourceId: 'warden_2022_30s_sts',
    sourceFingerprint: identity.sourceFingerprint ?? 'test-source',
    transformationId: 'chair_percentile_range_v1_pending_transform',
    transformationFingerprint: identity.transformationFingerprint ?? 'test-transform',
    approvalId: identity.approvalId ?? 'test-approval',
    percentileFor: identity.percentileFor ?? (() => percentiles[Math.min(index++, percentiles.length - 1)] ?? null),
  };
}

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
