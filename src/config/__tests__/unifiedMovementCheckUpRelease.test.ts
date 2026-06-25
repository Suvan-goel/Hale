import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  UNIFIED_MOVEMENT_CHECKUP_RELEASE_ENV,
  parseUnifiedMovementCheckUpReleaseFlag,
} from '../unifiedMovementCheckUpRelease';

describe('unified Movement Check-Up release gate', () => {
  it('enables only for the exact compile-time 1 flag', () => {
    expect(parseUnifiedMovementCheckUpReleaseFlag('1')).toBe(true);
    expect(parseUnifiedMovementCheckUpReleaseFlag('0')).toBe(false);
    expect(parseUnifiedMovementCheckUpReleaseFlag('true')).toBe(false);
    expect(parseUnifiedMovementCheckUpReleaseFlag('yes')).toBe(false);
    expect(parseUnifiedMovementCheckUpReleaseFlag(' 1 ')).toBe(false);
    expect(parseUnifiedMovementCheckUpReleaseFlag(true)).toBe(false);
    expect(parseUnifiedMovementCheckUpReleaseFlag(undefined)).toBe(false);
  });

  it('keeps the documented local default off', () => {
    const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf8');

    expect(envExample).toContain(`${UNIFIED_MOVEMENT_CHECKUP_RELEASE_ENV}=0`);
  });
});
