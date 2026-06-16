import type { SupportConnection } from './types';

export interface InviteServiceResult {
  status: 'stubbed';
  connectionId: string;
  message: string;
}

export class InviteService {
  async sendInvite(connection: SupportConnection): Promise<InviteServiceResult> {
    // TODO: connect to email/SMS/deep links when Hale has backend/auth.
    return {
      status: 'stubbed',
      connectionId: connection.id,
      message: 'Invite saved locally. No message was sent in this prototype.',
    };
  }
}
