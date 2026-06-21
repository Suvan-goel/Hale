import { describe, expect, it } from 'vitest';

import { validateSignupRequest } from '@/lib/validation';

describe('signup validation', () => {
  it('normalises valid signup data', () => {
    const result = validateSignupRequest({
      email: ' TEST@Example.COM ',
      firstName: ' Sam ',
      platform: 'iphone',
      sourcePath: '/?focus=strength',
      attribution: {
        utm_source: 'google',
        gclid: 'abc',
        email: 'leak@example.com',
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe('test@example.com');
      expect(result.value.firstName).toBe('Sam');
      expect(result.value.platform).toBe('iphone');
      expect(result.value.attribution).toEqual({ utm_source: 'google', gclid: 'abc' });
    }
  });

  it('rejects invalid email addresses', () => {
    const result = validateSignupRequest({ email: 'not-email', platform: 'either' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.field).toBe('email');
  });

  it('rejects honeypot submissions', () => {
    const result = validateSignupRequest({ email: 'a@example.com', platform: 'either', company: 'bot' });
    expect(result.ok).toBe(false);
  });
});
