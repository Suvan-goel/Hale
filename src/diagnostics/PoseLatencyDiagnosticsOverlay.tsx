import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, monoFamily, radius, spacing } from '../theme';
import type {
  MetricSnapshot,
  PoseLatencyDiagnostics,
  PoseLatencyDiagnosticsSnapshot,
} from './poseLatencyDiagnostics';

export function PoseLatencyDiagnosticsOverlay({
  diagnostics,
}: {
  diagnostics: PoseLatencyDiagnostics | null;
}) {
  const [snapshot, setSnapshot] = React.useState<PoseLatencyDiagnosticsSnapshot | null>(null);

  React.useEffect(() => {
    if (!diagnostics) {
      setSnapshot(null);
      return;
    }
    setSnapshot(diagnostics.snapshot());
    const id = setInterval(() => {
      setSnapshot(diagnostics.snapshot());
    }, 500);
    return () => clearInterval(id);
  }, [diagnostics]);

  if (!diagnostics || !snapshot) return null;

  return (
    <View pointerEvents="none" style={styles.panel}>
      <Text style={styles.title}>pose latency · {snapshot.mode}</Text>
      <Text style={styles.line}>
        events {snapshot.jsEventHz.toFixed(0)}Hz · renderer calls{' '}
        {snapshot.rendererUpdateCallHz.toFixed(0)}Hz · published{' '}
        {snapshot.rendererPublishedHz.toFixed(0)}Hz
      </Text>
      <Text style={styles.line}>
        age receipt {metric(snapshot.approxPoseAgeAtReceiptMs)} · submit{' '}
        {metric(snapshot.approxPoseAgeAtRenderSubmitMs)}
      </Text>
      <Text style={styles.line}>
        native pre {metric(snapshot.nativePreprocessMs)} · mp{' '}
        {metric(snapshot.nativeInferenceWallMs)} · js {metric(snapshot.jsTransformMs)}
      </Text>
      {snapshot.nativeRuntime ? (
        <Text style={styles.line}>
          {snapshot.nativeRuntime.modelAsset ?? 'model?'} ·{' '}
          {snapshot.nativeRuntime.selectedDelegate ?? 'delegate?'} ·{' '}
          {snapshot.nativeRuntime.pipelineMode ?? 'mode?'} ·{' '}
          {snapshot.nativeRuntime.rotationMode ?? 'rotation?'} ·{' '}
          {snapshot.nativeRuntime.analysisTargetWidth ?? '?'}x
          {snapshot.nativeRuntime.analysisTargetHeight ?? '?'}
        </Text>
      ) : null}
      <Text style={styles.line}>
        bitmap {metric(snapshot.nativeBitmapConversionMs)} · rot{' '}
        {metric(snapshot.nativeExplicitRotationMs)} · mpimg{' '}
        {metric(snapshot.nativeMpImageBuildMs)}
      </Text>
      <Text style={styles.line}>
        out-of-order id {snapshot.frameIdOutOfOrder} ts {snapshot.timestampOutOfOrder} · stale{' '}
        {snapshot.staleAtReceipt}/{snapshot.staleAtRenderSubmit}
      </Text>
      <Text style={styles.line}>
        visual coalesced {snapshot.rendererCoalescedFrames} · rejected{' '}
        {snapshot.rendererRejectedFrames} · native coalesced{' '}
        {snapshot.nativeRuntime?.nativeEventCoalescedCount ?? 0}
      </Text>
    </View>
  );
}

function metric(snapshot: MetricSnapshot): string {
  if (snapshot.count === 0 || snapshot.p50 === null || snapshot.p95 === null) {
    return 'n/a';
  }
  return `${snapshot.p50.toFixed(0)}/${snapshot.p95.toFixed(0)}ms`;
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.debugOverlay,
  },
  title: {
    color: colors.onAccent,
    fontFamily: monoFamily,
    fontSize: 10,
    lineHeight: 13,
  },
  line: {
    color: colors.onAccent,
    fontFamily: monoFamily,
    fontSize: 9,
    lineHeight: 12,
  },
});
