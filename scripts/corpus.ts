/**
 * Measurement-corpus CLI (TDD §7; tune/gate separation per 2026-07-06):
 *
 *   npm run corpus -- report <corpusDir> [--out report.md]
 *   npm run corpus -- sweep <corpusDir> <param> <min> <max> <step>
 *
 * A corpus directory holds pairs: <name>.label.json (CorpusLabel) +
 * the recording it names (recordingFile, JSONL landmark capture).
 *
 * SEPARATION IS STRUCTURAL: `sweep` evaluates the tuningSubset() ONLY —
 * validate-tagged footage cannot influence a sweep. `report` gates on
 * validate footage only and refuses PASS on an empty/overlapping split.
 * Discipline: sweep → freeze thresholds in code with evidence comments →
 * gate. Re-sweeping after seeing gate results is a recorded decision in
 * docs/decisions.md, never a quiet iteration.
 *
 * Sweep scope v1: pose-pipeline parameters (the shared front end). Movement
 * grader thresholds are module-private constants by design; injecting sweep
 * config into the five measurement graders is scoped for when the first real
 * corpus lands (tracked in docs/specs/MEASUREMENT_CORPUS_PROTOCOL.md).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseRecording } from '../src/recording/format';
import {
  corpusGateReport,
  evaluateRecording,
  renderGateReport,
  tuningSubset,
  type CorpusLabel,
  type RecordingEvaluation,
} from '../src/replay/corpus';
import { DEFAULT_PIPELINE_CONFIG, type PipelineConfig } from '../src/pose/pipeline';
import { gradeRecording } from '../src/replay/gradeRecording';

interface LoadedEntry {
  label: CorpusLabel;
  frames: ReturnType<typeof parseRecording>['frames'];
}

function loadCorpus(dir: string): LoadedEntry[] {
  const entries: LoadedEntry[] = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.endsWith('.label.json')) continue;
    const label = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')) as CorpusLabel;
    if (label.schemaVersion !== 1) throw new Error(`${name}: unsupported label schemaVersion`);
    if (label.role !== 'tune' && label.role !== 'validate') {
      throw new Error(`${name}: every recording must be tagged tune|validate`);
    }
    const recording = fs.readFileSync(path.join(dir, label.recordingFile), 'utf8');
    entries.push({ label, frames: parseRecording(recording).frames });
  }
  if (entries.length === 0) throw new Error(`no *.label.json files in ${dir}`);
  return entries;
}

function runReport(dir: string, outPath: string | null): number {
  const entries = loadCorpus(dir);
  const evaluations = entries.map((entry) => evaluateRecording(entry.label, entry.frames));
  const report = corpusGateReport(evaluations);
  const text = renderGateReport(report);
  console.log(text);
  if (outPath) {
    fs.writeFileSync(path.resolve(outPath), text + '\n');
    fs.writeFileSync(
      path.resolve(outPath).replace(/\.md$/, '.json'),
      JSON.stringify(report, null, 2) + '\n'
    );
  }
  return report.verdict === 'PASS' ? 0 : 1;
}

const SWEEPABLE: Record<string, (config: PipelineConfig, value: number) => PipelineConfig> = {
  reliabilityThreshold: (c, v) => ({ ...c, reliabilityThreshold: v }),
  warmupMs: (c, v) => ({ ...c, warmupMs: v }),
  subjectGoneFrames: (c, v) => ({ ...c, subjectGoneFrames: Math.round(v) }),
};

function runSweep(dir: string, param: string, min: number, max: number, step: number): number {
  const apply = SWEEPABLE[param];
  if (!apply) {
    console.error(`unsupported sweep param ${param}; supported: ${Object.keys(SWEEPABLE).join(', ')}`);
    return 2;
  }
  const entries = loadCorpus(dir);
  // STRUCTURAL SEPARATION: sweeps see tune-tagged footage only.
  const tuneEntries = entries.filter((entry) => entry.label.role === 'tune');
  console.log(
    `sweeping ${param} over ${tuneEntries.length} TUNE recordings ` +
      `(${entries.length - tuneEntries.length} validate recordings excluded by construction)`
  );
  for (let value = min; value <= max + 1e-9; value += step) {
    const config = apply(DEFAULT_PIPELINE_CONFIG, value);
    const evaluations: RecordingEvaluation[] = tuneEntries.map((entry) => {
      const replay = gradeRecording(entry.label.movementId, entry.frames, config);
      const truth = entry.label.groundTruth.reps ?? null;
      const measured = replay.repCreditTimestampsMs.length;
      return {
        label: entry.label,
        repsMeasured: measured,
        repsTruth: truth,
        repAccuracy:
          truth === null ? null : truth === 0 ? (measured === 0 ? 1 : 0) : Math.max(0, 1 - Math.abs(measured - truth) / truth),
        phantomReps: truth === null ? 0 : Math.max(0, measured - truth),
        missedReps: truth === null ? 0 : Math.max(0, truth - measured),
        startLatencyMs: null,
      };
    });
    const subset = tuningSubset(evaluations);
    const accuracies = subset.map((e) => e.repAccuracy).filter((a): a is number => a !== null);
    const worst = accuracies.length ? Math.min(...accuracies) : NaN;
    const phantoms = subset.reduce((sum, e) => sum + e.phantomReps, 0);
    console.log(
      `${param}=${value.toFixed(4)} worstAccuracy=${Number.isNaN(worst) ? '—' : (worst * 100).toFixed(1) + '%'} phantoms=${phantoms}`
    );
  }
  console.log('\nFreeze the chosen value in code with an evidence comment, then run `report`.');
  return 0;
}

function main(argv: string[]): number {
  const [mode, dir, ...rest] = argv.slice(2);
  if (mode === 'report' && dir) {
    const outFlag = rest.indexOf('--out');
    return runReport(dir, outFlag >= 0 ? rest[outFlag + 1] : null);
  }
  if (mode === 'sweep' && dir && rest.length >= 4) {
    return runSweep(dir, rest[0], Number(rest[1]), Number(rest[2]), Number(rest[3]));
  }
  console.error('usage: corpus report <dir> [--out report.md] | corpus sweep <dir> <param> <min> <max> <step>');
  return 2;
}

process.exit(main(process.argv));
