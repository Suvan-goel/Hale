export const FIT_FRAME_TRAINING_RECORDING_VISUAL_ROLLBACK_ENV =
  'EXPO_PUBLIC_DISABLE_FIT_FRAME_TRAINING' as const;

export function parseFitFrameTrainingRecordingVisualRollbackFlag(value: unknown): boolean {
  return value === '1';
}

export function isFitFrameTrainingRecordingVisualEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return !parseFitFrameTrainingRecordingVisualRollbackFlag(
    env[FIT_FRAME_TRAINING_RECORDING_VISUAL_ROLLBACK_ENV]
  );
}

export const FIT_FRAME_TRAINING_RECORDING_VISUAL_ENABLED =
  isFitFrameTrainingRecordingVisualEnabled();
