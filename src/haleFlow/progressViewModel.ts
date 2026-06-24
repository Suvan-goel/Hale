import {
  daysUntil,
  domainLabel,
  movementBlockDomainFocus,
  type MovementBlock,
  type MovementBlockReport,
  type MovementDomain,
  type MovementAssessment,
  type TrainingSessionCompletion,
} from '../adherence';
import { CheckUp, findItem } from '../checkup/types';
import type { StoredCheckUp, StoredCheckUpType } from '../history';
import { getExerciseLadder, ladderPresentationForLadder } from '../exercises';
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
import { selectFocusFromScore, type CheckUpScore, type Domain } from '../scoring';
import type { LadderProgress } from '../training';
import type { MovementSnapshotBand } from './appLifecycle';
import {
  historicalOfficialCheckUpRecords,
  latestHistoricalOfficialCheckUpRecord,
  latestOfficialComparisonPair,
} from './checkupHistory';
import {
  blockScheduleDateKey,
  getBlockScheduleState,
} from './blockSchedule';

export type ProgressTrend = 'higher' | 'similar' | 'lower' | 'unknown';

export interface LatestCheckUpSummary {
  dateLabel: string;
  focusTitle: string;
  bands: Record<Domain, MovementSnapshotBand | 'pending'>;
}

export interface DomainEvidenceMetric {
  label: string;
  display: string;
  measured: boolean;
}

export interface DomainEvidenceCard {
  domain: Domain;
  title: string;
  ageLabel: string;
  band: MovementSnapshotBand | 'pending';
  interpretation: string;
  metrics: DomainEvidenceMetric[];
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
  status: 'Building' | 'Ready for next step' | 'Same level for now' | 'Recently included' | 'Available in plan';
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
  kindLabel: string;
  summaryLine: string;
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

const DOMAIN_ORDER: readonly Domain[] = ['strength', 'balance', 'mobility'];

const LADDER_ROWS: readonly { id: string; title: string }[] = [
  { id: 'sit-to-stand', title: 'Sit-to-Stand' },
  { id: 'squat', title: 'Squat' },
  { id: 'balance', title: 'Balance' },
  { id: 'push', title: 'Push' },
  { id: 'pull-upper-back', title: 'Pull / Upper Back' },
  { id: 'mobility-flexibility', title: 'Mobility' },
];

export function getLatestCheckUpSummary(
  history: readonly StoredCheckUp[] | null | undefined,
  assessments?: readonly MovementAssessment[] | null
): LatestCheckUpSummary | null {
  const latest = latestHistoricalOfficialCheckUpRecord(history, assessments);
  if (!latest) return null;
  return {
    dateLabel: formatDate(latest.record.checkUp.startedAt),
    focusTitle: focusTitle(latest.score),
    bands: domainBands(latest.score),
  };
}

export function getLatestDomainEvidence(
  history: readonly StoredCheckUp[] | null | undefined,
  assessments?: readonly MovementAssessment[] | null
): DomainEvidenceCard[] {
  const latest = latestHistoricalOfficialCheckUpRecord(history, assessments);
  if (!latest) return [];
  const bands = domainBands(latest.score);
  return DOMAIN_ORDER.map((domain) => {
    const result = latest.score.domains.find((item) => item.domain === domain);
    return {
      domain,
      title: DOMAIN_TITLE[domain],
      ageLabel: ageRangeLabel(result),
      band: bands[domain],
      interpretation: result?.interpretation ?? 'Not measured this time. Your next Movement Check-Up can add this.',
      metrics: evidenceMetrics(result),
    };
  });
}

export function getDomainProgressCards(
  history: readonly StoredCheckUp[] | null | undefined,
  assessments?: readonly MovementAssessment[] | null
): DomainProgressCard[] {
  const pair = latestOfficialComparisonPair(history, assessments);
  const records = historicalOfficialCheckUpRecords(history, assessments);
  const baseline = pair.compatible ? pair.previous.record.checkUp : (pair.latest?.record.checkUp ?? records[records.length - 1]?.record.checkUp);
  const latest = pair.compatible ? pair.latest.record.checkUp : null;
  if (!baseline) return [];
  return [
    strengthCard(metricSnapshot(baseline), latest ? metricSnapshot(latest) : null),
    balanceCard(metricSnapshot(baseline), latest ? metricSnapshot(latest) : null),
    mobilityCard(metricSnapshot(baseline), latest ? metricSnapshot(latest) : null),
  ];
}

export function getLadderProgressCards(
  ladderProgressById: Record<string, LadderProgress> | null | undefined
): LadderProgressCard[] {
  const progress = ladderProgressById ?? {};
  return LADDER_ROWS.map((row) => {
    const item = progress[row.id];
    if (!item) return null;
    const ladder = safeLadder(row.id);
    const presentation = ladder ? ladderPresentationForLadder(ladder) : null;
    return {
      ladderId: row.id,
      title: row.title,
      levelName: presentation?.showCurrentLevel === false
        ? presentation.listTitle
        : levelLabel(row.id, item.currentLevelId),
      status: presentation?.showCurrentLevel === false
        ? nonLinearStatus(item)
        : ladderStatus(item),
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
      const schedule = getBlockScheduleState({
        block,
        completions: allCompletions,
        today: latestScheduleDate(block, allCompletions),
      });
      return {
        blockId: block.id,
        dateRange: `${formatDate(block.startDate)} - ${formatDate(block.endDate)}`,
        focus: movementBlockDomainFocus(block) ? domainLabel(movementBlockDomainFocus(block)!) : 'Balanced',
        sessions: `${schedule.totalCredits} of ${block.totalPlannedSessions} sessions`,
        mainChange: report ? mainChangeFromReport(report) : 'Check-up history will add the main change for this plan.',
      };
    });
}

export function getRetestHistory(
  history: readonly StoredCheckUp[] | null | undefined,
  assessments?: readonly MovementAssessment[] | null
): RetestHistoryEntry[] {
  const records = historicalOfficialCheckUpRecords(history, assessments)
    .slice()
    .sort((a, b) => b.record.checkUp.startedAt.localeCompare(a.record.checkUp.startedAt));
  const dateCounts = records.reduce((counts, entry) => {
    const key = dateKey(entry.record.checkUp.startedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return records.map((entry) => {
    const kindLabel = historyKindLabel(entry.type);
    return {
      id: entry.record.checkUp.startedAt,
      dateLabel: formatHistoryDate(
        entry.record.checkUp.startedAt,
        (dateCounts.get(dateKey(entry.record.checkUp.startedAt)) ?? 0) > 1
      ),
      kindLabel,
      summaryLine: `${kindLabel} · ${historyFocusLine(entry.score)}`,
      bands: domainBands(entry.score),
    };
  });
}

export function getRetestDueSummary({
  activeBlock,
  today,
  hasBaseline,
  completions,
}: {
  activeBlock?: MovementBlock | null;
  today: string;
  hasBaseline: boolean;
  completions?: readonly TrainingSessionCompletion[] | null;
}): RetestDueSummary {
  if (!hasBaseline) {
    return {
      title: 'Start with your first check-up',
      body: 'Do one Movement Check-Up so Hale can save your starting numbers.',
      ctaLabel: 'Start Movement Check-Up',
      due: false,
    };
  }
  if (!activeBlock) {
    return {
      title: 'Next check-up',
      body: 'Start a 4-week plan to set the date for your next Movement Check-Up.',
      due: false,
    };
  }
  const schedule = getBlockScheduleState({
    block: activeBlock,
    completions: completions ?? [],
    today,
  });
  const targetDateKey = schedule.retestNotBeforeDateKey ?? blockScheduleDateKey(activeBlock.retestDate);
  const todayKey = blockScheduleDateKey(today);
  const days = targetDateKey && todayKey ? Math.max(0, daysBetweenDateKeys(todayKey, targetDateKey)) : daysUntil(activeBlock.retestDate, today);
  if (schedule.status === 'retest_due') {
    return {
      title: 'Time for your next check-up',
      body: 'Repeat the same Movement Check-Up now so Hale can compare it with your last one.',
      ctaLabel: 'Start check-up',
      due: true,
    };
  }
  if (days === 0) {
    return {
      title: 'Next check-up',
      body: 'Finish the planned sessions in this 4-week plan, then Hale will open your next check-up.',
      due: false,
    };
  }
  return {
    title: 'Next check-up',
    body: `Your next Movement Check-Up opens in ${days} ${days === 1 ? 'day' : 'days'}.`,
    due: false,
  };
}

function latestScheduleDate(block: MovementBlock, completions: readonly TrainingSessionCompletion[]): string {
  const candidates = completions
    .filter((completion) => completion.blockId === block.id)
    .map((completion) => completion.completedAt)
    .concat(block.updatedAt, block.startDate)
    .sort();
  return candidates[candidates.length - 1] ?? block.updatedAt;
}

function daysBetweenDateKeys(startDateKey: string, endDateKey: string): number {
  const [startYear, startMonth, startDay] = startDateKey.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDateKey.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.floor((end - start) / 86400000);
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
      body: 'This is your first check-up result. Repeat the check-up later to see what changes.',
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
        ? `You completed ${delta} more chair ${delta === 1 ? 'stand' : 'stands'} than your first check-up. Hale will look for the same pattern over future check-ups.`
        : delta === 0
          ? 'This was very close to your first check-up. Hale will keep watching for a clear pattern.'
          : `You completed ${Math.abs(delta)} fewer chair ${Math.abs(delta) === 1 ? 'stand' : 'stands'} than your first check-up. Hale will use future check-ups to see whether this is a pattern.`,
    trend: delta > 0 ? 'higher' : delta === 0 ? 'similar' : 'lower',
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
      body: 'This is your first check-up result. Repeat the check-up later to see what changes.',
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
        ? `You held this position for ${Math.round(delta)} more ${Math.round(delta) === 1 ? 'second' : 'seconds'} than your first check-up. Hale will look for the same pattern over future check-ups.`
        : Math.abs(delta) < 0.5
          ? 'This balance hold was very close to your first check-up. Hale will keep watching for a clear pattern.'
          : `You held this position for ${Math.round(Math.abs(delta))} fewer ${Math.round(Math.abs(delta)) === 1 ? 'second' : 'seconds'} than your first check-up. Hale will use future check-ups to see whether this is a pattern.`,
    trend: delta > 0 ? 'higher' : Math.abs(delta) < 0.5 ? 'similar' : 'lower',
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
      body: 'This is your first check-up result. Repeat the check-up later to see what changes.',
      trend: 'unknown',
    };
  }
  const shoulderDelta = finite(startShoulder) && finite(currentShoulder) ? currentShoulder - startShoulder : null;
  // Hinge reach is wrist-to-floor distance in body units; lower means closer to the floor.
  const reachDelta = finite(startReach) && finite(currentReach) ? startReach - currentReach : null;
  const higher = (shoulderDelta ?? 0) > 0 || (reachDelta ?? 0) > 0.01;
  const lower = (shoulderDelta ?? 0) < 0 || (reachDelta ?? 0) < -0.01;
  return {
    domain: 'mobility',
    title: DOMAIN_TITLE.mobility,
    metric: mobilityMetric(startShoulder, currentShoulder, startReach, currentReach),
    body: higher
      ? 'Your mobility number was higher than your first check-up. Hale will look for the same pattern over future check-ups.'
      : lower
        ? 'Your mobility number was lower than your first check-up. Hale will use future check-ups to see whether this is a pattern.'
        : 'This mobility result was very close to your first check-up. Hale will keep watching for a clear pattern.',
    trend: higher ? 'higher' : lower ? 'lower' : 'similar',
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

function ageRangeLabel(result?: CheckUpScore['domains'][number]): string {
  if (!result?.measured || !finite(result.ageLow) || !finite(result.ageHigh)) return 'Home estimate pending';
  if (result.domain === 'balance') return 'Home estimate: one-leg balance hold';
  if (result.domain === 'mobility') return 'Home estimate: shoulder mobility';
  const low = Math.round(result.ageLow);
  const high = Math.round(result.ageHigh);
  return `Beta home estimate: age ${low}-${high}`;
}

function evidenceMetrics(result?: CheckUpScore['domains'][number]): DomainEvidenceMetric[] {
  if (!result) {
    return [{ label: 'Latest check-up', display: 'Not captured', measured: false }];
  }
  return result.rows.map((row) => ({
    label: row.label,
    display: row.measured ? row.display : 'Not captured',
    measured: row.measured,
  }));
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
    body: 'This was not captured in your last check-up. The next Movement Check-Up can add it.',
    trend: 'unknown',
  };
}

function missingLatestCard(domain: Domain, metric: string): DomainProgressCard {
  return {
    domain,
    title: DOMAIN_TITLE[domain],
    metric,
    body: 'Your first result is saved. Repeat the check-up to compare it.',
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
  if (progress.lastPain || progress.lastTrackingQuality === 'poor') return 'Same level for now';
  return 'Building';
}

function nonLinearStatus(progress: LadderProgress): LadderProgressCard['status'] {
  return progress.lastCompletedAt ? 'Recently included' : 'Available in plan';
}

function levelLabel(ladderId: string, levelId: string): string {
  try {
    return getExerciseLadder(ladderId).levels.find((level) => level.id === levelId)?.name ?? 'Current level';
  } catch {
    return 'Current level';
  }
}

function safeLadder(ladderId: string) {
  try {
    return getExerciseLadder(ladderId);
  } catch {
    return null;
  }
}

function mainChangeFromReport(report: MovementBlockReport): string {
  const changes = Object.entries(report.domainChanges ?? {});
  const changed = changes.find(([, change]) => reportDirectionIsChanged(change?.direction));
  const similar = changes.find(([, change]) => reportDirectionIsSimilar(change?.direction));
  const selected = changed ?? similar ?? changes[0];
  if (!selected) return report.summary;
  const [domain, change] = selected as [MovementDomain, NonNullable<MovementBlockReport['domainChanges']>[MovementDomain]];
  if (reportDirectionIsChanged(change?.direction)) return `${domainLabel(domain)} changed in the latest check-up.`;
  if (reportDirectionIsSimilar(change?.direction)) return `${domainLabel(domain)} was similar in the latest check-up.`;
  return report.summary;
}

function reportDirectionIsChanged(direction: unknown): boolean {
  return (
    direction === 'recorded_lower' ||
    direction === 'recorded_higher' ||
    direction === 'improved' ||
    direction === 'declined'
  );
}

function reportDirectionIsSimilar(direction: unknown): boolean {
  return direction === 'similar' || direction === 'held_steady';
}

function focusTitle(score: CheckUpScore): string {
  const selection = selectFocusFromScore(score, { activeFocusDomain: score.weakestDomain });
  const domain = selection?.focusDomain ?? score.weakestDomain;
  if (selection?.kind === 'exact_tie' || selection?.kind === 'near_tie') {
    const tied = selection.tiedDomains.map((item) => DOMAIN_TITLE[item]).join(' + ');
    return `Closely matched: ${tied}`;
  }
  if (domain === 'strength') return 'Suggested focus: Strength / Power';
  if (domain === 'balance') return 'Suggested focus: Balance';
  if (domain === 'mobility') return 'Suggested focus: Mobility';
  return 'Suggested focus: keep building all three domains';
}

function historyKindLabel(type: StoredCheckUpType): string {
  if (type === 'official_retest') return '4-week check-up';
  if (type === 'baseline_retake') return 'First check-up retake';
  return 'First check-up';
}

function historyFocusLine(score: CheckUpScore): string {
  const selection = selectFocusFromScore(score, { activeFocusDomain: score.weakestDomain });
  const domains =
    selection?.kind === 'exact_tie' || selection?.kind === 'near_tie'
      ? selection.tiedDomains
      : [selection?.focusDomain ?? score.weakestDomain].filter((domain): domain is Domain => !!domain);
  if (domains.length === 0) return 'Full results saved';
  return `Plan focus: ${humanJoin(domains.map((domain) => DOMAIN_TITLE[domain]))}`;
}

function humanJoin(items: readonly string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function stanceLabel(stance: string): string {
  if (stance === 'single-leg') return 'One-leg';
  if (stance === 'feet-together') return 'Feet-together';
  if (stance === 'semi-tandem') return 'Semi-tandem';
  return 'Tandem';
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatHistoryDate(iso: string, includeTime: boolean): string {
  if (!includeTime) return formatDate(iso);
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'recently';
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${formatDate(iso)} · ${time}`;
}

function dateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
