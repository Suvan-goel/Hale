import { authenticatedUserId } from '../authScope';

describe('authenticated local account scope', () => {
  it('never scopes files to an unconfirmed signup user without a session', () => {
    expect(
      authenticatedUserId({
        isSignedIn: false,
        user: { id: 'pending-confirmation-user' } as never,
      })
    ).toBeNull();
  });

  it('returns only a concrete signed-in user id', () => {
    expect(authenticatedUserId({ isSignedIn: true, user: null })).toBeNull();
    expect(
      authenticatedUserId({
        isSignedIn: true,
        user: { id: 'signed-in-user' } as never,
      })
    ).toBe('signed-in-user');
  });
});
