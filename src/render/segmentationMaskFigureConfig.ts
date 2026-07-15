/**
 * Segmentation-mask figure: renders the user's true contour as a native
 * tinted matte (never camera pixels) behind the fit-frame pose trace.
 *
 * The matte is the production recording figure. It is on by default, with an
 * explicit environment opt-out retained for real-device diagnostics. The mask
 * never crosses the native bridge and never contains camera pixels.
 */

export const SEGMENTATION_MASK_FIGURE_ENV = 'EXPO_PUBLIC_SEGMENTATION_MASK_FIGURE';

export function resolveSegmentationMaskFigureEnabled(
  value: string | undefined = process.env[SEGMENTATION_MASK_FIGURE_ENV]
): boolean {
  return value !== '0' && value !== 'off' && value !== 'false';
}

/**
 * The fit-frame card must not paint an opaque canvas over the native mask
 * figure, which renders behind the JS overlay.
 */
export function fitFrameCanvasFill(maskFigureEnabled: boolean, canvasColor: string): string {
  return maskFigureEnabled ? 'none' : canvasColor;
}
