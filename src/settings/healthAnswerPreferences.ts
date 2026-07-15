import type { AssessmentStatus, HeartSafetyAnswer, JointFlag } from '../programme';

/**
 * The small, local-only projection Settings is allowed to edit. Raw health
 * prose is never stored; these derived choices are the programme inputs that
 * already exist on ProgrammeProfile.
 */
export interface SettingsSafetyPreferences {
  balanceSupportDefault: boolean;
  balanceSupportPreference: boolean | null;
  balanceSupportRequired: boolean;
  lowImpact: boolean;
  quietMode: boolean;
  hasStairs: boolean | null;
  consentHealthData: boolean;
  gentleStartActive: boolean;
  heartSafetyAnswer: HeartSafetyAnswer | null;
  gpConfirmed: boolean;
  jointFlags: readonly JointFlag[];
}

export interface HealthAnswersDraft {
  heartAnswer: 'yes' | 'no' | 'prefer_not_to_say';
  jointFlags: readonly JointFlag[];
  pelvicSupport: boolean;
  balanceSupport: boolean;
}

export function saveHealthAnswers(
  current: SettingsSafetyPreferences,
  draft: HealthAnswersDraft
): SettingsSafetyPreferences {
  const gentleStartActive = draft.heartAnswer !== 'no';
  return {
    ...current,
    consentHealthData: true,
    gentleStartActive,
    heartSafetyAnswer: draft.heartAnswer,
    // Preserve a completed safety step only while the same Gentle Start
    // condition remains selected. A newly selected flag must be reviewed.
    gpConfirmed:
      gentleStartActive && current.gentleStartActive ? current.gpConfirmed : false,
    jointFlags: [...draft.jointFlags],
    lowImpact: draft.pelvicSupport,
    balanceSupportDefault: current.balanceSupportRequired
      ? true
      : draft.balanceSupport,
    balanceSupportPreference: draft.balanceSupport,
  };
}

export function removeHealthAnswers(
  current: SettingsSafetyPreferences
): SettingsSafetyPreferences {
  return {
    ...current,
    consentHealthData: false,
    gentleStartActive: false,
    heartSafetyAnswer: null,
    gpConfirmed: false,
    jointFlags: [],
    lowImpact: false,
    // Removing answers clears the voluntary health-derived choice and returns
    // to temporary safe support. A measurement requirement is never weakened.
    balanceSupportDefault: true,
    balanceSupportPreference: null,
  };
}

export function confirmGentleStartSafetyStep(
  current: SettingsSafetyPreferences
): SettingsSafetyPreferences {
  if (!current.gentleStartActive || !current.consentHealthData) return current;
  return { ...current, gpConfirmed: true };
}

export function assessmentStatusAfterHealthChange(
  current: AssessmentStatus | null,
  next: SettingsSafetyPreferences
): AssessmentStatus | null {
  if (current === 'done') return 'done';
  if (!next.consentHealthData) return 'skipped';
  if (next.gentleStartActive) return 'bypassed_b1';
  return current === 'bypassed_b1' ? 'skipped' : current;
}
