import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  LEGACY_V1_CHECKUP_ROLLBACK_ENV,
  parseLegacyV1CheckUpRollbackFlag,
} from '../legacyV1CheckUpRollback';

describe('legacy V1 Check-Up rollback gate', () => {
  it('enables only for the exact compile-time 1 flag', () => {
    expect(parseLegacyV1CheckUpRollbackFlag('1')).toBe(true);
    expect(parseLegacyV1CheckUpRollbackFlag('0')).toBe(false);
    expect(parseLegacyV1CheckUpRollbackFlag('true')).toBe(false);
    expect(parseLegacyV1CheckUpRollbackFlag('yes')).toBe(false);
    expect(parseLegacyV1CheckUpRollbackFlag(' 1 ')).toBe(false);
    expect(parseLegacyV1CheckUpRollbackFlag(true)).toBe(false);
    expect(parseLegacyV1CheckUpRollbackFlag(undefined)).toBe(false);
  });

  it('keeps the documented local default off', () => {
    const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf8');

    expect(envExample).toContain(`${LEGACY_V1_CHECKUP_ROLLBACK_ENV}=0`);
  });
});
