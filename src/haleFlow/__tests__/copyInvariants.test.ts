import { bareDownwardChanges, type DirectionalChangeCopy } from '../testing/copyInvariants';

describe('worse-never-bare copy invariant helper (REPOSITION_TDD §2.4)', () => {
  const row = (
    id: string,
    direction: DirectionalChangeCopy['direction'],
    supportCopy?: string | null
  ): DirectionalChangeCopy => ({ id, direction, supportCopy });

  it('flags downward rows with missing, null, or blank support copy', () => {
    expect(
      bareDownwardChanges([
        row('missing', 'down'),
        row('null', 'down', null),
        row('blank', 'down', '   '),
      ])
    ).toEqual(['missing', 'null', 'blank']);
  });

  it('accepts downward rows paired with a trainable path', () => {
    expect(
      bareDownwardChanges([
        row('paired', 'down', 'Balance responds quickly to practice — your plan keeps it in every week.'),
      ])
    ).toEqual([]);
  });

  it('never requires support copy for up or steady rows', () => {
    expect(bareDownwardChanges([row('up', 'up'), row('steady', 'steady', null)])).toEqual([]);
  });
});
