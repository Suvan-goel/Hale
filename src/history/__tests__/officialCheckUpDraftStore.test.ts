import {
  CHECKUP_SELF_REPORT_SCHEMA_VERSION,
  CLARITY_ITEM_SET_ID,
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  createCheckUpProtocolPolicy,
  type CheckUp,
} from '../../checkup';
import { createMemoryFs } from '../store';
import {
  OFFICIAL_CHECKUP_DRAFT_FILE,
  OFFICIAL_CHECKUP_DRAFT_MAX_AGE_MS,
  OfficialCheckUpDraftStore,
} from '../officialCheckUpDraftStore';

function checkUp(): CheckUp {
  const startedAt = '2026-07-09T09:00:00.000Z';
  return {
    startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(
      MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
      startedAt
    ),
    bodyUnit: 1,
    items: [],
    selfReport: {
      schemaVersion: CHECKUP_SELF_REPORT_SCHEMA_VERSION,
      clarity: {
        itemSetId: CLARITY_ITEM_SET_ID,
        itemScores: [0, 1, 2, 1, 0],
      },
    },
  };
}

describe('OfficialCheckUpDraftStore', () => {
  it('round-trips the complete staged record without exposing it as history', async () => {
    const files = new Map<string, string>();
    const store = new OfficialCheckUpDraftStore(createMemoryFs(files));
    store.save(checkUp(), 'baseline', '2026-07-09T09:10:00.000Z');

    await expect(store.load('2026-07-09T09:11:00.000Z')).resolves.toMatchObject({
      checkupType: 'baseline',
      updatedAtIso: '2026-07-09T09:10:00.000Z',
      checkUp: {
        startedAt: '2026-07-09T09:00:00.000Z',
        selfReport: { clarity: { itemScores: [0, 1, 2, 1, 0] } },
      },
    });
    expect(files.has(OFFICIAL_CHECKUP_DRAFT_FILE)).toBe(true);
  });

  it('fails closed on malformed data and clears idempotently', async () => {
    const files = new Map([[OFFICIAL_CHECKUP_DRAFT_FILE, '{bad']]);
    const store = new OfficialCheckUpDraftStore(createMemoryFs(files));
    await expect(store.load()).resolves.toBeNull();
    store.clear();
    store.clear();
    await expect(store.load()).resolves.toBeNull();
  });

  it.each(['baseline_retake', 'official_retest'] as const)(
    'preserves the recoverable %s type',
    async (checkupType) => {
      const store = new OfficialCheckUpDraftStore(createMemoryFs());
      store.save(checkUp(), checkupType, '2026-07-09T09:10:00.000Z');
      await expect(store.load('2026-07-09T09:11:00.000Z')).resolves.toMatchObject({ checkupType });
    }
  );

  it('expires a draft before a later-day Clarity answer can be attached', async () => {
    const files = new Map<string, string>();
    const store = new OfficialCheckUpDraftStore(createMemoryFs(files));
    store.save(checkUp(), 'baseline', '2026-07-09T09:10:00.000Z');
    const afterExpiry = new Date(
      Date.parse('2026-07-09T09:10:00.000Z') + OFFICIAL_CHECKUP_DRAFT_MAX_AGE_MS + 1
    ).toISOString();
    await expect(store.load(afterExpiry)).resolves.toBeNull();
    expect(files.has(OFFICIAL_CHECKUP_DRAFT_FILE)).toBe(false);
  });
});
