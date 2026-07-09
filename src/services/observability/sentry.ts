import * as Sentry from '@sentry/react-native';
import type * as React from 'react';

type ObservabilityEnv = Record<string, string | undefined>;
type SafeUser = { id?: string | null; email?: string | null } | null | undefined;

const SENSITIVE_KEY_EXACT = new Set([
  'video',
  'videos',
  'image',
  'images',
  'frame',
  'frames',
  'landmark',
  'landmarks',
  'uri',
  'path',
  'file',
  'files',
  'password',
  'token',
  'refresh_token',
  'access_token',
  'id_token',
  'secret',
  ['service', 'role'].join('_'),
]);

const MAX_SANITIZE_DEPTH = 6;

let initialized = false;

export function isObservabilityEnabled(env: ObservabilityEnv = process.env): boolean {
  return env.EXPO_PUBLIC_ENABLE_SENTRY === '1' && Boolean(env.EXPO_PUBLIC_SENTRY_DSN);
}

export function initObservability(env: ObservabilityEnv = process.env): boolean {
  if (!isObservabilityEnabled(env)) return false;
  if (initialized) return true;

  Sentry.init({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN,
    enabled: true,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      return sanitizeSentryEvent(event);
    },
    beforeBreadcrumb(breadcrumb) {
      return sanitizeSentryBreadcrumb(breadcrumb);
    },
  });

  initialized = true;
  return true;
}

export function captureError(
  error: unknown,
  context: Record<string, unknown> = {},
  env: ObservabilityEnv = process.env
): void {
  if (!ensureStarted(env)) return;

  Sentry.withScope((scope) => {
    const sanitizedContext = sanitizeForObservability(context);
    const area = typeof context.area === 'string' ? context.area : undefined;
    const action = typeof context.action === 'string' ? context.action : undefined;
    const category = typeof context.category === 'string' ? context.category : undefined;

    if (area) scope.setTag('area', area);
    if (action) scope.setTag('action', action);
    if (category) scope.setTag('category', category);
    scope.setContext('pearl', asContextObject(sanitizedContext));
    Sentry.captureException(error);
  });
}

export function addBreadcrumb(
  message: string,
  data: Record<string, unknown> = {},
  env: ObservabilityEnv = process.env
): void {
  if (!ensureStarted(env)) return;

  Sentry.addBreadcrumb({
    category: 'pearl',
    level: 'info',
    message,
    data: asContextObject(sanitizeForObservability(data)),
  });
}

export function setUserContext(user: SafeUser, env: ObservabilityEnv = process.env): void {
  if (!ensureStarted(env)) return;
  const id = typeof user?.id === 'string' && user.id.trim().length > 0 ? user.id : null;
  Sentry.setUser(id ? { id } : null);
}

export function wrapWithObservability<T extends React.ComponentType<unknown>>(component: T): T {
  return isObservabilityEnabled() ? (Sentry.wrap(component) as T) : component;
}

export function sanitizeForObservability(value: unknown, key = '', depth = 0, seen?: WeakSet<object>): unknown {
  if (isSensitiveObservabilityKey(key)) return null;
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return isSensitiveStringValue(value) ? null : value;
  if (typeof value !== 'object') return null;
  if (depth >= MAX_SANITIZE_DEPTH) return '[Truncated]';

  const visited = seen ?? new WeakSet<object>();
  if (visited.has(value)) return '[Circular]';
  visited.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForObservability(item, key, depth + 1, visited));
  }

  const out: Record<string, unknown> = {};
  for (const [childKey, childValue] of Object.entries(value)) {
    if (isSensitiveObservabilityKey(childKey)) continue;
    out[childKey] = sanitizeForObservability(childValue, childKey, depth + 1, visited);
  }

  return out;
}

export function resetObservabilityForTests(): void {
  initialized = false;
}

function ensureStarted(env: ObservabilityEnv): boolean {
  return initialized || initObservability(env);
}

function sanitizeSentryEvent<T extends {
  breadcrumbs?: Sentry.Breadcrumb[];
  contexts?: unknown;
  extra?: unknown;
  user?: { id?: unknown };
}>(event: T): T {
  return {
    ...event,
    contexts: asEventContexts(sanitizeForObservability(event.contexts)),
    extra: asContextObject(sanitizeForObservability(event.extra)),
    breadcrumbs: event.breadcrumbs?.map(sanitizeSentryBreadcrumb),
    user: event.user?.id ? { id: String(event.user.id) } : undefined,
  } as T;
}

function sanitizeSentryBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb {
  return {
    ...breadcrumb,
    data: asContextObject(sanitizeForObservability(breadcrumb.data)),
  };
}

function asContextObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asEventContexts(value: unknown): Sentry.Event['contexts'] {
  return asContextObject(value) as Sentry.Event['contexts'];
}

function isSensitiveObservabilityKey(key: string): boolean {
  if (!key) return false;
  const lower = key.toLowerCase();
  const normalized = lower.replace(/[^a-z0-9]/g, '');
  return (
    SENSITIVE_KEY_EXACT.has(lower) ||
    SENSITIVE_KEY_EXACT.has(normalized) ||
    normalized.includes('base64') ||
    normalized.includes('token') ||
    normalized.includes('secret') ||
    normalized.includes('servicerole') ||
    normalized.endsWith('uri') ||
    normalized.endsWith('path') ||
    normalized.endsWith('file') ||
    normalized.endsWith('files') ||
    normalized.includes('frame') ||
    normalized.includes('landmark') ||
    normalized.includes('video') ||
    normalized.includes('image') ||
    normalized.includes('password')
  );
}

function isSensitiveStringValue(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith('file://') || trimmed.startsWith('content://') || /^data:.*;base64/.test(trimmed);
}
