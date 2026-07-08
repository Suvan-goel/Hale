import fs from 'fs';
import path from 'path';

const SFX_CUES = [
  'rep-credit',
  'measurement-complete',
  'tracking-paused',
  'tracking-recovered',
  'session-complete',
] as const;

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('recording session sound-effect wiring', () => {
  it('bundles every session sound effect and keeps generation deterministic', () => {
    const manifest = source('src/audio/manifest.ts');
    const generator = source('scripts/generate-audio.ts');

    for (const cue of SFX_CUES) {
      expect(manifest).toContain(`'${cue}': require('../../assets/audio/sfx/${cue}.wav')`);
      expect(generator).toContain(`key: '${cue}'`);
      expect(fs.existsSync(path.join(process.cwd(), `assets/audio/sfx/${cue}.wav`))).toBe(true);
    }
  });

  it('guards Movement Profile V2 cue playback against duplicate snapshot refreshes', () => {
    const mpv2 = source('src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx');

    expect(mpv2).toContain('lastSfxTransitionKeyRef');
    expect(mpv2).toContain('movementProfileV2TransitionSfxKey');
    expect(mpv2).toContain('shouldPlayMovementProfileV2MeasurementCompleteSfx');
    expect(mpv2).toContain('next.repCreditCount > lastRepCreditCountRef.current');
    expect(mpv2).toContain("sfx.play('rep-credit')");
    expect(mpv2).toContain("sfx.play('measurement-complete')");
    expect(mpv2).toContain("sfx.play('tracking-paused')");
    expect(mpv2).toContain("sfx.play('tracking-recovered')");
    expect(mpv2).toContain("sfx.play('session-complete')");
  });
});
