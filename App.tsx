import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { requestCameraPermissionsAsync } from './modules/expo-pose-detection';
import { configureSessionAudio } from './src/audio/voicePlayer';
import { AssessmentScreen } from './src/screens/AssessmentScreen';
import { LiveSessionScreen } from './src/screens/LiveSessionScreen';

type PermissionState = 'checking' | 'granted' | 'denied';
type Screen = 'assessment' | 'live';

export default function App() {
  const [permission, setPermission] = React.useState<PermissionState>('checking');
  // Audio mode must be configured BEFORE the camera mounts — audio session
  // changes must never interrupt a running camera session.
  const [audioReady, setAudioReady] = React.useState(false);
  const [screen, setScreen] = React.useState<Screen>('assessment');

  React.useEffect(() => {
    requestCameraPermissionsAsync()
      .then((response) => setPermission(response.granted ? 'granted' : 'denied'))
      .catch(() => setPermission('denied'));
    configureSessionAudio()
      .catch((e) => console.warn('[audio] mode configuration failed', e))
      .finally(() => setAudioReady(true));
  }, []);

  const ready = permission === 'granted' && audioReady;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {ready ? (
        <>
          {screen === 'assessment' ? <AssessmentScreen /> : <LiveSessionScreen />}
          {__DEV__ && (
            <Pressable
              style={styles.screenToggle}
              onPress={() => setScreen((s) => (s === 'assessment' ? 'live' : 'assessment'))}
            >
              <Text style={styles.screenToggleText}>
                {screen === 'assessment' ? 'dev view' : 'assessment'}
              </Text>
            </Pressable>
          )}
        </>
      ) : (
        <View style={styles.message}>
          <Text style={styles.text}>
            {permission === 'checking' || !audioReady
              ? 'Getting ready…'
              : 'Camera access is needed to measure your movement. Video is never shown or stored — you appear only as a skeleton outline.'}
          </Text>
        </View>
      )}
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
  screenToggle: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#1A2B1E',
  },
  screenToggleText: {
    color: '#9DB8A4',
    fontSize: 12,
  },
});
