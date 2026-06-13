/**
 * JSONL landmark-recording format. Pure TS — shared by the on-device
 * recorder, the headless replay CLI, and tests.
 *
 * Line 1: header JSON. Every following line: one frame
 *   {"t": <timestampMs>, "l": [x,y,z,vis,presence × 33]}   (l empty = no pose)
 * Numbers are rounded to 6 decimals (~sub-pixel at any sensible resolution)
 * to keep hour-long recordings manageable.
 */

import { RawLandmarkEvent } from '../pose/types';

export const RECORDING_VERSION = 1;
export const RECORDING_TYPE = 'landmark-recording';

export interface RecordingHeader {
  v: number;
  type: typeof RECORDING_TYPE;
  startedAt: string;
  sourceWidth?: number;
  sourceHeight?: number;
  note?: string;
}

export interface ParsedRecording {
  header: RecordingHeader;
  frames: RawLandmarkEvent[];
}

export function makeHeader(
  startedAtIso: string,
  extra?: Partial<Pick<RecordingHeader, 'sourceWidth' | 'sourceHeight' | 'note'>>
): RecordingHeader {
  return { v: RECORDING_VERSION, type: RECORDING_TYPE, startedAt: startedAtIso, ...extra };
}

export function serializeHeader(header: RecordingHeader): string {
  return JSON.stringify(header);
}

export function serializeFrame(event: RawLandmarkEvent): string {
  const lm = event.landmarks;
  const rounded = new Array<number>(lm.length);
  for (let i = 0; i < lm.length; i++) {
    rounded[i] = Math.round(lm[i] * 1e6) / 1e6;
  }
  return JSON.stringify({ t: Math.round(event.timestampMs), l: rounded });
}

export function parseRecording(text: string): ParsedRecording {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new Error('empty recording');
  }
  const header = JSON.parse(lines[0]) as RecordingHeader;
  if (header.type !== RECORDING_TYPE) {
    throw new Error(`not a landmark recording (type=${String(header.type)})`);
  }
  if (header.v !== RECORDING_VERSION) {
    throw new Error(`unsupported recording version ${header.v} (expected ${RECORDING_VERSION})`);
  }
  const frames: RawLandmarkEvent[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = JSON.parse(lines[i]) as { t: number; l: number[] };
    if (typeof row.t !== 'number' || !Array.isArray(row.l)) {
      throw new Error(`malformed frame at line ${i + 1}`);
    }
    frames.push({ timestampMs: row.t, landmarks: row.l });
  }
  return { header, frames };
}
