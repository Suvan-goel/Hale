package expo.modules.posedetection

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Trace
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

private const val CONSTELLATION_V2_BACKEND = "android-native-canvas"

private data class ConstellationV2PoseSnapshot(
  val frameId: Long,
  val sourceTimestampMs: Double,
  val sourceWidth: Int,
  val sourceHeight: Int,
  val landmarks: DoubleArray,
)

internal class ConstellationV2OverlayRenderer(
  context: Context,
  private val nowMs: () -> Double,
  private val requestDraw: () -> Unit,
) {
  private val lock = Any()
  private val density = context.resources.displayMetrics.density.coerceAtLeast(1f)
  private val calibration = ConstellationV2Calibration()
  private var mode: ConstellationV2Mode? = null
  private var topology: ConstellationV2Topology? = null
  private var batches = ConstellationV2PointBatches(ConstellationV2Mode.V2_900.requestedPointCount)
  private var latestPose: ConstellationV2PoseSnapshot? = null
  private var invalidationPending = false
  private var lastAcceptedFrameId: Long? = null
  private var latestFrameIdDrawn: Long? = null
  private var topologyBuildCount = 0L
  private var topologyBuildMs = 0.0
  private var requestedFrames = 0L
  private var drawnFrames = 0L
  private var coalescedFrames = 0L
  private var rejectedFrames = 0L
  private var droppedInvalidPointCount = 0L
  private var nonFiniteGeometryCount = 0L
  private var lastVisiblePointCount = 0
  private val transformMs = NativeMetricWindow()
  private val drawMs = NativeMetricWindow()
  private val sourceAgeAtDrawStartMs = NativeMetricWindow()
  private val sourceAgeAtDrawEndMs = NativeMetricWindow()
  private val drawnTimes = NativeTimeWindow()

  private val paints: Array<Paint> = Array(CONSTELLATION_V2_BATCH_COUNT) { Paint(Paint.ANTI_ALIAS_FLAG) }

  init {
    configurePaints(ConstellationV2Mode.V2_900)
  }

  fun setMode(nextMode: ConstellationV2Mode?) {
    synchronized(lock) {
      if (mode == nextMode) return
      mode = nextMode
      latestPose = null
      invalidationPending = false
      lastAcceptedFrameId = null
      latestFrameIdDrawn = null
      calibration.reset()
      resetMetricsLocked()
      if (nextMode == null) {
        topology = null
        topologyBuildMs = 0.0
        return
      }
      configurePaints(nextMode)
      val built = ConstellationV2TopologyBuilder.build(nextMode, nowMs)
      topology = built
      topologyBuildCount += 1L
      topologyBuildMs = built.buildMs
      batches = ConstellationV2PointBatches(built.actualPointCount)
    }
    requestDraw()
  }

  fun reset() {
    synchronized(lock) {
      latestPose = null
      invalidationPending = false
      lastAcceptedFrameId = null
      latestFrameIdDrawn = null
      calibration.reset()
      resetMetricsLocked()
    }
    requestDraw()
  }

  fun submitPose(
    frameId: Long,
    sourceTimestampMs: Double,
    sourceWidth: Int,
    sourceHeight: Int,
    landmarks: DoubleArray,
  ) {
    var shouldRequestDraw = false
    synchronized(lock) {
      if (mode == null || topology == null) return
      val acceptedFrameId = lastAcceptedFrameId
      if (acceptedFrameId != null && frameId <= acceptedFrameId) {
        rejectedFrames += 1L
        return
      }
      lastAcceptedFrameId = frameId
      if (landmarks.size < CONSTELLATION_V2_LANDMARK_COUNT * CONSTELLATION_V2_LANDMARK_STRIDE) {
        latestPose = null
      } else {
        latestPose = ConstellationV2PoseSnapshot(
          frameId = frameId,
          sourceTimestampMs = sourceTimestampMs,
          sourceWidth = sourceWidth.coerceAtLeast(1),
          sourceHeight = sourceHeight.coerceAtLeast(1),
          landmarks = landmarks,
        )
      }
      if (invalidationPending) {
        coalescedFrames += 1L
      } else {
        invalidationPending = true
        requestedFrames += 1L
        shouldRequestDraw = true
      }
    }
    if (shouldRequestDraw) requestDraw()
  }

  fun draw(canvas: Canvas, viewWidth: Int, viewHeight: Int, mirrored: Boolean) {
    val selectedTopology: ConstellationV2Topology
    val pose: ConstellationV2PoseSnapshot
    synchronized(lock) {
      if (mode == null) {
        invalidationPending = false
        return
      }
      val currentTopology = topology ?: run {
        invalidationPending = false
        return
      }
      val currentPose = latestPose ?: run {
        invalidationPending = false
        lastVisiblePointCount = 0
        return
      }
      invalidationPending = false
      selectedTopology = currentTopology
      pose = currentPose
    }
    if (viewWidth <= 0 || viewHeight <= 0) return

    Trace.beginSection("PearlPose.constellationV2Transform")
    val transformStartMs = nowMs()
    val stats = transformConstellationV2(
      topology = selectedTopology,
      landmarks = pose.landmarks,
      viewport = ConstellationV2Viewport(
        viewWidth = viewWidth,
        viewHeight = viewHeight,
        sourceWidth = pose.sourceWidth,
        sourceHeight = pose.sourceHeight,
        mirrored = mirrored,
      ),
      calibration = calibration,
      out = batches,
    )
    val transformEndMs = nowMs()
    Trace.endSection()

    Trace.beginSection("PearlPose.constellationV2Draw")
    val drawStartMs = nowMs()
    for (i in 0 until CONSTELLATION_V2_BATCH_COUNT) {
      val pointCount = batches.counts[i]
      if (pointCount <= 0) continue
      canvas.drawPoints(batches.points[i], 0, pointCount * 2, paints[i])
    }
    val drawEndMs = nowMs()
    Trace.endSection()

    synchronized(lock) {
      drawnFrames += 1L
      latestFrameIdDrawn = pose.frameId
      lastVisiblePointCount = stats.transformedPointCount
      droppedInvalidPointCount += stats.droppedInvalidPointCount.toLong()
      nonFiniteGeometryCount += stats.nonFiniteGeometryCount.toLong()
      transformMs.push(transformEndMs - transformStartMs)
      drawMs.push(drawEndMs - drawStartMs)
      sourceAgeAtDrawStartMs.push(drawStartMs - pose.sourceTimestampMs)
      sourceAgeAtDrawEndMs.push(drawEndMs - pose.sourceTimestampMs)
      drawnTimes.push(drawEndMs)
    }
  }

  fun diagnosticsPayload(): Map<String, Any?>? {
    synchronized(lock) {
      val currentMode = mode ?: return null
      val currentTopology = topology ?: return null
      return mapOf(
        "backend" to CONSTELLATION_V2_BACKEND,
        "mode" to currentMode.id,
        "requestedPointCount" to currentTopology.requestedPointCount,
        "actualPointCount" to currentTopology.actualPointCount,
        "topologyBuildCount" to topologyBuildCount.toDouble(),
        "topologyBuildMs" to topologyBuildMs,
        "calibrationState" to calibration.state,
        "virtualRegionCount" to currentTopology.virtualRegionCount,
        "drawBatchCount" to currentTopology.drawBatchCount,
        "pointBufferBytes" to batches.pointBufferBytes,
        "transformMs" to transformMs.snapshotMap(),
        "drawMs" to drawMs.snapshotMap(),
        "sourceAgeAtDrawStartMs" to sourceAgeAtDrawStartMs.snapshotMap(),
        "sourceAgeAtDrawEndMs" to sourceAgeAtDrawEndMs.snapshotMap(),
        "framesRequested" to requestedFrames.toDouble(),
        "framesDrawn" to drawnFrames.toDouble(),
        "framesCoalesced" to coalescedFrames.toDouble(),
        "framesRejected" to rejectedFrames.toDouble(),
        "latestFrameIdDrawn" to latestFrameIdDrawn?.toDouble(),
        "publishedHz" to drawnTimes.hz(nowMs()),
        "droppedInvalidPointCount" to droppedInvalidPointCount.toDouble(),
        "nonFiniteGeometryCount" to nonFiniteGeometryCount.toDouble(),
        "lastVisiblePointCount" to lastVisiblePointCount,
        "emeraldPointCount" to currentTopology.emeraldCount(),
      )
    }
  }

  private fun configurePaints(mode: ConstellationV2Mode) {
    val microRadius = if (mode == ConstellationV2Mode.V2_600) 1.18f else 1.12f
    val standardRadius = if (mode == ConstellationV2Mode.V2_600) 1.72f else 1.62f
    val boundaryRadius = if (mode == ConstellationV2Mode.V2_600) 2.24f else 2.18f
    configurePaint(
      ConstellationV2Batch.PRIMARY_MICRO,
      Color.parseColor("#111412"),
      microRadius,
    )
    configurePaint(
      ConstellationV2Batch.PRIMARY_STANDARD,
      Color.parseColor("#111412"),
      standardRadius,
    )
    configurePaint(
      ConstellationV2Batch.PRIMARY_BOUNDARY,
      Color.parseColor("#111412"),
      boundaryRadius,
    )
    configurePaint(
      ConstellationV2Batch.FAR_MICRO,
      Color.parseColor("#68706A"),
      microRadius,
    )
    configurePaint(
      ConstellationV2Batch.FAR_STANDARD,
      Color.parseColor("#68706A"),
      standardRadius,
    )
    configurePaint(
      ConstellationV2Batch.FAR_BOUNDARY,
      Color.parseColor("#68706A"),
      boundaryRadius,
    )
    configurePaint(
      ConstellationV2Batch.ACCENT,
      Color.parseColor("#CBA89D"),
      standardRadius,
    )
  }

  private fun configurePaint(batch: ConstellationV2Batch, color: Int, radiusDp: Float) {
    paints[batch.index].apply {
      style = Paint.Style.STROKE
      strokeCap = Paint.Cap.ROUND
      strokeJoin = Paint.Join.ROUND
      this.color = color
      alpha = 255
      strokeWidth = max(1f, radiusDp * density * 2f)
    }
  }

  private fun resetMetricsLocked() {
    requestedFrames = 0L
    drawnFrames = 0L
    coalescedFrames = 0L
    rejectedFrames = 0L
    droppedInvalidPointCount = 0L
    nonFiniteGeometryCount = 0L
    lastVisiblePointCount = 0
    transformMs.reset()
    drawMs.reset()
    sourceAgeAtDrawStartMs.reset()
    sourceAgeAtDrawEndMs.reset()
    drawnTimes.reset()
  }
}

private class NativeMetricWindow(
  private val capacity: Int = 240,
) {
  private val values = DoubleArray(capacity)
  private var nextIndex = 0
  private var count = 0

  fun push(value: Double) {
    if (!value.isFinite() || value < 0.0) return
    values[nextIndex] = value
    nextIndex = (nextIndex + 1) % capacity
    if (count < capacity) count += 1
  }

  fun reset() {
    nextIndex = 0
    count = 0
  }

  fun snapshotMap(): Map<String, Any?> {
    if (count == 0) {
      return mapOf(
        "count" to 0,
        "p50" to null,
        "p90" to null,
        "p95" to null,
        "p99" to null,
        "max" to null,
      )
    }
    val sorted = DoubleArray(count)
    for (i in 0 until count) sorted[i] = values[i]
    sorted.sort()
    return mapOf(
      "count" to count,
      "p50" to percentile(sorted, 0.5),
      "p90" to percentile(sorted, 0.9),
      "p95" to percentile(sorted, 0.95),
      "p99" to percentile(sorted, 0.99),
      "max" to sorted[count - 1],
    )
  }

  private fun percentile(sorted: DoubleArray, p: Double): Double {
    val index = min(sorted.size - 1, max(0, ceil(sorted.size * p).toInt() - 1))
    return sorted[index]
  }
}

private class NativeTimeWindow(
  private val capacity: Int = 240,
) {
  private val times = DoubleArray(capacity)
  private var nextIndex = 0
  private var count = 0

  fun push(value: Double) {
    if (!value.isFinite()) return
    times[nextIndex] = value
    nextIndex = (nextIndex + 1) % capacity
    if (count < capacity) count += 1
  }

  fun reset() {
    nextIndex = 0
    count = 0
  }

  fun hz(nowMs: Double, windowMs: Double = 1000.0): Double {
    if (count <= 1) return 0.0
    var hits = 0
    for (i in 0 until count) {
      if (nowMs - times[i] <= windowMs) hits += 1
    }
    return if (hits > 1) (hits - 1) / (windowMs / 1000.0) else 0.0
  }
}
