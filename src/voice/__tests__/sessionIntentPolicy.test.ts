import { HOT_INTENTS } from '../intents';
import { enabledSessionIntents } from '../sessionIntentPolicy';
import type { TrainingPhase } from '../../training/sessionPlayer';

const ACTIVE_PHASES: TrainingPhase[] = [
  'intro',
  'transition',
  'instructions',
  'waiting_ready',
  'countdown',
  'set',
  'rest',
  'voice_paused',
];

describe('enabledSessionIntents (hot-listening policy)', () => {
  it('hot intents are live in every active phase — including while the app speaks', () => {
    for (const phase of ACTIVE_PHASES) {
      for (const voiceBusy of [true, false]) {
        const enabled = enabledSessionIntents(phase, { voiceBusy });
        for (const hot of HOT_INTENTS) expect(enabled).toContain(hot);
      }
    }
  });

  it('command intents never listen while the app is speaking (self-trigger guard)', () => {
    for (const phase of ACTIVE_PHASES) {
      expect(enabledSessionIntents(phase, { voiceBusy: true })).toEqual(HOT_INTENTS);
    }
  });

  it('commands open per state: ready-window, set, rest, paused', () => {
    expect(enabledSessionIntents('waiting_ready', { voiceBusy: false })).toEqual(
      expect.arrayContaining(['ready', 'repeat', 'skip'])
    );
    expect(enabledSessionIntents('set', { voiceBusy: false })).toEqual(
      expect.arrayContaining(['done', 'skip'])
    );
    expect(enabledSessionIntents('rest', { voiceBusy: false })).toEqual(expect.arrayContaining(['skip']));
    expect(enabledSessionIntents('voice_paused', { voiceBusy: false })).toEqual(
      expect.arrayContaining(['resume'])
    );
    expect(enabledSessionIntents('set', { voiceBusy: false })).not.toContain('ready');
    expect(enabledSessionIntents('waiting_ready', { voiceBusy: false })).not.toContain('done');
  });

  it('terminal phases listen for nothing — the mic window closes with the session', () => {
    expect(enabledSessionIntents('complete', { voiceBusy: false })).toEqual([]);
    expect(enabledSessionIntents('done', { voiceBusy: false })).toEqual([]);
  });
});
