import * as React from 'react';

import { BackArrowButton } from '../../components/BackArrowButton';
import { Screen, ScreenHeader } from '../../components/ui';
import { LifeGoalSelector } from '../components/LifeGoalSelector';
import type { LifeGoal } from '../types';

export function LifeGoalOnboardingScreen({
  initialGoal,
  mode = 'onboarding',
  progress,
  onSave,
  onCancel,
}: {
  initialGoal?: LifeGoal | null;
  mode?: 'onboarding' | 'review';
  progress?: { step: number; total: number };
  onSave: (goal: LifeGoal) => void;
  onCancel: () => void;
}) {
  const review = mode === 'review';
  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <ScreenHeader
        progress={progress}
        eyebrow={review ? 'Review your goal' : 'Your goal'}
        title={review ? 'Change your movement goal' : 'What matters most for your future?'}
        subtitle="Choose the everyday activity that matters most for your future. Hale will use this when it builds your plan."
      />
      <LifeGoalSelector
        initialGoal={initialGoal}
        onSave={onSave}
        primaryLabel={review ? 'Save goal' : 'Continue'}
      />
    </Screen>
  );
}
