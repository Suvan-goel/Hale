export const attributionKeys = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'gbraid',
  'wbraid',
] as const;

export type AttributionKey = (typeof attributionKeys)[number];
export type AttributionPayload = Partial<Record<AttributionKey | 'landing_path', string>>;

export function collectAttribution(search: string, pathname: string): AttributionPayload {
  const params = new URLSearchParams(search);
  const payload: AttributionPayload = { landing_path: pathname || '/' };

  for (const key of attributionKeys) {
    const value = params.get(key);
    if (value) {
      payload[key] = trimAttributionValue(value);
    }
  }

  return payload;
}

export function trimAttributionValue(value: string): string {
  return value.trim().slice(0, 180);
}
