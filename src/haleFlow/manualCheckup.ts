import {
  daysBetween,
  type CheckupType,
  type MovementAssessment,
  type MovementBlock,
  type TrainingSessionCompletion,
} from '../adherence';
import { getBlockScheduleState } from './blockSchedule';
import { getManualCheckupCopy } from './copy';
import { getBlockMicroCheckTarget, getMicroCheckForTarget } from './microCheck';

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
      return [];
    }
    const microCheckTarget = getBlockMicroCheckTarget({
      block: activeBlock,
      schedule,
      completions: completions ?? [],
    });
    const microCheckDefinition =
      microCheckTarget.status === 'available' ? getMicroCheckForTarget(microCheckTarget) : null;
    return microCheckDefinition
      ? [
          {
            type: 'micro_check' as const,
            title: microCheckDefinition.title,
            body: microCheckDefinition.body,
            route: 'microcheck',
            recommended: true,
            isOfficialForProgress: false,
          },
        ]
      : [];
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
    ];
  }

  return [
    {
      type: 'baseline_retake',
      title: 'Start Movement Check-Up',
      body: getManualCheckupCopy().body,
      route: 'baseline-retake',
      recommended: true,
      isOfficialForProgress: true,
    },
  ];
}
