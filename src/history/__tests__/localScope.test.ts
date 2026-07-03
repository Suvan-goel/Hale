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

describe('moveLocalFiles (guest data adoption)', () => {
  const { createMemoryFs } = require('../store') as typeof import('../store');
  const { moveLocalFiles } = require('../localScope') as typeof import('../localScope');

  it('moves guest files into the user scope and empties the guest scope', async () => {
    const guestFiles = new Map<string, string>([
      ['checkup-a.json', '{"a":1}'],
      ['prefs.json', '{"voice":"clara"}'],
    ]);
    const userFiles = new Map<string, string>();
    const result = await moveLocalFiles(createMemoryFs(guestFiles), createMemoryFs(userFiles));

    expect(result.moved).toBe(2);
    expect(userFiles.get('checkup-a.json')).toBe('{"a":1}');
    expect(userFiles.get('prefs.json')).toBe('{"voice":"clara"}');
    expect(guestFiles.size).toBe(0);
  });

  it('never overwrites files already present in the user scope', async () => {
    const guestFiles = new Map<string, string>([['prefs.json', '{"voice":"clara"}']]);
    const userFiles = new Map<string, string>([['prefs.json', '{"voice":"marcus"}']]);
    const result = await moveLocalFiles(createMemoryFs(guestFiles), createMemoryFs(userFiles));

    expect(result.moved).toBe(0);
    expect(userFiles.get('prefs.json')).toBe('{"voice":"marcus"}');
    expect(guestFiles.size).toBe(0);
  });

  it('is a no-op for an empty guest scope', async () => {
    const userFiles = new Map<string, string>([['prefs.json', '{"voice":"marcus"}']]);
    const result = await moveLocalFiles(createMemoryFs(), createMemoryFs(userFiles));

    expect(result.moved).toBe(0);
    expect(userFiles.size).toBe(1);
  });
});
