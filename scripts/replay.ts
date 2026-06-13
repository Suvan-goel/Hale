/**
 * Headless replay CLI.
 *
 *   npm run replay -- <recording.jsonl>                       print summary
 *   npm run replay -- <recording.jsonl> --assert <expected>   exit 1 on drift
 *   npm run replay -- <recording.jsonl> --out <summary.json>  write summary
 *
 * Feeds a JSONL landmark recording through the exact same PosePipeline the
 * app runs, deterministically (all timing comes from recorded timestamps).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseRecording } from '../src/recording/format';
import { compareSummaries, replayRecording, ReplaySummary } from '../src/replay/replaySummary';

function main(argv: string[]): number {
  const args = argv.slice(2);
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      i++; // skip the flag's value
    } else {
      positional.push(args[i]);
    }
  }
  if (positional.length !== 1) {
    console.error('usage: replay <recording.jsonl> [--assert expected.json] [--out summary.json]');
    return 2;
  }
  const flagValue = (flag: string): string | null => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
  };

  const recordingPath = path.resolve(positional[0]);
  const { header, frames } = parseRecording(fs.readFileSync(recordingPath, 'utf8'));
  const summary = replayRecording(frames);

  const outPath = flagValue('--out');
  if (outPath) {
    fs.writeFileSync(path.resolve(outPath), JSON.stringify(summary, null, 2) + '\n');
  }

  const assertPath = flagValue('--assert');
  if (assertPath) {
    const expected = JSON.parse(fs.readFileSync(path.resolve(assertPath), 'utf8')) as ReplaySummary;
    const problems = compareSummaries(expected, summary);
    if (problems.length > 0) {
      console.error(`✗ ${path.basename(recordingPath)} drifted from ${path.basename(assertPath)}:`);
      for (const p of problems) console.error(`  - ${p}`);
      return 1;
    }
    console.log(`✓ ${path.basename(recordingPath)} matches ${path.basename(assertPath)}`);
    return 0;
  }

  console.log(JSON.stringify({ recordedAt: header.startedAt, ...summary }, null, 2));
  return 0;
}

process.exit(main(process.argv));
