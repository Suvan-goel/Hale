/**
 * Form backend. Waitlist submissions go through submitLead(), so swapping the
 * backend is a one-file change.
 *
 * Two supported backends, checked in order:
 *   1. VITE_LEAD_ENDPOINT - any endpoint that accepts this JSON payload as a
 *      POST (Vercel function, Formspree, worker, ...).
 *   2. VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY - inserts into
 *      public.landing_leads via PostgREST. The table ships in
 *      supabase/migrations/20260722000100_landing_leads.sql with RLS on and an
 *      insert-only anon grant - the key cannot read anything back, which is
 *      also why a duplicate email arrives as a 409 (PostgREST's
 *      ignore-duplicates mode needs SELECT privilege). 409 means "already on
 *      the list", so it is treated as success.
 */

export const LEAD_ENDPOINT = import.meta.env.VITE_LEAD_ENDPOINT?.trim() || "";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL?.trim() || "").replace(/\/+$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

export interface LeadPayload {
  kind: "lead";
  email: string;
  /** ISO 8601 timestamp, set at submit time. */
  submittedAt: string;
  /** utm_source / utm_medium / utm_campaign / utm_term / utm_content / fbclid captured from the landing URL. */
  utm: Record<string, string>;
}

export async function submitLead(payload: LeadPayload): Promise<void> {
  if (LEAD_ENDPOINT && !LEAD_ENDPOINT.includes("example.com")) {
    const res = await fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Lead submit failed with status ${res.status}`);
    return;
  }

  if (SUPABASE_URL && SUPABASE_KEY) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/landing_leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        kind: payload.kind,
        email: payload.email,
        utm: payload.utm,
        submitted_at: payload.submittedAt,
      }),
    });
    // 409 = unique-email conflict: they are already on the list. Success.
    if (!res.ok && res.status !== 409) {
      throw new Error(`Lead submit failed with status ${res.status}`);
    }
    return;
  }

  if (!import.meta.env.PROD) {
    // Local dev convenience: the form can still be tested before a real
    // backend exists. Production fails rather than pretending to save leads.
    console.info("[pearl] lead captured (no backend configured):", payload);
    return;
  }
  throw new Error("Lead backend is not configured.");
}
