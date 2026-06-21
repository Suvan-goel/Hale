import type { CheckUpScore, Domain, ScoreFocusSelection } from '../scoring';
import {
  getBlockCreationEligibility,
  movementDomainFromScoreDomainStrict,
  type BlockCreationEligibility,
  type BlockCreationIneligibilityReason,
} from '../haleFlow/assessmentEligibility';
import { addDaysIso } from './dateUtils';
import { getLifeGoalTrainingRelevance } from './goalDomainMapping';
import type { AssessmentForBlock, LifeGoal, MovementBlock, MovementDomain } from './types';
import { LOCAL_USER_ID } from './types';

const ALL_DOMAINS: MovementDomain[] = ['strength_power', 'balance', 'mobility'];

export function movementDomainFromScoreDomain(domain: Domain | null | undefined): MovementDomain {
  const mapped = movementDomainFromScoreDomainOrNull(domain);
  // Compatibility display fallback only. Block creation must use
  // getBlockCreationEligibility so missing evidence never becomes strength.
  if (mapped) return mapped;
  return 'strength_power';
}

export function movementDomainFromScoreDomainOrNull(domain: Domain | MovementDomain | null | undefined): MovementDomain | null {
  return movementDomainFromScoreDomainStrict(domain);
}

export function scoreDomainFromMovementDomain(domain: MovementDomain): Domain {
  return domain === 'strength_power' ? 'strength' : domain;
}

export class IneligibleMovementBlockError extends Error {
  readonly reason: BlockCreationIneligibilityReason;
  readonly measuredDomainCount: number;

  constructor(eligibility: Extract<BlockCreationEligibility, { eligible: false }>) {
    super(`Cannot create movement block from ineligible assessment: ${eligibility.reason}`);
    this.name = 'IneligibleMovementBlockError';
    this.reason = eligibility.reason;
    this.measuredDomainCount = eligibility.measuredDomains.length;
  }
}

export type CreateMovementBlockResult =
  | { ok: true; block: MovementBlock }
  | ({ ok: false } & Extract<BlockCreationEligibility, { eligible: false }>);

export function tryCreateMovementBlockFromAssessment(args: {
  userId?: string;
  latestAssessment?: AssessmentForBlock | CheckUpScore | null;
  lifeGoal?: LifeGoal | null;
  startDate?: string;
}): CreateMovementBlockResult {
  const normalized = normalizeAssessmentForBlock(args.latestAssessment);
  const eligibility = getBlockCreationEligibility({
    score: normalized.score,
    scoreSnapshot: normalized.scoreSnapshot,
    assessment: normalized.assessment,
  });
  if (!eligibility.eligible) {
    return { ok: false, ...eligibility };
  }

  return {
    ok: true,
    block: buildMovementBlock({
      userId: args.userId ?? LOCAL_USER_ID,
      sourceCheckUpId: normalized.sourceCheckUpId,
      lifeGoal: args.lifeGoal,
      startDate: args.startDate ?? new Date().toISOString(),
      focusDomain: eligibility.focusDomain,
      focusSelection: eligibility.focusSelection,
    }),
  };
}

export function createMovementBlockFromAssessment({
  userId = LOCAL_USER_ID,
  latestAssessment,
  lifeGoal,
  startDate = new Date().toISOString(),
}: {
  userId?: string;
  latestAssessment?: AssessmentForBlock | CheckUpScore | null;
  lifeGoal?: LifeGoal | null;
  startDate?: string;
}): MovementBlock {
  const result = tryCreateMovementBlockFromAssessment({ userId, latestAssessment, lifeGoal, startDate });
  if (!result.ok) throw new IneligibleMovementBlockError(result);
  return result.block;
}

function buildMovementBlock({
  userId,
  sourceCheckUpId,
  lifeGoal,
  startDate,
  focusDomain,
  focusSelection,
}: {
  userId: string;
  sourceCheckUpId?: string;
  lifeGoal?: LifeGoal | null;
  startDate: string;
  focusDomain: MovementDomain;
  focusSelection?: ScoreFocusSelection;
}): MovementBlock {
  const relevance = getLifeGoalTrainingRelevance(lifeGoal);
  const goalDomains = relevance.primaryDomains.filter((d) => d !== focusDomain);
  const secondaryDomains = uniqueDomains([...goalDomains, ...ALL_DOMAINS.filter((d) => d !== focusDomain)]).slice(0, 2);
  const endDate = addDaysIso(startDate, 28);

  return {
    id: `movement-block-${startDate.replace(/[:.]/g, '-')}`,
    userId,
    lifeGoalId: lifeGoal?.id,
    status: 'active',
    startDate,
    endDate,
    retestDate: endDate,
    focusDomain,
    secondaryDomains,
    ...(focusSelection
      ? {
          focusSelectionKind: focusSelection.kind,
          focusTiedDomains: focusSelection.tiedDomains
            .map(movementDomainFromScoreDomainOrNull)
            .filter((domain): domain is MovementDomain => !!domain),
          ...(focusSelection.tieBreakReason ? { focusTieBreakReason: focusSelection.tieBreakReason } : {}),
          ...(typeof focusSelection.nearTieMarginYears === 'number'
            ? { focusNearTieMarginYears: focusSelection.nearTieMarginYears }
            : {}),
          ...(typeof focusSelection.policyVersion === 'number'
            ? { focusSelectionPolicyVersion: focusSelection.policyVersion }
            : {}),
        }
      : {}),
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 0,
    microChecksCompleted: 0,
    sourceCheckUpId,
    createdAt: startDate,
    updatedAt: startDate,
  };
}

function normalizeAssessmentForBlock(latestAssessment: AssessmentForBlock | CheckUpScore | null | undefined): {
  score: CheckUpScore | null;
  scoreSnapshot?: AssessmentForBlock['scoreSnapshot'];
  assessment?: AssessmentForBlock['assessment'];
  sourceCheckUpId?: string;
} {
  if (isAssessmentForBlock(latestAssessment)) {
    return {
      score: latestAssessment.score,
      scoreSnapshot: latestAssessment.scoreSnapshot,
      assessment: latestAssessment.assessment,
      sourceCheckUpId:
        latestAssessment.sourceCheckUpId ??
        latestAssessment.id ??
        rawCheckUpId(latestAssessment.assessment) ??
        latestAssessment.score.startedAt,
    };
  }
  return { score: latestAssessment ?? null, sourceCheckUpId: latestAssessment?.startedAt };
}

function isAssessmentForBlock(v: unknown): v is AssessmentForBlock {
  return !!v && typeof v === 'object' && 'score' in v;
}

export function movementBlockSourceCheckUpId(
  block: Pick<MovementBlock, 'sourceCheckUpId' | 'sourceAssessmentId'> | null | undefined
): string | undefined {
  return block?.sourceCheckUpId ?? block?.sourceAssessmentId;
}

function rawCheckUpId(assessment: AssessmentForBlock['assessment']): string | undefined {
  const value = assessment?.results?.rawMetrics?.checkUpId;
  return typeof value === 'string' ? value : undefined;
}

export function getActiveMovementBlock(blocks: readonly MovementBlock[]): MovementBlock | null {
  const active = blocks.filter((b) => b.status === 'active' || b.status === 'paused');
  if (active.length === 0) return null;
  return active.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function getLatestMovementBlock(blocks: readonly MovementBlock[]): MovementBlock | null {
  if (blocks.length === 0) return null;
  return blocks.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function uniqueDomains(domains: MovementDomain[]): MovementDomain[] {
  const out: MovementDomain[] = [];
  for (const d of domains) {
    if (!out.includes(d)) out.push(d);
  }
  return out;
}
