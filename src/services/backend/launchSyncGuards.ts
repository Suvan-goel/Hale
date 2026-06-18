import { defaultTrainingState, type TrainingState } from '../../training';

export type LaunchRestoreOutcome =
  | 'pending'
  | 'restored'
  | 'skipped_non_empty_local'
  | 'no_remote_data'
  | 'failed'
  | 'timeout'
  | 'signed_out'
  | 'skipped_active_flow';

export interface LaunchSyncResultLike {
  status: string;
}

export function shouldSyncTrainingStateAfterLaunchRestore({
  localWasEmptyAtRestore,
  restoreOutcome,
  training,
}: {
  localWasEmptyAtRestore: boolean;
  restoreOutcome: LaunchRestoreOutcome;
  training: TrainingState;
}): boolean {
  if (!localWasEmptyAtRestore) return true;
  if (restoreOutcome !== 'failed' && restoreOutcome !== 'timeout') return true;
  return isTrainingStateMeaningfulForLaunchSync(training);
}

export function shouldCommitLaunchSyncFingerprint(results: readonly LaunchSyncResultLike[]): boolean {
  return results.every((result) => result.status === 'synced' || result.status === 'skipped');
}

export function shouldRetryLaunchSync(results: readonly LaunchSyncResultLike[]): boolean {
  return results.some((result) => result.status === 'failed' || result.status === 'signed_out');
}

function isTrainingStateMeaningfulForLaunchSync(training: TrainingState): boolean {
  const defaults = defaultTrainingState();
  return (
    training.block !== null ||
    training.progress.completedSessions > 0 ||
    training.progress.lastSessionAt !== null ||
    training.progress.retestDueAt !== null ||
    Object.keys(training.progression.levels).length > 0 ||
    Object.values(training.progression.velHistory).some((values) => values.length > 0) ||
    JSON.stringify(training.equipment) !== JSON.stringify(defaults.equipment) ||
    Object.keys(training.ladderProgressById).length > 0 ||
    training.generatedSessionSummaries.length > 0 ||
    training.lastPostSessionFeedback !== null ||
    JSON.stringify(training.planPreferences) !== JSON.stringify(defaults.planPreferences)
  );
}
