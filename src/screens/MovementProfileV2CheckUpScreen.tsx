import * as React from 'react';
import {
  AppState,
  Pressable,
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
import {
  createCapturedActiveShoulderReachV2Result,
  createCapturedChairRiseV2Result,
  createCapturedHingeReachResult,
  createCapturedOneLegBalanceV2Result,
  createMovementProfileV2InternalFlow,
  movementProfileV2InternalFlowReducer,
  movementProfileV2RawCheckUpFromFlow,
  type MovementProfileV2InternalFlowState,
} from '../movementProfileV2/internalCheckupFlow';
import { PosePipeline } from '../pose/pipeline';
import { SkeletonView, type SkeletonViewHandle } from '../render/SkeletonView';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

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
  const [flow, dispatch] = React.useReducer(
    movementProfileV2InternalFlowReducer,
    initialState
  );
  const [pipeline] = React.useState(() => new PosePipeline());
  const [voice] = React.useState(() => new VoiceChannel(voiceId));
  const [cameraAvailability, setCameraAvailability] = React.useState<CameraAvailability>('checking');
  const [selectedLeg, setSelectedLeg] = React.useState<BodySide>(flow.standingLeg);
  const [selectedShoulder, setSelectedShoulder] = React.useState<BodySide>(flow.shoulderSide);
  const skeletonRef = React.useRef<SkeletonViewHandle>(null);

  React.useEffect(() => {
    voice.speak(['checkup-intro'], 8);
    return () => voice.stop();
  }, [voice]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        dispatch({ type: 'backgrounded' });
        voice.stop();
      } else if (state === 'active') {
        dispatch({ type: 'resumed' });
      }
    });
    return () => sub.remove();
  }, [voice]);

  const onLandmarks = React.useCallback(
    (event: { nativeEvent: LandmarksEventPayload }) => {
      const out = pipeline.process(event.nativeEvent);
      const sourceAspect = event.nativeEvent.sourceWidth / event.nativeEvent.sourceHeight;
      skeletonRef.current?.update(out, sourceAspect);
    },
    [pipeline]
  );

  const onPoseError = React.useCallback((event: { nativeEvent: PoseErrorEventPayload }) => {
    console.warn('[movement-profile-v2-pose]', event.nativeEvent.message);
  }, []);

  const finishIfRawComplete = React.useCallback(
    (next: MovementProfileV2InternalFlowState) => {
      const checkUp = movementProfileV2RawCheckUpFromFlow(next);
      if (checkUp) onComplete({ checkUp, sourceType });
    },
    [onComplete, sourceType]
  );

  const runAction = React.useCallback(() => {
    if (flow.step === 'chair_setup') {
      voice.speak(['chair-stand-setup'], 8);
      dispatch({ type: 'confirm_chair_setup' });
      return;
    }
    if (flow.step === 'chair_practice') {
      dispatch({ type: 'complete_chair_practice' });
      return;
    }
    if (flow.step === 'chair_active') {
      const result = createCapturedChairRiseV2Result({ reps: 12 });
      dispatch({ type: 'record_chair', result });
      voice.speak(['item-complete'], 8);
      return;
    }
    if (flow.step === 'balance_setup') {
      voice.speak(['balance-setup', 'balance-single-leg'], 8);
      dispatch({ type: 'confirm_balance_setup', standingLeg: selectedLeg });
      return;
    }
    if (flow.step === 'balance_trials') {
      const result = createCapturedOneLegBalanceV2Result({
        standingLeg: selectedLeg,
        priorStandingLeg: flow.priorStandingLeg,
        holdsSec: [28, 31, 30],
      });
      dispatch({ type: 'record_balance', result });
      voice.speak(['item-complete'], 8);
      return;
    }
    if (flow.step === 'shoulder_setup') {
      voice.speak(['shoulder-setup'], 8);
      dispatch({ type: 'confirm_shoulder_setup', shoulderSide: selectedShoulder });
      return;
    }
    if (flow.step === 'shoulder_active') {
      const result = createCapturedActiveShoulderReachV2Result({
        selectedSide: selectedShoulder,
        priorSelectedSide: flow.priorShoulderSide,
        peakFlexionDeg: 154,
      });
      dispatch({ type: 'record_shoulder', result });
      voice.speak(['item-complete'], 8);
      return;
    }
    if (flow.step === 'hinge_capture') {
      const result = createCapturedHingeReachResult(0.24);
      const next = movementProfileV2InternalFlowReducer(flow, { type: 'record_hinge', result });
      dispatch({ type: 'record_hinge', result });
      voice.speak(['checkup-complete'], 9);
      finishIfRawComplete(next);
    }
  }, [finishIfRawComplete, flow, selectedLeg, selectedShoulder, voice]);

  const copy = stepCopy(flow.step);
  const actionLabel = stepActionLabel(flow.step);

  return (
    <View style={styles.container}>
      <SafePoseDetectionView
        active
        modelVariant="full"
        style={StyleSheet.absoluteFill}
        onLandmarks={onLandmarks}
        onPoseError={onPoseError}
        onAvailabilityChange={setCameraAvailability}
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
          {flow.backgrounded ? (
            <Text style={styles.warning}>Capture was interrupted by app backgrounding; restart if this was not intentional.</Text>
          ) : null}

          {flow.step === 'balance_setup' ? (
            <SidePicker
              label="Standing leg"
              value={selectedLeg}
              onChange={setSelectedLeg}
            />
          ) : null}
          {flow.step === 'shoulder_setup' ? (
            <SidePicker
              label="Shoulder side"
              value={selectedShoulder}
              onChange={setSelectedShoulder}
            />
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton title={actionLabel} onPress={runAction} />
            <SecondaryButton title="Cancel" onPress={onCancel} />
          </View>
        </View>
      </View>
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

function stepCopy(step: MovementProfileV2InternalFlowState['step']): { title: string; body: string } {
  switch (step) {
    case 'chair_setup':
      return { title: 'Chair rise setup', body: 'Use a sturdy chair. Sit side-on with your full body in view.' };
    case 'chair_practice':
      return { title: 'Practice rise', body: 'Do one easy practice stand before the timed capture.' };
    case 'chair_active':
      return { title: '30-second chair rise', body: 'Stand and sit as many times as feels comfortable in the capture window.' };
    case 'balance_setup':
      return { title: 'One-leg balance setup', body: 'Keep fingertips near a counter and choose the standing leg for this capture.' };
    case 'balance_trials':
      return { title: 'Best of three balance', body: 'Hale stores the best valid hold from up to three tries, with rests between tries.' };
    case 'shoulder_setup':
      return { title: 'Shoulder reach setup', body: 'Stand side-on and choose the shoulder side for the forward reach.' };
    case 'shoulder_active':
      return { title: 'Active shoulder reach', body: 'Raise the arm forward within a comfortable range, then relax.' };
    case 'hinge_capture':
      return { title: 'Forward reach', body: 'Fold forward comfortably. Hale keeps this as a supporting mobility number.' };
    default:
      return { title: 'Movement Profile', body: 'Raw capture is complete.' };
  }
}

function stepActionLabel(step: MovementProfileV2InternalFlowState['step']): string {
  switch (step) {
    case 'chair_setup':
    case 'balance_setup':
    case 'shoulder_setup':
      return 'Confirm setup';
    case 'chair_practice':
      return 'Practice complete';
    case 'hinge_capture':
      return 'Finish capture';
    default:
      return 'Record result';
  }
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
  warning: {
    ...type.cardCaption,
    color: colors.warningClay,
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
