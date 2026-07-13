/**
 * Captures ad-attribution parameters from the landing URL on first load and
 * keeps them for the session, so they survive scrolling/consent/navigation
 * and get submitted alongside the email.
 */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
] as const;

const STORE_KEY = "pearl:utm";

export function captureUtm(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) found[key] = value;
    }
    if (Object.keys(found).length === 0) return;
    sessionStorage.setItem(STORE_KEY, JSON.stringify({ ...getUtm(), ...found }));
  } catch {
    // Storage unavailable (strict private mode) — attribution just won't persist.
  }
}

export function getUtm(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}
