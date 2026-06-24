import * as React from 'react';
import {
  AppState,
  Dimensions,
  LayoutChangeEvent,
  Platform,
  SafeAreaView,
  ScaledSize,
  StyleSheet,
  View,
} from 'react-native';

import { getAndroidNavigationModeAsync } from '../../modules/expo-pose-detection';
import type { AndroidNavigationMode } from '../../modules/expo-pose-detection';

export interface SystemInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const ZERO_INSETS: SystemInsets = Object.freeze({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});
const ANDROID_EDGE_TO_EDGE_NAV_BAR_FALLBACK = 48;

interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScreenSize {
  width: number;
  height: number;
}

const SystemInsetsContext = React.createContext<SystemInsets>(ZERO_INSETS);

export function SystemInsetsProvider({ children }: { children: React.ReactNode }) {
  const [containerLayout, setContainerLayout] = React.useState<LayoutRect | null>(null);
  const [safeFrameLayout, setSafeFrameLayout] = React.useState<LayoutRect | null>(null);
  const [androidNavigationMode, setAndroidNavigationMode] =
    React.useState<AndroidNavigationMode>('unknown');
  const [screenSize, setScreenSize] = React.useState<ScreenSize>(() =>
    roundedScreenSize(Dimensions.get('screen'))
  );

  const updateContainerLayout = React.useCallback((event: LayoutChangeEvent) => {
    const next = roundedLayout(event.nativeEvent.layout);
    setContainerLayout((current) => (layoutsEqual(current, next) ? current : next));
  }, []);

  const updateSafeFrameLayout = React.useCallback((event: LayoutChangeEvent) => {
    const next = roundedLayout(event.nativeEvent.layout);
    setSafeFrameLayout((current) => (layoutsEqual(current, next) ? current : next));
  }, []);

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ screen }) => {
      const next = roundedScreenSize(screen);
      setScreenSize((current) => (screenSizesEqual(current, next) ? current : next));
    });
    return () => subscription.remove();
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    let mounted = true;
    const refreshNavigationMode = () => {
      getAndroidNavigationModeAsync()
        .then((mode) => {
          if (mounted) setAndroidNavigationMode(mode);
        })
        .catch(() => {
          if (mounted) setAndroidNavigationMode('unknown');
        });
    };

    refreshNavigationMode();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshNavigationMode();
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const insets = React.useMemo(() => {
    if (!containerLayout || !safeFrameLayout) return ZERO_INSETS;
    const measuredBottom = clampInset(
      containerLayout.height - safeFrameLayout.y - safeFrameLayout.height
    );
    const next = {
      top: clampInset(safeFrameLayout.y),
      right: clampInset(containerLayout.width - safeFrameLayout.x - safeFrameLayout.width),
      bottom:
        Platform.OS === 'android'
          ? androidNavigationBarInset({
              measuredBottom,
              navigationMode: androidNavigationMode,
              containerLayout,
              screenSize,
            })
          : measuredBottom,
      left: clampInset(safeFrameLayout.x),
    };
    return insetValuesEqual(next, ZERO_INSETS) ? ZERO_INSETS : next;
  }, [androidNavigationMode, containerLayout, safeFrameLayout, screenSize]);

  return (
    <SystemInsetsContext.Provider value={insets}>
      <View style={styles.root} onLayout={updateContainerLayout}>
        {children}
        <SafeAreaView pointerEvents="none" style={styles.measureSurface}>
          <View pointerEvents="none" style={styles.measureFrame} onLayout={updateSafeFrameLayout} />
        </SafeAreaView>
      </View>
    </SystemInsetsContext.Provider>
  );
}

export function useSystemInsets(): SystemInsets {
  return React.useContext(SystemInsetsContext);
}

function roundedLayout(layout: LayoutRect): LayoutRect {
  return {
    x: Math.round(layout.x),
    y: Math.round(layout.y),
    width: Math.round(layout.width),
    height: Math.round(layout.height),
  };
}

function roundedScreenSize(size: ScaledSize): ScreenSize {
  return {
    width: Math.round(size.width),
    height: Math.round(size.height),
  };
}

function clampInset(value: number): number {
  return Math.max(0, Math.round(value));
}

function androidNavigationBarInset({
  measuredBottom,
  navigationMode,
  containerLayout,
  screenSize,
}: {
  measuredBottom: number;
  navigationMode: AndroidNavigationMode;
  containerLayout: LayoutRect;
  screenSize: ScreenSize;
}): number {
  if (navigationMode !== 'button') return 0;
  if (measuredBottom > 0) return measuredBottom;
  const containerLongEdge = Math.max(containerLayout.width, containerLayout.height);
  const screenLongEdge = Math.max(screenSize.width, screenSize.height);
  const rootStillFillsScreen = Math.abs(containerLongEdge - screenLongEdge) <= 2;
  return rootStillFillsScreen ? ANDROID_EDGE_TO_EDGE_NAV_BAR_FALLBACK : 0;
}

function layoutsEqual(a: LayoutRect | null, b: LayoutRect): boolean {
  return (
    a !== null &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

function insetValuesEqual(a: SystemInsets, b: SystemInsets): boolean {
  return (
    a.top === b.top &&
    a.right === b.right &&
    a.bottom === b.bottom &&
    a.left === b.left
  );
}

function screenSizesEqual(a: ScreenSize, b: ScreenSize): boolean {
  return a.width === b.width && a.height === b.height;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  measureSurface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
  },
  measureFrame: {
    flex: 1,
  },
});
