import { defaultTrainingState, type TrainingState } from '../../../training';

import {
  shouldCommitLaunchSyncFingerprint,
  shouldRetryLaunchSync,
  shouldSyncTrainingStateAfterLaunchRestore,
} from '../launchSyncGuards';

function meaningfulTrainingState(): TrainingState {
  return {
    ...defaultTrainingState(),
    progress: {
      completedSessions: 1,
      lastSessionAt: '2026-06-18T10:00:00.000Z',
      retestDueAt: null,
    },
  };
}

describe('launch sync hardening guards', () => {
  it('blocks default training_state sync after failed fresh restore', () => {
    expect(
      shouldSyncTrainingStateAfterLaunchRestore({
        localWasEmptyAtRestore: true,
        restoreOutcome: 'failed',
        training: defaultTrainingState(),
      })
    ).toBe(false);
  });

  it('blocks default training_state sync after timed-out fresh restore', () => {
    expect(
      shouldSyncTrainingStateAfterLaunchRestore({
        localWasEmptyAtRestore: true,
        restoreOutcome: 'timeout',
        training: defaultTrainingState(),
      })
    ).toBe(false);
  });

  it('allows meaningful training_state sync after a failed restore', () => {
    expect(
      shouldSyncTrainingStateAfterLaunchRestore({
        localWasEmptyAtRestore: true,
        restoreOutcome: 'failed',
        training: meaningfulTrainingState(),
      })
    ).toBe(true);
  });

  it('does not block normal launches or empty remote accounts', () => {
    expect(
      shouldSyncTrainingStateAfterLaunchRestore({
        localWasEmptyAtRestore: false,
        restoreOutcome: 'failed',
        training: defaultTrainingState(),
      })
    ).toBe(true);
    expect(
      shouldSyncTrainingStateAfterLaunchRestore({
        localWasEmptyAtRestore: true,
        restoreOutcome: 'no_remote_data',
        training: defaultTrainingState(),
      })
    ).toBe(true);
  });

  it('does not permanently mark failed launch syncs as synced', () => {
    const failedResults = [{ status: 'failed' }];

    expect(shouldCommitLaunchSyncFingerprint(failedResults)).toBe(false);
    expect(shouldRetryLaunchSync(failedResults)).toBe(true);
  });

  it('marks a successful retry as synced', () => {
    const retryResults = [{ status: 'synced' }, { status: 'skipped' }];

    expect(shouldCommitLaunchSyncFingerprint(retryResults)).toBe(true);
    expect(shouldRetryLaunchSync(retryResults)).toBe(false);
  });
});
