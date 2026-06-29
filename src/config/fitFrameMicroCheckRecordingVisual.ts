export const FIT_FRAME_MICRO_CHECK_RECORDING_VISUAL_ROLLBACK_ENV =
  'EXPO_PUBLIC_DISABLE_FIT_FRAME_MICRO_CHECK' as const;

export function parseFitFrameMicroCheckRecordingVisualRollbackFlag(value: unknown): boolean {
  return value === '1';
}

export function isFitFrameMicroCheckRecordingVisualEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return !parseFitFrameMicroCheckRecordingVisualRollbackFlag(
    env[FIT_FRAME_MICRO_CHECK_RECORDING_VISUAL_ROLLBACK_ENV]
  );
}

export const FIT_FRAME_MICRO_CHECK_RECORDING_VISUAL_ENABLED =
  isFitFrameMicroCheckRecordingVisualEnabled();
