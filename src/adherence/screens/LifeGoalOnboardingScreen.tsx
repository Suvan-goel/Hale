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
        eyebrow="About you"
        title="What do you want your body to keep helping you do?"
        subtitle="Choose the reason that matters most. Hale will still use your Movement Check-Up to decide the first starting point."
      />
      <LifeGoalSelector initialGoal={initialGoal} onSave={onSave} />
    </Screen>
  );
}
