/**
 * Pearl's app shell: mounted unconditionally
 * by App.tsx inside AuthProvider. Owns store loading (auth-scoped,
 * guest-adopting), the merged onboarding flow, the session/check-up phases,
 * and the three-tab shell (Home / Plan / Progress) with the Settings flow —
 * all rendered by the SHARED app screens.
 *
 * Coupling rules: programme state stays independent from retired training state (no
 * TrainingStore/TrainingState reads — pinned by the parity review); with the
 * extra-practice catalogue gone, the shell does not touch retired preset
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
import { LOCAL_USER_ID } from '../adherence/types';
import { configureSessionAudio } from '../audio/voicePlayer';
import { Screen, ScreenScrollClearanceProvider } from '../components/ui';
import { useSystemInsets } from '../components/SystemInsetsProvider';
import { isOnlineProfilesEnabled } from '../config/onlineProfiles';
import {
  MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID,
  MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1,
  PEARL_PROGRAMME_STRENGTH_BALANCE_PROTOCOL_VARIANT,
} from '../checkup/measurementProtocolRegistry';
import type { CheckUp } from '../checkup/types';
import { adoptGuestLocalFiles, createExpoHistoryFs } from '../history/fsAdapter';
import {
  HistoryStore,
  OfficialCheckUpDraftStore,
  type OfficialCheckUpDraft,
  type StoredCheckUp,
  type StoredCheckUpType,
} from '../history';
import { materializeOfficialMovementProfileV2Artifacts } from '../reference/movementProfileV2/persistence';
import type { MovementProfileV2ReferenceProfile } from '../reference/movementProfileV2/types';
import { validOfficialMovementProfileV2Assessments } from '../pearlFlow/checkupHistory';
import { buildClarityTrendViewModel } from '../pearlFlow/clarityTrend';
import { adoptGuestSessionFunnelFiles } from '../telemetry/fsAdapter';
import {
  buildMovementProfileV2ProgressViewModel,
  movementProfileV2ProgressProfileBySourceCheckUpId,
} from '../pearlFlow/movementProfileV2ProgressViewModel';
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
  completeOnboarding,
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
  OnlineProfileSyncStore,
  ProfileStore,
  type AppSettings,
  type Preferences,
  type UserProfile,
} from '../profile';
import {
  clearLocalPearlData,
  DISABLED_ONLINE_PROFILE_STATE,
  authenticatedUserId,
  reconcileOnlineProfile,
  SIGNED_OUT_ONLINE_PROFILE_STATE,
  SYNCING_ONLINE_PROFILE_STATE,
  useAuth,
  type OnlineProfileConflictResolution,
  type OnlineProfileSyncState,
} from '../services/backend';
import {
  claimGuestAdoption,
  completeGuestAdoption,
  guestAdoptionOwner,
} from '../services/backend/guestAdoptionStore';
import type { TrainingSessionResult } from '../training/voiceSessionPlayer';
import { DEFAULT_VOICE_SETUP_PREFS, type VoiceSetupPrefs } from '../voice/voicePermissionGate';
import { CameraSetupScreen } from './CameraSetupScreen';
import { AuthScreen } from './AuthScreen';
import { MovementProfileV2UnifiedResultsScreen } from './MovementProfileV2UnifiedResultsScreen';
import { PlanScreen } from './PlanScreen';
import { ProgressScreen } from './ProgressScreen';
import { ProgrammeCheckupZeroScreen } from './ProgrammeCheckupZeroScreen';
import { ProgrammeEffortScreen, ProgrammeMomentScreen } from './ProgrammeMomentScreens';
import { ProgrammeOnboardingScreen } from './ProgrammeOnboardingScreen';
import { SettingsScreen } from './SettingsScreen';
import { TodayScreen } from './TodayScreen';
import { VoiceSessionScreen } from './VoiceSessionScreen';
import {
  programmeResultsFromVoiceSession,
  voiceSessionInputsFromPlan,
} from '../programme';
import { generateMockJourney } from '../dev/mockData';
import { assessmentStatusAfterHealthChange } from '../settings/healthAnswerPreferences';

type ShellPhase =
  | 'loading'
  | 'onboarding'
  | 'home'
  | 'session'
  | 'effort'
  | 'session_done'
  | 'assessment';

type ShellFlow = 'settings' | 'camera-setup' | null;

type CameraPermission = 'checking' | 'granted' | 'undetermined' | 'denied';

export function ProgrammeV2Root() {
  // Auth-scoped local stores, same discipline as the old shell: each backend
  // user gets a separate on-device cache so sign-out/sign-in never lets
  // another account inherit local state. Guests use the unscoped store; the
  // first sign-in on a device with guest data adopts it (move, not copy)
  // only when the account scope is still empty.
  const { isSignedIn, refreshProfile, signOut, user } = useAuth();
  const backendUserId = authenticatedUserId({ isSignedIn, user });
  const localFs = React.useMemo(() => createExpoHistoryFs({ userId: backendUserId }), [backendUserId]);
  const store = React.useMemo(() => new ProgrammeStore(localFs), [localFs]);
  const profileStore = React.useMemo(() => new ProfileStore(localFs), [localFs]);
  const onlineProfileSyncStore = React.useMemo(
    () => new OnlineProfileSyncStore(localFs),
    [localFs]
  );
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
  const [onlineProfileSyncState, setOnlineProfileSyncState] =
    React.useState<OnlineProfileSyncState>(SIGNED_OUT_ONLINE_PROFILE_STATE);
  const onlineProfileSyncSequenceRef = React.useRef<Promise<void>>(Promise.resolve());
  const onlineProfileSyncRevisionRef = React.useRef(0);
  const onlineProfileSyncLifecycleRef = React.useRef(0);
  const onlineProfileSyncUserRef = React.useRef<string | null>(backendUserId);
  if (onlineProfileSyncUserRef.current !== backendUserId) {
    onlineProfileSyncUserRef.current = backendUserId;
    onlineProfileSyncLifecycleRef.current += 1;
    onlineProfileSyncRevisionRef.current += 1;
  }
  const [flowState, setFlowState] = React.useState(initialOnboardingFlowState());
  const [plan, setPlan] = React.useState<ProgrammeSessionPlan | null>(null);
  const [sessionResult, setSessionResult] = React.useState<TrainingSessionResult | null>(null);
  const [lastDecisions, setLastDecisions] = React.useState<
    Partial<Record<ProgrammePattern, PromotionDecision>>
  >({});
  const [physioSignpostVisible, setPhysioSignpostVisible] = React.useState(false);
  const [cameraPermission, setCameraPermission] = React.useState<CameraPermission>('checking');
  const [onboardingAuthVisible, setOnboardingAuthVisible] = React.useState(false);
  const sessionStartRef = React.useRef<{ startedAtIso: string; wasFirstSession: boolean } | null>(null);
  // The expectation CTA's promise when Check-up #0 runs first: completing the
  // check-up chains into the first session (abandoning it lands home — the
  // home CTA remains the unsurprising way in).
  const pendingFirstSessionRef = React.useRef(false);
  const assessmentContinuationStateRef = React.useRef<ProgrammeState | null>(null);

  const queueOnlineProfileSync = React.useCallback(
    (
      localPreferences: Preferences,
      resolution: OnlineProfileConflictResolution = 'automatic'
    ) => {
      if (!backendUserId) {
        setOnlineProfileSyncState(SIGNED_OUT_ONLINE_PROFILE_STATE);
        return;
      }
      if (!isOnlineProfilesEnabled()) {
        setOnlineProfileSyncState(DISABLED_ONLINE_PROFILE_STATE);
        return;
      }

      const revision = ++onlineProfileSyncRevisionRef.current;
      const lifecycle = onlineProfileSyncLifecycleRef.current;
      const expectedUserId = backendUserId;
      const shouldContinue = () =>
        revision === onlineProfileSyncRevisionRef.current &&
        lifecycle === onlineProfileSyncLifecycleRef.current &&
        expectedUserId === onlineProfileSyncUserRef.current;
      setOnlineProfileSyncState((current) => ({
        ...SYNCING_ONLINE_PROFILE_STATE,
        lastSyncedAt: current.lastSyncedAt,
      }));
      onlineProfileSyncSequenceRef.current = onlineProfileSyncSequenceRef.current
        .catch(() => {})
        .then(async () => {
          const result = await reconcileOnlineProfile({
            localPreferences,
            metadataStore: onlineProfileSyncStore,
            resolution,
            shouldContinue,
          });
          if (revision !== onlineProfileSyncRevisionRef.current || !shouldContinue()) return;

          try {
            if (result.preferences) {
              profileStore.save(result.preferences);
              if (!shouldContinue()) return;
              setPrefs(result.preferences);
            }
            if (!shouldContinue()) return;
            result.finalize?.();
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn('[online-profile] local hydration commit failed', error);
            setOnlineProfileSyncState({
              status: 'failed',
              lastSyncedAt: null,
              error: message,
            });
            return;
          }
          setOnlineProfileSyncState({
            status: result.status,
            lastSyncedAt: result.lastSyncedAt,
            error: result.error,
          });
          if (result.status === 'synced') void refreshProfile();
        });
    },
    [backendUserId, onlineProfileSyncStore, profileStore, refreshProfile]
  );

  React.useEffect(
    () => () => {
      onlineProfileSyncLifecycleRef.current += 1;
      onlineProfileSyncRevisionRef.current += 1;
    },
    []
  );

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let [loaded, loadedPrefs, storedHistory, storedDraft] = await Promise.all([
        store.load(),
        profileStore.load(),
        historyStore.loadAll(),
        checkUpDraftStore.load(),
      ]);
      if (backendUserId) {
        let adoptionClaimed = false;
        try {
          const accountScopeAppearsEmpty =
            createExpoHistoryFs({ userId: backendUserId, strictErrors: true }).list().length === 0;
          const existingOwner = await guestAdoptionOwner();
          if (existingOwner === backendUserId || (!existingOwner && accountScopeAppearsEmpty)) {
            adoptionClaimed = await claimGuestAdoption(backendUserId);
          }
        } catch (error) {
          console.warn('[programme-v2] guest adoption claim failed', error);
        }

        if (adoptionClaimed) {
          const moves = await Promise.allSettled([
            adoptGuestLocalFiles(backendUserId),
            adoptGuestSessionFunnelFiles(backendUserId),
          ]);
          const failedMoves = moves.filter((result) => result.status === 'rejected').length;
          if (failedMoves === 0) {
            try {
              await completeGuestAdoption(backendUserId);
            } catch (error) {
              console.warn('[programme-v2] guest adoption completion marker failed', error);
            }
          } else {
            console.warn(`[programme-v2] guest adoption had ${failedMoves} failed move(s)`);
          }

          // Always reload after a claimed attempt, including partial failure:
          // moved preferences/health/programme files are authoritative and
          // must be used before any online-profile reconciliation starts.
          [loaded, loadedPrefs, storedHistory, storedDraft] = await Promise.all([
            store.load(),
            profileStore.load(),
            historyStore.loadAll(),
            checkUpDraftStore.load(),
          ]);
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
      if (backendUserId) {
        queueOnlineProfileSync(loadedPrefs);
      } else {
        setOnlineProfileSyncState(SIGNED_OUT_ONLINE_PROFILE_STATE);
      }
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
  }, [
    store,
    profileStore,
    historyStore,
    checkUpDraftStore,
    backendUserId,
    queueOnlineProfileSync,
  ]);

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
                PEARL_PROGRAMME_STRENGTH_BALANCE_PROTOCOL_VARIANT)
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
  // path. The low-frequency comparison preference stays in Settings; when it
  // is enabled, the result copy includes eligible published-value context.
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
      queueOnlineProfileSync(next);
    },
    [profileStore, queueOnlineProfileSync]
  );

  const finishOnboarding = React.useCallback(
    async (
      action: 'start_first_session' | 'schedule',
      completedFlowState: typeof flowState = flowState
    ) => {
      const completion = completeOnboarding(completedFlowState);
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
      const gatewaySurface = postSessionSurface(stateWithJourney, applied.decisions);
      persist(stateWithJourney);
      setLastDecisions(gatewaySurface ? applied.decisions : {});
      sessionStartRef.current = null;
      setSessionResult(null);
      setPlan(null);
      setPhase(gatewaySurface ? 'session_done' : 'home');
    },
    [programmeState, plan, persist]
  );

  const handleClearDeviceData = React.useCallback(async () => {
    // Cancel every queued/in-flight reconciliation before deletion. The
    // coordinator checks this generation before any device write, so a late
    // network response cannot recreate preferences or sync metadata.
    onlineProfileSyncLifecycleRef.current += 1;
    onlineProfileSyncRevisionRef.current += 1;
    // Let the deletion service construct its strict adapter; the ordinary
    // store adapter is deliberately best-effort and must not be used to
    // certify that destructive deletion succeeded.
    const result = await clearLocalPearlData({ userId: backendUserId });
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
    setOnlineProfileSyncState(SIGNED_OUT_ONLINE_PROFILE_STATE);
    if (backendUserId) await signOut();
  }, [backendUserId, profileStore, signOut]);

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

  if (phase === 'onboarding' && onboardingAuthVisible && !isSignedIn) {
    return <AuthScreen onContinueWithoutAccount={() => setOnboardingAuthVisible(false)} />;
  }

  if (phase === 'onboarding') {
    return (
      <ProgrammeOnboardingScreen
        flowState={flowState}
        onSelectOption={(step, value) =>
          setFlowState((current) =>
            recordOnboardingAnswer(current, { step, value } as OnboardingAnswerValue)
          )
        }
        onSelectMany={(step, values) =>
          setFlowState((current) =>
            recordOnboardingAnswer(current, {
              step,
              value: step === 'b3_joints' ? values.filter((v) => v !== 'none') : values,
            } as OnboardingAnswerValue)
          )
        }
        onSkipQuestion={(step: OnboardingQuestionStepId) =>
          setFlowState((current) =>
            recordOnboardingAnswer(current, {
              step,
              value: SKIPPED,
            } as OnboardingAnswerValue)
          )
        }
        onAcknowledge={(step) => {
          const next = acknowledgeOnboardingStep(flowState, step);
          setFlowState(next);
        }}
        onComplete={({ assessmentChoice, action }) => {
          const next = recordOnboardingAnswer(flowState, {
            step: 'assessment_offer',
            value: assessmentChoice,
          });
          setFlowState(next);
          void finishOnboarding(action, next);
        }}
        onBack={() => setFlowState((current) => undoLastOnboardingStep(current))}
        onSignIn={
          isOnlineProfilesEnabled() && !isSignedIn
            ? () => setOnboardingAuthVisible(true)
            : undefined
        }
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
        userId={backendUserId}
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
    // Routine completion returns Home from the effort answer. Only a technique
    // gateway may interrupt that path because it gates safe progression.
    const surface = postSessionSurface(programmeState, lastDecisions);
    if (!surface) return null;
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
                  onPress: () => {
                    persist({
                      ...programmeState,
                      ladders: {
                        ...programmeState.ladders,
                        [surface.pattern]: recordGatewaySelfConfirmation(ladder, surface.toLevel),
                      },
                    });
                    setLastDecisions({});
                    setPhase('home');
                  },
                },
              ]
            : []),
          {
            label: surface.laterLabel,
            variant: 'ghost' as const,
            onPress: () => {
              setLastDecisions({});
              setPhase('home');
            },
          },
        ]}
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
    // official history and advance the 12-week journey. Programme checkpoints refresh
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
  // Full-screen flows sit above the three-tab shell. Home owns the next
  // action, Plan owns programme structure, and Progress owns measurement.
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
  const goAssessment = startOfficialCheckUp;
  const openSettings = () => setFlow('settings');

  if (resultsView && resultsViewModel) {
    return (
      <MovementProfileV2UnifiedResultsScreen
        viewModel={resultsViewModel}
        variant={resultsView.variant}
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
        startingEffort={onboardingActivityLevel(programmeState.profile.activityLevel)}
        safetyPreferences={{
          balanceSupportDefault: programmeState.profile.balanceSupportDefault,
          balanceSupportRequired: programmeState.profile.balanceSupportRequired,
          lowImpact: programmeState.profile.pelvicRouting === 'low_impact',
          quietMode: programmeState.profile.quietMode,
          hasStairs: programmeState.profile.hasStairs,
          consentHealthData: programmeState.profile.consentHealthData,
          gentleStartActive: programmeState.profile.gentleStartActive,
          gpConfirmed: programmeState.profile.gpConfirmed,
          jointFlags: programmeState.profile.jointFlags,
        }}
        onProfileChange={(next: UserProfile) => persistPrefs({ ...prefs, profile: next })}
        onSettingsChange={(next: AppSettings) => persistPrefs({ ...prefs, settings: next })}
        onStartingEffortChange={(level) =>
          // Read by every future check-up re-placement (activity prior).
          persist({
            ...programmeState,
            profile: { ...programmeState.profile, activityLevel: level },
          })
        }
        onSafetyPreferencesChange={(next) =>
          persist({
            ...programmeState,
            profile: {
              ...programmeState.profile,
              balanceSupportDefault: next.balanceSupportDefault,
              balanceSupportRequired: next.balanceSupportRequired,
              pelvicRouting: next.lowImpact ? 'low_impact' : 'none',
              quietMode: next.quietMode,
              hasStairs: next.hasStairs,
              consentHealthData: next.consentHealthData,
              gentleStartActive: next.gentleStartActive,
              gpConfirmed: next.gpConfirmed,
              jointFlags: next.jointFlags,
              assessmentStatus: assessmentStatusAfterHealthChange(
                programmeState.profile.assessmentStatus,
                next
              ),
            },
          })
        }
        onOpenCameraSetup={() => setFlow('camera-setup')}
        cameraPermission={cameraPermission}
        onRequestCameraPermission={requestCameraPermission}
        onClearDeviceData={handleClearDeviceData}
        onDataCleared={handleDataCleared}
        onlineProfileSyncState={onlineProfileSyncState}
        onRetryOnlineProfileSync={() => queueOnlineProfileSync(prefs)}
        onResolveOnlineProfileConflict={(resolution) =>
          queueOnlineProfileSync(prefs, resolution)
        }
        onFillSampleData={handleFillSampleData}
        onResetSampleData={handleResetSampleData}
        // No pain-exclusion rows in v2 by the Pain A ruling (2026-07-07):
        // the §12 pain regression is v1's answer to exercise pain. The goal
        // remains a small Settings preference: changing it affects future
        // emphasis and never rewrites frozen check-up artifacts.
        onBack={() => {
          setFlow(null);
          if (!programmeState.onboardingCompletedAtIso) setPhase('onboarding');
        }}
      />
    );
  }

  if (flow === 'camera-setup') {
    return (
      <CameraSetupScreen
        permissionGranted={cameraPermission === 'granted'}
        onRequestPermission={requestCameraPermission}
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
              onStartCheckUp={checkUpAccess.allowed ? goAssessment : undefined}
              checkUpBlockedReason={checkUpAccess.allowed ? undefined : checkUpAccess.reason}
              movementProfileV2Progress={buildMovementProfileV2ProgressViewModel({
                history,
              })}
              onViewMovementProfileV2Profile={(sourceCheckUpId) =>
                setResultsView({ sourceCheckUpId, variant: 'history' })
              }
              clarityTrend={clarityTrend}
              onOpenSettings={openSettings}
            />
          ) : tab === 'plan' ? (
            <PlanScreen
              today={todayVm}
              journey={{
                progress: journeyProgress,
                physicalFocus: currentPrescription?.physicalFocus ?? null,
              }}
              checkUpBlockedReason={checkUpAccess.allowed ? undefined : checkUpAccess.reason}
              checkUpDraftInProgress={checkUpDraft !== null && checkUpAccess.allowed}
              onOpenSettings={openSettings}
              onStartNextSession={startSessionFromHome}
            />
          ) : (
            <TodayScreen
              profile={prefs.profile}
              programme={{
                today: todayVm,
                journey: {
                  status: journeyProgress.status,
                  physicalFocus: currentPrescription?.physicalFocus ?? null,
                  currentWeekSummary: journeyProgress.currentWeekSummary,
                  checkUpDraftInProgress: checkUpDraft !== null && checkUpAccess.allowed,
                },
              }}
              onPrimaryAction={() =>
                todayVm.primaryAction.type === 'start_baseline_checkup'
                  ? goAssessment()
                  : startSessionFromHome()
              }
              onOpenSettings={openSettings}
            />
          )}
        </View>
      </ScreenScrollClearanceProvider>
      <TabBar active={tab} onChange={setTab} bottomInset={systemInsets.bottom} />
    </View>
  );
}

function ProgrammeVoiceSession({
  plan,
  voiceId,
  userId,
  firstSessionStarted,
  voiceSetup,
  onVoiceSetupChange,
  onStart,
  onComplete,
  onCancel,
}: {
  plan: ProgrammeSessionPlan;
  voiceId?: string;
  userId?: string | null;
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
      userId={userId}
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
