import {
  createLatestFrameRafScheduler,
  type LatestFrameRafSchedulerEvent,
} from '../latestFrameRafScheduler';

describe('createLatestFrameRafScheduler', () => {
  it('renders the newest frame from a burst with only one RAF pending', () => {
    const raf = createFakeRaf();
    const stored: number[] = [];
    const rendered: Array<number | null> = [];
    const events: LatestFrameRafSchedulerEvent[] = [];
    const scheduler = createLatestFrameRafScheduler<number>({
      requestFrame: raf.request,
      cancelFrame: raf.cancel,
      getOrder: (frame) => frame,
      storeLatest: (frame) => stored.push(frame),
      renderLatest: (order) => rendered.push(order),
      onEvent: (event) => events.push(event),
    });

    expect(scheduler.submit(1)).toBe('scheduled');
    expect(scheduler.isPending()).toBe(true);
    expect(raf.pendingCount()).toBe(1);
    expect(scheduler.submit(2)).toBe('coalesced');
    expect(scheduler.submit(3)).toBe('coalesced');
    expect(raf.pendingCount()).toBe(1);

    raf.flushNext();

    expect(stored).toEqual([1, 2, 3]);
    expect(rendered).toEqual([3]);
    expect(scheduler.isPending()).toBe(false);
    expect(events.map((event) => event.type)).toEqual([
      'scheduled',
      'coalesced',
      'coalesced',
      'rendered',
    ]);
  });

  it('rejects older frames so they cannot overwrite the newest pending frame', () => {
    const raf = createFakeRaf();
    let latest = 0;
    const rendered: Array<number | null> = [];
    const scheduler = createLatestFrameRafScheduler<number>({
      requestFrame: raf.request,
      cancelFrame: raf.cancel,
      getOrder: (frame) => frame,
      storeLatest: (frame) => {
        latest = frame;
      },
      renderLatest: (order) => rendered.push(order),
    });

    expect(scheduler.submit(10)).toBe('scheduled');
    expect(scheduler.submit(9)).toBe('rejected');
    expect(scheduler.submit(10)).toBe('rejected');
    expect(latest).toBe(10);

    raf.flushNext();

    expect(rendered).toEqual([10]);
  });

  it('can schedule a fresh RAF after the previous render completes', () => {
    const raf = createFakeRaf();
    const rendered: Array<number | null> = [];
    const scheduler = createLatestFrameRafScheduler<number>({
      requestFrame: raf.request,
      cancelFrame: raf.cancel,
      getOrder: (frame) => frame,
      storeLatest: () => undefined,
      renderLatest: (order) => rendered.push(order),
    });

    scheduler.submit(1);
    raf.flushNext();
    scheduler.submit(2);
    raf.flushNext();

    expect(rendered).toEqual([1, 2]);
    expect(raf.pendingCount()).toBe(0);
  });

  it('cancels pending callbacks safely on unmount', () => {
    const raf = createFakeRaf();
    const rendered: Array<number | null> = [];
    const scheduler = createLatestFrameRafScheduler<number>({
      requestFrame: raf.request,
      cancelFrame: raf.cancel,
      getOrder: (frame) => frame,
      storeLatest: () => undefined,
      renderLatest: (order) => rendered.push(order),
    });

    scheduler.submit(1);
    scheduler.cancel();
    raf.flushAll();

    expect(rendered).toEqual([]);
    expect(scheduler.isPending()).toBe(false);
  });
});

function createFakeRaf() {
  let nextHandle = 1;
  const callbacks = new Map<number, () => void>();
  return {
    request(callback: () => void): number {
      const handle = nextHandle++;
      callbacks.set(handle, callback);
      return handle;
    },
    cancel(handle: number): void {
      callbacks.delete(handle);
    },
    pendingCount(): number {
      return callbacks.size;
    },
    flushNext(): void {
      const entry = callbacks.entries().next().value as [number, () => void] | undefined;
      if (!entry) return;
      const [handle, callback] = entry;
      callbacks.delete(handle);
      callback();
    },
    flushAll(): void {
      while (callbacks.size > 0) {
        this.flushNext();
      }
    },
  };
}
