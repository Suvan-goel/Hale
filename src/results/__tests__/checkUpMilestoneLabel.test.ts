import { checkUpMilestoneLabel } from '../movementProfileV2ResultsAdapter';

describe('check-up milestone labels', () => {
  it.each([
    ['baseline', 'Baseline check-up'],
    ['week4', 'Week 4 check-up'],
    ['week8', 'Week 8 check-up'],
    ['week12', 'Week 12 check-up'],
  ] as const)('labels %s as %s', (milestone, expected) => {
    expect(checkUpMilestoneLabel(milestone)).toBe(expected);
  });
});
