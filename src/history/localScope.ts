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
