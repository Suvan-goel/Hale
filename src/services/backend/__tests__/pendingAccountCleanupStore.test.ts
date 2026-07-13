import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  markAccountDeletionConfirmed,
  markAccountDeletionUncertain,
  markDeletedAccountCleanupComplete,
  pendingAccountDeletionCleanups,
} from '../pendingAccountCleanupStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    multiRemove: jest.fn(),
  },
}));

const mockGetItem = jest.mocked(AsyncStorage.getItem);
const mockSetItem = jest.mocked(AsyncStorage.setItem);
const mockRemoveItem = jest.mocked(AsyncStorage.removeItem);
const mockMultiRemove = jest.mocked(AsyncStorage.multiRemove);

describe('pending account-deletion cleanup store', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    jest.clearAllMocks();
    values.clear();
    mockGetItem.mockImplementation(async (key) => values.get(key) ?? null);
    mockSetItem.mockImplementation(async (key, value) => { values.set(key, value); });
    mockRemoveItem.mockImplementation(async (key) => { values.delete(key); });
    mockMultiRemove.mockImplementation(async (keys) => {
      for (const key of keys) values.delete(key);
    });
  });

  it('persists an uncertain intent before remote deletion is known', async () => {
    await markAccountDeletionUncertain('user-a');

    await expect(pendingAccountDeletionCleanups()).resolves.toEqual([{
      userId: 'user-a',
      remoteState: 'uncertain',
      localCleanupPending: true,
    }]);
  });

  it('promotes a late remote success and removes the marker after local cleanup', async () => {
    await markAccountDeletionUncertain('user-a');
    await markAccountDeletionConfirmed('user-a');
    await expect(pendingAccountDeletionCleanups()).resolves.toEqual([{
      userId: 'user-a',
      remoteState: 'confirmed_deleted',
      localCleanupPending: true,
    }]);

    await markDeletedAccountCleanupComplete('user-a');
    await expect(pendingAccountDeletionCleanups()).resolves.toEqual([]);
    expect(mockMultiRemove).toHaveBeenCalledWith([
      '@pearl/pending-deleted-account-cleanup/v2',
      '@pearl/pending-deleted-account-cleanup/v1',
    ]);
  });

  it('retains an uncertain remote marker after its local scope is erased', async () => {
    await markAccountDeletionUncertain('user-a');
    await markDeletedAccountCleanupComplete('user-a');

    await expect(pendingAccountDeletionCleanups()).resolves.toEqual([{
      userId: 'user-a',
      remoteState: 'uncertain',
      localCleanupPending: false,
    }]);
  });
});
