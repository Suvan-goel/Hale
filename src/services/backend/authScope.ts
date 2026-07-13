import type { AuthState } from './types';

/** A returned signup user without a confirmed session must never own files. */
export function authenticatedUserId(
  auth: Pick<AuthState, 'isSignedIn' | 'user'>
): string | null {
  const id = auth.user?.id;
  return auth.isSignedIn && typeof id === 'string' && id.length > 0 ? id : null;
}
