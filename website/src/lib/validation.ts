import type { AttributionPayload } from './attribution';
import type { PlatformPreference } from '@/config/site';

export interface SignupRequest {
  email: string;
  firstName?: string;
  platform: PlatformPreference;
  company?: string;
  attribution?: AttributionPayload;
  sourcePath?: string;
}

export interface ValidSignup {
  email: string;
  firstName: string | null;
  platform: PlatformPreference;
  attribution: AttributionPayload;
  sourcePath: string;
}

export interface ValidationFailure {
  ok: false;
  message: string;
  field?: keyof SignupRequest;
}

export interface ValidationSuccess {
  ok: true;
  value: ValidSignup;
}

export type ValidationResult = ValidationFailure | ValidationSuccess;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const platforms: readonly PlatformPreference[] = ['iphone', 'android', 'either'];

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isPlatformPreference(value: unknown): value is PlatformPreference {
  return typeof value === 'string' && platforms.includes(value as PlatformPreference);
}

export function validateSignupRequest(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, field: 'email', message: 'Enter a valid email address.' };
  }

  const body = input as Partial<SignupRequest>;
  if (body.company?.trim()) {
    return { ok: false, message: 'Unable to submit this request.' };
  }

  const email = normalizeEmail(String(body.email ?? ''));
  if (!emailPattern.test(email) || email.length > 254) {
    return { ok: false, field: 'email', message: 'Enter a valid email address.' };
  }

  if (!isPlatformPreference(body.platform)) {
    return { ok: false, field: 'platform', message: 'Choose your preferred platform.' };
  }

  const firstNameRaw = String(body.firstName ?? '').trim();
  const firstName = firstNameRaw ? firstNameRaw.slice(0, 80) : null;
  const sourcePath = sanitizeSourcePath(String(body.sourcePath ?? '/'));
  const attribution = sanitizeAttribution(body.attribution);

  return {
    ok: true,
    value: {
      email,
      firstName,
      platform: body.platform,
      attribution,
      sourcePath,
    },
  };
}

function sanitizeSourcePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith('/')) return '/';
  return trimmed.slice(0, 240);
}

function sanitizeAttribution(value: unknown): AttributionPayload {
  if (!value || typeof value !== 'object') return {};
  const out: AttributionPayload = {};
  for (const [key, raw] of Object.entries(value)) {
    if (
      key === 'utm_source' ||
      key === 'utm_medium' ||
      key === 'utm_campaign' ||
      key === 'utm_content' ||
      key === 'utm_term' ||
      key === 'gclid' ||
      key === 'gbraid' ||
      key === 'wbraid' ||
      key === 'landing_path'
    ) {
      out[key] = String(raw).trim().slice(0, 180);
    }
  }
  return out;
}
