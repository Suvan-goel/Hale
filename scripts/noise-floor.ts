/**
 * Noise-floor analysis CLI (see docs/noise-floor-report.md for the protocol).
 *
 *   npm run noise-floor -- <dir-or-files…>   analyze real JSONL recordings
 *   npm run noise-floor -- --synthetic       run the synthetic setup-variance
 *                                            dry run (measurement chain only)
 *
 * Prints a markdown table ready to paste into the report.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseRecording } from '../src/recording/format';
import {
  analyzeSessions,
  formatSummaryTable,
  LabeledSession,
  syntheticNoiseFloorSessions,
} from '../src/replay/noiseFloor';

function collectRecordingPaths(args: string[]): string[] {
  const files: string[] = [];
  for (const arg of args) {
    const resolved = path.resolve(arg);
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(resolved).sort()) {
        if (entry.endsWith('.jsonl')) files.push(path.join(resolved, entry));
      }
    } else {
      files.push(resolved);
    }
  }
  return files;
}

function main(argv: string[]): number {
  const args = argv.slice(2);
  let sessions: LabeledSession[];

  if (args.includes('--synthetic')) {
    sessions = syntheticNoiseFloorSessions();
    console.log('# Synthetic setup-variance dry run (same person, varied camera setup)\n');
  } else {
    if (args.length === 0) {
      console.error('usage: noise-floor <dir-or-files…> | --synthetic');
      return 2;
    }
    const paths = collectRecordingPaths(args);
    if (paths.length === 0) {
      console.error('no .jsonl recordings found');
      return 2;
    }
    sessions = paths.map((p) => ({
      label: path.basename(p, '.jsonl'),
      frames: parseRecording(fs.readFileSync(p, 'utf8')).frames,
    }));
    console.log(`# Noise-floor analysis of ${sessions.length} recording(s)\n`);
  }

  const summary = analyzeSessions(sessions);
  console.log(formatSummaryTable(summary));

  if (summary.usableSessions < sessions.length) {
    console.log(
      '\n⚠ some sessions were unusable (no calibration or zero reps) — check framing/lead-in'
    );
  }
  if (summary.usableSessions >= 2 && !(summary.betweenSessionCvPct <= 10)) {
    console.log('\n✗ between-session CV exceeds the 10% target');
    return 1;
  }
  return 0;
}

process.exit(main(process.argv));
