/**
 * Tune/gate separation (founder methodology 2026-07-06), tested at the seam:
 * split-by-panelist integrity, PASS refusal on empty/overlapping validation,
 * validate-only gate math, and the structural invisibility of validate
 * footage to tuning. Plus one real end-to-end evaluateRecording run over a
 * committed synthetic fixture.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { CHAIR_RISE_V2_ID } from '../../movements';
import { parseRecording } from '../../recording/format';
import {
  checkSplitIntegrity,
  corpusGateReport,
  evaluateRecording,
  MEASUREMENT_GATE_THRESHOLDS,
  renderGateReport,
  tuningSubset,
  type CorpusLabel,
  type RecordingEvaluation,
} from '../corpus';

function label(overrides: Partial<CorpusLabel> = {}): CorpusLabel {
  return {
    schemaVersion: 1,
    recordingFile: 'r.jsonl',
    movementId: CHAIR_RISE_V2_ID,
    panelist: 'A',
    role: 'tune',
    groundTruth: { reps: 10 },
    ...overrides,
  };
}

function evaluation(
  labelOverrides: Partial<CorpusLabel>,
  metrics: Partial<Omit<RecordingEvaluation, 'label'>> = {}
): RecordingEvaluation {
  return {
    label: label(labelOverrides),
    repsMeasured: 10,
    repsTruth: 10,
    repAccuracy: 1,
    phantomReps: 0,
    missedReps: 0,
    startLatencyMs: 1000,
    ...metrics,
  };
}

describe('split integrity', () => {
  it('refuses PASS when the validation set is empty', () => {
    const report = corpusGateReport([evaluation({ role: 'tune', panelist: 'A' })]);
    expect(report.verdict).toBe('INVALID_SPLIT');
    expect(report.split.problems.join(' ')).toMatch(/validation set is empty/);
    expect(report.movements[0].verdict).toBe('FAIL');
  });

  it('refuses PASS when a panelist appears on both sides (split is across bodies)', () => {
    const report = corpusGateReport([
      evaluation({ role: 'tune', panelist: 'A' }),
      evaluation({ role: 'validate', panelist: 'A' }),
      evaluation({ role: 'validate', panelist: 'D' }),
      evaluation({ role: 'validate', panelist: 'E' }),
    ]);
    expect(report.verdict).toBe('INVALID_SPLIT');
    expect(report.split.problems.join(' ')).toMatch(/BOTH sides.*: A/);
  });

  it('a clean by-panelist split passes integrity', () => {
    const split = checkSplitIntegrity([
      label({ role: 'tune', panelist: 'A' }),
      label({ role: 'tune', panelist: 'B' }),
      label({ role: 'validate', panelist: 'D' }),
    ]);
    expect(split.ok).toBe(true);
    expect(split.tunePanelists).toEqual(['A', 'B']);
    expect(split.validatePanelists).toEqual(['D']);
  });
});

describe('gate math (validate footage only)', () => {
  const cleanValidate = ['D', 'E', 'F'].map((panelist) =>
    evaluation({ role: 'validate', panelist })
  );

  it('PASS requires enough validate recordings; tune metrics never gate', () => {
    // Tune footage is terrible; validate is clean → PASS (tune is context only).
    const report = corpusGateReport([
      evaluation({ role: 'tune', panelist: 'A' }, { repAccuracy: 0.2, phantomReps: 8 }),
      ...cleanValidate,
    ]);
    expect(report.verdict).toBe('PASS');
    expect(report.movements[0].tune.worstRepAccuracy).toBe(0.2);
  });

  it('below the validate floor → INSUFFICIENT, never PASS', () => {
    const report = corpusGateReport([
      evaluation({ role: 'tune', panelist: 'A' }),
      evaluation({ role: 'validate', panelist: 'D' }),
    ]);
    expect(MEASUREMENT_GATE_THRESHOLDS.minValidateRecordings).toBeGreaterThan(1);
    expect(report.verdict).toBe('INSUFFICIENT');
  });

  it('a single bad validate recording fails the movement (per-set, not aggregate)', () => {
    const report = corpusGateReport([
      ...cleanValidate,
      evaluation({ role: 'validate', panelist: 'F' }, { repsMeasured: 7, repAccuracy: 0.7 }),
    ]);
    expect(report.verdict).toBe('FAIL');
    expect(report.movements[0].reasons.join(' ')).toMatch(/worst per-recording rep accuracy/);
  });

  it('phantom rate over the validate set fails the gate', () => {
    const report = corpusGateReport([
      ...cleanValidate,
      evaluation({ role: 'validate', panelist: 'F' }, { phantomReps: 2, repAccuracy: 1 }),
    ]);
    expect(report.verdict).toBe('FAIL');
    expect(report.movements[0].reasons.join(' ')).toMatch(/phantom rate/);
  });

  it('the rendered report names both footage sets', () => {
    const text = renderGateReport(corpusGateReport([
      evaluation({ role: 'tune', panelist: 'A' }),
      ...cleanValidate,
    ]));
    expect(text).toMatch(/Tuned on panelists: A/);
    expect(text).toMatch(/Gated on panelists: D, E, F/);
    expect(text).toMatch(/tune \(context only, never evidence\)/);
  });
});

describe('tuning subset (separation by construction)', () => {
  it('validate footage is structurally invisible to tuning', () => {
    const subset = tuningSubset([
      evaluation({ role: 'tune', panelist: 'A' }),
      evaluation({ role: 'validate', panelist: 'D' }),
    ]);
    expect(subset).toHaveLength(1);
    expect(subset.every((e) => e.label.role === 'tune')).toBe(true);
  });
});

describe('evaluateRecording end-to-end (real pipeline over a committed fixture)', () => {
  it('a standing recording with truth reps=0 scores perfect accuracy and zero phantoms', () => {
    const jsonl = fs.readFileSync(
      path.resolve(__dirname, 'fixtures/side-view-standing.jsonl'),
      'utf8'
    );
    const { frames } = parseRecording(jsonl);
    const result = evaluateRecording(
      label({ movementId: CHAIR_RISE_V2_ID, groundTruth: { reps: 0, startPositionAtMs: 0 } }),
      frames
    );
    expect(result.repsMeasured).toBe(0);
    expect(result.repAccuracy).toBe(1);
    expect(result.phantomReps).toBe(0);
    // Start latency = warmup + stabilization on this fixture; finite and sane.
    expect(result.startLatencyMs === null || result.startLatencyMs < 10000).toBe(true);
  });
});
