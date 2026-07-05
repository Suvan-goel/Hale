import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Android release permissions', () => {
  // 2026-07-05 scoped audio-law amendment (docs/decisions.md): RECORD_AUDIO
  // returns for windowed on-device voice commands in voice-guided training
  // sessions — the deliberate revisit the 2026-07-01 entry required. The
  // guardrail now pins camera + record-audio and NOTHING ELSE: no media,
  // foreground-service, or wake-lock permissions may creep in.
  it('declares exactly camera and record-audio permissions for Android', () => {
    const appJson = JSON.parse(readFileSync(join(process.cwd(), 'app.json'), 'utf8'));

    expect(appJson.expo.android.permissions).toEqual([
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
    ]);
    expect(JSON.stringify(appJson.expo.android.permissions)).not.toMatch(/MEDIA|FOREGROUND|WAKE_LOCK|BLUETOOTH|BACKGROUND/i);
  });

  it('keeps expo-audio itself non-recording (voice capture lives only in expo-voice-commands)', () => {
    const appJson = JSON.parse(readFileSync(join(process.cwd(), 'app.json'), 'utf8'));
    const audioPlugin = appJson.expo.plugins.find(
      (plugin: unknown): plugin is [string, Record<string, unknown>] =>
        Array.isArray(plugin) && plugin[0] === 'expo-audio'
    );

    expect(audioPlugin).toBeDefined();
    expect(audioPlugin?.[1]).toMatchObject({
      microphonePermission: false,
      recordAudioAndroid: false,
      enableBackgroundRecording: false,
      enableBackgroundPlayback: false,
    });
  });

  it('states the on-device, never-recorded promise in both iOS mic permission strings', () => {
    const appJson = JSON.parse(readFileSync(join(process.cwd(), 'app.json'), 'utf8'));
    const infoPlist = appJson.expo.ios.infoPlist;

    for (const key of ['NSMicrophoneUsageDescription', 'NSSpeechRecognitionUsageDescription']) {
      const text = String(infoPlist[key]);
      expect(text.length).toBeGreaterThan(0);
      expect(text).toMatch(/never (recorded|uploaded)|nothing[^.]*(recorded|uploaded)/i);
      expect(text).toMatch(/on (this|your) phone/i);
    }
  });

  it('keeps bundled voice playback foreground-only and recording-disabled', () => {
    const voicePlayer = readFileSync(join(process.cwd(), 'src/audio/voicePlayer.ts'), 'utf8');

    expect(voicePlayer).toContain('shouldPlayInBackground: false');
    expect(voicePlayer).toContain('allowsRecording: false');
    expect(voicePlayer).toContain("interruptionMode: 'mixWithOthers'");
  });
});
