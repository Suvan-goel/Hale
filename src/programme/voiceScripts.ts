/**
 * Programme v2 voice-session line scripts (the 1.4 slice). Pure data:
 * imported by scripts/generate-audio.ts for the founder ElevenLabs run AND
 * linted with ZERO tolerance by hotPhraseGuardrail.test.ts — these lines play
 * while the hot safety vocabulary listens, so no line may contain a hot
 * phrase or any word in the matcher's fuzzy neighborhood of one (mind the
 * 5-letter fuzz: "stomp"~"stop", "cause"/"paused"~"pause", "paint"~"pain",
 * "touch"/"couch"~"ouch", "sore"~"sure" — all avoided here by wording).
 *
 * Tone rules follow VOICE_SESSION_LINE_SCRIPTS: patient, warm, never
 * clinical, never judgmental. The app waits for her; it never hurries her.
 * Doses are never spoken here — targets live on screen and in the player's
 * generic pacing lines — so a changed target never stales an asset.
 * All strings are placeholder copy pending the brand-voice pass.
 */

import type { VoiceCueKey } from '../audio/cues';

/** Cue key for one programme exercise's spoken instructions. */
export function programmeInstructionCueKey(exerciseId: string): VoiceCueKey {
  return `prog-${exerciseId.replace(/[._]/g, '-')}` as VoiceCueKey;
}

export const PROGRAMME_VOICE_LINES: Record<string, string> = {
  // ---- shared -------------------------------------------------------------
  'prog-programme-prep':
    "Let's warm up together. March gently on the spot and roll your shoulders. Add a few easy hip hinges and arm reaches when you feel like it — I'll tell you when it's time for the first exercise.",
  'prog-power-intent':
    'One thing to remember here: lower down slowly, then come up quick and strong. Slow down, fast up.',

  // ---- squat ladder ---------------------------------------------------------
  'prog-squat-assisted-sit-to-stand':
    'Sit toward the front of your chair, feet back under your knees. Press through your legs to stand tall, using hands on thighs as little as you need, then lower back down with control.',
  'prog-squat-partial-box-squat':
    'Stand in front of your chair, feet hip-width apart. Bend your knees to lower part of the way toward the seat, then press back up tall.',
  'prog-squat-sit-to-stand':
    'Sit toward the front of your chair, arms crossed or reaching forward. Stand all the way up, then lower back to the seat with control — no hands this time.',
  'prog-squat-slow-lower-sit-to-stand':
    'Stand up from the chair as normal, then take a slow count of three to lower yourself back down. The slow way down is where the work is.',
  'prog-squat-box-squat':
    'Feet hip-width, chair behind you. Send your hips back and lower until you just meet the seat, then drive back up to standing.',
  'prog-squat-fast-up-sit-to-stand':
    'Lower to the seat with control — then stand up as quickly as you can. Strong and snappy on the way up.',
  'prog-squat-air-squat':
    'Feet hip-width, toes turned out a little. Send your hips back and bend your knees as far as feels comfortable, then press back up tall.',
  'prog-squat-paused-squat':
    'Squat down as far as feels comfortable, hold still for a slow moment at the bottom, then press back up.',
  'prog-squat-low-step-up':
    'Face your step, a hand on the wall or rail if you like. Step up with your whole foot, press through the heel, then step down with control. Do the full count leading with one leg, then swap.',
  'prog-squat-lateral-step-up-low':
    'Stand side-on to your step. Step up sideways with the near foot, press to the top, then step down with control. Full count on one side, then swap.',
  'prog-squat-low-step-alternative':
    'Use any low, sturdy platform that will not slide. Step up with your whole foot, press through the heel, then step down with control. Full count one leg, then swap.',
  'prog-squat-step-up-high':
    'Same step-up on a higher step, if you have one that feels solid. Press through the heel, stand tall at the top, lower with control. Full count one leg, then swap.',
  'prog-squat-step-up-knee-drive':
    'Step up and drive the other knee up toward your chest at the top, then step down with control. Full count one leg, then swap.',
  'prog-squat-supported-split-squat':
    'Take a split stance, fingertips on the wall or a chair for balance. Lower your back knee toward the floor as far as feels comfortable, then press up. Full count one leg, then swap.',
  'prog-squat-static-lunge-shallow':
    'Split stance, both feet planted. Lower a little way down, chest tall, then press back up. Full count one leg, then swap.',
  'prog-squat-split-squat':
    'Split stance, no support this time. Lower your back knee toward the floor, chest tall, then drive up through the front foot. Full count one leg, then swap.',
  'prog-squat-tempo-split-squat':
    'Split squat with a slow count of three on the way down, then press up strong. Full count one leg, then swap.',
  'prog-squat-rfess':
    'Stand a stride in front of the sofa and rest the top of your back foot on it. Lower your back knee toward the floor, then press up through the front leg. Full count one leg, then swap.',
  'prog-squat-tempo-rfess':
    'Back foot resting on the sofa. Slow count of three on the way down, then press up strong. Full count one leg, then swap.',

  // ---- hinge ladder ---------------------------------------------------------
  'prog-hinge-glute-bridge':
    'Lie on your back, knees bent, feet flat and close to your hips. Press through your heels to lift your hips, squeeze at the top, then lower with control.',
  'prog-hinge-bridge-hold-top':
    'Lift your hips into the bridge and hold them up there, squeezing, breathing steadily the whole time.',
  'prog-hinge-paused-bridge':
    'Bridge your hips up, hold the squeeze for a slow moment at the top, then lower down with control.',
  'prog-hinge-feet-elevated-bridge':
    'Rest your heels on the step, knees bent. Press through your heels to lift your hips, squeeze, then lower with control.',
  'prog-hinge-single-leg-bridge':
    'Set up for a bridge, then straighten one leg. Press through the other heel and lift your hips level. Full count one leg, then swap.',
  'prog-hinge-single-leg-bridge-hold':
    'One leg straight, bridge up on the other side, hold a beat at the top with hips level, then lower. Full count one leg, then swap.',
  'prog-hinge-feet-elevated-single-leg-bridge':
    'Heels on the step, one leg lifted. Press up through the working heel, keep your hips level, lower with control. Full count one leg, then swap.',
  'prog-hinge-sofa-hip-thrust':
    'Rest your upper back on the sofa seat, feet flat on the floor. Drive your hips up until your body is level, squeeze, then lower with control.',
  'prog-hinge-wall-tap-hinge':
    'Stand a short step from the wall, facing away. Push your hips straight back until they meet the wall — soft knees, long back — then squeeze forward to stand tall.',
  'prog-hinge-hinge-arm-reach':
    'Hips back toward the wall as you fold at the hips, arms reaching down your thighs. Long back, soft knees, then stand tall.',
  'prog-hinge-good-morning':
    'Hands across your chest. Push your hips back and fold forward with a long, flat back, then squeeze through to stand tall.',
  'prog-hinge-hinge-fast-up':
    'Fold at the hips with control — then snap back up to standing, quick and strong.',
  'prog-hinge-kickstand-hinge':
    'Stagger your feet so the back foot is just a kickstand. Hips back, long back, fold and rise. Full count one side, then swap.',
  'prog-hinge-supported-single-leg-hinge':
    'Fingertips on the chair. Balance on one leg and fold at the hip, letting the other leg drift back, then rise tall. Full count one leg, then swap.',
  'prog-hinge-loaded-kickstand-hinge':
    'Hold your backpack or weight. Kickstand stance, hips back, long flat back — fold, then rise strong. Full count one side, then swap.',
  'prog-hinge-balance-reach':
    'Balance on one leg and reach forward as you fold gently at the hip, then rise tall. Keep a support within reach. Full count one leg, then swap.',

  // ---- push ladder ----------------------------------------------------------
  'prog-push-wall-push-up':
    'Hands flat on the wall at shoulder height, feet a step back. Bend your elbows to bring your chest toward the wall, then press away strong.',
  'prog-push-wall-push-up-slow':
    'Wall press-up with a slow count of three toward the wall, then press away.',
  'prog-push-counter-push-up':
    'Hands on the counter edge at shoulder width, body in one long line. Lower your chest toward the counter, then press back up.',
  'prog-push-paused-counter-push-up':
    'Counter press-up with a still moment at the bottom, then press away strong.',
  'prog-push-stair-push-up-high':
    'Hands on a higher stair, body long from head to heels. Lower your chest toward the step, then press back up.',
  'prog-push-knee-push-up':
    'On the floor, hands under your shoulders, knees down, hips in line. Lower your chest toward the floor, then press up.',
  'prog-push-sofa-arm-push-up':
    'Hands on the sofa arm, body in one long line. Lower your chest toward it, then press back up strong.',
  'prog-push-stair-push-up-mid':
    'Hands two or three stairs up, body long. Lower with control, press up strong.',
  'prog-push-knee-push-up-slow':
    'Knee press-up with a slow count of three on the way down, then press up.',
  'prog-push-low-table-push-up':
    'Hands on a low, sturdy table or bench, body long. Lower your chest, then press away.',
  'prog-push-stair-push-up-low':
    'Hands on the bottom stair, body long from head to heels. Lower your chest toward the step, then press up strong.',
  'prog-push-deficit-knee-push-up':
    'Knee press-up with your hands raised on low, solid supports, letting your chest travel a little deeper. Lower with control, press up.',
  'prog-push-low-surface-push-up':
    'Hands on any low, solid surface that will not slide. Body long, lower your chest, press away strong.',
  'prog-push-lower-only-push-up':
    'Full press-up position, and just the lowering half: take a slow count down to the floor, then reset from your knees. A few of these go a long way.',
  'prog-push-full-push-up':
    'Hands under shoulders, legs long, body in one line. Lower your chest to just above the floor, then press up. This is a big one — enjoy it.',
  'prog-push-full-push-up-slow':
    'Full press-up with a slow count of three on the way down, then press up strong.',
  'prog-push-tempo-push-up':
    'Press-up with a slow lower and a powerful press. Keep your body in one long line.',
  'prog-push-close-grip-push-up':
    'Press-up with your hands a little closer, elbows brushing your sides as you lower and press.',
  'prog-push-feet-elevated-push-up':
    'Feet up on the bottom stair, hands on the floor. Body long, lower with control, press up strong.',
  'prog-push-archer-intro':
    'Press-up with your weight shifted toward one arm, the other arm long to the side. Swap the working side each rep.',

  // ---- pull ladder ----------------------------------------------------------
  'prog-pull-prone-blade-squeeze':
    'Lie face down, arms by your sides. Lift your chest just a little and squeeze your shoulder blades down and together, then release slowly.',
  'prog-pull-seated-retraction-hold':
    'Sit tall on the chair. Draw your shoulder blades back and down, hold the squeeze, then release slowly.',
  'prog-pull-prone-t-raise':
    'Face down, arms out to the sides like a T. Squeeze your shoulder blades and float your arms up, then lower slowly.',
  'prog-pull-prone-w-raise':
    'Face down, elbows bent so your arms make a W. Squeeze your blades, lift, and lower with control.',
  'prog-pull-ytw-circuit':
    'Face down. Arms up in a Y, then out in a T, then bent in a W — lifting and lowering with a squeeze in each shape. That whole sequence is one rep.',
  'prog-pull-reverse-snow-angel':
    'Face down. Sweep your arms slowly from your sides up past your shoulders and back down, hovering just off the floor.',
  'prog-pull-band-pull-apart':
    'Hold the band at shoulder height, hands wide. Pull it apart until it meets your chest, squeezing your blades, then release slowly.',
  'prog-pull-overhead-band-pull-apart':
    'Band overhead, arms long. Pull it apart as you bring it a little way down behind your head, then return with control.',
  'prog-pull-seated-band-row':
    'Sit tall with the band looped around your feet. Row the band toward your ribs, elbows brushing your sides, squeeze, then release slowly.',
  'prog-pull-door-anchor-row':
    'With the band anchored, sit or stand tall and row toward your ribs, squeezing your shoulder blades. Release with control.',
  'prog-pull-single-arm-band-row':
    'Band around your feet. Row with one arm toward your ribs, squeeze, release slowly. Full count one arm, then swap.',
  'prog-pull-band-row-hold':
    'Row the band in and hold the squeeze at your ribs, breathing steadily, then release slowly.',
  'prog-pull-high-band-pull':
    'Hold the band up at eye height. Pull it apart and down toward your collarbones, squeeze, then return slowly.',
  'prog-pull-band-high-row':
    'From the high anchor, row down and back toward your ribs, chest tall, then release with control.',
  'prog-pull-backpack-row':
    'Hinge at the hips with a flat back, backpack in both hands. Row it up toward your ribs, squeeze, then lower slowly.',
  'prog-pull-supported-single-arm-backpack-row':
    'One hand on the chair, back flat. Row the backpack up toward your ribs with the other arm. Full count one arm, then swap.',

  // ---- core ladder ----------------------------------------------------------
  'prog-core-dead-bug-heel-slides':
    'On your back, knees above hips, low back heavy on the floor. Slide one heel away along the floor and back. Slow and steady — one side, then the other.',
  'prog-core-dead-bug-leg-lower':
    'On your back, knees above hips. Lower one heel toward the floor and back up, keeping your low back heavy. One side, then the other.',
  'prog-core-dead-bug-opposite':
    'On your back, arms up. Lower one arm overhead and the opposite heel toward the floor together, then return. Swap sides each rep.',
  'prog-core-dead-bug-slow':
    'Dead bug with a slow count each way — opposite arm and leg lower away while your low back stays heavy.',
  'prog-core-bird-dog':
    'On hands and knees. Reach one arm forward and the opposite leg back until both are long and level, then return. Swap sides each rep.',
  'prog-core-bird-dog-hold':
    'Reach opposite arm and leg long — and hold there, steady and level. Then swap sides.',
  'prog-core-knee-plank':
    'Forearms down, knees down, body in one line from head to knees. Hold steady and keep breathing.',
  'prog-core-knee-side-plank':
    'On one forearm, knees down and stacked. Lift your hips into one line and hold. Half the time on each side.',
  'prog-core-full-plank':
    'Forearms down, legs long, body in one line from head to heels. Hold steady, breathing the whole way.',
  'prog-core-side-plank-knees':
    'Side plank from your knees: hips lifted, body in one line. Hold, then swap sides.',
  'prog-core-full-side-plank':
    'On one forearm with your feet stacked, hips lifted into one long line. Hold steady. Half the time on each side.',
  'prog-core-plank-shoulder-taps':
    'In a plank, lift one hand to tap the opposite shoulder, keeping your hips as still as you can. Swap hands each rep.',
  'prog-core-suitcase-carry':
    'Hold your backpack or weight in one hand like a suitcase. Walk tall and steady without leaning. Half the time in each hand.',
  'prog-core-front-hug-carry':
    'Hug the backpack to your chest and walk tall and steady, breathing easily.',
  'prog-core-heavy-carry':
    'The heavier carry: grip firm, shoulders back, walk tall and steady. Set it down with control when the time is up.',
  'prog-core-pallof-press':
    'Band anchored at chest height, standing side-on. Press your hands straight out and resist the twist, then return. Half the count on each side.',

  // ---- power finisher (quiet track) ----------------------------------------
  'prog-finisher-heel-drops':
    'Rise up onto your toes, then let your heels drop down with a firm, springy landing. Light knees, tall posture.',
  'prog-finisher-moderate-stomps':
    'Give the floor a firm stamp — one foot, then the other. Strong and springy, like squashing a can.',
  'prog-finisher-explosive-sit-to-stands':
    'From the chair: stand up as fast as you can, then sit back down with control. Every rep quick and strong.',
  'prog-finisher-fast-step-ups':
    'Quick step-ups: up fast, down with control. Full count one leg, then swap.',
  'prog-finisher-counter-push-offs':
    'Lean into the counter and push away fast, catching yourself softly. Quick and springy.',
  'prog-finisher-power-march':
    'March on the spot with purpose — knees up, arms driving, strong and steady to the finish.',
};
