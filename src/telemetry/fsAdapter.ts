/**
 * expo-file-system adapter for the session-funnel log. App-only — kept out of
 * the pure record/store modules so tests never import a native module. Stores
 * funnels under <documents>/telemetry/funnel/guest/ or
 * <documents>/telemetry/funnel/users/<user-id>/.
 */

import { Directory, File, Paths } from 'expo-file-system';

import { moveLocalFiles } from '../history/localScope';
import type { HistoryFs } from '../history/store';

export interface ExpoSessionFunnelFsOptions {
  userId?: string | null;
  /** Read the pre-scope directory used by older app versions. */
  legacyUnscoped?: boolean;
  /** Destructive privacy flows must surface I/O failures. */
  strictErrors?: boolean;
}

function safeScopeSegment(value: string): string {
  const normalized = value.trim().replace(/[^A-Za-z0-9_-]/g, '_');
  return normalized.length > 0 ? normalized : 'unknown';
}

function funnelDir(options: ExpoSessionFunnelFsOptions = {}): Directory {
  const segments = options.legacyUnscoped
    ? ['telemetry', 'funnel']
    : options.userId
      ? ['telemetry', 'funnel', 'users', safeScopeSegment(options.userId)]
      : ['telemetry', 'funnel', 'guest'];
  const dir = new Directory(Paths.document, ...segments);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function createExpoSessionFunnelFs(
  options: ExpoSessionFunnelFsOptions = {}
): HistoryFs {
  return {
    list() {
      try {
        return funnelDir(options)
          .list()
          .filter((entry): entry is File => entry instanceof File)
          .map((file) => file.name);
      } catch (error) {
        if (options.strictErrors) throw error;
        return [];
      }
    },
    async read(name) {
      try {
        const file = new File(funnelDir(options), name);
        return file.exists ? await file.text() : null;
      } catch (error) {
        if (options.strictErrors) throw error;
        return null;
      }
    },
    write(name, content) {
      const file = new File(funnelDir(options), name);
      file.write(content);
    },
    delete(name) {
      try {
        const file = new File(funnelDir(options), name);
        if (file.exists) file.delete();
        if (options.strictErrors && file.exists) {
          throw new Error(`Session funnel still exists after deletion: ${name}`);
        }
      } catch (error) {
        if (options.strictErrors) throw error;
        // Ordinary telemetry cleanup remains best-effort. Privacy deletion
        // constructs strict adapters and verifies the directory afterwards.
      }
    },
  };
}

/** Move guest and pre-scope records once when a new account adopts the device. */
export async function adoptGuestSessionFunnelFiles(
  userId: string
): Promise<{ moved: number }> {
  const target = createExpoSessionFunnelFs({ userId, strictErrors: true });
  const guest = await moveLocalFiles(
    createExpoSessionFunnelFs({ strictErrors: true }),
    target
  );
  const legacy = await moveLocalFiles(
    createExpoSessionFunnelFs({ legacyUnscoped: true, strictErrors: true }),
    target
  );
  return { moved: guest.moved + legacy.moved };
}
