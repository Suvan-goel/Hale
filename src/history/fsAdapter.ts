/**
 * expo-file-system implementation of HistoryFs. App-only — kept out of the
 * pure store/serialize/trends modules so tests never import a native module.
 * Stores check-ups under <documents>/checkups/.
 */

import { Directory, File, Paths } from 'expo-file-system';

import { HistoryFs } from './store';

function checkupsDir(): Directory {
  const dir = new Directory(Paths.document, 'checkups');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export const expoHistoryFs: HistoryFs = {
  list() {
    try {
      return checkupsDir()
        .list()
        .filter((entry): entry is File => entry instanceof File)
        .map((file) => file.name);
    } catch {
      return [];
    }
  },
  async read(name) {
    try {
      const file = new File(checkupsDir(), name);
      return file.exists ? await file.text() : null;
    } catch {
      return null;
    }
  },
  write(name, content) {
    const file = new File(checkupsDir(), name);
    file.write(content);
  },
};
