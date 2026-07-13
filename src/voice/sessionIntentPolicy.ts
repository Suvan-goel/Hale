/**
 * Which voice intents are live in each session state — the hot-listening
 * policy from TDD-ADDENDUM §9, expressed as pure data flow so it is fully
 * ENGINE-AGNOSTIC (founder rule: nothing may assume which recognizer sits
 * behind the intent-matcher seam).
 *
 * Two rules, in priority order:
 * 1. HOT intents (stop / pain / pause) are enabled in every active session
 *    state, INCLUDING while the app itself is speaking — that is the entire
 *    point of a safety vocabulary. Self-triggering is prevented by the
 *    hot-phrase script lint on bundled lines, not by muting.
 * 2. COMMAND intents are enabled only in their state's window and NEVER while
 *    the app is speaking (`voiceBusy`) — this is what lets prompt scripts say
 *    "say done when you're finished" without firing themselves.
 */

import type { TrainingPhase } from '../training/voiceSessionPlayer';
import { HOT_INTENTS, VoiceIntent } from './intents';

const NO_COMMANDS: readonly VoiceIntent[] = [];

function commandIntentsForPhase(phase: TrainingPhase | 'rest_bonus_offer'): readonly VoiceIntent[] {
  switch (phase) {
    case 'waiting_ready':
      return ['ready', 'repeat', 'skip'];
    case 'set':
      return ['done', 'skip'];
    case 'rest':
      // skip = skip the rest timer (the player routes it by phase).
      return ['skip'];
    case 'rest_bonus_offer':
      // The once-per-item bonus-set offer rides the rest window: "I'm ready"
      // accepts (one extra set); skip declines via the rest-skip path.
      return ['ready', 'skip'];
    case 'voice_paused':
      return ['resume'];
    default:
      // intro / transition / instructions / countdown / complete / done and
      // every camera-mode phase: no command listening.
      return NO_COMMANDS;
  }
}

/**
 * The single source of truth the screen feeds to matchIntent(). Terminal
 * phases get no intents at all — the session is over, the mic window closes.
 */
export function enabledSessionIntents(
  phase: TrainingPhase,
  options: { voiceBusy: boolean; bonusOfferPending?: boolean }
): readonly VoiceIntent[] {
  if (phase === 'complete' || phase === 'done') return NO_COMMANDS;
  if (options.voiceBusy) return HOT_INTENTS;
  const effectivePhase =
    phase === 'rest' && options.bonusOfferPending === true ? 'rest_bonus_offer' : phase;
  return [...HOT_INTENTS, ...commandIntentsForPhase(effectivePhase)];
}
