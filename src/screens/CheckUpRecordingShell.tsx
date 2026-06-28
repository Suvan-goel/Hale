import * as React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';

import type {
  LandmarksEventPayload,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { useSystemInsets } from '../components/SystemInsetsProvider';
import {
  CameraUnavailableNotice,
  SafePoseDetectionView,
  type CameraAvailability,
} from '../components/SafePoseDetectionView';
import { ANDROID_VIDEO_ROT_640_POSE_PROFILE } from '../pose/nativePoseProfiles';
import { SkeletonView, type SkeletonViewHandle } from '../render/SkeletonView';
import type {
  PoseAvatarActiveDomain,
  PoseAvatarMeasurementState,
} from '../render/poseAvatarTypes';
import { colors, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import { poseEstimationWindowSize, recordingCameraViewportSize } from './recordingViewport';

const IOS_RECORDING_TOP_CLEARANCE = 44;

export type CheckUpShellModalMode = 'help' | 'setupIssue' | null;
export type CheckUpShellNoticeAction = 'help' | 'setupIssue';

export interface CheckUpShellNotice {
  text: string;
  action: CheckUpShellNoticeAction | null;
}

export interface CheckUpShellFooterMeta {
  progress: string | null;
  context: string | null;
}

export interface CheckUpShellStageDisplay {
  mode: 'metric';
  label: string;
  value: string;
}

export interface CheckUpShellControl {
  id: string;
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'normal' | 'danger';
  primary?: boolean;
}

export interface CheckUpRecordingAreaContext {
  cameraViewport: { width: number; height: number };
  poseWindow: { width: number; height: number; left: number; top: number };
}

export interface CheckUpRecordingShellProps {
  title: string;
  currentMovementName: string;
  cameraAvailability: CameraAvailability;
  cameraActive: boolean;
  latencyDiagnosticsEnabled?: boolean;
  onLandmarks: (event: { nativeEvent: LandmarksEventPayload }) => void;
  onPoseError: (event: { nativeEvent: PoseErrorEventPayload }) => void;
  onAvailabilityChange?: (availability: CameraAvailability) => void;
  skeletonRef: React.Ref<SkeletonViewHandle>;
  sessionNotice: CheckUpShellNotice | null;
  modalMode: CheckUpShellModalMode;
  setupIssue: boolean;
  footerMeta: CheckUpShellFooterMeta;
  stageDisplay: CheckUpShellStageDisplay | null;
  avatarMeasurementState: PoseAvatarMeasurementState;
  avatarDomain: PoseAvatarActiveDomain | null;
  controls: readonly CheckUpShellControl[];
  onRequestBack?: () => void;
  backAccessibilityLabel?: string;
  onOpenSupportModal: (mode: Exclude<CheckUpShellModalMode, null>) => void;
  onCloseSupportModal: () => void;
  onTryAgain: () => void;
  onSkip: () => void;
  discardModal?: {
    visible: boolean;
    onKeep: () => void;
    onDiscard: () => void;
  };
  latencyOverlay?: React.ReactNode;
  pointCloudBodyDotScale?: number;
  renderRecordingArea?: (context: CheckUpRecordingAreaContext) => React.ReactNode;
}

const CHECKUP_SETUP_ISSUE_TITLE = 'Hale cannot see this movement clearly';
const CHECKUP_SETUP_ISSUE_BODY =
  'Step back or adjust the phone, then try again. You can also skip this movement.';

const CHECKUP_SETUP_HELP_STEPS: readonly { title: string; body: string }[] = [
  {
    title: 'Step back',
    body: 'Make sure your whole body is in view.',
  },
  {
    title: 'Keep the phone still',
    body: 'Place it on a steady stand or shelf.',
  },
  {
    title: "Follow Hale's direction",
    body: 'Turn your body only when Hale asks.',
  },
];

export function CheckUpRecordingShell({
  title,
  currentMovementName,
  cameraAvailability,
  cameraActive,
  latencyDiagnosticsEnabled = false,
  onLandmarks,
  onPoseError,
  onAvailabilityChange,
  skeletonRef,
  sessionNotice,
  modalMode,
  setupIssue,
  footerMeta,
  stageDisplay,
  avatarMeasurementState,
  avatarDomain,
  controls,
  onRequestBack,
  backAccessibilityLabel = 'Leave Movement Check-Up',
  onOpenSupportModal,
  onCloseSupportModal,
  onTryAgain,
  onSkip,
  discardModal,
  latencyOverlay,
  pointCloudBodyDotScale = 1.72,
  renderRecordingArea,
}: CheckUpRecordingShellProps) {
  const windowSize = useWindowDimensions();
  const responsive = useResponsiveLayout();
  const systemInsets = useSystemInsets();
  const recordingTopPadding = recordingScreenTopPadding();
  const sessionNoticeAction = sessionNotice?.action ?? null;
  const viewportWidth = Math.max(1, Math.min(windowSize.width - spacing.md * 2, spacing.pageMaxWidth));
  const cameraViewport = React.useMemo(
    () => recordingCameraViewportSize(viewportWidth, windowSize.height, setupIssue || modalMode !== null),
    [modalMode, setupIssue, viewportWidth, windowSize.height]
  );
  const poseWindow = React.useMemo(
    () => poseEstimationWindowSize(cameraViewport.width, cameraViewport.height),
    [cameraViewport.height, cameraViewport.width]
  );
  const recordingFooterFrame = React.useMemo(
    () => ({
      top: poseWindow.top + poseWindow.height,
      height: Math.max(1, cameraViewport.height - (poseWindow.top + poseWindow.height)),
    }),
    [cameraViewport.height, poseWindow.height, poseWindow.top]
  );

  return (
    <View style={styles.container}>
      <SafePoseDetectionView
        active={cameraActive}
        modelVariant="full"
        {...ANDROID_VIDEO_ROT_640_POSE_PROFILE}
        latencyDiagnosticsEnabled={latencyDiagnosticsEnabled}
        style={StyleSheet.absoluteFill}
        onLandmarks={onLandmarks}
        onPoseError={onPoseError}
        onAvailabilityChange={onAvailabilityChange}
      />
      <ScrollView
        style={styles.layout}
        contentContainerStyle={[
          styles.layoutContent,
          responsive.isCompactPhone && styles.compactScreenPadding,
          { paddingTop: recordingTopPadding, paddingBottom: spacing.xl + systemInsets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.topBar}>
          {onRequestBack ? (
            <BackArrowButton
              accessibilityLabel={backAccessibilityLabel}
              onPress={onRequestBack}
              style={styles.topBarBackButton}
            />
          ) : null}
          <Text style={styles.topBarTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
            {title}
          </Text>
        </View>

        <View style={styles.avatarSlot}>
          <View style={[styles.avatarViewport, cameraViewport]}>
            <View pointerEvents="box-none" style={styles.recordingChrome}>
              <HeaderLogo size={34} style={styles.recordingLogo} />
              <RecordingSetupNotice
                visible={sessionNotice !== null}
                text={sessionNotice?.text ?? ''}
                onPress={
                  sessionNoticeAction
                    ? () => onOpenSupportModal(sessionNoticeAction)
                    : undefined
                }
              />
              <Pressable
                style={({ pressed }) => [
                  styles.helpIconButton,
                  modalMode !== null && styles.helpIconButtonSelected,
                  pressed && styles.controlPressed,
                ]}
                onPress={() => onOpenSupportModal(setupIssue ? 'setupIssue' : 'help')}
                accessibilityRole="button"
                accessibilityLabel="Open help"
                accessibilityState={{ selected: modalMode !== null }}
              >
                <Text style={[styles.helpIconText, modalMode !== null && styles.helpIconTextSelected]}>?</Text>
              </Pressable>
            </View>
            {cameraAvailability === 'unavailable' ? (
              <CameraUnavailableNotice compact style={styles.recordingCameraUnavailableNotice} />
            ) : renderRecordingArea ? (
              renderRecordingArea({ cameraViewport, poseWindow })
            ) : (
              <SkeletonView
                ref={skeletonRef}
                mirrored
                fit="contain"
                frameSource="raw"
                smoothingEnabled={false}
                pointCloudBodyDensity="high"
                pointCloudBodyMaxDots={900}
                pointCloudBodyDotScale={pointCloudBodyDotScale}
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
            <CheckupCardFooter
              title={currentMovementName}
              meta={footerMeta}
              display={stageDisplay}
              style={recordingFooterFrame}
            />
          </View>
        </View>

        <View style={styles.bottomPanel}>
          {controls.length > 0 ? (
            <View style={styles.controls}>
              {controls.map((control) => (
                <ControlButton
                  key={control.id}
                  title={control.title}
                  onPress={control.onPress}
                  disabled={control.disabled}
                  tone={control.tone}
                  primary={control.primary}
                />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <CheckupSupportModal
        visible={modalMode !== null}
        mode={modalMode ?? 'help'}
        onClose={onCloseSupportModal}
        onTryAgain={onTryAgain}
        onSkip={onSkip}
      />
      <DiscardCheckupModal
        visible={discardModal?.visible ?? false}
        onKeep={discardModal?.onKeep ?? onCloseSupportModal}
        onDiscard={discardModal?.onDiscard ?? onCloseSupportModal}
      />
      {latencyOverlay}
    </View>
  );
}

function RecordingSetupNotice({
  visible,
  text,
  onPress,
}: {
  visible: boolean;
  text: string;
  onPress?: () => void;
}) {
  if (!visible) {
    return <View pointerEvents="none" style={styles.recordingSetupNoticeSlot} />;
  }

  return (
    <View style={styles.recordingSetupNoticeSlot}>
      <Pressable
        style={({ pressed }) => [styles.recordingSetupNotice, pressed && onPress && styles.controlPressed]}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityLabel={onPress ? 'Open setup help' : text}
      >
        <View style={styles.recordingSetupNoticeSignal}>
          <View style={styles.recordingSetupNoticeDot} />
        </View>
        <View style={styles.recordingSetupNoticeCopy}>
          <Text style={styles.recordingSetupNoticeTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.84}>
            {text}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function CheckupSupportModal({
  visible,
  mode,
  onClose,
  onTryAgain,
  onSkip,
}: {
  visible: boolean;
  mode: Exclude<CheckUpShellModalMode, null>;
  onClose: () => void;
  onTryAgain: () => void;
  onSkip: () => void;
}) {
  const responsive = useResponsiveLayout();
  const [expanded, setExpanded] = React.useState(mode === 'help');
  const isSetupIssue = mode === 'setupIssue';

  React.useEffect(() => {
    if (visible) {
      setExpanded(mode === 'help');
    }
  }, [mode, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackdrop, responsive.isCompactPhone && styles.compactModalBackdrop]}>
        <View style={[styles.helpModal, responsive.isCompactPhone && styles.compactCardPadding]}>
          <View style={styles.helpModalHeader}>
            <HeaderLogo size={26} />
            <Text style={styles.modalEyebrow}>{isSetupIssue ? 'Setup issue' : 'Setup help'}</Text>
          </View>
          <View style={styles.helpIntro}>
            <Text style={styles.modalTitle}>
              {isSetupIssue ? CHECKUP_SETUP_ISSUE_TITLE : 'Help Hale see you clearly'}
            </Text>
            <Text style={styles.modalBody}>
              {isSetupIssue
                ? CHECKUP_SETUP_ISSUE_BODY
                : 'Use these quick checks before each movement.'}
            </Text>
          </View>

          {expanded ? (
            <>
              <View style={styles.helpStepList}>
                {CHECKUP_SETUP_HELP_STEPS.map((step, index) => (
                  <View key={step.title} style={styles.helpStepRow}>
                    <Text style={styles.helpStepNumber}>{index + 1}</Text>
                    <View style={styles.helpStepCopy}>
                      <Text style={styles.helpStepTitle}>{step.title}</Text>
                      <Text style={styles.helpStepBody}>{step.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.helpSafetyLine}>
                <Text style={styles.helpSafetyLineText}>
                  <Text style={styles.helpSafetyLineStrong}>Keep support nearby. </Text>
                  Stop if you feel dizzy, sharp pain, or unsteady.
                </Text>
              </View>
            </>
          ) : null}

          <View style={styles.modalActions}>
            {isSetupIssue ? (
              <>
                <Pressable
                  style={({ pressed }) => [styles.modalButton, styles.modalKeepButton, pressed && styles.controlPressed]}
                  onPress={onTryAgain}
                  accessibilityRole="button"
                  accessibilityLabel="Try setup again"
                >
                  <Text style={styles.modalKeepText}>Try again</Text>
                </Pressable>
                {!expanded ? (
                  <Pressable
                    style={({ pressed }) => [styles.modalButton, styles.modalSecondaryButton, pressed && styles.controlPressed]}
                    onPress={() => setExpanded(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Show setup tips"
                  >
                    <Text style={styles.modalSecondaryText}>Setup tips</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={({ pressed }) => [styles.modalButton, styles.modalSecondaryButton, pressed && styles.controlPressed]}
                  onPress={onSkip}
                  accessibilityRole="button"
                  accessibilityLabel="Skip this movement"
                >
                  <Text style={styles.modalSecondaryText}>Skip this movement</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.modalButton, styles.modalKeepButton, pressed && styles.controlPressed]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close help"
              >
                <Text style={styles.modalKeepText}>Close</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DiscardCheckupModal({
  visible,
  onKeep,
  onDiscard,
}: {
  visible: boolean;
  onKeep: () => void;
  onDiscard: () => void;
}) {
  const responsive = useResponsiveLayout();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeep}
    >
      <View style={[styles.modalBackdrop, responsive.isCompactPhone && styles.compactModalBackdrop]}>
        <View style={[styles.discardModal, responsive.isCompactPhone && styles.compactCardPadding]}>
          <Text style={styles.modalEyebrow}>Leave check-up?</Text>
          <Text style={styles.modalTitle}>Leave without saving?</Text>
          <Text style={styles.modalBody}>
            This Movement Check-Up will stop and any unfinished results from this check-up will not be saved.
          </Text>
          <View style={styles.modalActions}>
            <Pressable
              style={({ pressed }) => [styles.modalButton, styles.modalKeepButton, pressed && styles.controlPressed]}
              onPress={onKeep}
              accessibilityRole="button"
              accessibilityLabel="Keep Movement Check-Up"
            >
              <Text style={styles.modalKeepText}>Keep check-up</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.modalButton, styles.modalDiscardButton, pressed && styles.controlPressed]}
              onPress={onDiscard}
              accessibilityRole="button"
              accessibilityLabel="Leave Movement Check-Up without saving"
            >
              <Text style={styles.modalDiscardText}>Leave without saving</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CheckupCardFooter({
  title,
  meta,
  display,
  style,
}: {
  title: string;
  meta: CheckUpShellFooterMeta;
  display: CheckUpShellStageDisplay | null;
  style: StyleProp<ViewStyle>;
}) {
  const responsive = useResponsiveLayout();
  const compactMeta = meta.progress !== null && meta.context !== null;
  const metaLine = compactMeta ? `${meta.progress} · ${meta.context}` : meta.progress;
  const displayValue = display ? (
    <Text
      style={styles.recordingFooterMetricValue}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.76}
    >
      {display.value}
    </Text>
  ) : null;
  const displayLabel = display ? (
    <Text style={styles.recordingFooterMetricLabel}>
      {display.label}
    </Text>
  ) : null;

  return (
    <View pointerEvents="none" style={[styles.recordingFooter, responsive.isCompactPhone && styles.compactCardPadding, style]}>
      <View style={styles.recordingFooterMovement}>
        <Text
          style={styles.recordingFooterMovementName}
          numberOfLines={meta.progress ? 2 : 1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
        >
          {title}
        </Text>
        {metaLine ? (
          <Text style={styles.recordingFooterMovementMeta} numberOfLines={1}>
            {metaLine}
          </Text>
        ) : null}
        {meta.context && !compactMeta ? (
          <Text style={styles.recordingFooterMovementSet} numberOfLines={1}>
            {meta.context}
          </Text>
        ) : null}
      </View>
      {display ? (
        <View style={styles.recordingFooterMetric}>
          <View style={styles.recordingFooterMetricDivider} />
          <View style={styles.recordingFooterMetricContent}>
            {displayValue}
            {displayLabel}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ControlButton({
  title,
  onPress,
  disabled,
  tone = 'normal',
  primary,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'normal' | 'danger';
  primary?: boolean;
}) {
  const isPrimary = primary || title === 'Pause' || title === 'Resume';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.controlButton,
        isPrimary && styles.controlPrimary,
        tone === 'danger' && styles.controlDanger,
        disabled && styles.controlDisabled,
        pressed && !disabled && styles.controlPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text
        style={[
          styles.controlText,
          isPrimary && styles.controlPrimaryText,
          disabled && styles.controlTextDisabled,
          tone === 'danger' && styles.controlDangerText,
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function recordingScreenTopPadding(): number {
  const statusBarHeight =
    Platform.OS === 'android'
      ? StatusBar.currentHeight ?? 0
      : Platform.OS === 'ios'
        ? IOS_RECORDING_TOP_CLEARANCE
        : 0;
  return Math.max(spacing.lg, statusBarHeight + spacing.lg);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  layout: {
    flex: 1,
  },
  layoutContent: {
    minHeight: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  compactScreenPadding: {
    paddingHorizontal: 16,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  compactModalBackdrop: {
    paddingHorizontal: 16,
  },
  topBar: {
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  topBarBackButton: {
    width: 18,
    height: 36,
    marginBottom: 0,
    alignSelf: 'center',
  },
  topBarTitle: {
    ...type.pageTitle,
    fontSize: 22,
    lineHeight: 28,
    flex: 1,
    color: colors.textPrimary,
  },
  avatarSlot: {
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarViewport: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow.card,
  },
  recordingCameraUnavailableNotice: {
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  recordingChrome: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recordingLogo: {
    opacity: 0.92,
  },
  recordingSetupNoticeSlot: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  recordingSetupNotice: {
    width: '100%',
    maxWidth: 228,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 0 18px rgba(17,20,18,0.055)',
  },
  recordingSetupNoticeSignal: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    backgroundColor: colors.bgGold,
  },
  recordingSetupNoticeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accentGold,
  },
  recordingSetupNoticeCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  recordingSetupNoticeTitle: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
  helpIconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  helpIconButtonSelected: {
    backgroundColor: 'transparent',
  },
  helpIconText: {
    ...type.cardRowTitle,
    color: colors.accentDeep,
    fontSize: 24,
    lineHeight: 28,
  },
  helpIconTextSelected: {
    color: colors.accentDeep,
  },
  recordingFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  recordingFooterMovement: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  recordingFooterMovementName: {
    ...type.cardTitle,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  recordingFooterMovementMeta: {
    ...type.bodySmall,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  recordingFooterMovementSet: {
    ...type.bodySmall,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  recordingFooterMetric: {
    width: 142,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.lg,
  },
  recordingFooterMetricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 66,
    backgroundColor: colors.borderHairline,
  },
  recordingFooterMetricContent: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
    gap: 0,
  },
  recordingFooterMetricLabel: {
    ...type.label,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  recordingFooterMetricValue: {
    ...type.cardTitle,
    fontSize: 42,
    lineHeight: 46,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  bottomPanel: {
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    gap: spacing.md,
    alignItems: 'stretch',
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  controlButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  controlDanger: { borderColor: colors.cautionBorder, backgroundColor: colors.cautionSoft },
  controlDisabled: { opacity: 0.45 },
  controlPressed: { opacity: 0.76 },
  controlText: { ...type.cardRowTitle, color: colors.accentDeep, textAlign: 'center' },
  controlPrimaryText: { color: colors.onAccent },
  controlTextDisabled: { color: colors.textTertiary },
  controlDangerText: { color: colors.error },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(17,20,18,0.24)',
  },
  discardModal: {
    width: '100%',
    maxWidth: 360,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    boxShadow: '0 0 28px rgba(17,20,18,0.12)',
  },
  helpModal: {
    width: '100%',
    maxWidth: 380,
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.modal,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 0 34px rgba(17,20,18,0.13)',
  },
  helpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  helpIntro: {
    gap: spacing.sm,
  },
  modalEyebrow: {
    ...type.label,
    color: colors.accentDeep,
  },
  modalTitle: {
    ...type.cardTitle,
    fontSize: 22,
    lineHeight: 28,
  },
  modalBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  modalActions: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  modalButton: {
    minHeight: 56,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  modalKeepButton: {
    backgroundColor: colors.accent,
  },
  modalSecondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalDiscardButton: {
    backgroundColor: colors.cautionSoft,
    borderWidth: 1,
    borderColor: colors.cautionBorder,
  },
  modalKeepText: {
    ...type.button,
    color: colors.onAccent,
  },
  modalSecondaryText: {
    ...type.button,
    color: colors.accentDeep,
  },
  modalDiscardText: {
    ...type.button,
    color: colors.error,
  },
  helpStepList: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  helpStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  helpStepNumber: {
    ...type.cardCaption,
    width: 26,
    height: 26,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    color: colors.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  helpStepCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  helpStepTitle: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
  },
  helpStepBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  helpSafetyLine: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  helpSafetyLineText: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  helpSafetyLineStrong: {
    fontFamily: type.cardRowTitle.fontFamily,
    color: colors.textPrimary,
  },
});
