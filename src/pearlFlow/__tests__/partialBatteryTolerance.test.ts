/**
 * Partial-battery tolerance proof (persistence ruling 2026-07-07): Check-up #0
 * saves a TWO-PROTOCOL manual_extra_v2 record (balance → chair) into the same
 * check-up history as full batteries. This pins the downstream behaviour:
 * partial records round-trip storage, are structurally EXCLUDED from official
 * Movement Profile assessments/trends (by checkupType, before item count ever
 * matters), never perturb the Progress view model, and still yield the
 * placement inputs the programme engine reads. Routine programme-v2 check-ups
 * produce this same shape, so this is the shape's contract test.
 */

import type { CheckUp } from '../../checkup/types';
import { syntheticCheckUp } from '../../checkup/devFixture';
import { HistoryStore, type StoredCheckUp } from '../../history';
import type { HistoryFs } from '../../history/store';
import {
  createCapturedChairRiseV2Result,
  createCapturedOneLegBalanceV2Result,
  createMovementProfileV2InternalFlow,
  movementProfileV2InternalFlowReducer,
  movementProfileV2RawCheckUpFromFlow,
} from '../../movementProfileV2/internalCheckupFlow';
import { assessmentInputsFromCheckUp, checkupZeroBatterySequence } from '../../programme';
import { latestMovementProfileV2ResultsViewModel } from '../../movementProfileV2/viewModel';
import {
  latestOfficialMovementProfileV2Assessment,
  resolveStoredCheckUpType,
} from '../checkupHistory';
import { buildMovementProfileV2ProgressViewModel } from '../movementProfileV2ProgressViewModel';

function memoryFs(): HistoryFs {
  const files = new Map<string, string>();
  return {
    list: () => [...files.keys()],
    read: async (name: string) => files.get(name) ?? null,
    write: (name: string, contents: string) => {
      files.set(name, contents);
    },
  } as unknown as HistoryFs;
}

/** Exactly what ProgrammeCheckupZeroScreen produces: balance → chair, nothing else. */
function checkupZeroCheckUp(startedAt: string): CheckUp {
  let flow = createMovementProfileV2InternalFlow({
    startedAt,
    batterySequence: checkupZeroBatterySequence(),
  });
  flow = { ...flow, sourceType: 'manual_extra_v2' };
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'confirm_balance_setup',
    standingLeg: 'left',
  });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_balance',
    result: createCapturedOneLegBalanceV2Result({ standingLeg: 'left', holdsSec: [12, 11, 9] }),
  });
  flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_chair_setup' });
  flow = movementProfileV2InternalFlowReducer(flow, { type: 'complete_chair_practice' });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_chair',
    result: createCapturedChairRiseV2Result({ reps: 12 }),
  });
  const checkUp = movementProfileV2RawCheckUpFromFlow(flow);
  if (!checkUp) throw new Error('partial battery did not complete');
  return checkUp;
}

async function storedRecords(...saves: { checkUp: CheckUp; type: string }[]): Promise<StoredCheckUp[]> {
  const store = new HistoryStore(memoryFs());
  for (const save of saves) {
    store.save(save.checkUp, { checkupType: save.type as StoredCheckUp['checkupType'] });
  }
  return store.loadAll();
}

describe('Check-up #0 partial-battery records in shared history', () => {
  const partial = checkupZeroCheckUp('2026-07-07T10:00:00.000Z');

  it('has exactly the two pinned protocols and round-trips storage intact', async () => {
    expect(partial.items).toHaveLength(2);
    const records = await storedRecords({ checkUp: partial, type: 'manual_extra_v2' });
    expect(records).toHaveLength(1);
    expect(records[0].checkUp.items).toHaveLength(2);
    expect(resolveStoredCheckUpType(records[0], [])).toBe('manual_extra_v2');
  });

  it('is structurally excluded from official Movement Profile assessments and results', async () => {
    const records = await storedRecords({ checkUp: partial, type: 'manual_extra_v2' });
    expect(latestOfficialMovementProfileV2Assessment(records)).toBeNull();
    expect(latestMovementProfileV2ResultsViewModel(records)).toBeNull();
  });

  it('never perturbs the Progress view model built from official history', async () => {
    const baseline = syntheticCheckUp('2026-07-01T09:00:00.000Z');
    const withPartial = await storedRecords(
      { checkUp: baseline, type: 'baseline' },
      { checkUp: partial, type: 'manual_extra_v2' }
    );
    const withoutPartial = await storedRecords({ checkUp: baseline, type: 'baseline' });

    const vmWith = buildMovementProfileV2ProgressViewModel({ history: withPartial });
    const vmWithout = buildMovementProfileV2ProgressViewModel({ history: withoutPartial });
    expect(vmWith).toEqual(vmWithout);
  });

  it('still yields the T1/T3 placement inputs the programme engine consumes', () => {
    const inputs = assessmentInputsFromCheckUp(partial);
    expect(inputs.t3?.reps).toBe(12);
    expect(inputs.t1?.worseSideSeconds).toBe(12); // bestHoldSec of the measured side
  });
});
