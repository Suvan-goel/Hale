/**
 * Dev-mode landmark recorder. Buffers JSONL lines in memory (a 60s session is
 * ~3MB — fine) and writes one file on stop. Recording stays behind the
 * __DEV__ overlay toggle; it must never run for real users in V1.
 */

import { Directory, File, Paths } from 'expo-file-system';

import type { LandmarksEventPayload } from '../../modules/expo-pose-detection';
import { makeHeader, serializeFrame, serializeHeader } from './format';

export class LandmarkRecorder {
  private lines: string[] = [];
  private recording = false;

  get isRecording(): boolean {
    return this.recording;
  }

  /** Frames captured so far in the active recording. */
  get frameCount(): number {
    return this.recording ? Math.max(0, this.lines.length - 1) : 0;
  }

  start(firstEventHint?: { sourceWidth: number; sourceHeight: number }): void {
    if (this.recording) return;
    this.lines = [
      serializeHeader(
        makeHeader(new Date().toISOString(), {
          sourceWidth: firstEventHint?.sourceWidth,
          sourceHeight: firstEventHint?.sourceHeight,
        })
      ),
    ];
    this.recording = true;
  }

  /** Hot-path append: one string per frame, no I/O. */
  record(event: LandmarksEventPayload): void {
    if (!this.recording) return;
    this.lines.push(serializeFrame(event));
  }

  /** Stops and writes the JSONL file; returns its URI (null if nothing recorded). */
  async stop(): Promise<string | null> {
    if (!this.recording) return null;
    this.recording = false;
    if (this.lines.length <= 1) return null;
    const dir = new Directory(Paths.document, 'recordings');
    dir.create({ intermediates: true, idempotent: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = new File(dir, `rec-${stamp}.jsonl`);
    file.write(this.lines.join('\n') + '\n');
    this.lines = [];
    console.log(`[recorder] saved ${file.uri}`);
    return file.uri;
  }
}
