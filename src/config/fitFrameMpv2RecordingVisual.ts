export const FIT_FRAME_MPV2_RECORDING_VISUAL_ROLLBACK_ENV =
  'EXPO_PUBLIC_DISABLE_FIT_FRAME_MPV2' as const;

export function parseFitFrameMpv2RecordingVisualRollbackFlag(value: unknown): boolean {
  return value === '1';
}

export function isFitFrameMpv2RecordingVisualEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return !parseFitFrameMpv2RecordingVisualRollbackFlag(
    env[FIT_FRAME_MPV2_RECORDING_VISUAL_ROLLBACK_ENV]
  );
}

export const FIT_FRAME_MPV2_RECORDING_VISUAL_ENABLED =
  isFitFrameMpv2RecordingVisualEnabled();
