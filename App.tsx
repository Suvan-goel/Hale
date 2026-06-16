import { Fraunces_400Regular, Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { requestCameraPermissionsAsync } from './modules/expo-pose-detection';
import {
  AdherenceStore,
  AdherenceStoreState,
  BlockIntroScreen,
  BlockReportScreen,
  CheckupType,
  LifeGoal,
  LifeGoalOnboardingScreen,
  MovementAssessment,
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
  getHaleAppLifecycle,
  getMicroCheckForBlock,
  latestOfficialAssessment,
  planTodayHaleSession,
  updateExerciseProgressionFromSession,
  type HaleSessionPlan,
  type TodaySessionPreferences,
} from './src/haleFlow';
import { HistoryStore, StoredCheckUp } from './src/history';
import { expoHistoryFs } from './src/history/fsAdapter';
import { TabBar, TabKey } from './src/navigation/TabBar';
import {
  AppSettings,
  Preferences,
  ProfileStore,
  UserProfile,
  defaultPreferences,
} from './src/profile';
import { CheckUpScore, scoreCheckUp } from './src/scoring';
import { AssessmentScreen } from './src/screens/AssessmentScreen';
import { CameraSetupScreen } from './src/screens/CameraSetupScreen';
import { CheckUpScreen } from './src/screens/CheckUpScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { LiveSessionScreen } from './src/screens/LiveSessionScreen';
import { ManualCheckupStartScreen } from './src/screens/ManualCheckupStartScreen';
import { MicroCheckScreen } from './src/screens/MicroCheckScreen';
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
  TrainingState,
  TrainingStore,
  TrainingSessionResult,
  buildBlock,
  defaultTrainingState,
  microCheckTrendPoints,
  recordCompletedSession,
  retestDue,
  startBlock,
} from './src/training';
import { colors, radius, spacing, type } from './src/theme';

type PermissionState = 'checking' | 'granted' | 'denied';
/** Full-screen flows launched on top of the tab shell (hands-free sessions + dev tools). */
type Flow =
  | 'welcome'
  | 'safety-profile'
  | 'camera-setup'
  | 'manual-checkup'
  | 'checkup'
  | 'results'
  | 'session-preview'
  | 'training'
  | 'microcheck'
  | 'life-goal'
  | 'block-intro'
  | 'restart-intro'
  | 'weekly-summary'
  | 'block-report'
  | 'session-complete'
  | 'settings'
  | 'dev-assessment'
  | 'dev-live';

/** Flows that mount the camera; gated on permission + audio configuration. */
const CAMERA_FLOWS = new Set<Flow>(['checkup', 'training', 'microcheck', 'dev-assessment', 'dev-live']);

export default function App() {
  // Fonts are bundled (no runtime fetch); gate the first paint until they load
  // so headings never flash in a fallback face.
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Inter_400Regular,
    Inter_500Medium,
  });
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
  const [autoWelcomeShown, setAutoWelcomeShown] = React.useState(false);
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
    if (!historyReady || !profileReady || !adherenceReady || autoWelcomeShown || flow !== null) return;
    if (history.length === 0 && !prefs.profile.lifeGoal) {
      setAutoWelcomeShown(true);
      setFlow('welcome');
    }
  }, [adherenceReady, autoWelcomeShown, flow, history.length, historyReady, prefs.profile.lifeGoal, profileReady]);

  const goHome = React.useCallback(() => {
    setFlow(null);
    setTab('today');
    setSessionIds([]);
    setActiveSessionPlan(null);
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
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          lifeGoal,
          goal: getLifeGoalDisplayText(lifeGoal),
        },
      });
      if (!prefs.profile.safetyProfile) {
        setFlow('safety-profile');
      } else if (history.length === 0) {
        setFlow('camera-setup');
      } else {
        goHome();
      }
    },
    [goHome, history.length, persistPrefs, prefs]
  );

  const onSafetyProfileSave = React.useCallback(
    (safetyProfile: MovementSafetyProfile, age: number | null) => {
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          age,
          safetyProfile,
        },
      });
      persistTraining({
        ...training,
        equipment: {
          stair: safetyProfile.availableEquipment.includes('stairs'),
          band: safetyProfile.availableEquipment.includes('resistance_band'),
        },
      });
      if (history.length === 0) {
        setFlow('camera-setup');
      } else {
        goHome();
      }
    },
    [goHome, history.length, persistPrefs, persistTraining, prefs, training]
  );

  const activeMovementBlock = React.useMemo(() => getActiveMovementBlock(adherence.blocks), [adherence.blocks]);
  const displayMovementBlock = React.useMemo(
    () => activeMovementBlock ?? getLatestMovementBlock(adherence.blocks),
    [activeMovementBlock, adherence.blocks]
  );
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

  // A finished check-up: persist it, show it, reload history (feeds trends).
  const handleCheckUpComplete = React.useCallback(
    (checkUp: CheckUp) => {
      const completedAt = new Date().toISOString();
      const block = activeMovementBlock;
      const score = scoreCheckUp(checkUp);
      const checkupType =
        pendingCheckup?.type ??
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
        sourceBlockId: pendingCheckup?.sourceBlockId ?? (isRetest ? block?.id : undefined),
        completedAt,
        isOfficialForProgress: pendingCheckup?.isOfficialForProgress,
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
        persistAdherence(nextAdherence);
        setLastCompletion(completion);
        setPendingCheckup(null);
        setFlow('block-report');
      } else {
        persistAdherence(nextAdherence);
        setPendingCheckup(null);
        setFlow('results');
      }
    },
    [activeMovementBlock, adherence, history, pendingCheckup, persistAdherence, prefs.profile, store, training]
  );

  // From Results: build a block biased to the weakest domain and begin it.
  const handleStartPlan = React.useCallback(() => {
    if (!lastResult) return;
    const now = new Date().toISOString();
    const score = scoreCheckUp(lastResult);
    const block = buildBlock(score, training.equipment, now);
    const movementBlock = createMovementBlockFromAssessment({
      latestAssessment: { score, id: lastResult.startedAt },
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
    setFlow('block-intro');
  }, [adherence, lastResult, persistAdherence, persistTraining, prefs.profile, training]);

  const handleStartSession = React.useCallback(
    (
      preferences?: TodaySessionPreferences & {
        lifecycleState?: typeof lifecycle.state;
        presetId?: string;
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
        today: new Date(),
        presetId: preferences?.presetId,
      });
      setActiveSessionPlan(plan);
      setFlow('session-preview');
    },
    [activeMovementBlock, adherence.completions, lifecycle.state, prefs.profile.lifeGoal, prefs.profile.safetyProfile, training]
  );

  const handleStartRestartSession = React.useCallback(() => {
    handleStartSession({ adjustment: 'gentler', lifecycleState: 'inactive_restart' });
  }, [handleStartSession]);

  const beginPlannedSession = React.useCallback(() => {
    if (!activeSessionPlan || activeSessionPlan.exercises.length === 0) return;
    setSessionType(activeSessionPlan.sessionType);
    setSessionIds(activeSessionPlan.exercises.map((exercise) => exercise.id));
    setFlow('training');
  }, [activeSessionPlan]);

  const handleSessionComplete = React.useCallback(
    (result: TrainingSessionResult) => {
      const completedAt = new Date().toISOString();
      const sessionPlan = activeSessionPlan;
      if (sessionPlan?.sessionType !== 'retest_prep') {
        persistTraining(recordCompletedSession(training, result, completedAt));
      }
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
        setLastCompletion(completion);
        if (sessionPlan && sessionPlan.metadata?.source !== 'legacy_fallback') {
          try {
            // TODO(Stage 4): persist returned ladder progress once the dynamic
            // ladder-progress store is added. For now this safely exercises the
            // progression update path without changing storage schemas.
            updateExerciseProgressionFromSession({ sessionPlan, completion });
          } catch (e) {
            console.warn('[training] dynamic progression update failed', e);
          }
        }
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
    (feedback: { perceivedEffort?: 1 | 2 | 3 | 4 | 5; painReported?: boolean }) => {
      if (!lastCompletion) return;
      const nextCompletion = { ...lastCompletion, ...feedback };
      setLastCompletion(nextCompletion);
      persistAdherence({
        ...adherence,
        completions: adherence.completions.map((c) => (c.id === lastCompletion.id ? nextCompletion : c)),
      });
      if (activeSessionPlan && activeSessionPlan.metadata?.source !== 'legacy_fallback') {
        try {
          updateExerciseProgressionFromSession({
            sessionPlan: activeSessionPlan,
            completion: nextCompletion,
            perceivedEffort: feedback.perceivedEffort,
            painReported: feedback.painReported,
          });
        } catch (e) {
          console.warn('[training] dynamic feedback update failed', e);
        }
      }
    },
    [activeSessionPlan, adherence, lastCompletion, persistAdherence]
  );

  const toggleEquipment = React.useCallback(
    (key: keyof EquipmentProfile) => {
      persistTraining({ ...training, equipment: { ...training.equipment, [key]: !training.equipment[key] } });
    },
    [training, persistTraining]
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
    if (!latest) {
      setFlow('checkup');
      return;
    }
    const now = new Date().toISOString();
    const score = scoreCheckUp(latest.checkUp);
    const block = buildBlock(score, training.equipment, now);
    const movementBlock = createMovementBlockFromAssessment({
      latestAssessment: { score, id: latest.checkUp.startedAt },
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
    setLastResult(latest.checkUp);
    persistAdherence(nextAdherence);
    persistTraining(startBlock(training, block));
    setFlow('block-intro');
  }, [adherence, history, persistAdherence, persistTraining, prefs.profile, training]);

  const handleTodayPrimaryAction = React.useCallback((preferences?: TodaySessionPreferences | null) => {
    switch (lifecycle.primaryAction.type) {
      case 'start_onboarding':
        setFlow(prefs.profile.lifeGoal ? 'safety-profile' : 'welcome');
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
    prefs.profile.lifeGoal,
  ]);

  const extraTrendPoints = React.useMemo(() => microCheckTrendPoints(microChecks), [microChecks]);
  const reportPreviousScore = React.useMemo(() => {
    if (!displayMovementBlock?.sourceAssessmentId) return null;
    const previous = history.find((h) => h.checkUp.startedAt === displayMovementBlock.sourceAssessmentId);
    return previous ? scoreCheckUp(previous.checkUp) : null;
  }, [displayMovementBlock, history]);
  const reportLatestScore = React.useMemo(() => {
    if (lastResult) return scoreCheckUp(lastResult);
    const latest = history[history.length - 1];
    return latest ? scoreCheckUp(latest.checkUp) : null;
  }, [history, lastResult]);

  const openManualCheckup = React.useCallback(() => setFlow('manual-checkup'), []);

  const handleRoute = React.useCallback(
    (route: string | undefined) => {
      switch (route) {
        case 'life-goal':
          setFlow('life-goal');
          return;
        case 'safety-profile':
          setFlow('safety-profile');
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

  // Hold the first paint until bundled fonts are ready (warm ivory splash).
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
      </View>
    );
  }

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
            <Pressable style={styles.back} onPress={goHome}>
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
          <WelcomeScreen onStart={() => setFlow('life-goal')} onDone={goHome} />
        ) : flow === 'safety-profile' ? (
          <SafetyProfileScreen profile={prefs.profile} onSave={onSafetyProfileSave} onCancel={goHome} />
        ) : flow === 'camera-setup' ? (
          <CameraSetupScreen
            permissionGranted={permission === 'granted'}
            onRequestPermission={requestCameraPermission}
            onBegin={() => beginCheckUp(latestAssessment ? 'manual_extra' : 'baseline')}
            onCancel={goHome}
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
          <CheckUpScreen onComplete={handleCheckUpComplete} voiceId={prefs.settings.voiceId} />
        ) : flow === 'results' && lastResult ? (
          <ResultsScreen
            checkUp={lastResult}
            history={history}
            extraTrendPoints={extraTrendPoints}
            onDone={goHome}
            onStartPlan={handleStartPlan}
          />
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
            onCancel={goHome}
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
        ) : flow === 'block-report' && displayMovementBlock ? (
          <BlockReportScreen
            block={displayMovementBlock}
            lifeGoal={prefs.profile.lifeGoal}
            completions={adherence.completions}
            previousScore={reportPreviousScore}
            latestScore={reportLatestScore}
            milestone={newestMilestone}
            onStartNextBlock={handleStartNextBlock}
            onDone={goHome}
          />
        ) : flow === 'session-complete' && displayMovementBlock ? (
          <SessionCompletionScreen
            block={displayMovementBlock}
            lifeGoal={prefs.profile.lifeGoal}
            completion={lastCompletion}
            onMicroCheck={() => setFlow('microcheck')}
            onFeedback={handleSessionFeedback}
            onDone={goHome}
          />
        ) : flow === 'settings' ? (
          <SettingsScreen
            profile={prefs.profile}
            settings={prefs.settings}
            equipment={training.equipment}
            onProfileChange={onProfileChange}
            onSettingsChange={onSettingsChange}
            onToggleEquipment={toggleEquipment}
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
          <Pressable style={styles.back} onPress={goHome}>
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
            activeBlockSummary={lifecycle.activeBlockSummary}
            weekSessionStatuses={lifecycle.weekSessionStatuses ?? []}
            onCreateBlock={handleStartNextBlock}
            onStartSession={handleStartSession}
            onOpenSettings={() => setFlow('settings')}
          />
        ) : tab === 'progress' ? (
          <ProgressScreen
            latestCheckUp={history.length > 0 ? history[history.length - 1] : null}
            score={lastScore}
            movementSnapshot={lifecycle.movementSnapshot}
            checkUpCount={history.length}
            onBeginCheckUp={() => (latestAssessment ? openManualCheckup() : setFlow('camera-setup'))}
            onViewLatest={viewLast}
            onOpenSettings={() => setFlow('settings')}
          />
        ) : (
          <ExploreScreen equipment={training.equipment} onOpenSettings={() => setFlow('settings')} />
        )}
      </View>

      <TabBar active={tab} onChange={setTab} />

      {__DEV__ && tab === 'today' ? (
        <View style={styles.devRow}>
          <Pressable style={styles.devChip} onPress={() => handleCheckUpComplete(syntheticCheckUp())}>
            <Text style={styles.devChipText}>dev: skip check-up</Text>
          </Pressable>
          <Pressable style={styles.devChip} onPress={() => setFlow('dev-assessment')}>
            <Text style={styles.devChipText}>dev: chair stand</Text>
          </Pressable>
          <Pressable style={styles.devChip} onPress={() => setFlow('dev-live')}>
            <Text style={styles.devChipText}>dev: live view</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
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
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  backText: {
    ...type.bodySmall,
    color: colors.accentDeep,
  },
  devRow: {
    position: 'absolute',
    bottom: 92,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  devChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  devChipText: {
    ...type.label,
    color: colors.textSecondary,
  },
});
