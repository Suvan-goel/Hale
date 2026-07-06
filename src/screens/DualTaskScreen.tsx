import * as React from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LandmarksEventPayload } from '../../modules/expo-pose-detection';
import { SafePoseDetectionView } from '../components/SafePoseDetectionView';
import type { DualTaskResult } from '../checkup';
import {
  DualTaskRuntime,
  DUAL_TASK_RUNTIME_DEFAULTS,
} from '../movementProfileV2/dualTaskRuntime';
import type { DualTaskEligibility } from '../movementProfileV2/dualTaskEligibility';
import { createMovementProfileV2LivePoseSample } from '../movementProfileV2/liveCoordinator';
import { PosePipeline } from '../pose/pipeline';
import type { SpeechActivityMonitor } from '../voice/speechActivity';
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { colors, spacing, type } from '../theme';

/**
 * Dual-task appendix screen (CLARITY_INSTRUMENTS_TDD §4.1, DT2): "level 2 of
 * a test you know" — one extra balance hold while counting backwards in
 * threes, immediately after the check-up, same session, own camera session
 * (mirrors the micro-check screen architecture, so a coexistence problem can
 * never touch a protocol measurement). Self-reported nothing: the movement is
 * measured by the same detection as level 1; VAD hears only THAT she speaks.
 *
 * No-stall: the offer auto-skips after 20 s; assuming the stance times out in
 * the runtime; tracking interruption retries ONCE then skips (measurement-
 * integrity pattern). Tap parity: every path has a button. This surface is
 * flag-gated (clarity dimension, dev-only) and additionally dark in
 * production until device Block 7 passes (monitor reports unavailable).
 */
export function DualTaskScreen({
  eligibility,
  speechMonitor,
  onDone,
}: {
  eligibility: Extract<DualTaskEligibility, { kind: 'eligible' }>;
  speechMonitor: SpeechActivityMonitor;
  onDone: (result: DualTaskResult) => void;
}) {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [stage, setStage] = React.useState<'offer' | 'running' | 'retry_offer'>('offer');
  const [holdSeconds, setHoldSeconds] = React.useState<number | null>(null);
  const [trackingLost, setTrackingLost] = React.useState(false);
  const runtimeRef = React.useRef<DualTaskRuntime | null>(null);
  const monitorStartedRef = React.useRef(false);
  const holdStartedAtRef = React.useRef<number | null>(null);
  const retriedRef = React.useRef(false);
  const doneRef = React.useRef(false);
  const lastUiUpdateRef = React.useRef(0);
  const countFrom = React.useMemo(() => 90 + Math.floor(Math.random() * 9), []);

  const skipRecord = React.useCallback((): DualTaskResult => {
    return {
      schemaVersion: 1,
      movementId: eligibility.movementId,
      status: 'skipped',
    };
  }, [eligibility.movementId]);

  const deliver = React.useCallback(
    (result: DualTaskResult) => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone(result);
    },
    [onDone]
  );

  // No-stall: the offer never waits forever (auto-skip, recorded honestly).
  React.useEffect(() => {
    if (stage !== 'offer') return;
    const timer = setTimeout(() => deliver(skipRecord()), 20000);
    return () => clearTimeout(timer);
  }, [deliver, skipRecord, stage]);

  const startRun = React.useCallback(() => {
    runtimeRef.current = new DualTaskRuntime({
      movementId: eligibility.movementId,
      standingLeg: eligibility.standingLeg,
      singleTaskSeconds: eligibility.singleTaskSeconds,
      singleTaskCeiling: eligibility.singleTaskCeiling,
      ...DUAL_TASK_RUNTIME_DEFAULTS,
    });
    monitorStartedRef.current = false;
    setHoldSeconds(null);
    setTrackingLost(false);
    setStage('running');
  }, [eligibility]);

  const finishRun = React.useCallback(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const speech = monitorStartedRef.current
      ? speechMonitor.stop(Date.now())
      : { speechActiveMs: 0, windowMs: 0 };
    monitorStartedRef.current = false;
    const result = runtime.result(speech);
    if (result.status === 'invalid' && result.invalidReason === 'tracking_interrupted' && !retriedRef.current) {
      // Measurement-integrity pattern: one honest retry, then skip.
      retriedRef.current = true;
      setStage('retry_offer');
      return;
    }
    deliver(result);
  }, [deliver, speechMonitor]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && runtimeRef.current && stage === 'running') {
        runtimeRef.current.appBackgrounded(Date.now());
        finishRun();
      }
    });
    return () => subscription.remove();
  }, [finishRun, stage]);

  const onLandmarks = React.useCallback(
    (e: { nativeEvent: LandmarksEventPayload }) => {
      const runtime = runtimeRef.current;
      if (!runtime || stage !== 'running') return;
      const event = e.nativeEvent;
      const out = pipeline.process(event);
      const sample = createMovementProfileV2LivePoseSample({
        eventTimestampMs: event.timestampMs,
        receivedAtMs: Date.now(),
        sourceWidth: event.sourceWidth,
        sourceHeight: event.sourceHeight,
        movementEpochId: 'dual-task',
        output: out,
      });
      if (!sample) return;
      runtime.update(sample, event.timestampMs);
      for (const runtimeEvent of runtime.takeEvents()) {
        if (runtimeEvent.kind === 'phase' && runtimeEvent.phase === 'hold' && !monitorStartedRef.current) {
          holdStartedAtRef.current = event.timestampMs;
          monitorStartedRef.current = true;
          try {
            speechMonitor.start(Date.now());
          } catch {
            // Monitor refused after reporting available: recorded limitation.
            monitorStartedRef.current = false;
          }
        }
        if (runtimeEvent.kind === 'phase' && runtimeEvent.phase === 'complete') {
          finishRun();
          return;
        }
      }
      // Throttled UI state (~4 Hz) — the hot path stays out of React.
      if (event.timestampMs - lastUiUpdateRef.current >= 250) {
        lastUiUpdateRef.current = event.timestampMs;
        setTrackingLost(sample.trackingQuality !== 'good');
        setHoldSeconds(
          runtime.phase === 'hold' && holdStartedAtRef.current !== null
            ? Math.max(0, Math.floor((event.timestampMs - holdStartedAtRef.current) / 1000))
            : null
        );
      }
    },
    [finishRun, pipeline, speechMonitor, stage]
  );

  if (stage === 'offer' || stage === 'retry_offer') {
    return (
      <Screen contentStyle={styles.content}>
        <ScreenHeader
          eyebrow="Level 2"
          title={stage === 'offer' ? 'Same balance hold — with a twist' : 'Tracking was interrupted'}
          subtitle={
            stage === 'offer'
              ? `The balance hold you just did, one more time — while counting backwards in threes out loud, starting from ${countFrom}. I only check that you're speaking, never what you say. Pauses to think are fine — keep going when ready.`
              : 'One more try? Same hold, same counting. Or skip — your check-up is already saved.'
          }
        />
        <View style={styles.actions}>
          <PrimaryButton title={stage === 'offer' ? 'Try level 2' : 'Try again'} onPress={startRun} />
          <SecondaryButton title="Skip this part" onPress={() => deliver(stage === 'offer' ? skipRecord() : (runtimeRef.current?.result({ speechActiveMs: 0, windowMs: 0 }) ?? skipRecord()))} />
        </View>
        <Text style={styles.gentle}>
          Optional — it never changes your check-up results. Stopping early under load is a real
          answer too, not a mistake.
        </Text>
      </Screen>
    );
  }

  return (
    <View style={styles.runContainer}>
      <SafePoseDetectionView
        active
        modelVariant="full"
        style={StyleSheet.absoluteFill}
        onLandmarks={onLandmarks}
        onPoseError={() => undefined}
      />
      <View style={styles.runOverlay} pointerEvents="box-none">
        <Text style={styles.runTitle}>
          {trackingLost
            ? 'Step back into view'
            : holdSeconds !== null
              ? `${holdSeconds}s — keep counting backwards, pauses are fine`
              : `Lift your ${eligibility.standingLeg === 'left' ? 'right' : 'left'} foot and start counting from ${countFrom}`}
        </Text>
        <SecondaryButton
          title="Stop and skip"
          onPress={() => {
            runtimeRef.current = null;
            deliver(skipRecord());
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  gentle: {
    ...type.caption,
    color: colors.textSecondary,
  },
  runContainer: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  runOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  runTitle: {
    ...type.h3,
    textAlign: 'center',
  },
});
