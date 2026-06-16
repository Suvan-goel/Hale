import {
  daysBetween,
  getAdherenceState,
  type CheckupType,
  type MovementAssessment,
  type MovementBlock,
  type TrainingSessionCompletion,
} from '../adherence';
import { getManualCheckupCopy } from './copy';

export interface ManualCheckupOption {
  type: CheckupType;
  title: string;
  body: string;
  route: string;
  recommended: boolean;
  isOfficialForProgress: boolean;
}

export function getManualCheckupOptions({
  latestAssessment,
  activeBlock,
  completions,
  now = new Date().toISOString(),
}: {
  latestAssessment?: MovementAssessment | null;
  activeBlock?: MovementBlock | null;
  completions?: readonly TrainingSessionCompletion[];
  now?: string;
}): ManualCheckupOption[] {
  if (!latestAssessment) {
    return [
      {
        type: 'baseline',
        title: 'Start baseline check-up',
        body: 'This is the first measurement Hale needs before creating your plan.',
        route: 'camera-setup',
        recommended: true,
        isOfficialForProgress: true,
      },
    ];
  }

  if (activeBlock) {
    const adherence = getAdherenceState(activeBlock, completions ?? [], now);
    if (adherence === 'ready_for_retest') {
      return [
        {
          type: 'official_retest',
          title: 'Start official re-test',
          body: 'Use this result for your 4-week progress comparison.',
          route: 'official-retest',
          recommended: true,
          isOfficialForProgress: true,
        },
      ];
    }
    if (adherence === 'inactive_14_days') {
      return [
        {
          type: 'quick_recheck',
          title: 'Quick re-check',
          body: 'Use a shorter check to decide whether to restart or update the block.',
          route: 'quick-recheck',
          recommended: true,
          isOfficialForProgress: false,
        },
        {
          type: 'manual_extra',
          title: 'Start full check-up anyway',
          body: 'This will be saved separately and will not replace your official trend.',
          route: 'manual-extra-checkup',
          recommended: false,
          isOfficialForProgress: false,
        },
      ];
    }
    return [
      {
        type: 'micro_check',
        title: 'Do 60-second micro-check',
        body: 'A quick check-in is usually better during an active block.',
        route: 'microcheck',
        recommended: true,
        isOfficialForProgress: false,
      },
      {
        type: 'manual_extra',
        title: 'Start full check-up anyway',
        body: 'This will be saved separately and will not reset your block.',
        route: 'manual-extra-checkup',
        recommended: false,
        isOfficialForProgress: false,
      },
    ];
  }

  if (latestAssessment.type === 'baseline' && daysBetween(latestAssessment.createdAt, now) <= 2) {
    return [
      {
        type: 'baseline_retake',
        title: 'Retake baseline',
        body: 'A retake in the first 48 hours can replace your baseline after you confirm it.',
        route: 'baseline-retake',
        recommended: true,
        isOfficialForProgress: true,
      },
      {
        type: 'manual_extra',
        title: 'Start extra check-up',
        body: 'Save another result without changing your official trend.',
        route: 'manual-extra-checkup',
        recommended: false,
        isOfficialForProgress: false,
      },
    ];
  }

  return [
    {
      type: 'manual_extra',
      title: 'Start full check-up',
      body: getManualCheckupCopy().body,
      route: 'manual-extra-checkup',
      recommended: true,
      isOfficialForProgress: false,
    },
  ];
}
