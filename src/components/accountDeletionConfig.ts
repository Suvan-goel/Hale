export type AccountDataAction = 'delete-account' | 'clear-local-data';

export const DELETE_CONFIRMATION_WORD = 'DELETE';

export function canConfirmAccountDataAction(action: AccountDataAction, confirmationText: string): boolean {
  if (action === 'clear-local-data') return true;
  return confirmationText.trim().toUpperCase() === DELETE_CONFIRMATION_WORD;
}
