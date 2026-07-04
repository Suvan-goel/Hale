import { makeHeader, parseRecording, serializeFrame, serializeHeader } from '../format';

describe('recording format', () => {
  it('propagates header source dimensions onto every parsed frame', () => {
    const text = [
      serializeHeader(makeHeader('2026-07-04T00:00:00.000Z', { sourceWidth: 480, sourceHeight: 640 })),
      serializeFrame({ timestampMs: 0, landmarks: [] }),
      serializeFrame({ timestampMs: 33, landmarks: [] }),
    ].join('\n');
    const parsed = parseRecording(text);
    expect(parsed.frames).toHaveLength(2);
    for (const frame of parsed.frames) {
      expect(frame.sourceWidth).toBe(480);
      expect(frame.sourceHeight).toBe(640);
    }
  });

  it('leaves frames dimension-free when the header has no source dimensions (legacy recordings)', () => {
    const text = [
      serializeHeader(makeHeader('2026-07-04T00:00:00.000Z')),
      serializeFrame({ timestampMs: 0, landmarks: [] }),
    ].join('\n');
    const parsed = parseRecording(text);
    expect(parsed.frames[0].sourceWidth).toBeUndefined();
    expect(parsed.frames[0].sourceHeight).toBeUndefined();
  });
});
