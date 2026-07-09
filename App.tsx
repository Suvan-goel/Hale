/**
 * App root — programme engine v2 is THE app (promoted 2026-07-08; the old
 * engine's shell was decommissioned with promotion commit 2 per
 * docs/pre-promotion-checklist.md).
 *
 * This file owns only app chrome and gates: observability init, the bundled
 * font gate (headings must never flash a fallback face), auth loading and
 * the password-recovery path, and the status-bar backdrop. Everything else
 * lives in ProgrammeV2Root.
 */

import { Fraunces_400Regular, Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, StatusBar as NativeStatusBar, StyleSheet, Text, View } from 'react-native';

import { setAndroidNavigationBarVisibleAsync } from './modules/expo-pose-detection';
import { BRAND } from './src/brand';
import { AppBackground } from './src/components/AppBackground';
import { HeaderLogo } from './src/components/HeaderLogo';
import { SystemInsetsProvider, useSystemInsets } from './src/components/SystemInsetsProvider';
import { AuthProvider, useAuth } from './src/services/backend';
import { initObservability, wrapWithObservability } from './src/services/observability/sentry';
import { AuthScreen } from './src/screens/AuthScreen';
import { ProgrammeV2Root } from './src/screens/ProgrammeV2Root';
import { colors, spacing } from './src/theme';

const STATUS_BAR_BACKDROP_EXTRA_HEIGHT = 8;

initObservability();

function App() {
  return (
    <SystemInsetsProvider>
      <StatusBarBackdrop>
        <AuthProvider>
          <AppGate />
        </AuthProvider>
      </StatusBarBackdrop>
    </SystemInsetsProvider>
  );
}

export default wrapWithObservability(App);

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
  const authUserId =
    typeof auth.user?.id === 'string' && auth.user.id.length > 0 ? auth.user.id : null;
  // Guest-first: the app runs without an account on device-local data. The
  // auth screen appears only for password recovery; signing in (to back up
  // results) lives in Settings → Account.
  const ready = fontsLoaded && !auth.loading && !auth.isPasswordRecovery;

  React.useEffect(() => {
    if (ready) return;
    void setAndroidNavigationBarVisibleAsync(false);
  }, [ready]);

  if (!fontsLoaded || auth.loading || (auth.isSignedIn && authUserId === null)) {
    return <AuthLoadingScreen />;
  }

  if (auth.isPasswordRecovery) {
    return <AuthScreen />;
  }

  // Key by account: switching accounts remounts the shell so no phase or
  // in-memory state leaks between local store scopes.
  return <ProgrammeV2Root key={authUserId ?? 'guest'} />;
}

function StatusBarBackdrop({ children }: { children: React.ReactNode }) {
  const systemInsets = useSystemInsets();
  return (
    <View style={styles.appChrome}>
      <NativeStatusBar
        barStyle="light-content"
        backgroundColor={colors.bgBase}
        translucent={false}
      />
      <StatusBar style="light" />
      <View style={styles.appChromeContent}>{children}</View>
      {Platform.OS === 'ios' ? (
        <View
          pointerEvents="none"
          style={[
            styles.statusBarSafeAreaStrip,
            { height: systemInsets.top + STATUS_BAR_BACKDROP_EXTRA_HEIGHT },
          ]}
        />
      ) : (
        <View
          pointerEvents="none"
          style={[
            styles.statusBarAndroidStrip,
            {
              height: (NativeStatusBar.currentHeight ?? 0) + STATUS_BAR_BACKDROP_EXTRA_HEIGHT,
            },
          ]}
        />
      )}
    </View>
  );
}

function AuthLoadingScreen() {
  return (
    <View style={[styles.container, styles.splash]}>
      <AppBackground />
      <StatusBar style="light" />
      <View style={styles.splashBrandRow}>
        <HeaderLogo size={28} />
        <Text style={styles.splashBrand}>{BRAND.appName}</Text>
      </View>
      <Text style={styles.splashText}>Preparing {BRAND.appName}...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appChrome: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  appChromeContent: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  statusBarSafeAreaStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: colors.bgBase,
  },
  statusBarAndroidStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: colors.bgBase,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  splash: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.pageHorizontal,
  },
  splashBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  splashBrand: {
    color: colors.accentDeep,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
    letterSpacing: 0,
    textAlign: 'center',
    includeFontPadding: false,
  },
  splashText: {
    width: '100%',
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: spacing.sm,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
