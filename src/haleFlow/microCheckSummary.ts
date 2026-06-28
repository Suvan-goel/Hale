import type { MovementAssessment, MovementDomain } from '../adherence';
import type { CheckUp } from '../checkup';
import type { StoredCheckUp } from '../history';
import {
  BALANCE_EYES_OPEN_V2_ID,
  CHAIR_RISE_V2_ID,
  HINGE_REACH_ID,
  ONE_LEG_BALANCE_V2_ID,
} from '../movements';
import { validateCheckUpForScoring } from '../scoring/scoringInputValidation';
import type { MicroCheckResult, MicroCheckType } from '../training';
import { isOfficialCheckupType } from './assessmentEvidence';
import { resolveStoredCheckUpType } from './checkupHistory';

export type MicroCheckSummarySource = 'scheduled' | 'optional';

export type MicroCheckSummaryComparisonKind =
  | 'movement_checkup_delta'
  | 'movement_checkup_reference'
  | 'trend_note'
  | 'no_comparable_checkup'
  | 'not_measured'
  | 'not_saved';

export interface MicroCheckSummaryViewModel {
  eyebrow: string;
  title: string;
  subtitle: string;
  metricLabel: string;
  metricValue: string;
  metricUnit: string;
  metricCaption: string;
  measuredAndSaved: boolean;
  comparisonKind: MicroCheckSummaryComparisonKind;
  comparisonEyebrow: string;
  comparisonTitle: string;
  comparisonBody: string;
  comparisonDetail?: string;
  footnote: string;
}

export function buildMicroCheckSummaryViewModel({
  result,
  source,
  targetDomain,
  scheduleWeekNumber,
  saved = true,
  history = [],
  assessments = [],
}: {
  result: MicroCheckResult;
  source: MicroCheckSummarySource;
  targetDomain?: MovementDomain | null;
  scheduleWeekNumber?: number | null;
  saved?: boolean;
  history?: readonly StoredCheckUp[] | null;
  assessments?: readonly MovementAssessment[] | null;
}): MicroCheckSummaryViewModel {
  const domain = targetDomain ?? domainForMicroCheckType(result.type);
  const domainLabel = domainDisplayLabel(domain);
  const measuredAndSaved = saved && result.measured && finite(result.value);
  const metric = metricDisplay(result, measuredAndSaved);
  const comparison = comparisonDisplay({
    result,
    source,
    measuredAndSaved,
    saved,
    history,
    assessments,
  });

  return {
    eyebrow: summaryEyebrow(source, scheduleWeekNumber),
    title: summaryTitle({ source, domainLabel, measuredAndSaved }),
    subtitle: summarySubtitle({
      source,
      measuredAndSaved,
      saved,
      resultCaptured: result.measured && finite(result.value),
    }),
    metricLabel: metric.label,
    metricValue: metric.value,
    metricUnit: metric.unit,
    metricCaption: metric.caption,
    measuredAndSaved,
    comparisonKind: comparison.kind,
    comparisonEyebrow: comparison.eyebrow,
    comparisonTitle: comparison.title,
    comparisonBody: comparison.body,
    ...(comparison.detail ? { comparisonDetail: comparison.detail } : {}),
    footnote: 'Quick checks are not full retests; your next Movement Check-Up updates your official movement age.',
  };
}

function summaryEyebrow(source: MicroCheckSummarySource, scheduleWeekNumber?: number | null): string {
  if (source === 'optional') return 'Extra micro-check';
  return typeof scheduleWeekNumber === 'number' && Number.isInteger(scheduleWeekNumber)
    ? `Week ${scheduleWeekNumber} micro-check`
    : 'Micro-check';
}

function summaryTitle({
  source,
  domainLabel,
  measuredAndSaved,
}: {
  source: MicroCheckSummarySource;
  domainLabel: string;
  measuredAndSaved: boolean;
}): string {
  if (!measuredAndSaved) return 'Micro-check complete.';
  const lower = domainLabel.toLowerCase();
  return source === 'optional' ? `Extra ${lower} check saved.` : `Your ${lower} check is saved.`;
}

function summarySubtitle({
  source,
  measuredAndSaved,
  saved,
  resultCaptured,
}: {
  source: MicroCheckSummarySource;
  measuredAndSaved: boolean;
  saved: boolean;
  resultCaptured: boolean;
}): string {
  if (!saved) {
    return resultCaptured
      ? 'Hale measured it, but could not save the result. Your official movement age is unchanged.'
      : 'Hale could not save a reliable measurement this time. Your official movement age is unchanged.';
  }
  if (!measuredAndSaved) {
    return 'Hale could not capture a reliable measurement this time. Your official movement age is unchanged.';
  }
  if (source === 'optional') return 'For reference only. Your plan is unchanged.';
  return 'This updates your quick-check trend without changing your movement age.';
}

function domainForMicroCheckType(type: MicroCheckType): MovementDomain {
  if (type === 'chair-power') return 'strength_power';
  if (type === 'single-leg-balance') return 'balance';
  return 'mobility';
}

function domainDisplayLabel(domain: MovementDomain): string {
  if (domain === 'strength_power') return 'Strength';
  if (domain === 'balance') return 'Balance';
  return 'Mobility';
}

function metricDisplay(
  result: MicroCheckResult,
  measuredAndSaved: boolean
): { label: string; value: string; unit: string; caption: string } {
  const definition = metricDefinition(result.type);
  if (!measuredAndSaved) {
    return {
      label: definition.label,
      value: result.measured ? 'Not saved' : 'Not captured',
      unit: '',
      caption: result.measured ? 'Hale could not save this measurement.' : 'Try again when you are ready.',
    };
  }
  return {
    label: definition.label,
    value: formatMetricValue(result.value, result.type),
    unit: definition.unit,
    caption: metricCaption(result),
  };
}

function metricCaption(result: MicroCheckResult): string {
  if (result.type === 'chair-power') {
    const reps = Number.isFinite(result.reps) ? Math.max(0, Math.round(result.reps)) : 0;
    return reps === 1 ? '1 chair stand counted' : `${reps} chair stands counted`;
  }
  if (result.type === 'single-leg-balance') return 'Single-leg hold';
  return 'Standing forward reach';
}

function comparisonDisplay({
  result,
  source,
  measuredAndSaved,
  saved,
  history,
  assessments,
}: {
  result: MicroCheckResult;
  source: MicroCheckSummarySource;
  measuredAndSaved: boolean;
  saved: boolean;
  history?: readonly StoredCheckUp[] | null;
  assessments?: readonly MovementAssessment[] | null;
}): {
  kind: MicroCheckSummaryComparisonKind;
  eyebrow: string;
  title: string;
  body: string;
  detail?: string;
} {
  if (!saved) {
    return {
      kind: 'not_saved',
      eyebrow: 'Status',
      title: 'Result not saved',
      body: 'Your plan and official Movement Check-Up history are unchanged.',
    };
  }
  if (!measuredAndSaved) {
    return {
      kind: 'not_measured',
      eyebrow: 'Status',
      title: 'No reliable measurement',
      body: 'Hale only saves a quick-check metric when the camera reading is reliable enough.',
    };
  }
  const baseline = latestComparableOfficialBaseline({
    type: result.type,
    history,
    assessments,
  });
  if (!baseline) {
    return {
      kind: 'no_comparable_checkup',
      eyebrow: 'Comparison',
      title: 'No comparable Movement Check-Up yet',
      body: 'Hale will compare this quick check after it has an official result for the same movement.',
    };
  }

  const delta = result.value - baseline.value;
  const body = deltaSentence(delta, result.type);
  return {
    kind: 'movement_checkup_delta',
    eyebrow: 'Comparison',
    title: 'Since your last Movement Check-Up',
    body,
    detail: `Last Movement Check-Up: ${formatMetricValue(baseline.value, result.type)} ${metricDefinition(result.type).unit}`,
  };
}

function latestComparableOfficialBaseline({
  type,
  history,
  assessments,
}: {
  type: MicroCheckType;
  history?: readonly StoredCheckUp[] | null;
  assessments?: readonly MovementAssessment[] | null;
}): { value: number } | null {
  const records = (history ?? []).slice().sort((a, b) => b.checkUp.startedAt.localeCompare(a.checkUp.startedAt));
  for (const record of records) {
    const checkupType = resolveStoredCheckUpType(record, assessments);
    if (!isOfficialCheckupType(checkupType)) continue;
    const value = officialMetricValue(record.checkUp, type);
    if (finite(value)) return { value };
  }
  return null;
}

function officialMetricValue(checkUp: CheckUp, type: MicroCheckType): number | null {
  const legacy = validateCheckUpForScoring(checkUp);
  if (type === 'chair-power' && finite(legacy.chairStand?.sessionMeanVel)) {
    return legacy.chairStand?.sessionMeanVel ?? null;
  }
  if (type === 'single-leg-balance' && finite(legacy.balanceLadder?.singleLegEyesOpenSec)) {
    return legacy.balanceLadder?.singleLegEyesOpenSec ?? null;
  }
  if (type === 'mobility-reach' && finite(legacy.hingeReach?.reachBu)) {
    return legacy.hingeReach?.reachBu ?? null;
  }

  if (type === 'chair-power') {
    return finiteNumber(measuredResultFor(checkUp, CHAIR_RISE_V2_ID)?.sessionMeanVel);
  }
  if (type === 'single-leg-balance') {
    return (
      finiteNumber(measuredResultFor(checkUp, ONE_LEG_BALANCE_V2_ID)?.bestHoldSec) ??
      balanceEyesOpenSingleLegSeconds(measuredResultFor(checkUp, BALANCE_EYES_OPEN_V2_ID))
    );
  }
  return finiteNumber(measuredResultFor(checkUp, HINGE_REACH_ID)?.reachBu);
}

function balanceEyesOpenSingleLegSeconds(result: Record<string, unknown> | null): number | null {
  if (!result) return null;
  const stages = result.stages;
  if (Array.isArray(stages)) {
    for (const stage of stages) {
      if (!isRecord(stage) || stage.kind !== 'single_leg') continue;
      const maintainedMs = finiteNumber(stage.maintainedMs);
      if (maintainedMs !== null) return maintainedMs / 1000;
    }
  }
  if (result.terminalStage === 'single_leg_eyes_open_v2') {
    const maintainedMs = finiteNumber(result.terminalStageMaintainedMs);
    if (maintainedMs !== null) return maintainedMs / 1000;
  }
  return null;
}

function measuredResultFor(checkUp: CheckUp, movementId: string): Record<string, unknown> | null {
  const item = checkUp.items.find((candidate) => candidate.movementId === movementId && candidate.status === 'measured');
  if (!item || !isRecord(item.result)) return null;
  return item.result;
}

function deltaSentence(delta: number, type: MicroCheckType): string {
  const definition = metricDefinition(type);
  if (Math.abs(delta) < definition.neutralThreshold) {
    return 'About the same as your last Movement Check-Up.';
  }
  if (type === 'mobility-reach') {
    const direction = delta < 0 ? 'Closer by' : 'Farther by';
    return `${direction} ${formatDeltaValue(Math.abs(delta), type)} since your last Movement Check-Up.`;
  }
  const direction = delta > 0 ? 'Up' : 'Down';
  return `${direction} ${formatDeltaValue(Math.abs(delta), type)} since your last Movement Check-Up.`;
}

function metricDefinition(type: MicroCheckType): {
  label: string;
  unit: string;
  neutralThreshold: number;
} {
  if (type === 'chair-power') {
    return { label: 'Rise velocity', unit: 'body units/sec', neutralThreshold: 0.01 };
  }
  if (type === 'single-leg-balance') {
    return { label: 'Balance hold', unit: 'sec', neutralThreshold: 0.5 };
  }
  return { label: 'Forward reach', unit: 'body units', neutralThreshold: 0.02 };
}

function formatMetricValue(value: number, type: MicroCheckType): string {
  if (!finite(value)) return 'Not captured';
  if (type === 'chair-power') return value.toFixed(2);
  if (type === 'mobility-reach') return value.toFixed(2);
  return String(Math.round(value));
}

function formatDeltaValue(value: number, type: MicroCheckType): string {
  if (type === 'chair-power') return `${value.toFixed(2)} body units/sec`;
  if (type === 'single-leg-balance') {
    return value < 1 ? `${value.toFixed(1)} sec` : `${Math.round(value)} sec`;
  }
  return `${value.toFixed(2)} body units`;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function finiteNumber(value: unknown): number | null {
  return finite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
