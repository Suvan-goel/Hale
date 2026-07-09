/**
 * Form backend. Waitlist submissions go through submitLead(), so swapping the
 * backend is a one-file change.
 */

/** Point this at your form backend (Vercel function, Formspree, worker, ...). */
export const LEAD_ENDPOINT = import.meta.env.VITE_LEAD_ENDPOINT?.trim() || "";

export interface LeadPayload {
  kind: "lead";
  email: string;
  /** ISO 8601 timestamp, set at submit time. */
  submittedAt: string;
  /** utm_source / utm_medium / utm_campaign / utm_term / utm_content / fbclid captured from the landing URL. */
  utm: Record<string, string>;
}

export async function submitLead(payload: LeadPayload): Promise<void> {
  if (!LEAD_ENDPOINT) {
    if (!import.meta.env.PROD) {
      // Local dev convenience: the form can still be tested before a real
      // endpoint exists. Production fails rather than pretending to save leads.
      console.info("[elegant] lead captured (no endpoint configured):", payload);
      return;
    }
    throw new Error("Lead endpoint is not configured.");
  }
  if (LEAD_ENDPOINT.includes("example.com")) {
    if (!import.meta.env.PROD) {
      console.info("[elegant] lead captured (placeholder endpoint):", payload);
      return;
    }
    throw new Error("Lead endpoint is still the placeholder.");
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
