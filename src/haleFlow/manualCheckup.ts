import {
  type CheckupType,
  type MovementAssessment,
  type MovementBlock,
  type TrainingSessionCompletion,
} from '../adherence';

export interface ManualCheckupOption {
  type: CheckupType;
  title: string;
  body: string;
  route: string;
  recommended: boolean;
  isOfficialForProgress: boolean;
}

export function getManualCheckupOptions(_input: {
  latestAssessment?: MovementAssessment | null;
  activeBlock?: MovementBlock | null;
  completions?: readonly TrainingSessionCompletion[];
  now?: string;
}): ManualCheckupOption[] {
  return [
    {
      type: 'micro_check' as const,
      title: 'Quick micro check-up',
      body: "Do a short movement check-in. This won't change your plan.",
      route: 'optional-microcheck',
      recommended: true,
      isOfficialForProgress: false,
    },
    {
      type: 'manual_extra_v2',
      title: 'Full Movement Check-Up',
      body: "Complete the full check-up for your own reference. This won't update your Strength Profile or plan.",
      route: 'manual-extra-v2-checkup',
      recommended: false,
      isOfficialForProgress: false,
    },
  ];
}
