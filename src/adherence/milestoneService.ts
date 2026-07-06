import type { CheckUpScore, DomainResult } from '../scoring';
import { scoreDomainFromMovementDomain } from './blockService';
import { movementBlockDomainFocus } from './blockFocus';
import { getLifeGoalDisplayText } from './goalDomainMapping';
import type {
  IdentityMilestone,
  IdentityMilestoneType,
  LifeGoal,
  MovementBlock,
  TrainingSessionCompletion,
} from './types';
import { LOCAL_USER_ID } from './types';

import { BRAND } from '../brand';
export function generateMilestones({
  user,
  block,
  lifeGoal,
  latestAssessment,
  previousAssessment,
  completions,
  existing = [],
  nowIso = new Date().toISOString(),
}: {
  user?: { age?: number | null } | null;
  block?: MovementBlock | null;
  lifeGoal?: LifeGoal | null;
  latestAssessment?: CheckUpScore | null;
  previousAssessment?: CheckUpScore | null;
  completions: readonly TrainingSessionCompletion[];
  existing?: readonly IdentityMilestone[];
  nowIso?: string;
}): IdentityMilestone[] {
  const out: IdentityMilestone[] = [];
  if (!block) return out;
  push(out, existing, makeMilestone('first_block_started', block, nowIso, lifeGoal));

  const trainingCompletions = completions.filter(
    (c) => c.blockId === block.id && c.scheduleCredit?.credited === true
  );
  const uniqueMainPlanTemplates = new Set(
    trainingCompletions
      .map((completion) => completion.templateId ?? completion.plannedDate?.split(':')[0])
      .filter((templateId): templateId is string => !!templateId)
  );
  if (uniqueMainPlanTemplates.size >= block.sessionsPerWeekTarget) {
    push(out, existing, makeMilestone('first_week_completed', block, nowIso, lifeGoal));
  }
  if (trainingCompletions.some((c) => c.sessionType === 'restart')) {
    push(out, existing, makeMilestone('first_restart', block, nowIso, lifeGoal));
  }
  if (block.status === 'completed' || completions.some((c) => c.blockId === block.id && c.sessionType === 'retest')) {
    push(out, existing, makeMilestone('block_completed', block, nowIso, lifeGoal));
    push(out, existing, makeMilestone('retest_completed', block, nowIso, lifeGoal));
  }

  const latest = domainResult(latestAssessment, block);
  const previous = domainResult(previousAssessment, block);
  if (latest?.measured && previous?.measured) {
    const latestMid = domainMidpoint(latest);
    const previousMid = domainMidpoint(previous);
    if (latestMid < previousMid) push(out, existing, makeMilestone('domain_recorded_lower', block, nowIso, lifeGoal));
    if (latestMid === previousMid) push(out, existing, makeMilestone('domain_similar', block, nowIso, lifeGoal));
  }
  if (user?.age && latest?.measured && latest.ageHigh < user.age) {
    push(out, existing, makeMilestone('younger_than_age_band', block, nowIso, lifeGoal));
  }
  if (lifeGoal && trainingCompletions.length > 0) {
    push(out, existing, makeMilestone('goal_supported', block, nowIso, lifeGoal));
  }
  return out;
}

export function getMilestoneCopy(type: IdentityMilestoneType, lifeGoal?: LifeGoal | null): { title: string; body: string } {
  switch (type) {
    case 'first_block_started':
      return {
        title: 'Your block has begun',
        body: 'You started training for the life you want to keep living.',
      };
    case 'first_week_completed':
      return {
        title: 'You supported your progress this week',
        body: 'Three sessions in a week is a strong start to a lasting rhythm.',
      };
    case 'first_restart':
      return {
        title: 'You came back',
        body: 'You returned after a gap. That is what consistency actually looks like.',
      };
    case 'block_completed':
      return {
        title: 'Four weeks complete',
        body: `You completed a full ${BRAND.appName} block and built proof you can return to the routine.`,
      };
    case 'retest_completed':
      return {
        title: 'Re-test complete',
        body: 'Your new check-up is ready to guide the next block.',
      };
    case 'domain_recorded_lower':
      return {
        title: 'New focus data point',
        body: 'Your latest re-test changed the estimate for your focus domain.',
      };
    case 'domain_similar':
      return {
        title: 'Similar focus result',
        body: 'Your latest re-test added a similar estimate for your focus domain.',
      };
    case 'younger_than_age_band':
      return {
        title: 'Beta estimate noted',
        body: `This home estimate is below your age. ${BRAND.appName} keeps beta ranges labelled in the app.`,
      };
    case 'goal_supported':
      return {
        title: 'Training for what matters',
        body: lifeGoal
          ? `This block supports your goal: ${getLifeGoalDisplayText(lifeGoal).toLowerCase()}.`
          : 'You are becoming someone who trains to stay capable.',
      };
  }
}

function makeMilestone(
  type: IdentityMilestoneType,
  block: MovementBlock,
  nowIso: string,
  lifeGoal?: LifeGoal | null
): IdentityMilestone {
  const copy = getMilestoneCopy(type, lifeGoal);
  return {
    id: `milestone-${block.id}-${type}`,
    userId: block.userId || LOCAL_USER_ID,
    blockId: block.id,
    type,
    title: copy.title,
    body: copy.body,
    createdAt: nowIso,
  };
}

function push(
  out: IdentityMilestone[],
  existing: readonly IdentityMilestone[],
  milestone: IdentityMilestone
): void {
  const key = `${milestone.userId}:${milestone.blockId}:${milestone.type}`;
  const already = existing.some((m) => `${m.userId}:${m.blockId}:${m.type}` === key);
  const queued = out.some((m) => `${m.userId}:${m.blockId}:${m.type}` === key);
  if (!already && !queued) out.push(milestone);
}

function domainResult(score: CheckUpScore | null | undefined, block: MovementBlock): DomainResult | null {
  if (!score) return null;
  const focusDomain = movementBlockDomainFocus(block);
  if (!focusDomain) return null;
  const domain = scoreDomainFromMovementDomain(focusDomain);
  return score.domains.find((d) => d.domain === domain) ?? null;
}

function domainMidpoint(domain: DomainResult): number {
  return (domain.ageLow + domain.ageHigh) / 2;
}
