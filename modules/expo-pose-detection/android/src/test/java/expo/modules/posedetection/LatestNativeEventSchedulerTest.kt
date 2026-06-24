package expo.modules.posedetection

import org.junit.Assert.assertEquals
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
