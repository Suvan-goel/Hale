/**
 * Check-up #0 host (Option 1 build, acceptance criteria in
 * docs/pre-promotion-checklist.md): a visual preview of the two movements →
 * brief guided gentle warm-up → the two-protocol battery (one-leg balance on
 * the anchored SINGLE side — ruled
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
import {
  Image,
  type ImageSourcePropType,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BRAND } from '../brand';
import { voicePriority, type VoiceCueKey } from '../audio/cues';
import { VoiceChannel } from '../audio/voicePlayer';
import { GhostButton, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { checkupZeroBatterySequence } from '../programme';
import {
  createMovementProfileV2InternalFlow,
  type MovementProfileV2InternalFlowState,
} from '../movementProfileV2/internalCheckupFlow';
import type { CheckUp } from '../checkup';
import type { StoredCheckUp } from '../history';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import { MovementProfileV2UnifiedCheckUpScreen } from './MovementProfileV2UnifiedCheckUpScreen';
import { ClarityCheckInScreen } from './ClarityCheckInScreen';

const WARM_UP_SECONDS = 60;
/** Breath between the warm-up hitting zero and the camera flow starting, so
 * Clara's intro never begins while she is still mid-march — sized to let the
 * spoken position line finish before the battery's own voice channel starts.
 * Measurement is already protected (the frame check requires stillness). */
const POSITION_BEAT_MS = 8000;

/** Follow-along list so she has something to track mid-countdown instead of
 * recalling a sentence read once. The warm-up itself stays fixed (comparability). */
const WARM_UP_MOVES: readonly string[] = [
  'March gently on the spot',
  'Roll your shoulders',
  'Add a few easy arm reaches',
];

/** Clara paces the fixed warm-up (the check-up is voice-led everywhere else,
 * and a spoken pace repeats more consistently than self-read text). Keyed by
 * the countdown value each move begins at; the moves match WARM_UP_MOVES. */
const WARM_UP_VOICE_AT_REMAINING: Readonly<Record<number, VoiceCueKey>> = {
  [WARM_UP_SECONDS]: 'checkup-warmup-start',
  40: 'checkup-warmup-shoulders',
  20: 'checkup-warmup-reaches',
};

/**
 * The setup a check-up actually needs, stated at the moment of commitment so
 * she can pick her moment instead of discovering the requirements mid-flow
 * (2026-07-14 onboarding review). Leaving here is penalty-free by design.
 */
const CHECKUP_SETUP_CHECKLIST: readonly string[] = [
  'A sturdy chair',
  'A couple of steps of clear space',
  'The main light on',
  'Somewhere to prop your phone at about hip height',
];

const CHECKUP_MOVEMENT_GUIDES: readonly Readonly<{
  id: 'balance' | 'chair_rise';
  image: ImageSourcePropType;
  step: string;
  domain: string;
  phoneView: string;
  title: string;
  body: string;
  accessibilityLabel: string;
}>[] = [
  {
    id: 'balance',
    image: require('../../assets/images/instructional/guide-balance.jpg'),
    step: '01',
    domain: 'BALANCE',
    phoneView: 'Phone in front',
    title: 'One-leg balance',
    body: 'Lift one foot and hold with your eyes open — up to three short holds, with rests between. Keep a sturdy support within reach.',
    accessibilityLabel: 'One-leg balance setup and hold sequence, viewed from the front',
  },
  {
    id: 'chair_rise',
    image: require('../../assets/images/instructional/guide-chair-rise.jpg'),
    step: '02',
    domain: 'STRENGTH',
    phoneView: 'Phone side-on',
    title: 'Thirty-second chair stands',
    body: 'From a sturdy chair, stand fully, then sit with control. Keep both feet flat.',
    accessibilityLabel: 'Chair stand sequence from seated to standing, viewed from the side',
  },
];

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
  const [phase, setPhase] = React.useState<
    'intro' | 'warmup' | 'position' | 'guides' | 'battery' | 'clarity'
  >(() => (initialDraft ? 'clarity' : 'intro'));
  const [measuredCheckUp, setMeasuredCheckUp] = React.useState<CheckUp | null>(
    initialDraft ?? null
  );
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [warmupRemaining, setWarmupRemaining] = React.useState(WARM_UP_SECONDS);
  const startedAtRef = React.useRef<string | null>(initialDraft?.startedAt ?? null);
  // Created once when the battery phase first renders (its startedAt is the
  // moment the battery begins, not screen mount); the unified screen's
  // coordinator locks onto its first initialFlow anyway.
  const initialFlowRef = React.useRef<MovementProfileV2InternalFlowState | null>(null);
  // Host-level voice for the warm-up/position corridor only. The battery owns
  // its own channel; this one is stopped before the battery mounts so Clara
  // never overlaps herself.
  const [warmupVoice] = React.useState(() => new VoiceChannel(voiceId));

  React.useEffect(() => () => warmupVoice.stop(), [warmupVoice]);

  React.useEffect(() => {
    if (phase !== 'warmup') return;
    const interval = setInterval(() => {
      setWarmupRemaining((remaining) => {
        if (remaining <= 1) {
          clearInterval(interval);
          setPhase('position');
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  React.useEffect(() => {
    if (phase !== 'warmup') return;
    const cue = WARM_UP_VOICE_AT_REMAINING[warmupRemaining];
    if (cue) warmupVoice.speak([cue], voicePriority(cue));
  }, [phase, warmupRemaining, warmupVoice]);

  React.useEffect(() => {
    if (phase === 'battery') warmupVoice.stop();
  }, [phase, warmupVoice]);

  React.useEffect(() => {
    if (phase !== 'position') return;
    warmupVoice.speak(['checkup-warmup-position'], voicePriority('checkup-warmup-position'));
    const timer = setTimeout(() => setPhase('battery'), POSITION_BEAT_MS);
    return () => clearTimeout(timer);
  }, [phase, warmupVoice]);

  const prepareCheckup = React.useCallback(async () => {
    if (cameraPermissionGranted || (await onRequestCameraPermission())) {
      setPermissionDenied(false);
      setPhase('guides');
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
          <PrimaryButton title="Allow camera" onPress={() => void prepareCheckup()} />
          <SecondaryButton title="Open phone settings" onPress={() => void Linking.openSettings()} />
          <GhostButton title="Not now" onPress={onCancel} />
        </CheckupZeroMessage>
      );
    }
    return (
      <CheckupZeroMessage
        title="Usually about eight minutes, at your pace"
        subtitle="A fixed warm-up, up to three balance holds, thirty seconds of chair stands, then an optional Everyday Clarity check-in."
        checklist={CHECKUP_SETUP_CHECKLIST}
        panelText="Your phone measures Strength and Balance without showing your video. Everything stays on this device."
      >
        <PrimaryButton title="See the two movements" onPress={() => void prepareCheckup()} />
        <GhostButton title="I’ll set up and come back" onPress={onCancel} />
      </CheckupZeroMessage>
    );
  }

  if (phase === 'warmup') {
    return (
      <CheckupZeroMessage
        title="Easy does it"
        subtitle="Prop your phone at about hip height, then follow Clara's pace — the same warm-up at every check-up helps make your results more comparable."
        countdownSeconds={warmupRemaining}
        countdownSequence={WARM_UP_MOVES}
      >
        <GhostButton title="Leave check-up" onPress={onCancel} />
      </CheckupZeroMessage>
    );
  }

  if (phase === 'position') {
    return (
      <CheckupZeroMessage
        title="Nicely done"
        subtitle="Take a breath and step back to where the camera can see all of you. Clara will take it from here."
      >
        <GhostButton title="Leave check-up" onPress={onCancel} />
      </CheckupZeroMessage>
    );
  }

  if (phase === 'guides') {
    return (
      <Screen tone="focus" contentStyle={checkupStyles.screen}>
        <ScreenHeader
          eyebrow={`${BRAND.appName} check-up`}
          title="Your two movements"
          subtitle="Balance comes first, then Strength. Clara, your voice guide, will explain the exact setup and timing before each one."
          prominentTitle
        />
        <View style={checkupStyles.guideList}>
          {CHECKUP_MOVEMENT_GUIDES.map((guide) => (
            <View key={guide.id} style={checkupStyles.guideCard}>
              <View style={checkupStyles.guideImageFrame}>
                <Image
                  source={guide.image}
                  style={checkupStyles.guideImage}
                  accessibilityLabel={guide.accessibilityLabel}
                  resizeMode="contain"
                  accessible
                  accessibilityRole="image"
                />
              </View>
              <View style={checkupStyles.guideCopy}>
                <View style={checkupStyles.guideMetaRow}>
                  <Text style={checkupStyles.guideStep}>{guide.step}</Text>
                  <Text style={checkupStyles.guideDomain}>{guide.domain}</Text>
                  {/* Where the phone goes is the make-or-break setup fact —
                      it earns a tag, not a whisper. */}
                  <View style={checkupStyles.guidePhonePill}>
                    <Text style={checkupStyles.guidePhonePillText}>{guide.phoneView}</Text>
                  </View>
                </View>
                <Text style={checkupStyles.guideTitle}>{guide.title}</Text>
                <Text style={checkupStyles.guideBody}>{guide.body}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={checkupStyles.guideNote}>
          Clara gives the full instructions before each movement. These pictures are a preview,
          not a form assessment.
        </Text>
        <View style={checkupStyles.actions}>
          <PrimaryButton title="Begin the one-minute warm-up" onPress={() => setPhase('warmup')} />
          {/* Honest exit label: this leaves the whole check-up (penalty-free),
              so it must not read as a pause. */}
          <GhostButton title="Leave check-up" onPress={onCancel} />
        </View>
      </Screen>
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
  if (!initialFlowRef.current) {
    initialFlowRef.current = createMovementProfileV2InternalFlow({
      startedAt: startedAtRef.current,
      history,
      batterySequence: checkupZeroBatterySequence(),
    });
  }
  const initialFlow = initialFlowRef.current;
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
  checklist,
  countdownSeconds,
  countdownSequence,
  children,
}: {
  title: string;
  subtitle: string;
  panelText?: string;
  /** One-glance setup rows shown above the panel text. */
  checklist?: readonly string[];
  countdownSeconds?: number;
  /** Follow-along moves listed beneath the countdown. */
  countdownSequence?: readonly string[];
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
          {countdownSequence ? (
            <View style={checkupStyles.countdownSequence} accessibilityRole="list">
              {countdownSequence.map((move, index) => (
                <View key={move} style={checkupStyles.countdownSequenceRow}>
                  <Text style={checkupStyles.countdownSequenceNumber}>{index + 1}</Text>
                  <Text style={checkupStyles.countdownSequenceText}>{move}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      {checklist ? (
        <View
          style={[checkupStyles.panel, responsive.isCompactPhone && checkupStyles.compactCardPadding]}
          accessibilityRole="list"
        >
          <Text style={checkupStyles.checklistTitle}>Have ready</Text>
          {checklist.map((item) => (
            <View key={item} style={checkupStyles.checklistRow}>
              <View style={checkupStyles.checklistDot} />
              <Text style={checkupStyles.checklistText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {/* Reassurance copy reads as a quiet caption, not a second panel
          competing with the checklist. */}
      {panelText ? <Text style={checkupStyles.panelNote}>{panelText}</Text> : null}
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
  // One panel recipe across the check-up flow's message surfaces: card
  // radius, hairline, no shadow — matching the guide cards and the app's
  // flat editorial language.
  panel: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.focusSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  panelNote: {
    ...type.bodySmall,
    color: colors.textSecondary,
    maxWidth: 540,
  },
  guideCard: {
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.focusSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  guideList: {
    gap: spacing.lg,
  },
  guideImageFrame: {
    width: '100%',
    aspectRatio: 1200 / 659,
    overflow: 'hidden',
    backgroundColor: colors.focusSurface,
  },
  guideImage: {
    width: '100%',
    height: '100%',
  },
  guideCopy: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  guideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  guideStep: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.8,
  },
  guideDomain: {
    ...type.label,
    color: colors.accentDeep,
  },
  guidePhonePill: {
    marginLeft: 'auto',
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.bgGold,
  },
  guidePhonePillText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  guideTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 23,
    lineHeight: 29,
    color: colors.textPrimary,
  },
  guideBody: {
    ...type.cardBody,
    color: colors.textSecondary,
    maxWidth: 520,
  },
  guideNote: {
    // Trust copy ("a preview, not a form assessment") stays at the 13px floor.
    ...type.cardCaption,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    maxWidth: 540,
  },
  checklistTitle: {
    ...type.label,
    color: colors.accentDeep,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checklistDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentDeep,
  },
  checklistText: {
    ...type.bodySmall,
    flex: 1,
    color: colors.textPrimary,
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
  countdownSequence: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  countdownSequenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  countdownSequenceNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: 26,
    backgroundColor: colors.bgElevated,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    overflow: 'hidden',
  },
  countdownSequenceText: {
    ...type.bodySmall,
    flex: 1,
    color: colors.textPrimary,
  },
  actions: {
    gap: spacing.md,
  },
});
