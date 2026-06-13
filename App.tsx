import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { requestCameraPermissionsAsync } from './modules/expo-pose-detection';
import { LiveSessionScreen } from './src/screens/LiveSessionScreen';

type PermissionState = 'checking' | 'granted' | 'denied';

export default function App() {
  const [permission, setPermission] = React.useState<PermissionState>('checking');

  React.useEffect(() => {
    requestCameraPermissionsAsync()
      .then((response) => setPermission(response.granted ? 'granted' : 'denied'))
      .catch(() => setPermission('denied'));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {permission === 'granted' ? (
        <LiveSessionScreen />
      ) : (
        <View style={styles.message}>
          <Text style={styles.text}>
            {permission === 'checking'
              ? 'Checking camera access…'
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
});
