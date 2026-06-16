import * as React from 'react';

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
      <ScreenHeader
        title="What do you want your body to keep letting you do?"
        subtitle="Hale will shape your plan around the strength, balance, and mobility that matter most to your life."
      />
      <LifeGoalSelector initialGoal={initialGoal} onSave={onSave} onCancel={onCancel} />
    </Screen>
  );
}
