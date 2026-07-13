/**
 * expo-file-system implementation of HistoryFs. App-only — kept out of the
 * pure store/serialize/trends modules so tests never import a native module.
 * Stores check-ups under <documents>/checkups/ for legacy callers, or under
 * <documents>/checkups/users/<user-id>/ when the app is signed in.
 */

import { Directory, File, Paths } from 'expo-file-system';

import { historyDirectorySegments, moveLocalFiles } from './localScope';
import { HistoryFs } from './store';

export interface ExpoHistoryFsOptions {
  userId?: string | null;
  /** Destructive/account flows must surface I/O failures instead of degrading. */
  strictErrors?: boolean;
}

function checkupsDir(options: ExpoHistoryFsOptions = {}): Directory {
  const dir = new Directory(Paths.document, ...historyDirectorySegments(options));
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function createExpoHistoryFs(options: ExpoHistoryFsOptions = {}): HistoryFs {
  return {
    list() {
      try {
        return checkupsDir(options)
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
        const file = new File(checkupsDir(options), name);
        return file.exists ? await file.text() : null;
      } catch (error) {
        if (options.strictErrors) throw error;
        return null;
      }
    },
    write(name, content) {
      const file = new File(checkupsDir(options), name);
      file.write(content);
    },
    delete(name) {
      try {
        const file = new File(checkupsDir(options), name);
        if (file.exists) file.delete();
        if (options.strictErrors && file.exists) {
          throw new Error(`File still exists after deletion: ${name}`);
        }
      } catch (error) {
        if (options.strictErrors) throw error;
        // Ordinary store cleanup stays idempotent. Account deletion constructs
        // this adapter with strictErrors so it can report and verify failures.
      }
    },
  };
}

/**
 * Moves device-local guest files (the unscoped directory) into a signed-in
 * user's scope. Used once, when an account is first created on a device that
 * already has guest data: the account adopts the guest's check-ups, training
 * state, and preferences instead of starting empty. Existing files in the
 * user scope are never overwritten; guest files are removed after the move so
 * a second account on the same device cannot adopt another person's data.
 */
export async function adoptGuestLocalFiles(userId: string): Promise<{ moved: number }> {
  return moveLocalFiles(
    createExpoHistoryFs({ strictErrors: true }),
    createExpoHistoryFs({ userId, strictErrors: true })
  );
}
