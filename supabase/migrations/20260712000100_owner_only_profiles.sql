begin;

-- Pearl's online profile is deliberately limited to identity/reference,
-- movement-goal and selected app-preference data. Health, programme,
-- onboarding routing, check-up and Clarity data stay local.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  local_user_id text,
  full_name text,
  birth_year integer,
  sex text,
  profile_json jsonb not null default '{"schemaVersion":1,"name":"","dateOfBirth":null,"referenceSex":null,"lifeGoal":null}'::jsonb,
  onboarding_json jsonb not null default '{"schemaVersion":1}'::jsonb,
  preferences_json jsonb not null default '{"schemaVersion":1,"settings":{"voiceId":"marcus","comparisonOptIn":false}}'::jsonb,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep existing projects compatible with the app's BackendProfile shape.
alter table public.profiles add column if not exists id uuid;
alter table public.profiles add column if not exists local_user_id text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists birth_year integer;
alter table public.profiles add column if not exists sex text;
alter table public.profiles add column if not exists profile_json jsonb;
alter table public.profiles add column if not exists onboarding_json jsonb;
alter table public.profiles add column if not exists preferences_json jsonb;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists created_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz;

-- Drop this migration's guards before normalizing legacy rows. They are
-- recreated after the scrub, which keeps the migration safely re-runnable.
alter table public.profiles
  drop constraint if exists profiles_profile_json_allowlist_check,
  drop constraint if exists profiles_onboarding_json_allowlist_check,
  drop constraint if exists profiles_preferences_json_allowlist_check,
  drop constraint if exists profiles_local_user_id_must_be_null,
  drop constraint if exists profiles_onboarding_completed_at_must_be_null,
  drop constraint if exists profiles_full_name_matches_profile_json,
  drop constraint if exists profiles_birth_year_matches_profile_json,
  drop constraint if exists profiles_sex_matches_profile_json,
  drop constraint if exists profiles_full_name_value_check,
  drop constraint if exists profiles_birth_year_value_check,
  drop constraint if exists profiles_sex_value_check;

-- Legacy remotes created some of these columns NOT NULL; the canonical
-- owner-only schema has them nullable, and the scrub below can write null
-- into any of them. DROP NOT NULL is a no-op when the column is already
-- nullable, so this stays re-runnable.
alter table public.profiles
  alter column local_user_id drop not null,
  alter column full_name drop not null,
  alter column birth_year drop not null,
  alter column sex drop not null,
  alter column onboarding_completed_at drop not null;

alter table public.profiles
  alter column profile_json type jsonb using coalesce(profile_json::jsonb, '{}'::jsonb),
  alter column onboarding_json type jsonb using coalesce(onboarding_json::jsonb, '{}'::jsonb),
  alter column preferences_json type jsonb using coalesce(preferences_json::jsonb, '{}'::jsonb);

update public.profiles
set
  profile_json = coalesce(profile_json, '{}'::jsonb),
  onboarding_json = coalesce(onboarding_json, '{}'::jsonb),
  preferences_json = coalesce(preferences_json, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, created_at, now())
where
  profile_json is null
  or onboarding_json is null
  or preferences_json is null
  or created_at is null
  or updated_at is null;

-- Rebuild every legacy envelope from an explicit allowlist. In particular,
-- profile.goal was free text and could contain health information, so it is
-- discarded rather than interpreted as a LifeGoal.
with extracted as (
  select
    id,
    case
      when jsonb_typeof(profile_json -> 'name') = 'string'
        then left(btrim(profile_json ->> 'name'), 200)
      else left(btrim(coalesce(full_name, '')), 200)
    end as safe_name,
    case
      when jsonb_typeof(profile_json -> 'dateOfBirth') = 'string'
        and (profile_json ->> 'dateOfBirth') ~ '^(19|20)[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'
        then profile_json ->> 'dateOfBirth'
      else null
    end as safe_date_of_birth,
    case
      when jsonb_typeof(profile_json -> 'referenceSex') = 'string'
        and (profile_json ->> 'referenceSex') in ('female', 'male')
        then profile_json ->> 'referenceSex'
      when sex in ('female', 'male') then sex
      else null
    end as safe_reference_sex,
    case
      when jsonb_typeof(profile_json #> '{lifeGoal,category}') = 'string'
        and (profile_json #>> '{lifeGoal,category}') in (
          'stairs_walks',
          'grandchildren',
          'bend_reach_carry',
          'independence'
        )
        then profile_json #>> '{lifeGoal,category}'
      else null
    end as profile_object_goal_category,
    case
      when jsonb_typeof(profile_json -> 'lifeGoal') = 'string'
        and (profile_json ->> 'lifeGoal') in (
          'stairs_walks',
          'grandchildren',
          'bend_reach_carry',
          'independence'
        )
        then profile_json ->> 'lifeGoal'
      when jsonb_typeof(profile_json -> 'lifeGoalCategory') = 'string'
        and (profile_json ->> 'lifeGoalCategory') in (
          'stairs_walks',
          'grandchildren',
          'bend_reach_carry',
          'independence'
        )
        then profile_json ->> 'lifeGoalCategory'
      else null
    end as profile_compact_goal_category,
    case
      when jsonb_typeof(onboarding_json #> '{lifeGoal,category}') = 'string'
        and (onboarding_json #>> '{lifeGoal,category}') in (
          'stairs_walks',
          'grandchildren',
          'bend_reach_carry',
          'independence'
        )
        then onboarding_json #>> '{lifeGoal,category}'
      else null
    end as legacy_object_goal_category,
    case
      when jsonb_typeof(onboarding_json -> 'lifeGoal') = 'string'
        and (onboarding_json ->> 'lifeGoal') in (
          'stairs_walks',
          'grandchildren',
          'bend_reach_carry',
          'independence'
        )
        then onboarding_json ->> 'lifeGoal'
      when jsonb_typeof(onboarding_json -> 'lifeGoalCategory') = 'string'
        and (onboarding_json ->> 'lifeGoalCategory') in (
          'stairs_walks',
          'grandchildren',
          'bend_reach_carry',
          'independence'
        )
        then onboarding_json ->> 'lifeGoalCategory'
      else null
    end as legacy_compact_goal_category,
    profile_json,
    onboarding_json,
    preferences_json,
    birth_year
  from public.profiles
), normalized as (
  select
    *,
    coalesce(
      profile_object_goal_category,
      profile_compact_goal_category,
      legacy_object_goal_category,
      legacy_compact_goal_category
    ) as safe_goal_category,
    case
      when profile_object_goal_category is not null then
        case
          when jsonb_typeof(profile_json #> '{lifeGoal,isPrimary}') = 'boolean'
            then (profile_json #>> '{lifeGoal,isPrimary}')::boolean
          else true
        end
      when profile_compact_goal_category is not null then true
      when legacy_object_goal_category is not null then
        case
          when jsonb_typeof(onboarding_json #> '{lifeGoal,isPrimary}') = 'boolean'
            then (onboarding_json #>> '{lifeGoal,isPrimary}')::boolean
          else true
        end
      else true
    end as safe_goal_is_primary,
    case
      when jsonb_typeof(preferences_json #> '{settings,voiceId}') = 'string'
        and (preferences_json #>> '{settings,voiceId}') in ('clara', 'marcus')
        then preferences_json #>> '{settings,voiceId}'
      else 'marcus'
    end as safe_voice_id,
    case
      when jsonb_typeof(preferences_json #> '{settings,comparisonOptIn}') = 'boolean'
        then (preferences_json #>> '{settings,comparisonOptIn}')::boolean
      else false
    end as safe_comparison_opt_in
  from extracted
)
update public.profiles as profiles
set
  local_user_id = null,
  full_name = nullif(normalized.safe_name, ''),
  birth_year = case
    when normalized.safe_date_of_birth is not null
      then substring(normalized.safe_date_of_birth from 1 for 4)::integer
    else null
  end,
  sex = normalized.safe_reference_sex,
  profile_json = jsonb_build_object(
    'schemaVersion', 1,
    'name', normalized.safe_name,
    'dateOfBirth', normalized.safe_date_of_birth,
    'referenceSex', normalized.safe_reference_sex,
    'lifeGoal', case
      when normalized.safe_goal_category is null then 'null'::jsonb
      else jsonb_build_object(
        'category', normalized.safe_goal_category,
        'isPrimary', normalized.safe_goal_is_primary
      )
    end
  ),
  onboarding_json = jsonb_build_object('schemaVersion', 1),
  preferences_json = jsonb_build_object(
    'schemaVersion', 1,
    'settings', jsonb_build_object(
      'voiceId', normalized.safe_voice_id,
      'comparisonOptIn', normalized.safe_comparison_opt_in
    )
  ),
  onboarding_completed_at = null
from normalized
where profiles.id = normalized.id;

alter table public.profiles
  alter column id set not null,
  alter column profile_json set default '{"schemaVersion":1,"name":"","dateOfBirth":null,"referenceSex":null,"lifeGoal":null}'::jsonb,
  alter column profile_json set not null,
  alter column onboarding_json set default '{"schemaVersion":1}'::jsonb,
  alter column onboarding_json set not null,
  alter column preferences_json set default '{"schemaVersion":1,"settings":{"voiceId":"marcus","comparisonOptIn":false}}'::jsonb,
  alter column preferences_json set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

-- `safety_json` historically carried special-category health data. It is not
-- part of BackendProfile and must not remain in the online profile schema.
alter table public.profiles drop column if exists safety_json;

do $$
declare
  id_attnum smallint;
begin
  select attnum::smallint
  into id_attnum
  from pg_attribute
  where attrelid = 'public.profiles'::regclass
    and attname = 'id'
    and not attisdropped;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'p'
      and conkey = array[id_attnum]::smallint[]
  ) then
    if exists (
      select 1
      from pg_constraint
      where conrelid = 'public.profiles'::regclass
        and contype = 'p'
    ) then
      raise exception 'public.profiles has a primary key that is not profiles.id';
    end if;

    alter table public.profiles add constraint profiles_pkey primary key (id);
  end if;
end;
$$;

-- Replace a legacy non-cascading id foreign key without disturbing unrelated
-- constraints on the table.
do $$
declare
  existing_fk record;
  cascading_fk_count integer;
  fk_count integer;
  id_attnum smallint;
begin
  select attnum::smallint
  into id_attnum
  from pg_attribute
  where attrelid = 'public.profiles'::regclass
    and attname = 'id'
    and not attisdropped;

  select
    count(*),
    count(*) filter (where confdeltype = 'c')
  into fk_count, cascading_fk_count
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and confrelid = 'auth.users'::regclass
    and contype = 'f'
    and conkey = array[id_attnum]::smallint[];

  if fk_count <> 1 or cascading_fk_count <> 1 then
    for existing_fk in
      select conname
      from pg_constraint
      where conrelid = 'public.profiles'::regclass
        and confrelid = 'auth.users'::regclass
        and contype = 'f'
        and conkey = array[id_attnum]::smallint[]
    loop
      execute format('alter table public.profiles drop constraint %I', existing_fk.conname);
    end loop;

    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
end;
$$;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

-- Auth owns this trigger. Only the two non-health name keys are inspected;
-- all other user metadata is deliberately ignored.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_full_name text;
begin
  profile_full_name := nullif(
    left(
      btrim(
        coalesce(
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      200
    ),
    ''
  );

  insert into public.profiles (
    id,
    full_name,
    profile_json,
    onboarding_json,
    preferences_json
  )
  values (
    new.id,
    profile_full_name,
    jsonb_build_object(
      'schemaVersion', 1,
      'name', coalesce(profile_full_name, ''),
      'dateOfBirth', null,
      'referenceSex', null,
      'lifeGoal', null
    ),
    jsonb_build_object('schemaVersion', 1),
    jsonb_build_object(
      'schemaVersion', 1,
      'settings', jsonb_build_object(
        'voiceId', 'marcus',
        'comparisonOptIn', false
      )
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill accounts created before the checked-in trigger existed.
insert into public.profiles (
  id,
  full_name,
  profile_json,
  onboarding_json,
  preferences_json
)
select
  users.id,
  nullif(
    left(
      btrim(
        coalesce(
          users.raw_user_meta_data ->> 'full_name',
          users.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      200
    ),
    ''
  ) as full_name,
  jsonb_build_object(
    'schemaVersion', 1,
    'name', left(
      btrim(
        coalesce(
          users.raw_user_meta_data ->> 'full_name',
          users.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      200
    ),
    'dateOfBirth', null,
    'referenceSex', null,
    'lifeGoal', null
  ),
  jsonb_build_object('schemaVersion', 1),
  jsonb_build_object(
    'schemaVersion', 1,
    'settings', jsonb_build_object(
      'voiceId', 'marcus',
      'comparisonOptIn', false
    )
  )
from auth.users as users
on conflict (id) do nothing;

-- Database checks keep older or hand-written clients from widening the
-- online boundary after this one-time scrub.
alter table public.profiles
  add constraint profiles_profile_json_allowlist_check check (
    jsonb_typeof(profile_json) = 'object'
    and profile_json ?& array[
      'schemaVersion',
      'name',
      'dateOfBirth',
      'referenceSex',
      'lifeGoal'
    ]
    and profile_json - array[
      'schemaVersion',
      'name',
      'dateOfBirth',
      'referenceSex',
      'lifeGoal'
    ] = '{}'::jsonb
    and profile_json -> 'schemaVersion' = '1'::jsonb
    and jsonb_typeof(profile_json -> 'name') = 'string'
    and char_length(profile_json ->> 'name') <= 200
    and (
      profile_json -> 'dateOfBirth' = 'null'::jsonb
      or (
        jsonb_typeof(profile_json -> 'dateOfBirth') = 'string'
        and (profile_json ->> 'dateOfBirth') ~ '^(19|20)[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'
      )
    )
    and (
      profile_json -> 'referenceSex' = 'null'::jsonb
      or (
        jsonb_typeof(profile_json -> 'referenceSex') = 'string'
        and (profile_json ->> 'referenceSex') in ('female', 'male')
      )
    )
    and (
      profile_json -> 'lifeGoal' = 'null'::jsonb
      or (
        jsonb_typeof(profile_json -> 'lifeGoal') = 'object'
        and (profile_json -> 'lifeGoal') ?& array['category', 'isPrimary']
        and (profile_json -> 'lifeGoal') - array['category', 'isPrimary'] = '{}'::jsonb
        and jsonb_typeof(profile_json #> '{lifeGoal,category}') = 'string'
        and (profile_json #>> '{lifeGoal,category}') in (
          'stairs_walks',
          'grandchildren',
          'bend_reach_carry',
          'independence'
        )
        and jsonb_typeof(profile_json #> '{lifeGoal,isPrimary}') = 'boolean'
      )
    )
  ),
  add constraint profiles_onboarding_json_allowlist_check check (
    onboarding_json = '{"schemaVersion":1}'::jsonb
  ),
  add constraint profiles_preferences_json_allowlist_check check (
    jsonb_typeof(preferences_json) = 'object'
    and preferences_json ?& array['schemaVersion', 'settings']
    and preferences_json - array['schemaVersion', 'settings'] = '{}'::jsonb
    and preferences_json -> 'schemaVersion' = '1'::jsonb
    and jsonb_typeof(preferences_json -> 'settings') = 'object'
    and (preferences_json -> 'settings') ?& array['voiceId', 'comparisonOptIn']
    and (preferences_json -> 'settings') - array['voiceId', 'comparisonOptIn'] = '{}'::jsonb
    and jsonb_typeof(preferences_json #> '{settings,voiceId}') = 'string'
    and (preferences_json #>> '{settings,voiceId}') in ('clara', 'marcus')
    and jsonb_typeof(preferences_json #> '{settings,comparisonOptIn}') = 'boolean'
  ),
  add constraint profiles_local_user_id_must_be_null check (local_user_id is null),
  add constraint profiles_onboarding_completed_at_must_be_null check (
    onboarding_completed_at is null
  ),
  add constraint profiles_full_name_value_check check (
    full_name is null or char_length(full_name) <= 200
  ),
  add constraint profiles_birth_year_value_check check (
    birth_year is null
    or birth_year between 1900 and 2099
  ),
  add constraint profiles_sex_value_check check (
    sex is null or sex in ('female', 'male')
  );

alter table public.profiles enable row level security;

-- Remove any legacy/public policies before installing the owner-only set.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', existing_policy.policyname);
  end loop;
end;
$$;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

comment on table public.profiles is
  'Private account profile and non-health app settings. Never store health, programme, check-up, Clarity, camera or landmark data here.';
comment on column public.profiles.profile_json is
  'Exact allowlist: schemaVersion, name, dateOfBirth, referenceSex and compact predefined lifeGoal. Free-text goal is local-only.';
comment on column public.profiles.onboarding_json is
  'Compatibility envelope containing schemaVersion only. Onboarding and programme routing stay on-device.';
comment on column public.profiles.preferences_json is
  'Exact allowlist: schemaVersion and settings.voiceId/comparisonOptIn only.';

commit;
