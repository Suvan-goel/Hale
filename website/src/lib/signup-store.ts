import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { ValidSignup } from './validation';

interface SignupRecord extends ValidSignup {
  consentAt: string;
  userAgent: string;
}

export interface PersistSignupInput {
  signup: ValidSignup;
  consentAt: string;
  userAgent: string;
}

export async function persistSignup(input: PersistSignupInput): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (supabaseUrl && serviceRoleKey) {
    await persistToSupabase(input, supabaseUrl, serviceRoleKey);
    return;
  }

  if (process.env.BETA_SIGNUP_LOCAL_FALLBACK === '1' || process.env.NODE_ENV === 'test') {
    await persistToLocalFile(input);
    return;
  }

  throw new Error('Beta signup persistence is not configured.');
}

async function persistToSupabase(input: PersistSignupInput, supabaseUrl: string, serviceRoleKey: string): Promise<void> {
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/beta_signups?on_conflict=email`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      email: input.signup.email,
      first_name: input.signup.firstName,
      platform_preference: input.signup.platform,
      source_path: input.signup.sourcePath,
      consent_at: input.consentAt,
      attribution: input.signup.attribution,
      user_agent: input.userAgent,
      updated_at: input.consentAt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase beta signup failed with ${response.status}.`);
  }
}

async function persistToLocalFile(input: PersistSignupInput): Promise<void> {
  const path = join(process.cwd(), '.data', 'beta-signups.json');
  const existing = await readLocalRecords(path);
  const record: SignupRecord = {
    ...input.signup,
    consentAt: input.consentAt,
    userAgent: input.userAgent,
  };
  const next = {
    ...existing,
    [record.email]: record,
  };
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(next, null, 2), 'utf8');
}

async function readLocalRecords(path: string): Promise<Record<string, SignupRecord>> {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, SignupRecord>) : {};
  } catch {
    return {};
  }
}
