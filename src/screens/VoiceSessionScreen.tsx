/**
 * Voice-guided training session — the v1 PRODUCTION session surface
 * (2026-07-05 direction; camera-conducted parks behind the feature flag).
 *
 * Thin shell over VoiceSessionController, which owns the camera screen's
 * three side contracts (abandonment funnel on unmount, resume snapshots at
 * item boundaries, single-record completion) and the day-one instrumentation
 * (voice-vs-tap usage, churn location, pain audit) — all tested headlessly.
 *
 * Mic rules (founder requirement 2 / N3): permission asked in context at the
 * first voice session with one honest sentence; denial lands in
 * full-function tap mode with no nagging ever; the always-on safety-word
 * line shows exactly once so the OS mic indicator is never a surprise.
 * Engine-agnostic: transcripts in, intents matched locally, nothing stored.
 */

import * as React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ExpoVoiceCommandsModule,
  getOnDeviceAvailabilityAsync,
  getVoicePermissionsAsync,
  requestVoicePermissionsAsync,
  startListeningAsync,
  stopListeningAsync,
  type OnDeviceAvailability,
  type VoicePermissionResponse,
} from '../../modules/expo-voice-commands';
import { VoiceChannel } from '../audio/voicePlayer';
import { BRAND } from '../brand';
import { ExerciseDemoGraphic } from '../components/ExerciseDemoGraphic';
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { addBreadcrumb, captureError } from '../services/observability/sentry';
import { SessionFunnelStore } from '../telemetry/sessionFunnelStore';
import { createExpoSessionFunnelFs } from '../telemetry/fsAdapter';
import type { TrainingSetRuntimeGeneratedExercise } from '../training/setRuntime';
import { getExercise } from '../exercises';
import type { TrainingItemResult, TrainingPhase, TrainingSessionResult } from '../training/voiceSessionPlayer';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { matchIntent } from '../voice/intents';
import {
  decideVoiceGate,
  VOICE_GATE_COPY,
  type VoiceSetupPrefs,
} from '../voice/voicePermissionGate';
import { VoiceSessionController, type VoiceSessionControllerOptions } from '../voice/voiceSessionController';

const TICK_MS = 250;

interface Snapshot {
  phase: TrainingPhase;
  exerciseId: string | null;
  setIndex: number;
  totalSets: number;
  remainingSec: number;
  tapPromptHighlighted: boolean;
  stopRequested: boolean;
}

function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.phase === b.phase &&
    a.exerciseId === b.exerciseId &&
    a.setIndex === b.setIndex &&
    a.totalSets === b.totalSets &&
    a.remainingSec === b.remainingSec &&
    a.tapPromptHighlighted === b.tapPromptHighlighted &&
    a.stopRequested === b.stopRequested
  );
}

export function VoiceSessionScreen({
  exerciseIds,
  sessionTitle,
  onComplete,
  onCancel,
  onItemCompleted,
  voiceId,
  generatedExercises,
  resolveExercise,
  resolveSafetyProfile,
  firstSessionStarted,
  userId,
  voiceSetup,
  onVoiceSetupChange,
}: {
  exerciseIds: string[];
  sessionTitle?: string;
  onComplete: (result: TrainingSessionResult) => void;
  onCancel?: () => void;
  /** Fired at item boundaries with all items finished so far (resume snapshots). */
  onItemCompleted?: (completedItems: TrainingItemResult[]) => void;
  voiceId?: string;
  generatedExercises?: readonly TrainingSetRuntimeGeneratedExercise[];
  /** Injectable catalogue seams (programme v2 bridge); defaults = registry. */
  resolveExercise?: (exerciseId: string) => ReturnType<typeof getExercise>;
  resolveSafetyProfile?: VoiceSessionControllerOptions['resolveSafetyProfile'];
  /** Activation stamp for the funnel record (programme v2 first session). */
  firstSessionStarted?: boolean;
  /** Auth-scoped local telemetry owner; null is the guest scope. */
  userId?: string | null;
  voiceSetup: VoiceSetupPrefs;
  onVoiceSetupChange: (next: VoiceSetupPrefs) => void;
}) {
  const [sessionStartedAtIso] = React.useState(() => new Date().toISOString());
  const [voice] = React.useState(() => new VoiceChannel(voiceId));
  const completedRef = React.useRef(false);
  const [controller] = React.useState(
    () =>
      new VoiceSessionController({
        startedAtIso: sessionStartedAtIso,
        exerciseIds,
        generatedExercises,
        resolveExercise,
        resolveSafetyProfile,
        firstSessionStarted,
        funnelStore: new SessionFunnelStore(createExpoSessionFunnelFs({ userId })),
        onComplete: (result) => {
          completedRef.current = true;
          onComplete(result);
        },
        onItemCompleted: (items) => onItemCompleted?.(items),
        onTelemetryError: (error) =>
          captureError(error, { area: 'telemetry', action: 'voice_session_funnel_save' }),
      })
  );

  const [snapshot, setSnapshot] = React.useState<Snapshot>({
    phase: 'intro',
    exerciseId: null,
    setIndex: 0,
    totalSets: 0,
    remainingSec: NaN,
    tapPromptHighlighted: false,
    stopRequested: false,
  });
  const [permission, setPermission] = React.useState<VoicePermissionResponse | null>(null);
  const [availability, setAvailability] = React.useState<OnDeviceAvailability | null>(null);
  const [listening, setListening] = React.useState(false);
  const [confirmEnd, setConfirmEnd] = React.useState(false);
  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = React.useState(false);
  const safetyLineShownThisSession = React.useRef(false);

  const gate = decideVoiceGate({ prefs: voiceSetup, permission, availability });

  // Tick loop — the controller is the machine; React only mirrors it.
  React.useEffect(() => {
    const id = setInterval(() => {
      const u = controller.tick(Date.now(), voice.busy);
      if (u.voice) voice.speak(u.voice.cues, u.voice.priority);
      const next: Snapshot = {
        phase: u.phase,
        exerciseId: u.currentExerciseId,
        setIndex: u.setIndex,
        totalSets: u.totalSets,
        remainingSec: Number.isFinite(u.remainingMs) ? Math.ceil(u.remainingMs / 1000) : NaN,
        tapPromptHighlighted: u.tapPromptHighlighted,
        stopRequested: u.stopRequested,
      };
      setSnapshot((prev) => (sameSnapshot(prev, next) ? prev : next));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [controller, voice]);

  // Low-frequency controls collapse again at each meaningful session boundary.
  React.useEffect(() => {
    setAdjustOpen(false);
    setMoreOptionsOpen(false);
  }, [snapshot.exerciseId, snapshot.phase]);

  // Permission + availability (module fallback reports unavailable → tap mode).
  React.useEffect(() => {
    getVoicePermissionsAsync().then(setPermission);
    getOnDeviceAvailabilityAsync('en-GB').then(setAvailability);
  }, []);

  // Listening lifecycle + transcript → intent (engine-agnostic seam).
  React.useEffect(() => {
    if (gate.kind !== 'listen') return;
    let active = true;
    const transcriptSub = ExpoVoiceCommandsModule.addListener('onTranscript', (payload) => {
      if (!active || !payload.isFinal) return;
      const match = matchIntent(payload.transcript, controller.enabledIntents(voice.busy));
      if (match) controller.handleVoiceIntent(match.intent, Date.now());
    });
    const listenSub = ExpoVoiceCommandsModule.addListener('onListeningChange', (payload) => {
      if (active) setListening(payload.listening);
    });
    startListeningAsync({ locale: 'en-GB', continuous: true }).catch((error) =>
      captureError(error, { area: 'voice', action: 'start_listening' })
    );
    if (!voiceSetup.safetyLineShown && !safetyLineShownThisSession.current) {
      safetyLineShownThisSession.current = true;
      onVoiceSetupChange({ ...voiceSetup, safetyLineShown: true });
    }
    return () => {
      active = false;
      transcriptSub.remove();
      listenSub.remove();
      stopListeningAsync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate.kind, controller, voice]);

  // Side contract: any exit without completion is an abandonment (idempotent).
  React.useEffect(() => {
    return () => {
      controller.recordAbandonment();
      voice.stop();
      addBreadcrumb('voice.session_unmount', { completed: completedRef.current });
    };
  }, [controller, voice]);

  const acceptVoice = React.useCallback(() => {
    onVoiceSetupChange({ ...voiceSetup, promptShown: true });
    requestVoicePermissionsAsync().then(setPermission);
  }, [onVoiceSetupChange, voiceSetup]);

  const declineVoice = React.useCallback(() => {
    onVoiceSetupChange({ ...voiceSetup, promptShown: true });
  }, [onVoiceSetupChange, voiceSetup]);

  const endSession = React.useCallback(() => {
    setConfirmEnd(false);
    onCancel?.();
  }, [onCancel]);

  const exerciseName = snapshot.exerciseId
    ? (() => {
        try {
          return (resolveExercise ?? getExercise)(snapshot.exerciseId as string).displayName;
        } catch {
          return snapshot.exerciseId;
        }
      })()
    : null;

  const showSafetyLine =
    gate.kind === 'listen' && (gate.showSafetyLine || safetyLineShownThisSession.current);
  const wantsEndConfirm = confirmEnd || snapshot.stopRequested;
  const showInstructionalDemo =
    !!snapshot.exerciseId &&
    !!exerciseName &&
    (snapshot.phase === 'instructions' || snapshot.phase === 'waiting_ready');
  const movementCount = exerciseIds.length;
  const movementIndex = snapshot.exerciseId ? exerciseIds.indexOf(snapshot.exerciseId) : -1;
  const movementNumber =
    snapshot.phase === 'complete' || snapshot.phase === 'done'
      ? movementCount
      : movementIndex >= 0
        ? movementIndex + 1
        : 0;
  const phaseLabel = sessionPhaseLabel(snapshot.phase, movementNumber, movementCount);

  return (
    <Screen contentStyle={styles.screen}>
      <ScreenHeader
        title={sessionTitle ?? 'Your session'}
        onBack={onCancel ? () => setConfirmEnd(true) : undefined}
        backAccessibilityLabel="Leave session"
      />

      <View style={styles.sessionModeRow} accessible>
        <View style={[styles.sessionModeDot, listening && styles.sessionModeDotActive]} />
        <Text style={styles.sessionModeText}>
          {listening
            ? 'Voice controls on · processed on this phone'
            : 'Tap controls are available throughout'}
        </Text>
      </View>

      <View style={styles.body}>
        <SessionProgress
          current={movementNumber}
          total={movementCount}
          label={phaseLabel}
          complete={snapshot.phase === 'complete' || snapshot.phase === 'done'}
        />

        {gate.kind === 'show_permission_prompt' ? (
          <View style={styles.gateCard}>
            <View style={styles.gateAccent} />
            <Text style={styles.gateEyebrow}>OPTIONAL VOICE CONTROL</Text>
            <Text style={styles.gateTitle}>Keep your hands free</Text>
            <Text style={styles.gateText}>{VOICE_GATE_COPY.permissionPrompt}</Text>
            <PrimaryButton
              style={styles.primaryAction}
              title={VOICE_GATE_COPY.permissionAccept}
              onPress={acceptVoice}
            />
            <SecondaryButton
              style={styles.secondaryAction}
              title={VOICE_GATE_COPY.permissionDecline}
              onPress={declineVoice}
            />
          </View>
        ) : null}

        {showSafetyLine ? (
          <View style={styles.safetyLine} accessible>
            <View style={styles.safetyMarker} />
            <Text style={styles.safetyText}>{VOICE_GATE_COPY.safetyLine}</Text>
          </View>
        ) : null}

        {showInstructionalDemo ? (
          <ExerciseDemoGraphic
            exerciseId={snapshot.exerciseId as string}
            displayName={exerciseName as string}
          />
        ) : exerciseName || Number.isFinite(snapshot.remainingSec) ? (
          <View style={styles.stage}>
            {exerciseName ? (
              <>
                <Text style={styles.exerciseName}>{exerciseName}</Text>
                <Text style={styles.setLabel}>
                  {snapshot.totalSets > 0
                    ? `Set ${Math.min(snapshot.setIndex + 1, snapshot.totalSets)} of ${snapshot.totalSets}`
                    : phaseLabel}
                </Text>
              </>
            ) : null}
            {Number.isFinite(snapshot.remainingSec) ? (
              <View
                style={styles.timerDisc}
                accessible
                accessibilityLabel={`${Math.max(0, snapshot.remainingSec)} seconds remaining`}
              >
                <Text style={styles.timer}>{Math.max(0, snapshot.remainingSec)}</Text>
                <Text style={styles.timerUnit}>seconds</Text>
              </View>
            ) : (
              <View style={styles.paceCue}>
                <View style={styles.paceRule} />
                <Text style={styles.paceText}>{sessionPaceCopy(snapshot.phase)}</Text>
              </View>
            )}
          </View>
        ) : snapshot.phase === 'intro' ? (
          <View style={styles.openingStage}>
            <Text style={styles.openingEyebrow}>VOICE-PACED SESSION</Text>
            <Text style={styles.openingTitle}>Take a moment to settle in</Text>
            <Text style={styles.openingBody}>{BRAND.appName} will wait before the first movement begins.</Text>
            <View style={styles.openingRule} />
          </View>
        ) : snapshot.phase === 'complete' || snapshot.phase === 'done' ? (
          <View style={styles.openingStage}>
            <Text style={styles.openingEyebrow}>SESSION COMPLETE</Text>
            <Text style={styles.openingTitle}>That is enough for today</Text>
            <Text style={styles.openingBody}>Your finished work has been saved.</Text>
            <View style={styles.openingRule} />
          </View>
        ) : null}

        <View style={styles.controls}>
          {snapshot.phase === 'waiting_ready' ? (
            <PrimaryButton
              style={styles.primaryAction}
              title="I'm ready"
              onPress={() => controller.handleTap('ready', Date.now())}
            />
          ) : null}
          {snapshot.phase === 'set' ? (
            <>
              <PrimaryButton
                style={styles.primaryAction}
                title="Done"
                onPress={() => controller.handleTap('done', Date.now())}
              />
              <SecondaryButton
                style={styles.secondaryAction}
                title="Pause"
                onPress={() => controller.handleTap('pause', Date.now())}
              />
            </>
          ) : null}
          {snapshot.phase === 'rest' ? (
            <>
              <PrimaryButton
                style={styles.primaryAction}
                title="Skip rest"
                onPress={() => controller.handleTap('skip_rest', Date.now())}
              />
              <SessionDisclosure
                title="Adjust last set"
                open={adjustOpen}
                onToggle={() => {
                  setAdjustOpen((current) => !current);
                  setMoreOptionsOpen(false);
                }}
              >
                <Text style={styles.disclosureHelp}>Correct the reps you just completed.</Text>
                <View style={styles.adjustRow}>
                  <SecondaryButton
                    style={[styles.secondaryAction, styles.adjustButton]}
                    title="− rep"
                    onPress={() => controller.handleTap('adjust_reps_down')}
                  />
                  <SecondaryButton
                    style={[styles.secondaryAction, styles.adjustButton]}
                    title="+ rep"
                    onPress={() => controller.handleTap('adjust_reps_up')}
                  />
                </View>
              </SessionDisclosure>
            </>
          ) : null}
          {snapshot.phase === 'voice_paused' ? (
            <PrimaryButton
              style={styles.primaryAction}
              title="Resume"
              onPress={() => controller.handleTap('resume', Date.now())}
            />
          ) : null}
          {snapshot.phase !== 'complete' && snapshot.phase !== 'done' ? (
            <>
              <SessionUtilityAction
                title="Something hurts"
                detail="Stop this movement and move on"
                onPress={() => controller.handleTap('pain', Date.now())}
              />
              <SessionDisclosure
                title="More options"
                open={moreOptionsOpen}
                onToggle={() => {
                  setMoreOptionsOpen((current) => !current);
                  setAdjustOpen(false);
                }}
              >
                {snapshot.phase === 'waiting_ready' ? (
                  <SecondaryButton
                    style={styles.secondaryAction}
                    title="Repeat instructions"
                    onPress={() => controller.handleTap('repeat', Date.now())}
                  />
                ) : null}
                <SecondaryButton
                  style={styles.secondaryAction}
                  title="Skip exercise"
                  onPress={() => controller.handleTap('skip', Date.now())}
                />
                <SecondaryButton
                  style={styles.secondaryAction}
                  title={snapshot.phase === 'voice_paused' ? 'End workout' : 'Leave session'}
                  onPress={() => setConfirmEnd(true)}
                />
              </SessionDisclosure>
            </>
          ) : null}
        </View>
      </View>

      <Modal visible={wantsEndConfirm} transparent animationType="fade" onRequestClose={() => setConfirmEnd(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalAccent} />
            <Text style={styles.modalTitle}>End this workout?</Text>
            <Text style={styles.modalBody}>Everything you've finished so far is saved.</Text>
            <PrimaryButton style={styles.primaryAction} title="End workout" onPress={endSession} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setConfirmEnd(false);
                if (snapshot.stopRequested) controller.handleTap('resume', Date.now());
              }}
              style={styles.modalKeep}
            >
              <Text style={styles.modalKeepText}>Keep going</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function SessionProgress({
  current,
  total,
  label,
  complete,
}: {
  current: number;
  total: number;
  label: string;
  complete: boolean;
}) {
  if (total <= 0) return null;
  const safeCurrent = Math.max(0, Math.min(current, total));

  return (
    <View
      style={styles.progressBlock}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}. ${safeCurrent} of ${total} movements`}
      accessibilityValue={{ min: 0, max: total, now: safeCurrent }}
    >
      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressCount}>{safeCurrent} / {total}</Text>
      </View>
      <View style={styles.progressTrack}>
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressSegment,
              (complete || index + 1 < safeCurrent) && styles.progressSegmentComplete,
              !complete && index + 1 === safeCurrent && styles.progressSegmentCurrent,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function SessionUtilityAction({
  title,
  detail,
  onPress,
}: {
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      style={({ pressed }) => [styles.utilityAction, pressed && styles.disclosurePressed]}
    >
      <View style={styles.utilityCopy}>
        <Text style={styles.utilityTitle}>{title}</Text>
        <Text style={styles.utilityDetail}>{detail}</Text>
      </View>
      <Text style={styles.utilityChevron}>›</Text>
    </Pressable>
  );
}

function sessionPhaseLabel(phase: TrainingPhase, movement: number, total: number): string {
  if (phase === 'intro') return 'Getting ready';
  if (phase === 'complete' || phase === 'done') return 'Session complete';
  if (phase === 'rest') return movement > 0 ? `Rest · movement ${movement} of ${total}` : 'Rest';
  if (phase === 'voice_paused') return movement > 0 ? `Paused · movement ${movement} of ${total}` : 'Paused';
  return movement > 0 ? `Movement ${movement} of ${total}` : 'Your guided session';
}

function sessionPaceCopy(phase: TrainingPhase): string {
  if (phase === 'set') return 'Move at the guided pace';
  if (phase === 'voice_paused') return 'Take the time you need';
  return 'Listen for the next cue';
}

function SessionDisclosure({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.disclosureCard}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${open ? 'Hide' : 'Show'} ${title.toLowerCase()}`}
        style={({ pressed }) => [styles.disclosureHeader, pressed && styles.disclosurePressed]}
      >
        <Text style={styles.disclosureTitle}>{title}</Text>
        <Text style={styles.disclosureChevron}>{open ? '−' : '+'}</Text>
      </Pressable>
      {open ? <View style={styles.disclosureBody}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.xl },
  sessionModeRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderHairline,
  },
  sessionModeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.textMuted,
    backgroundColor: 'transparent',
  },
  sessionModeDotActive: {
    borderColor: colors.accentDeep,
    backgroundColor: colors.accentDeep,
  },
  sessionModeText: {
    ...type.cardCaption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  body: { gap: spacing.xl, paddingBottom: spacing.xxl },
  progressBlock: { gap: spacing.sm },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  progressLabel: {
    ...type.cardCaption,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    letterSpacing: 1.25,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  progressCount: {
    ...type.cardCaption,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: { flexDirection: 'row', gap: spacing.xs },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
  },
  progressSegmentComplete: { backgroundColor: colors.accentGold },
  progressSegmentCurrent: { backgroundColor: colors.accentDeep },
  gateCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.soft,
  },
  gateAccent: { width: 52, height: 2, backgroundColor: colors.accentDeep, marginBottom: spacing.xs },
  gateEyebrow: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    letterSpacing: 1.35,
  },
  gateTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  gateText: { ...type.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  primaryAction: {
    minHeight: 58,
    borderRadius: radius.pill,
  },
  secondaryAction: {
    minHeight: 52,
    borderRadius: radius.pill,
  },
  safetyLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.accentGold,
    backgroundColor: colors.cautionSoft,
  },
  safetyMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: colors.accentGold,
  },
  safetyText: { ...type.caption, flex: 1, color: colors.textPrimary },
  stage: {
    minHeight: 310,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxl,
  },
  exerciseName: {
    fontFamily: fonts.serifRegular,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.35,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  setLabel: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  timerDisc: {
    width: 178,
    height: 178,
    borderRadius: 89,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  timer: {
    fontFamily: fonts.sansRegular,
    fontSize: 72,
    lineHeight: 78,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  timerUnit: {
    ...type.cardCaption,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.15,
  },
  paceCue: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
  paceRule: { width: 52, height: 2, backgroundColor: colors.accentDeep },
  paceText: { ...type.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  openingStage: {
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  openingEyebrow: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    letterSpacing: 1.35,
  },
  openingTitle: {
    fontFamily: fonts.serifRegular,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -0.35,
    color: colors.textPrimary,
    maxWidth: 360,
  },
  openingBody: { ...type.body, color: colors.textSecondary, maxWidth: 340 },
  openingRule: { width: 56, height: 2, marginTop: spacing.sm, backgroundColor: colors.accentDeep },
  controls: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  utilityAction: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderHairline,
  },
  utilityCopy: { flex: 1, minWidth: 0, gap: 2 },
  utilityTitle: { ...type.bodySmall, color: colors.textPrimary, fontFamily: fonts.sansMedium },
  utilityDetail: { ...type.cardCaption, color: colors.textSecondary },
  utilityChevron: { ...type.h3, color: colors.accentDeep },
  disclosureCard: {
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: 'transparent',
  },
  disclosureHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  disclosureTitle: {
    ...type.bodySmall,
    fontFamily: fonts.sansMedium,
    color: colors.textPrimary,
  },
  disclosureChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.accentSoft,
    color: colors.accentDeep,
    fontFamily: fonts.sansRegular,
    fontSize: 20,
    lineHeight: 27,
    textAlign: 'center',
  },
  disclosureBody: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderHairline,
  },
  disclosureHelp: {
    ...type.caption,
    color: colors.textSecondary,
    paddingBottom: spacing.xs,
  },
  disclosurePressed: {
    opacity: 0.82,
  },
  adjustRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  adjustButton: { flex: 1, minWidth: 0, paddingHorizontal: spacing.sm },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.modalBackdrop,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.modal,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.soft,
  },
  modalAccent: { width: 52, height: 2, backgroundColor: colors.accentDeep, marginBottom: spacing.xs },
  modalTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  modalBody: { ...type.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  modalKeep: { alignSelf: 'center', padding: spacing.sm },
  modalKeepText: { ...type.bodySmall, fontFamily: fonts.sansMedium, color: colors.accentDeep },
});

export default VoiceSessionScreen;
