/**
 * Check-up #0 host (Option 1 build, acceptance criteria in
 * docs/pre-promotion-checklist.md): brief guided gentle warm-up → the
 * two-protocol battery (one-leg balance on the anchored SINGLE side — ruled
 * 2026-07-06, preserving the instrument's side-consistency — then the
 * 30-second chair rise, max effort LAST), run by the real unified machinery with a
 * batterySequence derived from the pinned CHECKUP_ZERO_PROTOCOL_SEQUENCE.
 *
 * WARM-UP PLACEMENT (stated choice, per the ruling's allowance): HOST-LEVEL,
 * before the coordinator starts. It is a non-measurement stage by
 * construction — no camera, no evidence, no scores, skippable without
 * consequence — and the coordinator's machine stays purely for measurement.
 *
 * Measurement semantics are untouched: results exist only as the CheckUp the
 * unified screen emits; the caller feeds it through assessmentInputsFromCheckUp
 * into applyAssessmentPlacement. Abandonment is penalty-free: onCancel emits
 * nothing, applies nothing, burns no once-only surface.
 */

import * as React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { BRAND } from '../brand';
import { GhostButton, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { checkupZeroBatterySequence } from '../programme';
import { createMovementProfileV2InternalFlow } from '../movementProfileV2/internalCheckupFlow';
import type { CheckUp } from '../checkup';
import type { StoredCheckUp } from '../history';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import { MovementProfileV2UnifiedCheckUpScreen } from './MovementProfileV2UnifiedCheckUpScreen';
import { ClarityCheckInScreen } from './ClarityCheckInScreen';

const WARM_UP_SECONDS = 60;

export function ProgrammeCheckupZeroScreen({
  onComplete,
  onRawCheckUpReady,
  onCancel,
  voiceId,
  history,
  initialDraft,
  showSymptomLoad,
  cameraPermissionGranted,
  onRequestCameraPermission,
}: {
  onComplete: (checkUp: CheckUp) => void;
  /** Fired the moment the measured battery exists — persist here (crash-safe). */
  onRawCheckUpReady?: (checkUp: CheckUp) => void;
  onCancel: () => void;
  voiceId?: string;
  /** Stored check-up history: anchors the standing leg / shoulder side to the
   * prior official record (side-consistency is measurement hygiene). */
  history?: readonly StoredCheckUp[];
  /** Recoverable movement battery that has not entered official history yet. */
  initialDraft?: CheckUp | null;
  /** Offers optional menopause-symptom context when relevant to the profile. */
  showSymptomLoad: boolean;
  /** Camera permission state, owned by the shell (single source of truth). */
  cameraPermissionGranted: boolean;
  /** Requests camera permission; resolves true when granted. The OS dialog
   * must appear HERE, over this static intro — never mid-battery while the
   * intro voice line is already speaking over it. */
  onRequestCameraPermission: () => Promise<boolean>;
}) {
  const [phase, setPhase] = React.useState<'intro' | 'warmup' | 'battery' | 'clarity'>(
    () => (initialDraft ? 'clarity' : 'intro')
  );
  const [measuredCheckUp, setMeasuredCheckUp] = React.useState<CheckUp | null>(
    initialDraft ?? null
  );
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [warmupRemaining, setWarmupRemaining] = React.useState(WARM_UP_SECONDS);
  const startedAtRef = React.useRef<string | null>(initialDraft?.startedAt ?? null);

  React.useEffect(() => {
    if (phase !== 'warmup') return;
    const interval = setInterval(() => {
      setWarmupRemaining((remaining) => {
        if (remaining <= 1) {
          clearInterval(interval);
          setPhase('battery');
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const startWarmup = React.useCallback(async () => {
    if (cameraPermissionGranted || (await onRequestCameraPermission())) {
      setPermissionDenied(false);
      setPhase('warmup');
      return;
    }
    setPermissionDenied(true);
  }, [cameraPermissionGranted, onRequestCameraPermission]);

  if (phase === 'intro') {
    if (permissionDenied) {
      return (
        <CheckupZeroMessage
          title="Camera access needed"
          subtitle={`${BRAND.appName} uses your phone's camera to measure the check-up. You will not see a live video of yourself — just a simple outline, and nothing leaves your phone.`}
          panelText="If the phone doesn't ask again, allow camera access in your phone's settings, then come back."
        >
          <PrimaryButton title="Allow camera" onPress={() => void startWarmup()} />
          <SecondaryButton title="Open phone settings" onPress={() => void Linking.openSettings()} />
          <GhostButton title="Not now" onPress={onCancel} />
        </CheckupZeroMessage>
      );
    }
    return (
      <CheckupZeroMessage
        title="About eight minutes, at your pace"
        subtitle="A fixed warm-up, a balance hold, thirty seconds of chair stands, then an optional Everyday Clarity check-in."
        panelText="Your phone measures Strength and Balance without showing your video. Everything stays on this device."
      >
        <PrimaryButton title="Start with the warm-up" onPress={() => void startWarmup()} />
        <GhostButton title="Not now" onPress={onCancel} />
      </CheckupZeroMessage>
    );
  }

  if (phase === 'warmup') {
    return (
      <CheckupZeroMessage
        title="Easy does it"
        subtitle="March gently on the spot, roll your shoulders, then add a few easy arm reaches. The same warm-up at every check-up helps make your results more comparable."
        countdownSeconds={warmupRemaining}
      >
        <GhostButton title="Stop for now" onPress={onCancel} />
      </CheckupZeroMessage>
    );
  }

  if (phase === 'clarity' && measuredCheckUp) {
    return (
      <ClarityCheckInScreen
        showSymptomLoad={showSymptomLoad}
        initialValue={measuredCheckUp.selfReport}
        onDone={(selfReport) => {
          const { selfReport: _previous, ...movementCheckUp } = measuredCheckUp;
          const completeCheckUp: CheckUp = selfReport
            ? { ...movementCheckUp, selfReport }
            : movementCheckUp;
          onRawCheckUpReady?.(completeCheckUp);
          onComplete(completeCheckUp);
        }}
      />
    );
  }

  if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
  // Source type derives from history (baseline vs retake) — these ARE the
  // official check-ups of record; the host saves them as such (2026-07-09).
  const initialFlow = createMovementProfileV2InternalFlow({
    startedAt: startedAtRef.current,
    history,
    batterySequence: checkupZeroBatterySequence(),
  });
  return (
    <MovementProfileV2UnifiedCheckUpScreen
      startedAt={startedAtRef.current}
      sourceType={initialFlow.sourceType}
      initialFlow={initialFlow}
      voiceId={voiceId}
      onRawCheckUpReady={onRawCheckUpReady ? ({ checkUp }) => onRawCheckUpReady(checkUp) : undefined}
      onComplete={({ checkUp }) => {
        setMeasuredCheckUp(checkUp);
        onRawCheckUpReady?.(checkUp);
        setPhase('clarity');
      }}
      onCancel={onCancel}
    />
  );
}

/** Intro/warm-up message layout in the check-up flow's design language. */
function CheckupZeroMessage({
  title,
  subtitle,
  panelText,
  countdownSeconds,
  children,
}: {
  title: string;
  subtitle: string;
  panelText?: string;
  countdownSeconds?: number;
  children: React.ReactNode;
}) {
  const responsive = useResponsiveLayout();
  return (
    <Screen tone="focus" contentStyle={checkupStyles.screen}>
      <ScreenHeader eyebrow={`${BRAND.appName} check-up`} title={title} subtitle={subtitle} />
      {countdownSeconds !== undefined ? (
        <View style={[checkupStyles.panel, checkupStyles.countdownPanel]}>
          <Text
            style={checkupStyles.countdown}
            accessibilityLabel={`${countdownSeconds} seconds remaining`}
          >
            {countdownSeconds}
            <Text style={checkupStyles.countdownUnit}>s</Text>
          </Text>
        </View>
      ) : null}
      {panelText ? (
        <View style={[checkupStyles.panel, responsive.isCompactPhone && checkupStyles.compactCardPadding]}>
          <Text style={checkupStyles.panelBody}>{panelText}</Text>
        </View>
      ) : null}
      <View style={checkupStyles.actions}>{children}</View>
    </Screen>
  );
}

const checkupStyles = StyleSheet.create({
  screen: {
    paddingTop: spacing.pageTop,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  panel: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.sm,
    backgroundColor: colors.focusSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.soft,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  panelBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  countdownPanel: {
    alignItems: 'center',
  },
  countdown: {
    color: colors.accentDeep,
    fontFamily: fonts.serifMedium,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  countdownUnit: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 20,
    lineHeight: 26,
  },
  actions: {
    gap: spacing.md,
  },
});
