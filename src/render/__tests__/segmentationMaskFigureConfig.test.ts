import {
  fitFrameCanvasFill,
  resolveSegmentationMaskFigureEnabled,
} from '../segmentationMaskFigureConfig';

describe('resolveSegmentationMaskFigureEnabled', () => {
  it('is on by default', () => {
    expect(resolveSegmentationMaskFigureEnabled(undefined)).toBe(true);
    expect(resolveSegmentationMaskFigureEnabled('')).toBe(true);
  });

  it('accepts the explicit on-flag spellings', () => {
    expect(resolveSegmentationMaskFigureEnabled('1')).toBe(true);
    expect(resolveSegmentationMaskFigureEnabled('on')).toBe(true);
    expect(resolveSegmentationMaskFigureEnabled('true')).toBe(true);
  });

  it('keeps an explicit diagnostics opt-out', () => {
    expect(resolveSegmentationMaskFigureEnabled('0')).toBe(false);
    expect(resolveSegmentationMaskFigureEnabled('off')).toBe(false);
    expect(resolveSegmentationMaskFigureEnabled('false')).toBe(false);
    expect(resolveSegmentationMaskFigureEnabled('yes')).toBe(true);
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
