export type LatestFrameRafSchedulerSubmitResult = 'scheduled' | 'coalesced' | 'rejected';

export type LatestFrameRafSchedulerEvent =
  | {
      type: 'scheduled';
      order: number;
    }
  | {
      type: 'coalesced';
      order: number;
      replacedOrder: number | null;
    }
  | {
      type: 'rejected';
      order: number;
      latestOrder: number | null;
    }
  | {
      type: 'rendered';
      order: number | null;
    }
  | {
      type: 'cancelled';
      order: number | null;
    };

export interface LatestFrameRafSchedulerOptions<T> {
  requestFrame: (callback: () => void) => number;
  cancelFrame: (handle: number) => void;
  getOrder: (frame: T) => number;
  storeLatest: (frame: T) => void;
  renderLatest: (order: number | null) => void;
  onEvent?: (event: LatestFrameRafSchedulerEvent) => void;
}

export interface LatestFrameRafScheduler<T> {
  submit(frame: T): LatestFrameRafSchedulerSubmitResult;
  cancel(): void;
  isPending(): boolean;
  latestOrder(): number | null;
}

/**
 * Latest-frame-only visual scheduler.
 *
 * Every accepted input stores/replaces the pending frame before the RAF guard
 * returns. At most one RAF is queued; the callback renders the newest stored
 * frame, not the first frame in a burst.
 */
export function createLatestFrameRafScheduler<T>({
  requestFrame,
  cancelFrame,
  getOrder,
  storeLatest,
  renderLatest,
  onEvent,
}: LatestFrameRafSchedulerOptions<T>): LatestFrameRafScheduler<T> {
  let rafHandle: number | null = null;
  let lastAcceptedOrder: number | null = null;

  return {
    submit(frame: T): LatestFrameRafSchedulerSubmitResult {
      const order = getOrder(frame);
      if (!Number.isFinite(order)) {
        onEvent?.({ type: 'rejected', order, latestOrder: lastAcceptedOrder });
        return 'rejected';
      }
      if (lastAcceptedOrder !== null && order <= lastAcceptedOrder) {
        onEvent?.({ type: 'rejected', order, latestOrder: lastAcceptedOrder });
        return 'rejected';
      }

      const replacedOrder = lastAcceptedOrder;
      storeLatest(frame);
      lastAcceptedOrder = order;

      if (rafHandle !== null) {
        onEvent?.({ type: 'coalesced', order, replacedOrder });
        return 'coalesced';
      }

      rafHandle = requestFrame(() => {
        rafHandle = null;
        const selectedOrder = lastAcceptedOrder;
        renderLatest(selectedOrder);
        onEvent?.({ type: 'rendered', order: selectedOrder });
      });
      onEvent?.({ type: 'scheduled', order });
      return 'scheduled';
    },

    cancel(): void {
      if (rafHandle !== null) {
        cancelFrame(rafHandle);
        rafHandle = null;
        onEvent?.({ type: 'cancelled', order: lastAcceptedOrder });
      }
    },

    isPending(): boolean {
      return rafHandle !== null;
    },

    latestOrder(): number | null {
      return lastAcceptedOrder;
    },
  };
}
