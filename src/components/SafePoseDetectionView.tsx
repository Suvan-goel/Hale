import * as React from 'react';
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import {
  PoseDetectionView,
  isCameraAvailableAsync,
} from '../../modules/expo-pose-detection';
import type {
  CameraFacing,
  PoseDetectionViewProps,
  PoseErrorEventPayload,
} from '../../modules/expo-pose-detection';
import { resolveSegmentationMaskFigureEnabled } from '../render/segmentationMaskFigureConfig';
import { colors, radius, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

import { BRAND } from '../brand';
export type CameraAvailability = 'checking' | 'available' | 'unavailable';

type SafePoseDetectionViewProps = PoseDetectionViewProps & {
  fallback?: React.ReactNode;
  onAvailabilityChange?: (availability: CameraAvailability) => void;
};

export function SafePoseDetectionView({
  cameraFacing = 'front',
  fallback = null,
  onAvailabilityChange,
  onPoseError,
  segmentationMaskFigureEnabled = resolveSegmentationMaskFigureEnabled(),
  segmentationMaskFigureColor = colors.accentDeep,
  ...props
}: SafePoseDetectionViewProps) {
  const availability = useCameraAvailability(cameraFacing);
  const [nativeUnavailable, setNativeUnavailable] = React.useState(false);
  const resolvedAvailability = nativeUnavailable ? 'unavailable' : availability;

  React.useEffect(() => {
    onAvailabilityChange?.(resolvedAvailability);
  }, [onAvailabilityChange, resolvedAvailability]);

  React.useEffect(() => {
    setNativeUnavailable(false);
  }, [cameraFacing]);

  const handlePoseError = React.useCallback(
    (event: { nativeEvent: PoseErrorEventPayload }) => {
      if (isCameraUnavailableMessage(event.nativeEvent.message)) {
        setNativeUnavailable(true);
      }
      onPoseError?.(event);
    },
    [onPoseError]
  );

  if (resolvedAvailability === 'unavailable') {
    return fallback ? <View style={props.style}>{fallback}</View> : null;
  }

  if (resolvedAvailability === 'checking') {
    return null;
  }

  return (
    <PoseDetectionView
      {...props}
      cameraFacing={cameraFacing}
      segmentationMaskFigureEnabled={segmentationMaskFigureEnabled}
      segmentationMaskFigureColor={segmentationMaskFigureColor}
      onPoseError={handlePoseError}
    />
  );
}

export function CameraUnavailableNotice({
  style,
  compact = false,
}: {
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  const responsive = useResponsiveLayout();
  return (
    <View
      style={[
        styles.notice,
        (compact || responsive.isCompactPhone) && styles.noticeCompact,
        responsive.isCompactPhone && styles.compactCardPadding,
        style,
      ]}
      pointerEvents="none"
    >
      <Text style={styles.noticeTitle}>Camera not available</Text>
      <Text style={styles.noticeBody}>
        {BRAND.appName} could not find a usable camera on this device. You can still review this screen, but measurement needs a device camera.
      </Text>
    </View>
  );
}

function useCameraAvailability(cameraFacing: CameraFacing): CameraAvailability {
  const [availability, setAvailability] = React.useState<CameraAvailability>('checking');

  React.useEffect(() => {
    let cancelled = false;
    setAvailability('checking');
    if (isDevAndroidEmulator()) {
      setAvailability('unavailable');
      return () => {
        cancelled = true;
      };
    }

    // On real devices, the native PoseDetectionView bind is the source of
    // truth. A separate availability probe can be wrong on vendor camera
    // stacks and should not prevent the real camera session from starting.
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      setAvailability('available');
      return () => {
        cancelled = true;
      };
    }

    isCameraAvailableAsync(cameraFacing)
      .then((available) => {
        if (!cancelled) setAvailability(available ? 'available' : 'unavailable');
      })
      .catch(() => {
        if (!cancelled) setAvailability('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [cameraFacing]);

  return availability;
}

function isDevAndroidEmulator(): boolean {
  if (!__DEV__ || Platform.OS !== 'android') {
    return false;
  }

  const constants = Platform.constants as unknown as Record<string, unknown>;
  const deviceValues = [
    constants.Brand,
    constants.Manufacturer,
    constants.Model,
    constants.Fingerprint,
    constants.Device,
    constants.Product,
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.toLowerCase());

  return deviceValues.some(
    (value) =>
      value.includes('emulator') ||
      value.includes('simulator') ||
      value.includes('sdk_gphone') ||
      value.includes('sdk_google') ||
      value.includes('generic') ||
      value.includes('ranchu') ||
      value.includes('goldfish')
  );
}

function isCameraUnavailableMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('camera-bind-failed') ||
    normalized.includes('camera-setup-failed') ||
    normalized.includes('camera input unavailable') ||
    normalized.includes('landmarker-init-failed') ||
    normalized.includes('no camera')
  );
}

const styles = StyleSheet.create({
  notice: {
    flex: 1,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgBase,
  },
  noticeCompact: {
    minHeight: 0,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  noticeTitle: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  noticeBody: {
    ...type.cardCaption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
