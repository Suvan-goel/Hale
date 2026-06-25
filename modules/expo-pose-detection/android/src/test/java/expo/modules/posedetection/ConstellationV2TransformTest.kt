package expo.modules.posedetection

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.sin

class ConstellationV2TransformTest {
  @Test
  fun transformsNeutralStandingPoseIntoFiniteFixedBuffers() {
    val topology = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_900)
    val batches = ConstellationV2PointBatches(topology.actualPointCount)
    val stats = transformConstellationV2(
      topology = topology,
      landmarks = neutralLandmarks(),
      viewport = testViewport(),
      calibration = ConstellationV2Calibration(),
      out = batches,
    )

    assertEquals(900, stats.transformedPointCount)
    assertEquals(0, stats.droppedInvalidPointCount)
    assertEquals(0, stats.nonFiniteGeometryCount)
    assertEquals(900, batches.visiblePointCount())
    assertEquals(900 * 2 * CONSTELLATION_V2_BATCH_COUNT * 4, batches.pointBufferBytes)
    for (batchIndex in 0 until CONSTELLATION_V2_BATCH_COUNT) {
      val pointValues = batches.counts[batchIndex] * 2
      for (i in 0 until pointValues) {
        assertTrue(batches.points[batchIndex][i].isFinite())
      }
    }
  }

  @Test
  fun transformsCommonMovementShapesWithoutNonFiniteGeometry() {
    val topology = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_600)
    val viewport = testViewport()

    val poses = listOf(
      neutralLandmarks(),
      neutralLandmarks().also {
        set(it, LEFT_ELBOW, 0.62, 0.28)
        set(it, LEFT_WRIST, 0.64, 0.14)
      },
      neutralLandmarks().also {
        set(it, LEFT_KNEE, 0.46, 0.74)
        set(it, RIGHT_KNEE, 0.54, 0.74)
      },
      neutralLandmarks().also {
        set(it, LEFT_SHOULDER, 0.49, 0.34)
        set(it, RIGHT_SHOULDER, 0.53, 0.35)
        set(it, LEFT_HIP, 0.49, 0.58)
        set(it, RIGHT_HIP, 0.53, 0.59)
      },
    )

    for (pose in poses) {
      val batches = ConstellationV2PointBatches(topology.actualPointCount)
      val stats = transformConstellationV2(
        topology = topology,
        landmarks = pose,
        viewport = viewport,
        calibration = ConstellationV2Calibration(),
        out = batches,
      )
      assertEquals(600, stats.transformedPointCount)
      assertEquals(0, stats.nonFiniteGeometryCount)
      assertEquals(CONSTELLATION_V2_BATCH_COUNT, batches.counts.size)
    }
  }

  @Test
  fun handlesZeroLengthBonesAndMissingDistalLandmarks() {
    val topology = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_600)
    val pose = neutralLandmarks()
    set(pose, LEFT_ELBOW, 0.34, 0.34)
    set(pose, LEFT_SHOULDER, 0.34, 0.34)
    pose[LEFT_INDEX * CONSTELLATION_V2_LANDMARK_STRIDE + 3] = 0.0
    pose[LEFT_INDEX * CONSTELLATION_V2_LANDMARK_STRIDE + 4] = 0.0
    pose[LEFT_FOOT_INDEX * CONSTELLATION_V2_LANDMARK_STRIDE + 3] = 0.0
    pose[LEFT_FOOT_INDEX * CONSTELLATION_V2_LANDMARK_STRIDE + 4] = 0.0

    val batches = ConstellationV2PointBatches(topology.actualPointCount)
    val stats = transformConstellationV2(
      topology = topology,
      landmarks = pose,
      viewport = testViewport(),
      calibration = ConstellationV2Calibration(),
      out = batches,
    )

    assertTrue(stats.transformedPointCount > 500)
    assertEquals(0, stats.nonFiniteGeometryCount)
  }

  @Test
  fun locksCalibrationAfterCollectionWindowAndResets() {
    val topology = ConstellationV2TopologyBuilder.buildUncachedForTest(ConstellationV2Mode.V2_600)
    val calibration = ConstellationV2Calibration()
    val batches = ConstellationV2PointBatches(topology.actualPointCount)
    var state = "neutral"

    for (i in 0 until 30) {
      val stats = transformConstellationV2(
        topology = topology,
        landmarks = neutralLandmarks(xOffset = i * 0.0002),
        viewport = testViewport(),
        calibration = calibration,
        out = batches,
      )
      state = stats.calibrationState
    }

    assertEquals("locked", state)
    calibration.reset()
    assertEquals("neutral", calibration.state)
  }

  @Test
  fun mapsContainFitAndFrontCameraMirrorWithoutStretching() {
    val viewport = testViewport()
    val center = mapConstellationV2PointToView(0.5, 0.5, viewport)
    assertEquals(195.0, center.x, 0.000001)
    assertEquals(422.0, center.y, 0.000001)

    val mirroredLeft = mapConstellationV2PointToView(0.25, 0.5, viewport)
    val unmirroredLeft = mapConstellationV2PointToView(
      0.25,
      0.5,
      viewport.copy(mirrored = false),
    )
    assertEquals(292.5, mirroredLeft.x, 0.000001)
    assertEquals(97.5, unmirroredLeft.x, 0.000001)
    assertEquals(162.0, mapConstellationV2PointToView(0.5, 0.0, viewport).y, 0.000001)
    assertEquals(682.0, mapConstellationV2PointToView(0.5, 1.0, viewport).y, 0.000001)
  }

  @Test
  fun consumesUprightMetadataRotationContract() {
    assertEquals(AndroidNormalizedPoint(0.2, 0.3), rotateNormalizedPointToUpright(0.2, 0.3, 0))
    assertEquals(AndroidNormalizedPoint(0.7, 0.2), rotateNormalizedPointToUpright(0.2, 0.3, 90))
    assertEquals(AndroidNormalizedPoint(0.8, 0.7), rotateNormalizedPointToUpright(0.2, 0.3, 180))
    assertEquals(AndroidNormalizedPoint(0.3, 0.8), rotateNormalizedPointToUpright(0.2, 0.3, 270))
  }

  @Test
  fun syntheticBenchmarkReportsTransformMetrics() {
    val summaries = listOf(
      syntheticTransformBenchmark(ConstellationV2Mode.V2_900),
      syntheticTransformBenchmark(ConstellationV2Mode.V2_600),
    )

    for (summary in summaries) {
      println(
        "ConstellationV2Synthetic ${summary.mode.id} " +
          "points=${summary.points} batches=${summary.batchCount} " +
          "transformMs p50=${"%.4f".format(summary.p50)} " +
          "p95=${"%.4f".format(summary.p95)} " +
          "p99=${"%.4f".format(summary.p99)} max=${"%.4f".format(summary.max)}"
      )
      assertEquals(summary.mode.requestedPointCount, summary.points)
      assertEquals(CONSTELLATION_V2_BATCH_COUNT, summary.batchCount)
      assertTrue(summary.p95 >= 0.0)
    }
  }
}

private fun testViewport() = ConstellationV2Viewport(
  viewWidth = 390,
  viewHeight = 844,
  sourceWidth = 480,
  sourceHeight = 640,
  mirrored = true,
)

private fun neutralLandmarks(xOffset: Double = 0.0): DoubleArray {
  val landmarks = DoubleArray(CONSTELLATION_V2_LANDMARK_COUNT * CONSTELLATION_V2_LANDMARK_STRIDE)
  for (i in 0 until CONSTELLATION_V2_LANDMARK_COUNT) {
    set(landmarks, i, 0.5 + xOffset, 0.5)
  }
  set(landmarks, NOSE, 0.5 + xOffset, 0.2)
  set(landmarks, LEFT_SHOULDER, 0.38 + xOffset, 0.34)
  set(landmarks, RIGHT_SHOULDER, 0.62 + xOffset, 0.34)
  set(landmarks, LEFT_ELBOW, 0.32 + xOffset, 0.45)
  set(landmarks, RIGHT_ELBOW, 0.68 + xOffset, 0.45)
  set(landmarks, LEFT_WRIST, 0.31 + xOffset, 0.56)
  set(landmarks, RIGHT_WRIST, 0.69 + xOffset, 0.56)
  set(landmarks, LEFT_INDEX, 0.3 + xOffset, 0.59)
  set(landmarks, RIGHT_INDEX, 0.7 + xOffset, 0.59)
  set(landmarks, LEFT_HIP, 0.43 + xOffset, 0.58)
  set(landmarks, RIGHT_HIP, 0.57 + xOffset, 0.58)
  set(landmarks, LEFT_KNEE, 0.43 + xOffset, 0.76)
  set(landmarks, RIGHT_KNEE, 0.57 + xOffset, 0.76)
  set(landmarks, LEFT_ANKLE, 0.43 + xOffset, 0.94)
  set(landmarks, RIGHT_ANKLE, 0.57 + xOffset, 0.94)
  set(landmarks, LEFT_FOOT_INDEX, 0.4 + xOffset, 0.98)
  set(landmarks, RIGHT_FOOT_INDEX, 0.6 + xOffset, 0.98)
  return landmarks
}

private data class SyntheticTransformSummary(
  val mode: ConstellationV2Mode,
  val points: Int,
  val batchCount: Int,
  val p50: Double,
  val p95: Double,
  val p99: Double,
  val max: Double,
)

private fun syntheticTransformBenchmark(mode: ConstellationV2Mode): SyntheticTransformSummary {
  val topology = ConstellationV2TopologyBuilder.buildUncachedForTest(mode)
  val calibration = ConstellationV2Calibration()
  val batches = ConstellationV2PointBatches(topology.actualPointCount)
  val durations = DoubleArray(120)
  var visiblePoints = 0
  for (i in durations.indices) {
    val phase = i / durations.size.toDouble() * Math.PI * 4.0
    val pose = neutralLandmarks(xOffset = sin(phase * 0.5) * 0.015)
    set(pose, LEFT_ELBOW, 0.32, 0.45 - (sin(phase) + 1.0) * 0.08)
    set(pose, LEFT_WRIST, 0.31, 0.56 - (sin(phase) + 1.0) * 0.16)
    val start = System.nanoTime()
    val stats = transformConstellationV2(
      topology = topology,
      landmarks = pose,
      viewport = testViewport(),
      calibration = calibration,
      out = batches,
    )
    durations[i] = (System.nanoTime() - start) / 1_000_000.0
    visiblePoints = stats.transformedPointCount
  }
  durations.sort()
  return SyntheticTransformSummary(
    mode = mode,
    points = visiblePoints,
    batchCount = CONSTELLATION_V2_BATCH_COUNT,
    p50 = percentile(durations, 0.5),
    p95 = percentile(durations, 0.95),
    p99 = percentile(durations, 0.99),
    max = durations[durations.size - 1],
  )
}

private fun percentile(sorted: DoubleArray, p: Double): Double {
  val index = kotlin.math.ceil(sorted.size * p).toInt().coerceIn(1, sorted.size) - 1
  return sorted[index]
}

private fun set(landmarks: DoubleArray, index: Int, x: Double, y: Double) {
  val base = index * CONSTELLATION_V2_LANDMARK_STRIDE
  landmarks[base] = x
  landmarks[base + 1] = y
  landmarks[base + 2] = 0.0
  landmarks[base + 3] = 0.95
  landmarks[base + 4] = 0.95
}

private const val NOSE = 0
private const val LEFT_SHOULDER = 11
private const val RIGHT_SHOULDER = 12
private const val LEFT_ELBOW = 13
private const val RIGHT_ELBOW = 14
private const val LEFT_WRIST = 15
private const val RIGHT_WRIST = 16
private const val LEFT_INDEX = 19
private const val RIGHT_INDEX = 20
private const val LEFT_HIP = 23
private const val RIGHT_HIP = 24
private const val LEFT_KNEE = 25
private const val RIGHT_KNEE = 26
private const val LEFT_ANKLE = 27
private const val RIGHT_ANKLE = 28
private const val LEFT_FOOT_INDEX = 31
private const val RIGHT_FOOT_INDEX = 32
