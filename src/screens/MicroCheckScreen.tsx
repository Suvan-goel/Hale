/**
 * Weekly micro-check screen — a ~60-second single-item check. Same product laws
 * and hot-path discipline as the other camera screens (no video, audio-first,
 * pipeline + skeleton + runner per frame, 10fps HUD, imperative audio).
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  LandmarksEventPayload,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel } from '../audio/voicePlayer';
import {
  CameraUnavailableNotice,
  SafePoseDetectionView,
} from '../components/SafePoseDetectionView';
import type { CameraAvailability } from '../components/SafePoseDetectionView';
import { PrimaryButton } from '../components/ui';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck } from '../preflight/preflight';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';
import type {
  PoseAvatarActiveDomain,
  PoseAvatarMeasurementState,
} from '../render/poseAvatarTypes';
import { colors, radius, shadow, spacing, type } from '../theme';
import { MicroCheckPhase, MicroCheckResult, MicroCheckRunner, MicroCheckType } from '../training/microCheck';

const UI_UPDATE_INTERVAL_MS = 100;

const TITLE: Record<MicroCheckType, string> = {
  'chair-power': 'Quick Power Check',
  'single-leg-balance': 'Quick Balance Check',
  'mobility-reach': 'Quick Mobility Check',
};

const PHASE_CAPTION: Partial<Record<MicroCheckPhase, string>> = {
  preflight: 'Getting you framed…',
  instructions: 'Listen for your instructions',
  countdown: 'Get ready…',
};

interface Snapshot {
  phase: MicroCheckPhase;
  repCount: number;
  holdSec: number;
}

export function MicroCheckScreen({
  type,
  onComplete,
  onCancel,
  voiceId,
}: {
  type: MicroCheckType;
  onComplete: (result: MicroCheckResult) => void;
  onCancel?: () => void;
  voiceId?: string;
}) {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck());
  const [runner] = React.useState(() => new MicroCheckRunner(type, new Date().toISOString(), preflight));
  const [voice] = React.useState(() => new VoiceChannel(voiceId));
  const [sfx] = React.useState(() => new SfxChannel());
  const [recorder] = React.useState(() => new LandmarkRecorder());
  const skeletonRef = React.useRef<SkeletonViewHandle>(null);
  const lastUiUpdateRef = React.useRef(0);
  const completedRef = React.useRef(false);
  const [snapshot, setSnapshot] = React.useState<Snapshot>({ phase: 'preflight', repCount: 0, holdSec: NaN });
  const [cameraAvailability, setCameraAvailability] = React.useState<CameraAvailability>('checking');

  React.useEffect(() => {
    if (__DEV__) recorder.start();
    return () => {
      void recorder.stop();
      voice.stop();
      sfx.release();
    };
  }, [recorder, voice, sfx]);

  const onLandmarks = React.useCallback(
    (e: { nativeEvent: LandmarksEventPayload }) => {
      const event = e.nativeEvent;
      if (__DEV__) recorder.record(event);
      const out = pipeline.process(event);
      const u = runner.update(out, voice.busy);

      if (u.voice) voice.speak(u.voice.cues, u.voice.priority);
      if (u.playRepSound) sfx.play('rep-credit');

      if (u.phase === 'done' && !completedRef.current) {
        completedRef.current = true;
        const result = runner.result;
        if (result) onComplete(result);
        return;
      }

      if (event.timestampMs - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
        lastUiUpdateRef.current = event.timestampMs;
        const next: Snapshot = { phase: u.phase, repCount: u.repCount, holdSec: u.holdSec };
        setSnapshot((prev) =>
          prev.phase === next.phase && prev.repCount === next.repCount && prev.holdSec === next.holdSec ? prev : next
        );
      }
      skeletonRef.current?.update(out, event.sourceWidth / event.sourceHeight);
    },
    [pipeline, runner, voice, sfx, recorder, onComplete]
  );

  const onPoseError = React.useCallback((e: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[pose]', e.nativeEvent.message);
  }, []);

  const active = snapshot.phase === 'active';
  const avatarMeasurementState = microCheckAvatarState(snapshot.phase);
  const avatarDomain = domainForMicroCheck(type);

  return (
    <View style={styles.container}>
      <SafePoseDetectionView
        active
        modelVariant="lite"
        style={StyleSheet.absoluteFill}
        onLandmarks={onLandmarks}
        onPoseError={onPoseError}
        onAvailabilityChange={setCameraAvailability}
      />
      {cameraAvailability === 'unavailable' ? (
        <CameraUnavailableNotice />
      ) : (
        <SkeletonView
          ref={skeletonRef}
          mirrored
          frameSource="raw"
          smoothingEnabled={false}
          pointCloudBodyDensity="high"
          pointCloudBodyMaxDots={900}
          pointCloudBodyDotScale={1.72}
          confidenceFadingEnabled={false}
          confidenceIntensityEnabled={false}
          reacquisitionFadeEnabled={false}
          recognitionPulseEnabled={false}
          measurementState={avatarMeasurementState}
          activeDomain={avatarDomain}
          setupGuidesEnabled={false}
          stateTransitionsEnabled={false}
        />
      )}
      <View pointerEvents="none" style={styles.hud}>
        {snapshot.phase === 'done' ? (
          <Text style={styles.caption}>Nice — that's logged.</Text>
        ) : (
          <>
            <Text style={styles.title}>{TITLE[type]}</Text>
            {active && type === 'chair-power' ? (
              <Text style={styles.big}>{snapshot.repCount}</Text>
            ) : active && type === 'single-leg-balance' ? (
              <Text style={styles.big}>{Number.isFinite(snapshot.holdSec) ? `${Math.floor(snapshot.holdSec)}s` : '—'}</Text>
            ) : active && type === 'mobility-reach' ? (
              <Text style={styles.caption}>Reach comfortably and return tall.</Text>
            ) : (
              <Text style={styles.caption}>{PHASE_CAPTION[snapshot.phase] ?? 'Measuring…'}</Text>
            )}
          </>
        )}
      </View>
      {cameraAvailability === 'unavailable' && onCancel ? (
        <View style={styles.unavailableAction}>
          <PrimaryButton title="Back to Today" onPress={onCancel} />
        </View>
      ) : null}
    </View>
  );
}

function microCheckAvatarState(phase: MicroCheckPhase): PoseAvatarMeasurementState {
  switch (phase) {
    case 'preflight':
      return 'framing';
    case 'instructions':
    case 'countdown':
      return 'ready';
    case 'active':
      return 'micro_check';
    case 'done':
      return 'success';
  }
}

function domainForMicroCheck(type: MicroCheckType): PoseAvatarActiveDomain {
  if (type === 'chair-power') return 'strength_power';
  if (type === 'single-leg-balance') return 'balance';
  return 'mobility';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  hud: {
    position: 'absolute',
    top: spacing.huge,
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  title: { ...type.h1, textAlign: 'center' },
  caption: { ...type.body, color: colors.textSecondary, marginTop: 10 },
  big: { ...type.metric, marginTop: 8 },
  unavailableAction: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
  },
});
