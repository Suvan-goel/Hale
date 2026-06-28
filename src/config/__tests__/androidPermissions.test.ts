import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Android release permissions', () => {
  it('declares only camera permission explicitly for Android', () => {
    const appJson = JSON.parse(readFileSync(join(process.cwd(), 'app.json'), 'utf8'));

    expect(appJson.expo.android.permissions).toEqual(['android.permission.CAMERA']);
    expect(JSON.stringify(appJson.expo.android.permissions)).not.toMatch(/AUDIO|MEDIA|FOREGROUND|RECORD|WAKE_LOCK/i);
  });

  it('keeps bundled voice playback foreground-only and recording-disabled', () => {
    const voicePlayer = readFileSync(join(process.cwd(), 'src/audio/voicePlayer.ts'), 'utf8');

    expect(voicePlayer).toContain('shouldPlayInBackground: false');
    expect(voicePlayer).toContain('allowsRecording: false');
    expect(voicePlayer).toContain("interruptionMode: 'mixWithOthers'");
  });
});
