import {
  fitFrameCanvasFill,
  resolveSegmentationMaskFigureEnabled,
} from '../segmentationMaskFigureConfig';

describe('resolveSegmentationMaskFigureEnabled', () => {
  it('is off by default', () => {
    expect(resolveSegmentationMaskFigureEnabled(undefined)).toBe(false);
    expect(resolveSegmentationMaskFigureEnabled('')).toBe(false);
  });

  it('accepts the repo on-flag spellings', () => {
    expect(resolveSegmentationMaskFigureEnabled('1')).toBe(true);
    expect(resolveSegmentationMaskFigureEnabled('on')).toBe(true);
    expect(resolveSegmentationMaskFigureEnabled('true')).toBe(true);
  });

  it('treats anything else as off', () => {
    expect(resolveSegmentationMaskFigureEnabled('0')).toBe(false);
    expect(resolveSegmentationMaskFigureEnabled('off')).toBe(false);
    expect(resolveSegmentationMaskFigureEnabled('yes')).toBe(false);
  });
});

describe('fitFrameCanvasFill', () => {
  it('keeps the opaque card when the mask figure is off', () => {
    expect(fitFrameCanvasFill(false, '#F4EDE6')).toBe('#F4EDE6');
  });

  it('goes transparent so the native mask figure shows through when on', () => {
    expect(fitFrameCanvasFill(true, '#F4EDE6')).toBe('none');
  });
});
