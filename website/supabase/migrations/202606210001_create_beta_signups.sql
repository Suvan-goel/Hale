create extension if not exists pgcrypto;

create table if not exists public.beta_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  platform_preference text not null check (platform_preference in ('iphone', 'android', 'either')),
  source_path text not null default '/',
  consent_at timestamptz not null,
  attribution jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint beta_signups_email_unique unique (email)
);

alter table public.beta_signups enable row level security;

revoke all on table public.beta_signups from anon, authenticated;

-- The website writes through a server-only API route using SUPABASE_SERVICE_ROLE_KEY.
-- New Supabase projects may require explicit grants before tables are visible to the Data API.
grant insert, update on table public.beta_signups to service_role;

create index if not exists beta_signups_platform_preference_idx
  on public.beta_signups (platform_preference);

create index if not exists beta_signups_created_at_idx
  on public.beta_signups (created_at desc);
