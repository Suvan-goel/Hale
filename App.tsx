import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { requestCameraPermissionsAsync } from './modules/expo-pose-detection';
import { configureSessionAudio } from './src/audio/voicePlayer';
import { CheckUp } from './src/checkup';
import { HistoryStore, StoredCheckUp } from './src/history';
import { expoHistoryFs } from './src/history/fsAdapter';
import { scoreCheckUp } from './src/scoring';
import { AssessmentScreen } from './src/screens/AssessmentScreen';
import { CheckUpScreen } from './src/screens/CheckUpScreen';
import { HomeScreen, ActivePlan } from './src/screens/HomeScreen';
import { LiveSessionScreen } from './src/screens/LiveSessionScreen';
import { MicroCheckScreen } from './src/screens/MicroCheckScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { TrainingSessionScreen } from './src/screens/TrainingSessionScreen';
import {
  EquipmentProfile,
  MicroCheckResult,
  TrainingState,
  TrainingStore,
  TrainingSessionResult,
  buildBlock,
  defaultTrainingState,
  microCheckTrendPoints,
  nextSessionExercises,
  nextSessionPlan,
  recordCompletedSession,
  retestDue,
  startBlock,
  totalSessions,
} from './src/training';

type PermissionState = 'checking' | 'granted' | 'denied';
type Screen = 'home' | 'checkup' | 'results' | 'training' | 'microcheck' | 'dev-assessment' | 'dev-live';

/** Screens that mount the camera; gated on permission + audio configuration. */
const CAMERA_SCREENS = new Set<Screen>(['checkup', 'training', 'microcheck', 'dev-assessment', 'dev-live']);

export default function App() {
  const [permission, setPermission] = React.useState<PermissionState>('checking');
  // Audio mode must be configured BEFORE the camera mounts — audio session
  // changes must never interrupt a running camera session.
  const [audioReady, setAudioReady] = React.useState(false);
  const [screen, setScreen] = React.useState<Screen>('home');

  // Local-only stores (no accounts/backend in V1), loaded once on launch.
  const [store] = React.useState(() => new HistoryStore(expoHistoryFs));
  const [trainingStore] = React.useState(() => new TrainingStore(expoHistoryFs));
  const [history, setHistory] = React.useState<StoredCheckUp[]>([]);
  const [lastResult, setLastResult] = React.useState<CheckUp | null>(null);
  const [training, setTraining] = React.useState<TrainingState>(() => defaultTrainingState());
  const [microChecks, setMicroChecks] = React.useState<MicroCheckResult[]>([]);
  // The exercise ids of the session about to run (resolved at launch).
  const [sessionIds, setSessionIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    requestCameraPermissionsAsync()
      .then((response) => setPermission(response.granted ? 'granted' : 'denied'))
      .catch(() => setPermission('denied'));
    configureSessionAudio()
      .catch((e) => console.warn('[audio] mode configuration failed', e))
      .finally(() => setAudioReady(true));
    store.loadAll().then(setHistory).catch(() => setHistory([]));
    trainingStore.loadState().then(setTraining).catch(() => {});
    trainingStore.loadMicroChecks().then(setMicroChecks).catch(() => {});
  }, [store, trainingStore]);

  const goHome = React.useCallback(() => setScreen('home'), []);

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

  // A finished check-up: persist it, show it, reload history (feeds trends).
  const handleCheckUpComplete = React.useCallback(
    (checkUp: CheckUp) => {
      try {
        store.save(checkUp);
      } catch (e) {
        console.warn('[history] save failed', e);
      }
      setLastResult(checkUp);
      setScreen('results');
      store.loadAll().then(setHistory).catch(() => {});
    },
    [store]
  );

  // From Results: build a block biased to the weakest domain and begin it.
  const handleStartPlan = React.useCallback(() => {
    if (!lastResult) return;
    const score = scoreCheckUp(lastResult);
    const block = buildBlock(score, training.equipment, new Date().toISOString());
    persistTraining(startBlock(training, block));
    setScreen('home');
  }, [lastResult, training, persistTraining]);

  const handleStartSession = React.useCallback(() => {
    const ids = nextSessionExercises(training);
    if (!ids || ids.length === 0) return;
    setSessionIds(ids);
    setScreen('training');
  }, [training]);

  const handleSessionComplete = React.useCallback(
    (result: TrainingSessionResult) => {
      persistTraining(recordCompletedSession(training, result, new Date().toISOString()));
      setScreen('home');
    },
    [training, persistTraining]
  );

  const handleMicroCheckComplete = React.useCallback(
    (result: MicroCheckResult) => {
      try {
        trainingStore.saveMicroCheck(result);
      } catch (e) {
        console.warn('[training] micro-check save failed', e);
      }
      setMicroChecks((prev) => [...prev, result]);
      setScreen('home');
    },
    [trainingStore]
  );

  const toggleEquipment = React.useCallback(
    (key: keyof EquipmentProfile) => {
      persistTraining({ ...training, equipment: { ...training.equipment, [key]: !training.equipment[key] } });
    },
    [training, persistTraining]
  );

  const viewLast = React.useCallback(() => {
    const latest = history[history.length - 1];
    if (latest) {
      setLastResult(latest.checkUp);
      setScreen('results');
    }
  }, [history]);

  // The next session of an active, unfinished block (for Home's "This week" card).
  const plan: ActivePlan | null = React.useMemo(() => {
    const next = nextSessionPlan(training);
    if (!next || !training.block) return null;
    return {
      week: next.week,
      sessionNumber: training.progress.completedSessions + 1,
      totalSessions: totalSessions(training.block),
    };
  }, [training]);

  const extraTrendPoints = React.useMemo(() => microCheckTrendPoints(microChecks), [microChecks]);

  const home = (
    <HomeScreen
      lastCheckUp={history.length > 0 ? history[history.length - 1] : null}
      checkUpCount={history.length}
      plan={plan}
      retestDue={retestDue(training)}
      equipment={training.equipment}
      onBegin={() => setScreen('checkup')}
      onViewLast={viewLast}
      onStartSession={handleStartSession}
      onMicroCheck={() => setScreen('microcheck')}
      onToggleEquipment={toggleEquipment}
    />
  );

  const cameraReady = permission === 'granted' && audioReady;

  // Camera screens need permission + audio first; everything else renders freely.
  if (CAMERA_SCREENS.has(screen) && !cameraReady) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {screen === 'checkup' ? (
        <CheckUpScreen onComplete={handleCheckUpComplete} />
      ) : screen === 'results' && lastResult ? (
        <ResultsScreen
          checkUp={lastResult}
          history={history}
          extraTrendPoints={extraTrendPoints}
          onDone={goHome}
          onStartPlan={handleStartPlan}
        />
      ) : screen === 'training' && sessionIds.length > 0 ? (
        <TrainingSessionScreen exerciseIds={sessionIds} onComplete={handleSessionComplete} />
      ) : screen === 'microcheck' ? (
        <MicroCheckScreen type="chair-power" onComplete={handleMicroCheckComplete} />
      ) : screen === 'dev-assessment' ? (
        <AssessmentScreen />
      ) : screen === 'dev-live' ? (
        <LiveSessionScreen />
      ) : (
        home
      )}

      {__DEV__ && screen === 'home' ? (
        <View style={styles.devRow}>
          <Pressable style={styles.devChip} onPress={() => setScreen('dev-assessment')}>
            <Text style={styles.devChipText}>dev: chair stand</Text>
          </Pressable>
          <Pressable style={styles.devChip} onPress={() => setScreen('dev-live')}>
            <Text style={styles.devChipText}>dev: live view</Text>
          </Pressable>
        </View>
      ) : null}
      {__DEV__ && (screen === 'dev-assessment' || screen === 'dev-live') ? (
        <Pressable style={styles.back} onPress={goHome}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  text: {
    color: '#E8F4EA',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  back: {
    position: 'absolute',
    top: 56,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1A2B1E',
  },
  backText: {
    color: '#9DB8A4',
    fontSize: 14,
  },
  devRow: {
    position: 'absolute',
    bottom: 18,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  devChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#1A2B1E',
  },
  devChipText: {
    color: '#9DB8A4',
    fontSize: 12,
  },
});
