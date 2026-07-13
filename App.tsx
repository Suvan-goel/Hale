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
import { StatusBar as NativeStatusBar, StyleSheet, Text, View } from 'react-native';

import { setAndroidNavigationBarVisibleAsync } from './modules/expo-pose-detection';
import { BRAND } from './src/brand';
import { AppBackground } from './src/components/AppBackground';
import { HeaderLogo } from './src/components/HeaderLogo';
import { SystemInsetsProvider } from './src/components/SystemInsetsProvider';
import { AuthProvider, authenticatedUserId, useAuth } from './src/services/backend';
import { initObservability, wrapWithObservability } from './src/services/observability/sentry';
import { AuthScreen } from './src/screens/AuthScreen';
import { ProgrammeV2Root } from './src/screens/ProgrammeV2Root';
import { colors, spacing } from './src/theme';

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
  const authUserId = authenticatedUserId(auth);
  // Guest-first: the app runs without an account on device-local data. The
  // root auth screen appears for password recovery; optional profile sign-in
  // is reachable from Welcome and Settings → Online profile.
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
  return (
    <View style={styles.appChrome}>
      <AppBackground />
      <NativeStatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <StatusBar style="dark" />
      <View style={styles.appChromeContent}>{children}</View>
    </View>
  );
}

function AuthLoadingScreen() {
  return (
    <View style={[styles.container, styles.splash]}>
      <AppBackground />
      <StatusBar style="dark" />
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
    backgroundColor: 'transparent',
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
