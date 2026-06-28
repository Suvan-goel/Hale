import fs from 'fs';
import path from 'path';

describe('side-aware setup screens', () => {
  const microCheckSource = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/screens/MicroCheckScreen.tsx'), 'utf8');
  const microCheckSideSetupSource = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/training/microCheckSideSetup.ts'), 'utf8');
  const movementProfileSource = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx'), 'utf8');

  it('keeps side-dependent micro-check capture hands-free with timeout fallback copy', () => {
    const text = `${microCheckSource()}\n${microCheckSideSetupSource()}`;

    expect(text).toContain('MicroCheckCameraSideResolver');
    expect(text).toContain('createMicroCheckMeasurementContextForSide');
    expect(text).toContain('handsFreeMode = true');
    expect(text).toContain('active={!metricDebug && (runner !== null || handsFreeSideSetupActive)}');
    expect(text).toContain('Choose side manually');
    expect(text).toContain('user_fallback_selected');
    expect(text).toContain("Stand on one leg when you're ready. I'll start automatically.");
    expect(text).toContain("Turn side-on and reach when you're ready. I'll capture it automatically.");
    expect(text).toContain('Which side will you use?');
    expect(text).toContain('Choose the leg you can hold most comfortably today.');
    expect(text).toContain('Choose the leg you can extend comfortably.');
    expect(text).toContain('This matches your earlier micro checks.');
    expect(text).toContain('This matches your Movement Check-Up.');
    expect(text).toContain('This check will start or continue a separate side comparison.');
  });

  it('requires explicit confirmation before an official side-dependent retest uses the other side', () => {
    const text = movementProfileSource();

    expect(text).toContain('pendingOfficialFallback');
    expect(text).toContain('Use other side');
    expect(text).toContain('Side change affects comparison');
    expect(text).toContain('Keep ${sideName(pendingOfficialFallback.anchorSide)} side');
    expect(text).toContain('Use ${sideName(pendingOfficialFallback.fallbackSide)} side');
  });
});
