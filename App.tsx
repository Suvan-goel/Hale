import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { requestCameraPermissionsAsync } from './modules/expo-pose-detection';
import { configureSessionAudio } from './src/audio/voicePlayer';
import { CheckUp } from './src/checkup';
import { HistoryStore, StoredCheckUp } from './src/history';
import { expoHistoryFs } from './src/history/fsAdapter';
import { AssessmentScreen } from './src/screens/AssessmentScreen';
import { CheckUpScreen } from './src/screens/CheckUpScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LiveSessionScreen } from './src/screens/LiveSessionScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';

type PermissionState = 'checking' | 'granted' | 'denied';
type Screen = 'home' | 'checkup' | 'results' | 'dev-assessment' | 'dev-live';

/** Screens that mount the camera; gated on permission + audio configuration. */
const CAMERA_SCREENS = new Set<Screen>(['checkup', 'dev-assessment', 'dev-live']);

export default function App() {
  const [permission, setPermission] = React.useState<PermissionState>('checking');
  // Audio mode must be configured BEFORE the camera mounts — audio session
  // changes must never interrupt a running camera session.
  const [audioReady, setAudioReady] = React.useState(false);
  const [screen, setScreen] = React.useState<Screen>('home');

  // Local-only history (no accounts/backend in V1). One store for the app,
  // loaded once on launch so Home can show the last check-up immediately and
  // Results has trend data the moment a check-up finishes.
  const [store] = React.useState(() => new HistoryStore(expoHistoryFs));
  const [history, setHistory] = React.useState<StoredCheckUp[]>([]);
  const [lastResult, setLastResult] = React.useState<CheckUp | null>(null);

  React.useEffect(() => {
    requestCameraPermissionsAsync()
      .then((response) => setPermission(response.granted ? 'granted' : 'denied'))
      .catch(() => setPermission('denied'));
    configureSessionAudio()
      .catch((e) => console.warn('[audio] mode configuration failed', e))
      .finally(() => setAudioReady(true));
    store.loadAll().then(setHistory).catch(() => setHistory([]));
  }, [store]);

  const goHome = React.useCallback(() => setScreen('home'), []);

  // A finished battery: persist it, show it, and reload history so its own
  // point appears in the trends. Save is synchronous; the reload feeds trends.
  const handleComplete = React.useCallback(
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

  const viewLast = React.useCallback(() => {
    const latest = history[history.length - 1];
    if (latest) {
      setLastResult(latest.checkUp);
      setScreen('results');
    }
  }, [history]);

  const home = (
    <HomeScreen
      lastCheckUp={history.length > 0 ? history[history.length - 1] : null}
      checkUpCount={history.length}
      onBegin={() => setScreen('checkup')}
      onViewLast={viewLast}
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
        <CheckUpScreen onComplete={handleComplete} />
      ) : screen === 'results' && lastResult ? (
        <ResultsScreen checkUp={lastResult} history={history} onDone={goHome} />
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
