/**
 * Measurement-movement corpus: labels, per-recording evaluation, and the
 * gate report — with TUNE/GATE SEPARATION enforced by construction (founder
 * methodology, 2026-07-06):
 *
 * - every recording carries a tune|validate role, split BY PANELIST (bodies,
 *   not clips — generalizing across bodies is the claim under test);
 * - the sweep entry point accepts only tune-tagged entries (validate footage
 *   is structurally invisible to tuning);
 * - the gate verdict comes from validate footage ONLY, names both sets, and
 *   REFUSES to emit PASS when the validation set is empty or any panelist
 *   appears on both sides;
 * - discipline mirrors the KWS spike: sweep → freeze thresholds in code with
 *   evidence comments → gate. A re-sweep after seeing gate results is a
 *   recorded decision in docs/decisions.md, never a quiet iteration.
 *
 * Pure logic — no I/O. The CLI (scripts/corpus.ts) reads files and feeds
 * this module, so every rule here is unit-testable headlessly.
 */

import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  BALANCE_EYES_OPEN_V2_ID,
  CHAIR_RISE_V2_ID,
  HINGE_REACH_ID,
  ONE_LEG_BALANCE_V2_ID,
} from '../movements';
import type { RawLandmarkEvent } from '../pose/types';
import { gradeRecording } from './gradeRecording';

/** The five measurement movements the gate covers (TDD §7, rescoped). */
export const MEASUREMENT_GATE_MOVEMENT_IDS = [
  CHAIR_RISE_V2_ID,
  ONE_LEG_BALANCE_V2_ID,
  BALANCE_EYES_OPEN_V2_ID,
  ACTIVE_SHOULDER_REACH_V2_ID,
  HINGE_REACH_ID,
] as const;

export type CorpusRole = 'tune' | 'validate';

export interface CorpusLabel {
  schemaVersion: 1;
  /** Sibling landmark recording (JSONL) this label describes. */
  recordingFile: string;
  movementId: string;
  /** Body identity — the unit the tune/validate split is made on. */
  panelist: string;
  role: CorpusRole;
  conditions?: {
    lighting?: string;
    clothing?: string;
    distanceM?: number;
    device?: string;
    tempo?: string;
    notes?: string;
  };
  groundTruth: {
    /** Human-counted reps (rep movements). */
    reps?: number;
    /** Optional per-rep completion times for phantom attribution. */
    repBoundariesMs?: number[];
    /** When the subject reached the start position (start-latency gate). */
    startPositionAtMs?: number;
  };
  /** External reference video filename (second device; never app-captured). */
  video?: string;
}

/** Frozen gate thresholds (original spec, kept at rescope 2026-07-05). */
export const MEASUREMENT_GATE_THRESHOLDS = {
  /** Per-recording rep-count accuracy floor (per-set, not aggregate). */
  repAccuracyMin: 0.95,
  /** Phantom (uncredited-by-truth) reps as a share of true reps. */
  phantomRateMax: 0.02,
  /** Median start-position latency ceiling, where labeled. */
  startLatencyMedianMaxMs: 2000,
  /** A rep credit within this window of a truth boundary matches it. */
  repMatchToleranceMs: 750,
  /** Fewer validate recordings than this per movement → INSUFFICIENT. */
  minValidateRecordings: 3,
} as const;

export interface RecordingEvaluation {
  label: CorpusLabel;
  repsMeasured: number;
  repsTruth: number | null;
  /** 1 − |measured − truth| / truth (1 when truth 0 and measured 0). */
  repAccuracy: number | null;
  phantomReps: number;
  missedReps: number;
  startLatencyMs: number | null;
}

/** Replay one labeled recording through the real pipeline + grader. */
export function evaluateRecording(
  label: CorpusLabel,
  frames: RawLandmarkEvent[]
): RecordingEvaluation {
  const replay = gradeRecording(label.movementId, frames);
  const credits = replay.repCreditTimestampsMs;
  const truth = label.groundTruth.reps ?? null;
  const boundaries = label.groundTruth.repBoundariesMs;

  let phantomReps = 0;
  let missedReps = 0;
  if (boundaries && boundaries.length > 0) {
    const unmatched = new Set(boundaries.map((_, index) => index));
    for (const credit of credits) {
      let matched = false;
      for (const index of unmatched) {
        if (Math.abs(credit - boundaries[index]) <= MEASUREMENT_GATE_THRESHOLDS.repMatchToleranceMs) {
          unmatched.delete(index);
          matched = true;
          break;
        }
      }
      if (!matched) phantomReps++;
    }
    missedReps = unmatched.size;
  } else if (truth !== null) {
    phantomReps = Math.max(0, credits.length - truth);
    missedReps = Math.max(0, truth - credits.length);
  }

  const repAccuracy =
    truth === null
      ? null
      : truth === 0
        ? credits.length === 0
          ? 1
          : 0
        : Math.max(0, 1 - Math.abs(credits.length - truth) / truth);

  const startAt = label.groundTruth.startPositionAtMs;
  const startLatencyMs =
    startAt !== undefined && Number.isFinite(replay.firstMeasuringTimestampMs)
      ? Math.max(0, replay.firstMeasuringTimestampMs - startAt)
      : null;

  return {
    label,
    repsMeasured: credits.length,
    repsTruth: truth,
    repAccuracy,
    phantomReps,
    missedReps,
    startLatencyMs,
  };
}

export interface SplitIntegrity {
  ok: boolean;
  problems: string[];
  tunePanelists: string[];
  validatePanelists: string[];
  tuneCount: number;
  validateCount: number;
}

/** The split rules the gate refuses without. */
export function checkSplitIntegrity(labels: readonly CorpusLabel[]): SplitIntegrity {
  const tunePanelists = new Set<string>();
  const validatePanelists = new Set<string>();
  let tuneCount = 0;
  let validateCount = 0;
  for (const label of labels) {
    if (label.role === 'tune') {
      tunePanelists.add(label.panelist);
      tuneCount++;
    } else {
      validatePanelists.add(label.panelist);
      validateCount++;
    }
  }
  const problems: string[] = [];
  if (validateCount === 0) problems.push('validation set is empty — nothing can PASS');
  const overlap = [...tunePanelists].filter((p) => validatePanelists.has(p)).sort();
  if (overlap.length > 0) {
    problems.push(
      `panelists on BOTH sides of the split (the split must be across bodies): ${overlap.join(', ')}`
    );
  }
  return {
    ok: problems.length === 0,
    problems,
    tunePanelists: [...tunePanelists].sort(),
    validatePanelists: [...validatePanelists].sort(),
    tuneCount,
    validateCount,
  };
}

/**
 * The ONLY entry point tuning tools may use: returns tune-tagged evaluations
 * and nothing else. Validate footage is structurally invisible to sweeps.
 */
export function tuningSubset(evaluations: readonly RecordingEvaluation[]): RecordingEvaluation[] {
  return evaluations.filter((evaluation) => evaluation.label.role === 'tune');
}

export type MovementGateVerdict = 'PASS' | 'FAIL' | 'INSUFFICIENT';

export interface MovementGateReport {
  movementId: string;
  verdict: MovementGateVerdict;
  reasons: string[];
  validate: MovementStats;
  /** Tuning footage — context only, never evidence. */
  tune: MovementStats;
}

export interface MovementStats {
  recordings: number;
  worstRepAccuracy: number | null;
  phantomRate: number | null;
  medianStartLatencyMs: number | null;
}

export interface CorpusGateReport {
  split: SplitIntegrity;
  movements: MovementGateReport[];
  /** Overall PASS only when the split is sound and every gated movement passes. */
  verdict: MovementGateVerdict | 'INVALID_SPLIT';
}

function stats(evaluations: readonly RecordingEvaluation[]): MovementStats {
  const accuracies = evaluations
    .map((e) => e.repAccuracy)
    .filter((a): a is number => a !== null);
  const truthTotal = evaluations.reduce((sum, e) => sum + (e.repsTruth ?? 0), 0);
  const phantomTotal = evaluations.reduce((sum, e) => sum + e.phantomReps, 0);
  const latencies = evaluations
    .map((e) => e.startLatencyMs)
    .filter((l): l is number => l !== null)
    .sort((a, b) => a - b);
  return {
    recordings: evaluations.length,
    worstRepAccuracy: accuracies.length > 0 ? Math.min(...accuracies) : null,
    phantomRate: truthTotal > 0 ? phantomTotal / truthTotal : phantomTotal > 0 ? 1 : null,
    medianStartLatencyMs:
      latencies.length > 0 ? latencies[Math.floor((latencies.length - 1) / 2)] : null,
  };
}

export function corpusGateReport(evaluations: readonly RecordingEvaluation[]): CorpusGateReport {
  const split = checkSplitIntegrity(evaluations.map((e) => e.label));
  const movementIds = [...new Set(evaluations.map((e) => e.label.movementId))].sort();
  const T = MEASUREMENT_GATE_THRESHOLDS;

  const movements: MovementGateReport[] = movementIds.map((movementId) => {
    const ofMovement = evaluations.filter((e) => e.label.movementId === movementId);
    const validate = stats(ofMovement.filter((e) => e.label.role === 'validate'));
    const tune = stats(tuningSubset(ofMovement));
    const reasons: string[] = [];
    let verdict: MovementGateVerdict = 'PASS';

    if (!split.ok) {
      verdict = 'FAIL';
      reasons.push('split integrity failed — PASS is refused (see split problems)');
    } else if (validate.recordings < T.minValidateRecordings) {
      verdict = 'INSUFFICIENT';
      reasons.push(
        `only ${validate.recordings} validate recording(s); ${T.minValidateRecordings}+ required for a verdict`
      );
    } else {
      if (validate.worstRepAccuracy !== null && validate.worstRepAccuracy < T.repAccuracyMin) {
        verdict = 'FAIL';
        reasons.push(
          `worst per-recording rep accuracy ${(validate.worstRepAccuracy * 100).toFixed(1)}% < ${T.repAccuracyMin * 100}%`
        );
      }
      if (validate.phantomRate !== null && validate.phantomRate > T.phantomRateMax) {
        verdict = 'FAIL';
        reasons.push(
          `phantom rate ${(validate.phantomRate * 100).toFixed(1)}% > ${T.phantomRateMax * 100}%`
        );
      }
      if (
        validate.medianStartLatencyMs !== null &&
        validate.medianStartLatencyMs > T.startLatencyMedianMaxMs
      ) {
        verdict = 'FAIL';
        reasons.push(
          `median start latency ${validate.medianStartLatencyMs}ms > ${T.startLatencyMedianMaxMs}ms`
        );
      }
    }
    return { movementId, verdict, reasons, validate, tune };
  });

  const verdict: CorpusGateReport['verdict'] = !split.ok
    ? 'INVALID_SPLIT'
    : movements.some((m) => m.verdict === 'FAIL')
      ? 'FAIL'
      : movements.some((m) => m.verdict === 'INSUFFICIENT')
        ? 'INSUFFICIENT'
        : movements.length > 0
          ? 'PASS'
          : 'INSUFFICIENT';

  return { split, movements, verdict };
}

/** Human-readable gate report (markdown) — states which footage tuned/gated. */
export function renderGateReport(report: CorpusGateReport): string {
  const lines: string[] = [];
  lines.push('# Measurement-movement gate report');
  lines.push('');
  lines.push(
    `Tuned on panelists: ${report.split.tunePanelists.join(', ') || '(none)'} (${report.split.tuneCount} recordings)`
  );
  lines.push(
    `Gated on panelists: ${report.split.validatePanelists.join(', ') || '(none)'} (${report.split.validateCount} recordings)`
  );
  for (const problem of report.split.problems) lines.push(`SPLIT PROBLEM: ${problem}`);
  lines.push('');
  for (const movement of report.movements) {
    lines.push(`## ${movement.movementId}: ${movement.verdict}`);
    for (const reason of movement.reasons) lines.push(`- ${reason}`);
    const v = movement.validate;
    lines.push(
      `- validate: n=${v.recordings}, worst accuracy=${fmtPct(v.worstRepAccuracy)}, phantom=${fmtPct(v.phantomRate)}, median start latency=${v.medianStartLatencyMs ?? '—'}ms`
    );
    const t = movement.tune;
    lines.push(
      `- tune (context only, never evidence): n=${t.recordings}, worst accuracy=${fmtPct(t.worstRepAccuracy)}`
    );
    lines.push('');
  }
  lines.push(`# Overall: ${report.verdict}`);
  return lines.join('\n');
}

function fmtPct(value: number | null): string {
  return value === null ? '—' : `${(value * 100).toFixed(1)}%`;
}
