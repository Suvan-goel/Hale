import {
  daysBetween,
  type CheckupType,
  type MovementAssessment,
  type MovementBlock,
  type TrainingSessionCompletion,
} from '../adherence';
import { getBlockScheduleState } from './blockSchedule';
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
    const schedule = getBlockScheduleState({ block: activeBlock, completions: completions ?? [], today: now });
    if (schedule.status === 'retest_due') {
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
    if (schedule.status === 'session_due' && schedule.lapseState === 'restart_recommended') {
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
          title: 'Start full check-up',
          body: 'Use this if you want the complete strength, balance, and mobility check today.',
          route: 'manual-extra-checkup',
          recommended: false,
          isOfficialForProgress: false,
        },
      ];
    }
    return [
      {
        type: 'micro_check',
        title: 'Do a 60-second micro-check',
        body: 'A short check-in keeps your progress up to date without replacing your next full check-up.',
        route: 'microcheck',
        recommended: true,
        isOfficialForProgress: false,
      },
      {
        type: 'manual_extra',
        title: 'Start full check-up',
        body: 'Use this if you want the complete strength, balance, and mobility check today.',
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
