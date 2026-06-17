import { checkupIntroCaption } from '../copy';

describe('check-up copy', () => {
  it('uses the active battery count in the visible intro copy', () => {
    expect(checkupIntroCaption(4)).toBe(
      "We'll guide you through four short movements to check strength, balance, and mobility."
    );
    expect(checkupIntroCaption(5)).toBe(
      "We'll guide you through five short movements to check strength, balance, and mobility."
    );
    expect(checkupIntroCaption(12)).toBe(
      "We'll guide you through 12 short movements to check strength, balance, and mobility."
    );
  });
});
