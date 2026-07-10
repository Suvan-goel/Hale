import {
  CLARITY_INSTRUMENTS_SCHEMA_VERSION,
  PAIRED_CLARITY_RESULT_SCHEMA_VERSION,
  computeDualTaskCostPercent,
  dualTaskReadingValue,
  pairedClarityReadingValue,
  validClarityInstruments,
  validPairedClarityResult,
  type DualTaskResult,
  type PairedClarityProtocolRecord,
  type PairedClarityResponseProtocolRecord,
  type PairedClarityResultRecord,
} from '../clarityInstruments';

const measured = (overrides: Partial<DualTaskResult> = {}): DualTaskResult => ({
  schemaVersion: 1,
  movementId: 'one-leg-balance-45s-v2',
  status: 'measured',
  singleTaskSeconds: 30,
  dualTaskSeconds: 21,
  costPercent: 30,
  speechActiveMs: 12000,
  ...overrides,
});

const pairedProtocol: PairedClarityProtocolRecord = {
  protocolId: 'pearl_paired_clarity_balance_v1',
  protocolVersion: 1,
  movementId: 'one-leg-balance-45s-v2',
  stanceId: 'single_leg_eyes_open_v1',
  standingSide: 'left',
  order: 'solo_then_dual',
  trialCapMs: 45000,
  standardizedRestMs: 30000,
  liftConfirmMs: 150,
  touchdownDebounceFrames: 4,
  trackingLossConfirmFrames: 4,
  validityPolicy: {
    minSoloHoldMs: 10000,
    ceilingExclusionMarginMs: 0,
    minCognitiveAttempts: 4,
    minCognitiveResponses: 1,
    minCognitiveAccuracy: 0.6,
  },
};

const pairedResponseProtocol: PairedClarityResponseProtocolRecord = {
  protocolId: 'pearl_visual_go_no_go_v1',
  protocolVersion: 1,
  sequenceAlgorithmId: 'fixed_balanced_forms_v1',
  sequenceSeedId: 'pearl_vgng_form_a_v1',
  responseSignal: 'speech_presence_boolean',
  responseRule: 'respond_on_target_only',
  leadInMs: 750,
  promptVisibleMs: 600,
  responseWindowMs: 1500,
  promptCadenceMs: 2400,
  promptCount: 19,
  minimumPresentedCount: 4,
};

type MeasuredPairedClarity = Extract<PairedClarityResultRecord, { status: 'measured' }>;

function pairedMeasured(): MeasuredPairedClarity {
  return {
    schemaVersion: PAIRED_CLARITY_RESULT_SCHEMA_VERSION,
    status: 'measured',
    protocol: pairedProtocol,
    responseProtocol: pairedResponseProtocol,
    solo: { kind: 'solo', durationMs: 10000, durationSec: 10, termination: 'touchdown' },
    dual: { kind: 'dual', durationMs: 12000, durationSec: 12, termination: 'touchdown' },
    cognitive: { attempts: 5, responses: 2, correct: 4, errors: 1 },
    motorCostPercent: -20,
    ceilingLimited: false,
  };
}

describe('dual-task cost (CLARITY_INSTRUMENTS_TDD §4.2)', () => {
  it('computes within-session % degradation', () => {
    expect(computeDualTaskCostPercent({ singleTaskSeconds: 30, dualTaskSeconds: 21 })).toBe(30);
    expect(computeDualTaskCostPercent({ singleTaskSeconds: 45, dualTaskSeconds: 45 })).toBe(0);
  });

  it('keeps negative cost — better under load is real, never floored', () => {
    expect(computeDualTaskCostPercent({ singleTaskSeconds: 20, dualTaskSeconds: 24 })).toBe(-20);
  });

  it('refuses to fabricate: invalid single-task input throws (callers gate first)', () => {
    expect(() => computeDualTaskCostPercent({ singleTaskSeconds: 0, dualTaskSeconds: 10 })).toThrow();
    expect(() => computeDualTaskCostPercent({ singleTaskSeconds: NaN, dualTaskSeconds: 10 })).toThrow();
    expect(() => computeDualTaskCostPercent({ singleTaskSeconds: 30, dualTaskSeconds: NaN })).toThrow();
  });

  it('trend reading inverts cost (higher = clearer) and only exists for measured runs', () => {
    expect(dualTaskReadingValue(measured())).toBe(70);
    expect(dualTaskReadingValue(measured({ costPercent: -10 }))).toBe(110);
    expect(dualTaskReadingValue(measured({ status: 'invalid', invalidReason: 'no_speech_detected' }))).toBeNull();
    expect(dualTaskReadingValue(measured({ status: 'skipped' }))).toBeNull();
    expect(dualTaskReadingValue(undefined)).toBeNull();
  });
});

describe('clarityInstruments defensive parse (boundary rules mirror selfReport)', () => {
  it('round-trips a coherent record, including ceilingLimited honesty (F2)', () => {
    const record = {
      schemaVersion: CLARITY_INSTRUMENTS_SCHEMA_VERSION,
      dualTask: measured({ ceilingLimited: true, costPercent: 0, dualTaskSeconds: 45, singleTaskSeconds: 45 }),
    };
    expect(validClarityInstruments(record)).toEqual(record);
  });

  it('keeps honest non-measured statuses without measurement fields', () => {
    for (const status of ['skipped', 'unavailable'] as const) {
      const parsed = validClarityInstruments({
        schemaVersion: 1,
        dualTask: { schemaVersion: 1, movementId: 'one-leg-balance-45s-v2', status },
      });
      expect(parsed?.dualTask?.status).toBe(status);
      expect(parsed?.dualTask?.costPercent).toBeUndefined();
    }
    const invalid = validClarityInstruments({
      schemaVersion: 1,
      dualTask: {
        schemaVersion: 1,
        movementId: 'one-leg-balance-45s-v2',
        status: 'invalid',
        invalidReason: 'no_speech_detected',
      },
    });
    expect(invalid?.dualTask?.invalidReason).toBe('no_speech_detected');
  });

  it('drops half-records and garbage as a unit — never a fabricated measurement', () => {
    expect(validClarityInstruments(undefined)).toBeUndefined();
    expect(validClarityInstruments({ schemaVersion: 99 })).toBeUndefined();
    // 'measured' without a coherent measurement drops.
    expect(
      validClarityInstruments({
        schemaVersion: 1,
        dualTask: { schemaVersion: 1, movementId: 'one-leg-balance-45s-v2', status: 'measured' },
      })
    ).toBeUndefined();
    expect(
      validClarityInstruments({
        schemaVersion: 1,
        dualTask: measured({ costPercent: Number.NaN }),
      })
    ).toBeUndefined();
    // No free text can ride an unknown field into the record.
    const parsed = validClarityInstruments({
      schemaVersion: 1,
      dualTask: { ...measured(), transcript: 'ninety seven, ninety four' } as never,
    });
    expect(JSON.stringify(parsed)).not.toContain('ninety');
  });
});

describe('matched-pair Clarity persistence', () => {
  it('round-trips the complete frozen protocol and preserves negative motor cost', () => {
    const pairedTask = pairedMeasured();
    const record = {
      schemaVersion: CLARITY_INSTRUMENTS_SCHEMA_VERSION,
      pairedTask,
    };

    expect(validClarityInstruments(record)).toEqual(record);
    expect(validPairedClarityResult(pairedTask)).toEqual(pairedTask);
    expect(validPairedClarityResult(pairedTask)?.status).toBe('measured');
    if (pairedTask.status !== 'measured') throw new Error('fixture must be measured');
    expect(pairedTask.motorCostPercent).toBe(-20);
    expect(pairedClarityReadingValue(pairedTask)).toBe(120);
    expect(pairedClarityReadingValue({ ...pairedTask, ceilingLimited: true })).toBeNull();
  });

  it('keeps the matched pair distinct from a stored legacy dual-task result', () => {
    const record = {
      schemaVersion: 1,
      pairedTask: pairedMeasured(),
      dualTask: measured(),
    };
    const parsed = validClarityInstruments(record);
    expect(parsed?.pairedTask).toEqual(record.pairedTask);
    expect(parsed?.dualTask).toEqual(record.dualTask);

    // A malformed new record does not erase a valid legacy reading.
    const legacySurvives = validClarityInstruments({
      ...record,
      pairedTask: { ...pairedMeasured(), schemaVersion: 99 },
    });
    expect(legacySurvives?.pairedTask).toBeUndefined();
    expect(legacySurvives?.dualTask).toEqual(record.dualTask);
  });

  it('persists ineligible, invalid, and unavailable states without fabricating a measurement', () => {
    const ineligible: PairedClarityResultRecord = {
      schemaVersion: 1,
      status: 'ineligible',
      protocol: pairedProtocol,
      responseProtocol: pairedResponseProtocol,
      reason: 'solo_below_floor',
      solo: { kind: 'solo', durationMs: 4000, durationSec: 4, termination: 'touchdown' },
    };
    expect(validPairedClarityResult(ineligible)).toEqual(ineligible);

    const invalid: PairedClarityResultRecord = {
      schemaVersion: 1,
      status: 'invalid',
      protocol: pairedProtocol,
      responseProtocol: pairedResponseProtocol,
      reason: 'cognitive_accuracy_below_floor',
      solo: { kind: 'solo', durationMs: 10000, durationSec: 10, termination: 'touchdown' },
      dual: { kind: 'dual', durationMs: 12000, durationSec: 12, termination: 'touchdown' },
      cognitive: { attempts: 5, responses: 2, correct: 1, errors: 4 },
    };
    expect(validPairedClarityResult(invalid)).toEqual(invalid);

    const participationBelowFloor: PairedClarityResultRecord = {
      schemaVersion: 1,
      status: 'invalid',
      protocol: pairedProtocol,
      responseProtocol: pairedResponseProtocol,
      reason: 'cognitive_participation_below_floor',
      solo: { kind: 'solo', durationMs: 10000, durationSec: 10, termination: 'touchdown' },
      dual: { kind: 'dual', durationMs: 5000, durationSec: 5, termination: 'touchdown' },
      cognitive: { attempts: 2, responses: 1, correct: 2, errors: 0 },
    };
    expect(validPairedClarityResult(participationBelowFloor)).toEqual(
      participationBelowFloor
    );

    const engagementBelowFloor: PairedClarityResultRecord = {
      schemaVersion: 1,
      status: 'invalid',
      protocol: pairedProtocol,
      responseProtocol: pairedResponseProtocol,
      reason: 'cognitive_response_engagement_below_floor',
      solo: { kind: 'solo', durationMs: 10000, durationSec: 10, termination: 'touchdown' },
      dual: { kind: 'dual', durationMs: 12000, durationSec: 12, termination: 'touchdown' },
      cognitive: { attempts: 5, responses: 0, correct: 3, errors: 2 },
    };
    expect(validPairedClarityResult(engagementBelowFloor)).toEqual(engagementBelowFloor);

    const unavailable: PairedClarityResultRecord = {
      schemaVersion: 1,
      status: 'unavailable',
      protocol: pairedProtocol,
      responseProtocol: pairedResponseProtocol,
      reason: 'speech_presence_unavailable',
    };
    expect(validPairedClarityResult(unavailable)).toEqual(unavailable);
  });

  it('rejects incoherent measurements rather than repairing or relabelling them', () => {
    const valid = pairedMeasured();
    const corruptions: unknown[] = [
      { ...valid, schemaVersion: 99 },
      { ...valid, protocol: { ...pairedProtocol, order: 'dual_then_solo' } },
      {
        ...valid,
        responseProtocol: { ...pairedResponseProtocol, sequenceSeedId: 'free-text-seed' },
      },
      { ...valid, cognitive: { attempts: 5, responses: 2, correct: 4, errors: 0 } },
      { ...valid, cognitive: { attempts: 4, responses: 2, correct: 3, errors: 1 } },
      { ...valid, cognitive: { attempts: 5, responses: 6, correct: 4, errors: 1 } },
      {
        ...valid,
        protocol: {
          ...pairedProtocol,
          validityPolicy: { ...pairedProtocol.validityPolicy, minCognitiveAccuracy: 0.5 },
        },
      },
      {
        ...valid,
        protocol: {
          ...pairedProtocol,
          validityPolicy: { ...pairedProtocol.validityPolicy, minSoloHoldMs: 9000 },
        },
      },
      { ...valid, motorCostPercent: 20 },
      { ...valid, dual: { ...valid.dual, durationSec: 13 } },
      { ...valid, ceilingLimited: true },
      {
        ...valid,
        solo: { kind: 'solo', durationMs: 4000, durationSec: 4, termination: 'touchdown' },
        motorCostPercent: -200,
      },
    ];
    for (const corrupted of corruptions) {
      expect(validPairedClarityResult(corrupted)).toBeUndefined();
    }

    expect(
      validPairedClarityResult({
        schemaVersion: 1,
        status: 'ineligible',
        protocol: pairedProtocol,
        responseProtocol: pairedResponseProtocol,
        reason: 'solo_below_floor',
        solo: { kind: 'solo', durationMs: 12000, durationSec: 12, termination: 'touchdown' },
      })
    ).toBeUndefined();
  });

  it('strips content-bearing and unknown fields at every persisted boundary', () => {
    const canary = 'private spoken response';
    const measuredWithContent = {
      ...pairedMeasured(),
      transcript: canary,
      audio: canary,
      protocol: {
        ...pairedProtocol,
        notes: canary,
        validityPolicy: { ...pairedProtocol.validityPolicy, rawResponse: canary },
      },
      responseProtocol: { ...pairedResponseProtocol, responseWord: canary },
      solo: { ...pairedMeasured().solo, videoPath: canary },
      dual: { ...pairedMeasured().dual, speechEvents: [canary] },
      cognitive: { ...pairedMeasured().cognitive, tokens: [canary] },
    };
    const parsed = validPairedClarityResult(measuredWithContent);
    expect(parsed).toEqual(pairedMeasured());
    expect(JSON.stringify(parsed)).not.toContain(canary);
    if (!parsed || parsed.status !== 'measured') throw new Error('fixture should parse');
    expect(Object.keys(parsed.cognitive)).toEqual([
      'attempts',
      'responses',
      'correct',
      'errors',
    ]);
    expect(Object.keys(parsed.solo)).toEqual(['kind', 'durationMs', 'durationSec', 'termination']);
    expect(Object.keys(parsed.responseProtocol)).not.toContain('responseWord');
  });
});
