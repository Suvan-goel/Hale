import { historyDirectorySegments } from '../localScope';

describe('local history account scope', () => {
  it('uses the legacy shared directory when no authenticated user is available', () => {
    expect(historyDirectorySegments()).toEqual(['checkups']);
    expect(historyDirectorySegments({ userId: null })).toEqual(['checkups']);
  });

  it('scopes local Hale data by authenticated user id', () => {
    expect(historyDirectorySegments({ userId: 'user-a' })).toEqual(['checkups', 'users', 'user-a']);
    expect(historyDirectorySegments({ userId: 'user-b' })).toEqual(['checkups', 'users', 'user-b']);
  });

  it('keeps user ids safe for filesystem path segments', () => {
    expect(historyDirectorySegments({ userId: ' user/a:b@example.com ' })).toEqual([
      'checkups',
      'users',
      'user_a_b_example_com',
    ]);
  });
});
