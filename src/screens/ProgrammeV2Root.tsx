/**
 * THE app shell (programme engine v2, PROMOTED 2026-07-08 — the C4 parallel
 * build became the default and its flag was retired): mounted unconditionally
 * by App.tsx inside AuthProvider. Owns store loading (auth-scoped,
 * guest-adopting), the merged onboarding flow, the session/check-up phases,
 * and the two-tab shell (Home / Progress) with the Settings flow —
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
import { Screen, ScreenScrollClearanceProvider } from '../components/ui';
import { useSystemInsets } from '../components/SystemInsetsProvider';
import {
  MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID,
  MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1,
  PEARL_MONTHLY_STRENGTH_BALANCE_PROTOCOL_VARIANT,
  type CheckUp,
} from '../checkup';
import { adoptGuestLocalFiles, createExpoHistoryFs } from '../history/fsAdapter';
import {
  HistoryStore,
  OfficialCheckUpDraftStore,
  type OfficialCheckUpDraft,
  type StoredCheckUp,
  type StoredCheckUpType,
} from '../history';
import {
  materializeOfficialMovementProfileV2Artifacts,
  type MovementProfileV2ReferenceProfile,
} from '../reference/movementProfileV2';
import {
  buildMovementProfileV2ProgressViewModel,
  buildClarityTrendViewModel,
  movementProfileV2ProgressProfileBySourceCheckUpId,
  validOfficialMovementProfileV2Assessments,
} from '../pearlFlow';
import { movementProfileV2ResultsViewModelForRecord } from '../movementProfileV2/viewModel';
import { TAB_BAR_SCROLL_CLEARANCE, TabBar, type TabKey } from '../navigation/TabBar';
import {
  acknowledgeOnboardingStep,
  applyAssessmentPlacement,
  applyInactivityRegressionIfDue,
  applyProgrammeSessionResults,
  applyOfficialAssessmentToProgrammeJourney,
  assessmentInputsFromCheckUp,
  baselineCheckupDueAfterStarter,
  officialCheckUpAccess,
  markSurfaceShown,
  completeOnboarding,
  currentOnboardingStep,
  defaultProgrammeState,
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
  programmeJourneyProgressAt,
  programmeTodayViewModel,
  recordBandAnswer,
  recordDomingCheck,
  recordGatewayDemoWatched,
  recordGatewaySelfConfirmation,
  recordProgrammeJourneySession,
  recordOnboardingAnswer,
  SKIPPED,
  undoLastOnboardingStep,
  type OnboardingAnswerValue,
  type ProgrammePattern,
  type ProgrammeSessionPlan,
  type ProgrammeSessionResults,
  type ProgrammeState,
  type ProgrammeTodayViewModel,
  type PromotionDecision,
  type SessionRpe,
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
import { clearLocalPearlData, useAuth } from '../services/backend';
import type { TrainingSessionResult } from '../training/sessionPlayer';
import { DEFAULT_VOICE_SETUP_PREFS, type VoiceSetupPrefs } from '../voice/voicePermissionGate';
import { CameraSetupScreen } from './CameraSetupScreen';
import { MovementProfileV2UnifiedResultsScreen } from './MovementProfileV2UnifiedResultsScreen';
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
import { generateMockJourney } from '../dev/mockData';

type ShellPhase =
  | 'loading'
  | 'onboarding'
  | 'home'
  | 'session'
  | 'effort'
  | 'session_done'
  | 'assessment';

type ShellFlow = 'settings' | 'safety-profile' | 'camera-setup' | null;

type CameraPermission = 'checking' | 'granted' | 'undetermined' | 'denied';

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
  const checkUpDraftStore = React.useMemo(
    () => new OfficialCheckUpDraftStore(localFs),
    [localFs]
  );

  const [phase, setPhase] = React.useState<ShellPhase>('loading');
  const [tab, setTab] = React.useState<TabKey>('today');
  const [flow, setFlow] = React.useState<ShellFlow>(null);
  // The per-check-up results page (restored 2026-07-08, founder direction):
  // fresh results right after a check-up ('standard' / 'onboarding' for the
  // first-ever), and read-only saved results from Progress ('history'). The
  // view model derives from stored history, so both surfaces share one
  // derivation path (one-owner rule).
  const [resultsView, setResultsView] = React.useState<{
    sourceCheckUpId: string;
    variant: 'standard' | 'onboarding' | 'history';
  } | null>(null);
  const [programmeState, setProgrammeState] = React.useState<ProgrammeState | null>(null);
  const [prefs, setPrefs] = React.useState<Preferences | null>(null);
  const [history, setHistory] = React.useState<readonly StoredCheckUp[]>([]);
  const [checkUpDraft, setCheckUpDraft] = React.useState<OfficialCheckUpDraft | null>(null);
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
  const assessmentContinuationStateRef = React.useRef<ProgrammeState | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let [loaded, loadedPrefs, storedHistory, storedDraft] = await Promise.all([
        store.load(),
        profileStore.load(),
        historyStore.loadAll(),
        checkUpDraftStore.load(),
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
            [loaded, loadedPrefs, storedHistory, storedDraft] = await Promise.all([
              store.load(),
              profileStore.load(),
              historyStore.loadAll(),
              checkUpDraftStore.load(),
            ]);
          }
        } catch (error) {
          console.warn('[programme-v2] guest adoption failed', error);
        }
      }
      if (cancelled) return;
      // 14+ days away → one level down everywhere, once per gap (§12).
      const regression = applyInactivityRegressionIfDue(loaded, new Date().toISOString());
      let reconciledState = regression.state;
      let journeyReconciled = false;
      // Schema-v1 installs already have frozen official assessments but no
      // journey field. Replay those accepted artifacts in date order so an
      // upgrade never asks an established user for a second "baseline".
      const acceptedAssessments = validOfficialMovementProfileV2Assessments(storedHistory);
      for (const record of acceptedAssessments) {
        const applied = applyOfficialAssessmentToProgrammeJourney(
          reconciledState.journey,
          {
            assessment: record.assessment,
            completedAtIso: record.assessment.createdAt,
          }
        );
        if (applied.kind === 'advanced' || applied.kind === 'completed') {
          let nextState = reconciledState;
          if (
            applied.kind === 'advanced' &&
            applied.startedPhase === 1 &&
            reconciledState.profile.assessmentStatus !== 'done'
          ) {
            nextState = applyAssessmentPlacement(
              reconciledState,
              assessmentInputsFromCheckUp(record.record.checkUp),
              {
                // Established users keep every earned ladder step; a missing
                // legacy baseline placement may only move them upward.
                deferred: reconciledState.completedSessionCount > 0,
                completedAtIso: record.assessment.createdAt,
              }
            );
          }
          reconciledState = {
            ...nextState,
            profile: {
              ...nextState.profile,
              assessmentStatus: 'done',
              lastAssessmentAtIso: record.assessment.createdAt,
            },
            journey: applied.state,
          };
          journeyReconciled = true;
        }
      }
      const acceptedCheckpoints = Object.values(reconciledState.journey.checkpoints)
        .filter((checkpoint): checkpoint is NonNullable<typeof checkpoint> => checkpoint !== undefined)
        .sort((a, b) => Date.parse(a.completedAtIso) - Date.parse(b.completedAtIso));
      if (acceptedCheckpoints.length > 0) {
        let companionState = reconciledState;
        if (companionState.profile.assessmentStatus !== 'done') {
          const baselineRecord = acceptedAssessments.find(
            (record) =>
              record.assessment.sourceCheckUpId ===
              companionState.journey.checkpoints.baseline?.sourceCheckUpId
          );
          if (baselineRecord) {
            companionState = applyAssessmentPlacement(
              companionState,
              assessmentInputsFromCheckUp(baselineRecord.record.checkUp),
              {
                deferred: companionState.completedSessionCount > 0,
                completedAtIso: baselineRecord.assessment.createdAt,
              }
            );
          }
        }
        const latestCheckpoint = acceptedCheckpoints[acceptedCheckpoints.length - 1];
        if (
          companionState.profile.assessmentStatus !== 'done' ||
          companionState.profile.lastAssessmentAtIso !== latestCheckpoint.completedAtIso
        ) {
          companionState = {
            ...companionState,
            profile: {
              ...companionState.profile,
              assessmentStatus: 'done',
              lastAssessmentAtIso: latestCheckpoint.completedAtIso,
            },
          };
          journeyReconciled = true;
        }
        reconciledState = companionState;
      }
      if (regression.applied || journeyReconciled) store.save(reconciledState);
      setProgrammeState(reconciledState);
      setPrefs(loadedPrefs);
      setHistory(storedHistory);
      if (
        storedDraft &&
        storedHistory.some((record) => record.checkUp.startedAt === storedDraft.checkUp.startedAt)
      ) {
        checkUpDraftStore.clear();
        setCheckUpDraft(null);
      } else {
        setCheckUpDraft(storedDraft);
      }
      setPhase(reconciledState.onboardingCompletedAtIso ? 'home' : 'onboarding');
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [store, profileStore, historyStore, checkUpDraftStore, backendUserId]);

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
  const showTabBar = phase === 'home' && flow === null && resultsView === null;
  React.useEffect(() => {
    void setAndroidNavigationBarVisibleAsync(showTabBar);
  }, [showTabBar]);

  // Single permission-request seam: the Check-up #0 intro awaits the result
  // (the OS dialog must show over that static screen, never mid-battery over
  // the camera + intro voice) and Settings fires it without awaiting.
  const ensureCameraPermission = React.useCallback(async (): Promise<boolean> => {
    try {
      const response = await requestCameraPermissionsAsync();
      setCameraPermission(
        response.granted ? 'granted' : response.status === 'undetermined' ? 'undetermined' : 'denied'
      );
      return response.granted;
    } catch {
      setCameraPermission('denied');
      return false;
    }
  }, []);

  const requestCameraPermission = React.useCallback(() => {
    void ensureCameraPermission();
  }, [ensureCameraPermission]);

  const refreshHistory = React.useCallback(() => {
    historyStore
      .loadAll()
      .then(setHistory)
      .catch(() => {});
  }, [historyStore]);

  // Real check-ups are the OFFICIAL record (2026-07-09 ruling): the first ever
  // saves as 'baseline', every later one as 'official_retest', and the
  // snapshot + assessment are materialized AT SAVE so the results page and
  // Progress history accept the record. The reference profile carries only
  // what the user actually provided — absent age/sex degrade comparison
  // claims to raw-only, nothing is ever fabricated. A battery only enters
  // official history after materialization succeeds; otherwise it is kept as
  // a non-official local attempt and Home leads back to a baseline retake.
  const officialCheckUpTypeFor = React.useCallback(
    (checkUp: CheckUp): Extract<
      StoredCheckUpType,
      'baseline' | 'baseline_retake' | 'official_retest'
    > => {
      const priorHistory = history.filter(
        (record) => record.checkUp.startedAt !== checkUp.startedAt
      );
      if (programmeState?.journey.status === 'awaiting_baseline') {
        const hasPriorBaselineAttempt = priorHistory.some(
          (record) =>
            record.checkupType === 'baseline' ||
            record.checkupType === 'baseline_retake' ||
            (record.checkupType === 'manual_extra_v2' &&
              record.checkUp.measurementProtocol?.protocolId ===
                MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID &&
              record.checkUp.measurementProtocol?.protocolVersion ===
                MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1 &&
              record.checkUp.measurementProtocol?.protocolVariant ===
                PEARL_MONTHLY_STRENGTH_BALANCE_PROTOCOL_VARIANT)
        );
        return hasPriorBaselineAttempt ? 'baseline_retake' : 'baseline';
      }
      return 'official_retest';
    },
    [history, programmeState]
  );

  const prepareOfficialCheckUp = React.useCallback(
    (checkUp: CheckUp) => {
      const priorHistory = history.filter(
        (record) => record.checkUp.startedAt !== checkUp.startedAt
      );
      const checkupType = officialCheckUpTypeFor(checkUp);
      const profile = prefs?.profile;
      const ageAtTest = profile?.exactAge ?? profile?.age ?? null;
      const referenceProfile: MovementProfileV2ReferenceProfile = {
        ...(typeof ageAtTest === 'number' ? { ageAtTest } : {}),
        ageBasis: typeof ageAtTest === 'number' ? 'exact_age_at_test' : 'unknown',
        referenceSex: profile?.referenceSex ?? 'unknown',
      };
      const nowIso = new Date().toISOString();
      const result = materializeOfficialMovementProfileV2Artifacts({
        checkUp,
        checkupType,
        referenceProfile,
        lifeGoal: profile?.lifeGoal ?? null,
        acceptedHistory: priorHistory,
        snapshotCreatedAt: nowIso,
        assessmentCreatedAt: nowIso,
      });
      if (result.ok) {
        return {
          ok: true as const,
          checkupType,
          checkUp: result.checkUp,
          snapshot: result.snapshot,
          assessment: result.assessment,
        };
      }
      console.warn('[programme-v2] check-up materialization failed', result.reason);
      return { ok: false as const, checkupType };
    },
    [history, officialCheckUpTypeFor, prefs]
  );

  // What happens once fresh results are dismissed (or could not be shown):
  // the onboarding CTA's promised first session, or home. Consumes the
  // pending-first-session promise exactly once.
  const proceedAfterAssessment = React.useCallback(() => {
    const continuationState = assessmentContinuationStateRef.current ?? programmeState;
    if (pendingFirstSessionRef.current && continuationState) {
      // The onboarding CTA promised a first session; the check-up ran
      // first, so generate it from the freshly exact placement.
      pendingFirstSessionRef.current = false;
      setPlan(
        generateProgrammeSession({
          state: continuationState,
          template: 'A',
          preset: 'first_session',
        })
      );
      assessmentContinuationStateRef.current = null;
      setPhase('session');
      return;
    }
    pendingFirstSessionRef.current = false;
    assessmentContinuationStateRef.current = null;
    setPhase('home');
  }, [programmeState]);

  // Results derive from stored history so fresh and saved views share one
  // path; rebuilt when the population-comparison preference flips.
  const resultsViewModel = React.useMemo(() => {
    if (!resultsView) return null;
    const record = movementProfileV2ProgressProfileBySourceCheckUpId(
      history,
      resultsView.sourceCheckUpId
    );
    if (!record) return null;
    return movementProfileV2ResultsViewModelForRecord(record, {
      comparisonOptIn: prefs?.settings.comparisonOptIn,
    });
  }, [history, resultsView, prefs]);

  // Condition 1 of record (2026-07-06): the comparison affordance exists only
  // from the second stored official check-up onward.
  const officialCheckUpCount = React.useMemo(
    () => validOfficialMovementProfileV2Assessments(history).length,
    [history]
  );

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
        // first session when the CTA also asked for one. Enforce the same
        // consent/safety/cadence policy here against the freshly completed
        // state; the render boundary remains a second fail-closed guard.
        const access = officialCheckUpAccess(
          completion.programmeState,
          nowIso
        );
        if (access.allowed) {
          pendingFirstSessionRef.current = route.startFirstSession;
          setPhase('assessment');
        } else if (route.startFirstSession) {
          pendingFirstSessionRef.current = false;
          setPlan(
            generateProgrammeSession({
              state: completion.programmeState,
              template: 'A',
              preset: 'first_session',
            })
          );
          setPhase('session');
        } else {
          pendingFirstSessionRef.current = false;
          setPhase('home');
        }
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

  const startOfficialCheckUp = React.useCallback(() => {
    if (!programmeState) return;
    const access = officialCheckUpAccess(programmeState, new Date().toISOString(), {
      hasDraft: checkUpDraft !== null,
    });
    if (access.allowed) setPhase('assessment');
  }, [programmeState, checkUpDraft]);

  const startSessionFromHome = React.useCallback(() => {
    if (!programmeState) return;
    if (
      checkUpDraft &&
      officialCheckUpAccess(programmeState, new Date().toISOString(), { hasDraft: true }).allowed
    ) {
      setPhase('assessment');
      return;
    }
    // A deferred baseline permits one low-friction generic starter, not an
    // unlimited unpersonalized programme. The next Home action resumes the
    // official check-up so Phase 1 can start from measured Strength/Balance.
    if (baselineCheckupDueAfterStarter(programmeState)) {
      setPhase('assessment');
      return;
    }
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
  }, [programmeState, checkUpDraft, persist]);

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
      const credit = recordProgrammeJourneySession(applied.state.journey, {
        sessionId: sessionStartRef.current?.startedAtIso ?? results.completedAtIso,
        completedAtIso: results.completedAtIso,
        templateId: plan.template,
      });
      const stateWithJourney =
        credit.kind === 'credited' || credit.kind === 'already_recorded'
          ? { ...applied.state, journey: credit.state }
          : applied.state;
      persist(stateWithJourney);
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

  const handleClearDeviceData = React.useCallback(async () => {
    const result = await clearLocalPearlData({ fs: localFs });
    if (result.failures.length > 0) {
      throw new Error(`Could not clear ${result.failures.length} local data item(s).`);
    }

    // Keep the current auth scope intact, but reset every in-memory owner to
    // the same fresh state a relaunch would load from the now-empty directory.
    const freshPreferences = await profileStore.load();
    setProgrammeState(defaultProgrammeState());
    setPrefs(freshPreferences);
    setHistory([]);
    setCheckUpDraft(null);
    setFlowState(initialOnboardingFlowState());
    setPlan(null);
    setSessionResult(null);
    setLastDecisions({});
    setPhysioSignpostVisible(false);
    setResultsView(null);
    setTab('today');
    sessionStartRef.current = null;
    pendingFirstSessionRef.current = false;
    assessmentContinuationStateRef.current = null;
  }, [localFs, profileStore]);

  const handleDataCleared = React.useCallback(() => {
    setFlow(null);
    setPhase('onboarding');
  }, []);

  // ── DEV-only mock data (gated by __DEV__ at the Settings render site) ──────
  // Seeds a months-long journey — several completed voice sessions plus a
  // series of official check-ups — so Home, Progress, and the Results screens
  // can be viewed populated without a camera-graded battery. Built through the
  // production reducers/materializers so it renders like real data.
  const handleFillSampleData = React.useCallback(() => {
    if (!programmeState || !prefs) return;
    try {
      const journey = generateMockJourney({ profile: prefs.profile, programmeState });
      // Clear any existing check-ups first so the seeded series stands alone
      // and re-running produces a clean, consistent demo.
      for (const name of localFs.list()) {
        if (name.startsWith('checkup-') && name.endsWith('.json')) localFs.delete?.(name);
      }
      setCheckUpDraft(null);
      for (const { checkUp, checkupType } of journey.checkUps) {
        historyStore.save(checkUp, { checkupType });
      }
      persist(journey.programmeState);
      refreshHistory();
      setFlow(null);
      setTab('progress');
    } catch (error) {
      console.warn('[programme-v2] fill sample data failed', error);
    }
  }, [programmeState, prefs, localFs, historyStore, persist, refreshHistory]);

  const handleResetSampleData = React.useCallback(() => {
    if (!programmeState) return;
    try {
      for (const name of localFs.list()) {
        if (name.startsWith('checkup-') && name.endsWith('.json')) localFs.delete?.(name);
      }
      setCheckUpDraft(null);
      persist({
        ...defaultProgrammeState(),
        onboardingCompletedAtIso: programmeState.onboardingCompletedAtIso,
        profile: {
          ...programmeState.profile,
          placement: {},
          assessmentStatus: null,
          lastAssessmentAtIso: null,
          firstSessionStarted: false,
          oneTimeSurfacesShown: [],
        },
      });
      refreshHistory();
      setFlow(null);
      setTab('today');
    } catch (error) {
      console.warn('[programme-v2] reset sample data failed', error);
    }
  }, [programmeState, localFs, persist, refreshHistory]);

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
            { label: surface.startLabel, onPress: startOfficialCheckUp },
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
            { label: surface.startLabel, onPress: startOfficialCheckUp },
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
    const access = officialCheckUpAccess(programmeState, new Date().toISOString(), {
      hasDraft: checkUpDraft !== null,
    });
    if (!access.allowed) {
      return (
        <ProgrammeMomentScreen
          eyebrow="Movement Check-Up"
          title="This check-up is not available right now"
          body="Your current consent, safety, or four-week programme state does not allow an official check-up. No measurement has started or been saved."
          actions={[{ label: 'Back to Home', onPress: () => setPhase('home') }]}
        />
      );
    }
    // The movement battery is staged as a recoverable draft first. Only after
    // Everyday Clarity has been offered does the assembled record enter
    // official history and advance the 12-week journey. Monthly checks refresh
    // the next phase prescription but never mechanically demote ladder levels
    // from one noisy day.
    return (
      <ProgrammeCheckupZeroScreen
        voiceId={prefs.settings.voiceId}
        history={history}
        initialDraft={checkUpDraft?.checkUp}
        showSymptomLoad={
          prefs.profile.menopauseStage !== null &&
          prefs.profile.menopauseStage !== 'prefer_not_to_say'
        }
        cameraPermissionGranted={cameraPermission === 'granted'}
        onRequestCameraPermission={ensureCameraPermission}
        onRawCheckUpReady={(checkUp) => {
          try {
            const checkupType = officialCheckUpTypeFor(checkUp);
            const updatedAtIso = new Date().toISOString();
            checkUpDraftStore.save(checkUp, checkupType, updatedAtIso);
            setCheckUpDraft({
              schemaVersion: 1,
              checkupType,
              updatedAtIso,
              checkUp,
            });
          } catch (error) {
            console.warn('[programme-v2] check-up draft save failed', error);
          }
        }}
        onComplete={(checkUp) => {
          const completedAtIso = new Date().toISOString();
          let prepared: ReturnType<typeof prepareOfficialCheckUp>;
          try {
            prepared = prepareOfficialCheckUp(checkUp);
          } catch (error) {
            console.warn('[programme-v2] final check-up preparation failed', error);
            return;
          }

          let nextProgrammeState = programmeState;
          let showOfficialResults = false;
          let saveAsOfficial = false;

          if (!prepared.ok) {
            if (programmeState.journey.status === 'awaiting_baseline') {
              nextProgrammeState = {
                ...programmeState,
                profile: {
                  ...programmeState.profile,
                  assessmentStatus: 'deferred',
                },
              };
            }
          } else {
            const journeyResult = applyOfficialAssessmentToProgrammeJourney(
              programmeState.journey,
              { assessment: prepared.assessment, completedAtIso }
            );
            if (journeyResult.kind === 'advanced' || journeyResult.kind === 'completed') {
              saveAsOfficial = true;
              if (journeyResult.kind === 'advanced' && journeyResult.startedPhase === 1) {
                const inputs = assessmentInputsFromCheckUp(checkUp);
                nextProgrammeState = applyAssessmentPlacement(programmeState, inputs, {
                  // One generic starter may precede baseline; measured placement
                  // can then move her up but never erase reported progress.
                  deferred: programmeState.completedSessionCount > 0,
                  completedAtIso,
                });
              } else {
                // Retests choose the next phase's focus. Exercise ladders remain
                // governed by reported sessions, not one camera reading.
                nextProgrammeState = {
                  ...programmeState,
                  profile: {
                    ...programmeState.profile,
                    assessmentStatus: 'done',
                    lastAssessmentAtIso: completedAtIso,
                  },
                };
              }
              nextProgrammeState = {
                ...nextProgrammeState,
                journey: journeyResult.state,
              };
            } else if (journeyResult.kind === 'already_applied') {
              // Idempotent recovery path: the checkpoint may already have
              // reached programme state while the final draft clear did not.
              saveAsOfficial = true;
              nextProgrammeState = {
                ...programmeState,
                journey: journeyResult.state,
              };
            } else if (
              journeyResult.kind === 'rejected' &&
              journeyResult.reason === 'needs_retake'
            ) {
              // This is still a valid official measurement and belongs in
              // history, but it must not start or advance a phase. At baseline
              // one gentle starter remains available before a measured retake.
              saveAsOfficial = true;
              if (programmeState.journey.status === 'awaiting_baseline') {
                nextProgrammeState = {
                  ...programmeState,
                  profile: {
                    ...programmeState.profile,
                    assessmentStatus: 'deferred',
                  },
                };
              }
            } else if (journeyResult.kind === 'rejected') {
              // A route, cadence, or source mismatch must never enter official
              // comparisons merely because its measurements materialized.
              if (programmeState.journey.status === 'awaiting_baseline') {
                nextProgrammeState = {
                  ...programmeState,
                  profile: {
                    ...programmeState.profile,
                    assessmentStatus: 'deferred',
                  },
                };
              }
            }
          }

          try {
            if (prepared.ok && saveAsOfficial) {
              // Commit the accepted official artifact only after the journey
              // decision is known. It is written before programme state so a
              // crash can be reconciled from immutable history on next load.
              historyStore.save(prepared.checkUp, {
                checkupType: prepared.checkupType,
                movementProfileV2Snapshot: prepared.snapshot,
                movementProfileV2Assessment: prepared.assessment,
              });
              showOfficialResults = true;
            } else {
              // Preserve an unusable or out-of-sequence attempt locally while
              // keeping it out of official progress and checkpoint history.
              historyStore.save(checkUp, { checkupType: 'manual_extra_v2' });
            }
            checkUpDraftStore.clear();
            setCheckUpDraft(null);
          } catch (error) {
            console.warn('[programme-v2] final check-up commit failed', error);
            return;
          }

          assessmentContinuationStateRef.current = nextProgrammeState;
          persist(nextProgrammeState);
          if (!showOfficialResults) {
            historyStore
              .loadAll()
              .then((stored) => {
                setHistory(stored);
                proceedAfterAssessment();
              })
              .catch(() => proceedAfterAssessment());
            return;
          }
          // Show fresh results before continuing (restored page, 2026-07-08).
          // Placement is already applied — the page is purely presentational;
          // its Done runs the promised chain (first session or home). If the
          // saved record cannot be read back, skip straight to the chain.
          historyStore
            .loadAll()
            .then((stored) => {
              setHistory(stored);
              const record = movementProfileV2ProgressProfileBySourceCheckUpId(
                stored,
                checkUp.startedAt
              );
              if (record) {
                setResultsView({
                  sourceCheckUpId: checkUp.startedAt,
                  // First-ever results stay diagnosis-shaped (2026-07-06).
                  variant:
                    validOfficialMovementProfileV2Assessments(stored).length <= 1
                      ? 'onboarding'
                      : 'standard',
                });
                setPhase('home');
                return;
              }
              proceedAfterAssessment();
            })
            .catch(() => proceedAfterAssessment());
        }}
        onCancel={() => {
          // A completed movement battery remains a local draft; otherwise
          // cancellation is penalty-free and applies nothing.
          pendingFirstSessionRef.current = false;
          assessmentContinuationStateRef.current = null;
          setPhase('home');
        }}
      />
    );
  }

  // ── Tab shell (phase 'home') ───────────────────────────────────────────
  // Flows and the ephemeral explore session take the whole screen; the two
  // tabs render underneath the shared TabBar. Level rows show the
  // post-easing levels so what the user sees is what the next session runs;
  // the easing itself persists at session start (startSessionFromHome
  // re-checks).
  const nowIso = new Date().toISOString();
  const baseTodayVm = programmeTodayViewModel(programmeState, nowIso);
  const checkUpAccess = officialCheckUpAccess(programmeState, nowIso, {
    hasDraft: checkUpDraft !== null,
  });
  const todayVm: ProgrammeTodayViewModel = checkUpDraft && checkUpAccess.allowed
    ? {
        ...baseTodayVm,
        state: 'baseline_due',
        primaryAction: {
          type: 'start_baseline_checkup',
          title: 'Finish your Movement Check-Up',
          subtitle:
            'Your movement measurements are safely saved on this device. Continue with Everyday Clarity, or skip it, to finish.',
          ctaLabel: 'Continue check-up',
          tone: 'default',
        },
        sessionDetail: 'Your Strength and Balance measurements are already saved.',
        checkupOffer: null,
      }
    : baseTodayVm;
  const journeyProgress = programmeJourneyProgressAt(programmeState.journey, nowIso);
  const acceptedClarityCheckUpIds = Object.values(programmeState.journey.checkpoints)
    .filter((checkpoint): checkpoint is NonNullable<typeof checkpoint> => checkpoint !== undefined)
    .map((checkpoint) => checkpoint.sourceCheckUpId);
  const clarityTrend = buildClarityTrendViewModel(history, {
    acceptedSourceCheckUpIds: acceptedClarityCheckUpIds,
  });
  const currentPrescription =
    programmeState.journey.currentPhase !== null
      ? programmeState.journey.phasePrescriptions[programmeState.journey.currentPhase] ?? null
      : programmeState.journey.status === 'completed'
        ? programmeState.journey.phasePrescriptions[3] ?? null
        : null;
  const easedLevels = programmeLevelRows(
    applyInactivityRegressionIfDue(programmeState, nowIso).state
  );
  const goAssessment = startOfficialCheckUp;
  const openSettings = () => setFlow('settings');

  if (resultsView && resultsViewModel) {
    return (
      <MovementProfileV2UnifiedResultsScreen
        viewModel={resultsViewModel}
        variant={resultsView.variant}
        clarityTrend={clarityTrend}
        populationComparison={{
          available: officialCheckUpCount >= 2,
          optedIn: prefs.settings.comparisonOptIn,
        }}
        onTogglePopulationComparison={() =>
          persistPrefs({
            ...prefs,
            settings: { ...prefs.settings, comparisonOptIn: !prefs.settings.comparisonOptIn },
          })
        }
        onDone={() => {
          const fresh = resultsView.variant !== 'history';
          setResultsView(null);
          if (fresh) proceedAfterAssessment();
        }}
      />
    );
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
            profile: { ...programmeState.profile, chosenDays: days },
          })
        }
        onStartingEffortChange={(level) =>
          // Read by every future check-up re-placement (activity prior).
          persist({
            ...programmeState,
            profile: { ...programmeState.profile, activityLevel: level },
          })
        }
        onOpenSafetyProfile={() => setFlow('safety-profile')}
        onOpenCameraSetup={() => setFlow('camera-setup')}
        onClearDeviceData={handleClearDeviceData}
        onDataCleared={handleDataCleared}
        onFillSampleData={handleFillSampleData}
        onResetSampleData={handleResetSampleData}
        // No pain-exclusion rows in v2 by the Pain A ruling (2026-07-07):
        // the §12 pain regression is v1's answer to exercise pain. The
        // life-goal review flow retired in the simplification pass
        // (2026-07-08): the goal is set once in onboarding and shown
        // read-only in the profile details.
        onBack={() => {
          setFlow(null);
          if (!programmeState.onboardingCompletedAtIso) setPhase('onboarding');
        }}
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
              onBeginFirstCheckUp={checkUpAccess.allowed ? goAssessment : undefined}
              onStartMovementProfileV2CheckUp={checkUpAccess.allowed ? goAssessment : undefined}
              checkUpBlockedReason={checkUpAccess.allowed ? undefined : checkUpAccess.reason}
              movementProfileV2Progress={buildMovementProfileV2ProgressViewModel({
                history,
                blocks: [],
                reports: [],
                today: nowIso,
              })}
              onViewMovementProfileV2Profile={(sourceCheckUpId) =>
                setResultsView({ sourceCheckUpId, variant: 'history' })
              }
              programmeLevels={easedLevels}
              journey={{
                progress: journeyProgress,
                physicalFocus: currentPrescription?.physicalFocus ?? null,
              }}
              clarityTrend={clarityTrend}
              onOpenSettings={openSettings}
            />
          ) : (
            <TodayScreen
              profile={prefs.profile}
              programme={{
                today: todayVm,
                onStartCheckup: todayVm.checkupOffer ? goAssessment : undefined,
              }}
              journey={{
                progress: journeyProgress,
                physicalFocus: currentPrescription?.physicalFocus ?? null,
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
