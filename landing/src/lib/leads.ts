/**
 * Form backend. Every submission — the waitlist email AND the thank-you-page
 * micro-survey — goes through submitLead(), so swapping the backend is a
 * one-file change.
 */

/** ← Point this at your form backend (Vercel function, Formspree, worker, …). */
export const LEAD_ENDPOINT = "https://example.com/api/leads";

export interface LeadPayload {
  kind: "lead" | "survey";
  email: string;
  /** ISO 8601 timestamp, set at submit time. */
  submittedAt: string;
  /** utm_source / utm_medium / utm_campaign / utm_term / utm_content / fbclid captured from the landing URL. */
  utm: Record<string, string>;
  /** Micro-survey answer — present when kind === "survey". */
  answer?: string;
}

export async function submitLead(payload: LeadPayload): Promise<void> {
  if (LEAD_ENDPOINT.includes("example.com")) {
    // No backend configured yet: log and succeed so the whole flow can be
    // exercised end-to-end. Point LEAD_ENDPOINT at a real backend before
    // sending any traffic.
    console.info("[elegant] lead captured (no endpoint configured):", payload);
    return;
  }
  const res = await fetch(LEAD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Lead submit failed with status ${res.status}`);
}

/* ── Supabase alternative ────────────────────────────────────────────────────
 *
 * 1. npm install @supabase/supabase-js
 * 2. Create the table (RLS on, anon INSERT-only policy):
 *
 *    create table public.landing_leads (
 *      id uuid primary key default gen_random_uuid(),
 *      kind text not null default 'lead',
 *      email text not null,
 *      utm jsonb not null default '{}',
 *      answer text,
 *      submitted_at timestamptz not null default now()
 *    );
 *    alter table public.landing_leads enable row level security;
 *    create policy "anon can insert leads" on public.landing_leads
 *      for insert to anon with check (true);
 *
 * 3. Replace submitLead with:
 *
 *    import { createClient } from "@supabase/supabase-js";
 *
 *    const supabase = createClient(
 *      import.meta.env.VITE_SUPABASE_URL,
 *      import.meta.env.VITE_SUPABASE_ANON_KEY,
 *    );
 *
 *    export async function submitLead(payload: LeadPayload): Promise<void> {
 *      const { error } = await supabase.from("landing_leads").insert({
 *        kind: payload.kind,
 *        email: payload.email,
 *        utm: payload.utm,
 *        answer: payload.answer ?? null,
 *        submitted_at: payload.submittedAt,
 *      });
 *      if (error) throw error;
 *    }
 * ──────────────────────────────────────────────────────────────────────────── */
