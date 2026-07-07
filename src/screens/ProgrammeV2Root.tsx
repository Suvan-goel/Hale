/**
 * Programme engine v2 shell (flag-gated, C4 parallel build): a self-contained
 * root mounted by App.tsx only under EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2
 * in dev builds. Owns its own store loading, the onboarding flow, and the
 * first-session path — zero coupling to the shipping engine's state.
 *
 * Activation event (conformance Q4): firstSessionStarted is written when the
 * runner's Begin fires (markFirstSessionStarted + persist), never at plan
 * generation; the same session's local funnel record carries the v3 stamp.
 */

import * as React from 'react';
import { View } from 'react-native';

import { LOCAL_USER_ID } from '../adherence';
import { Button, Screen, Typography } from '../components/ui';
import { createExpoHistoryFs } from '../history/fsAdapter';
import { HistoryStore } from '../history';
import {
  acknowledgeOnboardingStep,
  applyAssessmentPlacement,
  applyInactivityRegressionIfDue,
  applyProgrammeSessionResults,
  assessmentInputsFromCheckUp,
  assessmentReoffer,
  markSurfaceShown,
  surfaceAlreadyShown,
  completeOnboarding,
  currentOnboardingStep,
  effortFromRpe,
  generateProgrammeSession,
  getProgrammeLevel,
  initialOnboardingFlowState,
  markFirstSessionStarted,
  ProgrammeStore,
  programmeDisplayName,
  recordBandAnswer,
  recordDomingCheck,
  recordGatewayDemoWatched,
  recordGatewaySelfConfirmation,
  recordOnboardingAnswer,
  shouldAskBandQuestion,
  shouldShowDomingCheck,
  SKIPPED,
  type OnboardingAnswerValue,
  type ProgrammePattern,
  type ProgrammeSessionPlan,
  type ProgrammeSessionResults,
  type ProgrammeState,
  type PromotionDecision,
  type SessionRpe,
} from '../programme';
import type { OnboardingQuestionStepId } from '../programme';
import { ProfileStore, type Preferences } from '../profile';
import type { TrainingSessionResult } from '../training/sessionPlayer';
import { DEFAULT_VOICE_SETUP_PREFS, type VoiceSetupPrefs } from '../voice/voicePermissionGate';
import { ProgrammeCheckupZeroScreen } from './ProgrammeCheckupZeroScreen';
import { ProgrammeOnboardingScreen } from './ProgrammeOnboardingScreen';
import { VoiceSessionScreen } from './VoiceSessionScreen';
import {
  programmeResultsFromVoiceSession,
  voiceSessionInputsFromPlan,
} from '../programme';

type ShellPhase =
  | 'loading'
  | 'onboarding'
  | 'home'
  | 'session'
  | 'effort'
  | 'session_done'
  | 'assessment';

const RPE_OPTIONS: readonly { value: SessionRpe; label: string }[] = [
  { value: 1, label: 'Easy — I had lots more in me' },
  { value: 2, label: 'Fairly easy' },
  { value: 3, label: 'Worked, with a few left in the tank' },
  { value: 4, label: 'Hard, but a couple left' },
  { value: 5, label: 'Nothing left' },
];

export function ProgrammeV2Root() {
  // Dev shell runs guest-scoped; the flag audit keeps this path out of
  // beta/release builds entirely.
  const localFs = React.useMemo(() => createExpoHistoryFs({ userId: null }), []);
  const store = React.useMemo(() => new ProgrammeStore(localFs), [localFs]);
  const profileStore = React.useMemo(() => new ProfileStore(localFs), [localFs]);
  const historyStore = React.useMemo(() => new HistoryStore(localFs), [localFs]);

  const [phase, setPhase] = React.useState<ShellPhase>('loading');
  const [programmeState, setProgrammeState] = React.useState<ProgrammeState | null>(null);
  const [prefs, setPrefs] = React.useState<Preferences | null>(null);
  const [flowState, setFlowState] = React.useState(initialOnboardingFlowState());
  const [plan, setPlan] = React.useState<ProgrammeSessionPlan | null>(null);
  const [sessionResult, setSessionResult] = React.useState<TrainingSessionResult | null>(null);
  const [lastDecisions, setLastDecisions] = React.useState<
    Partial<Record<ProgrammePattern, PromotionDecision>>
  >({});
  const [physioSignpostVisible, setPhysioSignpostVisible] = React.useState(false);
  const sessionStartRef = React.useRef<{ startedAtIso: string; wasFirstSession: boolean } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([store.load(), profileStore.load()]).then(([loaded, loadedPrefs]) => {
      if (cancelled) return;
      // 14+ days away → one level down everywhere, once per gap (§12).
      const regression = applyInactivityRegressionIfDue(loaded, new Date().toISOString());
      if (regression.applied) store.save(regression.state);
      setProgrammeState(regression.state);
      setPrefs(loadedPrefs);
      setPhase(regression.state.onboardingCompletedAtIso ? 'home' : 'onboarding');
    });
    return () => {
      cancelled = true;
    };
  }, [store, profileStore]);

  const voiceSetup: VoiceSetupPrefs = prefs?.settings.voiceSetup ?? DEFAULT_VOICE_SETUP_PREFS;
  const handleVoiceSetupChange = React.useCallback(
    (next: VoiceSetupPrefs) => {
      setPrefs((current) => {
        if (!current) return current;
        const updated = { ...current, settings: { ...current.settings, voiceSetup: next } };
        profileStore.save(updated);
        return updated;
      });
    },
    [profileStore]
  );

  const persist = React.useCallback(
    (state: ProgrammeState) => {
      setProgrammeState(state);
      store.save(state);
    },
    [store]
  );

  const finishOnboarding = React.useCallback(
    async (startNow: boolean) => {
      const completion = completeOnboarding(flowState);
      persist(completion.programmeState);
      // Hand off to the EXISTING profile surfaces (C6/C8).
      const currentPrefs = prefs ?? (await profileStore.load());
      const nowIso = new Date().toISOString();
      const nextPrefs = {
        ...currentPrefs,
        profile: {
          ...currentPrefs.profile,
          menopauseStage: completion.menopauseStage ?? currentPrefs.profile.menopauseStage,
          lifeGoal: completion.lifeGoalCategory
            ? {
                id: `lifegoal-${Date.now()}`,
                userId: LOCAL_USER_ID,
                category: completion.lifeGoalCategory,
                createdAt: nowIso,
                updatedAt: nowIso,
                isPrimary: true,
              }
            : currentPrefs.profile.lifeGoal,
        },
      };
      profileStore.save(nextPrefs);
      setPrefs(nextPrefs);
      if (startNow) {
        // First session defaults to the 15-minute minimum-dose preset (§7).
        setPlan(
          generateProgrammeSession({
            state: completion.programmeState,
            template: 'A',
            preset: 'first_session',
          })
        );
        setPhase('session');
      } else {
        setPhase('home');
      }
    },
    [flowState, persist, prefs, profileStore]
  );

  const startSessionFromHome = React.useCallback(() => {
    if (!programmeState) return;
    // Re-check the inactivity gap at generation time — the app may have sat
    // open (or backgrounded) across the 14-day boundary since load.
    const regression = applyInactivityRegressionIfDue(programmeState, new Date().toISOString());
    if (regression.applied) persist(regression.state);
    const current = regression.state;
    // A/B alternation by completed-session parity; effort from the persisted
    // last-session answer (survives restarts).
    setPlan(
      generateProgrammeSession({
        state: current,
        template: current.completedSessionCount % 2 === 0 ? 'A' : 'B',
        preset: current.profile.firstSessionStarted ? 'standard' : 'first_session',
        lastSessionEffort: current.lastSessionEffort,
      })
    );
    setPhase('session');
  }, [programmeState, persist]);

  const handleSessionStart = React.useCallback(() => {
    if (!programmeState || sessionStartRef.current) return;
    // The activation event: written at START, not at generation (Q4). The
    // funnel record itself (with the v3 firstSessionStarted stamp) is owned
    // by the VoiceSessionController — one record per session, never two.
    const wasFirstSession = !programmeState.profile.firstSessionStarted;
    sessionStartRef.current = { startedAtIso: new Date().toISOString(), wasFirstSession };
    persist(markFirstSessionStarted(programmeState));
  }, [programmeState, persist]);

  const handleSessionFinish = React.useCallback(
    (results: ProgrammeSessionResults, rpe: SessionRpe | null) => {
      if (!programmeState || !plan) return;
      const effort = effortFromRpe(rpe);
      const applied = applyProgrammeSessionResults(programmeState, plan, {
        ...results,
        outcomes: results.outcomes.map((outcome) => ({ ...outcome, effort })),
        sessionEffort: effort,
      });
      persist(applied.state);
      setLastDecisions(applied.decisions);
      sessionStartRef.current = null;
      setSessionResult(null);
      setPhase('session_done');
    },
    [programmeState, plan, persist]
  );

  if (phase === 'loading' || !programmeState) return <Screen>{null}</Screen>;

  if (phase === 'onboarding') {
    return (
      <ProgrammeOnboardingScreen
        flowState={flowState}
        onSelectOption={(step, value) =>
          setFlowState(recordOnboardingAnswer(flowState, { step, value } as OnboardingAnswerValue))
        }
        onSelectMany={(step, values) =>
          setFlowState(
            recordOnboardingAnswer(flowState, {
              step,
              value: step === 'b3_joints' ? values.filter((v) => v !== 'none') : values,
            } as OnboardingAnswerValue)
          )
        }
        onSkipQuestion={(step: OnboardingQuestionStepId) =>
          setFlowState(recordOnboardingAnswer(flowState, { step, value: SKIPPED } as OnboardingAnswerValue))
        }
        onAcknowledge={(step) => {
          const next = acknowledgeOnboardingStep(flowState, step);
          setFlowState(next);
          if (currentOnboardingStep(next) === 'complete') void finishOnboarding(false);
        }}
        onComplete={(action) => void finishOnboarding(action === 'start_first_session')}
      />
    );
  }

  if (phase === 'session' && plan) {
    // In-context questions at their moment of effect (§8): the band question
    // at the Pull L4 unlock; the doming check when core first features.
    if (shouldAskBandQuestion(programmeState, plan)) {
      return (
        <PromptCard
          title="Do you have a resistance band?"
          body="Today's pulling exercise gets a free upgrade with a long band — books-in-a-backpack works meanwhile."
          actions={[
            { label: 'Yes, I have one', onPress: () => persist(recordBandAnswer(programmeState, true)) },
            { label: 'Not yet', onPress: () => persist(recordBandAnswer(programmeState, false)) },
          ]}
        />
      );
    }
    if (shouldShowDomingCheck(programmeState, plan)) {
      return (
        <PromptCard
          title="One quick check before the floor work"
          body="Lying on your back, lift your head: if you see a bulge or ridge down the middle of your tummy, tap the first option — we'll choose kinder core work."
          actions={[
            {
              label: 'I see a bulge',
              onPress: () => {
                const result = recordDomingCheck(programmeState, true);
                persist(result.state);
                setPhysioSignpostVisible(result.showPhysioSignpost);
              },
            },
            { label: 'All looks fine', onPress: () => persist(recordDomingCheck(programmeState, false).state) },
          ]}
        />
      );
    }
    if (physioSignpostVisible) {
      return (
        <PromptCard
          title="Worth knowing"
          body="A pelvic-health physiotherapist can help with this — it's common and very treatable. We've already adjusted your core work."
          actions={[{ label: 'Got it', onPress: () => setPhysioSignpostVisible(false) }]}
        />
      );
    }
    // The real v1 session surface: the voice-guided player (ready-gated,
    // self-paced, tap parity, always-on safety words) over the programme
    // plan via the bridge. The activation event fires on mount (Q4).
    return (
      <ProgrammeVoiceSession
        plan={plan}
        voiceId={prefs?.settings.voiceId}
        firstSessionStarted={!programmeState.profile.firstSessionStarted}
        voiceSetup={voiceSetup}
        onVoiceSetupChange={handleVoiceSetupChange}
        onStart={handleSessionStart}
        onComplete={(result) => {
          setSessionResult(result);
          setPhase('effort');
        }}
        onCancel={() => {
          // Abandonment funnel is recorded by the controller on unmount.
          sessionStartRef.current = null;
          setPlan(null);
          setPhase('home');
        }}
      />
    );
  }

  if (phase === 'effort' && plan && sessionResult) {
    // The C9 effort check-in (session RPE) — the one answer promotion needs.
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center' }}>
          <Typography variant="h2">How did that feel?</Typography>
          <Typography variant="body">Could you have done more?</Typography>
          {RPE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              title={option.label}
              variant="secondary"
              onPress={() =>
                handleSessionFinish(programmeResultsFromVoiceSession(plan, sessionResult), option.value)
              }
            />
          ))}
          <Button
            title="Skip"
            variant="ghost"
            onPress={() => handleSessionFinish(programmeResultsFromVoiceSession(plan, sessionResult), null)}
          />
        </View>
      </Screen>
    );
  }

  if (phase === 'session_done') {
    // Teach-only gateway surface (C3): a locked promotion invites the demo +
    // self-confirmation — never a camera verdict.
    const gatewayLock = (Object.entries(lastDecisions) as [ProgrammePattern, PromotionDecision][]).find(
      ([, decision]) => decision.kind === 'promotion_locked' && decision.reason === 'gateway_incomplete'
    );
    if (gatewayLock) {
      const [pattern, decision] = gatewayLock;
      const lockedLevel = decision.kind === 'promotion_locked' ? decision.toLevel : 0;
      const ladder = programmeState.ladders[pattern];
      const progress = ladder.gatewayProgress[lockedLevel];
      const name = programmeDisplayName(getProgrammeLevel(pattern, lockedLevel).primary.id);
      return (
        <PromptCard
          title={`You've earned the next level: ${name}`}
          body="It's a technique level, so two quick steps unlock it: watch the short demo, then confirm you feel ready. No camera involved."
          actions={[
            ...(!progress?.demoWatched
              ? [
                  {
                    label: 'I watched the demo',
                    onPress: () =>
                      persist({
                        ...programmeState,
                        ladders: {
                          ...programmeState.ladders,
                          [pattern]: recordGatewayDemoWatched(ladder, lockedLevel),
                        },
                      }),
                  },
                ]
              : []),
            ...(progress?.demoWatched && !progress?.selfConfirmed
              ? [
                  {
                    label: 'I feel ready — unlock it',
                    onPress: () =>
                      persist({
                        ...programmeState,
                        ladders: {
                          ...programmeState.ladders,
                          [pattern]: recordGatewaySelfConfirmation(ladder, lockedLevel),
                        },
                      }),
                  },
                ]
              : []),
            { label: 'Later', onPress: () => setLastDecisions({}) },
          ]}
        />
      );
    }
    const reoffer = assessmentReoffer(programmeState, new Date().toISOString());
    if (reoffer === 'deferred_reoffer') {
      return (
        <PromptCard
          title="Ready for that two-minute movement check?"
          body="It makes your levels exact. No one sees it but you, and it never leaves your phone."
          actions={[
            { label: "Let's do it", onPress: () => setPhase('assessment') },
            { label: 'Sounds good — later', onPress: () => setLastDecisions({}) },
          ]}
        />
      );
    }
    if (
      reoffer === 'skipped_warm_reoffer' &&
      !surfaceAlreadyShown(programmeState, 'skipped_warm_reoffer_card')
    ) {
      // Softer than the deferred card; renders exactly once — the home
      // screen's movement-check entry remains the permanent path.
      return (
        <PromptCard
          title="Whenever you're ready"
          body="Your workouts get smarter if we do a quick movement check whenever you're ready. It's always waiting on your home screen."
          actions={[
            { label: "Let's do it now", onPress: () => setPhase('assessment') },
            {
              label: 'Maybe later',
              onPress: () => persist(markSurfaceShown(programmeState, 'skipped_warm_reoffer_card')),
            },
          ]}
        />
      );
    }
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center' }}>
          <Typography variant="h1">Done — that counts</Typography>
          <Typography variant="body">
            Session logged. Showing up is the whole job this month.
          </Typography>
          <Button title="Back to home" onPress={() => setPhase('home')} />
        </View>
      </Screen>
    );
  }

  if (phase === 'assessment') {
    // The two-protocol Check-up #0 host (Option 1 build): warm-up →
    // single-side balance (T1 ruling 2026-07-06) → 30 s chair rise, run by
    // the real unified machinery with the batterySequence derived from the
    // pinned scope constant. 'Now' path (nothing trained) REPLACES placement
    // with the −1 easy start; any post-training-history path is upward-only.
    // Abandonment applies nothing, burns no once-only surface, and the home
    // button remains the permanent way back.
    //
    // Persistence ruling 2026-07-07: the measured record is saved to check-up
    // history like every other check-up — raw at raw-ready (crash-safe),
    // overwritten in place (same startedAt key) with the finalized record on
    // complete. Known limitation, recorded in decisions.md: a crash between
    // raw-save and placement leaves the record saved but placement unapplied;
    // the home-screen movement-check button remains the way back.
    return (
      <ProgrammeCheckupZeroScreen
        onRawCheckUpReady={(checkUp) => {
          try {
            historyStore.save(checkUp, { checkupType: 'manual_extra_v2' });
          } catch (error) {
            console.warn('[programme-v2] early raw check-up save failed', error);
          }
        }}
        onComplete={(checkUp) => {
          try {
            historyStore.save(checkUp, { checkupType: 'manual_extra_v2' });
          } catch (error) {
            console.warn('[programme-v2] final check-up save failed', error);
          }
          const inputs = assessmentInputsFromCheckUp(checkUp);
          persist(
            applyAssessmentPlacement(programmeState, inputs, {
              deferred: programmeState.completedSessionCount > 0,
            })
          );
          setPhase('home');
        }}
        onCancel={() => setPhase('home')}
      />
    );
  }

  const homeReoffer = assessmentReoffer(programmeState, new Date().toISOString());
  const assessmentAvailable =
    programmeState.profile.assessmentStatus !== 'done' &&
    homeReoffer !== 'none';
  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center' }}>
        <Typography variant="h1">Ready when you are</Typography>
        <Button
          title={programmeState.profile.firstSessionStarted ? 'Start a session' : 'Start your first session — 15 minutes'}
          onPress={startSessionFromHome}
        />
        {assessmentAvailable ? (
          <Button
            title="Do the two-minute movement check"
            variant="secondary"
            onPress={() => setPhase('assessment')}
          />
        ) : null}
      </View>
    </Screen>
  );
}

function ProgrammeVoiceSession({
  plan,
  voiceId,
  firstSessionStarted,
  voiceSetup,
  onVoiceSetupChange,
  onStart,
  onComplete,
  onCancel,
}: {
  plan: ProgrammeSessionPlan;
  voiceId?: string;
  firstSessionStarted: boolean;
  voiceSetup: VoiceSetupPrefs;
  onVoiceSetupChange: (next: VoiceSetupPrefs) => void;
  /** Fired once on mount — the activation moment (Q4: started, not generated). */
  onStart: () => void;
  onComplete: (result: TrainingSessionResult) => void;
  onCancel: () => void;
}) {
  const inputs = React.useMemo(() => voiceSessionInputsFromPlan(plan), [plan]);
  React.useEffect(() => {
    onStart();
    // Fire exactly once per mounted session; onStart guards re-entry itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <VoiceSessionScreen
      exerciseIds={inputs.exerciseIds}
      generatedExercises={inputs.generatedExercises}
      resolveExercise={inputs.resolveExercise}
      resolveSafetyProfile={inputs.resolveSafetyProfile}
      sessionTitle="Your session"
      voiceId={voiceId}
      firstSessionStarted={firstSessionStarted}
      voiceSetup={voiceSetup}
      onVoiceSetupChange={onVoiceSetupChange}
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
}

function PromptCard({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: readonly { label: string; onPress: () => void }[];
}) {
  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center' }}>
        <Typography variant="h2">{title}</Typography>
        <Typography variant="body">{body}</Typography>
        {actions.map((action, index) => (
          <Button
            key={action.label}
            title={action.label}
            variant={index === 0 ? 'primary' : 'ghost'}
            onPress={action.onPress}
          />
        ))}
      </View>
    </Screen>
  );
}
