import {
  blockProgress,
  daysUntil,
  domainLabel,
  type MovementBlock,
  type MovementBlockReport,
  type MovementDomain,
  type TrainingSessionCompletion,
} from '../adherence';
import { CheckUp, findItem } from '../checkup/types';
import type { StoredCheckUp } from '../history';
import { getExerciseLadder } from '../exercises';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
  type BalanceResult,
  type ChairStandResult,
  type HingeReachResult,
  type ShoulderFlexionResult,
} from '../movements';
import { scoreCheckUp, type CheckUpScore, type Domain } from '../scoring';
import type { LadderProgress } from '../training';
import type { MovementSnapshotBand } from './appLifecycle';

export type ProgressTrend = 'improved' | 'held_steady' | 'lower' | 'unknown';

export interface LatestCheckUpSummary {
  dateLabel: string;
  focusTitle: string;
  bands: Record<Domain, MovementSnapshotBand | 'pending'>;
}

export interface DomainProgressCard {
  domain: Domain;
  title: string;
  metric: string;
  body: string;
  trend: ProgressTrend;
}

export interface LadderProgressCard {
  ladderId: string;
  title: string;
  levelName: string;
  status: 'Building' | 'Ready for next step' | 'Holding steady';
}

export interface BlockReportSummary {
  blockId: string;
  dateRange: string;
  focus: string;
  sessions: string;
  mainChange: string;
}

export interface RetestHistoryEntry {
  id: string;
  dateLabel: string;
  bands: Record<Domain, MovementSnapshotBand | 'pending'>;
}

export interface RetestDueSummary {
  title: string;
  body: string;
  ctaLabel?: string;
  due: boolean;
}

const DOMAIN_TITLE: Record<Domain, string> = {
  strength: 'Strength / Power',
  balance: 'Balance',
  mobility: 'Mobility',
};

const LADDER_ROWS: readonly { id: string; title: string }[] = [
  { id: 'sit-to-stand', title: 'Sit-to-Stand' },
  { id: 'squat', title: 'Squat' },
  { id: 'balance', title: 'Balance' },
  { id: 'push', title: 'Push' },
  { id: 'pull-upper-back', title: 'Pull / Upper Back' },
  { id: 'mobility-flexibility', title: 'Mobility' },
];

export function getLatestCheckUpSummary(history: readonly StoredCheckUp[] | null | undefined): LatestCheckUpSummary | null {
  const latest = latestCheckUp(history);
  if (!latest) return null;
  const score = scoreCheckUp(latest);
  return {
    dateLabel: formatDate(latest.startedAt),
    focusTitle: focusTitle(score.weakestDomain),
    bands: domainBands(score),
  };
}

export function getDomainProgressCards(history: readonly StoredCheckUp[] | null | undefined): DomainProgressCard[] {
  const checkUps = checkUpsFromHistory(history);
  if (checkUps.length === 0) return [];
  const baseline = checkUps[0];
  const latest = checkUps[checkUps.length - 1];
  const hasComparison = checkUps.length > 1;
  return [
    strengthCard(metricSnapshot(baseline), hasComparison ? metricSnapshot(latest) : null),
    balanceCard(metricSnapshot(baseline), hasComparison ? metricSnapshot(latest) : null),
    mobilityCard(metricSnapshot(baseline), hasComparison ? metricSnapshot(latest) : null),
  ];
}

export function getLadderProgressCards(
  ladderProgressById: Record<string, LadderProgress> | null | undefined
): LadderProgressCard[] {
  const progress = ladderProgressById ?? {};
  return LADDER_ROWS.map((row) => {
    const item = progress[row.id];
    if (!item) return null;
    return {
      ladderId: row.id,
      title: row.title,
      levelName: levelLabel(row.id, item.currentLevelId),
      status: ladderStatus(item),
    };
  }).filter((item): item is LadderProgressCard => !!item);
}

export function getBlockReportSummaries({
  blocks,
  reports,
  completions,
}: {
  blocks?: readonly MovementBlock[] | null;
  reports?: readonly MovementBlockReport[] | null;
  completions?: readonly TrainingSessionCompletion[] | null;
}): BlockReportSummary[] {
  const allBlocks = blocks ?? [];
  const allReports = reports ?? [];
  const allCompletions = completions ?? [];
  const reportedBlockIds = new Set(allReports.map((report) => report.blockId));
  const candidates = allBlocks.filter((block) => block.status === 'completed' || reportedBlockIds.has(block.id));
  return candidates
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((block) => {
      const report = allReports.find((item) => item.blockId === block.id);
      const progress = blockProgress(block, allCompletions);
      return {
        blockId: block.id,
        dateRange: `${formatDate(block.startDate)} - ${formatDate(block.endDate)}`,
        focus: domainLabel(block.focusDomain),
        sessions: `${report?.sessionsCompleted ?? progress.completedSessions} of ${block.totalPlannedSessions} sessions`,
        mainChange: report ? mainChangeFromReport(report) : 'Re-test history will add the main change for this block.',
      };
    });
}

export function getRetestHistory(history: readonly StoredCheckUp[] | null | undefined): RetestHistoryEntry[] {
  return checkUpsFromHistory(history)
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .map((checkUp) => ({
      id: checkUp.startedAt,
      dateLabel: formatDate(checkUp.startedAt),
      bands: domainBands(scoreCheckUp(checkUp)),
    }));
}

export function getRetestDueSummary({
  activeBlock,
  today,
  hasBaseline,
}: {
  activeBlock?: MovementBlock | null;
  today: string;
  hasBaseline: boolean;
}): RetestDueSummary {
  if (!hasBaseline) {
    return {
      title: 'Start with your baseline',
      body: 'Complete your first Movement Check-Up to see progress here.',
      ctaLabel: 'Start Movement Check-Up',
      due: false,
    };
  }
  if (!activeBlock) {
    return {
      title: 'Next re-test',
      body: 'Create a 4-week block to set your next Movement Check-Up.',
      due: false,
    };
  }
  const days = daysUntil(activeBlock.retestDate, today);
  if (activeBlock.status === 'completed' || days <= 0) {
    return {
      title: "It's time to re-test",
      body: 'Repeat your Movement Check-Up to see what changed.',
      ctaLabel: 'Start re-test',
      due: true,
    };
  }
  return {
    title: 'Next re-test',
    body: `Your next Movement Check-Up is in ${days} ${days === 1 ? 'day' : 'days'}.`,
    due: false,
  };
}

function strengthCard(baseline: MetricSnapshot, latest: MetricSnapshot | null): DomainProgressCard {
  const start = baseline.chairStandReps;
  const current = latest?.chairStandReps;
  if (!finite(start)) return missingCard('strength');
  if (!latest) {
    return {
      domain: 'strength',
      title: DOMAIN_TITLE.strength,
      metric: `Chair stands: ${start} reps`,
      body: 'This is your starting point.',
      trend: 'unknown',
    };
  }
  if (!finite(current)) return missingLatestCard('strength', `Chair stands: ${start} reps`);
  const delta = current - start;
  return {
    domain: 'strength',
    title: DOMAIN_TITLE.strength,
    metric: `Chair stands: ${start} -> ${current} reps`,
    body:
      delta > 0
        ? `That's ${delta} more strong ${delta === 1 ? 'rise' : 'rises'} from a chair in 30 seconds.`
        : delta === 0
          ? 'You held steady. Your next block will keep building this.'
          : "Today's result was lower. That can happen - Hale will adjust your next block.",
    trend: delta > 0 ? 'improved' : delta === 0 ? 'held_steady' : 'lower',
  };
}

function balanceCard(baseline: MetricSnapshot, latest: MetricSnapshot | null): DomainProgressCard {
  const start = baseline.balanceHoldSec;
  const current = latest?.balanceHoldSec;
  const label = baseline.balanceLabel ?? latest?.balanceLabel ?? 'Balance hold';
  if (!finite(start)) return missingCard('balance');
  if (!latest) {
    return {
      domain: 'balance',
      title: DOMAIN_TITLE.balance,
      metric: `${label}: ${Math.round(start)}s`,
      body: 'This is your starting point.',
      trend: 'unknown',
    };
  }
  if (!finite(current)) return missingLatestCard('balance', `${label}: ${Math.round(start)}s`);
  const delta = current - start;
  return {
    domain: 'balance',
    title: DOMAIN_TITLE.balance,
    metric: `${label}: ${Math.round(start)}s -> ${Math.round(current)}s`,
    body:
      delta > 0
        ? `That's ${Math.round(delta)} more steady ${Math.round(delta) === 1 ? 'second' : 'seconds'}.`
        : Math.abs(delta) < 0.5
          ? 'You held steady. The next block will keep building this.'
          : "Today's hold was shorter. That can happen - Hale will adjust your next block.",
    trend: delta > 0 ? 'improved' : Math.abs(delta) < 0.5 ? 'held_steady' : 'lower',
  };
}

function mobilityCard(baseline: MetricSnapshot, latest: MetricSnapshot | null): DomainProgressCard {
  const startShoulder = baseline.shoulderFlexionDeg;
  const currentShoulder = latest?.shoulderFlexionDeg;
  const startReach = baseline.hingeReachBu;
  const currentReach = latest?.hingeReachBu;
  if (!finite(startShoulder) && !finite(startReach)) return missingCard('mobility');
  if (!latest) {
    return {
      domain: 'mobility',
      title: DOMAIN_TITLE.mobility,
      metric: mobilityMetric(startShoulder, null, startReach, null),
      body: 'This is your starting point.',
      trend: 'unknown',
    };
  }
  const shoulderDelta = finite(startShoulder) && finite(currentShoulder) ? currentShoulder - startShoulder : null;
  // Hinge reach is wrist-to-floor distance in body units; lower means closer to the floor.
  const reachDelta = finite(startReach) && finite(currentReach) ? startReach - currentReach : null;
  const improved = (shoulderDelta ?? 0) > 0 || (reachDelta ?? 0) > 0.01;
  const lower = (shoulderDelta ?? 0) < 0 || (reachDelta ?? 0) < -0.01;
  return {
    domain: 'mobility',
    title: DOMAIN_TITLE.mobility,
    metric: mobilityMetric(startShoulder, currentShoulder, startReach, currentReach),
    body: improved
      ? 'Your mobility check is improving.'
      : lower
        ? "Today's mobility result was lower. That can happen - Hale will adjust your next block."
        : 'You held steady. Your next block will keep building this.',
    trend: improved ? 'improved' : lower ? 'lower' : 'held_steady',
  };
}

interface MetricSnapshot {
  chairStandReps?: number;
  balanceHoldSec?: number;
  balanceLabel?: string;
  shoulderFlexionDeg?: number;
  hingeReachBu?: number;
}

function metricSnapshot(checkUp: CheckUp): MetricSnapshot {
  const chair = usableResult<ChairStandResult>(checkUp, CHAIR_STAND_ID);
  const balance = usableResult<BalanceResult>(checkUp, BALANCE_LADDER_ID);
  const shoulder = usableResult<ShoulderFlexionResult>(checkUp, SHOULDER_FLEXION_ID);
  const hinge = usableResult<HingeReachResult>(checkUp, HINGE_REACH_ID);
  const balanceMetric = balance ? bestBalanceMetric(balance) : null;
  return {
    chairStandReps: finite(chair?.reps) ? chair?.reps : undefined,
    balanceHoldSec: balanceMetric?.seconds,
    balanceLabel: balanceMetric?.label,
    shoulderFlexionDeg: finite(shoulder?.peakFlexionDeg) ? shoulder?.peakFlexionDeg : undefined,
    hingeReachBu: finite(hinge?.reachBu) ? hinge?.reachBu : undefined,
  };
}

function bestBalanceMetric(result: BalanceResult): { label: string; seconds: number } | null {
  const tandem = result.stages.find((stage) => stage.stance === 'tandem' && !stage.eyesClosed && finite(stage.holdSec));
  if (tandem) return { label: 'Tandem hold', seconds: tandem.holdSec };
  if (finite(result.singleLegEyesOpenSec)) return { label: 'One-leg balance', seconds: result.singleLegEyesOpenSec };
  const best = result.stages
    .filter((stage) => finite(stage.holdSec))
    .sort((a, b) => b.holdSec - a.holdSec)[0];
  return best ? { label: `${stanceLabel(best.stance)} hold`, seconds: best.holdSec } : null;
}

function usableResult<T>(checkUp: CheckUp, movementId: string): T | null {
  const item = findItem(checkUp, movementId);
  if (!item || item.status !== 'measured' || !item.result || item.result.flags.includes('no-measurement')) return null;
  return item.result as unknown as T;
}

function domainBands(score: CheckUpScore): Record<Domain, MovementSnapshotBand | 'pending'> {
  const out: Record<Domain, MovementSnapshotBand | 'pending'> = {
    strength: 'pending',
    balance: 'pending',
    mobility: 'pending',
  };
  for (const domain of score.domains) {
    if (!domain.measured || !finite(domain.ageLow) || !finite(domain.ageHigh)) continue;
    out[domain.domain] = bandFromAgeRange(domain.ageLow, domain.ageHigh);
  }
  return out;
}

function bandFromAgeRange(ageLow: number, ageHigh: number): MovementSnapshotBand {
  const mid = (ageLow + ageHigh) / 2;
  if (mid <= 58) return 'strong';
  if (mid <= 72) return 'building';
  return 'starting_point';
}

function missingCard(domain: Domain): DomainProgressCard {
  return {
    domain,
    title: DOMAIN_TITLE[domain],
    metric: 'Not measured yet',
    body: 'Your next Movement Check-Up can add this.',
    trend: 'unknown',
  };
}

function missingLatestCard(domain: Domain, metric: string): DomainProgressCard {
  return {
    domain,
    title: DOMAIN_TITLE[domain],
    metric,
    body: 'Your first result is saved. A future re-test will show what changed.',
    trend: 'unknown',
  };
}

function mobilityMetric(
  startShoulder?: number,
  currentShoulder?: number | null,
  startReach?: number,
  currentReach?: number | null
): string {
  if (finite(startShoulder)) {
    return currentShoulder === null || currentShoulder === undefined || !finite(currentShoulder)
      ? `Shoulder reach: ${Math.round(startShoulder)}°`
      : `Shoulder reach: ${Math.round(startShoulder)}° -> ${Math.round(currentShoulder)}°`;
  }
  if (finite(startReach)) {
    return currentReach === null || currentReach === undefined || !finite(currentReach)
      ? `Forward reach: ${startReach.toFixed(2)} body units`
      : `Forward reach: ${startReach.toFixed(2)} -> ${currentReach.toFixed(2)} body units`;
  }
  return 'Mobility check pending';
}

function ladderStatus(progress: LadderProgress): LadderProgressCard['status'] {
  if (progress.readyToProgress) return 'Ready for next step';
  if (progress.lastPain || progress.lastTrackingQuality === 'poor') return 'Holding steady';
  return 'Building';
}

function levelLabel(ladderId: string, levelId: string): string {
  try {
    return getExerciseLadder(ladderId).levels.find((level) => level.id === levelId)?.name ?? 'Current level';
  } catch {
    return 'Current level';
  }
}

function mainChangeFromReport(report: MovementBlockReport): string {
  const changes = Object.entries(report.domainChanges ?? {});
  const improved = changes.find(([, change]) => change?.direction === 'improved');
  const steady = changes.find(([, change]) => change?.direction === 'held_steady');
  const selected = improved ?? steady ?? changes[0];
  if (!selected) return report.summary;
  const [domain, change] = selected as [MovementDomain, NonNullable<MovementBlockReport['domainChanges']>[MovementDomain]];
  if (change?.direction === 'improved') return `${domainLabel(domain)} improved.`;
  if (change?.direction === 'held_steady') return `${domainLabel(domain)} held steady.`;
  if (change?.direction === 'declined') return `${domainLabel(domain)} will be adjusted in the next block.`;
  return report.summary;
}

function focusTitle(domain: CheckUpScore['weakestDomain']): string {
  if (domain === 'strength') return 'Main opportunity: Strength / Power';
  if (domain === 'balance') return 'Main opportunity: Balance';
  if (domain === 'mobility') return 'Main opportunity: Mobility';
  return 'Main opportunity: keep building all three domains';
}

function stanceLabel(stance: string): string {
  if (stance === 'single-leg') return 'One-leg';
  if (stance === 'feet-together') return 'Feet-together';
  if (stance === 'semi-tandem') return 'Semi-tandem';
  return 'Tandem';
}

function checkUpsFromHistory(history: readonly StoredCheckUp[] | null | undefined): CheckUp[] {
  return (history ?? []).map((item) => item.checkUp).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

function latestCheckUp(history: readonly StoredCheckUp[] | null | undefined): CheckUp | null {
  const checkUps = checkUpsFromHistory(history);
  return checkUps[checkUps.length - 1] ?? null;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
