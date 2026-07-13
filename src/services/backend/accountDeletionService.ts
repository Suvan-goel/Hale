import { supabase } from '../../lib/supabase';
import { addBreadcrumb, captureError } from '../observability/sentry';

import { getCurrentSession } from './authService';

const ACCOUNT_DELETION_TIMEOUT_MS = 15000;

export interface CloudAccountDeletionResult {
  ok: true;
}

export interface CloudAccountDeletionRequest {
  expectedUserId: string;
  expectedAccessToken: string;
  onDeletionConfirmed?: () => void | Promise<void>;
}

/**
 * Requests deletion for the authenticated caller. The Edge Function derives
 * the account id from the verified JWT; the client never sends a user id.
 */
export async function requestCloudAccountDeletion(
  request: CloudAccountDeletionRequest
): Promise<CloudAccountDeletionResult> {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error('Sign in before deleting your online account.');
  if (
    session.user.id !== request.expectedUserId ||
    session.access_token !== request.expectedAccessToken
  ) {
    throw new Error('The signed-in account changed before deletion. Please try again.');
  }

  addBreadcrumb('cloud account deletion requested');
  try {
    const invocation = supabase.functions.invoke('delete-account', {
      body: {},
      headers: {
        Authorization: `Bearer ${request.expectedAccessToken}`,
      },
    });
    // Keep observing the underlying request after the UI timeout. If the Edge
    // Function completes late, the pre-invoke durable marker can be promoted
    // and local cleanup will resume in this process or on the next launch.
    const observedInvocation = invocation.then(async (result) => {
      if (!result.error && result.data?.ok === true && request.onDeletionConfirmed) {
        try {
          await request.onDeletionConfirmed();
        } catch (markerError) {
          captureError(markerError, {
            area: 'account',
            action: 'mark_late_cloud_deletion_confirmed',
          });
        }
      }
      return result;
    });
    const { data, error } = await withTimeout(
      observedInvocation,
      ACCOUNT_DELETION_TIMEOUT_MS
    );
    if (error) throw error;
    if (!data || data.ok !== true) {
      throw new Error('The account deletion service returned an unexpected response.');
    }

    addBreadcrumb('cloud account deletion completed');
    return { ok: true };
  } catch (error) {
    addBreadcrumb('cloud account deletion failed');
    captureError(error, { area: 'account', action: 'delete_cloud_account' });
    throw error;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error('Account deletion timed out. Device data was not cleared; check your sign-in status before retrying.')),
      timeoutMs
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
