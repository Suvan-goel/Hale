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

const WARM_UP_SECONDS = 45;

export function ProgrammeCheckupZeroScreen({
  onComplete,
  onRawCheckUpReady,
  onCancel,
  voiceId,
  history,
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
  /** Camera permission state, owned by the shell (single source of truth). */
  cameraPermissionGranted: boolean;
  /** Requests camera permission; resolves true when granted. The OS dialog
   * must appear HERE, over this static intro — never mid-battery while the
   * intro voice line is already speaking over it. */
  onRequestCameraPermission: () => Promise<boolean>;
}) {
  const [phase, setPhase] = React.useState<'intro' | 'warmup' | 'battery'>('intro');
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [warmupRemaining, setWarmupRemaining] = React.useState(WARM_UP_SECONDS);
  const startedAtRef = React.useRef<string | null>(null);

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
        title="Two minutes of moving"
        subtitle="A gentle warm-up, a balance hold, then thirty seconds of chair stands. That’s the whole thing."
        panelText="Your phone’s camera does the measuring. No one sees this but you — it’s processed on your phone and never leaves it."
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
        subtitle="March gently on the spot and roll your shoulders. Add a few easy arm reaches when you feel like it."
        countdownSeconds={warmupRemaining}
      >
        <SecondaryButton title="I’m warm — let’s go" onPress={() => setPhase('battery')} />
        <GhostButton title="Stop for now" onPress={onCancel} />
      </CheckupZeroMessage>
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
      onComplete={({ checkUp }) => onComplete(checkUp)}
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
      <ScreenHeader eyebrow="Movement check" title={title} subtitle={subtitle} />
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
