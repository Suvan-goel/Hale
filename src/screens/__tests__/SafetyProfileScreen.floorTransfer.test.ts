import fs from 'fs';
import path from 'path';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('SafetyProfileScreen floor-transfer question', () => {
  const text = source('src/screens/SafetyProfileScreen.tsx');

  it('keeps the FD-007 question (2026-07-04 founder amendment: two options, merged uncertain path) and accessibility labels', () => {
    expect(text).toContain('Can you get down to the floor and back up on your own?');
    expect(text).toContain('label="Yes"');
    expect(text).toContain('noLabel="Not yet"');
    expect(text).toContain('yesAccessibilityLabel="Yes, floor exercises can be included"');
    expect(text).toContain('noAccessibilityLabel="Not yet, use standing alternatives"');
  });

  it('maps visible answers only into the canonical floorTransfer status', () => {
    expect(text).toContain("onYes={() => selectFloorTransferStatus('confirmed')}");
    expect(text).toContain("onNo={() => selectFloorTransferStatus('avoid_for_now')}");
    expect(text).toContain('floorTransfer: { status: draft.floorTransferStatus }');
    expect(text).not.toMatch(/floorTransferCapability|floorTransferEligible|floorTransferAnswer/);
  });

  it('starts every movement question unanswered and requires answers before Continue', () => {
    expect(text).toContain("yesSelected={floorTransferStatus === 'confirmed'}");
    expect(text).toContain("noSelected={floorTransferStatus === 'avoid_for_now'}");
    expect(text).toContain("floorTransferStatus !== 'not_confirmed'");
    expect(text).toContain("stepUpStatus !== 'not_confirmed'");
    expect(text).toContain("singleLegStatus !== 'not_confirmed'");
    expect(text).toContain('disabled={!canSaveReferenceDetails || !movementAnswersComplete}');
  });

  it('does not use medical, frailty, or fall-risk language in the movement question surface', () => {
    const questionBlock = text.slice(text.indexOf('title="Movements to include"'));
    expect(questionBlock).not.toMatch(/medical|frail|frailty|fall risk|diagnos|failure/i);
  });
});
