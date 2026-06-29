export const FIT_FRAME_CHECKUP_RECORDING_VISUAL_ROLLBACK_ENV =
  'EXPO_PUBLIC_DISABLE_FIT_FRAME_CHECKUP' as const;

export function parseFitFrameCheckUpRecordingVisualRollbackFlag(value: unknown): boolean {
  return value === '1';
}

export function isFitFrameCheckUpRecordingVisualEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return !parseFitFrameCheckUpRecordingVisualRollbackFlag(
    env[FIT_FRAME_CHECKUP_RECORDING_VISUAL_ROLLBACK_ENV]
  );
}

export const FIT_FRAME_CHECKUP_RECORDING_VISUAL_ENABLED =
  isFitFrameCheckUpRecordingVisualEnabled();
