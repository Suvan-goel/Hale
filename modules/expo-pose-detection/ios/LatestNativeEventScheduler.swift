import Foundation

enum LatestNativeEventType {
  case scheduled
  case coalesced
  case rejected
  case emitted
  case cancelled
}

struct LatestNativeEventStats {
  let scheduled: Int
  let coalesced: Int
  let rejected: Int
  let emitted: Int
}

/**
 * Applies latest-only backpressure before native pose results reach the main
 * thread. A newer result replaces the one pending delivery, so a busy main
 * thread never builds a queue of stale mask/landmark pairs.
 */
final class LatestNativeEventScheduler<Value> {
  private let getOrder: (Value) -> Int
  private let schedule: (@escaping () -> Void) -> Void
  private let emit: (Value) -> Void
  private let onEvent: (LatestNativeEventType) -> Void
  private let lock = NSLock()

  private var latestValue: Value?
  private var latestPendingOrder: Int?
  private var lastAcceptedOrder: Int?
  private var scheduledGeneration = 0
  private var deliveryScheduled = false
  private var scheduledCount = 0
  private var coalescedCount = 0
  private var rejectedCount = 0
  private var emittedCount = 0

  init(
    getOrder: @escaping (Value) -> Int,
    schedule: @escaping (@escaping () -> Void) -> Void,
    emit: @escaping (Value) -> Void,
    onEvent: @escaping (LatestNativeEventType) -> Void = { _ in }
  ) {
    self.getOrder = getOrder
    self.schedule = schedule
    self.emit = emit
    self.onEvent = onEvent
  }

  @discardableResult
  func submit(_ value: Value) -> LatestNativeEventType {
    let order = getOrder(value)
    var generationToSchedule: Int?
    let event: LatestNativeEventType

    lock.lock()
    if let acceptedOrder = lastAcceptedOrder, order <= acceptedOrder {
      rejectedCount += 1
      event = .rejected
    } else {
      latestValue = value
      latestPendingOrder = order
      lastAcceptedOrder = order
      if deliveryScheduled {
        coalescedCount += 1
        event = .coalesced
      } else {
        deliveryScheduled = true
        scheduledGeneration += 1
        generationToSchedule = scheduledGeneration
        scheduledCount += 1
        event = .scheduled
      }
    }
    lock.unlock()

    if let generationToSchedule {
      schedule { [weak self] in
        self?.drain(generation: generationToSchedule)
      }
    }
    onEvent(event)
    return event
  }

  func cancel() {
    var cancelled = false
    lock.lock()
    if deliveryScheduled || latestValue != nil {
      cancelled = true
    }
    latestValue = nil
    latestPendingOrder = nil
    deliveryScheduled = false
    scheduledGeneration += 1
    lock.unlock()
    if cancelled { onEvent(.cancelled) }
  }

  func reset() {
    lock.lock()
    latestValue = nil
    latestPendingOrder = nil
    lastAcceptedOrder = nil
    deliveryScheduled = false
    scheduledGeneration += 1
    scheduledCount = 0
    coalescedCount = 0
    rejectedCount = 0
    emittedCount = 0
    lock.unlock()
  }

  func stats() -> LatestNativeEventStats {
    lock.lock()
    let value = LatestNativeEventStats(
      scheduled: scheduledCount,
      coalesced: coalescedCount,
      rejected: rejectedCount,
      emitted: emittedCount)
    lock.unlock()
    return value
  }

  private func drain(generation: Int) {
    let selected: Value?
    lock.lock()
    if deliveryScheduled, generation == scheduledGeneration {
      selected = latestValue
      latestValue = nil
      latestPendingOrder = nil
      deliveryScheduled = false
    } else {
      selected = nil
    }
    lock.unlock()

    guard let selected else { return }
    emit(selected)
    lock.lock()
    emittedCount += 1
    lock.unlock()
    onEvent(.emitted)
  }
}
