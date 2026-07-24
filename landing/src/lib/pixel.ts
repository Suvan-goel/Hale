/**
 * Meta Pixel. Loaded ONLY after the visitor accepts the consent banner
 * (see ConsentBanner + App). Standard events only: PageView on load, Lead on
 * successful waitlist submit.
 */

/** Meta Pixel ID, digits only. Leave unset for local/dev previews. */
export const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID?.trim() || "";

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: unknown;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let pixelLoaded = false;

/** Injects fbevents.js and fires PageView. Call only after consent. */
export function loadPixel(): void {
  if (pixelLoaded || typeof window === "undefined") return;
  if (!PIXEL_ID) {
    console.info("[pearl] Meta Pixel not loaded - VITE_META_PIXEL_ID is not set.");
    return;
  }
  if (!/^\d+$/.test(PIXEL_ID)) {
    console.info("[pearl] Meta Pixel not loaded - VITE_META_PIXEL_ID must be digits only.");
    return;
  }
  if (!window.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    }) as Fbq;
    fbq.queue = [];
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
  pixelLoaded = true;
}

/** Fires the standard Lead event. No-op if the pixel never loaded (declined consent). */
export function trackLead(): void {
  if (!pixelLoaded) return;
  window.fbq?.("track", "Lead");
}

/** True once fbevents.js has been injected this page load. */
export function isPixelLoaded(): boolean {
  return pixelLoaded;
}
