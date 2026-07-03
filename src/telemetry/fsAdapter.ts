/**
 * expo-file-system adapter for the session-funnel log. App-only — kept out of
 * the pure record/store modules so tests never import a native module. Stores
 * funnels under <documents>/telemetry/funnel/.
 */

import { Directory, File, Paths } from 'expo-file-system';

import type { HistoryFs } from '../history/store';

function funnelDir(): Directory {
  const dir = new Directory(Paths.document, 'telemetry', 'funnel');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function createExpoSessionFunnelFs(): HistoryFs {
  return {
    list() {
      try {
        return funnelDir()
          .list()
          .filter((entry): entry is File => entry instanceof File)
          .map((file) => file.name);
      } catch {
        return [];
      }
    },
    async read(name) {
      try {
        const file = new File(funnelDir(), name);
        return file.exists ? await file.text() : null;
      } catch {
        return null;
      }
    },
    write(name, content) {
      const file = new File(funnelDir(), name);
      file.write(content);
    },
    delete(name) {
      try {
        const file = new File(funnelDir(), name);
        if (file.exists) file.delete();
      } catch {
        // Local deletion should be idempotent; callers aggregate failures when needed.
      }
    },
  };
}

export const expoSessionFunnelFs: HistoryFs = createExpoSessionFunnelFs();
