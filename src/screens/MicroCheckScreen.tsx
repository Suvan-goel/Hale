/**
 * Weekly micro-check screen — a ~60-second single-item check. Same product laws
 * and hot-path discipline as the other camera screens (no video, audio-first,
 * pipeline + skeleton + runner per frame, 10fps HUD, imperative audio).
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  LandmarksEventPayload,
  PoseDetectionView,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { SfxChannel, VoiceChannel } from '../audio/voicePlayer';
import { PosePipeline } from '../pose/pipeline';
import { PreflightCheck } from '../preflight/preflight';
import { LandmarkRecorder } from '../recording/recorder';
import { SkeletonView, SkeletonViewHandle } from '../render/SkeletonView';
import { MicroCheckPhase, MicroCheckResult, MicroCheckRunner, MicroCheckType } from '../training/microCheck';

const UI_UPDATE_INTERVAL_MS = 100;

const TITLE: Record<MicroCheckType, string> = {
  'chair-power': 'Quick Power Check',
  'single-leg-balance': 'Quick Balance Check',
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
}: {
  type: MicroCheckType;
  onComplete: (result: MicroCheckResult) => void;
}) {
  const [pipeline] = React.useState(() => new PosePipeline());
  const [preflight] = React.useState(() => new PreflightCheck());
  const [runner] = React.useState(() => new MicroCheckRunner(type, new Date().toISOString(), preflight));
  const [voice] = React.useState(() => new VoiceChannel());
  const [sfx] = React.useState(() => new SfxChannel());
  const [recorder] = React.useState(() => new LandmarkRecorder());
  const skeletonRef = React.useRef<SkeletonViewHandle>(null);
  const lastUiUpdateRef = React.useRef(0);
  const completedRef = React.useRef(false);
  const [snapshot, setSnapshot] = React.useState<Snapshot>({ phase: 'preflight', repCount: 0, holdSec: NaN });

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
      skeletonRef.current?.update(out, event.sourceWidth / event.sourceHeight);
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
    },
    [pipeline, runner, voice, sfx, recorder, onComplete]
  );

  const onPoseError = React.useCallback((e: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[pose]', e.nativeEvent.message);
  }, []);

  const active = snapshot.phase === 'active';

  return (
    <View style={styles.container}>
      <PoseDetectionView active style={StyleSheet.absoluteFill} onLandmarks={onLandmarks} onPoseError={onPoseError} />
      <SkeletonView ref={skeletonRef} mirrored />
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
            ) : (
              <Text style={styles.caption}>{PHASE_CAPTION[snapshot.phase] ?? 'Measuring…'}</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  hud: { position: 'absolute', top: 72, left: 0, right: 0, alignItems: 'center' },
  title: { color: '#E8F4EA', fontSize: 24, fontWeight: '300' },
  caption: { color: '#9DB8A4', fontSize: 18, marginTop: 10 },
  big: { color: '#E8F4EA', fontSize: 96, fontVariant: ['tabular-nums'], fontWeight: '200', marginTop: 8 },
});
