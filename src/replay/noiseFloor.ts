/**
 * Noise-floor analysis: the product's go/no-go experiment.
 *
 * The headline metric (session-mean rise velocity) only carries a
 * longitudinal trend if between-session measurement variance is small.
 * Target: CV ≤ 10% across repeated sessions of the same person at varied
 * camera setups (2.2–3.2 m, slight angle offsets). This module computes
 * per-session velocity stats and the between-session CV; the CLI in
 * scripts/noise-floor.ts feeds it real recordings, and the synthetic dry
 * run validates the measurement chain itself (known identical true
 * velocity, only the setup varies).
 */

import { CHAIR_STAND_ID, ChairStandResult } from '../movements';
import { chairStandSession, ChairStandSessionOptions } from '../pose/testing/syntheticChairStand';
import { RawLandmarkEvent } from '../pose/types';
import { gradeRecording } from './gradeRecording';

export interface LabeledSession {
  label: string;
  frames: RawLandmarkEvent[];
}

export interface SessionAnalysis {
  label: string;
  bodyUnit: number | null;
  reps: number;
  /** Session-mean rise velocity, body units/s — THE metric. */
  sessionMeanVelBu: number;
  /** Same velocity WITHOUT body-unit normalization (image units/s) —
   * the control showing what normalization buys. */
  sessionMeanVelRaw: number;
  /** CV of per-rep mean velocities within this session, %. */
  withinSessionCvPct: number;
  flags: string[];
}

export interface NoiseFloorSummary {
  sessions: SessionAnalysis[];
  /** Sessions usable for CV (calibrated, ≥1 rep). */
  usableSessions: number;
  meanOfSessionMeansBu: number;
  /** Between-session CV of the normalized metric, % — the go/no-go number. */
  betweenSessionCvPct: number;
  /** Between-session CV of the unnormalized control, %. */
  betweenSessionCvRawPct: number;
}

/** Sample (n−1) coefficient of variation in percent. */
export function cvPct(values: number[]): number {
  if (values.length < 2) return NaN;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return NaN;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / (values.length - 1);
  return (Math.sqrt(variance) / Math.abs(mean)) * 100;
}

export function analyzeSession(input: LabeledSession): SessionAnalysis {
  const replay = gradeRecording<ChairStandResult>(CHAIR_STAND_ID, input.frames);
  const result = replay.result;
  const perRepMeans = result.repStats.map((s) => s.meanVel);
  const bodyUnit = replay.bodyUnit;
  return {
    label: input.label,
    bodyUnit,
    reps: result.reps,
    sessionMeanVelBu: result.sessionMeanVel,
    sessionMeanVelRaw:
      bodyUnit !== null && Number.isFinite(result.sessionMeanVel)
        ? result.sessionMeanVel * bodyUnit
        : NaN,
    withinSessionCvPct: cvPct(perRepMeans),
    flags: result.flags,
  };
}

export function analyzeSessions(inputs: LabeledSession[]): NoiseFloorSummary {
  const sessions = inputs.map(analyzeSession);
  const usable = sessions.filter(
    (s) => s.bodyUnit !== null && s.reps > 0 && Number.isFinite(s.sessionMeanVelBu)
  );
  const means = usable.map((s) => s.sessionMeanVelBu);
  const rawMeans = usable.map((s) => s.sessionMeanVelRaw);
  return {
    sessions,
    usableSessions: usable.length,
    meanOfSessionMeansBu:
      means.length > 0 ? means.reduce((a, b) => a + b, 0) / means.length : NaN,
    betweenSessionCvPct: cvPct(means),
    betweenSessionCvRawPct: cvPct(rawMeans),
  };
}

/**
 * Synthetic dry run: six sessions of the SAME person (identical body model,
 * identical multiset of rise durations ⇒ identical true session-mean
 * velocity) with only the camera setup varied — distance (scale), placement,
 * slight angle offset (sagittal foreshortening), facing side, jitter level,
 * and noise seed. Any CV measured here is measurement noise, not the human.
 */
export function syntheticNoiseFloorSessions(): LabeledSession[] {
  // One person's rep tempo, rotated per session so rep order differs but the
  // session-mean true velocity is bit-identical.
  const tempo = [1400, 1250, 1100, 1000, 1200, 1300, 1150, 1050, 1350, 1100];
  const rotate = (n: number) => [...tempo.slice(n), ...tempo.slice(0, n)];

  const setups: (ChairStandSessionOptions & { label: string })[] = [
    { label: 'far-3.2m', scale: 0.85, xOffset: 0.02, xCompress: 1.0, noiseAmp: 0.005, seed: 11 },
    { label: 'mid-2.8m', scale: 0.93, xOffset: -0.04, xCompress: 0.97, noiseAmp: 0.004, seed: 22 },
    { label: 'ref-2.7m', scale: 1.0, xOffset: 0, xCompress: 1.0, noiseAmp: 0.004, seed: 33 },
    {
      label: 'near-2.4m',
      scale: 1.08,
      xOffset: 0.05,
      xCompress: 0.95,
      noiseAmp: 0.004,
      seed: 44,
    },
    {
      label: 'near-2.2m',
      scale: 1.15,
      xOffset: -0.02,
      xCompress: 1.0,
      noiseAmp: 0.0045,
      seed: 55,
    },
    {
      label: 'mid-angled-left',
      scale: 0.95,
      xOffset: 0.03,
      xCompress: 0.93,
      noiseAmp: 0.005,
      seed: 66,
      nearSide: 'left',
    },
  ];

  return setups.map((setup, i) => ({
    label: setup.label,
    frames: chairStandSession({ ...setup, riseMsPerRep: rotate(i % tempo.length) }).frames,
  }));
}

export function formatSummaryTable(summary: NoiseFloorSummary): string {
  const lines: string[] = [];
  lines.push('| session | body unit | reps | mean rise vel (bu/s) | raw (img/s) | within-CV % | flags |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const s of summary.sessions) {
    lines.push(
      `| ${s.label} | ${s.bodyUnit === null ? '—' : s.bodyUnit.toFixed(4)} | ${s.reps} | ` +
        `${fmt(s.sessionMeanVelBu, 4)} | ${fmt(s.sessionMeanVelRaw, 4)} | ` +
        `${fmt(s.withinSessionCvPct, 1)} | ${s.flags.join(',') || '—'} |`
    );
  }
  lines.push('');
  lines.push(`- usable sessions: ${summary.usableSessions}/${summary.sessions.length}`);
  lines.push(`- mean of session means: ${fmt(summary.meanOfSessionMeansBu, 4)} bu/s`);
  lines.push(
    `- **between-session CV (normalized): ${fmt(summary.betweenSessionCvPct, 2)}%** ` +
      `(target ≤ 10%)`
  );
  lines.push(
    `- between-session CV without body-unit normalization: ` +
      `${fmt(summary.betweenSessionCvRawPct, 2)}%`
  );
  return lines.join('\n');
}

function fmt(v: number, digits: number): string {
  return Number.isFinite(v) ? v.toFixed(digits) : '—';
}
