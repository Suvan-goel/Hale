/**
 * GP-escalation (CLARITY_INSTRUMENTS_TDD §6.2, FL4) — THE ONLY escalation
 * path in the product (guardrail-pinned; the sole other doctor mention is the
 * pain-recurrence swap note). Calm by construction: it can only ever suggest
 * a conversation and hand over a summary — no disease words, no urgency, no
 * rule-out, no diagnosis (claims fences apply to every string here).
 *
 * Trigger of record: ONE Clarity series below her own rolling band for THREE
 * consecutive monthly check-ups, with at least FIVE lifetime readings on that
 * series. Relations are computed the same way the trend surface reads them —
 * each reading against the band of everything before it — so the card can
 * never disagree with what she has been shown. A within-band month resets the
 * run. Covariates provide CONTEXT in the summary, never a trigger: rough
 * sleep alone can never fire this.
 */

import {
  clarityReadingsFromHistory,
  dualTaskReadingsFromHistory,
  fluencyRelativeReadingsFromHistory,
  type ClaritySeriesId,
} from './clarityTrend';
import { relativeToBand, rollingBaseline, type DimensionReading } from '../dimensions';
import type { StoredCheckUp } from '../history';

export const CLARITY_ESCALATION_CONSECUTIVE_BELOW = 3;
export const CLARITY_ESCALATION_MIN_READINGS = 5;

export interface ClarityEscalation {
  triggered: boolean;
  seriesId?: ClaritySeriesId;
  seriesLabel?: string;
  /** Calm card copy (claims-fenced). */
  copy?: string;
}

const SERIES_LABELS: Record<ClaritySeriesId, string> = {
  subjective: 'check-ins',
  dual_task: 'steadiness under load',
  fluency: 'word-finding',
};

/**
 * Escalation relations use an UNCONTAMINATED baseline: a below-band month is
 * never folded into "her usual", so three months of genuine decline cannot
 * widen the band from underneath and hide themselves (the display surface
 * only ever reads the latest month, where this cannot happen; a persistent-
 * decline detector must walk the whole sequence). Within/above months rejoin
 * the usual set — recovery self-heals the baseline.
 */
function consecutiveBelowAtEnd(readings: readonly DimensionReading[]): number {
  const usual: DimensionReading[] = [];
  const relations: ('below' | 'other' | 'building')[] = [];
  for (const reading of readings) {
    const band = rollingBaseline(usual);
    if (!band) {
      relations.push('building');
      usual.push(reading);
      continue;
    }
    if (relativeToBand(reading.value, band) === 'below') {
      relations.push('below');
    } else {
      relations.push('other');
      usual.push(reading);
    }
  }
  let run = 0;
  for (let index = relations.length - 1; index >= 0 && relations[index] === 'below'; index--) {
    run++;
  }
  return run;
}

export function evaluateClarityEscalation(
  history: readonly StoredCheckUp[] | null | undefined
): ClarityEscalation {
  const bySeries: [ClaritySeriesId, DimensionReading[]][] = [
    ['subjective', clarityReadingsFromHistory(history)],
    ['dual_task', dualTaskReadingsFromHistory(history)],
    ['fluency', fluencyRelativeReadingsFromHistory(history)],
  ];
  for (const [seriesId, readings] of bySeries) {
    if (readings.length < CLARITY_ESCALATION_MIN_READINGS) continue;
    if (consecutiveBelowAtEnd(readings) >= CLARITY_ESCALATION_CONSECUTIVE_BELOW) {
      return {
        triggered: true,
        seriesId,
        seriesLabel: SERIES_LABELS[seriesId],
        copy:
          `Your ${SERIES_LABELS[seriesId]} have trended down for a few months. ` +
          "That's worth a conversation with your GP — here's a summary you can bring.",
      };
    }
  }
  return { triggered: false };
}

/**
 * The exportable trend summary — plain text she can share with a GP. Dates,
 * baseline-relative relations per series, and covariate notes. Nothing else
 * exists to include: no raw fluency words are ever stored, and no population
 * or age values appear anywhere in Clarity.
 */
export function buildClarityGpSummary(
  history: readonly StoredCheckUp[] | null | undefined,
  nowIso: string = new Date().toISOString()
): string {
  const lines: string[] = [
    'Clarity trend summary (self-tracked in a home strength app; not a medical record)',
    `Prepared ${monthLabel(nowIso)}. All comparisons are against her own typical range — no population values.`,
    '',
  ];
  const bySeries: [ClaritySeriesId, DimensionReading[]][] = [
    ['subjective', clarityReadingsFromHistory(history)],
    ['dual_task', dualTaskReadingsFromHistory(history)],
    ['fluency', fluencyRelativeReadingsFromHistory(history)],
  ];
  for (const [seriesId, readings] of bySeries) {
    if (readings.length === 0) continue;
    lines.push(`${SERIES_LABELS[seriesId]}:`);
    readings.forEach((reading, index) => {
      const band = rollingBaseline(readings.slice(0, index));
      const relation = band
        ? relativeToBand(reading.value, band) === 'below'
          ? 'below her usual range'
          : relativeToBand(reading.value, band) === 'above'
            ? 'above her usual range'
            : 'in her usual range'
        : 'baseline-building';
      lines.push(`  ${monthLabel(reading.atIso)} — ${relation}`);
    });
    lines.push('');
  }
  const covariateNotes = officialCovariateNotes(history);
  if (covariateNotes.length > 0) {
    lines.push('Context she logged alongside check-ups:');
    lines.push(...covariateNotes.map((note) => `  ${note}`));
  }
  return lines.join('\n');
}

function officialCovariateNotes(history: readonly StoredCheckUp[] | null | undefined): string[] {
  return (history ?? [])
    .filter(
      (record) =>
        record.checkupType === 'baseline' ||
        record.checkupType === 'baseline_retake' ||
        record.checkupType === 'official_retest'
    )
    .slice()
    .sort((a, b) => Date.parse(a.checkUp.startedAt) - Date.parse(b.checkUp.startedAt))
    .flatMap((record) => {
      const covariates = record.checkUp.selfReport?.covariates;
      if (!covariates) return [];
      const parts: string[] = [];
      if (covariates.sleepQuality === 1) parts.push('slept poorly the night before');
      if (covariates.symptomLoad === 3) parts.push('heavy symptom week');
      if (parts.length === 0) return [];
      return [`${monthLabel(record.checkUp.startedAt)} — ${parts.join('; ')}`];
    });
}

function monthLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(date);
}
