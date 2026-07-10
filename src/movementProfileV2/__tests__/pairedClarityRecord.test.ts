import {
  createPairedClarityResultRecord,
  type PairedClarityRecordInput,
} from '../pairedClarityRecord';
import { ClarityResponseScorer } from '../clarityResponseScorer';
import {
  PairedClarityRuntime,
  type PairedClarityResult,
  type PairedClarityValidityPolicy,
} from '../pairedClarityRuntime';

const policy: PairedClarityValidityPolicy = {
  minSoloHoldMs: 10000,
  ceilingExclusionMarginMs: 0,
  minCognitiveAttempts: 4,
  minCognitiveResponses: 1,
  minCognitiveAccuracy: 0.6,
};

type MeasuredLivePair = Extract<PairedClarityResult, { status: 'measured' }>;

function measuredResult(): MeasuredLivePair {
  const protocol = new PairedClarityRuntime({
    standingSide: 'left',
    validityPolicy: policy,
  }).protocol;
  return {
    status: 'measured',
    protocol,
    solo: {
      kind: 'solo',
      startedAtMs: 1000,
      endedAtMs: 11000,
      durationMs: 10000,
      durationSec: 10,
      termination: 'touchdown',
    },
    dual: {
      kind: 'dual',
      startedAtMs: 42000,
      endedAtMs: 54000,
      durationMs: 12000,
      durationSec: 12,
      termination: 'touchdown',
    },
    cognitive: { attempts: 5, responses: 2, correct: 4, errors: 1, accuracy: 0.8 },
    motorCostPercent: -20,
    ceilingLimited: false,
  };
}

describe('createPairedClarityResultRecord', () => {
  it('maps a measured live pair to the minimal persisted schema', () => {
    const result = measuredResult();
    const responseProtocol = new ClarityResponseScorer({ trialStartedAtMs: 42000 }).protocol;
    const record = createPairedClarityResultRecord({ result, responseProtocol });

    expect(record).toMatchObject({
      schemaVersion: 1,
      status: 'measured',
      protocol: {
        protocolId: 'pearl_paired_clarity_balance_v1',
        standingSide: 'left',
        order: 'solo_then_dual',
      },
      responseProtocol: {
        protocolId: 'pearl_visual_go_no_go_v1',
        sequenceSeedId: 'pearl_vgng_form_a_v1',
      },
      solo: { kind: 'solo', durationMs: 10000, durationSec: 10, termination: 'touchdown' },
      dual: { kind: 'dual', durationMs: 12000, durationSec: 12, termination: 'touchdown' },
      cognitive: { attempts: 5, responses: 2, correct: 4, errors: 1 },
      motorCostPercent: -20,
      ceilingLimited: false,
    });
    expect(JSON.stringify(record)).not.toMatch(/startedAtMs|endedAtMs|accuracy/);
  });

  it('copies unavailable state with both frozen protocol identities', () => {
    const protocol = new PairedClarityRuntime({
      standingSide: 'right',
      validityPolicy: policy,
    }).protocol;
    const responseProtocol = new ClarityResponseScorer({
      trialStartedAtMs: 0,
      sequenceSeedId: 'pearl_vgng_form_b_v1',
    }).protocol;
    expect(
      createPairedClarityResultRecord({
        protocol,
        responseProtocol,
        unavailableReason: 'speech_presence_unavailable',
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'speech_presence_unavailable',
      protocol: { standingSide: 'right' },
      responseProtocol: { sequenceSeedId: 'pearl_vgng_form_b_v1' },
    });
  });

  it('cannot copy content-bearing runtime extras into the stored record', () => {
    const canary = 'private spoken response';
    const result = {
      ...measuredResult(),
      transcript: canary,
      audio: canary,
      cognitive: {
        ...measuredResult().cognitive,
        transcript: canary,
        tokens: [canary],
      },
    } as unknown as PairedClarityResult;
    const responseProtocol = {
      ...new ClarityResponseScorer({ trialStartedAtMs: 0 }).protocol,
      responseWord: canary,
    };
    const record = createPairedClarityResultRecord({ result, responseProtocol });
    expect(JSON.stringify(record)).not.toContain(canary);
    if (record.status !== 'measured') throw new Error('fixture should remain measured');
    expect(Object.keys(record.cognitive)).toEqual([
      'attempts',
      'responses',
      'correct',
      'errors',
    ]);
  });

  it('refuses an internally incoherent live result at the persistence boundary', () => {
    const result = { ...measuredResult(), motorCostPercent: 20 } as PairedClarityResult;
    const responseProtocol = new ClarityResponseScorer({ trialStartedAtMs: 0 }).protocol;
    expect(() =>
      createPairedClarityResultRecord({ result, responseProtocol })
    ).toThrow('paired Clarity result is not persistable');

    const malformedUnavailable = {
      protocol: result.protocol,
      responseProtocol,
      unavailableReason: 'free_text_reason',
    } as unknown as PairedClarityRecordInput;
    expect(() => createPairedClarityResultRecord(malformedUnavailable)).toThrow(
      'paired Clarity result is not persistable'
    );
  });
});
