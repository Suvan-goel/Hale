begin;

-- Waitlist submissions from the public landing page (landing/). This is the
-- only table the anonymous web visitor can reach, and only to INSERT: no
-- select/update/delete policies exist, so the publishable key can add a lead
-- and read nothing back.
create table if not exists public.landing_leads (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'lead',
  email text not null,
  utm jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Server-side hygiene so bots cannot dump garbage past the client checks.
alter table public.landing_leads
  drop constraint if exists landing_leads_kind_check,
  drop constraint if exists landing_leads_email_shape_check,
  drop constraint if exists landing_leads_email_length_check,
  drop constraint if exists landing_leads_utm_size_check;
alter table public.landing_leads
  add constraint landing_leads_kind_check
    check (kind = 'lead'),
  add constraint landing_leads_email_shape_check
    check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'),
  add constraint landing_leads_email_length_check
    check (char_length(email) <= 320),
  add constraint landing_leads_utm_size_check
    check (pg_column_size(utm) <= 4096);

-- One row per address. The client lowercases the email and treats the 409
-- this index produces on a duplicate as success ("already on the list").
-- PostgREST's ignore-duplicates mode is NOT used: it needs SELECT privilege,
-- which the insert-only grant below deliberately withholds.
create unique index if not exists landing_leads_email_unique
  on public.landing_leads (email);

alter table public.landing_leads enable row level security;

revoke all on table public.landing_leads from anon, authenticated;
grant insert on table public.landing_leads to anon;

drop policy if exists "anon can insert leads" on public.landing_leads;
create policy "anon can insert leads" on public.landing_leads
  for insert to anon with check (true);

commit;
