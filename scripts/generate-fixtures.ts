/**
 * Regenerates the committed synthetic fixture recordings + their expected
 * replay summaries. Fully deterministic (seeded PRNG) — running this twice
 * produces byte-identical files. Run after intentionally changing pipeline
 * behavior, then review the .expected.json diff like any other code change.
 *
 *   npm run fixtures
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { makeHeader, serializeFrame, serializeHeader } from '../src/recording/format';
import { makeFrame, mulberry32, timestamps30fps } from '../src/pose/testing/syntheticPose';
import { replayRecording } from '../src/replay/replaySummary';
import { RawLandmarkEvent } from '../src/pose/types';

const FIXTURE_DIR = path.resolve(__dirname, '../src/replay/__tests__/fixtures');

interface Fixture {
  name: string;
  note: string;
  frames: RawLandmarkEvent[];
}

function standingWalkoutReturn(): Fixture {
  const rng = mulberry32(1001);
  const frames: RawLandmarkEvent[] = [
    // 5s standing: acquire → warmup → tracking → calibration locks
    ...timestamps30fps(0, 150).map((t) => makeFrame(t, rng)),
    // 1s gone: subject-gone fires, state machine resets
    ...timestamps30fps(5000, 30).map((t) => makeFrame(t, rng, { present: false })),
    // 5s back: re-acquire through a fresh warmup
    ...timestamps30fps(6000, 150).map((t) => makeFrame(t, rng)),
  ];
  return {
    name: 'standing-walkout-return',
    note: 'stand 5s, leave 1s, return 5s — exercises warmup, subject-gone, re-acquisition',
    frames,
  };
}

function sideViewStanding(): Fixture {
  const rng = mulberry32(2002);
  const frames = timestamps30fps(0, 240).map((t) =>
    makeFrame(t, rng, { leftVisibility: 0.15 })
  );
  return {
    name: 'side-view-standing',
    note: 'side-on stance, far side occluded — single reliable chain must track + calibrate',
    frames,
  };
}

function writeFixture(fixture: Fixture): void {
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  const lines = [
    serializeHeader(makeHeader('2026-06-12T00:00:00.000Z', { note: fixture.note })),
    ...fixture.frames.map(serializeFrame),
  ];
  const recordingPath = path.join(FIXTURE_DIR, `${fixture.name}.jsonl`);
  fs.writeFileSync(recordingPath, lines.join('\n') + '\n');

  const summary = replayRecording(fixture.frames);
  const expectedPath = path.join(FIXTURE_DIR, `${fixture.name}.expected.json`);
  fs.writeFileSync(expectedPath, JSON.stringify(summary, null, 2) + '\n');

  console.log(`${fixture.name}: ${fixture.frames.length} frames → ${path.relative(process.cwd(), recordingPath)}`);
  console.log(`  events: ${summary.events.map((e) => `${e.type}@${e.timestampMs}`).join(', ')}`);
}

writeFixture(standingWalkoutReturn());
writeFixture(sideViewStanding());
