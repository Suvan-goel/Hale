export type AccountDataAction = 'delete-account' | 'clear-local-data';

export const DELETE_CONFIRMATION_WORD = 'DELETE';
export const CLEAR_THIS_DEVICE_TITLE = 'Clear this device';
export const CLEAR_THIS_DEVICE_COPY =
  'This removes Hale data from this device and signs you out. It does not delete your cloud account.';
export const CLOUD_ACCOUNT_DELETION_CONTACT_COPY =
  'To delete your cloud account, contact Hale support.';

export function canConfirmAccountDataAction(action: AccountDataAction, confirmationText: string): boolean {
  if (action === 'clear-local-data') return true;
  return confirmationText.trim().toUpperCase() === DELETE_CONFIRMATION_WORD;
}
