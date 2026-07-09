/**
 * End-to-end pin for the REAL check-up persistence pipeline (2026-07-09):
 * the two-protocol Check-up #0 battery (balance → chair), saved the way
 * ProgrammeV2Root saves it — official type + snapshot/assessment materialized
 * at save — must be visible to the fresh-results lookup, the Progress
 * history selection, and the results view model.
 *
 * This is the test that was missing when the promoted shell shipped records
 * the results pipeline could never accept (manual_extra_v2, unmaterialized,
 * shoulder-required canonicalization). Each assertion here guards one of the
 * three gates that silently swallowed real check-ups.
 */

import {
  createMovementProfileV2InternalFlow,
  movementProfileV2InternalFlowReducer,
  movementProfileV2RawCheckUpFromFlow,
  createCapturedChairRiseV2Result,
  createCapturedOneLegBalanceV2Result,
} from '../../movementProfileV2/internalCheckupFlow';
import { movementProfileV2ResultsViewModelForRecord } from '../../movementProfileV2/viewModel';
import type { CheckUp } from '../../checkup/types';
import type { BodySide } from '../../checkup/protocolSetup';
import { PEARL_MONTHLY_STRENGTH_BALANCE_PROTOCOL_VARIANT } from '../../checkup';
import { HistoryStore, createMemoryFs } from '../../history/store';
import type { StoredCheckUp, StoredCheckUpType } from '../../history';
import {
  materializeOfficialMovementProfileV2Artifacts,
  type MovementProfileV2ReferenceProfile,
} from '../../reference/movementProfileV2';
import { validOfficialMovementProfileV2Assessments } from '../checkupHistory';
import { movementProfileV2ProgressProfileBySourceCheckUpId } from '../movementProfileV2ProgressViewModel';

const REFERENCE_PROFILE: MovementProfileV2ReferenceProfile = {
  ageAtTest: 55,
  ageBasis: 'exact_age_at_test',
  referenceSex: 'female',
};

function buildCheckupZeroRawCheckUp(input: {
  startedAt: string;
  standingLeg?: BodySide;
  holdsSec?: readonly number[];
  reps?: number;
}): CheckUp {
  let flow = createMovementProfileV2InternalFlow({
    startedAt: input.startedAt,
    batterySequence: ['balance', 'chair'],
  });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'confirm_balance_setup',
    standingLeg: input.standingLeg ?? 'left',
  });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_balance',
    result: createCapturedOneLegBalanceV2Result({
      standingLeg: input.standingLeg ?? 'left',
      holdsSec: input.holdsSec ?? [12, 15, 14],
    }),
  });
  flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_chair_setup' });
  flow = movementProfileV2InternalFlowReducer(flow, { type: 'complete_chair_practice' });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_chair',
    result: createCapturedChairRiseV2Result({ reps: input.reps ?? 12 }),
  });
  const checkUp = movementProfileV2RawCheckUpFromFlow(flow);
  if (!checkUp) throw new Error('two-protocol raw check-up did not complete');
  return checkUp;
}

/** Mirrors ProgrammeV2Root.saveOfficialCheckUp — the production save path. */
function saveOfficialCheckUp(
  store: HistoryStore,
  priorHistory: readonly StoredCheckUp[],
  checkUp: CheckUp,
  referenceProfile: MovementProfileV2ReferenceProfile = REFERENCE_PROFILE
): StoredCheckUpType {
  const checkupType: StoredCheckUpType =
    validOfficialMovementProfileV2Assessments(priorHistory).length === 0
      ? 'baseline'
      : 'official_retest';
  const result = materializeOfficialMovementProfileV2Artifacts({
    checkUp,
    checkupType,
    referenceProfile,
    lifeGoal: null,
    acceptedHistory: priorHistory,
    snapshotCreatedAt: checkUp.startedAt,
    assessmentCreatedAt: checkUp.startedAt,
  });
  if (!result.ok) throw new Error(`materialization failed: ${result.reason}`);
  store.save(result.checkUp, {
    checkupType,
    movementProfileV2Snapshot: result.snapshot,
    movementProfileV2Assessment: result.assessment,
  });
  return checkupType;
}

describe('official Check-up #0 persistence pipeline', () => {
  it('materializes and surfaces a two-protocol check-up end to end', async () => {
    const store = new HistoryStore(createMemoryFs());
    const startedAt = '2026-07-09T10:00:00.000Z';
    const checkUp = buildCheckupZeroRawCheckUp({ startedAt });
    expect(checkUp.measurementProtocol).toMatchObject({
      protocolId: 'movement_profile_v2_battery',
      protocolVersion: 1,
      protocolVariant: PEARL_MONTHLY_STRENGTH_BALANCE_PROTOCOL_VARIANT,
    });

    const type = saveOfficialCheckUp(store, [], checkUp);
    expect(type).toBe('baseline');

    const stored = await store.loadAll();
    expect(stored[0].checkUp.measurementProtocol?.protocolVariant).toBe(
      PEARL_MONTHLY_STRENGTH_BALANCE_PROTOCOL_VARIANT
    );
    // Gate 1 (official type) + gate 2 (materialized artifacts): the record is
    // an accepted official assessment.
    expect(validOfficialMovementProfileV2Assessments(stored)).toHaveLength(1);

    // The fresh-results lookup ProgrammeV2Root runs after onComplete.
    const record = movementProfileV2ProgressProfileBySourceCheckUpId(stored, startedAt);
    expect(record).not.toBeNull();

    // Gate 3 (shoulder-optional canonicalization) + honest presentation: the
    // MVP view model renders only the two measured domains — never a
    // fabricated Mobility starting point, never a retake demand.
    const viewModel = movementProfileV2ResultsViewModelForRecord(record!, { comparisonOptIn: true });
    const cards = Object.fromEntries(viewModel.domainCards.map((card) => [card.domain, card]));
    expect(cards.strength_power.metric).toBe('12 rises in 30 seconds');
    expect(cards.balance.metric).toBe('15 sec best hold');
    expect(cards.mobility).toBeUndefined();
    expect(viewModel.focus.kind).not.toBe('needs_retake');
  });

  it('types the record series baseline then official_retest and anchors the prior standing leg', async () => {
    const store = new HistoryStore(createMemoryFs());
    const first = buildCheckupZeroRawCheckUp({
      startedAt: '2026-07-09T10:00:00.000Z',
      standingLeg: 'right',
    });
    saveOfficialCheckUp(store, [], first);

    const afterFirst = await store.loadAll();
    const second = buildCheckupZeroRawCheckUp({
      startedAt: '2026-08-09T10:00:00.000Z',
      standingLeg: 'right',
      reps: 14,
    });
    const secondType = saveOfficialCheckUp(store, afterFirst, second);
    expect(secondType).toBe('official_retest');

    const stored = await store.loadAll();
    // Comparison affordance condition: available from the 2nd official record.
    expect(validOfficialMovementProfileV2Assessments(stored)).toHaveLength(2);
    expect(
      movementProfileV2ProgressProfileBySourceCheckUpId(stored, second.startedAt)
    ).not.toBeNull();

    // Side-consistency: a new flow built over this history anchors the
    // standing leg to the prior official record (measurement hygiene).
    const nextFlow = createMovementProfileV2InternalFlow({
      startedAt: '2026-09-09T10:00:00.000Z',
      history: stored,
      batterySequence: ['balance', 'chair'],
    });
    expect(nextFlow.priorStandingLeg).toBe('right');
    expect(nextFlow.standingLeg).toBe('right');
  });

  it('still materializes when the reference profile is absent (claims degrade, never fabricated)', () => {
    const store = new HistoryStore(createMemoryFs());
    const checkUp = buildCheckupZeroRawCheckUp({ startedAt: '2026-07-09T10:00:00.000Z' });
    // A user who skipped age/sex: the save must not fail or invent defaults.
    const type = saveOfficialCheckUp(store, [], checkUp, {
      ageBasis: 'unknown',
      referenceSex: 'unknown',
    });
    expect(type).toBe('baseline');
  });
});
