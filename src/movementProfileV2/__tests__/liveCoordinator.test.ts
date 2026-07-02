import fs from 'fs';
import path from 'path';

import {
  createMovementProfileV2InternalFlow,
} from '../internalCheckupFlow';
import {
  createMovementProfileV2LivePoseSample,
  MovementProfileV2LiveCoordinator,
} from '../liveCoordinator';
import {
  isMovementProfileV2DiagnosticsEnabled,
  parseMovementProfileV2DiagnosticsFlag,
  serializeMovementProfileV2LiveDiagnostics,
} from '../liveDiagnostics';
import type { BodySide } from '../../checkup/protocolSetup';
import type { CheckUp } from '../../checkup/types';
import { ACTIVE_SHOULDER_REACH_V2_ID } from '../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID } from '../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID } from '../../movements/oneLegBalanceV2';
import { HINGE_REACH_ID } from '../../movements/hingeReach';
import { CHAIN_IDS } from '../../pose/chains';
import type { PipelineFrameOutput } from '../../pose/pipeline';
import { chairStandSession } from '../../pose/testing/syntheticChairStand';
import { createPoseFrame, LANDMARK_COUNT, LANDMARK_STRIDE, LM, parseLandmarkEvent, type RawLandmarkEvent } from '../../pose/types';
import {
  createMovementProfileV2Assessment,
  createMovementProfileV2Snapshot,
  materializeOfficialMovementProfileV2Artifacts,
} from '../../reference/movementProfileV2';
import { buildMovementProfileV2ResultsViewModel } from '../viewModel';

const STARTED_AT = '2026-06-24T08:00:00.000Z';
const REFERENCE_PROFILE = {
  ageAtTest: 62,
  ageBasis: 'exact_age_at_test' as const,
  referenceSex: 'female' as const,
};

describe('MovementProfileV2LiveCoordinator', () => {
  it('exposes coordinator-owned recording visual guidance on live snapshots', () => {
    const coordinator = createCoordinator();
    const snapshot = coordinator.snapshot(0);

    expect(snapshot.recordingVisualGuidance).toMatchObject({
      visualState: 'lost',
      source: 'mpv2_live',
      primaryText: snapshot.statusText,
      blocksMeasurement: true,
      blocksAutoStart: true,
      voiceCue: null,
      metricProtected: false,
      reason: 'mpv2:no-pose',
    });
  });

  it('drops duplicate, out-of-order, stale, malformed, and wrong-epoch frames without mutating movement state', () => {
    const coordinator = createCoordinator();
    expect(coordinator.receiveUserAction({ type: 'confirm_chair_setup' }, 0)).toBe(true);

    const first = trackingOutput(balanceRaw(100, 'left', true));
    feedOutput(coordinator, first, 100, { frameId: 'a' });
    feedOutput(coordinator, trackingOutput(balanceRaw(100, 'left', true)), 100, { frameId: 'a' });
    feedOutput(coordinator, trackingOutput(balanceRaw(90, 'left', true)), 90, { frameId: 'older' });
    feedOutput(coordinator, trackingOutput(balanceRaw(200, 'left', true)), 200, { frameId: 'stale', receivedAtMs: 2000 });
    feedOutput(coordinator, trackingOutput(balanceRaw(300, 'left', true)), 300, {
      frameId: 'wrong-epoch',
      movementEpochId: 'old-chair-epoch',
    });

    const malformed = createMovementProfileV2LivePoseSample({
      frameId: 'bad',
      eventTimestampMs: Number.NaN,
      receivedAtMs: 400,
      sourceWidth: 480,
      sourceHeight: 640,
      movementEpochId: coordinator.snapshot(400).movementEpochId,
      attemptEpochId: coordinator.snapshot(400).attemptEpochId,
      output: trackingOutput(balanceRaw(400, 'left', true)),
    });
    expect(malformed).toBeNull();

    const snapshot = coordinator.snapshot(400);
    expect(snapshot.stage).toBe('chair_practice');
    expect(snapshot.diagnostics.framesReceived).toBe(5);
    expect(snapshot.diagnostics.framesAccepted).toBe(1);
    expect(snapshot.diagnostics.duplicateFramesDropped).toBe(1);
    expect(snapshot.diagnostics.outOfOrderFramesDropped).toBe(1);
    expect(snapshot.diagnostics.staleFramesDropped).toBe(1);
    expect(snapshot.diagnostics.epochMismatchFramesDropped).toBe(1);
  });

  it('derives setup guidance from coordinator readiness without selecting sides or mutating the flow', () => {
    const chair = createHandsFreeCoordinator();
    feedOutput(chair, trackingOutput(chairSetupRaw(100), 0.3, { leftSide: 0.3, rightSide: 0.95 }), 100);
    expect(chair.snapshot(100).recordingVisualGuidance).toMatchObject({
      visualState: 'tracking',
      reason: 'mpv2:audio-blocking',
      blocksAutoStart: true,
      voiceCue: null,
    });

    const coordinator = createHandsFreeCoordinator({ priorStandingLeg: 'right', standingLeg: 'right' });
    const nowMs = advanceThroughChair(coordinator, 0) + 100;
    expect(coordinator.snapshot(nowMs).stage).toBe('balance_setup');
    expect(coordinator.receiveUserAction({ type: 'balance_setup_voice_completed' }, nowMs)).toBe(true);

    feedOutput(
      coordinator,
      trackingOutput(balanceRaw(nowMs + 100, 'left', true), 0.3, { leftSide: 0.2, rightSide: 0.2 }),
      nowMs + 100
    );
    let snapshot = coordinator.snapshot(nowMs + 100);
    expect(snapshot.recordingVisualGuidance).toMatchObject({
      visualState: 'adjust',
      reason: 'mpv2:setup-adjust',
      blocksMeasurement: true,
      blocksAutoStart: true,
    });

    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 300, 'left', false)), nowMs + 300);
    snapshot = coordinator.snapshot(nowMs + 300);
    const afterGuidanceRead = coordinator.snapshot(nowMs + 300);

    expect(snapshot.stage).toBe('balance_setup');
    expect(snapshot.flow.standingLeg).toBe('right');
    expect(snapshot.recordingVisualGuidance).toMatchObject({
      visualState: 'ready',
      reason: 'mpv2:setup-ready',
      source: 'mpv2_live',
    });
    expect(afterGuidanceRead.stage).toBe(snapshot.stage);
    expect(afterGuidanceRead.flow.standingLeg).toBe(snapshot.flow.standingLeg);
    expect(afterGuidanceRead.revision).toBe(snapshot.revision);
    expect(afterGuidanceRead.checkUp).toBeNull();
  });

  it('uses live chair frames for practice and the official window, keeping practice out of the result', () => {
    const coordinator = createCoordinator();
    const nowMs = advanceThroughChair(coordinator, 0);
    const snapshot = coordinator.snapshot(nowMs);
    const chair = snapshot.flow.items.find((item) => item.movementId === CHAIR_RISE_V2_ID)?.result as
      | { reps: number; practiceRepCompleted: boolean }
      | undefined;

    expect(snapshot.stage).toBe('balance_setup');
    expect(snapshot.diagnostics.chair.practiceReps).toBe(1);
    expect(snapshot.diagnostics.chair.practiceCompleted).toBe(true);
    expect(snapshot.diagnostics.chair.officialReps).toBeGreaterThan(0);
    expect(snapshot.repCreditCount).toBe(
      snapshot.diagnostics.chair.practiceReps + snapshot.diagnostics.chair.officialReps
    );
    expect(chair?.practiceRepCompleted).toBe(true);
    expect(chair?.reps).toBe(snapshot.diagnostics.chair.officialReps);
    expect(chair?.reps).not.toBe(12);
  });

  it('does not let post-window chair frames inflate the displayed count beyond the saved result', () => {
    const coordinator = createCoordinator();
    const activeAt = advanceToChairActive(coordinator, 0);
    const session = chairStandSession({
      seed: 909,
      noiseAmp: 0,
      calibrationMs: 100,
      riseMsPerRep: [900, 900, 900],
      sitMs: 600,
      settleMs: 300,
      topMs: 400,
      descendMs: 700,
      restMs: 500,
      tailMs: 1000,
      nearSide: 'right',
    });

    for (const raw of session.frames) {
      const nowMs = activeAt + 31000 + raw.timestampMs;
      feedOutput(
        coordinator,
        trackingOutput({ ...raw, timestampMs: nowMs }, session.truth.bodyUnit, { leftSide: 0.3, rightSide: 0.95 }),
        nowMs
      );
    }

    expect(coordinator.snapshot(activeAt + 40000).chairReps).toBe(0);
    coordinator.receiveTimerTick(activeAt + 40000);
    const snapshot = coordinator.snapshot(activeAt + 40000);
    const chair = snapshot.flow.items.find((item) => item.movementId === CHAIR_RISE_V2_ID)?.result as
      | { reps: number }
      | undefined;

    expect(snapshot.stage).toBe('balance_setup');
    expect(chair?.reps).toBe(snapshot.diagnostics.chair.officialReps);
    expect(chair?.reps).toBe(0);
  });

  it('starts balance from live foot lift, enforces minimum rest, and can store the best live trial', () => {
    const coordinator = createCoordinator();
    let nowMs = advanceThroughChair(coordinator, 0) + 100;
    nowMs = startBalanceTrial(coordinator, nowMs, 'left');
    nowMs = finishBalanceByTouchdown(coordinator, nowMs, 'left');

    let snapshot = coordinator.snapshot(nowMs);
    expect(snapshot.stage).toBe('balance_rest');
    expect(snapshot.balanceBestHoldSec).toBeGreaterThan(0);
    expect(snapshot.canContinueAfterRest).toBe(false);

    expect(coordinator.receiveUserAction({ type: 'balance_ready' }, nowMs + 29999)).toBe(false);
    expect(coordinator.receiveUserAction({ type: 'balance_ready' }, nowMs + 30000)).toBe(true);
    snapshot = coordinator.snapshot(nowMs + 30000);
    expect(snapshot.stage).toBe('balance_ready');

    expect(coordinator.receiveUserAction({ type: 'balance_use_result' }, nowMs + 30100)).toBe(true);
    snapshot = coordinator.snapshot(nowMs + 30100);
    const balance = snapshot.flow.items.find((item) => item.movementId === ONE_LEG_BALANCE_V2_ID)?.result as
      | { validTrialCount: number; bestHoldSec: number }
      | undefined;
    expect(snapshot.stage).toBe('shoulder_setup');
    expect(balance?.validTrialCount).toBe(1);
    expect(balance?.bestHoldSec).toBeGreaterThan(0);
  });

  it('requires explicit voice boundary actions before measured attempts can start', () => {
    const chair = createCoordinator();
    const countdownAt = advanceToChairCountdown(chair, 0);
    chair.receiveTimerTick(countdownAt + 10000);
    expect(chair.snapshot(countdownAt + 10000).stage).toBe('chair_countdown');
    expect(chair.receiveUserAction({ type: 'chair_go_playback_started' }, countdownAt + 10001)).toBe(false);
    expect(chair.receiveUserAction({ type: 'chair_official_ready_voice_completed' }, countdownAt + 10002)).toBe(true);
    expect(chair.receiveUserAction({ type: 'chair_go_playback_started' }, countdownAt + 10003)).toBe(true);
    expect(chair.snapshot(countdownAt + 10003).stage).toBe('chair_active');

    const balance = createCoordinator();
    let nowMs = advanceThroughChair(balance, 0) + 100;
    expect(balance.receiveUserAction({ type: 'confirm_balance_setup', standingLeg: 'left' }, nowMs)).toBe(true);
    feedOutput(balance, trackingOutput(balanceRaw(nowMs + 100, 'left', true)), nowMs + 100);
    expect(balance.snapshot(nowMs + 100).stage).toBe('balance_ready');
    expect(balance.receiveUserAction({ type: 'balance_attempt_voice_completed' }, nowMs + 200)).toBe(true);
    confirmBalanceLift(balance, nowMs + 300, 'left');

    const shoulder = createCoordinator();
    nowMs = advanceThroughShoulderSetup(shoulder, 0);
    expect(shoulder.receiveUserAction({ type: 'confirm_shoulder_setup', shoulderSide: 'right' }, nowMs)).toBe(true);
    expect(shoulder.receiveUserAction({ type: 'start_shoulder_capture' }, nowMs + 1)).toBe(false);
    expect(shoulder.receiveUserAction({ type: 'shoulder_setup_voice_completed' }, nowMs + 2)).toBe(true);
    expect(shoulder.receiveUserAction({ type: 'start_shoulder_capture' }, nowMs + 3)).toBe(true);

    const hinge = createCoordinator();
    nowMs = completeLiveCheckupUntilHinge(hinge);
    expect(hinge.receiveUserAction({ type: 'start_hinge_capture' }, nowMs)).toBe(false);
    expect(hinge.receiveUserAction({ type: 'hinge_setup_voice_completed' }, nowMs + 1)).toBe(true);
    expect(hinge.receiveUserAction({ type: 'start_hinge_capture' }, nowMs + 2)).toBe(true);
  });

  it('marks audio-gated countdown, active capture, rest, and completion without triggering capture or materialization', () => {
    const chair = createCoordinator();
    const countdownAt = advanceToChairCountdown(chair, 0);
    let snapshot = chair.snapshot(countdownAt);
    expect(snapshot.stage).toBe('chair_countdown');
    expect(snapshot.checkUp).toBeNull();
    expect(snapshot.recordingVisualGuidance).toMatchObject({
      visualState: 'ready',
      reason: 'mpv2:audio-blocking',
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: true,
      voiceCue: null,
    });

    expect(chair.receiveUserAction({ type: 'chair_official_ready_voice_completed' }, countdownAt + 1)).toBe(true);
    expect(chair.receiveUserAction({ type: 'chair_countdown_started' }, countdownAt + 2)).toBe(true);
    snapshot = chair.snapshot(countdownAt + 2);
    expect(snapshot.stage).toBe('chair_countdown');
    expect(snapshot.checkUp).toBeNull();
    expect(snapshot.recordingVisualGuidance).toMatchObject({
      visualState: 'ready',
      reason: 'mpv2:countdown',
      blocksMeasurement: true,
      blocksAutoStart: false,
      metricProtected: true,
    });

    expect(chair.receiveUserAction({ type: 'chair_go_playback_started' }, countdownAt + 3)).toBe(true);
    snapshot = chair.snapshot(countdownAt + 3);
    expect(snapshot.stage).toBe('chair_active');
    expect(snapshot.checkUp).toBeNull();
    expect(snapshot.recordingVisualGuidance).toMatchObject({
      visualState: 'active',
      reason: 'mpv2:active',
      blocksMeasurement: false,
      blocksAutoStart: false,
      metricProtected: true,
    });

    const rest = createCoordinator();
    let nowMs = advanceThroughChair(rest, 0) + 100;
    nowMs = startBalanceTrial(rest, nowMs, 'left');
    nowMs = finishBalanceByTouchdownAfter(rest, nowMs, 'left', 20000);
    expect(rest.snapshot(nowMs).recordingVisualGuidance).toMatchObject({
      visualState: 'tracking',
      reason: 'mpv2:rest',
      blocksMeasurement: true,
      metricProtected: true,
    });

    const complete = createCoordinator();
    const checkUp = completeLiveCheckup(complete);
    snapshot = complete.snapshot(999999);
    expect(snapshot.stage).toBe('raw_complete');
    expect(snapshot.checkUp).toBe(checkUp);
    expect(snapshot.recordingVisualGuidance).toMatchObject({
      visualState: 'ready',
      reason: 'mpv2:complete',
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: false,
    });
  });

  it('auto-advances public hands-free chair setup only after voice guidance and stable camera readiness', () => {
    const coordinator = createHandsFreeCoordinator();
    expect(coordinator.snapshot(0)).toMatchObject({
      stage: 'chair_setup',
      handsFreeMode: true,
      handsFreeFallbackAvailable: false,
    });

    feedOutput(coordinator, trackingOutput(chairSetupRaw(100), 0.3, { leftSide: 0.3, rightSide: 0.95 }), 100);
    expect(coordinator.snapshot(100).stage).toBe('chair_setup');

    expect(coordinator.receiveUserAction({ type: 'chair_setup_voice_completed' }, 200)).toBe(true);
    feedOutput(coordinator, trackingOutput(chairSetupRaw(300), 0.3, { leftSide: 0.3, rightSide: 0.95 }), 300);
    expect(coordinator.snapshot(300).stage).toBe('chair_setup');

    feedOutput(coordinator, trackingOutput(chairSetupRaw(1600), 0.3, { leftSide: 0.3, rightSide: 0.95 }), 1600);
    const snapshot = coordinator.snapshot(1600);
    expect(snapshot.stage).toBe('chair_practice');
    expect(snapshot.lastTransition?.reason).toBe('chair_setup_confirmed');
  });

  it('auto-confirms hands-free balance setup from a two-foot stance before asking for the first lift', () => {
    const coordinator = createHandsFreeCoordinator();
    let nowMs = advanceThroughChair(coordinator, 0) + 100;
    expect(coordinator.snapshot(nowMs).stage).toBe('balance_setup');
    expect(coordinator.receiveUserAction({ type: 'balance_setup_voice_completed' }, nowMs)).toBe(true);

    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 100, 'left', false)), nowMs + 100);
    expect(coordinator.snapshot(nowMs + 100).stage).toBe('balance_setup');
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 1400, 'left', false)), nowMs + 1400);
    let snapshot = coordinator.snapshot(nowMs + 1400);
    expect(snapshot.stage).toBe('balance_ready');
    expect(snapshot.flow.standingLeg).toBe('left');
    expect(snapshot.statusText).toBe("Lift your foot high when you're ready. The timer starts when Hale sees the lift.");
    expect(snapshot.balanceTimerKind).toBe('none');
    expect(snapshot.timerRemainingMs).toBeNull();

    expect(coordinator.receiveUserAction({ type: 'balance_attempt_voice_completed' }, nowMs + 1500)).toBe(true);
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 1600, 'left', false)), nowMs + 1600);
    expect(coordinator.snapshot(nowMs + 1600).stage).toBe('balance_ready');
    const trialStartMs = confirmBalanceLift(coordinator, nowMs + 1700, 'left');
    nowMs = trialStartMs + 300;
    expect(coordinator.snapshot(nowMs).stage).toBe('balance_trial');
    snapshot = coordinator.snapshot(nowMs);
    expect(snapshot.lastTransition?.reason).toBe('balance_lift_detected');
    expect(snapshot.lastTransition?.atMs).toBe(trialStartMs);
    expect(snapshot.balanceTimerKind).toBe('active_trial');
    expect(snapshot.timerRemainingMs).toBeGreaterThan(0);
  });

  it('starts hands-free balance from a confirmed lift, backdating the trial clock to the first lift frame', () => {
    const coordinator = createHandsFreeCoordinator();
    const nowMs = advanceThroughChair(coordinator, 0) + 100;
    expect(coordinator.receiveUserAction({ type: 'confirm_balance_setup', standingLeg: 'left' }, nowMs)).toBe(true);
    expect(coordinator.snapshot(nowMs).stage).toBe('balance_ready');
    expect(coordinator.receiveUserAction({ type: 'balance_attempt_voice_completed' }, nowMs + 1)).toBe(true);

    const trialStartMs = confirmBalanceLift(coordinator, nowMs + 100, 'left');
    const snapshot = coordinator.snapshot(trialStartMs + 200);
    expect(snapshot.stage).toBe('balance_trial');
    // The trial clock is retro-dated to the first lift frame, so no hold time is lost.
    expect(snapshot.timerRemainingMs).toBe(45000 - 200);
  });

  it('does not start a balance trial from a single-frame lift blip', () => {
    const coordinator = createHandsFreeCoordinator();
    const nowMs = advanceThroughChair(coordinator, 0) + 100;
    expect(coordinator.receiveUserAction({ type: 'confirm_balance_setup', standingLeg: 'left' }, nowMs)).toBe(true);
    expect(coordinator.receiveUserAction({ type: 'balance_attempt_voice_completed' }, nowMs + 1)).toBe(true);

    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 100, 'left', true)), nowMs + 100);
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 133, 'left', false)), nowMs + 133);
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 166, 'left', false)), nowMs + 166);

    const snapshot = coordinator.snapshot(nowMs + 166);
    expect(snapshot.stage).toBe('balance_ready');
    expect(snapshot.diagnostics.balance.attemptedTrials).toBe(0);
  });

  it('infers the actual standing leg from the first lift after a neutral hands-free setup', () => {
    const coordinator = createHandsFreeCoordinator();
    let nowMs = advanceThroughChair(coordinator, 0) + 100;
    expect(coordinator.receiveUserAction({ type: 'balance_setup_voice_completed' }, nowMs)).toBe(true);

    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 100, 'left', false)), nowMs + 100);
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 1400, 'left', false)), nowMs + 1400);
    expect(coordinator.snapshot(nowMs + 1400)).toMatchObject({
      stage: 'balance_ready',
      flow: { standingLeg: 'left' },
    });

    expect(coordinator.receiveUserAction({ type: 'balance_attempt_voice_completed' }, nowMs + 1500)).toBe(true);
    nowMs = confirmBalanceLift(coordinator, nowMs + 1600, 'right');
    expect(coordinator.snapshot(nowMs + 300)).toMatchObject({
      stage: 'balance_trial',
      flow: { standingLeg: 'right' },
    });

    nowMs = finishBalanceByTouchdownAfter(coordinator, nowMs, 'right', 20000);
    expect(coordinator.receiveUserAction({ type: 'balance_use_result' }, nowMs + 1)).toBe(true);
    const balance = coordinator.snapshot(nowMs + 1).flow.items.find(
      (item) => item.movementId === ONE_LEG_BALANCE_V2_ID
    )?.result as
      | { setup?: { source?: string; standingLeg?: BodySide; priorStandingLeg?: BodySide | null } | null }
      | undefined;
    expect(balance?.setup).toMatchObject({
      source: 'camera_inferred',
      standingLeg: 'right',
      priorStandingLeg: null,
    });
  });

  it('starts balance when the standing leg is reliable even if the lifted side chain drops', () => {
    const coordinator = createCoordinator();
    const nowMs = advanceThroughChair(coordinator, 0) + 100;
    expect(coordinator.receiveUserAction({ type: 'confirm_balance_setup', standingLeg: 'left' }, nowMs)).toBe(true);
    expect(coordinator.receiveUserAction({ type: 'balance_attempt_voice_completed' }, nowMs + 1)).toBe(true);

    confirmBalanceLift(coordinator, nowMs + 100, 'left', { leftSide: 0.95, rightSide: 0.2 });
  });

  it('keeps ambiguous hands-free balance setup waiting and exposes the fallback after timeout', () => {
    const coordinator = createHandsFreeCoordinator();
    const nowMs = advanceThroughChair(coordinator, 0) + 100;
    expect(coordinator.receiveUserAction({ type: 'balance_setup_voice_completed' }, nowMs)).toBe(true);

    feedOutput(
      coordinator,
      trackingOutput(balanceRaw(nowMs + 100, 'left', true), 0.3, { leftSide: 0.2, rightSide: 0.2 }),
      nowMs + 100
    );
    feedOutput(
      coordinator,
      trackingOutput(balanceRaw(nowMs + 1400, 'left', true), 0.3, { leftSide: 0.2, rightSide: 0.2 }),
      nowMs + 1400
    );
    expect(coordinator.snapshot(nowMs + 1400).stage).toBe('balance_setup');
    expect(coordinator.snapshot(nowMs + 1400).handsFreeFallbackAvailable).toBe(false);

    coordinator.receiveTimerTick(nowMs + 10200);
    const snapshot = coordinator.snapshot(nowMs + 10200);
    expect(snapshot.stage).toBe('balance_setup');
    expect(snapshot.handsFreeFallbackAvailable).toBe(true);
  });

  it('requires a two-foot setup stance before waiting for the balance lift', () => {
    const coordinator = createHandsFreeCoordinator();
    let nowMs = advanceThroughChair(coordinator, 0) + 100;
    expect(coordinator.receiveUserAction({ type: 'balance_setup_voice_completed' }, nowMs)).toBe(true);
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 100, 'left', true)), nowMs + 100);
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 1400, 'left', true)), nowMs + 1400);
    expect(coordinator.snapshot(nowMs + 1400).stage).toBe('balance_setup');

    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 1500, 'left', false)), nowMs + 1500);
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 2800, 'left', false)), nowMs + 2800);
    expect(coordinator.snapshot(nowMs + 2800).stage).toBe('balance_ready');
  });

  it('waits for the attempt voice boundary before starting from a held lift', () => {
    const coordinator = createHandsFreeCoordinator();
    let nowMs = advanceThroughChair(coordinator, 0) + 100;
    expect(coordinator.receiveUserAction({ type: 'balance_setup_voice_completed' }, nowMs)).toBe(true);
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 100, 'left', false)), nowMs + 100);
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 1400, 'left', false)), nowMs + 1400);
    expect(coordinator.snapshot(nowMs + 1400).stage).toBe('balance_ready');

    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 1500, 'left', true)), nowMs + 1500);
    expect(coordinator.snapshot(nowMs + 1500).stage).toBe('balance_ready');
    expect(coordinator.receiveUserAction({ type: 'balance_attempt_voice_completed' }, nowMs + 1600)).toBe(true);
    confirmBalanceLift(coordinator, nowMs + 1700, 'left');
  });

  it('preserves camera-inferred changed-leg metadata through the balance result', () => {
    const coordinator = createHandsFreeCoordinator({ priorStandingLeg: 'right', standingLeg: 'right' });
    let nowMs = advanceThroughChair(coordinator, 0) + 100;
    expect(coordinator.snapshot(nowMs).stage).toBe('balance_setup');
    expect(coordinator.receiveUserAction({ type: 'balance_setup_voice_completed' }, nowMs)).toBe(true);
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 100, 'right', false)), nowMs + 100);
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs + 1400, 'right', false)), nowMs + 1400);
    expect(coordinator.snapshot(nowMs + 1400).stage).toBe('balance_ready');
    nowMs = startHandsFreeBalanceTrialFromReady(coordinator, nowMs + 1500, 'left');
    nowMs = finishBalanceByTouchdownAfter(coordinator, nowMs, 'left', 20000);
    expect(coordinator.receiveUserAction({ type: 'balance_use_result' }, nowMs + 1)).toBe(true);

    const snapshot = coordinator.snapshot(nowMs + 1);
    const balance = snapshot.flow.items.find((item) => item.movementId === ONE_LEG_BALANCE_V2_ID)?.result as
      | { setup?: { source?: string; standingLeg?: BodySide; priorStandingLeg?: BodySide | null; changedFromPrior?: boolean } | null }
      | undefined;
    expect(balance?.setup).toMatchObject({
      source: 'camera_inferred',
      standingLeg: 'left',
      priorStandingLeg: 'right',
      changedFromPrior: true,
    });
  });

  it('clears the active balance timer and shows rest after a valid 20-second touchdown', () => {
    const coordinator = createCoordinator();
    let nowMs = advanceThroughChair(coordinator, 0) + 100;
    const trialReadyFrameMs = startBalanceTrial(coordinator, nowMs, 'left');
    const trialStartedAtMs = coordinator.snapshot(trialReadyFrameMs).lastTransition?.atMs;
    if (typeof trialStartedAtMs !== 'number') throw new Error('expected balance trial transition');
    const staleTrialDeadlineMs = trialStartedAtMs + 45000;

    nowMs = finishBalanceByTouchdownAt(coordinator, trialStartedAtMs, 'left', trialStartedAtMs + 20000);
    let snapshot = coordinator.snapshot(nowMs);
    expect(snapshot.stage).toBe('balance_rest');
    expect(snapshot.balanceBestHoldSec).toBeCloseTo(20, 6);
    expect(snapshot.statusText).toBe('Rest before the next attempt. The minimum rest cannot be skipped.');
    expect(snapshot.balanceTimerKind).toBe('rest');
    expect(snapshot.timerRemainingMs).toBeNull();
    expect(snapshot.restMinimumRemainingMs).toBeGreaterThan(0);
    expect(snapshot.lastTransition?.reason).toBe('balance_valid_trial_rest');

    coordinator.receiveTimerTick(staleTrialDeadlineMs);
    snapshot = coordinator.snapshot(staleTrialDeadlineMs);
    expect(snapshot.stage).toBe('balance_rest');
    expect(snapshot.balanceTimerKind).toBe('rest');
    expect(snapshot.timerRemainingMs).toBeNull();
  });

  it('clears the active balance timer when support touch or stop saves an attempt', () => {
    const supportTouched = createCoordinator();
    let nowMs = advanceThroughChair(supportTouched, 0) + 100;
    let trialStartedAtMs = startBalanceTrial(supportTouched, nowMs, 'left');
    expect(supportTouched.receiveUserAction({ type: 'balance_support_touched' }, trialStartedAtMs + 500)).toBe(true);
    expect(supportTouched.snapshot(trialStartedAtMs + 500)).toMatchObject({
      stage: 'balance_rest',
      balanceTimerKind: 'rest',
      timerRemainingMs: null,
    });

    const stopped = createCoordinator();
    nowMs = advanceThroughChair(stopped, 0) + 100;
    trialStartedAtMs = startBalanceTrial(stopped, nowMs, 'left');
    expect(stopped.receiveUserAction({ type: 'balance_stop' }, trialStartedAtMs + 500)).toBe(true);
    expect(stopped.snapshot(trialStartedAtMs + 500)).toMatchObject({
      stage: 'balance_rest',
      balanceTimerKind: 'rest',
      timerRemainingMs: null,
    });
  });

  it('offers hands-free balance attempts two and three after non-ceiling valid trials before saving the best', () => {
    const coordinator = createHandsFreeCoordinator();
    let nowMs = advanceThroughChair(coordinator, 0) + 100;
    nowMs = startHandsFreeBalanceTrialFromSetup(coordinator, nowMs, 'left');
    nowMs = finishBalanceByTouchdownAfter(coordinator, nowMs, 'left', 20000);

    let snapshot = coordinator.snapshot(nowMs);
    expect(snapshot.stage).toBe('balance_rest');
    expect(snapshot.statusText).toBe("Attempt saved. Rest before the next try.");
    expect(snapshot.balanceValidTrials).toBe(1);
    expect(snapshot.flow.items.find((item) => item.movementId === ONE_LEG_BALANCE_V2_ID)).toBeUndefined();

    coordinator.receiveTimerTick(nowMs + 29999);
    snapshot = coordinator.snapshot(nowMs + 29999);
    expect(snapshot.stage).toBe('balance_rest');

    coordinator.receiveTimerTick(nowMs + 30000);
    snapshot = coordinator.snapshot(nowMs + 30000);
    expect(snapshot.stage).toBe('balance_ready');
    expect(snapshot.statusText).toBe("Lift one foot again when you're ready.");
    expect(snapshot.lastTransition?.reason).toBe('balance_rest_ready');

    nowMs = startHandsFreeBalanceTrialFromReady(coordinator, nowMs + 30100, 'left');
    nowMs = finishBalanceByTouchdownAfter(coordinator, nowMs, 'left', 25000);
    snapshot = coordinator.snapshot(nowMs);
    expect(snapshot.stage).toBe('balance_rest');
    expect(snapshot.balanceValidTrials).toBe(2);
    expect(snapshot.flow.items.find((item) => item.movementId === ONE_LEG_BALANCE_V2_ID)).toBeUndefined();

    coordinator.receiveTimerTick(nowMs + 30000);
    expect(coordinator.snapshot(nowMs + 30000).stage).toBe('balance_ready');

    nowMs = startHandsFreeBalanceTrialFromReady(coordinator, nowMs + 30100, 'left');
    nowMs = finishBalanceByTouchdownAfter(coordinator, nowMs, 'left', 18000, 'shoulder_setup');
    snapshot = coordinator.snapshot(nowMs);
    const balance = snapshot.flow.items.find((item) => item.movementId === ONE_LEG_BALANCE_V2_ID)?.result as
      | { validTrialCount: number; bestHoldSec: number; declinedRemainingTrials: boolean }
      | undefined;
    expect(snapshot.stage).toBe('shoulder_setup');
    expect(snapshot.lastTransition?.reason).toBe('balance_section_complete');
    expect(balance?.validTrialCount).toBe(3);
    expect(balance?.bestHoldSec).toBeCloseTo(25, 0);
    expect(balance?.declinedRemainingTrials).toBe(false);
  });

  it('auto-saves balance immediately when the first hands-free attempt reaches the 45-second ceiling', () => {
    const coordinator = createHandsFreeCoordinator();
    let nowMs = advanceThroughChair(coordinator, 0) + 100;
    nowMs = startHandsFreeBalanceTrialFromSetup(coordinator, nowMs, 'left');
    // The subject keeps holding on camera through the whole ceiling window —
    // a ceiling is only credited while frames flow.
    for (let heldMs = nowMs + 250; heldMs < nowMs + 45000; heldMs += 250) {
      feedOutput(coordinator, trackingOutput(balanceRaw(heldMs, 'left', true)), heldMs);
    }
    coordinator.receiveTimerTick(nowMs + 45000);

    const snapshot = coordinator.snapshot(nowMs + 45000);
    const balance = snapshot.flow.items.find((item) => item.movementId === ONE_LEG_BALANCE_V2_ID)?.result as
      | { validTrialCount: number; trials: { termination: string }[] }
      | undefined;
    expect(snapshot.stage).toBe('shoulder_setup');
    expect(snapshot.lastTransition?.reason).toBe('balance_section_complete');
    expect(balance?.validTrialCount).toBe(1);
    expect(balance?.trials[0]?.termination).toBe('ceiling');
  });

  it('never credits wall-clock results while pose frames are stalled', () => {
    // Balance: frames stop mid-trial; the ceiling tick invalidates the
    // attempt instead of crediting an unobserved maximal hold.
    const balanceStalled = createCoordinator();
    let nowMs = advanceThroughChair(balanceStalled, 0) + 100;
    nowMs = startBalanceTrial(balanceStalled, nowMs, 'left');
    balanceStalled.receiveTimerTick(nowMs + 45000);
    let snapshot = balanceStalled.snapshot(nowMs + 45000);
    expect(snapshot.stage).toBe('balance_rest');
    expect(snapshot.balanceValidTrials).toBe(0);
    expect(snapshot.diagnostics.balance.invalidTrials).toBe(1);

    // Chair: frames stop mid-official-window; the deadline restarts the test
    // instead of recording a silently truncated official result.
    const chairStalled = createCoordinator();
    const activeAt = advanceToChairActive(chairStalled, 0);
    chairStalled.receiveTimerTick(activeAt + 30000);
    snapshot = chairStalled.snapshot(activeAt + 30000);
    expect(snapshot.stage).toBe('chair_countdown');
    expect(snapshot.flow.items.find((item) => item.movementId === CHAIR_RISE_V2_ID)).toBeUndefined();
    expect(snapshot.recoveryEpisode).toMatchObject({ item: 'chair', targetStage: 'chair_countdown' });
  });

  it('keeps invalid tracking balance attempts out of the valid attempt count', () => {
    const coordinator = createCoordinator();
    let nowMs = advanceThroughChair(coordinator, 0) + 100;
    nowMs = startBalanceTrial(coordinator, nowMs, 'left') + 300;
    for (let index = 1; index <= 4; index++) {
      feedOutput(coordinator, lostOutput(nowMs + index * 33), nowMs + index * 33);
    }

    const snapshot = coordinator.snapshot(nowMs + 200);
    expect(snapshot.stage).toBe('balance_rest');
    expect(snapshot.balanceValidTrials).toBe(0);
    expect(snapshot.diagnostics.balance.invalidTrials).toBe(1);
    expect(snapshot.flow.items.find((item) => item.movementId === ONE_LEG_BALANCE_V2_ID)).toBeUndefined();
  });

  it('uses hard-cap auto-save for the best valid balance attempt and records no-measurement when no valid attempt exists', () => {
    const withValidBest = createHandsFreeCoordinator();
    let nowMs = advanceThroughChair(withValidBest, 0) + 100;
    nowMs = startHandsFreeBalanceTrialFromSetup(withValidBest, nowMs, 'left');
    nowMs = finishBalanceByTouchdownAfter(withValidBest, nowMs, 'left', 20000);
    withValidBest.receiveTimerTick(nowMs + 360000);
    let snapshot = withValidBest.snapshot(nowMs + 360000);
    const validBestBalance = snapshot.flow.items.find((item) => item.movementId === ONE_LEG_BALANCE_V2_ID)?.result as
      | { validTrialCount: number; hardCapReached: boolean; declinedRemainingTrials: boolean }
      | undefined;
    expect(snapshot.stage).toBe('shoulder_setup');
    expect(snapshot.lastTransition?.reason).toBe('balance_hard_cap');
    expect(validBestBalance).toMatchObject({ validTrialCount: 1, hardCapReached: true, declinedRemainingTrials: true });

    const noValid = createCoordinator();
    nowMs = advanceThroughChair(noValid, 0) + 100;
    expect(noValid.receiveUserAction({ type: 'confirm_balance_setup', standingLeg: 'left' }, nowMs)).toBe(true);
    noValid.receiveTimerTick(nowMs + 360000);
    snapshot = noValid.snapshot(nowMs + 360000);
    const noValidBalance = snapshot.flow.items.find((item) => item.movementId === ONE_LEG_BALANCE_V2_ID)?.result as
      | { validTrialCount: number; hardCapReached: boolean; flags: string[] }
      | undefined;
    expect(snapshot.stage).toBe('shoulder_setup');
    expect(noValidBalance?.validTrialCount).toBe(0);
    expect(noValidBalance?.hardCapReached).toBe(true);
    expect(noValidBalance?.flags).toEqual(expect.arrayContaining(['no-measurement', 'protocol-incomplete']));
  });

  it('infers shoulder side and starts shoulder plus hinge captures hands-free from stable capture poses', () => {
    const shoulderCoordinator = createHandsFreeCoordinator();
    let nowMs = advanceThroughShoulderSetup(shoulderCoordinator, 0);
    expect(shoulderCoordinator.snapshot(nowMs).stage).toBe('shoulder_setup');
    expect(shoulderCoordinator.receiveUserAction({ type: 'shoulder_transition_voice_completed' }, nowMs)).toBe(true);

    feedOutput(
      shoulderCoordinator,
      trackingOutput(shoulderRaw(nowMs + 100, 'right'), 0.3, { leftSide: 0.3, rightSide: 0.95, rightArm: 0.95 }),
      nowMs + 100
    );
    feedOutput(
      shoulderCoordinator,
      trackingOutput(shoulderRaw(nowMs + 1400, 'right'), 0.3, { leftSide: 0.3, rightSide: 0.95, rightArm: 0.95 }),
      nowMs + 1400
    );
    let snapshot = shoulderCoordinator.snapshot(nowMs + 1400);
    expect(snapshot.stage).toBe('shoulder_ready');
    expect(snapshot.flow.shoulderSide).toBe('right');

    expect(shoulderCoordinator.receiveUserAction({ type: 'shoulder_setup_voice_completed' }, nowMs + 1500)).toBe(true);
    feedOutput(shoulderCoordinator, trackingOutput(shoulderRaw(nowMs + 1600, 'right')), nowMs + 1600);
    feedOutput(shoulderCoordinator, trackingOutput(shoulderRaw(nowMs + 2900, 'right')), nowMs + 2900);
    snapshot = shoulderCoordinator.snapshot(nowMs + 2900);
    expect(snapshot.stage).toBe('shoulder_active');
    expect(snapshot.diagnostics.shoulder.attempts).toBe(1);

    const hingeCoordinator = createHandsFreeCoordinator();
    nowMs = completeLiveCheckupUntilHinge(hingeCoordinator);
    expect(hingeCoordinator.snapshot(nowMs).stage).toBe('hinge_setup');
    expect(hingeCoordinator.receiveUserAction({ type: 'hinge_setup_voice_completed' }, nowMs)).toBe(true);
    feedOutput(hingeCoordinator, trackingOutput(hingeRaw(nowMs + 100)), nowMs + 100);
    feedOutput(hingeCoordinator, trackingOutput(hingeRaw(nowMs + 1400)), nowMs + 1400);
    expect(hingeCoordinator.snapshot(nowMs + 1400).stage).toBe('hinge_active');
  });

  it('keeps hands-free forward reach waiting while upright, then starts when folded', () => {
    const hingeCoordinator = createHandsFreeCoordinator();
    const nowMs = completeLiveCheckupUntilHinge(hingeCoordinator);
    expect(hingeCoordinator.snapshot(nowMs).stage).toBe('hinge_setup');
    expect(hingeCoordinator.receiveUserAction({ type: 'hinge_setup_voice_completed' }, nowMs)).toBe(true);

    feedOutput(hingeCoordinator, trackingOutput(uprightHingeSetupRaw(nowMs + 100)), nowMs + 100);
    feedOutput(hingeCoordinator, trackingOutput(uprightHingeSetupRaw(nowMs + 1400)), nowMs + 1400);

    let snapshot = hingeCoordinator.snapshot(nowMs + 1400);
    expect(snapshot.stage).toBe('hinge_setup');

    feedOutput(hingeCoordinator, trackingOutput(hingeRaw(nowMs + 1500)), nowMs + 1500);
    feedOutput(hingeCoordinator, trackingOutput(hingeRaw(nowMs + 2800)), nowMs + 2800);

    snapshot = hingeCoordinator.snapshot(nowMs + 2800);
    expect(snapshot.stage).toBe('hinge_active');
    expect(snapshot.diagnostics.hinge.captureValid).toBe(false);
    expect(snapshot.diagnostics.hinge.reachBu).toBeGreaterThan(0);
  });

  it('restarts interrupted official measures fresh after app backgrounding', () => {
    const chairInterrupted = createCoordinator();
    let nowMs = advanceToChairActive(chairInterrupted, 0);
    expect(chairInterrupted.snapshot(nowMs).stage).toBe('chair_active');
    expect(chairInterrupted.receiveUserAction({ type: 'backgrounded' }, nowMs + 1000)).toBe(true);
    let snapshot = chairInterrupted.snapshot(nowMs + 1000);
    // The truncated attempt is never recorded: the chair test restarts fresh,
    // same contract as tracking loss.
    expect(snapshot.stage).toBe('chair_countdown');
    expect(snapshot.flow.items.find((item) => item.movementId === CHAIR_RISE_V2_ID)).toBeUndefined();
    expect(snapshot.diagnostics.chair.trackingInterruptions).toBe(1);
    expect(snapshot.diagnostics.chair.officialReps).toBe(0);
    expect(snapshot.recoveryEpisode).toMatchObject({ item: 'chair', targetStage: 'chair_countdown' });
    expect(snapshot.recordingVisualGuidance).toMatchObject({
      visualState: 'recovery',
      reason: 'mpv2:backgrounded',
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: true,
    });

    const balanceInterrupted = createCoordinator();
    nowMs = advanceThroughChair(balanceInterrupted, 0) + 100;
    nowMs = startBalanceTrial(balanceInterrupted, nowMs, 'left');
    expect(balanceInterrupted.receiveUserAction({ type: 'backgrounded' }, nowMs + 500)).toBe(true);
    expect(balanceInterrupted.snapshot(nowMs + 500).stage).toBe('balance_rest');
    expect(balanceInterrupted.snapshot(nowMs + 500).diagnostics.balance.invalidTrials).toBe(1);

    const shoulderInterrupted = createCoordinator();
    nowMs = advanceThroughShoulderSetup(shoulderInterrupted, 0);
    expect(shoulderInterrupted.receiveUserAction({ type: 'confirm_shoulder_setup', shoulderSide: 'right' }, nowMs)).toBe(true);
    expect(shoulderInterrupted.receiveUserAction({ type: 'shoulder_setup_voice_completed' }, nowMs + 1)).toBe(true);
    expect(shoulderInterrupted.receiveUserAction({ type: 'start_shoulder_capture' }, nowMs + 100)).toBe(true);
    expect(shoulderInterrupted.receiveUserAction({ type: 'backgrounded' }, nowMs + 500)).toBe(true);
    snapshot = shoulderInterrupted.snapshot(nowMs + 500);
    expect(snapshot.stage).toBe('shoulder_retry_ready');
    expect(snapshot.recoveryEpisode).toMatchObject({ item: 'shoulder', targetStage: 'shoulder_retry_ready' });
    expect(snapshot.flow.items.find((item) => item.movementId === ACTIVE_SHOULDER_REACH_V2_ID)).toBeUndefined();

    const hingeInterrupted = createCoordinator();
    nowMs = completeLiveCheckupUntilHinge(hingeInterrupted);
    expect(hingeInterrupted.receiveUserAction({ type: 'hinge_setup_voice_completed' }, nowMs - 1)).toBe(true);
    expect(hingeInterrupted.receiveUserAction({ type: 'start_hinge_capture' }, nowMs)).toBe(true);
    expect(hingeInterrupted.receiveUserAction({ type: 'backgrounded' }, nowMs + 500)).toBe(true);
    snapshot = hingeInterrupted.snapshot(nowMs + 500);
    // The check-up is NOT force-completed with a missing hinge: the hinge
    // capture restarts and the check-up completes with a real measurement.
    expect(snapshot.stage).toBe('hinge_setup');
    expect(snapshot.checkUp).toBeNull();
    expect(snapshot.recoveryEpisode).toMatchObject({ item: 'hinge', targetStage: 'hinge_setup' });

    expect(hingeInterrupted.receiveUserAction({ type: 'resumed' }, nowMs + 600)).toBe(true);
    expect(hingeInterrupted.receiveUserAction({ type: 'hinge_setup_voice_completed' }, nowMs + 700)).toBe(true);
    expect(hingeInterrupted.receiveUserAction({ type: 'start_hinge_capture' }, nowMs + 800)).toBe(true);
    feedHingeCapture(hingeInterrupted, nowMs + 900);
    hingeInterrupted.receiveTimerTick(nowMs + 800 + 9200);
    snapshot = hingeInterrupted.snapshot(nowMs + 800 + 9200);
    expect(snapshot.stage).toBe('raw_complete');
    expect(snapshot.checkUp?.items.map((item) => item.movementId)).toEqual([
      CHAIR_RISE_V2_ID,
      ONE_LEG_BALANCE_V2_ID,
      ACTIVE_SHOULDER_REACH_V2_ID,
      HINGE_REACH_ID,
    ]);
    const hinge = snapshot.checkUp?.items.find((item) => item.movementId === HINGE_REACH_ID)?.result as
      | { reachBu?: number | null }
      | undefined;
    expect(hinge?.reachBu).not.toBeNull();
    expectJsonSafe(snapshot.checkUp);
  });

  it('clears the backgrounded interruption state once the app resumes', () => {
    const coordinator = createCoordinator();
    const nowMs = advanceThroughChair(coordinator, 0) + 100;
    expect(coordinator.receiveUserAction({ type: 'backgrounded' }, nowMs)).toBe(true);
    let snapshot = coordinator.snapshot(nowMs);
    expect(snapshot.backgrounded).toBe(true);
    expect(snapshot.flow.backgrounded).toBe(true);
    expect(snapshot.recordingVisualGuidance).toMatchObject({
      visualState: 'recovery',
      reason: 'mpv2:backgrounded',
    });

    expect(coordinator.receiveUserAction({ type: 'resumed' }, nowMs + 500)).toBe(true);
    snapshot = coordinator.snapshot(nowMs + 500);
    expect(snapshot.backgrounded).toBe(false);
    expect(snapshot.flow.backgrounded).toBe(false);
    expect(snapshot.recordingVisualGuidance.reason).not.toBe('mpv2:backgrounded');
  });

  it('records a support touch distinctly from a voluntary stop', () => {
    const coordinator = createCoordinator();
    const nowMs = advanceThroughChair(coordinator, 0) + 100;
    const trialStartMs = startBalanceTrial(coordinator, nowMs, 'left');
    expect(coordinator.receiveUserAction({ type: 'balance_support_touched' }, trialStartMs + 5000)).toBe(true);

    coordinator.receiveTimerTick(trialStartMs + 35000);
    expect(coordinator.snapshot(trialStartMs + 35100).stage).toBe('balance_ready');
    expect(coordinator.receiveUserAction({ type: 'balance_use_result' }, trialStartMs + 35200)).toBe(true);
    const balance = coordinator.snapshot(trialStartMs + 35200).flow.items.find(
      (item) => item.movementId === ONE_LEG_BALANCE_V2_ID
    )?.result as { trials?: { termination?: string }[] } | undefined;
    expect(balance?.trials?.[0]?.termination).toBe('support_touched');
  });

  it('invalidates active tracking loss into one recovery episode without resuming partial attempts', () => {
    const chairInterrupted = createCoordinator();
    let nowMs = advanceToChairActive(chairInterrupted, 0);
    for (let index = 1; index <= 4; index++) {
      feedOutput(chairInterrupted, lostOutput(nowMs + index * 33), nowMs + index * 33);
    }
    let snapshot = chairInterrupted.snapshot(nowMs + 200);
    expect(snapshot.stage).toBe('chair_countdown');
    expect(snapshot.chairReps).toBe(0);
    expect(snapshot.recoveryEpisode).toMatchObject({
      item: 'chair',
      targetStage: 'chair_countdown',
      partialAttemptInvalidated: true,
      freshStartRequired: true,
    });
    expect(snapshot.recordingVisualGuidance).toMatchObject({
      visualState: 'recovery',
      reason: 'mpv2:recovery',
      blocksMeasurement: true,
      blocksAutoStart: true,
      metricProtected: true,
      voiceCue: null,
    });
    expect(snapshot.diagnostics.recovery.episodeCount).toBe(1);
    expect(snapshot.lastTransition?.reason).toBe('chair_tracking_loss_recovery_countdown');

    const shoulderInterrupted = createCoordinator();
    nowMs = advanceThroughShoulderSetup(shoulderInterrupted, 0);
    expect(shoulderInterrupted.receiveUserAction({ type: 'confirm_shoulder_setup', shoulderSide: 'right' }, nowMs)).toBe(true);
    expect(shoulderInterrupted.receiveUserAction({ type: 'shoulder_setup_voice_completed' }, nowMs + 1)).toBe(true);
    expect(shoulderInterrupted.receiveUserAction({ type: 'start_shoulder_capture' }, nowMs + 100)).toBe(true);
    for (let index = 1; index <= 4; index++) {
      feedOutput(shoulderInterrupted, lostOutput(nowMs + 100 + index * 33), nowMs + 100 + index * 33);
    }
    snapshot = shoulderInterrupted.snapshot(nowMs + 300);
    expect(snapshot.stage).toBe('shoulder_retry_ready');
    expect(snapshot.flow.shoulderSide).toBe('right');
    expect(snapshot.recoveryEpisode).toMatchObject({
      item: 'shoulder',
      itemSpecificCue: 'mpv2_shoulder_tracking_retry',
      targetStage: 'shoulder_retry_ready',
    });

    const hingeInterrupted = createCoordinator();
    nowMs = completeLiveCheckupUntilHinge(hingeInterrupted);
    expect(hingeInterrupted.receiveUserAction({ type: 'hinge_setup_voice_completed' }, nowMs - 1)).toBe(true);
    expect(hingeInterrupted.receiveUserAction({ type: 'start_hinge_capture' }, nowMs)).toBe(true);
    for (let index = 1; index <= 4; index++) {
      feedOutput(hingeInterrupted, lostOutput(nowMs + index * 33), nowMs + index * 33);
    }
    snapshot = hingeInterrupted.snapshot(nowMs + 200);
    expect(snapshot.stage).toBe('hinge_setup');
    expect(snapshot.checkUp).toBeNull();
    expect(snapshot.recoveryEpisode).toMatchObject({
      item: 'hinge',
      targetStage: 'hinge_setup',
    });
  });

  it('lets terminal timer events win before same-boundary tracking loss', () => {
    const coordinator = createHandsFreeCoordinator();
    let nowMs = advanceThroughChair(coordinator, 0) + 100;
    nowMs = startHandsFreeBalanceTrialFromSetup(coordinator, nowMs, 'left');
    // The subject holds on camera through the whole ceiling window; the loss
    // frame arrives on the same boundary as the terminal ceiling tick.
    for (let heldMs = nowMs + 250; heldMs < nowMs + 45000; heldMs += 250) {
      feedOutput(coordinator, trackingOutput(balanceRaw(heldMs, 'left', true)), heldMs);
    }
    const deadline = nowMs + 45000;
    coordinator.receiveTimerTick(deadline);
    feedOutput(coordinator, lostOutput(deadline), deadline);
    const snapshot = coordinator.snapshot(deadline);
    expect(snapshot.stage).toBe('shoulder_setup');
    expect(snapshot.recoveryEpisode).toBeNull();
    expect(snapshot.lastTransition?.reason).toBe('balance_section_complete');
  });

  it('bounds shoulder retries and records the retry capture from live selected-side frames', () => {
    const coordinator = createCoordinator();
    let nowMs = advanceThroughShoulderSetup(coordinator, 0);

    expect(coordinator.receiveUserAction({ type: 'confirm_shoulder_setup', shoulderSide: 'right' }, nowMs)).toBe(true);
    expect(coordinator.receiveUserAction({ type: 'shoulder_setup_voice_completed' }, nowMs + 1)).toBe(true);
    expect(coordinator.receiveUserAction({ type: 'start_shoulder_capture' }, nowMs + 100)).toBe(true);
    coordinator.receiveTimerTick(nowMs + 9100);
    expect(coordinator.snapshot(nowMs + 9100).stage).toBe('shoulder_retry_ready');

    nowMs += 9200;
    expect(coordinator.receiveUserAction({ type: 'shoulder_setup_voice_completed' }, nowMs - 1)).toBe(true);
    expect(coordinator.receiveUserAction({ type: 'start_shoulder_capture' }, nowMs)).toBe(true);
    feedShoulderCapture(coordinator, nowMs + 100, 'right');
    coordinator.receiveTimerTick(nowMs + 9100);

    const snapshot = coordinator.snapshot(nowMs + 9100);
    const shoulder = snapshot.flow.items.find((item) => item.movementId === ACTIVE_SHOULDER_REACH_V2_ID)?.result as
      | { retryCount: number; peakFlexionDeg: number; selectedSide: BodySide | null }
      | undefined;
    expect(snapshot.stage).toBe('hinge_setup');
    expect(shoulder?.retryCount).toBe(1);
    expect(shoulder?.selectedSide).toBe('right');
    expect(shoulder?.peakFlexionDeg).toBeGreaterThan(90);
  });

  it('completes a raw V2 Check-Up from live headline items plus supporting hinge and materializes internal artifacts', () => {
    const coordinator = createCoordinator();
    const checkUp = completeLiveCheckup(coordinator);
    expect(checkUp).not.toBeNull();
    if (!checkUp) throw new Error('expected live check-up');

    expect(checkUp.items.map((item) => item.movementId)).toEqual([
      CHAIR_RISE_V2_ID,
      ONE_LEG_BALANCE_V2_ID,
      ACTIVE_SHOULDER_REACH_V2_ID,
      HINGE_REACH_ID,
    ]);
    expect(checkUp.movementProfileV2Snapshot).toBeUndefined();
    expect(checkUp.movementProfileV2Assessment).toBeUndefined();

    const snapshot = createMovementProfileV2Snapshot({
      checkUp,
      checkupType: 'baseline',
      referenceProfile: REFERENCE_PROFILE,
      createdAt: STARTED_AT,
    });
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) throw new Error(snapshot.reason);
    expect(snapshot.snapshot.interpretation.rawCompleteness).toMatchObject({
      referenceComplete: true,
      missingHeadlineMovementIds: [],
    });
    expect(snapshot.snapshot.interpretation.balance.claimEligibility).toBe('raw_only_protocol_incomplete');

    const assessment = createMovementProfileV2Assessment({
      checkUp,
      snapshot: snapshot.snapshot,
      createdAt: STARTED_AT,
    });
    expect(assessment).toMatchObject({ ok: true });
    if (!assessment.ok) throw new Error(assessment.reason);
    expect(assessment.assessment.focus.kind).toBe('domain');
    expect(buildMovementProfileV2ResultsViewModel({
      snapshot: snapshot.snapshot,
      assessment: assessment.assessment,
    }).focusTitle).toBeTruthy();

    const materialized = materializeOfficialMovementProfileV2Artifacts({
      checkUp,
      checkupType: 'baseline',
      referenceProfile: REFERENCE_PROFILE,
      acceptedHistory: [],
      snapshotCreatedAt: STARTED_AT,
      assessmentCreatedAt: STARTED_AT,
    });
    expect(materialized).toMatchObject({
      ok: true,
      createdSnapshot: true,
      createdAssessment: true,
    });
    if (!materialized.ok) throw new Error(materialized.reason);
    expect(materialized.checkUp.movementProfileV2Snapshot?.snapshotId).toBe(snapshot.snapshot.snapshotId);
    expect(materialized.checkUp.movementProfileV2Assessment?.assessmentId).toBe(
      assessment.assessment.assessmentId
    );
    expectJsonSafe(checkUp);
    expectJsonSafe(snapshot.snapshot);
    expectJsonSafe(assessment.assessment);
  });

  it('keeps live diagnostics opt-in and strips raw pose payloads from exports', () => {
    expect(parseMovementProfileV2DiagnosticsFlag('1')).toBe(true);
    expect(parseMovementProfileV2DiagnosticsFlag('true')).toBe(false);
    expect(isMovementProfileV2DiagnosticsEnabled({ internalFlag: '0', diagnosticsFlag: '1' })).toBe(false);
    expect(isMovementProfileV2DiagnosticsEnabled({ internalFlag: '1', diagnosticsFlag: '1' })).toBe(true);

    const coordinator = createCoordinator();
    for (let index = 0; index < 120; index++) {
      coordinator.receiveUserAction({ type: 'confirm_chair_setup' }, index * 1000);
      coordinator.receiveUserAction({ type: 'backgrounded' }, index * 1000 + 1);
      coordinator.receiveUserAction({ type: 'resumed' }, index * 1000 + 2);
    }
    const exported = serializeMovementProfileV2LiveDiagnostics(coordinator.exportDiagnostics());
    const parsed = JSON.parse(exported);
    expect(parsed.stateTransitions.length).toBeLessThanOrEqual(80);
    expect(exported).not.toMatch(/landmarks|xs|ys|visibility|presence/);
  });

  it('does not expose canned V2 measurement controls from the internal live screen', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx'),
      'utf8'
    );

    expect(source).not.toMatch(/createCaptured(?:ChairRise|OneLegBalance|ActiveShoulderReach|HingeReach)V2?Result/);
    expect(source).not.toContain('Record result');
    expect(source).not.toContain('reps: 12');
    expect(source).not.toContain('holdsSec: [28, 31, 30]');
    expect(source).not.toContain('peakFlexionDeg: 154');
    expect(source).not.toContain('createCapturedHingeReachResult(0.24)');
  });
});

function createCoordinator(): MovementProfileV2LiveCoordinator {
  return new MovementProfileV2LiveCoordinator({
    ...createMovementProfileV2InternalFlow({ startedAt: STARTED_AT }),
    sourceType: 'baseline',
  });
}

function createHandsFreeCoordinator(
  overrides: Partial<ReturnType<typeof createMovementProfileV2InternalFlow>> = {}
): MovementProfileV2LiveCoordinator {
  return new MovementProfileV2LiveCoordinator({
    ...createMovementProfileV2InternalFlow({ startedAt: STARTED_AT }),
    ...overrides,
    sourceType: 'baseline',
  }, { handsFreeMode: true });
}

function completeLiveCheckup(coordinator: MovementProfileV2LiveCoordinator): CheckUp | null {
  let nowMs = completeLiveCheckupUntilHinge(coordinator);

  expect(coordinator.snapshot(nowMs).stage).toBe('hinge_setup');
  expect(coordinator.receiveUserAction({ type: 'hinge_setup_voice_completed' }, nowMs - 1)).toBe(true);
  expect(coordinator.receiveUserAction({ type: 'start_hinge_capture' }, nowMs)).toBe(true);
  feedHingeCapture(coordinator, nowMs + 100);
  coordinator.receiveTimerTick(nowMs + 9200);
  return coordinator.snapshot(nowMs + 9200).checkUp;
}

function completeLiveCheckupUntilHinge(coordinator: MovementProfileV2LiveCoordinator): number {
  let nowMs = advanceThroughShoulderSetup(coordinator, 0);
  expect(coordinator.receiveUserAction({ type: 'confirm_shoulder_setup', shoulderSide: 'right' }, nowMs)).toBe(true);
  expect(coordinator.receiveUserAction({ type: 'shoulder_setup_voice_completed' }, nowMs + 1)).toBe(true);
  expect(coordinator.receiveUserAction({ type: 'start_shoulder_capture' }, nowMs + 100)).toBe(true);
  feedShoulderCapture(coordinator, nowMs + 200, 'right');
  coordinator.receiveTimerTick(nowMs + 9200);
  return nowMs + 9300;
}

function advanceThroughShoulderSetup(coordinator: MovementProfileV2LiveCoordinator, startMs: number): number {
  let nowMs = advanceThroughChair(coordinator, startMs) + 100;
  nowMs = startBalanceTrial(coordinator, nowMs, 'left');
  nowMs = finishBalanceByTouchdown(coordinator, nowMs, 'left');
  expect(coordinator.receiveUserAction({ type: 'balance_use_result' }, nowMs + 100)).toBe(true);
  return nowMs + 200;
}

function advanceThroughChair(coordinator: MovementProfileV2LiveCoordinator, startMs: number): number {
  coordinator.receiveUserAction({ type: 'confirm_chair_setup' }, startMs);
  coordinator.receiveUserAction({ type: 'chair_practice_voice_completed' }, startMs + 1);
  const session = chairStandSession({
    seed: 202,
    noiseAmp: 0,
    calibrationMs: 100,
    riseMsPerRep: [900, 900, 900, 900, 900, 900, 900, 900, 900, 900],
    sitMs: 600,
    settleMs: 300,
    topMs: 400,
    descendMs: 700,
    restMs: 500,
    tailMs: 1000,
    nearSide: 'right',
  });
  let nowMs = startMs;
  for (const raw of session.frames) {
    nowMs = startMs + raw.timestampMs + 1;
    coordinator.receiveTimerTick(nowMs);
    feedOutput(
      coordinator,
      trackingOutput({ ...raw, timestampMs: nowMs }, session.truth.bodyUnit, { leftSide: 0.3, rightSide: 0.95 }),
      nowMs
    );
    coordinator.receiveTimerTick(nowMs);
    if (coordinator.snapshot(nowMs).stage === 'chair_countdown') {
      coordinator.receiveUserAction({ type: 'chair_official_ready_voice_completed' }, nowMs + 1);
      coordinator.receiveUserAction({ type: 'chair_countdown_started' }, nowMs + 2);
      coordinator.receiveUserAction({ type: 'chair_go_playback_started' }, nowMs + 3);
    }
    if (coordinator.snapshot(nowMs).stage === 'balance_setup') return nowMs;
  }
  // Keep the camera live (subject seated) until the official window's
  // wall-clock deadline fires: deadlines only credit results while frames flow.
  const lastRaw = session.frames[session.frames.length - 1];
  for (let keepAliveMs = nowMs + 250; keepAliveMs <= nowMs + 40000; keepAliveMs += 250) {
    coordinator.receiveTimerTick(keepAliveMs);
    if (coordinator.snapshot(keepAliveMs).stage === 'balance_setup') return keepAliveMs;
    feedOutput(
      coordinator,
      trackingOutput({ ...lastRaw, timestampMs: keepAliveMs }, session.truth.bodyUnit, { leftSide: 0.3, rightSide: 0.95 }),
      keepAliveMs
    );
  }
  throw new Error('chair official window did not complete');
}

function advanceToChairActive(coordinator: MovementProfileV2LiveCoordinator, startMs: number): number {
  coordinator.receiveUserAction({ type: 'confirm_chair_setup' }, startMs);
  coordinator.receiveUserAction({ type: 'chair_practice_voice_completed' }, startMs + 1);
  const session = chairStandSession({
    seed: 303,
    noiseAmp: 0,
    calibrationMs: 100,
    riseMsPerRep: [900, 900, 900],
    sitMs: 600,
    settleMs: 300,
    topMs: 400,
    descendMs: 700,
    restMs: 500,
    tailMs: 1000,
    nearSide: 'right',
  });
  let nowMs = startMs;
  for (const raw of session.frames) {
    nowMs = startMs + raw.timestampMs + 1;
    feedOutput(
      coordinator,
      trackingOutput({ ...raw, timestampMs: nowMs }, session.truth.bodyUnit, { leftSide: 0.3, rightSide: 0.95 }),
      nowMs
    );
    if (coordinator.snapshot(nowMs).stage === 'chair_countdown') {
      coordinator.receiveTimerTick(nowMs + 3000);
      expect(coordinator.snapshot(nowMs + 3000).stage).toBe('chair_countdown');
      coordinator.receiveUserAction({ type: 'chair_official_ready_voice_completed' }, nowMs + 1);
      coordinator.receiveUserAction({ type: 'chair_countdown_started' }, nowMs + 2);
      coordinator.receiveUserAction({ type: 'chair_go_playback_started' }, nowMs + 3);
      return nowMs + 3;
    }
  }
  throw new Error('chair active not reached');
}

function advanceToChairCountdown(coordinator: MovementProfileV2LiveCoordinator, startMs: number): number {
  coordinator.receiveUserAction({ type: 'confirm_chair_setup' }, startMs);
  coordinator.receiveUserAction({ type: 'chair_practice_voice_completed' }, startMs + 1);
  const session = chairStandSession({
    seed: 404,
    noiseAmp: 0,
    calibrationMs: 100,
    riseMsPerRep: [900],
    sitMs: 600,
    settleMs: 300,
    topMs: 400,
    descendMs: 700,
    restMs: 500,
    tailMs: 1000,
    nearSide: 'right',
  });
  let nowMs = startMs;
  for (const raw of session.frames) {
    nowMs = startMs + raw.timestampMs + 1;
    feedOutput(
      coordinator,
      trackingOutput({ ...raw, timestampMs: nowMs }, session.truth.bodyUnit, { leftSide: 0.3, rightSide: 0.95 }),
      nowMs
    );
    if (coordinator.snapshot(nowMs).stage === 'chair_countdown') return nowMs;
  }
  throw new Error('chair countdown not reached');
}

function startBalanceTrial(
  coordinator: MovementProfileV2LiveCoordinator,
  startMs: number,
  standingLeg: BodySide
): number {
  expect(coordinator.receiveUserAction({ type: 'confirm_balance_setup', standingLeg }, startMs)).toBe(true);
  expect(coordinator.receiveUserAction({ type: 'balance_attempt_voice_completed' }, startMs + 1)).toBe(true);
  feedOutput(coordinator, trackingOutput(balanceRaw(startMs + 100, standingLeg, false)), startMs + 100);
  return confirmBalanceLift(coordinator, startMs + 200, standingLeg);
}

/**
 * Feed a continuous lift burst (33 ms cadence) until the confirmation window
 * elapses and the trial starts. Returns the first lift frame's timestamp — the
 * retro-dated trial clock start.
 */
function confirmBalanceLift(
  coordinator: MovementProfileV2LiveCoordinator,
  firstLiftMs: number,
  standingLeg: BodySide,
  chainReliability?: Partial<Record<(typeof CHAIN_IDS)[number], number>>
): number {
  let nowMs = firstLiftMs;
  for (let index = 0; index <= 6; index++) {
    nowMs = firstLiftMs + index * 33;
    feedOutput(
      coordinator,
      trackingOutput(balanceRaw(nowMs, standingLeg, true), 0.3, chainReliability),
      nowMs
    );
    if (coordinator.snapshot(nowMs).stage === 'balance_trial') break;
  }
  expect(coordinator.snapshot(nowMs).stage).toBe('balance_trial');
  return firstLiftMs;
}

function startHandsFreeBalanceTrialFromSetup(
  coordinator: MovementProfileV2LiveCoordinator,
  startMs: number,
  standingLeg: BodySide
): number {
  expect(coordinator.snapshot(startMs).stage).toBe('balance_setup');
  expect(coordinator.receiveUserAction({ type: 'balance_setup_voice_completed' }, startMs)).toBe(true);
  feedOutput(coordinator, trackingOutput(balanceRaw(startMs + 100, standingLeg, false)), startMs + 100);
  feedOutput(coordinator, trackingOutput(balanceRaw(startMs + 1400, standingLeg, false)), startMs + 1400);
  expect(coordinator.snapshot(startMs + 1400).stage).toBe('balance_ready');
  return startHandsFreeBalanceTrialFromReady(coordinator, startMs + 1500, standingLeg);
}

function startHandsFreeBalanceTrialFromReady(
  coordinator: MovementProfileV2LiveCoordinator,
  startMs: number,
  standingLeg: BodySide
): number {
  expect(coordinator.snapshot(startMs).stage).toBe('balance_ready');
  expect(coordinator.receiveUserAction({ type: 'balance_attempt_voice_completed' }, startMs)).toBe(true);
  return confirmBalanceLift(coordinator, startMs + 100, standingLeg);
}

function finishBalanceByTouchdown(
  coordinator: MovementProfileV2LiveCoordinator,
  startMs: number,
  standingLeg: BodySide
): number {
  let nowMs = startMs;
  for (let index = 1; index <= 8; index++) {
    nowMs = startMs + index * 250;
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs, standingLeg, true)), nowMs);
  }
  for (let index = 1; index <= 4; index++) {
    nowMs += 33;
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs, standingLeg, false)), nowMs);
  }
  expect(coordinator.snapshot(nowMs).stage).toBe('balance_rest');
  return nowMs;
}

function finishBalanceByTouchdownAfter(
  coordinator: MovementProfileV2LiveCoordinator,
  trialStartedAtMs: number,
  standingLeg: BodySide,
  holdMs: number,
  expectedStage: 'balance_rest' | 'shoulder_setup' = 'balance_rest'
): number {
  let nowMs = trialStartedAtMs + holdMs;
  feedOutput(coordinator, trackingOutput(balanceRaw(nowMs, standingLeg, true)), nowMs);
  for (let index = 1; index <= 4; index++) {
    nowMs += 33;
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs, standingLeg, false)), nowMs);
  }
  expect(coordinator.snapshot(nowMs).stage).toBe(expectedStage);
  return nowMs;
}

function finishBalanceByTouchdownAt(
  coordinator: MovementProfileV2LiveCoordinator,
  trialStartedAtMs: number,
  standingLeg: BodySide,
  touchdownAtMs: number,
  expectedStage: 'balance_rest' | 'shoulder_setup' = 'balance_rest'
): number {
  let nowMs = Math.max(trialStartedAtMs, touchdownAtMs);
  for (let index = 0; index < 4; index++) {
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs, standingLeg, false)), nowMs);
    if (index < 3) nowMs += 33;
  }
  expect(coordinator.snapshot(nowMs).stage).toBe(expectedStage);
  return nowMs;
}

function feedShoulderCapture(
  coordinator: MovementProfileV2LiveCoordinator,
  startMs: number,
  side: BodySide
): number {
  let nowMs = startMs;
  for (const offset of [0, 1000, 2000, 3200]) {
    nowMs = startMs + offset;
    feedOutput(coordinator, trackingOutput(shoulderRaw(nowMs, side)), nowMs);
  }
  return nowMs;
}

function feedHingeCapture(coordinator: MovementProfileV2LiveCoordinator, startMs: number): number {
  let nowMs = startMs;
  for (const offset of [0, 1000, 2000, 3200]) {
    nowMs = startMs + offset;
    feedOutput(coordinator, trackingOutput(hingeRaw(nowMs)), nowMs);
  }
  return nowMs;
}

function feedOutput(
  coordinator: MovementProfileV2LiveCoordinator,
  output: PipelineFrameOutput,
  timestampMs: number,
  options: {
    frameId?: string | number;
    receivedAtMs?: number;
    movementEpochId?: string;
  } = {}
): void {
  const snapshot = coordinator.snapshot(options.receivedAtMs ?? timestampMs);
  const sample = createMovementProfileV2LivePoseSample({
    frameId: options.frameId ?? timestampMs,
    eventTimestampMs: timestampMs,
    receivedAtMs: options.receivedAtMs ?? timestampMs,
    sourceWidth: 480,
    sourceHeight: 640,
    movementEpochId: options.movementEpochId ?? snapshot.movementEpochId,
    attemptEpochId: snapshot.attemptEpochId,
    output,
  });
  if (!sample) throw new Error('expected sample');
  coordinator.receivePoseSample(sample);
}

function trackingOutput(
  raw: RawLandmarkEvent,
  bodyUnit = 0.3,
  reliabilityOverrides: Partial<Record<(typeof CHAIN_IDS)[number], number>> = {}
): PipelineFrameOutput {
  const frame = createPoseFrame();
  parseLandmarkEvent(raw, frame);
  const chainReliability = new Float64Array(CHAIN_IDS.length);
  chainReliability.fill(0.95);
  for (const [chain, value] of Object.entries(reliabilityOverrides)) {
    const index = CHAIN_IDS.indexOf(chain as (typeof CHAIN_IDS)[number]);
    if (index >= 0) chainReliability[index] = value;
  }
  return {
    state: frame.hasPose ? 'tracking' : 'interrupted',
    inferenceMs: null,
    frame,
    rawFrame: frame,
    displayFrame: frame,
    chainReliability,
    reliableSideChains: 2,
    validity: { valid: frame.hasPose, reason: frame.hasPose ? 'ok' : 'no-pose' },
    bodyUnit,
    events: [],
    fps: 30,
  };
}

function lostOutput(timestampMs: number): PipelineFrameOutput {
  const frame = createPoseFrame();
  frame.timestampMs = timestampMs;
  const chainReliability = new Float64Array(CHAIN_IDS.length);
  return {
    state: 'interrupted',
    inferenceMs: null,
    frame,
    rawFrame: frame,
    displayFrame: frame,
    chainReliability,
    reliableSideChains: 0,
    validity: { valid: false, reason: 'no-pose' },
    bodyUnit: null,
    events: [{ type: 'tracking-interrupted', timestampMs }],
    fps: 30,
  };
}

function chairSetupRaw(timestampMs: number): RawLandmarkEvent {
  return rawFromPoints(timestampMs, [
    [LM.LEFT_SHOULDER, 0.44, 0.42],
    [LM.RIGHT_SHOULDER, 0.56, 0.42],
    [LM.LEFT_HIP, 0.48, 0.62],
    [LM.RIGHT_HIP, 0.52, 0.62],
    [LM.LEFT_KNEE, 0.40, 0.72],
    [LM.RIGHT_KNEE, 0.60, 0.72],
    [LM.LEFT_ANKLE, 0.49, 0.86],
    [LM.RIGHT_ANKLE, 0.51, 0.86],
    [LM.LEFT_WRIST, 0.45, 0.49],
    [LM.RIGHT_WRIST, 0.55, 0.49],
  ]);
}

function balanceRaw(timestampMs: number, standingLeg: BodySide, raised: boolean): RawLandmarkEvent {
  const raisedLeg = standingLeg === 'left' ? 'right' : 'left';
  const raisedAnkleY = raised ? 0.76 : 0.85;
  return rawFromPoints(timestampMs, [
    [LM.LEFT_ANKLE, 0.44, standingLeg === 'left' ? 0.85 : raisedAnkleY],
    [LM.RIGHT_ANKLE, 0.56, standingLeg === 'right' ? 0.85 : raisedAnkleY],
    [LM.LEFT_HEEL, 0.43, standingLeg === 'left' || raisedLeg !== 'left' ? 0.86 : raisedAnkleY + 0.01],
    [LM.RIGHT_HEEL, 0.57, standingLeg === 'right' || raisedLeg !== 'right' ? 0.86 : raisedAnkleY + 0.01],
    [LM.LEFT_FOOT_INDEX, 0.44, standingLeg === 'left' || raisedLeg !== 'left' ? 0.87 : raisedAnkleY + 0.02],
    [LM.RIGHT_FOOT_INDEX, 0.56, standingLeg === 'right' || raisedLeg !== 'right' ? 0.87 : raisedAnkleY + 0.02],
  ]);
}

function shoulderRaw(timestampMs: number, side: BodySide): RawLandmarkEvent {
  const shoulder = side === 'left' ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
  const hip = side === 'left' ? LM.LEFT_HIP : LM.RIGHT_HIP;
  const elbow = side === 'left' ? LM.LEFT_ELBOW : LM.RIGHT_ELBOW;
  const wrist = side === 'left' ? LM.LEFT_WRIST : LM.RIGHT_WRIST;
  return rawFromPoints(timestampMs, [
    [shoulder, 0.5, 0.4],
    [hip, 0.5, 0.66],
    [elbow, side === 'left' ? 0.43 : 0.57, 0.19],
    [wrist, side === 'left' ? 0.39 : 0.61, 0.16],
  ]);
}

function hingeRaw(timestampMs: number): RawLandmarkEvent {
  return rawFromPoints(timestampMs, [
    [LM.LEFT_SHOULDER, 0.64, 0.62],
    [LM.RIGHT_SHOULDER, 0.65, 0.62],
    [LM.LEFT_HIP, 0.5, 0.55],
    [LM.RIGHT_HIP, 0.51, 0.55],
    [LM.LEFT_KNEE, 0.56, 0.74],
    [LM.RIGHT_KNEE, 0.57, 0.74],
    [LM.LEFT_ANKLE, 0.56, 0.85],
    [LM.RIGHT_ANKLE, 0.57, 0.85],
    [LM.LEFT_HEEL, 0.54, 0.86],
    [LM.RIGHT_HEEL, 0.55, 0.86],
    [LM.LEFT_FOOT_INDEX, 0.61, 0.87],
    [LM.RIGHT_FOOT_INDEX, 0.62, 0.87],
    [LM.LEFT_WRIST, 0.66, 0.79],
    [LM.RIGHT_WRIST, 0.67, 0.79],
  ]);
}

function uprightHingeSetupRaw(timestampMs: number): RawLandmarkEvent {
  return rawFromPoints(timestampMs, []);
}

function rawFromPoints(timestampMs: number, overrides: readonly [LM, number, number][]): RawLandmarkEvent {
  const landmarks = new Array<number>(LANDMARK_COUNT * LANDMARK_STRIDE).fill(0);
  const defaults: [LM, number, number][] = [
    [LM.NOSE, 0.5, 0.24],
    [LM.LEFT_EAR, 0.47, 0.25],
    [LM.RIGHT_EAR, 0.53, 0.25],
    [LM.LEFT_SHOULDER, 0.44, 0.38],
    [LM.RIGHT_SHOULDER, 0.56, 0.38],
    [LM.LEFT_ELBOW, 0.42, 0.52],
    [LM.RIGHT_ELBOW, 0.58, 0.52],
    [LM.LEFT_WRIST, 0.41, 0.65],
    [LM.RIGHT_WRIST, 0.59, 0.65],
    [LM.LEFT_HIP, 0.45, 0.58],
    [LM.RIGHT_HIP, 0.55, 0.58],
    [LM.LEFT_KNEE, 0.44, 0.72],
    [LM.RIGHT_KNEE, 0.56, 0.72],
    [LM.LEFT_ANKLE, 0.44, 0.85],
    [LM.RIGHT_ANKLE, 0.56, 0.85],
    [LM.LEFT_HEEL, 0.43, 0.86],
    [LM.RIGHT_HEEL, 0.57, 0.86],
    [LM.LEFT_FOOT_INDEX, 0.44, 0.87],
    [LM.RIGHT_FOOT_INDEX, 0.56, 0.87],
  ];
  for (let index = 0; index < LANDMARK_COUNT; index++) {
    const base = index * LANDMARK_STRIDE;
    landmarks[base] = 0.5;
    landmarks[base + 1] = 0.5;
    landmarks[base + 2] = 0;
    landmarks[base + 3] = 0.95;
    landmarks[base + 4] = 0.95;
  }
  for (const [landmark, x, y] of [...defaults, ...overrides]) {
    const base = landmark * LANDMARK_STRIDE;
    landmarks[base] = x;
    landmarks[base + 1] = y;
    landmarks[base + 2] = 0;
    landmarks[base + 3] = 0.95;
    landmarks[base + 4] = 0.95;
  }
  return { timestampMs, landmarks };
}

function expectJsonSafe(value: unknown): void {
  const json = JSON.stringify(value);
  expect(json).not.toMatch(/\bNaN\b|Infinity|-Infinity/);
  expect(JSON.parse(json)).toBeTruthy();
}
