import { Fraunces_400Regular, Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { requestCameraPermissionsAsync } from './modules/expo-pose-detection';
import {
  AdherenceStore,
  AdherenceStoreState,
  AvailableEquipment,
  BlockIntroScreen,
  BlockReportScreen,
  CheckupType,
  LifeGoal,
  LifeGoalOnboardingScreen,
  MovementAssessment,
  MovementBlock,
  MovementSafetyProfile,
  RestartSessionScreen,
  SupportConnection,
  SessionCompletionScreen,
  TrainingSessionCompletion,
  TrainingSessionCompletionType,
  WeeklySummaryScreen,
  createMovementBlockFromAssessment,
  defaultAdherenceStoreState,
  generateMilestones,
  getActiveMovementBlock,
  getAdherenceState,
  getLatestMovementBlock,
  getLifeGoalDisplayText,
  latestMilestone,
  makeTrainingSessionCompletion,
  markMovementBlockComplete,
  mergeMilestones,
  recordTrainingSessionCompletion,
  upsertMovementAssessment,
  upsertMovementBlockReport,
  upsertMovementBlock,
} from './src/adherence';
import { configureSessionAudio } from './src/audio/voicePlayer';
import { CheckUp } from './src/checkup';
import { syntheticCheckUp } from './src/checkup/devFixture';
import {
  createMovementAssessment,
  createMovementBlockReport,
  createGeneratedSessionSummary,
  countsTowardMainPlan,
  getHaleAppLifecycle,
  getMicroCheckForBlock,
  latestOfficialAssessment,
  planLadderPracticeSession,
  planTodayHaleSession,
  updateExerciseProgressionFromSession,
  type HaleSessionPlan,
  type PlanSessionId,
  type TodaySessionPreferences,
} from './src/haleFlow';
import { HistoryStore, StoredCheckUp } from './src/history';
import { expoHistoryFs } from './src/history/fsAdapter';
import { TabBar, TabKey } from './src/navigation/TabBar';
import { deriveOnboardingStep } from './src/onboarding/state';
import {
  AppSettings,
  OnboardingStep,
  Preferences,
  ProfileStore,
  UserProfile,
  defaultPreferences,
} from './src/profile';
import { CheckUpScore, scoreCheckUp } from './src/scoring';
import {
  AuthProvider,
  syncLocalPreferencesToRemote,
  useAuth,
} from './src/services/backend';
import { AssessmentScreen } from './src/screens/AssessmentScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { CameraExplanationScreen } from './src/screens/CameraExplanationScreen';
import { CameraSetupScreen } from './src/screens/CameraSetupScreen';
import { CheckUpScreen } from './src/screens/CheckUpScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { LadderDetailScreen, LearnDetailScreen } from './src/screens/ExploreDetailScreens';
import { LiveSessionScreen } from './src/screens/LiveSessionScreen';
import { ManualCheckupStartScreen } from './src/screens/ManualCheckupStartScreen';
import { MicroCheckScreen } from './src/screens/MicroCheckScreen';
import { OnboardingBlockScreen } from './src/screens/OnboardingBlockScreen';
import { OnboardingEquipmentScreen } from './src/screens/OnboardingEquipmentScreen';
import { OnboardingResultsScreen } from './src/screens/OnboardingResultsScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { SafetyProfileScreen } from './src/screens/SafetyProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SessionPreviewScreen } from './src/screens/SessionPreviewScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { TrainingSessionScreen } from './src/screens/TrainingSessionScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import {
  EquipmentProfile,
  MicroCheckResult,
  PainArea,
  PersistedPostSessionFeedback,
  TrainingIntensityPreference,
  TrainingState,
  TrainingStore,
  TrainingSessionResult,
  TrackingQuality,
  buildBlock,
  defaultTrainingState,
  microCheckTrendPoints,
  recordCompletedSession,
  retestDue,
  startBlock,
  upsertGeneratedSessionSummary,
  validTimeSessionSummaryCards,
  type SessionIntensity,
} from './src/training';
import { colors, radius, spacing, type } from './src/theme';

type PermissionState = 'checking' | 'granted' | 'denied';
/** Full-screen flows launched on top of the tab shell (hands-free sessions + dev tools). */
type Flow =
  | 'welcome'
  | 'equipment'
  | 'camera-explanation'
  | 'safety-profile'
  | 'camera-setup'
  | 'manual-checkup'
  | 'checkup'
  | 'results'
  | 'session-preview'
  | 'training'
  | 'microcheck'
  | 'life-goal'
  | 'onboarding-block'
  | 'block-intro'
  | 'restart-intro'
  | 'weekly-summary'
  | 'block-report'
  | 'session-complete'
  | 'settings'
  | 'ladder-detail'
  | 'learn-detail'
  | 'dev-assessment'
  | 'dev-live';

/** Flows that mount the camera; gated on permission + audio configuration. */
const CAMERA_FLOWS = new Set<Flow>(['checkup', 'training', 'microcheck', 'dev-assessment', 'dev-live']);

function flowForOnboardingStep(step: OnboardingStep): Flow | null {
  switch (step) {
    case 'welcome':
      return 'welcome';
    case 'life_goal':
      return 'life-goal';
    case 'safety_profile':
      return 'safety-profile';
    case 'equipment':
      return 'equipment';
    case 'camera_explanation':
      return 'camera-explanation';
    case 'camera_setup':
    case 'baseline_checkup':
      return 'camera-setup';
    case 'results':
    case 'create_block':
      return 'results';
    case 'complete':
      return null;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

function AppGate() {
  // Fonts are bundled (no runtime fetch); gate the first paint until they load
  // so headings never flash in a fallback face.
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Inter_400Regular,
    Inter_500Medium,
  });
  const auth = useAuth();

  if (!fontsLoaded || auth.loading) {
    return <AuthLoadingScreen />;
  }

  if (!auth.isSignedIn) {
    return <AuthScreen />;
  }

  return <HaleApp />;
}

function HaleApp() {
  const { isSignedIn: backendSignedIn } = useAuth();
  const [permission, setPermission] = React.useState<PermissionState>('checking');
  // Audio mode must be configured BEFORE the camera mounts — audio session
  // changes must never interrupt a running camera session.
  const [audioReady, setAudioReady] = React.useState(false);

  // Navigation: which bottom tab is showing, and whether a full-screen flow is
  // on top of it (a flow hides the tab bar; null means "show the tabs").
  const [tab, setTab] = React.useState<TabKey>('today');
  const [flow, setFlow] = React.useState<Flow | null>(null);

  // Local-only stores (no accounts/backend in V1), loaded once on launch.
  const [store] = React.useState(() => new HistoryStore(expoHistoryFs));
  const [trainingStore] = React.useState(() => new TrainingStore(expoHistoryFs));
  const [profileStore] = React.useState(() => new ProfileStore(expoHistoryFs));
  const [adherenceStore] = React.useState(() => new AdherenceStore(expoHistoryFs));
  const [history, setHistory] = React.useState<StoredCheckUp[]>([]);
  const [lastResult, setLastResult] = React.useState<CheckUp | null>(null);
  const [training, setTraining] = React.useState<TrainingState>(() => defaultTrainingState());
  const [adherence, setAdherence] = React.useState<AdherenceStoreState>(() => defaultAdherenceStoreState());
  const [microChecks, setMicroChecks] = React.useState<MicroCheckResult[]>([]);
  const [prefs, setPrefs] = React.useState<Preferences>(() => defaultPreferences());
  const [historyReady, setHistoryReady] = React.useState(false);
  const [profileReady, setProfileReady] = React.useState(false);
  const [adherenceReady, setAdherenceReady] = React.useState(false);
  const [pendingCheckup, setPendingCheckup] = React.useState<{
    type: CheckupType;
    sourceBlockId?: string;
    isOfficialForProgress?: boolean;
  } | null>(null);
  // The exercise ids of the session about to run (resolved at launch).
  const [sessionIds, setSessionIds] = React.useState<string[]>([]);
  const [sessionType, setSessionType] = React.useState<TrainingSessionCompletionType>('standard');
  const [activeSessionPlan, setActiveSessionPlan] = React.useState<HaleSessionPlan | null>(null);
  const [lastCompletion, setLastCompletion] = React.useState<TrainingSessionCompletion | null>(null);
  const [lastSessionResult, setLastSessionResult] = React.useState<TrainingSessionResult | null>(null);
  const [reportBlock, setReportBlock] = React.useState<MovementBlock | null>(null);
  const [selectedLadderId, setSelectedLadderId] = React.useState<string | null>(null);
  const [selectedLearnId, setSelectedLearnId] = React.useState<string | null>(null);
  const profileSyncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProfileSyncFingerprintRef = React.useRef<string | null>(null);
  const remoteProfileHydrationAttemptedRef = React.useRef(false);

  React.useEffect(() => {
    requestCameraPermissionsAsync()
      .then((response) => setPermission(response.granted ? 'granted' : 'denied'))
      .catch(() => setPermission('denied'));
    configureSessionAudio()
      .catch((e) => console.warn('[audio] mode configuration failed', e))
      .finally(() => setAudioReady(true));
    store.loadAll().then(setHistory).catch(() => setHistory([])).finally(() => setHistoryReady(true));
    trainingStore.loadState().then(setTraining).catch(() => {});
    trainingStore.loadMicroChecks().then(setMicroChecks).catch(() => {});
    profileStore.load().then(setPrefs).catch(() => {}).finally(() => setProfileReady(true));
    adherenceStore.load().then(setAdherence).catch(() => {}).finally(() => setAdherenceReady(true));
  }, [store, trainingStore, profileStore, adherenceStore]);

  React.useEffect(() => {
    if (backendSignedIn) {
      remoteProfileHydrationAttemptedRef.current = false;
    } else {
      lastProfileSyncFingerprintRef.current = null;
    }
  }, [backendSignedIn]);

  React.useEffect(() => {
    return () => {
      if (profileSyncTimerRef.current) {
        clearTimeout(profileSyncTimerRef.current);
      }
    };
  }, []);

  const goHome = React.useCallback(() => {
    setFlow(null);
    setTab('today');
    setSessionIds([]);
    setActiveSessionPlan(null);
    setLastSessionResult(null);
    setReportBlock(null);
    setSelectedLadderId(null);
    setSelectedLearnId(null);
  }, []);

  const goExplore = React.useCallback(() => {
    setFlow(null);
    setTab('explore');
    setSelectedLadderId(null);
    setSelectedLearnId(null);
  }, []);

  const persistTraining = React.useCallback(
    (next: TrainingState) => {
      setTraining(next);
      try {
        trainingStore.saveState(next);
      } catch (e) {
        console.warn('[training] save failed', e);
      }
    },
    [trainingStore]
  );

  const persistPrefs = React.useCallback(
    (next: Preferences) => {
      setPrefs(next);
      try {
        profileStore.save(next);
      } catch (e) {
        console.warn('[profile] save failed', e);
      }
    },
    [profileStore]
  );

  const queueProfileSync = React.useCallback(
    (nextPrefs: Preferences, options: { hydrateLocalFromRemote?: boolean } = {}) => {
      const fingerprint = JSON.stringify(nextPrefs);
      if (!options.hydrateLocalFromRemote && lastProfileSyncFingerprintRef.current === fingerprint) {
        return;
      }
      if (profileSyncTimerRef.current) {
        clearTimeout(profileSyncTimerRef.current);
      }

      profileSyncTimerRef.current = setTimeout(() => {
        void syncLocalPreferencesToRemote(nextPrefs, {
          hydrateLocalFromRemote: options.hydrateLocalFromRemote,
          hydrateRoutingFields: false,
        }).then((result) => {
          if (result.status === 'signed_out' || result.status === 'failed') return;

          if (result.status === 'hydrated' && result.preferences) {
            const hydratedFingerprint = JSON.stringify(result.preferences);
            lastProfileSyncFingerprintRef.current = hydratedFingerprint;
            setPrefs(result.preferences);
            try {
              profileStore.save(result.preferences);
            } catch (e) {
              console.warn('[profile] save failed after remote hydration', e);
            }
            return;
          }

          lastProfileSyncFingerprintRef.current = fingerprint;
        });
      }, 750);
    },
    [profileStore]
  );

  React.useEffect(() => {
    if (!profileReady || !backendSignedIn) return;
    const hydrateLocalFromRemote = !remoteProfileHydrationAttemptedRef.current;
    remoteProfileHydrationAttemptedRef.current = true;
    queueProfileSync(prefs, { hydrateLocalFromRemote });
  }, [backendSignedIn, prefs, profileReady, queueProfileSync]);

  const persistAdherence = React.useCallback(
    (next: AdherenceStoreState) => {
      setAdherence(next);
      try {
        adherenceStore.save(next);
      } catch (e) {
        console.warn('[adherence] save failed', e);
      }
    },
    [adherenceStore]
  );

  const activeMovementBlock = React.useMemo(() => getActiveMovementBlock(adherence.blocks), [adherence.blocks]);
  const displayMovementBlock = React.useMemo(
    () => activeMovementBlock ?? getLatestMovementBlock(adherence.blocks),
    [activeMovementBlock, adherence.blocks]
  );
  const onboardingStep = React.useMemo(
    () => deriveOnboardingStep({ prefs, history, activeBlock: activeMovementBlock }),
    [activeMovementBlock, history, prefs]
  );
  const onboardingIncomplete = onboardingStep !== 'complete';
  const latestStoredCheckUp = history.length > 0 ? history[history.length - 1].checkUp : null;
  const visibleResult = lastResult ?? latestStoredCheckUp;
  const showOnboardingResult =
    onboardingIncomplete && (prefs.onboarding.currentStep === 'results' || prefs.onboarding.currentStep === 'create_block');

  React.useEffect(() => {
    if (!historyReady || !profileReady || !adherenceReady || flow !== null) return;
    const nextFlow = flowForOnboardingStep(onboardingStep);
    if (nextFlow) setFlow(nextFlow);
  }, [adherenceReady, flow, historyReady, onboardingStep, profileReady]);

  const onProfileChange = React.useCallback(
    (profile: UserProfile) => persistPrefs({ ...prefs, profile }),
    [prefs, persistPrefs]
  );
  const onSettingsChange = React.useCallback(
    (settings: AppSettings) => persistPrefs({ ...prefs, settings }),
    [prefs, persistPrefs]
  );

  const onLifeGoalSave = React.useCallback(
    (lifeGoal: LifeGoal) => {
      const now = new Date().toISOString();
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          lifeGoal,
          goal: getLifeGoalDisplayText(lifeGoal),
        },
        onboarding: onboardingIncomplete
          ? { ...prefs.onboarding, currentStep: 'safety_profile', updatedAt: now }
          : prefs.onboarding,
      });
      if (onboardingIncomplete) {
        setFlow('safety-profile');
      } else {
        goHome();
      }
    },
    [goHome, onboardingIncomplete, persistPrefs, prefs]
  );

  const onSafetyProfileSave = React.useCallback(
    (safetyProfile: MovementSafetyProfile, age: number | null) => {
      const now = new Date().toISOString();
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          age,
          safetyProfile,
        },
        onboarding: onboardingIncomplete
          ? { ...prefs.onboarding, currentStep: 'equipment', updatedAt: now }
          : prefs.onboarding,
      });
      persistTraining({
        ...training,
        equipment: {
          stair: safetyProfile.availableEquipment.includes('stairs'),
          band: safetyProfile.availableEquipment.includes('resistance_band'),
          miniBand: training.equipment.miniBand,
          load: training.equipment.load,
        },
      });
      if (onboardingIncomplete) {
        setFlow('equipment');
      } else {
        goHome();
      }
    },
    [goHome, onboardingIncomplete, persistPrefs, persistTraining, prefs, training]
  );

  const handleEquipmentSave = React.useCallback(
    (input: { selectedEquipment: string[]; availableEquipment: AvailableEquipment[]; equipment: EquipmentProfile }) => {
      const now = new Date().toISOString();
      const existingSafetyProfile = prefs.profile.safetyProfile;
      persistPrefs({
        ...prefs,
        profile: existingSafetyProfile
          ? {
              ...prefs.profile,
              safetyProfile: {
                ...existingSafetyProfile,
                availableEquipment: input.availableEquipment,
                updatedAt: now,
              },
            }
          : prefs.profile,
        settings: {
          ...prefs.settings,
          phoneStandAvailable: input.selectedEquipment.includes('phone_stand'),
        },
        onboarding: {
          ...prefs.onboarding,
          currentStep: 'camera_explanation',
          selectedEquipment: input.selectedEquipment,
          updatedAt: now,
        },
      });
      persistTraining({ ...training, equipment: input.equipment });
      setFlow('camera-explanation');
    },
    [persistPrefs, persistTraining, prefs, training]
  );

  const handleCameraExplanationContinue = React.useCallback(() => {
    const now = new Date().toISOString();
    persistPrefs({
      ...prefs,
      onboarding: { ...prefs.onboarding, currentStep: 'camera_setup', updatedAt: now },
    });
    setFlow('camera-setup');
  }, [persistPrefs, prefs]);

  const handleWelcomeStart = React.useCallback(() => {
    if (onboardingIncomplete) {
      const now = new Date().toISOString();
      persistPrefs({
        ...prefs,
        onboarding: { ...prefs.onboarding, currentStep: 'life_goal', updatedAt: now },
      });
    }
    setFlow('life-goal');
  }, [onboardingIncomplete, persistPrefs, prefs]);

  const supportConnection = React.useMemo(
    () => adherence.supportConnections.find((c) => c.status !== 'removed') ?? null,
    [adherence.supportConnections]
  );
  const newestMilestone = React.useMemo(() => latestMilestone(adherence), [adherence]);
  // Scored most-recent check-up, for Home's progress snapshot and adherence milestones.
  const lastScore: CheckUpScore | null = React.useMemo(() => {
    const latest = history[history.length - 1];
    return latest ? scoreCheckUp(latest.checkUp) : null;
  }, [history]);

  const latestAssessment: MovementAssessment | null = React.useMemo(() => {
    const official = latestOfficialAssessment(adherence.assessments);
    if (official) return official;
    if (adherence.assessments.length > 0) {
      return adherence.assessments
        .slice()
        .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))[0];
    }
    const latest = history[history.length - 1];
    if (!latest) return null;
    return createMovementAssessment({
      checkUpId: latest.checkUp.startedAt,
      type: 'baseline',
      score: scoreCheckUp(latest.checkUp),
      completedAt: latest.checkUp.startedAt,
      isOfficialForProgress: true,
    });
  }, [adherence.assessments, history]);

  const lifecycle = React.useMemo(
    () =>
      getHaleAppLifecycle({
        profile: prefs.profile,
        history,
        training,
        adherence,
        today: new Date().toISOString(),
      }),
    [adherence, history, prefs.profile, training]
  );

  const requestCameraPermission = React.useCallback(() => {
    requestCameraPermissionsAsync()
      .then((response) => setPermission(response.granted ? 'granted' : 'denied'))
      .catch(() => setPermission('denied'));
  }, []);

  const beginCheckUp = React.useCallback(
    (type?: CheckupType) => {
      const resolvedType = type ?? (latestAssessment ? 'manual_extra' : 'baseline');
      setPendingCheckup({
        type: resolvedType,
        sourceBlockId:
          resolvedType === 'official_retest' || resolvedType === 'quick_recheck'
            ? activeMovementBlock?.id
            : undefined,
        isOfficialForProgress:
          resolvedType === 'baseline' || resolvedType === 'baseline_retake' || resolvedType === 'official_retest',
      });
      setFlow('checkup');
    },
    [activeMovementBlock, latestAssessment]
  );

  const beginOnboardingCheckUp = React.useCallback(() => {
    const now = new Date().toISOString();
    persistPrefs({
      ...prefs,
      onboarding: { ...prefs.onboarding, currentStep: 'baseline_checkup', updatedAt: now },
    });
    beginCheckUp('baseline');
  }, [beginCheckUp, persistPrefs, prefs]);

  // A finished check-up: persist it, show it, reload history (feeds trends).
  const handleCheckUpComplete = React.useCallback(
    (checkUp: CheckUp, checkupOverride?: typeof pendingCheckup) => {
      const completedAt = new Date().toISOString();
      const block = activeMovementBlock;
      const score = scoreCheckUp(checkUp);
      const resolvedPendingCheckup = checkupOverride ?? pendingCheckup;
      const checkupType =
        resolvedPendingCheckup?.type ??
        (block && (retestDue(training) || getAdherenceState(block, adherence.completions, completedAt) === 'ready_for_retest')
          ? 'official_retest'
          : history.length === 0
            ? 'baseline'
            : 'manual_extra');
      const isRetest =
        !!block &&
        (checkupType === 'official_retest' ||
          retestDue(training) ||
          getAdherenceState(block, adherence.completions, completedAt) === 'ready_for_retest');
      const assessment = createMovementAssessment({
        checkUpId: checkUp.startedAt,
        type: checkupType,
        score,
        sourceBlockId: resolvedPendingCheckup?.sourceBlockId ?? (isRetest ? block?.id : undefined),
        completedAt,
        isOfficialForProgress: resolvedPendingCheckup?.isOfficialForProgress,
      });
      try {
        store.save(checkUp);
      } catch (e) {
        console.warn('[history] save failed', e);
      }
      setLastResult(checkUp);
      store.loadAll().then(setHistory).catch(() => {});
      let nextAdherence = upsertMovementAssessment(adherence, assessment);
      if (isRetest && block) {
        const completion = makeTrainingSessionCompletion({ block, sessionType: 'retest', completedAt, plannedDate: 'retest' });
        nextAdherence = recordTrainingSessionCompletion(nextAdherence, completion);
        nextAdherence = markMovementBlockComplete(nextAdherence, block.id, completedAt);
        const updatedBlock = nextAdherence.blocks.find((b) => b.id === block.id) ?? block;
        const previous = history.find((h) => h.checkUp.startedAt === block.sourceAssessmentId);
        const previousScore = previous ? scoreCheckUp(previous.checkUp) : null;
        nextAdherence = mergeMilestones(
          nextAdherence,
          generateMilestones({
            user: prefs.profile,
            block: updatedBlock,
            lifeGoal: prefs.profile.lifeGoal,
            latestAssessment: score,
            previousAssessment: previousScore,
            completions: nextAdherence.completions,
            existing: nextAdherence.milestones,
            nowIso: completedAt,
          })
        );
        nextAdherence = upsertMovementBlockReport(
          nextAdherence,
          createMovementBlockReport({
            block: updatedBlock,
            baselineAssessment: nextAdherence.assessments.find((a) => a.id === block.sourceAssessmentId) ?? null,
            retestAssessment: assessment,
            previousScore,
            latestScore: score,
            completions: nextAdherence.completions,
            nowIso: completedAt,
          })
        );
        const nextTrainingBlock = buildBlock(score, training.equipment, completedAt);
        const nextMovementBlock = createMovementBlockFromAssessment({
          latestAssessment: { score, id: checkUp.startedAt },
          lifeGoal: prefs.profile.lifeGoal,
          startDate: completedAt,
        });
        nextAdherence = upsertMovementBlock(nextAdherence, nextMovementBlock);
        persistAdherence(nextAdherence);
        persistTraining(startBlock(training, nextTrainingBlock));
        setLastCompletion(completion);
        setReportBlock(updatedBlock);
        setPendingCheckup(null);
        setFlow('block-report');
      } else {
        persistAdherence(nextAdherence);
        if (onboardingIncomplete) {
          persistPrefs({
            ...prefs,
            onboarding: {
              ...prefs.onboarding,
              currentStep: 'results',
              baselineResultId: checkUp.startedAt,
              updatedAt: completedAt,
            },
          });
        }
        setPendingCheckup(null);
        setFlow('results');
      }
    },
    [activeMovementBlock, adherence, history, onboardingIncomplete, pendingCheckup, persistAdherence, persistPrefs, persistTraining, prefs, store, training]
  );

  const skipOnboardingCheckUpForDev = React.useCallback(() => {
    if (!__DEV__) return;
    handleCheckUpComplete(syntheticCheckUp(), {
      type: 'baseline',
      isOfficialForProgress: true,
    });
  }, [handleCheckUpComplete]);

  // From Results: build a block biased to the weakest domain and begin it.
  const handleStartPlan = React.useCallback((mode: 'standard' | 'onboarding' = 'standard') => {
    const sourceResult = visibleResult;
    if (!sourceResult) return;
    const now = new Date().toISOString();
    const score = scoreCheckUp(sourceResult);
    const block = buildBlock(score, training.equipment, now);
    const movementBlock = createMovementBlockFromAssessment({
      latestAssessment: { score, id: sourceResult.startedAt },
      lifeGoal: prefs.profile.lifeGoal,
      startDate: now,
    });
    let nextAdherence = upsertMovementBlock(adherence, movementBlock);
    nextAdherence = mergeMilestones(
      nextAdherence,
      generateMilestones({
        user: prefs.profile,
        block: movementBlock,
        lifeGoal: prefs.profile.lifeGoal,
        latestAssessment: score,
        completions: nextAdherence.completions,
        existing: nextAdherence.milestones,
        nowIso: now,
      })
    );
    persistAdherence(nextAdherence);
    persistTraining(startBlock(training, block));
    setLastResult(sourceResult);
    if (mode === 'onboarding') {
      persistPrefs({
        ...prefs,
        onboarding: {
          ...prefs.onboarding,
          currentStep: 'complete',
          completedAt: now,
          updatedAt: now,
        },
      });
      setFlow('onboarding-block');
    } else {
      setFlow('block-intro');
    }
  }, [adherence, persistAdherence, persistPrefs, persistTraining, prefs, training, visibleResult]);

  const handleStartSession = React.useCallback(
    (
      preferences?: TodaySessionPreferences & {
        lifecycleState?: typeof lifecycle.state;
        presetId?: string;
        targetSessionTemplateId?: PlanSessionId | string;
        includeOptionalLevels?: boolean;
        sessionIntensity?: SessionIntensity;
      }
    ) => {
      const plan = planTodayHaleSession({
        safetyProfile: prefs.profile.safetyProfile,
        lifeGoal: prefs.profile.lifeGoal,
        activeBlock: activeMovementBlock,
        training,
        lifecycleState: preferences?.lifecycleState ?? lifecycle.state,
        recentCompletions: adherence.completions,
        adjustment: preferences?.adjustment,
        painArea: preferences?.painArea,
        readiness: preferences?.adjustment
          ? undefined
          : readinessForTrainingPreference(training.planPreferences.preferredIntensity),
        sessionIntensity: preferences?.sessionIntensity ?? sessionIntensityForTrainingPreference(training.planPreferences.preferredIntensity),
        today: new Date(),
        presetId: preferences?.presetId,
        targetSessionTemplateId: preferences?.targetSessionTemplateId,
        includeOptionalLevels: preferences?.includeOptionalLevels,
      });
      setActiveSessionPlan(plan);
      setFlow('session-preview');
    },
    [activeMovementBlock, adherence.completions, lifecycle.state, prefs.profile.lifeGoal, prefs.profile.safetyProfile, training]
  );

  const handleStartRestartSession = React.useCallback(() => {
    handleStartSession({ adjustment: 'gentler', lifecycleState: 'inactive_restart' });
  }, [handleStartSession]);

  const handleStartPlanSession = React.useCallback(
    (targetSessionTemplateId: PlanSessionId) => {
      handleStartSession({ targetSessionTemplateId });
    },
    [handleStartSession]
  );

  const handleStartExtraSession = React.useCallback(
    (presetId: string) => {
      handleStartSession({
        presetId,
        includeOptionalLevels: false,
        sessionIntensity: sessionIntensityForTrainingPreference(training.planPreferences.preferredIntensity),
      });
    },
    [handleStartSession, training.planPreferences.preferredIntensity]
  );

  const openLadderDetail = React.useCallback((ladderId: string) => {
    setSelectedLadderId(ladderId);
    setFlow('ladder-detail');
  }, []);

  const openLearnDetail = React.useCallback((articleId: string) => {
    setSelectedLearnId(articleId);
    setFlow('learn-detail');
  }, []);

  const handleStartLadderPractice = React.useCallback(
    (ladderId: string) => {
      const plan = planLadderPracticeSession({
        ladderId,
        safetyProfile: prefs.profile.safetyProfile,
        lifeGoal: prefs.profile.lifeGoal,
        activeBlock: activeMovementBlock,
        training,
        today: new Date(),
      });
      if (!plan || plan.exercises.length === 0) return;
      setActiveSessionPlan(plan);
      setFlow('session-preview');
    },
    [activeMovementBlock, prefs.profile.lifeGoal, prefs.profile.safetyProfile, training]
  );

  const beginPlannedSession = React.useCallback(() => {
    if (!activeSessionPlan || activeSessionPlan.exercises.length === 0) return;
    setSessionType(activeSessionPlan.sessionType);
    setSessionIds(activeSessionPlan.exercises.map((exercise) => exercise.id));
    setLastSessionResult(null);
    setFlow('training');
  }, [activeSessionPlan]);

  const handleSessionComplete = React.useCallback(
    (result: TrainingSessionResult) => {
      const completedAt = new Date().toISOString();
      const sessionPlan = activeSessionPlan;
      const countsTowardPlan = countsTowardMainPlan(sessionPlan);
      setLastSessionResult(result);
      let nextTraining = training;
      let trainingChanged = false;
      if (countsTowardPlan) {
        nextTraining = recordCompletedSession(nextTraining, result, completedAt);
        trainingChanged = true;
      }
      if (sessionPlan && sessionPlan.metadata?.source !== 'legacy_fallback') {
        const summary = createGeneratedSessionSummary({
          sessionPlan,
          completedAt,
          durationMinutes: sessionPlan.estimatedMinutes,
        });
        nextTraining = {
          ...nextTraining,
          generatedSessionSummaries: upsertGeneratedSessionSummary(nextTraining.generatedSessionSummaries, summary),
        };
        trainingChanged = true;
      }
      if (trainingChanged) persistTraining(nextTraining);
      const block = activeMovementBlock;
      if (block) {
        const started = Date.parse(result.startedAt);
        const ended = Date.parse(completedAt);
        const durationMinutes = sessionPlan?.estimatedMinutes ??
          (Number.isFinite(started) && Number.isFinite(ended) ? Math.max(1, Math.round((ended - started) / 60000)) : undefined);
        const completion = makeTrainingSessionCompletion({
          block,
          sessionType: sessionPlan?.sessionType ?? sessionType,
          completedAt,
          plannedDate: sessionPlan?.metadata?.plannedDateKey ?? `session-${training.progress.completedSessions + 1}`,
          durationMinutes,
        });
        if (countsTowardPlan) {
          let nextAdherence = recordTrainingSessionCompletion(adherence, completion);
          const updatedBlock = nextAdherence.blocks.find((b) => b.id === block.id) ?? block;
          nextAdherence = mergeMilestones(
            nextAdherence,
            generateMilestones({
              user: prefs.profile,
              block: updatedBlock,
              lifeGoal: prefs.profile.lifeGoal,
              latestAssessment: lastScore,
              completions: nextAdherence.completions,
              existing: nextAdherence.milestones,
              nowIso: completedAt,
            })
          );
          persistAdherence(nextAdherence);
        }
        setLastCompletion(completion);
        setFlow('session-complete');
      } else {
        goHome();
      }
    },
    [activeMovementBlock, activeSessionPlan, adherence, goHome, lastScore, persistAdherence, persistTraining, prefs.profile, sessionType, training]
  );

  const handleMicroCheckComplete = React.useCallback(
    (result: MicroCheckResult) => {
      const completedAt = new Date().toISOString();
      try {
        trainingStore.saveMicroCheck(result);
      } catch (e) {
        console.warn('[training] micro-check save failed', e);
      }
      setMicroChecks((prev) => [...prev, result]);
      if (activeMovementBlock) {
        const completion = makeTrainingSessionCompletion({
          block: activeMovementBlock,
          sessionType: 'micro_check',
          completedAt,
          durationMinutes: 1,
        });
        persistAdherence(recordTrainingSessionCompletion(adherence, completion));
        setLastCompletion(completion);
      }
      goHome();
    },
    [activeMovementBlock, adherence, goHome, persistAdherence, trainingStore]
  );

  const handleSessionFeedback = React.useCallback(
    (feedback: {
      perceivedEffort?: 1 | 2 | 3 | 4 | 5;
      painReported?: boolean;
      painArea?: PainArea;
      completed?: boolean;
      trackingQuality?: TrackingQuality;
    }) => {
      if (!lastCompletion) return;
      const nextCompletion = { ...lastCompletion, ...feedback };
      const submittedAt = new Date().toISOString();
      const persistedFeedback: PersistedPostSessionFeedback = {
        sessionId: activeSessionPlan?.metadata?.generatedSessionId ?? activeSessionPlan?.id ?? lastCompletion.id,
        rpe: feedback.perceivedEffort,
        discomfort: feedback.painReported,
        painArea: feedback.painReported ? feedback.painArea : undefined,
        completed: feedback.completed ?? true,
        trackingQuality: feedback.trackingQuality ?? 'good',
        submittedAt,
      };
      setLastCompletion(nextCompletion);
      persistAdherence({
        ...adherence,
        completions: adherence.completions.map((c) => (c.id === lastCompletion.id ? nextCompletion : c)),
      });
      let nextTraining: TrainingState = {
        ...training,
        lastPostSessionFeedback: persistedFeedback,
      };
      if (activeSessionPlan) {
        const summary = createGeneratedSessionSummary({
          sessionPlan: activeSessionPlan,
          completedAt: nextCompletion.completedAt,
          durationMinutes: nextCompletion.durationMinutes,
          feedback: persistedFeedback,
        });
        if (activeSessionPlan.metadata?.source !== 'legacy_fallback') {
          nextTraining = {
            ...nextTraining,
            generatedSessionSummaries: upsertGeneratedSessionSummary(nextTraining.generatedSessionSummaries, summary),
          };
        }
      }
      if (
        activeSessionPlan &&
        activeSessionPlan.metadata?.source !== 'legacy_fallback' &&
        countsTowardMainPlan(activeSessionPlan)
      ) {
        try {
          const ladderProgressById = updateExerciseProgressionFromSession({
            sessionPlan: activeSessionPlan,
            completion: nextCompletion,
            previousProgress: training.ladderProgressById,
            sessionResult: lastSessionResult,
            perceivedEffort: feedback.perceivedEffort,
            painReported: feedback.painReported,
            painAreas: feedback.painReported && feedback.painArea ? [feedback.painArea] : [],
            completed: feedback.completed ?? true,
            trackingQuality: feedback.trackingQuality ?? 'good',
          });
          nextTraining = { ...nextTraining, ladderProgressById };
        } catch (e) {
          console.warn('[training] dynamic feedback update failed', e);
        }
      }
      persistTraining(nextTraining);
    },
    [activeSessionPlan, adherence, lastCompletion, lastSessionResult, persistAdherence, persistTraining, training]
  );

  const toggleEquipment = React.useCallback(
    (key: keyof EquipmentProfile) => {
      const nextEquipment = { ...training.equipment, [key]: !training.equipment[key] };
      persistTraining({ ...training, equipment: nextEquipment });
      const safetyProfile = prefs.profile.safetyProfile;
      if (safetyProfile) {
        persistPrefs({
          ...prefs,
          profile: {
            ...prefs.profile,
            safetyProfile: {
              ...safetyProfile,
              availableEquipment: syncAvailableEquipment(safetyProfile.availableEquipment, nextEquipment),
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }
    },
    [persistPrefs, persistTraining, prefs, training]
  );

  const toggleAvailableEquipment = React.useCallback(
    (item: AvailableEquipment) => {
      const safetyProfile = prefs.profile.safetyProfile;
      if (!safetyProfile) return;
      const availableEquipment = toggleAvailableEquipmentItem(safetyProfile.availableEquipment, item);
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          safetyProfile: {
            ...safetyProfile,
            availableEquipment,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    },
    [persistPrefs, prefs]
  );

  const handlePreferredWorkoutDaysChange = React.useCallback(
    (preferredWorkoutDays: string[]) => {
      const safetyProfile = prefs.profile.safetyProfile;
      if (!safetyProfile) return;
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          safetyProfile: {
            ...safetyProfile,
            preferredWorkoutDays,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    },
    [persistPrefs, prefs]
  );

  const handleTrainingIntensityChange = React.useCallback(
    (preferredIntensity: TrainingIntensityPreference) => {
      persistTraining({
        ...training,
        planPreferences: {
          ...training.planPreferences,
          preferredIntensity,
        },
      });
    },
    [persistTraining, training]
  );

  const handleSaveSupportConnection = React.useCallback(
    (connection: SupportConnection) => {
      const existing = adherence.supportConnections.some((c) => c.id === connection.id);
      persistAdherence({
        ...adherence,
        supportConnections: existing
          ? adherence.supportConnections.map((c) => (c.id === connection.id ? connection : c))
          : [...adherence.supportConnections, connection],
      });
    },
    [adherence, persistAdherence]
  );

  const handleRemoveSupportConnection = React.useCallback(
    (id: string) => {
      persistAdherence({
        ...adherence,
        supportConnections: adherence.supportConnections.map((c) =>
          c.id === id ? { ...c, status: 'removed', updatedAt: new Date().toISOString() } : c
        ),
      });
    },
    [adherence, persistAdherence]
  );

  const viewLast = React.useCallback(() => {
    const latest = history[history.length - 1];
    if (latest) {
      setLastResult(latest.checkUp);
      setFlow('results');
    }
  }, [history]);

  const handleStartNextBlock = React.useCallback(() => {
    const latest = history[history.length - 1];
    const sourceResult = lastResult ?? latest?.checkUp;
    if (!sourceResult) {
      setFlow('checkup');
      return;
    }
    const now = new Date().toISOString();
    const score = scoreCheckUp(sourceResult);
    const block = buildBlock(score, training.equipment, now);
    const movementBlock = createMovementBlockFromAssessment({
      latestAssessment: { score, id: sourceResult.startedAt },
      lifeGoal: prefs.profile.lifeGoal,
      startDate: now,
    });
    let nextAdherence = upsertMovementBlock(adherence, movementBlock);
    nextAdherence = mergeMilestones(
      nextAdherence,
      generateMilestones({
        user: prefs.profile,
        block: movementBlock,
        lifeGoal: prefs.profile.lifeGoal,
        latestAssessment: score,
        completions: nextAdherence.completions,
        existing: nextAdherence.milestones,
        nowIso: now,
      })
    );
    setLastResult(sourceResult);
    persistAdherence(nextAdherence);
    persistTraining(startBlock(training, block));
    setFlow('block-intro');
  }, [adherence, history, lastResult, persistAdherence, persistTraining, prefs.profile, training]);

  const handleTodayPrimaryAction = React.useCallback((preferences?: TodaySessionPreferences | null) => {
    switch (lifecycle.primaryAction.type) {
      case 'start_onboarding':
        setFlow(flowForOnboardingStep(onboardingStep) ?? 'welcome');
        return;
      case 'start_checkup':
        setFlow('camera-setup');
        return;
      case 'create_block':
        handleStartNextBlock();
        return;
      case 'start_first_session':
      case 'start_today_session':
        handleStartSession(preferences ?? undefined);
        return;
      case 'start_micro_check':
        setFlow('microcheck');
        return;
      case 'start_retest':
        beginCheckUp('official_retest');
        return;
      case 'start_gentle_restart':
        handleStartSession({ ...(preferences ?? {}), adjustment: preferences?.adjustment ?? 'gentler', lifecycleState: 'inactive_restart' });
        return;
      case 'explore_extra_sessions':
        handleStartSession({ ...(preferences ?? {}), lifecycleState: 'week_complete', presetId: 'preset-mobility-reset' });
        return;
      default:
        handleStartSession(preferences ?? undefined);
    }
  }, [
    beginCheckUp,
    handleStartNextBlock,
    handleStartSession,
    lifecycle.primaryAction.type,
    onboardingStep,
  ]);

  const extraTrendPoints = React.useMemo(() => microCheckTrendPoints(microChecks), [microChecks]);
  const reportDisplayBlock = React.useMemo(
    () => reportBlock ?? displayMovementBlock,
    [displayMovementBlock, reportBlock]
  );
  const reportRecord = React.useMemo(
    () => (reportDisplayBlock ? adherence.reports.find((report) => report.blockId === reportDisplayBlock.id) : undefined),
    [adherence.reports, reportDisplayBlock]
  );
  const reportPreviousScore = React.useMemo(() => {
    if (!reportDisplayBlock?.sourceAssessmentId) return null;
    const previous = history.find((h) => h.checkUp.startedAt === reportDisplayBlock.sourceAssessmentId);
    return previous ? scoreCheckUp(previous.checkUp) : null;
  }, [history, reportDisplayBlock]);
  const reportLatestScore = React.useMemo(() => {
    const retestAssessment = adherence.assessments.find((assessment) => assessment.id === reportRecord?.retestAssessmentId);
    const checkUpId = retestAssessment?.results?.rawMetrics?.checkUpId;
    const fromHistory = checkUpId ? history.find((h) => h.checkUp.startedAt === checkUpId)?.checkUp : null;
    const checkUp = fromHistory ?? (lastResult?.startedAt === checkUpId ? lastResult : null) ?? lastResult ?? history[history.length - 1]?.checkUp;
    return checkUp ? scoreCheckUp(checkUp) : null;
  }, [adherence.assessments, history, lastResult, reportRecord]);

  const openManualCheckup = React.useCallback(() => setFlow('manual-checkup'), []);

  const openBlockReport = React.useCallback(
    (blockId: string) => {
      const block = adherence.blocks.find((item) => item.id === blockId) ?? null;
      setReportBlock(block);
      setFlow('block-report');
    },
    [adherence.blocks]
  );

  const handleRoute = React.useCallback(
    (route: string | undefined) => {
      switch (route) {
        case 'life-goal':
          setFlow('life-goal');
          return;
        case 'safety-profile':
          setFlow('safety-profile');
          return;
        case 'equipment':
          setFlow('equipment');
          return;
        case 'camera-explanation':
          setFlow('camera-explanation');
          return;
        case 'camera-setup':
          setFlow('camera-setup');
          return;
        case 'checkup':
          beginCheckUp();
          return;
        case 'checkup-retake':
        case 'baseline-retake':
          beginCheckUp('baseline_retake');
          return;
        case 'manual-checkup':
          openManualCheckup();
          return;
        case 'manual-extra-checkup':
          beginCheckUp('manual_extra');
          return;
        case 'quick-recheck':
          beginCheckUp('quick_recheck');
          return;
        case 'official-retest':
          beginCheckUp('official_retest');
          return;
        case 'create-block':
        case 'next-block':
          handleStartNextBlock();
          return;
        case 'training':
          handleStartSession();
          return;
        case 'microcheck':
          setFlow('microcheck');
          return;
        case 'restart-intro':
          setFlow('restart-intro');
          return;
        case 'block-report':
          setFlow('block-report');
          return;
        case 'home-block':
        default:
          goHome();
      }
    },
    [beginCheckUp, goHome, handleStartNextBlock, handleStartSession, openManualCheckup]
  );

  const cameraReady = permission === 'granted' && audioReady;

  // Camera flows need permission + audio first; everything else renders freely.
  if (flow !== null && CAMERA_FLOWS.has(flow) && !cameraReady) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.message}>
          <Text style={styles.text}>
            {permission === 'checking' || !audioReady
              ? 'Getting ready…'
              : 'Camera access is needed to measure your movement. Video is never shown or stored — you appear only as a skeleton outline.'}
          </Text>
          {permission === 'denied' ? (
            <Pressable style={styles.back} onPress={goHome} accessibilityRole="button" accessibilityLabel="Back to Today">
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  // A full-screen flow takes over the whole screen (no tab bar).
  if (flow !== null) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        {flow === 'welcome' ? (
          <WelcomeScreen onStart={handleWelcomeStart} onDone={goHome} showDashboardLink={!onboardingIncomplete} />
        ) : flow === 'safety-profile' ? (
          <SafetyProfileScreen
            profile={prefs.profile}
            onSave={onSafetyProfileSave}
            onCancel={() => (onboardingIncomplete ? setFlow('life-goal') : goHome())}
          />
        ) : flow === 'equipment' ? (
          <OnboardingEquipmentScreen
            selectedEquipment={prefs.onboarding.selectedEquipment}
            onSave={handleEquipmentSave}
            onBack={() => setFlow('safety-profile')}
          />
        ) : flow === 'camera-explanation' ? (
          <CameraExplanationScreen
            permissionGranted={permission === 'granted'}
            onRequestPermission={requestCameraPermission}
            onContinue={handleCameraExplanationContinue}
            onBack={() => setFlow('equipment')}
          />
        ) : flow === 'camera-setup' ? (
          <CameraSetupScreen
            permissionGranted={permission === 'granted'}
            onRequestPermission={requestCameraPermission}
            onBegin={() => (onboardingIncomplete ? beginOnboardingCheckUp() : beginCheckUp(latestAssessment ? 'manual_extra' : 'baseline'))}
            onDevSkipCheckUp={__DEV__ && onboardingIncomplete ? skipOnboardingCheckUpForDev : undefined}
            onCancel={() => (onboardingIncomplete ? setFlow('camera-explanation') : goHome())}
          />
        ) : flow === 'manual-checkup' ? (
          <ManualCheckupStartScreen
            latestAssessment={latestAssessment}
            activeBlock={activeMovementBlock}
            completions={adherence.completions}
            onSelectCheckup={beginCheckUp}
            onMicroCheck={() => setFlow('microcheck')}
            onCancel={goHome}
          />
        ) : flow === 'checkup' ? (
          <CheckUpScreen onComplete={handleCheckUpComplete} onCancel={goHome} voiceId={prefs.settings.voiceId} />
        ) : flow === 'results' && visibleResult ? (
          showOnboardingResult ? (
            <OnboardingResultsScreen
              checkUp={visibleResult}
              onCreateBlock={() => handleStartPlan('onboarding')}
            />
          ) : (
            <ResultsScreen
              checkUp={visibleResult}
              history={history}
              extraTrendPoints={extraTrendPoints}
              onDone={goHome}
              onStartPlan={handleStartPlan}
            />
          )
        ) : flow === 'session-preview' && activeSessionPlan ? (
          <SessionPreviewScreen
            plan={activeSessionPlan}
            onStart={beginPlannedSession}
            onCancel={goHome}
          />
        ) : flow === 'training' && sessionIds.length > 0 ? (
          <TrainingSessionScreen
            exerciseIds={sessionIds}
            onComplete={handleSessionComplete}
            onCancel={goHome}
            voiceId={prefs.settings.voiceId}
          />
        ) : flow === 'microcheck' ? (
          <MicroCheckScreen
            type={activeMovementBlock ? getMicroCheckForBlock(activeMovementBlock).type : 'chair-power'}
            onComplete={handleMicroCheckComplete}
            voiceId={prefs.settings.voiceId}
          />
        ) : flow === 'life-goal' ? (
          <LifeGoalOnboardingScreen
            initialGoal={prefs.profile.lifeGoal}
            onSave={onLifeGoalSave}
            onCancel={() => (onboardingIncomplete ? setFlow('welcome') : goHome())}
          />
        ) : flow === 'onboarding-block' && displayMovementBlock ? (
          <OnboardingBlockScreen
            block={displayMovementBlock}
            onStartSession={() => handleStartSession({ lifecycleState: 'first_session_ready' })}
            onGoToday={goHome}
          />
        ) : flow === 'block-intro' && displayMovementBlock ? (
          <BlockIntroScreen
            block={displayMovementBlock}
            lifeGoal={prefs.profile.lifeGoal}
            onStartSession={handleStartSession}
            onDone={goHome}
          />
        ) : flow === 'restart-intro' && activeMovementBlock ? (
          <RestartSessionScreen
            block={activeMovementBlock}
            lifeGoal={prefs.profile.lifeGoal}
            completions={adherence.completions}
            onStart={handleStartRestartSession}
            onCancel={goHome}
          />
        ) : flow === 'weekly-summary' && displayMovementBlock ? (
          <WeeklySummaryScreen
            block={displayMovementBlock}
            lifeGoal={prefs.profile.lifeGoal}
            completions={adherence.completions}
            supportConnection={supportConnection}
            onDone={goHome}
          />
        ) : flow === 'block-report' && reportDisplayBlock ? (
          <BlockReportScreen
            block={reportDisplayBlock}
            lifeGoal={prefs.profile.lifeGoal}
            completions={adherence.completions}
            previousScore={reportPreviousScore}
            latestScore={reportLatestScore}
            milestone={newestMilestone}
            nextBlockReady={!!activeMovementBlock && activeMovementBlock.id !== reportDisplayBlock.id}
            onStartNextBlock={activeMovementBlock && activeMovementBlock.id !== reportDisplayBlock.id ? goHome : handleStartNextBlock}
            onDone={goHome}
          />
        ) : flow === 'session-complete' && displayMovementBlock ? (
          <SessionCompletionScreen
            block={displayMovementBlock}
            lifeGoal={prefs.profile.lifeGoal}
            completion={lastCompletion}
            validTimeSummaries={validTimeSessionSummaryCards(lastSessionResult)}
            onMicroCheck={() => setFlow('microcheck')}
            onFeedback={handleSessionFeedback}
            onDone={goHome}
          />
        ) : flow === 'ladder-detail' && selectedLadderId ? (
          <LadderDetailScreen
            ladderId={selectedLadderId}
            ladderProgressById={training.ladderProgressById}
            onPractice={() => handleStartLadderPractice(selectedLadderId)}
            onDone={goExplore}
          />
        ) : flow === 'learn-detail' && selectedLearnId ? (
          <LearnDetailScreen
            articleId={selectedLearnId}
            onCameraSetup={() => setFlow('camera-setup')}
            onEquipment={() => setFlow('settings')}
            onDone={goExplore}
          />
        ) : flow === 'settings' ? (
          <SettingsScreen
            profile={prefs.profile}
            settings={prefs.settings}
            equipment={training.equipment}
            supportConnection={supportConnection}
            preferredDays={prefs.profile.safetyProfile?.preferredWorkoutDays ?? []}
            preferredIntensity={training.planPreferences.preferredIntensity}
            onProfileChange={onProfileChange}
            onSettingsChange={onSettingsChange}
            onToggleEquipment={toggleEquipment}
            onToggleAvailableEquipment={toggleAvailableEquipment}
            onPreferredDaysChange={handlePreferredWorkoutDaysChange}
            onIntensityChange={handleTrainingIntensityChange}
            onOpenLifeGoal={() => setFlow('life-goal')}
            onOpenSafetyProfile={() => setFlow('safety-profile')}
            onOpenCameraSetup={() => setFlow('camera-setup')}
          />
        ) : flow === 'dev-assessment' ? (
          <AssessmentScreen />
        ) : flow === 'dev-live' ? (
          <LiveSessionScreen />
        ) : (
          // Defensive: an unsatisfiable flow (e.g. results with no result) falls back home.
          <View />
        )}
        {flow === 'settings' || (__DEV__ && (flow === 'dev-assessment' || flow === 'dev-live')) ? (
          <Pressable style={styles.back} onPress={goHome} accessibilityRole="button" accessibilityLabel="Back to Today">
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  // Tab shell.
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.tabContent}>
        {tab === 'today' ? (
          <TodayScreen
            profile={prefs.profile}
            lifecycle={lifecycle}
            onPrimaryAction={handleTodayPrimaryAction}
            onOpenSettings={() => setFlow('settings')}
          />
        ) : tab === 'plan' ? (
          <PlanScreen
            lifecycleState={lifecycle.state}
            lifeGoalText={prefs.profile.lifeGoal ? getLifeGoalDisplayText(prefs.profile.lifeGoal) : prefs.profile.goal}
            activeBlockSummary={lifecycle.activeBlockSummary}
            weekSessionStatuses={lifecycle.weekSessionStatuses ?? []}
            preferredDays={prefs.profile.safetyProfile?.preferredWorkoutDays ?? []}
            preferredIntensity={training.planPreferences.preferredIntensity}
            onStartOnboarding={() => setFlow(flowForOnboardingStep(onboardingStep) ?? 'welcome')}
            onStartCheckUp={() => setFlow('camera-setup')}
            onCreateBlock={handleStartNextBlock}
            onStartPlanSession={handleStartPlanSession}
            onStartRetest={() => beginCheckUp('official_retest')}
            onOpenSettings={() => setFlow('settings')}
            onPreferredDaysChange={handlePreferredWorkoutDaysChange}
            onIntensityChange={handleTrainingIntensityChange}
          />
        ) : tab === 'progress' ? (
          <ProgressScreen
            history={history}
            activeBlock={activeMovementBlock}
            blocks={adherence.blocks}
            reports={adherence.reports}
            completions={adherence.completions}
            ladderProgressById={training.ladderProgressById}
            today={new Date().toISOString()}
            onBeginCheckUp={() => (latestAssessment ? openManualCheckup() : setFlow('camera-setup'))}
            onStartRetest={() => beginCheckUp('official_retest')}
            onViewLatest={viewLast}
            onViewReport={openBlockReport}
            onOpenSettings={() => setFlow('settings')}
          />
        ) : (
          <ExploreScreen
            equipment={training.equipment}
            safetyProfile={prefs.profile.safetyProfile}
            settings={prefs.settings}
            ladderProgressById={training.ladderProgressById}
            onStartExtraSession={handleStartExtraSession}
            onOpenLadder={openLadderDetail}
            onOpenLearn={openLearnDetail}
            onOpenSettings={() => setFlow('settings')}
          />
        )}
      </View>

      <TabBar active={tab} onChange={setTab} />
    </View>
  );
}

function readinessForTrainingPreference(preference: TrainingIntensityPreference) {
  if (preference === 'gentle') return 'low_energy' as const;
  return undefined;
}

function sessionIntensityForTrainingPreference(preference: TrainingIntensityPreference): SessionIntensity {
  if (preference === 'gentle') return 'beginner';
  if (preference === 'more_challenge') return 'advanced';
  return 'standard';
}

function AuthLoadingScreen() {
  return (
    <View style={[styles.container, styles.splash]}>
      <StatusBar style="dark" />
      <Text style={styles.splashBrand}>Hale</Text>
      <Text style={styles.splashText}>Preparing your account...</Text>
    </View>
  );
}

function syncAvailableEquipment(
  current: readonly AvailableEquipment[],
  equipment: EquipmentProfile
): AvailableEquipment[] {
  const set = new Set<AvailableEquipment>(current.length > 0 ? current : ['chair', 'wall']);
  set.delete('none');
  if (equipment.stair) set.add('stairs');
  else set.delete('stairs');
  if (equipment.band) set.add('resistance_band');
  else set.delete('resistance_band');
  if (equipment.miniBand) set.add('mini_band');
  else set.delete('mini_band');
  if (equipment.load) set.add('backpack');
  else {
    set.delete('backpack');
    set.delete('dumbbells');
  }
  return set.size > 0 ? Array.from(set) : ['none'];
}

function toggleAvailableEquipmentItem(
  current: readonly AvailableEquipment[],
  item: AvailableEquipment
): AvailableEquipment[] {
  const set = new Set<AvailableEquipment>(current.length > 0 ? current : ['chair', 'wall']);
  set.delete('none');
  if (set.has(item)) set.delete(item);
  else set.add(item);
  return set.size > 0 ? Array.from(set) : ['none'];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  splash: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  splashBrand: {
    ...type.h1,
    color: colors.accentDeep,
  },
  splashText: {
    ...type.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  tabContent: {
    flex: 1,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  text: {
    ...type.body,
    textAlign: 'center',
  },
  back: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.button,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  backText: {
    ...type.bodySmall,
    color: colors.accentDeep,
  },
});
