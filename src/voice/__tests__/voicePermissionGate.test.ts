import {
  decideVoiceGate,
  DEFAULT_VOICE_SETUP_PREFS,
  VOICE_GATE_COPY,
} from '../voicePermissionGate';

const granted = { status: 'granted', granted: true, canAskAgain: true } as const;
const denied = { status: 'denied', granted: false, canAskAgain: false } as const;
const undetermined = { status: 'undetermined', granted: false, canAskAgain: true } as const;
const available = { available: true, reason: 'on_device_supported' } as const;
const unavailable = { available: false, reason: 'not_available' } as const;

describe('decideVoiceGate (no-nagging rules)', () => {
  it('first session, permission undecided → the one prompt', () => {
    expect(
      decideVoiceGate({ prefs: DEFAULT_VOICE_SETUP_PREFS, permission: undetermined, availability: available })
    ).toEqual({ kind: 'show_permission_prompt' });
  });

  it('prompt already shown + still undecided (she dismissed) → tap mode, never re-prompted', () => {
    expect(
      decideVoiceGate({
        prefs: { promptShown: true, safetyLineShown: false },
        permission: undetermined,
        availability: available,
      })
    ).toEqual({ kind: 'tap_only' });
  });

  it('denied → full-function tap mode regardless of prefs', () => {
    for (const promptShown of [true, false]) {
      expect(
        decideVoiceGate({
          prefs: { promptShown, safetyLineShown: false },
          permission: denied,
          availability: available,
        })
      ).toEqual({ kind: 'tap_only' });
    }
  });

  it('granted + available → listen, safety line exactly once', () => {
    expect(
      decideVoiceGate({
        prefs: { promptShown: true, safetyLineShown: false },
        permission: granted,
        availability: available,
      })
    ).toEqual({ kind: 'listen', showSafetyLine: true });
    expect(
      decideVoiceGate({
        prefs: { promptShown: true, safetyLineShown: true },
        permission: granted,
        availability: available,
      })
    ).toEqual({ kind: 'listen', showSafetyLine: false });
  });

  it('granted but recognizer unavailable → tap mode (no prompt, no error talk)', () => {
    expect(
      decideVoiceGate({
        prefs: { promptShown: true, safetyLineShown: true },
        permission: granted,
        availability: unavailable,
      })
    ).toEqual({ kind: 'tap_only' });
  });

  it('nothing known yet (module still loading) → tap mode, quietly', () => {
    expect(
      decideVoiceGate({ prefs: DEFAULT_VOICE_SETUP_PREFS, permission: null, availability: null })
    ).toEqual({ kind: 'tap_only' });
  });
});

describe('gate copy (N3 claims discipline — implementation-true statements only)', () => {
  it('both lines state on-phone processing and never-recorded', () => {
    for (const text of [VOICE_GATE_COPY.permissionPrompt, VOICE_GATE_COPY.safetyLine]) {
      expect(text).toMatch(/on your phone/i);
      expect(text).toMatch(/never recorded/i);
    }
    expect(VOICE_GATE_COPY.permissionPrompt).toMatch(/never uploaded/i);
  });

  it('the safety line names both safety words so the mic indicator is never a surprise', () => {
    expect(VOICE_GATE_COPY.safetyLine).toMatch(/stop/i);
    expect(VOICE_GATE_COPY.safetyLine).toMatch(/that hurts/i);
    expect(VOICE_GATE_COPY.safetyLine).toMatch(/throughout/i);
  });
});
