/**
 * Segmentation-mask figure: renders the user's true contour as a native
 * tinted matte (never camera pixels) behind the fit-frame pose trace.
 *
 * Experimental, Android-only, default OFF. The go/no-go gates are on-device:
 * inference fps with masks enabled (latency diagnostics) and mask edge
 * quality in dim evening light at ~3 m. See docs/decisions.md (2026-07-03).
 */

export const SEGMENTATION_MASK_FIGURE_ENV = 'EXPO_PUBLIC_SEGMENTATION_MASK_FIGURE';

export function resolveSegmentationMaskFigureEnabled(
  value: string | undefined = process.env[SEGMENTATION_MASK_FIGURE_ENV]
): boolean {
  return value === '1' || value === 'on' || value === 'true';
}

/**
 * The fit-frame card must not paint an opaque canvas over the native mask
 * figure, which renders behind the JS overlay.
 */
export function fitFrameCanvasFill(maskFigureEnabled: boolean, canvasColor: string): string {
  return maskFigureEnabled ? 'none' : canvasColor;
}
