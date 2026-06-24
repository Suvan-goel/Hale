import * as React from 'react';
import {
  AppState,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { LandmarksEventPayload, PoseErrorEventPayload } from '../../modules/expo-pose-detection';
import { VoiceChannel } from '../audio/voicePlayer';
import type { CheckupType } from '../adherence';
import type { BodySide } from '../checkup/protocolSetup';
import type { CheckUp } from '../checkup/types';
import { BackArrowButton } from '../components/BackArrowButton';
import { CameraUnavailableNotice, SafePoseDetectionView, type CameraAvailability } from '../components/SafePoseDetectionView';
import { HeaderLogo } from '../components/HeaderLogo';
import { PrimaryButton, SecondaryButton } from '../components/ui';
import { MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED } from '../config/movementProfileV2VoiceRuntimeFoundation';
import { defaultNowMs } from '../diagnostics/poseLatencyDiagnostics';
import {
  createMovementProfileV2InternalFlow,
  type MovementProfileV2InternalFlowState,
} from '../movementProfileV2/internalCheckupFlow';
import {
  isMovementProfileV2DiagnosticsEnabled,
  serializeMovementProfileV2LiveDiagnostics,
} from '../movementProfileV2/liveDiagnostics';
import {
  createMovementProfileV2LivePoseSample,
  MovementProfileV2LiveCoordinator,
  type MovementProfileV2LiveSnapshot,
  type MovementProfileV2LiveStage,
  type MovementProfileV2LiveUserAction,
} from '../movementProfileV2/liveCoordinator';
import {
  MovementProfileV2VoiceSequencer,
  initialMovementProfileV2VoiceEvent,
  movementProfileV2VisibleCueForStage,
} from '../movementProfileV2/voiceCues';
import {
  MovementProfileV2VoiceRuntime,
  type MovementProfileV2VoiceCoordinatorAction,
  type MovementProfileV2VoiceRuntimeState,
} from '../movementProfileV2/voiceRuntime';
import { PosePipeline } from '../pose/pipeline';
import { DEFAULT_VOICE_ID } from '../profile/voices';
import { SkeletonView, type SkeletonViewHandle } from '../render/SkeletonView';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const LIVE_TIMER_TICK_MS = 250;

const INITIAL_VOICE_RUNTIME_STATE: MovementProfileV2VoiceRuntimeState = {
  blocking: false,
  activeScopeId: null,
  activeRequirement: null,
  lastFailure: null,
  completionReady: false,
  desiredVoiceId: DEFAULT_VOICE_ID,
  activeVoiceId: DEFAULT_VOICE_ID,
  pendingVoiceId: null,
  diagnostics: [],
};

export function MovementProfileV2CheckUpScreen({
  startedAt,
  sourceType,
  initialFlow,
  voiceId,
  onComplete,
  onCancel,
}: {
  startedAt: string;
  sourceType: Extract<CheckupType, 'baseline' | 'baseline_retake'>;
  initialFlow?: MovementProfileV2InternalFlowState | null;
  voiceId?: string;
  onComplete: (input: { checkUp: CheckUp; sourceType: Extract<CheckupType, 'baseline' | 'baseline_retake'> }) => void;
  onCancel: () => void;
}) {
  const initialState = React.useMemo(
    () => initialFlow ?? { ...createMovementProfileV2InternalFlow({ startedAt }), sourceType },
    [initialFlow, sourceType, startedAt]
  );
  const coordinatorRef = React.useRef<MovementProfileV2LiveCoordinator | null>(null);
  if (coordinatorRef.current === null) {
    coordinatorRef.current = new MovementProfileV2LiveCoordinator(initialState);
  }
  const [pipeline] = React.useState(() => new PosePipeline());
  const [voice] = React.useState(() => new VoiceChannel(voiceId));
  const voiceSequencerRef = React.useRef(new MovementProfileV2VoiceSequencer());
  const voiceRuntimeRef = React.useRef<MovementProfileV2VoiceRuntime | null>(null);
  const [voiceRuntimeState, setVoiceRuntimeState] = React.useState<MovementProfileV2VoiceRuntimeState>(
    INITIAL_VOICE_RUNTIME_STATE
  );
  const [cameraAvailability, setCameraAvailability] = React.useState<CameraAvailability>('checking');
  const [selectedLeg, setSelectedLeg] = React.useState<BodySide>(initialState.standingLeg);
  const [selectedShoulder, setSelectedShoulder] = React.useState<BodySide>(initialState.shoulderSide);
  const [live, setLive] = React.useState<MovementProfileV2LiveSnapshot>(() =>
    coordinatorRef.current!.snapshot(defaultNowMs())
  );
  const liveRef = React.useRef(live);
  const completedRef = React.useRef(false);
  const skeletonRef = React.useRef<SkeletonViewHandle>(null);
  const diagnosticsEnabled = React.useMemo(() => isMovementProfileV2DiagnosticsEnabled(), []);

  const refreshLive = React.useCallback((nowMs: number = defaultNowMs()) => {
    const next = coordinatorRef.current?.snapshot(nowMs);
    if (!next) return null;
    liveRef.current = next;
    setLive(next);
    return next;
  }, []);

  const applyVoiceCoordinatorAction = React.useCallback(
    (action: MovementProfileV2VoiceCoordinatorAction, atMs: number) => {
      coordinatorRef.current?.receiveUserAction(action, atMs);
      refreshLive(atMs);
    },
    [refreshLive]
  );

  const getVoiceRuntime = React.useCallback(() => {
    if (voiceRuntimeRef.current === null) {
      voiceRuntimeRef.current = new MovementProfileV2VoiceRuntime({
      voice,
      voiceId: voiceId ?? DEFAULT_VOICE_ID,
      createVoiceChannel: (nextVoiceId) => new VoiceChannel(nextVoiceId),
      nowMs: defaultNowMs,
      onStateChange: setVoiceRuntimeState,
      onCoordinatorAction: applyVoiceCoordinatorAction,
      });
    }
    return voiceRuntimeRef.current;
  }, [applyVoiceCoordinatorAction, voice]);

  React.useEffect(() => {
    if (MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED) {
      getVoiceRuntime().sync(liveRef.current);
    } else {
      const intro = initialMovementProfileV2VoiceEvent();
      voice.speak(intro.cues, intro.priority);
    }
    return () => {
      voiceSequencerRef.current.dispose();
      if (MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED) {
        voiceRuntimeRef.current?.cancel('screen_unmounted');
      } else {
        voice.stop();
      }
    };
  }, [getVoiceRuntime, voice]);

  React.useEffect(() => {
    if (!MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED) return;
    getVoiceRuntime().setDesiredVoiceId(voiceId ?? DEFAULT_VOICE_ID, liveRef.current);
  }, [getVoiceRuntime, voiceId]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const nowMs = defaultNowMs();
      if (state === 'background' || state === 'inactive') {
        coordinatorRef.current?.receiveUserAction({ type: 'backgrounded' }, nowMs);
        if (MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED) {
          voiceRuntimeRef.current?.cancel('app_backgrounded');
        } else {
          voice.stop();
        }
      } else if (state === 'active') {
        coordinatorRef.current?.receiveUserAction({ type: 'resumed' }, nowMs);
      }
      refreshLive(nowMs);
    });
    return () => sub.remove();
  }, [refreshLive, voice]);

  React.useEffect(() => {
    const id = setInterval(() => {
      const nowMs = defaultNowMs();
      coordinatorRef.current?.receiveTimerTick(nowMs);
      refreshLive(nowMs);
    }, LIVE_TIMER_TICK_MS);
    return () => clearInterval(id);
  }, [refreshLive]);

  React.useEffect(() => {
    if (MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED) return;
    const cue = voiceSequencerRef.current.next(live);
    if (cue) voice.speak(cue.cues, cue.priority);
  }, [live, live.revision, voice]);

  React.useEffect(() => {
    if (!MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED) return;
    getVoiceRuntime().sync(live);
  }, [getVoiceRuntime, live, live.revision]);

  React.useEffect(() => {
    if (!live.checkUp || completedRef.current) return;
    if (MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED && !voiceRuntimeState.completionReady) return;
    completedRef.current = true;
    onComplete({ checkUp: live.checkUp, sourceType });
  }, [live.checkUp, onComplete, sourceType, voiceRuntimeState.completionReady]);

  const onLandmarks = React.useCallback(
    (event: { nativeEvent: LandmarksEventPayload }) => {
      const payload = event.nativeEvent;
      const receivedAtMs = defaultNowMs();
      const out = pipeline.process(payload);
      const sourceAspect = payload.sourceWidth / payload.sourceHeight;
      skeletonRef.current?.update(out, sourceAspect);

      const active = liveRef.current;
      const sample = createMovementProfileV2LivePoseSample({
        frameId: payload.latency?.frameId,
        eventTimestampMs: payload.latency?.sourceTimestampMs ?? payload.timestampMs,
        receivedAtMs,
        sourceWidth: payload.sourceWidth,
        sourceHeight: payload.sourceHeight,
        movementEpochId: active.movementEpochId,
        attemptEpochId: active.attemptEpochId,
        output: out,
      });
      if (!sample) return;

      coordinatorRef.current?.receivePoseSample(sample);
      const next = coordinatorRef.current?.snapshot(receivedAtMs);
      if (next && next.revision !== liveRef.current.revision) {
        liveRef.current = next;
        setLive(next);
      }
    },
    [pipeline]
  );

  const onPoseError = React.useCallback((event: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[movement-profile-v2-pose]', event.nativeEvent.message);
  }, []);

  const runLiveAction = React.useCallback(
    (action: MovementProfileV2LiveUserAction) => {
      const nowMs = defaultNowMs();
      if (
        MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED &&
        !getVoiceRuntime().canDispatchAction(action, liveRef.current)
      ) {
        return;
      }
      coordinatorRef.current?.receiveUserAction(action, nowMs);
      refreshLive(nowMs);
    },
    [getVoiceRuntime, refreshLive]
  );

  const shareDiagnostics = React.useCallback(() => {
    void Share.share({ message: serializeMovementProfileV2LiveDiagnostics(liveRef.current.diagnostics) }).catch(
      (error) => console.warn('[movement-profile-v2-diagnostics]', error)
    );
  }, []);

  const copy = stepCopy(live.stage);
  const visibleCue = movementProfileV2VisibleCueForStage(live.stage, selectedShoulder);
  const actionDisabled = React.useCallback(
    (action: MovementProfileV2LiveUserAction) =>
      MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED &&
      !getVoiceRuntime().canDispatchAction(action, liveRef.current),
    [getVoiceRuntime]
  );
  const retryAudio = React.useCallback(() => {
    getVoiceRuntime().retry(liveRef.current);
  }, [getVoiceRuntime]);

  return (
    <View style={styles.container}>
      <SafePoseDetectionView
        active
        modelVariant="full"
        style={StyleSheet.absoluteFill}
        onLandmarks={onLandmarks}
        onPoseError={onPoseError}
        onAvailabilityChange={setCameraAvailability}
        latencyDiagnosticsEnabled={diagnosticsEnabled}
      />
      <View style={styles.content}>
        <View style={styles.topBar}>
          <BackArrowButton accessibilityLabel="Leave internal Movement Profile" onPress={onCancel} />
          <HeaderLogo size={30} />
        </View>

        <View style={styles.avatarCard}>
          {cameraAvailability === 'unavailable' ? (
            <CameraUnavailableNotice compact />
          ) : (
            <SkeletonView
              ref={skeletonRef}
              mirrored
              fit="contain"
              frameSource="raw"
              smoothingEnabled={false}
              pointCloudBodyDensity="high"
              pointCloudBodyMaxDots={900}
              pointCloudBodyDotScale={1.6}
              confidenceFadingEnabled={false}
              confidenceIntensityEnabled={false}
              setupGuidesEnabled={false}
              stateTransitionsEnabled={false}
            />
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.eyebrow}>Internal Movement Profile V2</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          <Text style={styles.statusText}>{visibleCue.text}</Text>
          {MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED && voiceRuntimeState.blocking ? (
            <Text style={styles.guidanceText}>Audio guidance is playing.</Text>
          ) : null}
          {live.backgrounded ? (
            <Text style={styles.warning}>Capture was interrupted by app backgrounding; restart if this was not intentional.</Text>
          ) : null}
          {MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED && voiceRuntimeState.lastFailure ? (
            <View style={styles.audioFailureBox}>
              <Text style={styles.audioFailureTitle}>Audio guidance couldn&apos;t start.</Text>
              <Text style={styles.audioFailureBody}>Try again before continuing the check-up.</Text>
              <View style={styles.audioFailureActions}>
                <PrimaryButton title="Try again" onPress={retryAudio} />
                <SecondaryButton title="Exit check-up" onPress={onCancel} />
              </View>
            </View>
          ) : null}

          <CaptureMetrics live={live} />

          {live.stage === 'balance_setup' ? (
            <SidePicker
              label="Standing leg"
              value={selectedLeg}
              onChange={setSelectedLeg}
            />
          ) : null}
          {live.stage === 'shoulder_setup' ? (
            <SidePicker
              label="Shoulder side"
              value={selectedShoulder}
              onChange={setSelectedShoulder}
            />
          ) : null}

          <View style={styles.actions}>
            {live.stage === 'chair_setup' ? (
              <PrimaryButton
                title="Confirm setup"
                disabled={actionDisabled({ type: 'confirm_chair_setup' })}
                onPress={() => runLiveAction({ type: 'confirm_chair_setup' })}
              />
            ) : null}
            {live.stage === 'chair_practice' ? (
              <Text style={styles.waitingText}>Practice rep starts automatically when you stand.</Text>
            ) : null}
            {live.stage === 'chair_countdown' || live.stage === 'chair_active' ? (
              <Text style={styles.waitingText}>Keep moving comfortably until the timer ends.</Text>
            ) : null}
            {live.stage === 'balance_setup' ? (
              <PrimaryButton
                title="Confirm setup"
                disabled={actionDisabled({ type: 'confirm_balance_setup', standingLeg: selectedLeg })}
                onPress={() => runLiveAction({ type: 'confirm_balance_setup', standingLeg: selectedLeg })}
              />
            ) : null}
            {live.stage === 'balance_ready' ? (
              <>
                <Text style={styles.waitingText}>Lift the other foot when you are ready.</Text>
                {live.balanceBestHoldSec !== null ? (
                  <SecondaryButton
                    title="Use this result"
                    disabled={actionDisabled({ type: 'balance_use_result' })}
                    onPress={() => runLiveAction({ type: 'balance_use_result' })}
                  />
                ) : null}
              </>
            ) : null}
            {live.stage === 'balance_trial' ? (
              <>
                <PrimaryButton
                  title="I touched support"
                  onPress={() => runLiveAction({ type: 'balance_support_touched' })}
                />
                <SecondaryButton title="Stop attempt" onPress={() => runLiveAction({ type: 'balance_stop' })} />
              </>
            ) : null}
            {live.stage === 'balance_rest' ? (
              <>
                <PrimaryButton
                  title={live.canContinueAfterRest ? "I'm ready" : `Rest ${formatSeconds(live.restMinimumRemainingMs)}`}
                  disabled={!live.canContinueAfterRest || actionDisabled({ type: 'balance_ready' })}
                  onPress={() => runLiveAction({ type: 'balance_ready' })}
                />
                {live.balanceBestHoldSec !== null ? (
                  <SecondaryButton
                    title="Use this result"
                    disabled={actionDisabled({ type: 'balance_use_result' })}
                    onPress={() => runLiveAction({ type: 'balance_use_result' })}
                  />
                ) : null}
              </>
            ) : null}
            {live.stage === 'shoulder_setup' ? (
              <PrimaryButton
                title="Confirm setup"
                disabled={actionDisabled({ type: 'confirm_shoulder_setup', shoulderSide: selectedShoulder })}
                onPress={() => runLiveAction({ type: 'confirm_shoulder_setup', shoulderSide: selectedShoulder })}
              />
            ) : null}
            {live.stage === 'shoulder_ready' || live.stage === 'shoulder_retry_ready' ? (
              <PrimaryButton
                title="Start reach"
                disabled={actionDisabled({ type: 'start_shoulder_capture' })}
                onPress={() => runLiveAction({ type: 'start_shoulder_capture' })}
              />
            ) : null}
            {live.stage === 'shoulder_active' ? (
              <PrimaryButton title="I felt limited" onPress={() => runLiveAction({ type: 'shoulder_pain_limited' })} />
            ) : null}
            {live.stage === 'hinge_setup' ? (
              <PrimaryButton
                title="Start capture"
                disabled={actionDisabled({ type: 'start_hinge_capture' })}
                onPress={() => runLiveAction({ type: 'start_hinge_capture' })}
              />
            ) : null}
            {live.stage === 'hinge_active' ? (
              <PrimaryButton title="Finish capture" onPress={() => runLiveAction({ type: 'finish_hinge_capture' })} />
            ) : null}
            {diagnosticsEnabled ? (
              <SecondaryButton title="Export diagnostics" onPress={shareDiagnostics} />
            ) : null}
            <SecondaryButton title="Cancel" onPress={onCancel} />
          </View>
        </View>
      </View>
    </View>
  );
}

function CaptureMetrics({ live }: { live: MovementProfileV2LiveSnapshot }) {
  const rows = [
    { label: 'Timer', value: live.timerRemainingMs === null ? 'Not running' : formatSeconds(live.timerRemainingMs) },
    { label: 'Chair rises', value: `${live.chairReps}` },
    {
      label: 'Balance best',
      value: live.balanceBestHoldSec === null ? 'Not saved yet' : `${live.balanceBestHoldSec.toFixed(1)} sec`,
    },
    {
      label: 'Shoulder peak',
      value: live.shoulderPeakDeg === null ? 'Not saved yet' : `${Math.round(live.shoulderPeakDeg)} deg`,
    },
    {
      label: 'Forward reach',
      value: live.hingeReachBu === null ? 'Not saved yet' : `${live.hingeReachBu.toFixed(2)} BU`,
    },
  ];
  return (
    <View style={styles.metricGrid}>
      {rows.map((row) => (
        <View key={row.label} style={styles.metricTile}>
          <Text style={styles.metricLabel}>{row.label}</Text>
          <Text style={styles.metricValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function SidePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BodySide;
  onChange: (side: BodySide) => void;
}) {
  return (
    <View style={styles.sidePicker}>
      <Text style={styles.sidePickerLabel}>{label}</Text>
      <View style={styles.sidePickerButtons}>
        {(['left', 'right'] as BodySide[]).map((side) => (
          <Pressable
            key={side}
            style={({ pressed }) => [
              styles.sideButton,
              value === side && styles.sideButtonSelected,
              pressed && styles.pressed,
            ]}
            onPress={() => onChange(side)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === side }}
            accessibilityLabel={`${label} ${side}`}
          >
            <Text style={[styles.sideButtonText, value === side && styles.sideButtonTextSelected]}>
              {side === 'left' ? 'Left' : 'Right'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function stepCopy(stage: MovementProfileV2LiveStage): { title: string; body: string } {
  switch (stage) {
    case 'chair_setup':
      return { title: 'Chair rise setup', body: 'Use a sturdy chair. Sit side-on with your full body in view.' };
    case 'chair_practice':
      return { title: 'Practice rise', body: 'Do one easy practice stand before the timed capture. Hale will start the official timer after this practice rep.' };
    case 'chair_countdown':
      return { title: 'Get ready', body: 'The official 30-second chair rise capture is about to begin.' };
    case 'chair_active':
      return { title: '30-second chair rise', body: 'Stand and sit as many times as feels comfortable in the capture window.' };
    case 'balance_setup':
      return { title: 'One-leg balance setup', body: 'Keep fingertips near a counter and choose the standing leg for this capture.' };
    case 'balance_ready':
      return { title: 'One-leg balance', body: 'Lift the other foot to begin. Hale will keep the best valid hold from up to three tries.' };
    case 'balance_trial':
      return { title: 'Balance capture', body: 'Keep support within reach. Use the support button if you touch the counter.' };
    case 'balance_rest':
      return { title: 'Rest before retry', body: 'Take the minimum rest before another attempt, or use the best saved result when available.' };
    case 'shoulder_setup':
      return { title: 'Shoulder reach setup', body: 'Stand side-on and choose the shoulder side for the forward reach.' };
    case 'shoulder_ready':
      return { title: 'Active shoulder reach', body: 'Start capture, then raise the selected arm forward within a comfortable range.' };
    case 'shoulder_active':
      return { title: 'Active shoulder reach', body: 'Raise the arm forward within a comfortable range, then relax.' };
    case 'shoulder_retry_ready':
      return { title: 'Shoulder retry', body: 'Tracking was not clear enough. Set up again and use the single retry.' };
    case 'hinge_setup':
      return { title: 'Forward reach', body: 'Fold forward comfortably. Hale keeps this as a supporting mobility number.' };
    case 'hinge_active':
      return { title: 'Forward reach capture', body: 'Fold forward comfortably. Hale is saving the closest reach.' };
    default:
      return { title: 'Movement Profile', body: 'Raw capture is complete.' };
  }
}

function formatSeconds(ms: number | null): string {
  if (ms === null) return '0 sec';
  return `${Math.max(0, Math.ceil(ms / 1000))} sec`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarCard: {
    flex: 1,
    minHeight: 320,
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgBase,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  panel: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  eyebrow: {
    ...type.cardCaption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  title: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  body: {
    ...type.body,
    color: colors.textSecondary,
  },
  statusText: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  warning: {
    ...type.cardCaption,
    color: colors.warningClay,
  },
  guidanceText: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  audioFailureBox: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.warningClay,
    backgroundColor: colors.bgBase,
  },
  audioFailureTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  audioFailureBody: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  audioFailureActions: {
    gap: spacing.xs,
  },
  waitingText: {
    ...type.cardCaption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metricTile: {
    minWidth: '30%',
    flexGrow: 1,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgBase,
  },
  metricLabel: {
    ...type.cardCaption,
    color: colors.textTertiary,
  },
  metricValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  sidePicker: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sidePickerLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  sidePickerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sideButton: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgSurface,
  },
  sideButtonSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sideButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sideButtonTextSelected: {
    color: colors.onAccent,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pressed: {
    opacity: 0.72,
  },
});
