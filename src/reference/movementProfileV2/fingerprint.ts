export function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  const type = typeof value;
  if (type === 'string') return JSON.stringify(value);
  if (type === 'number') return Number.isFinite(value as number) ? JSON.stringify(value) : '"__nonfinite__"';
  if (type === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (type === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }
  return '"__unsupported__"';
}

export function deterministicFingerprint(prefix: string, value: unknown): string {
  const payload = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < payload.length; index++) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${prefix}-${hash.toString(36).padStart(7, '0')}`;
}
