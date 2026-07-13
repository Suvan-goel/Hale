export interface LocalHistoryScopeOptions {
  userId?: string | null;
}

export function historyDirectorySegments(options: LocalHistoryScopeOptions = {}): string[] {
  return options.userId ? ['checkups', 'users', safePathSegment(options.userId)] : ['checkups'];
}

function safePathSegment(value: string): string {
  const normalized = value.trim().replace(/[^A-Za-z0-9_-]/g, '_');
  return normalized.length > 0 ? normalized : 'unknown';
}

/**
 * Moves every file from one local scope into another without overwriting.
 * Used when a new account adopts a device's guest data: guest files are
 * removed after the move so a second account on the same device cannot adopt
 * another person's data, and files already present in the target scope win.
 */
export async function moveLocalFiles(
  sourceFs: import('./store').HistoryFs,
  targetFs: import('./store').HistoryFs
): Promise<{ moved: number }> {
  let moved = 0;
  for (const name of sourceFs.list()) {
    const content = await sourceFs.read(name);
    if (content === null) {
      throw new Error(`Could not read guest file during adoption: ${name}`);
    }
    const existing = await targetFs.read(name);
    if (existing === null) {
      targetFs.write(name, content);
      const verified = await targetFs.read(name);
      if (verified !== content) {
        throw new Error(`Could not verify adopted guest file: ${name}`);
      }
      moved++;
    }
    sourceFs.delete?.(name);
    if (sourceFs.list().includes(name)) {
      throw new Error(`Guest file still exists after adoption: ${name}`);
    }
  }
  return { moved };
}
