import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  claimGuestAdoption,
  completeGuestAdoption,
  guestAdoptionOwner,
} from '../guestAdoptionStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockGetItem = jest.mocked(AsyncStorage.getItem);
const mockSetItem = jest.mocked(AsyncStorage.setItem);
const mockRemoveItem = jest.mocked(AsyncStorage.removeItem);

describe('guest adoption owner marker', () => {
  let owner: string | null;

  beforeEach(() => {
    jest.clearAllMocks();
    owner = null;
    mockGetItem.mockImplementation(async () => owner);
    mockSetItem.mockImplementation(async (_key, value) => { owner = value; });
    mockRemoveItem.mockImplementation(async () => { owner = null; });
  });

  it('lets the first account claim interrupted guest data and blocks a second account', async () => {
    await expect(claimGuestAdoption('user-a')).resolves.toBe(true);
    await expect(guestAdoptionOwner()).resolves.toBe('user-a');
    await expect(claimGuestAdoption('user-b')).resolves.toBe(false);
    await expect(guestAdoptionOwner()).resolves.toBe('user-a');
  });

  it('clears the marker only for the owning account after verified moves complete', async () => {
    await claimGuestAdoption('user-a');
    await completeGuestAdoption('user-b');
    expect(mockRemoveItem).not.toHaveBeenCalled();

    await completeGuestAdoption('user-a');
    expect(mockRemoveItem).toHaveBeenCalledWith('@pearl/guest-adoption-owner/v1');
  });
});
