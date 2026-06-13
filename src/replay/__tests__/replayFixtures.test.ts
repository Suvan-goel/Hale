/**
 * Replays the committed synthetic fixtures through the full pipeline and
 * pins their behavior. If a pipeline change shifts an event by one frame,
 * this fails — regenerate fixtures with `npm run fixtures` only when the
 * change is intentional, and review the .expected.json diff.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseRecording } from '../../recording/format';
import { compareSummaries, replayRecording, ReplaySummary } from '../replaySummary';

const FIXTURE_DIR = path.join(__dirname, 'fixtures');

function load(name: string) {
  const recording = parseRecording(
    fs.readFileSync(path.join(FIXTURE_DIR, `${name}.jsonl`), 'utf8')
  );
  const expected = JSON.parse(
    fs.readFileSync(path.join(FIXTURE_DIR, `${name}.expected.json`), 'utf8')
  ) as ReplaySummary;
  return { recording, expected };
}

describe('fixture replays', () => {
  it('standing-walkout-return matches its committed expectation', () => {
    const { recording, expected } = load('standing-walkout-return');
    const summary = replayRecording(recording.frames);
    expect(compareSummaries(expected, summary)).toEqual([]);
    // the load-bearing behavior, spelled out:
    expect(summary.events.map((e) => e.type)).toEqual([
      'subject-acquired',
      'tracking-started',
      'calibration-complete',
      'subject-gone',
      'subject-acquired',
      'tracking-started',
    ]);
    expect(summary.finalState).toBe('tracking');
    expect(summary.bodyUnit).not.toBeNull();
  });

  it('side-view-standing tracks and calibrates on a single reliable chain', () => {
    const { recording, expected } = load('side-view-standing');
    const summary = replayRecording(recording.frames);
    expect(compareSummaries(expected, summary)).toEqual([]);
    expect(summary.events.map((e) => e.type)).toEqual([
      'subject-acquired',
      'tracking-started',
      'calibration-complete',
    ]);
    expect(summary.meanChainReliability.leftSide).toBeLessThan(0.3);
    expect(summary.meanChainReliability.rightSide).toBeGreaterThan(0.8);
  });

  it('replay is deterministic: two runs produce identical summaries', () => {
    const { recording } = load('standing-walkout-return');
    const a = replayRecording(recording.frames);
    const b = replayRecording(recording.frames);
    expect(a).toEqual(b);
  });

  it('round-trips through serialize/parse without behavior change', () => {
    const { recording } = load('side-view-standing');
    const direct = replayRecording(recording.frames);
    // re-serialize and re-parse (what a device recording goes through)
    const { serializeFrame, serializeHeader, makeHeader } = jest.requireActual<
      typeof import('../../recording/format')
    >('../../recording/format');
    const text = [
      serializeHeader(makeHeader('2026-06-12T00:00:00.000Z')),
      ...recording.frames.map(serializeFrame),
    ].join('\n');
    const reparsed = parseRecording(text);
    expect(replayRecording(reparsed.frames)).toEqual(direct);
  });
});
