import * as React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type {
  AndroidPoseAnalysisResolution,
  AndroidPosePipelineMode,
  AndroidPoseRotationMode,
  LandmarksEventPayload,
} from '../../modules/expo-pose-detection';
import {
  CameraUnavailableNotice,
  SafePoseDetectionView,
} from '../components/SafePoseDetectionView';
import type { CameraAvailability } from '../components/SafePoseDetectionView';
import { PoseLatencyDiagnosticsOverlay } from '../diagnostics/PoseLatencyDiagnosticsOverlay';
import {
  createPoseLatencyDiagnostics,
  isPoseLatencyDiagnosticsEnabled,
  type PoseLatencyDiagnostics,
  type PoseLatencyDiagnosticsSnapshot,
  type PoseNativeRuntimeSnapshot,
} from '../diagnostics/poseLatencyDiagnostics';
import { PosePipeline } from '../pose/pipeline';
import { SkeletonView, type SkeletonViewHandle } from '../render/SkeletonView';
import type {
  PoseAvatarRendererProps,
  PoseAvatarRendererScheduleEvent,
} from '../render/poseAvatarTypes';
import { colors, monoFamily, radius, spacing, type } from '../theme';

type BenchmarkModeId =
  | 'no-overlay'
  | 'raw-skeleton'
  | 'matte-graphite-digital-twin'
  | 'minimal-constellation'
  | 'full-constellation'
  | 'point-cloud-225'
  | 'point-cloud-450'
  | 'point-cloud-900'
  | 'production-point-cloud'
  | 'production-point-cloud-no-transitions';

interface BenchmarkMode {
  id: BenchmarkModeId;
  title: string;
  subtitle: string;
  configuredDotCount: number | null;
  configuredShapeCount?: number | null;
  rendererProps: PoseAvatarRendererProps | null;
}

interface RendererStats {
  scheduledFrames: number;
  publishedFrames: number;
  coalescedFrames: number;
  rejectedFrames: number;
  cancelledFrames: number;
  totalDots: number;
  maxDots: number;
  totalLines: number;
  maxLines: number;
  shapeMetricFrames: number;
  totalShapes: number;
  maxShapes: number;
  totalDynamicPaths: number;
  maxDynamicPaths: number;
  totalStaticTransformedShapes: number;
  maxStaticTransformedShapes: number;
  surfaceMetricFrames: number;
  totalSurfacePathCount: number;
  maxSurfacePathCount: number;
  totalInternalControlVertexCount: number;
  maxInternalControlVertexCount: number;
  lastSurfacePathCount: number;
  lastInternalControlVertexCount: number;
  lastProportionCalibrationComplete: boolean;
  lastProportionCalibrationState: string | null;
}

type NativeProfileId =
  | 'video-rotated-640'
  | 'live-rotated-640'
  | 'live-metadata-640'
  | 'live-metadata-512'
  | 'live-metadata-480';

interface NativeProfile {
  id: NativeProfileId;
  title: string;
  subtitle: string;
  pipelineMode: AndroidPosePipelineMode;
  rotationMode: AndroidPoseRotationMode;
  analysisResolution: AndroidPoseAnalysisResolution;
}

interface BenchmarkResult {
  schemaVersion: 1;
  capturedAt: string;
  device: Record<string, unknown>;
  build: Record<string, unknown>;
  mode: BenchmarkMode;
  nativeProfile: NativeProfile;
  durationMs: number;
  diagnostics: PoseLatencyDiagnosticsSnapshot;
  renderer: {
    averageDotCount: number | null;
    maxDotCount: number;
    averageLineCount: number | null;
    maxLineCount: number;
    scheduledFrameCount: number;
    publishedFrameCount: number;
    coalescedFrameCount: number;
    rejectedFrameCount: number;
    cancelledFrameCount: number;
    averageShapeCount: number | null;
    maxShapeCount: number;
    averageDynamicPathCount: number | null;
    maxDynamicPathCount: number;
    averageStaticTransformedShapeCount: number | null;
    maxStaticTransformedShapeCount: number;
    averageSurfacePathCount: number | null;
    maxSurfacePathCount: number;
    averageInternalVertexCount: number | null;
    maxInternalVertexCount: number;
    proportionCalibrationComplete: boolean;
    latestDisplayedFrameId: null;
  };
  unavailableMetrics: string[];
}

const BENCHMARK_MODES: readonly BenchmarkMode[] = [
  {
    id: 'no-overlay',
    title: 'No overlay',
    subtitle: 'Camera and pipeline only',
    configuredDotCount: 0,
    rendererProps: null,
  },
  {
    id: 'raw-skeleton',
    title: 'Raw skeleton',
    subtitle: 'Classic paths from raw landmarks',
    configuredDotCount: 0,
    rendererProps: {
      mode: 'classic',
      frameSource: 'raw',
      fit: 'contain',
    },
  },
  {
    id: 'matte-graphite-digital-twin',
    title: 'Matte graphite digital twin',
    subtitle: 'Continuous low-complexity body surface',
    configuredDotCount: 0,
    configuredShapeCount: 8,
    rendererProps: {
      mode: 'matte_graphite_digital_twin',
      frameSource: 'raw',
      fit: 'contain',
      smoothingEnabled: false,
      confidenceFadingEnabled: false,
      confidenceIntensityEnabled: false,
      reacquisitionFadeEnabled: false,
      recognitionPulseEnabled: false,
      measurementStatesEnabled: false,
      setupGuidesEnabled: false,
      stateTransitionsEnabled: false,
      domainEmphasisEnabled: false,
      scanLineEnabled: false,
    },
  },
  {
    id: 'minimal-constellation',
    title: 'Minimal constellation',
    subtitle: 'Core dots and lines, no volume',
    configuredDotCount: 64,
    rendererProps: {
      mode: 'constellation',
      frameSource: 'raw',
      fit: 'contain',
      smoothingEnabled: false,
      sampledDotsEnabled: true,
      maxDots: 64,
      sampleDensity: 0.35,
      bodyVolumeEnabled: false,
      torsoVolumeEnabled: false,
      headVolumeEnabled: false,
      confidenceFadingEnabled: false,
      confidenceIntensityEnabled: false,
      reacquisitionFadeEnabled: false,
      recognitionPulseEnabled: false,
      measurementStatesEnabled: false,
      setupGuidesEnabled: false,
      stateTransitionsEnabled: false,
      domainEmphasisEnabled: false,
      scanLineEnabled: false,
    },
  },
  {
    id: 'full-constellation',
    title: 'Full constellation',
    subtitle: 'Dots, torso/head volume, normal styling',
    configuredDotCount: 330,
    rendererProps: {
      mode: 'constellation',
      frameSource: 'raw',
      fit: 'contain',
      smoothingEnabled: false,
      sampledDotsEnabled: true,
      maxDots: 180,
      sampleDensity: 0.82,
      bodyVolumeEnabled: true,
      torsoVolumeEnabled: true,
      headVolumeEnabled: true,
      maxVolumeDots: 150,
      torsoVolumeDots: 86,
      headVolumeDots: 22,
      confidenceFadingEnabled: false,
      confidenceIntensityEnabled: false,
      reacquisitionFadeEnabled: false,
      recognitionPulseEnabled: false,
      setupGuidesEnabled: false,
      stateTransitionsEnabled: false,
    },
  },
  pointCloudMode('point-cloud-225', 'Point cloud 225', 225, false),
  pointCloudMode('point-cloud-450', 'Point cloud 450', 450, false),
  pointCloudMode('point-cloud-900', 'Point cloud 900', 900, false),
  productionPointCloudMode('production-point-cloud', 'Production point cloud', false),
  productionPointCloudMode(
    'production-point-cloud-no-transitions',
    'Production, no transitions',
    true
  ),
];

const NATIVE_PROFILES: readonly NativeProfile[] = [
  {
    id: 'video-rotated-640',
    title: 'VIDEO rot 640',
    subtitle: 'detectForVideo, bitmap rotation',
    pipelineMode: 'full-video-sync',
    rotationMode: 'rotated-bitmap',
    analysisResolution: '640x480',
  },
  {
    id: 'live-rotated-640',
    title: 'LIVE rot 640',
    subtitle: 'detectAsync, bitmap rotation',
    pipelineMode: 'full-live-stream',
    rotationMode: 'rotated-bitmap',
    analysisResolution: '640x480',
  },
  {
    id: 'live-metadata-640',
    title: 'LIVE meta 640',
    subtitle: 'detectAsync, rotation metadata',
    pipelineMode: 'full-live-stream',
    rotationMode: 'metadata',
    analysisResolution: '640x480',
  },
  {
    id: 'live-metadata-512',
    title: 'LIVE meta 512',
    subtitle: '512x384 analysis',
    pipelineMode: 'full-live-stream',
    rotationMode: 'metadata',
    analysisResolution: '512x384',
  },
  {
    id: 'live-metadata-480',
    title: 'LIVE meta 480',
    subtitle: '480x360 analysis',
    pipelineMode: 'full-live-stream',
    rotationMode: 'metadata',
    analysisResolution: '480x360',
  },
];

export function PoseOverlayBenchmarkScreen({ onBack }: { onBack?: () => void }) {
  const diagnosticsAllowed = isPoseLatencyDiagnosticsEnabled();
  const [modeId, setModeId] = React.useState<BenchmarkModeId>('raw-skeleton');
  const mode = BENCHMARK_MODES.find((candidate) => candidate.id === modeId) ?? BENCHMARK_MODES[1];
  const [nativeProfileId, setNativeProfileId] =
    React.useState<NativeProfileId>('video-rotated-640');
  const nativeProfile =
    NATIVE_PROFILES.find((candidate) => candidate.id === nativeProfileId) ?? NATIVE_PROFILES[0];
  const [pipeline] = React.useState(() => new PosePipeline());
  const skeletonRef = React.useRef<SkeletonViewHandle>(null);
  const [cameraAvailability, setCameraAvailability] =
    React.useState<CameraAvailability>('checking');
  const [diagnostics, setDiagnostics] = React.useState<PoseLatencyDiagnostics | null>(() =>
    diagnosticsAllowed ? createPoseLatencyDiagnostics({ mode: 'benchmark' }) : null
  );
  const diagnosticsRef = React.useRef<PoseLatencyDiagnostics | null>(diagnostics);
  const rendererStatsRef = React.useRef<RendererStats>(emptyRendererStats());
  const [snapshot, setSnapshot] = React.useState<PoseLatencyDiagnosticsSnapshot | null>(null);
  const [resultJson, setResultJson] = React.useState<string>('');
  const [running, setRunning] = React.useState(false);
  const [rendererEpoch, setRendererEpoch] = React.useState(0);
  const stopTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const runStartedAtRef = React.useRef<number | null>(null);
  const runDurationRef = React.useRef(0);

  const resetBenchmarkWindow = React.useCallback(() => {
    if (!diagnosticsAllowed) return;
    rendererStatsRef.current = emptyRendererStats();
    const nextDiagnostics = createPoseLatencyDiagnostics({ mode: 'benchmark' });
    diagnosticsRef.current = nextDiagnostics;
    setDiagnostics(nextDiagnostics);
    setSnapshot(nextDiagnostics.snapshot());
    setResultJson('');
    setRendererEpoch((value) => value + 1);
  }, [diagnosticsAllowed]);

  React.useEffect(() => {
    diagnosticsRef.current = diagnostics;
  }, [diagnostics]);

  React.useEffect(() => {
    setSnapshot(diagnostics?.snapshot() ?? null);
    const id = setInterval(() => {
      setSnapshot(diagnosticsRef.current?.snapshot() ?? null);
    }, 500);
    return () => clearInterval(id);
  }, [diagnostics]);

  React.useEffect(() => {
    resetBenchmarkWindow();
    pipeline.reset();
  }, [modeId, nativeProfileId, pipeline, resetBenchmarkWindow]);

  React.useEffect(
    () => () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    },
    []
  );

  const stopMeasurement = React.useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    setRunning(false);
    const currentDiagnostics = diagnosticsRef.current;
    if (!currentDiagnostics) return;
    const durationMs =
      runDurationRef.current ||
      (runStartedAtRef.current === null ? 0 : Date.now() - runStartedAtRef.current);
    const result = buildBenchmarkResult({
      mode,
      nativeProfile,
      durationMs,
      snapshot: currentDiagnostics.snapshot(),
      rendererStats: rendererStatsRef.current,
    });
    setResultJson(JSON.stringify(result, null, 2));
  }, [mode, nativeProfile]);

  const startMeasurement = React.useCallback(
    (durationMs: number) => {
      resetBenchmarkWindow();
      runStartedAtRef.current = Date.now();
      runDurationRef.current = durationMs;
      setRunning(true);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = setTimeout(stopMeasurement, durationMs);
    },
    [resetBenchmarkWindow, stopMeasurement]
  );

  const onLandmarks = React.useCallback(
    (event: { nativeEvent: LandmarksEventPayload }) => {
      const nativeEvent = event.nativeEvent;
      const currentDiagnostics = diagnosticsRef.current;
      const frameToken = currentDiagnostics?.beginFrame(nativeEvent) ?? null;
      const out = pipeline.process(nativeEvent);
      currentDiagnostics?.markJsTransformEnd(frameToken);
      if (mode.rendererProps) {
        skeletonRef.current?.update(out, nativeEvent.sourceWidth / nativeEvent.sourceHeight);
        currentDiagnostics?.markRendererUpdateSubmitted(frameToken);
      }
    },
    [mode.rendererProps, pipeline]
  );

  const onRendererScheduleEvent = React.useCallback((event: PoseAvatarRendererScheduleEvent) => {
    const currentDiagnostics = diagnosticsRef.current;
    if (event.type === 'scheduled') {
      rendererStatsRef.current.scheduledFrames++;
    } else if (event.type === 'published') {
      const stats = rendererStatsRef.current;
      stats.publishedFrames++;
      const dotCount = event.dotCount ?? 0;
      const lineCount = event.lineCount ?? 0;
      stats.totalDots += dotCount;
      stats.totalLines += lineCount;
      stats.maxDots = Math.max(stats.maxDots, dotCount);
      stats.maxLines = Math.max(stats.maxLines, lineCount);
      if (typeof event.shapeCount === 'number') {
        stats.shapeMetricFrames++;
        stats.totalShapes += event.shapeCount;
        stats.maxShapes = Math.max(stats.maxShapes, event.shapeCount);
      }
      if (typeof event.dynamicPathCount === 'number') {
        stats.totalDynamicPaths += event.dynamicPathCount;
        stats.maxDynamicPaths = Math.max(stats.maxDynamicPaths, event.dynamicPathCount);
      }
      if (typeof event.staticTransformedShapeCount === 'number') {
        stats.totalStaticTransformedShapes += event.staticTransformedShapeCount;
        stats.maxStaticTransformedShapes = Math.max(
          stats.maxStaticTransformedShapes,
          event.staticTransformedShapeCount
        );
      }
      if (typeof event.surfacePathCount === 'number') {
        stats.surfaceMetricFrames++;
        stats.totalSurfacePathCount += event.surfacePathCount;
        stats.maxSurfacePathCount = Math.max(stats.maxSurfacePathCount, event.surfacePathCount);
        stats.lastSurfacePathCount = event.surfacePathCount;
      }
      if (typeof event.internalControlVertexCount === 'number') {
        stats.totalInternalControlVertexCount += event.internalControlVertexCount;
        stats.maxInternalControlVertexCount = Math.max(
          stats.maxInternalControlVertexCount,
          event.internalControlVertexCount
        );
        stats.lastInternalControlVertexCount = event.internalControlVertexCount;
      }
      if (typeof event.proportionCalibrationComplete === 'boolean') {
        stats.lastProportionCalibrationComplete = event.proportionCalibrationComplete;
      }
      if (typeof event.proportionCalibrationState === 'string') {
        stats.lastProportionCalibrationState = event.proportionCalibrationState;
      }
      currentDiagnostics?.markRendererPublished(event.geometryMs);
    } else if (event.type === 'coalesced') {
      rendererStatsRef.current.coalescedFrames++;
      currentDiagnostics?.markRendererCoalesced();
    } else if (event.type === 'rejected') {
      rendererStatsRef.current.rejectedFrames++;
      currentDiagnostics?.markRendererRejected();
    } else if (event.type === 'cancelled') {
      rendererStatsRef.current.cancelledFrames++;
    }
  }, []);

  const exportJson = React.useCallback(() => {
    if (!resultJson) return;
    void Share.share({
      message: resultJson,
      title: 'Hale pose overlay benchmark',
    });
  }, [resultJson]);

  if (!diagnosticsAllowed) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pose benchmark disabled</Text>
        <Text style={styles.body}>
          Set EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=1 and rebuild to open this screen.
        </Text>
        {onBack ? <BenchmarkButton label="Back" onPress={onBack} /> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafePoseDetectionView
        active
        modelVariant="full"
        latencyDiagnosticsEnabled
        androidPipelineMode={nativeProfile.pipelineMode}
        androidRotationMode={nativeProfile.rotationMode}
        androidAnalysisResolution={nativeProfile.analysisResolution}
        style={StyleSheet.absoluteFill}
        onLandmarks={onLandmarks}
        onAvailabilityChange={setCameraAvailability}
      />
      {cameraAvailability === 'unavailable' ? (
        <CameraUnavailableNotice />
      ) : mode.rendererProps ? (
        <SkeletonView
          key={`${mode.id}-${rendererEpoch}`}
          ref={skeletonRef}
          mirrored
          {...mode.rendererProps}
          onRendererScheduleEvent={onRendererScheduleEvent}
        />
      ) : null}

      <View style={styles.topPanel} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Pose overlay benchmark</Text>
            <Text style={styles.title}>{mode.title}</Text>
          </View>
          {onBack ? <BenchmarkButton label="Back" onPress={onBack} compact /> : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeRow}
        >
          {BENCHMARK_MODES.map((candidate) => (
            <ModeButton
              key={candidate.id}
              mode={candidate}
              selected={candidate.id === mode.id}
              disabled={running}
              onPress={() => setModeId(candidate.id)}
            />
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeRow}
        >
          {NATIVE_PROFILES.map((candidate) => (
            <NativeProfileButton
              key={candidate.id}
              profile={candidate}
              selected={candidate.id === nativeProfile.id}
              disabled={running}
              onPress={() => setNativeProfileId(candidate.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.buttonRow}>
          <BenchmarkButton
            label={running ? 'Running 30s' : 'Run 30s'}
            onPress={() => startMeasurement(30_000)}
            disabled={running}
          />
          <BenchmarkButton
            label={running ? 'Running 60s' : 'Run 60s'}
            onPress={() => startMeasurement(60_000)}
            disabled={running}
          />
          <BenchmarkButton
            label={running ? 'Running 10m' : 'Run 10m'}
            onPress={() => startMeasurement(600_000)}
            disabled={running}
          />
          <BenchmarkButton label="Stop" onPress={stopMeasurement} disabled={!running} />
          <BenchmarkButton label="Export JSON" onPress={exportJson} disabled={!resultJson} />
        </View>
        {snapshot ? (
          <>
            <MetricsStrip snapshot={snapshot} />
            <RendererMetricsStrip mode={mode} stats={rendererStatsRef.current} />
            <NativeRuntimeStrip runtime={snapshot.nativeRuntime} />
          </>
        ) : null}
        {resultJson ? (
          <TextInput
            value={resultJson}
            editable={false}
            multiline
            selectTextOnFocus
            style={styles.resultBox}
          />
        ) : null}
      </View>

      <PoseLatencyDiagnosticsOverlay diagnostics={diagnostics} />
    </View>
  );
}

function pointCloudMode(
  id: BenchmarkModeId,
  title: string,
  maxDots: number,
  disableTransitions: boolean
): BenchmarkMode {
  return {
    id,
    title,
    subtitle: disableTransitions ? 'Production geometry, transitions off' : `${maxDots} dot cap`,
    configuredDotCount: maxDots,
    rendererProps: {
      mode: 'point_cloud_body',
      frameSource: 'raw',
      fit: 'contain',
      smoothingEnabled: false,
      pointCloudBodyDensity: 'high',
      pointCloudBodyMaxDots: maxDots,
      pointCloudBodyDotScale: 1.72,
      pointCloudBodyShowConnections: false,
      pointCloudBodyShowSkeletonLines: false,
      pointCloudBodyShowKeypoints: true,
      confidenceFadingEnabled: !disableTransitions,
      confidenceIntensityEnabled: !disableTransitions,
      reacquisitionFadeEnabled: !disableTransitions,
      recognitionPulseEnabled: false,
      measurementStatesEnabled: !disableTransitions,
      setupGuidesEnabled: false,
      stateTransitionsEnabled: !disableTransitions,
      domainEmphasisEnabled: !disableTransitions,
      scanLineEnabled: false,
    },
  };
}

function productionPointCloudMode(
  id: BenchmarkModeId,
  title: string,
  disableAllTransitions: boolean
): BenchmarkMode {
  return {
    id,
    title,
    subtitle: disableAllTransitions
      ? 'Production plus all transitions off'
      : 'Matches session screens',
    configuredDotCount: 900,
    rendererProps: {
      mode: 'point_cloud_body',
      frameSource: 'raw',
      fit: 'contain',
      smoothingEnabled: false,
      pointCloudBodyDensity: 'high',
      pointCloudBodyMaxDots: 900,
      pointCloudBodyDotScale: 1.72,
      pointCloudBodyShowConnections: false,
      pointCloudBodyShowSkeletonLines: false,
      pointCloudBodyShowKeypoints: true,
      confidenceFadingEnabled: false,
      confidenceIntensityEnabled: false,
      reacquisitionFadeEnabled: false,
      recognitionPulseEnabled: false,
      setupGuidesEnabled: false,
      stateTransitionsEnabled: false,
      measurementStatesEnabled: !disableAllTransitions,
      domainEmphasisEnabled: !disableAllTransitions,
      scanLineEnabled: false,
    },
  };
}

function MetricsStrip({ snapshot }: { snapshot: PoseLatencyDiagnosticsSnapshot }) {
  return (
    <View style={styles.metricsStrip}>
      <Metric label="JS Hz" value={snapshot.jsEventHz.toFixed(0)} />
      <Metric label="Req Hz" value={snapshot.rendererUpdateCallHz.toFixed(0)} />
      <Metric label="Pub Hz" value={snapshot.rendererPublishedHz.toFixed(0)} />
      <Metric label="Age p95" value={metricValue(snapshot.approxPoseAgeAtRenderSubmitMs.p95)} />
      <Metric label="MP p95" value={metricValue(snapshot.nativeInferenceWallMs.p95)} />
      <Metric label="Bmp p95" value={metricValue(snapshot.nativeBitmapConversionMs.p95)} />
      <Metric label="Rot p95" value={metricValue(snapshot.nativeExplicitRotationMs.p95)} />
      <Metric label="Geo p95" value={metricValue(snapshot.geometryMs.p95)} />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function NativeRuntimeStrip({ runtime }: { runtime: PoseNativeRuntimeSnapshot | null }) {
  if (!runtime) return null;
  return (
    <View style={styles.metricsStrip}>
      <RuntimeMetric label="Model" value={runtimeValue(runtime.modelAsset)} wide />
      <RuntimeMetric label="Requested" value={runtimeValue(runtime.requestedDelegate)} />
      <RuntimeMetric label="Selected" value={runtimeValue(runtime.selectedDelegate)} />
      <RuntimeMetric label="GPU fallback" value={yesNo(runtime.gpuDelegateFallback)} />
      <RuntimeMetric label="Facing" value={runtimeValue(runtime.cameraFacing)} />
      <RuntimeMetric
        label="Analysis"
        value={dims(runtime.analysisTargetWidth, runtime.analysisTargetHeight)}
      />
      <RuntimeMetric label="TS source" value={runtimeValue(runtime.sensorTimestampSourceName)} />
    </View>
  );
}

function RendererMetricsStrip({
  mode,
  stats,
}: {
  mode: BenchmarkMode;
  stats: RendererStats;
}) {
  if (mode.id !== 'matte-graphite-digital-twin') return null;
  return (
    <View style={styles.metricsStrip}>
      <Metric label="Paths" value={String(stats.lastSurfacePathCount)} />
      <Metric label="Ctrl verts" value={String(stats.lastInternalControlVertexCount)} />
      <Metric
        label="Cal"
        value={
          stats.lastProportionCalibrationState ??
          (stats.lastProportionCalibrationComplete ? 'locked' : 'fallback')
        }
      />
    </View>
  );
}

function RuntimeMetric({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.metric, styles.runtimeMetric, wide && styles.runtimeMetricWide]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.runtimeMetricValue}>{value}</Text>
    </View>
  );
}

function metricValue(value: number | null): string {
  return value === null ? 'n/a' : `${value.toFixed(0)}ms`;
}

function runtimeValue(value: string | null): string {
  return value && value.length > 0 ? value : '?';
}

function yesNo(value: boolean | null): string {
  return value === null ? '?' : value ? 'yes' : 'no';
}

function dims(width: number | null, height: number | null): string {
  if (width === null || height === null) return '?x?';
  return `${width}x${height}`;
}

function ModeButton({
  mode,
  selected,
  disabled,
  onPress,
}: {
  mode: BenchmarkMode;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.modeButton,
        selected && styles.modeButtonSelected,
        pressed && !disabled && styles.pressed,
        disabled && !selected && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <Text style={[styles.modeTitle, selected && styles.modeTitleSelected]}>{mode.title}</Text>
      <Text style={[styles.modeSubtitle, selected && styles.modeSubtitleSelected]}>
        {mode.subtitle}
      </Text>
    </Pressable>
  );
}

function NativeProfileButton({
  profile,
  selected,
  disabled,
  onPress,
}: {
  profile: NativeProfile;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.modeButton,
        selected && styles.modeButtonSelected,
        pressed && !disabled && styles.pressed,
        disabled && !selected && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
    >
      <Text style={[styles.modeTitle, selected && styles.modeTitleSelected]}>
        {profile.title}
      </Text>
      <Text style={[styles.modeSubtitle, selected && styles.modeSubtitleSelected]}>
        {profile.subtitle}
      </Text>
    </Pressable>
  );
}

function BenchmarkButton({
  label,
  onPress,
  disabled = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityState={disabled ? { disabled } : undefined}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function emptyRendererStats(): RendererStats {
  return {
    scheduledFrames: 0,
    publishedFrames: 0,
    coalescedFrames: 0,
    rejectedFrames: 0,
    cancelledFrames: 0,
    totalDots: 0,
    maxDots: 0,
    totalLines: 0,
    maxLines: 0,
    shapeMetricFrames: 0,
    totalShapes: 0,
    maxShapes: 0,
    totalDynamicPaths: 0,
    maxDynamicPaths: 0,
    totalStaticTransformedShapes: 0,
    maxStaticTransformedShapes: 0,
    surfaceMetricFrames: 0,
    totalSurfacePathCount: 0,
    maxSurfacePathCount: 0,
    totalInternalControlVertexCount: 0,
    maxInternalControlVertexCount: 0,
    lastSurfacePathCount: 0,
    lastInternalControlVertexCount: 0,
    lastProportionCalibrationComplete: false,
    lastProportionCalibrationState: null,
  };
}

function buildBenchmarkResult({
  mode,
  nativeProfile,
  durationMs,
  snapshot,
  rendererStats,
}: {
  mode: BenchmarkMode;
  nativeProfile: NativeProfile;
  durationMs: number;
  snapshot: PoseLatencyDiagnosticsSnapshot;
  rendererStats: RendererStats;
}): BenchmarkResult {
  const published = rendererStats.publishedFrames;
  const shapeFrames = rendererStats.shapeMetricFrames;
  const surfaceFrames = rendererStats.surfaceMetricFrames;
  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    device: {
      platform: Platform.OS,
      androidVersion: Platform.OS === 'android' ? Platform.Version : null,
      model: platformConstant('Model'),
      manufacturer: platformConstant('Manufacturer'),
      brand: platformConstant('Brand'),
    },
    build: {
      dev: __DEV__,
      diagnosticsFlag: process.env.EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS,
      buildType: __DEV__ ? 'development' : 'release-or-profileable',
      remoteDebugging: 'not detected by benchmark screen',
    },
    mode,
    nativeProfile,
    durationMs,
    diagnostics: snapshot,
    renderer: {
      averageDotCount: published > 0 ? rendererStats.totalDots / published : null,
      maxDotCount: rendererStats.maxDots,
      averageLineCount: published > 0 ? rendererStats.totalLines / published : null,
      maxLineCount: rendererStats.maxLines,
      scheduledFrameCount: rendererStats.scheduledFrames,
      publishedFrameCount: rendererStats.publishedFrames,
      coalescedFrameCount: rendererStats.coalescedFrames,
      rejectedFrameCount: rendererStats.rejectedFrames,
      cancelledFrameCount: rendererStats.cancelledFrames,
      averageShapeCount: shapeFrames > 0 ? rendererStats.totalShapes / shapeFrames : null,
      maxShapeCount: rendererStats.maxShapes,
      averageDynamicPathCount:
        shapeFrames > 0 ? rendererStats.totalDynamicPaths / shapeFrames : null,
      maxDynamicPathCount: rendererStats.maxDynamicPaths,
      averageStaticTransformedShapeCount:
        shapeFrames > 0 ? rendererStats.totalStaticTransformedShapes / shapeFrames : null,
      maxStaticTransformedShapeCount: rendererStats.maxStaticTransformedShapes,
      averageSurfacePathCount:
        surfaceFrames > 0 ? rendererStats.totalSurfacePathCount / surfaceFrames : null,
      maxSurfacePathCount: rendererStats.maxSurfacePathCount,
      averageInternalVertexCount:
        surfaceFrames > 0 ? rendererStats.totalInternalControlVertexCount / surfaceFrames : null,
      maxInternalVertexCount: rendererStats.maxInternalControlVertexCount,
      proportionCalibrationComplete: rendererStats.lastProportionCalibrationComplete,
      latestDisplayedFrameId: null,
    },
    unavailableMetrics: [
      'physical display presentation timestamp',
      'latest displayed native frame id',
      'UI dropped frames without Perfetto or platform frame metrics',
      'GPU completion without Perfetto',
    ],
  };
}

function platformConstant(key: string): unknown {
  return (Platform.constants as unknown as Record<string, unknown>)[key] ?? null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  topPanel: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  eyebrow: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  title: {
    ...type.h1,
    color: colors.textPrimary,
  },
  body: {
    ...type.body,
    color: colors.textSecondary,
    margin: spacing.lg,
  },
  modeRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  modeButton: {
    width: 170,
    minHeight: 64,
    justifyContent: 'center',
    gap: 3,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  modeButtonSelected: {
    backgroundColor: colors.restorativeGreen,
    borderColor: colors.restorativeGreen,
  },
  modeTitle: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 16,
  },
  modeTitleSelected: {
    color: colors.onAccent,
  },
  modeSubtitle: {
    ...type.cardCaption,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 13,
  },
  modeSubtitleSelected: {
    color: colors.onAccent,
  },
  bottomPanel: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(251,245,239,0.94)',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.restorativeGreen,
  },
  buttonCompact: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  buttonText: {
    ...type.button,
    color: colors.onAccent,
  },
  metricsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metric: {
    minWidth: 74,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.bgBase,
  },
  runtimeMetric: {
    minWidth: 92,
  },
  runtimeMetricWide: {
    minWidth: 168,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontFamily: monoFamily,
    fontSize: 9,
    lineHeight: 12,
  },
  metricValue: {
    color: colors.textPrimary,
    fontFamily: monoFamily,
    fontSize: 12,
    lineHeight: 15,
  },
  runtimeMetricValue: {
    color: colors.textPrimary,
    fontFamily: monoFamily,
    fontSize: 10,
    lineHeight: 13,
  },
  resultBox: {
    maxHeight: 160,
    borderRadius: radius.sm,
    padding: spacing.sm,
    backgroundColor: colors.bgBase,
    color: colors.textPrimary,
    fontFamily: monoFamily,
    fontSize: 10,
    lineHeight: 13,
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.44,
  },
});
