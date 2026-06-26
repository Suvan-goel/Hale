import fs from 'fs';
import path from 'path';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('SafetyProfileScreen floor-transfer question', () => {
  const text = source('src/screens/SafetyProfileScreen.tsx');

  it('keeps the approved FD-007 question, options, and accessibility labels', () => {
    expect(text).toContain('Can you safely get down to the floor and back up without assistance?');
    expect(text).toContain('Choose "Not sure" if you would rather use standing alternatives for now.');
    expect(text).toContain('label="Yes"');
    expect(text).toContain('label="No"');
    expect(text).toContain('label="Not sure"');
    expect(text).toContain('accessibilityLabel="Yes, floor exercises can be included"');
    expect(text).toContain('accessibilityLabel="No, use standing alternatives"');
    expect(text).toContain('accessibilityLabel="Not sure, use standing alternatives"');
  });

  it('maps visible answers only into the canonical floorTransfer status', () => {
    expect(text).toContain("onYes={() => selectFloorTransferStatus('confirmed', 'yes')}");
    expect(text).toContain("onNo={() => selectFloorTransferStatus('avoid_for_now', 'no')}");
    expect(text).toContain("onNotSure={() => selectFloorTransferStatus('avoid_for_now', 'not_sure')}");
    expect(text).toContain('floorTransfer: { status: draft.floorTransferStatus }');
    expect(text).not.toMatch(/floorTransferCapability|floorTransferEligible|floorTransferAnswer:\s*\{/);
  });

  it('does not use medical, frailty, or fall-risk language in the floor question surface', () => {
    const floorQuestionBlock = text.slice(text.indexOf('function FloorTransferQuestion'));
    expect(floorQuestionBlock).not.toMatch(/medical|frail|frailty|fall risk|diagnos|failure/i);
  });
});
