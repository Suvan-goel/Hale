import * as React from 'react';

import { BackArrowButton } from '../../components/BackArrowButton';
import { Screen, ScreenHeader } from '../../components/ui';
import { LifeGoalSelector } from '../components/LifeGoalSelector';
import type { LifeGoal } from '../types';

export function LifeGoalOnboardingScreen({
  initialGoal,
  onSave,
  onCancel,
}: {
  initialGoal?: LifeGoal | null;
  onSave: (goal: LifeGoal) => void;
  onCancel: () => void;
}) {
  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <ScreenHeader
        eyebrow="Your goal"
        title="What matters most for your future?"
        subtitle="Choose the everyday activity that matters most. Hale will use this with your check-up to shape your first plan."
      />
      <LifeGoalSelector initialGoal={initialGoal} onSave={onSave} />
    </Screen>
  );
}
