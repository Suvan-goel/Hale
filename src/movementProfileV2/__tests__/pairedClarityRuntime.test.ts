import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { MovementProfileV2LivePoseSample } from '../liveCoordinator';
import {
  PAIRED_CLARITY_ORDER,
  PAIRED_CLARITY_PROTOCOL_ID,
  PAIRED_CLARITY_STANCE_ID,
  PairedClarityRuntime,
  type PairedClarityValidityPolicy,
} from '../pairedClarityRuntime';

const LEFT_ANKLE = 27;
const RIGHT_ANKLE = 28;

const VALIDITY_POLICY: PairedClarityValidityPolicy = {
  minSoloHoldMs: 10000,
  ceilingExclusionMarginMs: 0,
  minCognitiveAttempts: 4,
  minCognitiveResponses: 1,
  minCognitiveAccuracy: 0.6,
};

function sample(input: {
  standingSide?: 'left' | 'right';
  raised: boolean;
  trackingQuality?: 'good' | 'lost';
}): MovementProfileV2LivePoseSample {
  const side = input.standingSide ?? 'left';
  const ys = new Array(33).fill(0.5);
  const standingAnkle = side === 'left' ? LEFT_ANKLE : RIGHT_ANKLE;
  const raisedAnkle = side === 'left' ? RIGHT_ANKLE : LEFT_ANKLE;
  ys[standingAnkle] = 0.9;
  ys[raisedAnkle] = input.raised ? 0.7 : 0.895;
  return {
    output: {
      frame: { ys, xs: new Array(33).fill(0.5), aspect: 1 },
      bodyUnit: 1,
    },
    trackingQuality: input.trackingQuality ?? 'good',
  } as unknown as MovementProfileV2LivePoseSample;
}

function driveHold(
  runtime: PairedClarityRuntime,
  input: { kind: 'solo' | 'dual'; startedAtMs: number; durationMs: number; standingSide?: 'left' | 'right' }
): void {
  const raised = sample({ standingSide: input.standingSide, raised: true });
  const down = sample({ standingSide: input.standingSide, raised: false });
  runtime.update(raised, input.startedAtMs);
  runtime.update(raised, input.startedAtMs + 200);
  expect(runtime.phase).toBe(input.kind === 'solo' ? 'solo_hold' : 'dual_hold');
  expect(runtime.activeHoldStartedAtMs).toBe(input.startedAtMs);
  runtime.update(raised, input.startedAtMs + input.durationMs - 1);
  for (let frame = 0; frame < 4; frame++) {
    runtime.update(down, input.startedAtMs + input.durationMs + frame * 33);
  }
}

function advanceStandardizedRest(runtime: PairedClarityRuntime): number {
  if (runtime.result?.status === 'ineligible') throw new Error('solo unexpectedly ineligible');
  const dueAt = runtime.standardizedRestEndsAtMs;
  if (dueAt === null) throw new Error('expected standardized rest deadline');
  const down = sample({ raised: false });
  runtime.update(down, dueAt - 1);
  expect(runtime.phase).toBe('standardized_rest');
  expect(runtime.restRemainingMs(dueAt - 1)).toBe(1);
  runtime.update(down, dueAt);
  expect(runtime.phase).toBe('dual_setup');
  return dueAt;
}

describe('PairedClarityRuntime', () => {
  it('freezes exact same-side/same-stance/same-cap metadata and enforces solo -> rest -> dual', () => {
    const runtime = new PairedClarityRuntime({ standingSide: 'left', validityPolicy: VALIDITY_POLICY });
    expect(runtime.protocol).toEqual({
      protocolId: PAIRED_CLARITY_PROTOCOL_ID,
      protocolVersion: 1,
      movementId: 'one-leg-balance-45s-v2',
      stanceId: PAIRED_CLARITY_STANCE_ID,
      standingSide: 'left',
      order: PAIRED_CLARITY_ORDER,
      trialCapMs: 45000,
      standardizedRestMs: 30000,
      liftConfirmMs: 150,
      touchdownDebounceFrames: 4,
      trackingLossConfirmFrames: 4,
      validityPolicy: VALIDITY_POLICY,
    });

    driveHold(runtime, { kind: 'solo', startedAtMs: 1000, durationMs: 16000 });
    expect(runtime.phase).toBe('standardized_rest');
    const dualSetupAt = advanceStandardizedRest(runtime);
    driveHold(runtime, { kind: 'dual', startedAtMs: dualSetupAt + 1000, durationMs: 12000 });
    expect(runtime.phase).toBe('awaiting_cognitive_outcome');
    expect(runtime.result).toBeNull();

    expect(
      runtime.completeCognitiveOutcome({ attempts: 5, responses: 3, correct: 4, errors: 1 })
    ).toBe(true);
    expect(runtime.result).toMatchObject({
      status: 'measured',
      motorCostPercent: 25,
      ceilingLimited: false,
      solo: { kind: 'solo', durationMs: 16000, termination: 'touchdown' },
      dual: { kind: 'dual', durationMs: 12000, termination: 'touchdown' },
      cognitive: { attempts: 5, responses: 3, correct: 4, errors: 1, accuracy: 0.8 },
    });
  });

  it('uses the configured standing side for both trials and preserves negative motor cost', () => {
    const runtime = new PairedClarityRuntime({ standingSide: 'right', validityPolicy: VALIDITY_POLICY });
    // Lifting the wrong foot does not start a RIGHT-standing trial.
    runtime.update(sample({ standingSide: 'left', raised: true }), 0);
    runtime.update(sample({ standingSide: 'left', raised: true }), 500);
    expect(runtime.phase).toBe('solo_setup');

    driveHold(runtime, { kind: 'solo', startedAtMs: 1000, durationMs: 10000, standingSide: 'right' });
    const dualSetupAt = advanceStandardizedRest(runtime);
    driveHold(runtime, {
      kind: 'dual',
      startedAtMs: dualSetupAt + 1000,
      durationMs: 12000,
      standingSide: 'right',
    });
    runtime.completeCognitiveOutcome({
      attempts: 5,
      responses: 3,
      correct: 5,
      errors: 0,
    });

    expect(runtime.result).toMatchObject({
      status: 'measured',
      protocol: { standingSide: 'right' },
      motorCostPercent: -20,
    });
  });

  it('stops before the dual task when the solo comparator is below the floor or at the ceiling', () => {
    const below = new PairedClarityRuntime({ standingSide: 'left', validityPolicy: VALIDITY_POLICY });
    driveHold(below, { kind: 'solo', startedAtMs: 0, durationMs: 4000 });
    expect(below.result).toMatchObject({ status: 'ineligible', reason: 'solo_below_floor' });

    const ceiling = new PairedClarityRuntime({ standingSide: 'left', validityPolicy: VALIDITY_POLICY });
    const raised = sample({ raised: true });
    ceiling.update(raised, 0);
    ceiling.update(raised, 200);
    ceiling.update(raised, 45000);
    expect(ceiling.result).toMatchObject({
      status: 'ineligible',
      reason: 'solo_at_or_near_ceiling',
      solo: { termination: 'ceiling', durationMs: 45000 },
    });
  });

  it('invalidates confirmed tracking loss in either member of the pair', () => {
    const solo = new PairedClarityRuntime({ standingSide: 'left', validityPolicy: VALIDITY_POLICY });
    const raised = sample({ raised: true });
    solo.update(raised, 0);
    solo.update(raised, 200);
    for (let frame = 0; frame < 4; frame++) {
      solo.update(sample({ raised: true, trackingQuality: 'lost' }), 1000 + frame * 33);
    }
    expect(solo.result).toMatchObject({ status: 'invalid', reason: 'solo_tracking_interrupted' });

    const dual = new PairedClarityRuntime({ standingSide: 'left', validityPolicy: VALIDITY_POLICY });
    driveHold(dual, { kind: 'solo', startedAtMs: 0, durationMs: 10000 });
    const dualSetupAt = advanceStandardizedRest(dual);
    dual.update(raised, dualSetupAt + 1000);
    dual.update(raised, dualSetupAt + 1200);
    for (let frame = 0; frame < 4; frame++) {
      dual.update(
        sample({ raised: true, trackingQuality: 'lost' }),
        dualSetupAt + 2000 + frame * 33
      );
    }
    expect(dual.result).toMatchObject({
      status: 'invalid',
      reason: 'dual_tracking_interrupted',
      solo: { durationMs: 10000 },
    });
  });

  it('requires coherent participation and correctness aggregates before measuring motor cost', () => {
    const paired = (dualDurationMs = 12000) => {
      const runtime = new PairedClarityRuntime({ standingSide: 'left', validityPolicy: VALIDITY_POLICY });
      driveHold(runtime, { kind: 'solo', startedAtMs: 0, durationMs: 10000 });
      const dualSetupAt = advanceStandardizedRest(runtime);
      driveHold(runtime, {
        kind: 'dual',
        startedAtMs: dualSetupAt + 1000,
        durationMs: dualDurationMs,
      });
      return runtime;
    };

    const incoherent = paired();
    incoherent.completeCognitiveOutcome({ attempts: 5, responses: 3, correct: 4, errors: 0 });
    expect(incoherent.result).toMatchObject({ status: 'invalid', reason: 'cognitive_aggregate_invalid' });

    const tooFew = paired(5000);
    tooFew.completeCognitiveOutcome({ attempts: 2, responses: 1, correct: 2, errors: 0 });
    expect(tooFew.result).toMatchObject({
      status: 'invalid',
      reason: 'cognitive_participation_below_floor',
    });
    expect(tooFew.result).not.toHaveProperty('motorCostPercent');

    const disengaged = paired();
    disengaged.completeCognitiveOutcome({ attempts: 5, responses: 0, correct: 3, errors: 2 });
    expect(disengaged.result).toMatchObject({
      status: 'invalid',
      reason: 'cognitive_response_engagement_below_floor',
    });
    expect(disengaged.result).not.toHaveProperty('motorCostPercent');

    const inaccurate = paired();
    inaccurate.completeCognitiveOutcome({ attempts: 5, responses: 2, correct: 1, errors: 4 });
    expect(inaccurate.result).toMatchObject({
      status: 'invalid',
      reason: 'cognitive_accuracy_below_floor',
    });
    expect(inaccurate.result).not.toHaveProperty('motorCostPercent');
  });

  it('copies only numeric aggregates and has no history dependency', () => {
    const runtime = new PairedClarityRuntime({ standingSide: 'left', validityPolicy: VALIDITY_POLICY });
    driveHold(runtime, { kind: 'solo', startedAtMs: 0, durationMs: 10000 });
    const dualSetupAt = advanceStandardizedRest(runtime);
    driveHold(runtime, { kind: 'dual', startedAtMs: dualSetupAt + 1000, durationMs: 12000 });
    runtime.completeCognitiveOutcome({
      attempts: 5,
      responses: 2,
      correct: 4,
      errors: 1,
      transcript: 'ninety seven ninety four',
      audio: 'canary',
      tokens: ['ninety'],
    } as unknown as { attempts: number; responses: number; correct: number; errors: number });

    const serialized = JSON.stringify(runtime.result);
    expect(serialized).not.toMatch(/ninety|canary|transcript|audio|tokens/);
    expect(runtime.result).toMatchObject({
      status: 'measured',
      cognitive: { attempts: 5, responses: 2, correct: 4, errors: 1, accuracy: 0.8 },
    });

    const source = readFileSync(
      join(process.cwd(), 'src/movementProfileV2/pairedClarityRuntime.ts'),
      'utf8'
    )
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/.*$/gm, ' ');
    expect(source).not.toMatch(/from ['"][^'"]*history/);
  });

  it('rejects validity policies that could silently create unusable comparisons', () => {
    expect(
      () =>
        new PairedClarityRuntime({
          standingSide: 'left',
          validityPolicy: { ...VALIDITY_POLICY, minCognitiveAccuracy: 0.5 },
        })
    ).toThrow('invalid paired Clarity validity policy');
    expect(
      () =>
        new PairedClarityRuntime({
          standingSide: 'left',
          validityPolicy: { ...VALIDITY_POLICY, minCognitiveResponses: 0 },
        })
    ).toThrow('invalid paired Clarity validity policy');
    expect(
      () =>
        new PairedClarityRuntime({
          standingSide: 'left',
          validityPolicy: { ...VALIDITY_POLICY, minSoloHoldMs: 9000 },
        })
    ).toThrow('invalid paired Clarity validity policy');
    expect(
      () =>
        new PairedClarityRuntime({
          standingSide: 'left',
          validityPolicy: { ...VALIDITY_POLICY, minSoloHoldMs: 45000 },
        })
    ).toThrow('invalid paired Clarity validity policy');
  });
});
