import {
  HOT_INTENTS,
  matchIntent,
  normalizeTranscript,
  SAFETY_PRIORITY_INTENTS,
  VOICE_INTENT_CONFIG,
  VoiceIntent,
  VoiceIntentConfig,
} from '../intents';

const ALL: readonly VoiceIntent[] = [
  'ready',
  'done',
  'skip',
  'repeat',
  'pause',
  'resume',
  'stop',
  'pain',
];

function intentOf(transcript: string, enabled: readonly VoiceIntent[] = ALL): VoiceIntent | null {
  return matchIntent(transcript, enabled)?.intent ?? null;
}

describe('normalizeTranscript', () => {
  it('lowercases, strips punctuation and apostrophes, splits words', () => {
    expect(normalizeTranscript("  I'm READY!  ")).toEqual(['im', 'ready']);
    expect(normalizeTranscript('Done.')).toEqual(['done']);
    expect(normalizeTranscript('I’m done')).toEqual(['im', 'done']);
    expect(normalizeTranscript('...')).toEqual([]);
  });
});

describe('recall — accepted variants', () => {
  it.each([
    ["I'm ready", 'ready'],
    ['ready', 'ready'],
    ['okay', 'ready'],
    ['OK', 'ready'],
    ['i am ready', 'ready'],
    ['done', 'done'],
    ["I'm done", 'done'],
    ['all done', 'done'],
    ['finished', 'done'],
    ['skip', 'skip'],
    ['skip this one', 'skip'],
    ['repeat that', 'repeat'],
    ['say that again', 'repeat'],
    ['pause', 'pause'],
    ['resume', 'resume'],
    ['continue', 'resume'],
    ['keep going', 'resume'],
  ] as const)('"%s" → %s', (spoken, expected) => {
    expect(intentOf(spoken)).toBe(expected);
  });

  it('accepts phrases embedded in natural padding', () => {
    expect(intentOf("yeah I'm ready now")).toBe('ready');
    expect(intentOf('okay done', ['done', 'pause', 'skip'])).toBe('done');
    expect(intentOf('right finished')).toBe('done');
  });

  it('tolerates one-letter slips on long words only', () => {
    expect(intentOf('redy')).toBe('ready'); // 5 letters, ed 1
    expect(intentOf('finishd')).toBe('done'); // "finished" ed 1
    expect(intentOf('continu')).toBe('resume'); // "continue" ed 1 (dropped letter)
    expect(intentOf('contineu')).toBeNull(); // transposition = ed 2, correctly rejected
  });
});

describe('precision — must NOT fire', () => {
  it('never maps "down" to done (short words stay exact)', () => {
    expect(intentOf('down')).toBeNull();
    expect(intentOf('sit down')).toBeNull();
  });

  it('never fires skip from conversational speech (utterance cap)', () => {
    expect(intentOf('we could skip the news tonight')).toBeNull();
    expect(intentOf('maybe we should just skip ahead to the end')).toBeNull();
  });

  it('never fuzzes skip (exact words only)', () => {
    expect(intentOf('skit')).toBeNull();
    expect(intentOf('ship it')).toBeNull();
  });

  it('ignores unrelated speech and garbage', () => {
    expect(intentOf('what time is it')).toBeNull();
    expect(intentOf('come here a second love')).toBeNull();
    expect(intentOf('')).toBeNull();
    expect(intentOf('   ')).toBeNull();
    expect(intentOf('mmm hmm')).toBeNull();
  });

  it('rejects dictation-length transcripts even when a phrase appears', () => {
    expect(intentOf('so anyway after that I said okay and then we left for town')).toBeNull();
  });
});

describe('window context (enabled intents)', () => {
  it('only matches intents enabled for the window', () => {
    expect(intentOf('done', ['ready', 'repeat'])).toBeNull();
    expect(intentOf("I'm ready", ['done', 'pause', 'skip'])).toBeNull();
  });

  it('context resolves cross-intent overlap', () => {
    // "okay" is a ready-variant; in an active window (no ready) it must not fire done.
    expect(intentOf('okay', ['done', 'pause', 'skip'])).toBeNull();
  });
});

describe('ambiguity', () => {
  it('prefers the longer matched phrase', () => {
    // "im done" (2 words, done) beats "okay" (1 word, ready) in a window with both.
    expect(intentOf("okay i'm done", ['ready', 'done'])).toBe('done');
  });

  it('returns null on an unresolvable tie', () => {
    const config: VoiceIntentConfig = {
      ...VOICE_INTENT_CONFIG,
      pause: { phrases: ['stop'], fuzzyMinWordLength: 5, maxTranscriptWords: 4 },
      skip: { phrases: ['stop'], fuzzyMinWordLength: 99, maxTranscriptWords: 4 },
    };
    expect(matchIntent('stop', ['pause', 'skip'], config)).toBeNull();
  });
});

describe('safety words (pre-spike amendment 2026-07-05)', () => {
  it('exports the hot vocabulary and safety-priority sets', () => {
    expect(HOT_INTENTS).toEqual(['stop', 'pain', 'pause']);
    expect(SAFETY_PRIORITY_INTENTS).toEqual(['stop', 'pain']);
  });

  it.each([
    ['stop', 'stop'],
    ['stop it', 'stop'],
    ['please stop', 'stop'],
    ['stop stop', 'stop'],
    ['that hurts', 'pain'],
    ['it hurts', 'pain'],
    ['that hurt', 'pain'],
    ['ow', 'pain'],
    ['ouch', 'pain'],
    ['my knee hurts', 'pain'],
    ['oh that really hurts', 'pain'],
    ['too sore', 'pain'],
  ] as const)('"%s" → %s', (spoken, expected) => {
    expect(intentOf(spoken)).toBe(expected);
  });

  it('fires pain on mangled breathless variants (recall beats precision)', () => {
    expect(intentOf('that herts')).toBe('pain'); // "hurts" ed 1 (substitution)
    expect(intentOf('it hurs')).toBe('pain'); // "hurts" ed 1 (dropped letter)
    expect(intentOf('hurtin')).toBe('pain'); // "hurting" ed 1 (dropped g)
  });

  it('never fires stop from "step" (fuzz stays off the 4-letter safety word)', () => {
    expect(intentOf('step')).toBeNull();
    expect(intentOf('step up')).toBeNull();
  });

  it('safety beats commands regardless of window or phrase length', () => {
    // "okay" is a ready phrase; "ow" is pain — safety wins the tie in length.
    expect(intentOf('ow okay', ['ready', 'pain'])).toBe('pain');
    // A done window with hot intents: pain wins over done.
    expect(intentOf("i'm done it hurts", ['done', 'stop', 'pain'])).toBe('pain');
  });

  it('resolves a pure safety tie to stop (halt is the least destructive)', () => {
    const config: VoiceIntentConfig = {
      ...VOICE_INTENT_CONFIG,
      stop: { ...VOICE_INTENT_CONFIG.stop, phrases: ['enough'] },
      pain: { ...VOICE_INTENT_CONFIG.pain, phrases: ['enough'] },
    };
    expect(matchIntent('enough', ['stop', 'pain'], config)?.intent).toBe('stop');
  });

  it('safety words still fire inside longer natural speech', () => {
    expect(intentOf('no stop now please', ['stop', 'pain'])).toBe('stop');
  });
});

describe('config is data-driven', () => {
  it('honors a custom phrase table', () => {
    const config: VoiceIntentConfig = {
      ...VOICE_INTENT_CONFIG,
      done: { phrases: ['klar'], fuzzyMinWordLength: 5, maxTranscriptWords: 4 },
    };
    expect(matchIntent('klar', ['done'], config)?.intent).toBe('done');
    expect(matchIntent('done', ['done'], config)).toBeNull();
  });

  it('is JSON-serializable (no functions in config)', () => {
    const roundTripped = JSON.parse(JSON.stringify(VOICE_INTENT_CONFIG)) as VoiceIntentConfig;
    expect(roundTripped).toEqual(VOICE_INTENT_CONFIG);
  });
});
