package expo.modules.posedetection

internal enum class LatestNativeEventType {
  SCHEDULED,
  COALESCED,
  REJECTED,
  EMITTED,
  CANCELLED,
}

internal data class LatestNativeEvent(
  val type: LatestNativeEventType,
  val order: Long,
  val replacedOrder: Long? = null,
  val latestOrder: Long? = null,
)

/**
 * Main-thread event backpressure for native-to-JS pose events.
 *
 * Newer accepted results replace the pending event while one main-thread
 * emission is already scheduled. This keeps event delivery latest-only without
 * building a queue of stale pose payloads under JS/main-thread pressure.
 */
internal class LatestNativeEventScheduler<T>(
  private val getOrder: (T) -> Long,
  private val schedule: (Runnable) -> Unit,
  private val cancelScheduled: (Runnable) -> Unit,
  private val emit: (T) -> Unit,
  private val onEvent: (LatestNativeEvent) -> Unit = {},
) {
  private val lock = Any()
  private var latestValue: T? = null
  private var latestPendingOrder: Long? = null
  private var lastAcceptedOrder: Long? = null
  private var scheduledRunnable: Runnable? = null

  fun submit(value: T): LatestNativeEventType {
    val order = getOrder(value)
    var runnableToSchedule: Runnable? = null
    val eventType: LatestNativeEventType
    val event: LatestNativeEvent

    synchronized(lock) {
      val acceptedOrder = lastAcceptedOrder
      if (acceptedOrder != null && order <= acceptedOrder) {
        eventType = LatestNativeEventType.REJECTED
        event = LatestNativeEvent(
          type = eventType,
          order = order,
          latestOrder = acceptedOrder,
        )
      } else {
        val replacedOrder = latestPendingOrder
        latestValue = value
        latestPendingOrder = order
        lastAcceptedOrder = order

        if (scheduledRunnable != null) {
          eventType = LatestNativeEventType.COALESCED
          event = LatestNativeEvent(
            type = eventType,
            order = order,
            replacedOrder = replacedOrder,
          )
        } else {
          val runnable = Runnable {
            val selected: T?
            val selectedOrder: Long
            synchronized(lock) {
              selected = latestValue
              selectedOrder = latestPendingOrder ?: -1L
              latestValue = null
              latestPendingOrder = null
              scheduledRunnable = null
            }
            if (selected != null) {
              emit(selected)
              onEvent(
                LatestNativeEvent(
                  type = LatestNativeEventType.EMITTED,
                  order = selectedOrder,
                )
              )
            }
          }
          scheduledRunnable = runnable
          runnableToSchedule = runnable
          eventType = LatestNativeEventType.SCHEDULED
          event = LatestNativeEvent(type = eventType, order = order)
        }
      }
    }

    runnableToSchedule?.let(schedule)
    onEvent(event)
    return eventType
  }

  fun cancel() {
    val runnableToCancel: Runnable?
    val order: Long?
    synchronized(lock) {
      runnableToCancel = scheduledRunnable
      order = latestPendingOrder
      latestValue = null
      latestPendingOrder = null
      scheduledRunnable = null
    }
    if (runnableToCancel != null) {
      cancelScheduled(runnableToCancel)
      onEvent(
        LatestNativeEvent(
          type = LatestNativeEventType.CANCELLED,
          order = order ?: -1L,
        )
      )
    }
  }

  fun reset() {
    synchronized(lock) {
      latestValue = null
      latestPendingOrder = null
      lastAcceptedOrder = null
      scheduledRunnable = null
    }
  }
}
