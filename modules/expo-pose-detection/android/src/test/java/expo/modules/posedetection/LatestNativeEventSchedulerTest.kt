package expo.modules.posedetection

import android.hardware.camera2.CameraMetadata
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LatestNativeEventSchedulerTest {
  @Test
  fun emitsNewestFrameFromBurst() {
    val fakeMain = FakeMainQueue()
    val emitted = mutableListOf<Long>()
    val events = mutableListOf<LatestNativeEventType>()
    val scheduler = LatestNativeEventScheduler<Long>(
      getOrder = { it },
      schedule = fakeMain::post,
      cancelScheduled = fakeMain::remove,
      emit = { emitted.add(it) },
      onEvent = { events.add(it.type) },
    )

    assertEquals(LatestNativeEventType.SCHEDULED, scheduler.submit(1))
    assertEquals(LatestNativeEventType.COALESCED, scheduler.submit(2))
    assertEquals(LatestNativeEventType.COALESCED, scheduler.submit(3))
    assertEquals(1, fakeMain.pendingCount)

    fakeMain.flushNext()

    assertEquals(listOf(3L), emitted)
    assertEquals(
      listOf(
        LatestNativeEventType.SCHEDULED,
        LatestNativeEventType.COALESCED,
        LatestNativeEventType.COALESCED,
        LatestNativeEventType.EMITTED,
      ),
      events,
    )
  }

  @Test
  fun rejectsOlderOrEqualFrames() {
    val fakeMain = FakeMainQueue()
    val emitted = mutableListOf<Long>()
    val scheduler = LatestNativeEventScheduler<Long>(
      getOrder = { it },
      schedule = fakeMain::post,
      cancelScheduled = fakeMain::remove,
      emit = { emitted.add(it) },
    )

    assertEquals(LatestNativeEventType.SCHEDULED, scheduler.submit(10))
    assertEquals(LatestNativeEventType.REJECTED, scheduler.submit(9))
    assertEquals(LatestNativeEventType.REJECTED, scheduler.submit(10))

    fakeMain.flushNext()

    assertEquals(listOf(10L), emitted)
  }

  @Test
  fun cancelsPendingEmission() {
    val fakeMain = FakeMainQueue()
    val emitted = mutableListOf<Long>()
    val events = mutableListOf<LatestNativeEventType>()
    val scheduler = LatestNativeEventScheduler<Long>(
      getOrder = { it },
      schedule = fakeMain::post,
      cancelScheduled = fakeMain::remove,
      emit = { emitted.add(it) },
      onEvent = { events.add(it.type) },
    )

    scheduler.submit(1)
    scheduler.cancel()
    fakeMain.flushAll()

    assertTrue(emitted.isEmpty())
    assertEquals(
      listOf(LatestNativeEventType.SCHEDULED, LatestNativeEventType.CANCELLED),
      events,
    )
  }

  @Test
  fun resetAllowsNewSessionFrameIds() {
    val fakeMain = FakeMainQueue()
    val emitted = mutableListOf<Long>()
    val scheduler = LatestNativeEventScheduler<Long>(
      getOrder = { it },
      schedule = fakeMain::post,
      cancelScheduled = fakeMain::remove,
      emit = { emitted.add(it) },
    )

    scheduler.submit(100)
    fakeMain.flushNext()
    scheduler.reset()

    assertEquals(LatestNativeEventType.SCHEDULED, scheduler.submit(1))
    fakeMain.flushNext()

    assertEquals(listOf(100L, 1L), emitted)
  }
}

class AndroidPoseFrameTransformsTest {
  @Test
  fun reportsUprightDimensionsForQuarterTurnRotations() {
    assertEquals(AndroidPoseFrameDimensions(width = 480, height = 640), uprightSourceDimensions(640, 480, 90))
    assertEquals(AndroidPoseFrameDimensions(width = 480, height = 640), uprightSourceDimensions(640, 480, 270))
  }

  @Test
  fun preservesDimensionsForFlatRotations() {
    assertEquals(AndroidPoseFrameDimensions(width = 640, height = 480), uprightSourceDimensions(640, 480, 0))
    assertEquals(AndroidPoseFrameDimensions(width = 640, height = 480), uprightSourceDimensions(640, 480, 180))
    assertEquals(AndroidPoseFrameDimensions(width = 640, height = 480), uprightSourceDimensions(640, 480, -180))
  }

  @Test
  fun mirrorsDisplayXOnlyWhenRequested() {
    assertEquals(0.8, displayNormalizedX(0.2, mirrored = true), 0.000001)
    assertEquals(0.2, displayNormalizedX(0.2, mirrored = false), 0.000001)
  }

  @Test
  fun normalizesCameraRotationDegrees() {
    assertEquals(0, normalizeRotationDegrees(0))
    assertEquals(90, normalizeRotationDegrees(90))
    assertEquals(180, normalizeRotationDegrees(180))
    assertEquals(270, normalizeRotationDegrees(270))
    assertEquals(270, normalizeRotationDegrees(-90))
    assertEquals(90, normalizeRotationDegrees(450))
  }

  @Test
  fun mapsRawMetadataLandmarksToUprightForZeroDegrees() {
    assertRotationCases(
      rotationDegrees = 0,
      expected = mapOf(
        "top-left" to AndroidNormalizedPoint(0.0, 0.0),
        "top-right" to AndroidNormalizedPoint(1.0, 0.0),
        "bottom-left" to AndroidNormalizedPoint(0.0, 1.0),
        "bottom-right" to AndroidNormalizedPoint(1.0, 1.0),
        "centre" to AndroidNormalizedPoint(0.5, 0.5),
        "left-shoulder" to AndroidNormalizedPoint(0.25, 0.4),
        "right-shoulder" to AndroidNormalizedPoint(0.7, 0.35),
      ),
    )
  }

  @Test
  fun mapsRawMetadataLandmarksToUprightForNinetyDegrees() {
    assertRotationCases(
      rotationDegrees = 90,
      expected = mapOf(
        "top-left" to AndroidNormalizedPoint(1.0, 0.0),
        "top-right" to AndroidNormalizedPoint(1.0, 1.0),
        "bottom-left" to AndroidNormalizedPoint(0.0, 0.0),
        "bottom-right" to AndroidNormalizedPoint(0.0, 1.0),
        "centre" to AndroidNormalizedPoint(0.5, 0.5),
        "left-shoulder" to AndroidNormalizedPoint(0.6, 0.25),
        "right-shoulder" to AndroidNormalizedPoint(0.65, 0.7),
      ),
    )
  }

  @Test
  fun mapsRawMetadataLandmarksToUprightForOneEightyDegrees() {
    assertRotationCases(
      rotationDegrees = 180,
      expected = mapOf(
        "top-left" to AndroidNormalizedPoint(1.0, 1.0),
        "top-right" to AndroidNormalizedPoint(0.0, 1.0),
        "bottom-left" to AndroidNormalizedPoint(1.0, 0.0),
        "bottom-right" to AndroidNormalizedPoint(0.0, 0.0),
        "centre" to AndroidNormalizedPoint(0.5, 0.5),
        "left-shoulder" to AndroidNormalizedPoint(0.75, 0.6),
        "right-shoulder" to AndroidNormalizedPoint(0.3, 0.65),
      ),
    )
  }

  @Test
  fun mapsRawMetadataLandmarksToUprightForTwoSeventyDegrees() {
    assertRotationCases(
      rotationDegrees = 270,
      expected = mapOf(
        "top-left" to AndroidNormalizedPoint(0.0, 1.0),
        "top-right" to AndroidNormalizedPoint(0.0, 0.0),
        "bottom-left" to AndroidNormalizedPoint(1.0, 1.0),
        "bottom-right" to AndroidNormalizedPoint(1.0, 0.0),
        "centre" to AndroidNormalizedPoint(0.5, 0.5),
        "left-shoulder" to AndroidNormalizedPoint(0.4, 0.75),
        "right-shoulder" to AndroidNormalizedPoint(0.35, 0.3),
      ),
    )
  }

  @Test
  fun mirrorsFrontCameraAfterRotationOnlyOnDisplayX() {
    val leftShoulder = rotateNormalizedPointToUpright(0.25, 0.4, 90)
    val rightShoulder = rotateNormalizedPointToUpright(0.7, 0.35, 90)

    assertPoint(
      AndroidNormalizedPoint(displayNormalizedX(leftShoulder.x, mirrored = true), leftShoulder.y),
      AndroidNormalizedPoint(0.4, 0.25),
      "mirrored left shoulder",
    )
    assertPoint(
      AndroidNormalizedPoint(displayNormalizedX(rightShoulder.x, mirrored = true), rightShoulder.y),
      AndroidNormalizedPoint(0.35, 0.7),
      "mirrored right shoulder",
    )
  }
}

class AndroidCameraTimestampDiagnosticsTest {
  @Test
  fun mapsRealtimeSourceAsComparable() {
    val diagnostics = androidCameraTimestampDiagnostics(
      cameraId = "0",
      sensorTimestampSource = CameraMetadata.SENSOR_INFO_TIMESTAMP_SOURCE_REALTIME,
    )

    assertEquals("0", diagnostics.cameraId)
    assertEquals(
      CameraMetadata.SENSOR_INFO_TIMESTAMP_SOURCE_REALTIME,
      diagnostics.sensorTimestampSourceRaw,
    )
    assertEquals("REALTIME", diagnostics.sensorTimestampSourceName)
    assertTrue(diagnostics.sensorTimestampComparableToElapsedRealtime)
  }

  @Test
  fun mapsUnknownSourceAsNotComparable() {
    val diagnostics = androidCameraTimestampDiagnostics(
      cameraId = "1",
      sensorTimestampSource = CameraMetadata.SENSOR_INFO_TIMESTAMP_SOURCE_UNKNOWN,
    )

    assertEquals("1", diagnostics.cameraId)
    assertEquals(
      CameraMetadata.SENSOR_INFO_TIMESTAMP_SOURCE_UNKNOWN,
      diagnostics.sensorTimestampSourceRaw,
    )
    assertEquals("UNKNOWN", diagnostics.sensorTimestampSourceName)
    assertFalse(diagnostics.sensorTimestampComparableToElapsedRealtime)
  }

  @Test
  fun mapsNullAndUnrecognisedSourcesAsNotComparable() {
    val unavailable = androidCameraTimestampDiagnostics(
      cameraId = "0",
      sensorTimestampSource = null,
    )
    val unrecognised = androidCameraTimestampDiagnostics(
      cameraId = "0",
      sensorTimestampSource = Int.MAX_VALUE,
    )

    assertEquals("UNAVAILABLE", unavailable.sensorTimestampSourceName)
    assertEquals(null, unavailable.sensorTimestampSourceRaw)
    assertFalse(unavailable.sensorTimestampComparableToElapsedRealtime)
    assertEquals("UNRECOGNISED", unrecognised.sensorTimestampSourceName)
    assertEquals(Int.MAX_VALUE, unrecognised.sensorTimestampSourceRaw)
    assertFalse(unrecognised.sensorTimestampComparableToElapsedRealtime)
  }
}

private val RAW_ROTATION_POINTS = mapOf(
  "top-left" to AndroidNormalizedPoint(0.0, 0.0),
  "top-right" to AndroidNormalizedPoint(1.0, 0.0),
  "bottom-left" to AndroidNormalizedPoint(0.0, 1.0),
  "bottom-right" to AndroidNormalizedPoint(1.0, 1.0),
  "centre" to AndroidNormalizedPoint(0.5, 0.5),
  "left-shoulder" to AndroidNormalizedPoint(0.25, 0.4),
  "right-shoulder" to AndroidNormalizedPoint(0.7, 0.35),
)

private fun assertRotationCases(
  rotationDegrees: Int,
  expected: Map<String, AndroidNormalizedPoint>,
) {
  for ((label, raw) in RAW_ROTATION_POINTS) {
    val actual = rotateNormalizedPointToUpright(raw.x, raw.y, rotationDegrees)
    assertPoint(actual, expected.getValue(label), "$label @ $rotationDegrees")
  }
}

private fun assertPoint(
  actual: AndroidNormalizedPoint,
  expected: AndroidNormalizedPoint,
  label: String,
) {
  assertEquals("$label x", expected.x, actual.x, 0.000001)
  assertEquals("$label y", expected.y, actual.y, 0.000001)
}

private class FakeMainQueue {
  private val pending = mutableListOf<Runnable>()
  val pendingCount: Int
    get() = pending.size

  fun post(runnable: Runnable) {
    pending.add(runnable)
  }

  fun remove(runnable: Runnable) {
    pending.remove(runnable)
  }

  fun flushNext() {
    if (pending.isEmpty()) return
    val runnable = pending.removeAt(0)
    runnable.run()
  }

  fun flushAll() {
    while (pending.isNotEmpty()) {
      flushNext()
    }
  }
}
