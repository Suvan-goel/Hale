import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  CHAIR_RISE_V2_ID,
  CHAIR_STAND_ID,
  ONE_LEG_BALANCE_V2_ID,
  TUG_ID,
  getMovement,
  listMovements,
  registerMovement,
} from '../index';
import { DEFAULT_BATTERY, MOVEMENT_PROFILE_V2_BATTERY } from '../../checkup';

describe('movement registry', () => {
  it('serves the chair-stand definition by id', () => {
    const def = getMovement(CHAIR_STAND_ID);
    expect(def.displayName).toBe('30-Second Chair Stand');
    expect(def.cameraView).toEqual({ view: 'side', requiredReliableSideChains: 1 });
    expect(def.durationMs).toBe(30000);
    expect(def.equipment).toContain('chair');
  });

  it('rejects duplicate registration', () => {
    const def = getMovement(CHAIR_STAND_ID);
    expect(() => registerMovement(def)).toThrow(/already registered/);
  });

  it('throws a pointed error for unknown ids', () => {
    expect(() => getMovement('moonwalk')).toThrow(/unknown movement 'moonwalk'/);
  });

  it('lists registered movements', () => {
    expect(listMovements().map((d) => d.id)).toContain(CHAIR_STAND_ID);
  });

  it('registers the internal Movement Profile V2 battery without changing the default V1 battery', () => {
    expect(DEFAULT_BATTERY).not.toContain(CHAIR_RISE_V2_ID);
    expect(MOVEMENT_PROFILE_V2_BATTERY).toEqual([
      CHAIR_RISE_V2_ID,
      ONE_LEG_BALANCE_V2_ID,
      ACTIVE_SHOULDER_REACH_V2_ID,
      'hinge-reach',
    ]);
    for (const movementId of MOVEMENT_PROFILE_V2_BATTERY) {
      expect(getMovement(movementId).id).toBe(movementId);
    }
  });

  it('keeps fixed/beta assessment timing unchanged', () => {
    expect(getMovement(CHAIR_STAND_ID).durationMs).toBe(30000);
    expect(getMovement(TUG_ID).durationMs).toBeNull();
  });

  it('every definition creates an independent grader', () => {
    const def = getMovement(CHAIR_STAND_ID);
    const a = def.createGrader();
    const b = def.createGrader();
    expect(a).not.toBe(b);
  });
});
