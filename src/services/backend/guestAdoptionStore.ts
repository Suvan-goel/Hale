import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@pearl/guest-adoption-owner/v1';
let markerMutation: Promise<unknown> = Promise.resolve();

/**
 * Binds an interrupted guest-data move to the first account that claimed it.
 * This marker lives outside both file scopes, so a partial move can resume
 * without exposing leftover guest health/programme files to a second account.
 */
export async function guestAdoptionOwner(): Promise<string | null> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return typeof value === 'string' && value.length > 0 && value.length <= 200
    ? value
    : null;
}

export function claimGuestAdoption(userId: string): Promise<boolean> {
  return serializeMarkerMutation(async () => {
    const owner = await guestAdoptionOwner();
    if (owner && owner !== userId) return false;
    if (!owner) await AsyncStorage.setItem(STORAGE_KEY, userId);
    return true;
  });
}

export function completeGuestAdoption(userId: string): Promise<void> {
  return serializeMarkerMutation(async () => {
    if ((await guestAdoptionOwner()) === userId) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  });
}

function serializeMarkerMutation<T>(work: () => Promise<T>): Promise<T> {
  const operation = markerMutation.then(work, work);
  markerMutation = operation.then(() => undefined, () => undefined);
  return operation;
}
