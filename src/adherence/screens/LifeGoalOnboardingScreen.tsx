import * as React from 'react';

import { BackArrowButton } from '../../components/BackArrowButton';
import { Screen, ScreenHeader } from '../../components/ui';
import { LifeGoalSelector } from '../components/LifeGoalSelector';
import type { LifeGoal } from '../types';

export function LifeGoalOnboardingScreen({
  initialGoal,
  mode = 'onboarding',
  onSave,
  onCancel,
}: {
  initialGoal?: LifeGoal | null;
  mode?: 'onboarding' | 'review';
  onSave: (goal: LifeGoal) => void;
  onCancel: () => void;
}) {
  const review = mode === 'review';
  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <ScreenHeader
        eyebrow={review ? 'Review your goal' : 'Your goal'}
        title={review ? 'Change your movement goal' : 'What matters most for your future?'}
        subtitle={
          review
            ? 'Choose the everyday activity that matters most now. Hale will use this when it explains your plan.'
            : 'Choose the everyday activity that matters most. Hale will use this with your check-up to shape your first plan.'
        }
      />
      <LifeGoalSelector
        initialGoal={initialGoal}
        onSave={onSave}
        primaryLabel={review ? 'Save goal' : 'Continue'}
      />
    </Screen>
  );
}
