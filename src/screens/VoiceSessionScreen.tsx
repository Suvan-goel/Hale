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
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { addBreadcrumb, captureError } from '../services/observability/sentry';
import { SessionFunnelStore } from '../telemetry/sessionFunnelStore';
import { expoSessionFunnelFs } from '../telemetry/fsAdapter';
import type { TrainingSetRuntimeGeneratedExercise } from '../training/setRuntime';
import { getExercise } from '../exercises';
import type { TrainingItemResult, TrainingPhase, TrainingSessionResult } from '../training/sessionPlayer';
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
  bonusOfferPending: boolean;
}

function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.phase === b.phase &&
    a.exerciseId === b.exerciseId &&
    a.setIndex === b.setIndex &&
    a.totalSets === b.totalSets &&
    a.remainingSec === b.remainingSec &&
    a.tapPromptHighlighted === b.tapPromptHighlighted &&
    a.stopRequested === b.stopRequested &&
    a.bonusOfferPending === b.bonusOfferPending
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
  bonusSetOffer,
  firstSessionStarted,
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
  /** Once-per-item bonus-set offer (programme v2); rides the rest window. */
  bonusSetOffer?: VoiceSessionControllerOptions['bonusSetOffer'];
  /** Activation stamp for the funnel record (programme v2 first session). */
  firstSessionStarted?: boolean;
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
        bonusSetOffer,
        firstSessionStarted,
        funnelStore: new SessionFunnelStore(expoSessionFunnelFs),
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
    bonusOfferPending: false,
  });
  const [permission, setPermission] = React.useState<VoicePermissionResponse | null>(null);
  const [availability, setAvailability] = React.useState<OnDeviceAvailability | null>(null);
  const [listening, setListening] = React.useState(false);
  const [confirmEnd, setConfirmEnd] = React.useState(false);
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
        bonusOfferPending: u.bonusOfferPending,
      };
      setSnapshot((prev) => (sameSnapshot(prev, next) ? prev : next));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [controller, voice]);

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

  return (
    <Screen tone="focus" contentStyle={styles.screen}>
      <ScreenHeader
        title={sessionTitle ?? 'Your session'}
        subtitle={listening ? 'Listening — on your phone only' : 'Tap the buttons whenever you like'}
      />
      <View style={styles.body}>
        {gate.kind === 'show_permission_prompt' ? (
          <View style={styles.gateCard}>
            <Text style={styles.gateText}>{VOICE_GATE_COPY.permissionPrompt}</Text>
            <PrimaryButton title={VOICE_GATE_COPY.permissionAccept} onPress={acceptVoice} />
            <SecondaryButton title={VOICE_GATE_COPY.permissionDecline} onPress={declineVoice} />
          </View>
        ) : null}
        {showSafetyLine ? <Text style={styles.safetyLine}>{VOICE_GATE_COPY.safetyLine}</Text> : null}
        {listening ? (
          <View style={styles.micRow}>
            <View style={styles.micDot} />
            <Text style={styles.micText}>Voice on</Text>
          </View>
        ) : null}

        {exerciseName || Number.isFinite(snapshot.remainingSec) ? (
          <View style={styles.stage}>
            {exerciseName ? (
              <>
                <Text style={styles.exerciseName}>{exerciseName}</Text>
                <Text style={styles.setLabel}>
                  {snapshot.totalSets > 0
                    ? `Set ${Math.min(snapshot.setIndex + 1, snapshot.totalSets)} of ${snapshot.totalSets}`
                    : ''}
                </Text>
              </>
            ) : null}
            {Number.isFinite(snapshot.remainingSec) ? (
              <Text style={styles.timer}>{Math.max(0, snapshot.remainingSec)}s</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.controls}>
          {snapshot.phase === 'waiting_ready' ? (
            <>
              <PrimaryButton title="I'm ready" onPress={() => controller.handleTap('ready', Date.now())} />
              <SecondaryButton title="Repeat instructions" onPress={() => controller.handleTap('repeat', Date.now())} />
            </>
          ) : null}
          {snapshot.phase === 'set' ? (
            <>
              <PrimaryButton title="Done" onPress={() => controller.handleTap('done', Date.now())} />
              <SecondaryButton title="Pause" onPress={() => controller.handleTap('pause', Date.now())} />
            </>
          ) : null}
          {snapshot.phase === 'rest' ? (
            <>
              {snapshot.bonusOfferPending ? (
                <PrimaryButton title="One more set" onPress={() => controller.handleTap('ready', Date.now())} />
              ) : null}
              <PrimaryButton
                title={snapshot.bonusOfferPending ? 'No thanks — move on' : 'Skip rest'}
                onPress={() => controller.handleTap('skip_rest', Date.now())}
              />
              <View style={styles.adjustRow}>
                <SecondaryButton style={styles.adjustButton} title="− rep" onPress={() => controller.handleTap('adjust_reps_down')} />
                <Text style={styles.adjustLabel}>Adjust last set</Text>
                <SecondaryButton style={styles.adjustButton} title="+ rep" onPress={() => controller.handleTap('adjust_reps_up')} />
              </View>
            </>
          ) : null}
          {snapshot.phase === 'voice_paused' ? (
            <>
              <PrimaryButton title="Resume" onPress={() => controller.handleTap('resume', Date.now())} />
              <SecondaryButton title="End workout" onPress={() => setConfirmEnd(true)} />
            </>
          ) : null}
          {snapshot.phase !== 'complete' && snapshot.phase !== 'done' ? (
            <>
              <SecondaryButton title="Something hurts" onPress={() => controller.handleTap('pain', Date.now())} />
              <SecondaryButton title="Skip exercise" onPress={() => controller.handleTap('skip', Date.now())} />
              <SecondaryButton title="Leave session" onPress={() => setConfirmEnd(true)} />
            </>
          ) : null}
        </View>
      </View>

      <Modal visible={wantsEndConfirm} transparent animationType="fade" onRequestClose={() => setConfirmEnd(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>End this workout?</Text>
            <Text style={styles.modalBody}>Everything you've finished so far is saved.</Text>
            <PrimaryButton title="End workout" onPress={endSession} />
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

const styles = StyleSheet.create({
  screen: { gap: spacing.lg },
  body: { gap: spacing.md, paddingBottom: spacing.xxl },
  gateCard: {
    backgroundColor: colors.focusSurface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.soft,
  },
  gateText: { ...type.body },
  safetyLine: {
    ...type.caption,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.focusElevated,
  },
  micRow: {
    alignSelf: 'flex-start',
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  micDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentDeep },
  micText: { ...type.caption },
  stage: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.focusSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  exerciseName: {
    fontFamily: fonts.serifRegular,
    fontSize: 32,
    lineHeight: 38,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  setLabel: { ...type.label, color: colors.accentDeep, textAlign: 'center' },
  timer: {
    fontFamily: fonts.sansRegular,
    fontSize: 68,
    lineHeight: 76,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  controls: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderHairline,
  },
  adjustRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  adjustButton: { flex: 1, minWidth: 0, paddingHorizontal: spacing.sm },
  adjustLabel: { ...type.caption, flex: 1, textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.modalBackdrop,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.focusElevated,
    borderRadius: radius.modal,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: { ...type.h3 },
  modalBody: { ...type.body },
  modalKeep: { alignSelf: 'center', padding: spacing.sm },
  modalKeepText: { ...type.body, color: colors.accentDeep },
});

export default VoiceSessionScreen;
