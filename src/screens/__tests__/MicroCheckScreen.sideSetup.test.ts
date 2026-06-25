import fs from 'fs';
import path from 'path';

describe('side-aware setup screens', () => {
  const microCheckSource = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/screens/MicroCheckScreen.tsx'), 'utf8');
  const movementProfileSource = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/screens/MovementProfileV2CheckUpScreen.tsx'), 'utf8');

  it('gates side-dependent micro-check capture behind pinned side setup copy', () => {
    const text = microCheckSource();

    expect(text).toContain('createMicroCheckMeasurementContextForSide');
    expect(text).toContain('active={!metricDebug && runner !== null}');
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
    expect(text).toContain('Use the other side');
    expect(text).toContain('This result may not be directly comparable with your earlier checks.');
    expect(text).toContain('Your usual side will remain unchanged.');
    expect(text).toContain("We'll use your");
    expect(text).toContain('This keeps the result comparable with your earlier checks.');
  });
});
