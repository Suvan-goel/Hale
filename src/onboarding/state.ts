import type { MovementBlock } from '../adherence';
import { getBlockCreationEligibility } from '../haleFlow/assessmentEligibility';
import type { StoredCheckUp } from '../history';
import type { OnboardingStep, Preferences } from '../profile';
import { scoreCheckUp } from '../scoring';

export const V1_BASELINE_MOVEMENT_IDS = [
  'chair-stand-30s',
  'balance-ladder',
  'shoulder-flexion-peak',
  'hinge-reach',
] as const;

export interface OnboardingProgressInput {
  prefs: Preferences;
  history: readonly StoredCheckUp[];
  activeBlock?: MovementBlock | null;
}

export function deriveOnboardingStep(input: OnboardingProgressInput): OnboardingStep {
  const { prefs, history, activeBlock } = input;
  if (activeBlock || prefs.onboarding.completedAt) return 'complete';
  if (!prefs.profile.lifeGoal) {
    return prefs.onboarding.currentStep === 'life_goal' ? 'life_goal' : 'welcome';
  }
  if (!prefs.profile.safetyProfile) return 'safety_profile';
  if (!equipmentStepComplete(prefs)) return 'equipment';
  const hasUsableBaseline = history.some((item) => getBlockCreationEligibility({ score: scoreCheckUp(item.checkUp) }).eligible);
  if (!hasUsableBaseline) {
    if (prefs.onboarding.currentStep === 'camera_setup' || prefs.onboarding.currentStep === 'baseline_checkup') {
      return 'camera_setup';
    }
    if (history.length > 0 && prefs.onboarding.currentStep === 'results') return 'camera_setup';
    if (prefs.onboarding.currentStep === 'camera_explanation') return 'camera_explanation';
    return 'camera_explanation';
  }
  if (prefs.onboarding.currentStep === 'create_block') return 'create_block';
  return 'results';
}

export function equipmentStepComplete(prefs: Preferences): boolean {
  return prefs.onboarding.currentStep === 'camera_explanation' ||
    prefs.onboarding.currentStep === 'camera_setup' ||
    prefs.onboarding.currentStep === 'baseline_checkup' ||
    prefs.onboarding.currentStep === 'results' ||
    prefs.onboarding.currentStep === 'create_block' ||
    prefs.onboarding.currentStep === 'complete' ||
    prefs.onboarding.selectedEquipment.length > 0;
}
