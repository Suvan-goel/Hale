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
import {
  acknowledgeOnboardingStep,
  applyAssessmentPlacement,
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
import { ProfileStore } from '../profile';
import { ProgrammeCheckupZeroScreen } from './ProgrammeCheckupZeroScreen';
import { buildStoredSessionFunnel, SessionFunnelStore } from '../telemetry';
import { createExpoSessionFunnelFs } from '../telemetry/fsAdapter';
import { ProgrammeOnboardingScreen } from './ProgrammeOnboardingScreen';
import { ProgrammeSessionScreen } from './ProgrammeSessionScreen';

type ShellPhase = 'loading' | 'onboarding' | 'home' | 'session' | 'session_done' | 'assessment';

export function ProgrammeV2Root() {
  // Dev shell runs guest-scoped; the flag audit keeps this path out of
  // beta/release builds entirely.
  const localFs = React.useMemo(() => createExpoHistoryFs({ userId: null }), []);
  const store = React.useMemo(() => new ProgrammeStore(localFs), [localFs]);
  const profileStore = React.useMemo(() => new ProfileStore(localFs), [localFs]);
  const funnelStore = React.useMemo(() => new SessionFunnelStore(createExpoSessionFunnelFs()), []);

  const [phase, setPhase] = React.useState<ShellPhase>('loading');
  const [programmeState, setProgrammeState] = React.useState<ProgrammeState | null>(null);
  const [flowState, setFlowState] = React.useState(initialOnboardingFlowState());
  const [plan, setPlan] = React.useState<ProgrammeSessionPlan | null>(null);
  const [lastDecisions, setLastDecisions] = React.useState<
    Partial<Record<ProgrammePattern, PromotionDecision>>
  >({});
  const [physioSignpostVisible, setPhysioSignpostVisible] = React.useState(false);
  const sessionStartRef = React.useRef<{ startedAtIso: string; wasFirstSession: boolean } | null>(null);
  const lastEffortRef = React.useRef<SessionRpe | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    store.load().then((state) => {
      if (cancelled) return;
      setProgrammeState(state);
      setPhase(state.onboardingCompletedAtIso ? 'home' : 'onboarding');
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

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
      const prefs = await profileStore.load();
      const nowIso = new Date().toISOString();
      profileStore.save({
        ...prefs,
        profile: {
          ...prefs.profile,
          menopauseStage: completion.menopauseStage ?? prefs.profile.menopauseStage,
          lifeGoal: completion.lifeGoalCategory
            ? {
                id: `lifegoal-${Date.now()}`,
                userId: LOCAL_USER_ID,
                category: completion.lifeGoalCategory,
                createdAt: nowIso,
                updatedAt: nowIso,
                isPrimary: true,
              }
            : prefs.profile.lifeGoal,
        },
      });
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
    [flowState, persist, profileStore]
  );

  const startSessionFromHome = React.useCallback(() => {
    if (!programmeState) return;
    // A/B alternation by completed-session parity; effort from the last RPE.
    setPlan(
      generateProgrammeSession({
        state: programmeState,
        template: programmeState.completedSessionCount % 2 === 0 ? 'A' : 'B',
        preset: programmeState.profile.firstSessionStarted ? 'standard' : 'first_session',
        lastSessionEffort: effortFromRpe(lastEffortRef.current),
      })
    );
    setPhase('session');
  }, [programmeState]);

  const handleSessionStart = React.useCallback(() => {
    if (!programmeState) return;
    // The activation event: written at START, not at generation (Q4).
    const wasFirstSession = !programmeState.profile.firstSessionStarted;
    sessionStartRef.current = { startedAtIso: new Date().toISOString(), wasFirstSession };
    persist(markFirstSessionStarted(programmeState));
  }, [programmeState, persist]);

  const handleSessionFinish = React.useCallback(
    (results: ProgrammeSessionResults, rpe: SessionRpe | null) => {
      if (!programmeState || !plan) return;
      const effort = effortFromRpe(rpe);
      lastEffortRef.current = rpe;
      const applied = applyProgrammeSessionResults(programmeState, plan, {
        ...results,
        outcomes: results.outcomes.map((outcome) => ({ ...outcome, effort })),
      });
      persist(applied.state);
      setLastDecisions(applied.decisions);
      const start = sessionStartRef.current;
      funnelStore.save(
        buildStoredSessionFunnel({
          startedAt: start?.startedAtIso ?? results.completedAtIso,
          endedAt: results.completedAtIso,
          outcome: 'completed',
          funnel: {
            timeToFirstSetMs: null,
            timeToFirstRepMs: null,
            setupIssueCount: 0,
            items: [],
            endedInPhase: 'done',
            completed: true,
          },
          firstSessionStarted: start?.wasFirstSession === true,
        })
      );
      sessionStartRef.current = null;
      setPhase('session_done');
    },
    [programmeState, plan, persist, funnelStore]
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
    return (
      <ProgrammeSessionScreen plan={plan} onStart={handleSessionStart} onFinish={handleSessionFinish} />
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
    // balance both sides → 30 s chair rise, run by the real unified
    // machinery with the batterySequence derived from the pinned scope
    // constant. 'Now' path (nothing trained) REPLACES placement with the −1
    // easy start; any post-training-history path is upward-only.
    // Abandonment applies nothing, burns no once-only surface, and the home
    // button remains the permanent way back.
    return (
      <ProgrammeCheckupZeroScreen
        onComplete={(checkUp) => {
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
