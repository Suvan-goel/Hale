import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClassicPoseRenderer } from './ClassicPoseRenderer';
import { ConstellationPoseRenderer } from './ConstellationPoseRenderer';
import { MatteGraphiteDigitalTwinRenderer } from './MatteGraphiteDigitalTwinRenderer';
import { MediaPipeSkeletonRenderer } from './MediaPipeSkeletonRenderer';
import { PointCloudBodyPoseRenderer } from './PointCloudBodyPoseRenderer';
import {
  POSE_AVATAR_DEBUG_VARIANTS,
  PoseAvatarDebugVariant,
  resolvePoseAvatarConfig,
} from './poseAvatarConfig';
import type { PoseAvatarRendererHandle, PoseAvatarRendererProps } from './poseAvatarTypes';
import { colors, monoFamily, radius, spacing } from '../theme';

export const PoseAvatarRenderer = React.forwardRef<
  PoseAvatarRendererHandle,
  PoseAvatarRendererProps
>(function PoseAvatarRenderer(props, ref) {
  const innerRef = React.useRef<PoseAvatarRendererHandle>(null);
  const baseConfig = React.useMemo(() => resolvePoseAvatarConfig(props), [props]);
  const [debugVariant, setDebugVariant] = React.useState<PoseAvatarDebugVariant | null>(
    baseConfig.debugVariant
  );
  const config = React.useMemo(
    () => resolvePoseAvatarConfig(props, process.env, debugVariant),
    [debugVariant, props]
  );

  React.useImperativeHandle(ref, () => ({
    update(output, sourceAspect) {
      innerRef.current?.update(output, sourceAspect);
    },
  }));

  const rendererProps: PoseAvatarRendererProps = {
    ...props,
    mode: config.mode,
    smoothingEnabled: config.smoothingEnabled,
    adaptiveSmoothingEnabled: config.adaptiveSmoothingEnabled,
    smoothingAlpha: config.smoothingAlpha,
    smoothingMinAlpha: config.smoothingMinAlpha,
    smoothingMaxAlpha: config.smoothingMaxAlpha,
    smoothingSlowSpeedPxPerSec: config.smoothingSlowSpeedPxPerSec,
    smoothingFastSpeedPxPerSec: config.smoothingFastSpeedPxPerSec,
    smoothingSnapFrames: config.smoothingSnapFrames,
    sampledDotsEnabled: config.sampledDotsEnabled,
    maxDots: config.maxDots,
    sampleDensity: config.sampleDensity,
    bodyVolumeEnabled: config.bodyVolumeEnabled,
    torsoVolumeEnabled: config.torsoVolumeEnabled,
    headVolumeEnabled: config.headVolumeEnabled,
    shoulderHipDensityEnabled: config.shoulderHipDensityEnabled,
    maxVolumeDots: config.maxVolumeDots,
    torsoVolumeDots: config.torsoVolumeDots,
    headVolumeDots: config.headVolumeDots,
    shoulderHipDensityDots: config.shoulderHipDensityDots,
    pointCloudBodyEnabled: config.pointCloudBodyEnabled,
    pointCloudBodyDensity: config.pointCloudBodyDensity,
    pointCloudBodyMaxDots: config.pointCloudBodyMaxDots,
    pointCloudBodyShowConnections: config.pointCloudBodyShowConnections,
    pointCloudBodyConnectionOpacity: config.pointCloudBodyConnectionOpacity,
    pointCloudBodyConnectionMaxLines: config.pointCloudBodyConnectionMaxLines,
    pointCloudBodyShowSkeletonLines: config.pointCloudBodyShowSkeletonLines,
    pointCloudBodyShowKeypoints: config.pointCloudBodyShowKeypoints,
    pointCloudBodyDotScale: config.pointCloudBodyDotScale,
    pointCloudBodyOpacity: config.pointCloudBodyOpacity,
    confidenceFadingEnabled: config.confidenceFadingEnabled,
    confidenceIntensityEnabled: config.confidenceIntensityEnabled,
    reacquisitionFadeEnabled: config.reacquisitionFadeEnabled,
    recognitionPulseEnabled: config.recognitionPulseEnabled,
    confidenceAnimationStrength: config.confidenceAnimationStrength,
    measurementStatesEnabled: config.measurementStatesEnabled,
    setupGuidesEnabled: config.setupGuidesEnabled,
    stateTransitionsEnabled: config.stateTransitionsEnabled,
    domainEmphasisEnabled: config.domainEmphasisEnabled,
    scanLineEnabled: config.scanLineEnabled,
    measurementStateIntensity: config.measurementStateIntensity,
    frameSource: config.frameSource,
    lowLatencyMode: config.lowLatencyMode,
    debug: config.debug,
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {config.mode === 'mediapipe_skeleton' ? (
        <MediaPipeSkeletonRenderer ref={innerRef} {...rendererProps} />
      ) : config.mode === 'matte_graphite_digital_twin' ? (
        <MatteGraphiteDigitalTwinRenderer ref={innerRef} {...rendererProps} />
      ) : config.mode === 'point_cloud_body' ? (
        <PointCloudBodyPoseRenderer ref={innerRef} {...rendererProps} />
      ) : config.mode === 'constellation' ? (
        <ConstellationPoseRenderer ref={innerRef} {...rendererProps} />
      ) : (
        <ClassicPoseRenderer ref={innerRef} {...rendererProps} />
      )}
      {__DEV__ && config.debugControlsEnabled ? (
        <PoseAvatarDebugControls
          active={debugVariant}
          onSelect={setDebugVariant}
          lowLatencyMode={config.lowLatencyMode}
        />
      ) : null}
    </View>
  );
});

export type { PoseAvatarRendererHandle, PoseAvatarRendererProps };

function PoseAvatarDebugControls({
  active,
  onSelect,
  lowLatencyMode,
}: {
  active: PoseAvatarDebugVariant | null;
  onSelect: (variant: PoseAvatarDebugVariant | null) => void;
  lowLatencyMode: boolean;
}) {
  return (
    <View style={styles.debugPanel} pointerEvents="box-none">
      <Text style={styles.debugTitle}>
        avatar {lowLatencyMode ? 'low-latency' : 'standard'}
      </Text>
      <View style={styles.debugRow}>
        <DebugButton label="default" active={active === null} onPress={() => onSelect(null)} />
        {POSE_AVATAR_DEBUG_VARIANTS.map((variant) => (
          <DebugButton
            key={variant}
            label={labelForVariant(variant)}
            active={active === variant}
            onPress={() => onSelect(variant)}
          />
        ))}
      </View>
    </View>
  );
}

function DebugButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.debugButton, active && styles.debugButtonActive]}>
      <Text style={[styles.debugButtonText, active && styles.debugButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function labelForVariant(variant: PoseAvatarDebugVariant): string {
  switch (variant) {
    case 'classic':
      return 'classic';
    case 'point-cloud-body':
      return 'body';
    case 'point-cloud-body-connections-on':
      return 'body links';
    case 'point-cloud-body-connections-off':
      return 'body no links';
    case 'point-cloud-body-skeleton-lines-on':
      return 'body bones';
    case 'point-cloud-body-keypoints-off':
      return 'body no joints';
    case 'point-cloud-body-low-latency':
      return 'body low';
    case 'constellation-smoothing-off':
      return 'smooth off';
    case 'constellation-smoothing-on':
      return 'smooth on';
    case 'constellation-sampled-dots-off':
      return 'dots off';
    case 'constellation-sampled-dots-on':
      return 'dots on';
    case 'constellation-volume-off':
      return 'volume off';
    case 'constellation-volume-on':
      return 'volume on';
    case 'constellation-measurement-states-off':
      return 'states off';
    case 'constellation-measurement-states-on':
      return 'states on';
    case 'constellation-setup-guides-off':
      return 'guides off';
    case 'constellation-setup-guides-on':
      return 'guides on';
    case 'constellation-domain-emphasis-off':
      return 'domain off';
    case 'constellation-domain-emphasis-on':
      return 'domain on';
    case 'constellation-low-latency':
      return 'low latency';
  }
}

const styles = StyleSheet.create({
  debugPanel: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    maxWidth: 260,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.debugOverlay,
    gap: spacing.xs,
  },
  debugTitle: {
    color: colors.onAccent,
    fontFamily: monoFamily,
    fontSize: 10,
    lineHeight: 13,
  },
  debugRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  debugButton: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  debugButtonActive: {
    backgroundColor: colors.onAccent,
  },
  debugButtonText: {
    color: colors.onAccent,
    fontFamily: monoFamily,
    fontSize: 10,
  },
  debugButtonTextActive: {
    color: colors.textPrimary,
  },
});
