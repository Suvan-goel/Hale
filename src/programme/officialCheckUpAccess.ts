/**
 * One policy gate for every route into an official Movement Check-Up.
 * Screens may hide an action, but the handler must enforce the same decision:
 * consent and B1 safety come first, active journeys respect the 28-day cadence,
 * and a staged draft can only resume inside an otherwise eligible journey.
 */

import { isProgrammeJourneyRetestDue } from './journey';
import type { ProgrammeState } from './types';

export type OfficialCheckUpBlockedReason =
  | 'health_data_consent_required'
  | 'gentle_start_safety_gate'
  | 'retest_not_due'
  | 'journey_completed';

export type OfficialCheckUpAccess =
  | {
      allowed: true;
      mode: 'baseline' | 'retest' | 'resume_draft';
    }
  | {
      allowed: false;
      reason: OfficialCheckUpBlockedReason;
    };

export function officialCheckUpAccess(
  state: ProgrammeState,
  nowIso: string,
  options: { hasDraft?: boolean } = {}
): OfficialCheckUpAccess {
  if (!state.profile.consentHealthData) {
    return { allowed: false, reason: 'health_data_consent_required' };
  }
  if (
    (state.profile.gentleStartActive && !state.profile.gpConfirmed) ||
    (state.profile.assessmentStatus === 'bypassed_b1' && !state.profile.gpConfirmed)
  ) {
    return { allowed: false, reason: 'gentle_start_safety_gate' };
  }
  if (state.journey.status === 'completed') {
    return { allowed: false, reason: 'journey_completed' };
  }
  if (options.hasDraft) return { allowed: true, mode: 'resume_draft' };
  if (state.journey.status === 'awaiting_baseline') {
    return { allowed: true, mode: 'baseline' };
  }
  if (isProgrammeJourneyRetestDue(state.journey, nowIso)) {
    return { allowed: true, mode: 'retest' };
  }
  return { allowed: false, reason: 'retest_not_due' };
}
