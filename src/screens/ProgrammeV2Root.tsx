/**
 * THE app shell (programme engine v2, PROMOTED 2026-07-08 — the C4 parallel
 * build became the default and its flag was retired): mounted unconditionally
 * by App.tsx inside AuthProvider. Owns store loading (auth-scoped,
 * guest-adopting), the merged onboarding flow, the session/check-up phases,
 * and the three-tab shell (Home / Progress / Learn — the Plan tab merged into
 * Home and Explore's extra-practice catalogue was removed in the
 * founder-directed simplification pass, 2026-07-08) with the Settings flow —
 * all rendered by the SHARED app screens.
 *
 * Coupling rules: programme STATE stays zero-coupled to the old engine (no
 * TrainingStore/TrainingState reads — pinned by the parity review); with the
 * extra-practice catalogue gone, the shell no longer touches the old engine's
 * preset generation at all. Pain-exclusion rows are absent from Settings by
 * the Pain A ruling (§12 regression is v1's answer).
 *
 * Activation event (conformance Q4): firstSessionStarted is written when the
 * runner's Begin fires (markFirstSessionStarted + persist), never at plan
 * generation; the same session's local funnel record carries the v3 stamp.
 */

import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  setAndroidNavigationBarVisibleAsync,
} from '../../modules/expo-pose-detection';
import { LOCAL_USER_ID, type AvailableEquipment } from '../adherence';
import { configureSessionAudio } from '../audio/voicePlayer';
import { LifeGoalOnboardingScreen } from '../adherence/screens/LifeGoalOnboardingScreen';
import { Screen, ScreenScrollClearanceProvider } from '../components/ui';
import { useSystemInsets } from '../components/SystemInsetsProvider';
import { adoptGuestLocalFiles, createExpoHistoryFs } from '../history/fsAdapter';
import { HistoryStore, type StoredCheckUp } from '../history';
import { buildMovementProfileV2ProgressViewModel } from '../haleFlow';
import { TAB_BAR_SCROLL_CLEARANCE, TabBar, type TabKey } from '../navigation/TabBar';
import {
  acknowledgeOnboardingStep,
  applyAssessmentPlacement,
  applyInactivityRegressionIfDue,
  applyProgrammeSessionResults,
  assessmentInputsFromCheckUp,
  markSurfaceShown,
  completeOnboarding,
  currentOnboardingStep,
  effortFromRpe,
  generateProgrammeSession,
  initialOnboardingFlowState,
  markFirstSessionStarted,
  onboardingCompletionRoute,
  PELVIC_PHYSIO_SIGNPOST_COPY,
  postSessionSurface,
  preSessionPrompt,
  ProgrammeStore,
  programmeLevelRows,
  programmeTodayViewModel,
  recordBandAnswer,
  recordDomingCheck,
  recordGatewayDemoWatched,
  recordGatewaySelfConfirmation,
  recordOnboardingAnswer,
  SKIPPED,
  undoLastOnboardingStep,
  type OnboardingAnswerValue,
  type ProgrammePattern,
  type ProgrammeSessionPlan,
  type ProgrammeSessionResults,
  type ProgrammeState,
  type PromotionDecision,
  type SessionRpe,
  type Weekday,
} from '../programme';
import type { OnboardingQuestionStepId } from '../programme';
import {
  onboardingActivityLevel,
  ProfileStore,
  safetyProfileWithCanonicalEquipment,
  canonicalEquipmentFromSafetyProfile,
  type AppSettings,
  type Preferences,
  type UserProfile,
} from '../profile';
import { useAuth } from '../services/backend';
import type { TrainingSessionResult } from '../training/sessionPlayer';
import { DEFAULT_VOICE_SETUP_PREFS, type VoiceSetupPrefs } from '../voice/voicePermissionGate';
import { CameraSetupScreen } from './CameraSetupScreen';
import { LearnDetailScreen } from './ExploreDetailScreens';
import { ExploreScreen } from './ExploreScreen';
import { ProgressScreen } from './ProgressScreen';
import { ProgrammeCheckupZeroScreen } from './ProgrammeCheckupZeroScreen';
import { ProgrammeEffortScreen, ProgrammeMomentScreen } from './ProgrammeMomentScreens';
import { ProgrammeOnboardingScreen } from './ProgrammeOnboardingScreen';
import { SafetyProfileScreen } from './SafetyProfileScreen';
import { SettingsScreen } from './SettingsScreen';
import { TodayScreen } from './TodayScreen';
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

type ShellFlow = 'settings' | 'life-goal' | 'safety-profile' | 'camera-setup' | null;

type CameraPermission = 'checking' | 'granted' | 'undetermined' | 'denied';

const WEEKDAY_VALUES: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function isWeekday(value: string): value is Weekday {
  return (WEEKDAY_VALUES as readonly string[]).includes(value);
}

export function ProgrammeV2Root() {
  // Auth-scoped local stores, same discipline as the old shell: each backend
  // user gets a separate on-device cache so sign-out/sign-in never lets
  // another account inherit local state. Guests use the unscoped store; the
  // first sign-in on a device with guest data adopts it (move, not copy)
  // only when the account scope is still empty.
  const { user } = useAuth();
  const backendUserId = user?.id ?? null;
  const localFs = React.useMemo(() => createExpoHistoryFs({ userId: backendUserId }), [backendUserId]);
  const store = React.useMemo(() => new ProgrammeStore(localFs), [localFs]);
  const profileStore = React.useMemo(() => new ProfileStore(localFs), [localFs]);
  const historyStore = React.useMemo(() => new HistoryStore(localFs), [localFs]);

  const [phase, setPhase] = React.useState<ShellPhase>('loading');
  const [tab, setTab] = React.useState<TabKey>('today');
  const [flow, setFlow] = React.useState<ShellFlow>(null);
  const [learnId, setLearnId] = React.useState<string | null>(null);
  const [programmeState, setProgrammeState] = React.useState<ProgrammeState | null>(null);
  const [prefs, setPrefs] = React.useState<Preferences | null>(null);
  const [history, setHistory] = React.useState<readonly StoredCheckUp[]>([]);
  const [flowState, setFlowState] = React.useState(initialOnboardingFlowState());
  const [plan, setPlan] = React.useState<ProgrammeSessionPlan | null>(null);
  const [sessionResult, setSessionResult] = React.useState<TrainingSessionResult | null>(null);
  const [lastDecisions, setLastDecisions] = React.useState<
    Partial<Record<ProgrammePattern, PromotionDecision>>
  >({});
  const [physioSignpostVisible, setPhysioSignpostVisible] = React.useState(false);
  const [cameraPermission, setCameraPermission] = React.useState<CameraPermission>('checking');
  const sessionStartRef = React.useRef<{ startedAtIso: string; wasFirstSession: boolean } | null>(null);
  // The expectation CTA's promise when Check-up #0 runs first: completing the
  // check-up chains into the first session (abandoning it lands home — the
  // home CTA remains the unsurprising way in).
  const pendingFirstSessionRef = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let [loaded, loadedPrefs, storedHistory] = await Promise.all([
        store.load(),
        profileStore.load(),
        historyStore.loadAll(),
      ]);
      if (
        backendUserId &&
        !loaded.onboardingCompletedAtIso &&
        storedHistory.length === 0
      ) {
        // Account scope is empty → adopt any guest data into it, then reload.
        try {
          const { moved } = await adoptGuestLocalFiles(backendUserId);
          if (moved > 0) {
            [loaded, loadedPrefs, storedHistory] = await Promise.all([
              store.load(),
              profileStore.load(),
              historyStore.loadAll(),
            ]);
          }
        } catch (error) {
          console.warn('[programme-v2] guest adoption failed', error);
        }
      }
      if (cancelled) return;
      // 14+ days away → one level down everywhere, once per gap (§12).
      const regression = applyInactivityRegressionIfDue(loaded, new Date().toISOString());
      if (regression.applied) store.save(regression.state);
      setProgrammeState(regression.state);
      setPrefs(loadedPrefs);
      setHistory(storedHistory);
      setPhase(regression.state.onboardingCompletedAtIso ? 'home' : 'onboarding');
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [store, profileStore, historyStore, backendUserId]);

  React.useEffect(() => {
    getCameraPermissionsAsync()
      .then((response) =>
        setCameraPermission(
          response.granted ? 'granted' : response.status === 'undetermined' ? 'undetermined' : 'denied'
        )
      )
      .catch(() => setCameraPermission('denied'));
  }, []);

  // Audio law: the session audio mode is configured ONCE at startup, BEFORE
  // any camera can mount (an audio-session change must never interrupt a
  // running camera). The shell stays in 'loading' until this settles.
  const [audioReady, setAudioReady] = React.useState(false);
  React.useEffect(() => {
    configureSessionAudio()
      .catch((error) => console.warn('[programme-v2] audio mode configuration failed', error))
      .finally(() => setAudioReady(true));
  }, []);

  // Android navigation bar: visible only on the tab shell — sessions,
  // check-ups, and full-screen flows run immersive (old-shell behavior).
  const showTabBar = phase === 'home' && flow === null && learnId === null;
  React.useEffect(() => {
    void setAndroidNavigationBarVisibleAsync(showTabBar);
  }, [showTabBar]);

  const requestCameraPermission = React.useCallback(() => {
    requestCameraPermissionsAsync()
      .then((response) =>
        setCameraPermission(
          response.granted ? 'granted' : response.status === 'undetermined' ? 'undetermined' : 'denied'
        )
      )
      .catch(() => setCameraPermission('denied'));
  }, []);

  const refreshHistory = React.useCallback(() => {
    historyStore
      .loadAll()
      .then(setHistory)
      .catch(() => {});
  }, [historyStore]);

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

  const persistPrefs = React.useCallback(
    (next: Preferences) => {
      setPrefs(next);
      profileStore.save(next);
    },
    [profileStore]
  );

  const finishOnboarding = React.useCallback(
    async (action: 'start_first_session' | 'schedule') => {
      const completion = completeOnboarding(flowState);
      const route = onboardingCompletionRoute(completion, action);
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
      persistPrefs(nextPrefs);
      if (route.assessmentFirst) {
        // assessment_offer answered 'now' → Check-up #0 runs first (flow.ts
        // completion contract); the freshly exact placement then shapes the
        // first session when the CTA also asked for one.
        pendingFirstSessionRef.current = route.startFirstSession;
        setPhase('assessment');
      } else if (route.startFirstSession) {
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
    [flowState, persist, persistPrefs, prefs, profileStore]
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

  const toggleAvailableEquipment = React.useCallback(
    (item: AvailableEquipment) => {
      if (!prefs) return;
      const safetyProfile = prefs.profile.safetyProfile;
      if (!safetyProfile) return;
      const now = new Date().toISOString();
      const canonical = canonicalEquipmentFromSafetyProfile(safetyProfile);
      const set = new Set(canonical.status === 'confirmed' ? canonical.capabilities : []);
      if (item === 'none') {
        set.clear();
      } else if (set.has(item)) {
        set.delete(item);
      } else {
        set.add(item);
      }
      const nextSafetyProfile = safetyProfileWithCanonicalEquipment(safetyProfile, Array.from(set), {
        status: 'confirmed',
        updatedAt: now,
        revision: safetyProfile.equipmentRevision,
      });
      persistPrefs({
        ...prefs,
        profile: { ...prefs.profile, safetyProfile: nextSafetyProfile },
      });
    },
    [prefs, persistPrefs]
  );

  const systemInsets = useSystemInsets();

  if (phase === 'loading' || !audioReady || !programmeState || !prefs) return <Screen>{null}</Screen>;

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
          if (currentOnboardingStep(next) === 'complete') void finishOnboarding('schedule');
        }}
        onComplete={(action) => void finishOnboarding(action)}
        onBack={() => setFlowState(undoLastOnboardingStep(flowState))}
      />
    );
  }

  if (phase === 'session' && plan) {
    // In-context questions at their moment of effect (§8): copy and
    // precedence come from the adapter (band at the Pull L4 unlock first,
    // then the doming check when core first features).
    const prompt = preSessionPrompt(programmeState, plan);
    if (prompt?.kind === 'band_question') {
      return (
        <ProgrammeMomentScreen
          eyebrow="Quick question"
          title={prompt.title}
          body={prompt.body}
          actions={[
            { label: prompt.yesLabel, onPress: () => persist(recordBandAnswer(programmeState, true)) },
            { label: prompt.noLabel, onPress: () => persist(recordBandAnswer(programmeState, false)) },
          ]}
        />
      );
    }
    if (prompt?.kind === 'doming_check') {
      return (
        <ProgrammeMomentScreen
          eyebrow="Quick question"
          title={prompt.title}
          body={prompt.body}
          actions={[
            {
              label: prompt.yesLabel,
              onPress: () => {
                const result = recordDomingCheck(programmeState, true);
                persist(result.state);
                setPhysioSignpostVisible(result.showPhysioSignpost);
              },
            },
            {
              label: prompt.noLabel,
              onPress: () => persist(recordDomingCheck(programmeState, false).state),
            },
          ]}
        />
      );
    }
    if (physioSignpostVisible) {
      return (
        <ProgrammeMomentScreen
          eyebrow="Quick question"
          title={PELVIC_PHYSIO_SIGNPOST_COPY.title}
          body={PELVIC_PHYSIO_SIGNPOST_COPY.body}
          actions={[
            { label: PELVIC_PHYSIO_SIGNPOST_COPY.dismissLabel, onPress: () => setPhysioSignpostVisible(false) },
          ]}
        />
      );
    }
    // The real v1 session surface: the voice-guided player (ready-gated,
    // self-paced, tap parity, always-on safety words) over the programme
    // plan via the bridge. The activation event fires on mount (Q4).
    return (
      <ProgrammeVoiceSession
        plan={plan}
        voiceId={prefs.settings.voiceId}
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
      <ProgrammeEffortScreen
        onSelect={(rpe) =>
          handleSessionFinish(programmeResultsFromVoiceSession(plan, sessionResult), rpe)
        }
        onSkip={() => handleSessionFinish(programmeResultsFromVoiceSession(plan, sessionResult), null)}
      />
    );
  }

  if (phase === 'session_done') {
    // Precedence and copy come from the adapter: gateway teach card (C3 —
    // teach-only, never a camera verdict) > deferred re-offer > once-only
    // skipped warm re-offer > the session-logged card.
    const surface = postSessionSurface(programmeState, lastDecisions, new Date().toISOString());
    if (surface.kind === 'gateway_teach') {
      const ladder = programmeState.ladders[surface.pattern];
      return (
        <ProgrammeMomentScreen
          eyebrow="Session done"
          title={surface.title}
          body={surface.body}
          actions={[
            ...(!surface.demoWatched
              ? [
                  {
                    label: surface.demoLabel,
                    onPress: () =>
                      persist({
                        ...programmeState,
                        ladders: {
                          ...programmeState.ladders,
                          [surface.pattern]: recordGatewayDemoWatched(ladder, surface.toLevel),
                        },
                      }),
                  },
                ]
              : []),
            ...(surface.demoWatched && !surface.selfConfirmed
              ? [
                  {
                    label: surface.confirmLabel,
                    onPress: () =>
                      persist({
                        ...programmeState,
                        ladders: {
                          ...programmeState.ladders,
                          [surface.pattern]: recordGatewaySelfConfirmation(ladder, surface.toLevel),
                        },
                      }),
                  },
                ]
              : []),
            { label: surface.laterLabel, variant: 'ghost' as const, onPress: () => setLastDecisions({}) },
          ]}
        />
      );
    }
    if (surface.kind === 'deferred_reoffer') {
      return (
        <ProgrammeMomentScreen
          eyebrow="Session done"
          title={surface.title}
          body={surface.body}
          actions={[
            { label: surface.startLabel, onPress: () => setPhase('assessment') },
            {
              label: surface.laterLabel,
              variant: 'ghost',
              // Dismissing must LEAVE this surface — the re-offer policy is
              // pure over state, so re-rendering would show the same card
              // forever (dev-shell bug fixed here). Home keeps the standing
              // movement-check entry.
              onPress: () => {
                setLastDecisions({});
                setPhase('home');
              },
            },
          ]}
        />
      );
    }
    if (surface.kind === 'skipped_warm_reoffer') {
      // Softer than the deferred card; renders exactly once — the home
      // screen's movement-check entry remains the permanent path.
      return (
        <ProgrammeMomentScreen
          eyebrow="Session done"
          title={surface.title}
          body={surface.body}
          actions={[
            { label: surface.startLabel, onPress: () => setPhase('assessment') },
            {
              label: surface.laterLabel,
              variant: 'ghost',
              onPress: () => persist(markSurfaceShown(programmeState, 'skipped_warm_reoffer_card')),
            },
          ]}
        />
      );
    }
    return (
      <ProgrammeMomentScreen
        eyebrow="Session done"
        title={surface.title}
        body={surface.body}
        actions={[{ label: surface.doneLabel, onPress: () => setPhase('home') }]}
      />
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
        voiceId={prefs.settings.voiceId}
        onRawCheckUpReady={(checkUp) => {
          try {
            historyStore.save(checkUp, { checkupType: 'manual_extra_v2' });
            refreshHistory();
          } catch (error) {
            console.warn('[programme-v2] early raw check-up save failed', error);
          }
        }}
        onComplete={(checkUp) => {
          try {
            historyStore.save(checkUp, { checkupType: 'manual_extra_v2' });
            refreshHistory();
          } catch (error) {
            console.warn('[programme-v2] final check-up save failed', error);
          }
          const inputs = assessmentInputsFromCheckUp(checkUp);
          const applied = applyAssessmentPlacement(programmeState, inputs, {
            deferred: programmeState.completedSessionCount > 0,
          });
          persist(applied);
          if (pendingFirstSessionRef.current) {
            // The onboarding CTA promised a first session; the check-up ran
            // first, so generate it from the freshly exact placement.
            pendingFirstSessionRef.current = false;
            setPlan(
              generateProgrammeSession({ state: applied, template: 'A', preset: 'first_session' })
            );
            setPhase('session');
            return;
          }
          setPhase('home');
        }}
        onCancel={() => {
          // Abandonment is penalty-free and unsurprising: land home, where
          // the first-session CTA remains the way in.
          pendingFirstSessionRef.current = false;
          setPhase('home');
        }}
      />
    );
  }

  // ── Tab shell (phase 'home') ───────────────────────────────────────────
  // Flows and the ephemeral explore session take the whole screen; the four
  // tabs render underneath the shared TabBar. Level rows show the
  // post-easing levels so what the user sees is what the next session runs;
  // the easing itself persists at session start (startSessionFromHome
  // re-checks).
  const nowIso = new Date().toISOString();
  const todayVm = programmeTodayViewModel(programmeState, nowIso);
  const easedLevels = programmeLevelRows(
    applyInactivityRegressionIfDue(programmeState, nowIso).state
  );
  const goAssessment = () => setPhase('assessment');
  const openSettings = () => setFlow('settings');

  if (learnId) {
    return <LearnDetailScreen articleId={learnId} onDone={() => setLearnId(null)} />;
  }

  if (flow === 'settings') {
    return (
      <SettingsScreen
        profile={prefs.profile}
        settings={prefs.settings}
        preferredDays={programmeState.profile.chosenDays}
        startingEffort={onboardingActivityLevel(programmeState.profile.activityLevel)}
        onProfileChange={(next: UserProfile) => persistPrefs({ ...prefs, profile: next })}
        onSettingsChange={(next: AppSettings) => persistPrefs({ ...prefs, settings: next })}
        onToggleAvailableEquipment={toggleAvailableEquipment}
        onPreferredDaysChange={(days) =>
          persist({
            ...programmeState,
            profile: { ...programmeState.profile, chosenDays: days.filter(isWeekday) },
          })
        }
        onStartingEffortChange={(level) =>
          // Read by every future check-up re-placement (activity prior).
          persist({
            ...programmeState,
            profile: { ...programmeState.profile, activityLevel: level },
          })
        }
        onOpenLifeGoal={() => setFlow('life-goal')}
        onOpenSafetyProfile={() => setFlow('safety-profile')}
        onOpenCameraSetup={() => setFlow('camera-setup')}
        // No pain-exclusion rows in v2 by the Pain A ruling (2026-07-07):
        // the §12 pain regression is v1's answer to exercise pain.
        onBack={() => setFlow(null)}
      />
    );
  }

  if (flow === 'life-goal') {
    return (
      <LifeGoalOnboardingScreen
        initialGoal={prefs.profile.lifeGoal}
        mode="review"
        onSave={(goal) => {
          persistPrefs({ ...prefs, profile: { ...prefs.profile, lifeGoal: goal } });
          setFlow('settings');
        }}
        onCancel={() => setFlow('settings')}
      />
    );
  }

  if (flow === 'safety-profile') {
    return (
      <SafetyProfileReview
        prefs={prefs}
        onSave={persistPrefs}
        onClose={() => setFlow('settings')}
      />
    );
  }

  if (flow === 'camera-setup') {
    return (
      <CameraSetupScreen
        permissionGranted={cameraPermission === 'granted'}
        onRequestPermission={requestCameraPermission}
        showBeginAction={false}
        onBegin={() => setFlow('settings')}
        onCancel={() => setFlow('settings')}
      />
    );
  }

  const tabBarScrollClearance = TAB_BAR_SCROLL_CLEARANCE + systemInsets.bottom;
  return (
    <View style={styles.container}>
      <ScreenScrollClearanceProvider bottom={tabBarScrollClearance}>
        <View style={styles.tabContent}>
          {tab === 'progress' ? (
            <ProgressScreen
              onBeginFirstCheckUp={goAssessment}
              onBeginAdditionalCheckUp={goAssessment}
              onStartMovementProfileV2CheckUp={goAssessment}
              movementProfileV2Progress={buildMovementProfileV2ProgressViewModel({
                history,
                blocks: [],
                reports: [],
                today: nowIso,
              })}
              onOpenSettings={openSettings}
            />
          ) : tab === 'explore' ? (
            <ExploreScreen
              menopauseStage={prefs.profile.menopauseStage}
              onOpenLearn={setLearnId}
              onOpenSettings={openSettings}
            />
          ) : (
            <TodayScreen
              profile={prefs.profile}
              programme={{
                today: todayVm,
                levelRows: easedLevels,
                onStartCheckup: todayVm.checkupOffer ? goAssessment : undefined,
              }}
              onPrimaryAction={() => startSessionFromHome()}
              onOpenSettings={openSettings}
            />
          )}
        </View>
      </ScreenScrollClearanceProvider>
      <TabBar active={tab} onChange={setTab} bottomInset={systemInsets.bottom} />
    </View>
  );
}

/** Safety-profile review (Settings): reference details + equipment, saved to
 * the shared profile store — the same handoff shape the old shell used. */
function SafetyProfileReview({
  prefs,
  onSave,
  onClose,
}: {
  prefs: Preferences;
  onSave: (next: Preferences) => void;
  onClose: () => void;
}) {
  return (
    <SafetyProfileScreen
      profile={prefs.profile}
      showContinueAction={false}
      showStartingDetails
      onSave={(safetyProfile, referenceDetails, options) => {
        const now = new Date().toISOString();
        const nextSafetyProfile = safetyProfileWithCanonicalEquipment(
          {
            ...safetyProfile,
            age: referenceDetails.exactAge,
            ageBand: referenceDetails.ageBand ?? undefined,
          },
          safetyProfile.availableEquipment,
          {
            status: safetyProfile.equipmentStatus ?? 'confirmed',
            updatedAt: now,
            revision: safetyProfile.equipmentRevision,
          }
        );
        onSave({
          ...prefs,
          profile: {
            ...prefs.profile,
            dateOfBirth: referenceDetails.dateOfBirth,
            exactAge: referenceDetails.exactAge,
            referenceSex: referenceDetails.referenceSex,
            menopauseStage: referenceDetails.menopauseStage,
            symptomPicture: referenceDetails.symptomPicture,
            age: referenceDetails.exactAge,
            ageBand: referenceDetails.ageBand,
            safetyProfile: nextSafetyProfile,
          },
        });
        if (!options?.stayOnScreen) onClose();
      }}
      onCancel={onClose}
    />
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
      bonusSetOffer={inputs.bonusSetOffer}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
});
