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
  applyProgrammeSessionResults,
  completeOnboarding,
  currentOnboardingStep,
  effortFromRpe,
  generateProgrammeSession,
  initialOnboardingFlowState,
  markFirstSessionStarted,
  ProgrammeStore,
  recordOnboardingAnswer,
  SKIPPED,
  type OnboardingAnswerValue,
  type ProgrammeSessionPlan,
  type ProgrammeSessionResults,
  type ProgrammeState,
  type SessionRpe,
} from '../programme';
import type { OnboardingQuestionStepId } from '../programme';
import { ProfileStore } from '../profile';
import { buildStoredSessionFunnel, SessionFunnelStore } from '../telemetry';
import { createExpoSessionFunnelFs } from '../telemetry/fsAdapter';
import { ProgrammeOnboardingScreen } from './ProgrammeOnboardingScreen';
import { ProgrammeSessionScreen } from './ProgrammeSessionScreen';

type ShellPhase = 'loading' | 'onboarding' | 'home' | 'session' | 'session_done';

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
  const sessionStartRef = React.useRef<{ startedAtIso: string; wasFirstSession: boolean } | null>(null);

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
    setPlan(
      generateProgrammeSession({
        state: programmeState,
        template: 'A',
        preset: programmeState.profile.firstSessionStarted ? 'standard' : 'first_session',
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
      const applied = applyProgrammeSessionResults(programmeState, plan, {
        ...results,
        outcomes: results.outcomes.map((outcome) => ({ ...outcome, effort })),
      });
      persist(applied.state);
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
    return (
      <ProgrammeSessionScreen plan={plan} onStart={handleSessionStart} onFinish={handleSessionFinish} />
    );
  }

  if (phase === 'session_done') {
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

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center' }}>
        <Typography variant="h1">Ready when you are</Typography>
        <Button
          title={programmeState.profile.firstSessionStarted ? 'Start a session' : 'Start your first session — 15 minutes'}
          onPress={startSessionFromHome}
        />
      </View>
    </Screen>
  );
}
