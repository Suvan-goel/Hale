import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function repoFile(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('Supabase online-profile backend contract', () => {
  it('owns profiles by auth user with cascade deletion and owner-only RLS', () => {
    const sql = repoFile('supabase/migrations/20260712000100_owner_only_profiles.sql');

    expect(sql).toMatch(/references auth\.users \(id\) on delete cascade/i);
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/to authenticated\s+using \(\(select auth\.uid\(\)\) = id\)/i);
    expect(sql).toMatch(/with check \(\(select auth\.uid\(\)\) = id\)/i);
    expect(sql).toMatch(/revoke all on table public\.profiles from anon/i);
    expect(sql).not.toMatch(/create policy[^;]+to anon/is);
  });

  it('removes the retired remote health envelope', () => {
    const sql = repoFile('supabase/migrations/20260712000100_owner_only_profiles.sql');
    expect(sql).toMatch(/drop column if exists safety_json/i);
  });

  it('enforces the JSON and compatibility-column profile allowlist in the database', () => {
    const sql = repoFile('supabase/migrations/20260712000100_owner_only_profiles.sql');

    expect(sql).toContain('profiles_profile_json_allowlist_check');
    expect(sql).toContain('profiles_preferences_json_allowlist_check');
    expect(sql).toContain('profiles_onboarding_json_allowlist_check');
    expect(sql).toContain('profiles_full_name_value_check');
    expect(sql).toContain('profiles_birth_year_value_check');
    expect(sql).toContain('profiles_sex_value_check');
    expect(sql).toMatch(/new\.updated_at = clock_timestamp\(\)/i);
  });

  it('deletes only the verified JWT caller and accepts no request user id', () => {
    const source = repoFile('supabase/functions/delete-account/index.ts');
    const config = repoFile('supabase/config.toml');

    expect(config).toMatch(/\[functions\.delete-account\][\s\S]*verify_jwt = true/);
    expect(source).toContain('admin.auth.getUser(jwt)');
    expect(source).toMatch(/admin\.auth\.admin\.deleteUser\(\s*user\.id/);
    expect(source).not.toMatch(/request\.json|request\.text|user[_-]?id/i);
  });

  it('removes every retired cloud programme and measurement table without a silent cascade', () => {
    const sql = repoFile(
      'supabase/migrations/20260712000200_remove_legacy_cloud_programme_data.sql'
    );
    const retiredTables = [
      'movement_block_reports',
      'micro_checks',
      'training_session_completions',
      'training_state',
      'movement_blocks',
      'movement_checkups',
    ];

    for (const table of retiredTables) expect(sql).toContain(`public.${table}`);
    expect(sql).not.toMatch(/\bcascade\b(?=\s*;)/i);
  });
});
