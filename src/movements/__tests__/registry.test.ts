import { CHAIR_STAND_ID, TUG_ID, getMovement, listMovements, registerMovement } from '../index';

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
