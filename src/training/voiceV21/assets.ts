import {
  allTrainingVoiceLogicalCuesV21,
  TRAINING_VOICE_EXERCISE_CONTRACTS_V21,
  TRAINING_VOICE_SHARED_LOGICAL_CUES_V21,
} from './contracts';
import type {
  TrainingVoiceAssetRequirementV21,
  TrainingVoiceAssetStatusV21,
  TrainingVoiceExerciseContractV21,
  TrainingVoiceImplementationRequirementId,
  TrainingVoiceLogicalCueV21,
  TrainingVoiceSafetyFamilyV21,
} from './types';

interface PhysicalCandidate {
  readonly key: string;
  readonly script: string;
  readonly existsForBothVoices: boolean;
  readonly semanticMatch: boolean;
}

const EXACT_EXISTING_PHYSICAL_CANDIDATES: Readonly<Record<string, PhysicalCandidate>> = {
  'final-position-set-v21': exact('final-position-set-v21', "You're set."),
  'tracking-loss-v21': exact('tracking-loss-v21', 'Pause. Return to the setup position.'),
  'tracking-recovered-v21': exact('tracking-recovered-v21', "You're back in position. We'll restart."),
  'retry-v21': exact('retry-v21', "Let's try that again."),
  'times-up-v21': exact('times-up-v21', 'Time.'),
  'item-complete-v21': exact('item-complete-v21', 'Complete.'),
  'countdown-three': exact('countdown-three', 'Three.'),
  'countdown-two': exact('countdown-two', 'Two.'),
  'countdown-one': exact('countdown-one', 'One.'),
  go: exact('go', 'Go!'),
};

const MISMATCH_PHYSICAL_CANDIDATES: Readonly<Record<string, PhysicalCandidate>> = {
  'training-intro-v21': mismatch(
    'training-intro',
    "Time to train. We'll move through a few exercises together. Just follow my voice - you won't need to touch the screen. Let's begin."
  ),
  'setup-enter-view-v21': mismatch('step-into-frame', 'Step into view, about three big steps back from the phone.'),
  'setup-center-v21': mismatch('center-yourself', 'Move toward the middle of the picture.'),
  'setup-back-v21': mismatch('step-back', 'Take a small step back.'),
  'setup-closer-v21': mismatch('step-closer', 'Take a small step closer.'),
  'setup-hold-still-v21': mismatch('hold-still', 'Great. Hold still for a moment.'),
  'setup-light-v21': mismatch('turn-on-light', "It's a little dark in here. Please turn on the main light."),
  'training-skip-v21': mismatch('exercise-skipped', "No problem - we'll skip this one for now and move on."),
  'set-complete-v21': mismatch('set-done', 'Good set.'),
  'rest-now-v21': mismatch('rest-now', 'Nice work. Take a rest.'),
  'last-set-v21': mismatch('last-set', 'Rest up. This is your last set.'),
  'next-exercise-v21': mismatch('next-up', "Let's set up the next exercise."),
  'session-complete-v21': mismatch('session-complete', "That's your session - really well done. Have some water and enjoy your day."),
  'equip-chair-stable-v21': mismatch('chair_use_sturdy_chair', 'Use a sturdy chair that will not slide or tip.'),
  'equip-support-close-v21': mismatch('support_keep_support_within_reach', 'Keep support within easy reach throughout the set.'),
  'equip-balance-support-v21': mismatch(
    'balance_support_within_reach',
    'Keep a counter, wall, or sturdy chair within reach for balance work.'
  ),
  'equip-step-stable-v21': mismatch(
    'step_use_low_stable_step+step_fixed_support_nearby',
    'Use only the lowest stable bottom stair or step. Keep fixed support, such as a rail, wall, or counter, within reach.'
  ),
  'equip-long-band-v21': mismatch(
    'band_inspect_before_use+band_face_and_eyes_clear',
    'Inspect the band first, and do not use it if it is worn, cracked, or damaged. Keep the band path away from your face and eyes.'
  ),
  'equip-door-anchor-v21': mismatch(
    'door_anchor_fully_closed+door_anchor_test_light_tension',
    'Use a fully closed, secure door before adding tension. Test the anchor with light tension before the set starts.'
  ),
  'equip-floor-transition-v21': mismatch(
    'floor_slow_transition',
    'Move slowly when changing between standing and the floor.'
  ),
};

const SAFETY_FAMILY_BY_LOGICAL_CUE_KEY: Readonly<Record<string, TrainingVoiceSafetyFamilyV21>> = {
  'equip-chair-stable-v21': 'chair_seat',
  'equip-support-close-v21': 'generic_support',
  'equip-balance-support-v21': 'balance_support',
  'equip-step-stable-v21': 'step_or_stair',
  'equip-long-band-v21': 'long_band_handheld_or_foot_anchored',
  'equip-door-anchor-v21': 'door_anchor_band',
  'equip-floor-transition-v21': 'floor_eligible_user',
};

export function listTrainingVoiceAssetRequirementsV21(): TrainingVoiceAssetRequirementV21[] {
  const usage = cueUsage();
  return allTrainingVoiceLogicalCuesV21()
    .map((cue) => assetRequirementFor(cue, usage.get(cue.key)))
    .sort((a, b) => a.logicalCueKey.localeCompare(b.logicalCueKey));
}

export function assetRequirementForCueKeyV21(logicalCueKey: string): TrainingVoiceAssetRequirementV21 | null {
  return listTrainingVoiceAssetRequirementsV21().find((row) => row.logicalCueKey === logicalCueKey) ?? null;
}

export function requiredAssetCueKeysMissingForContractV21(contract: TrainingVoiceExerciseContractV21): string[] {
  const relevant = contractCueKeys(contract);
  const rows = listTrainingVoiceAssetRequirementsV21().filter((row) => relevant.includes(row.logicalCueKey));
  return rows
    .filter((row) => row.requiredForVoiceFirst && row.status !== 'exact_existing_pair')
    .map((row) => row.logicalCueKey);
}

function assetRequirementFor(
  cue: TrainingVoiceLogicalCueV21,
  usage?: CueUsage
): TrainingVoiceAssetRequirementV21 {
  const candidate = EXACT_EXISTING_PHYSICAL_CANDIDATES[cue.key] ?? MISMATCH_PHYSICAL_CANDIDATES[cue.key] ?? null;
  const status = assetStatusFor(candidate);
  return {
    logicalCueKey: cue.key,
    exactScript: cue.exactScript,
    category: cue.category,
    policyId: cue.policyId,
    exerciseIds: usage?.exerciseIds ?? [],
    usageRole: usage?.usageRoles.join(';') ?? 'shared',
    safetyFamily: SAFETY_FAMILY_BY_LOGICAL_CUE_KEY[cue.key] ?? null,
    sideVariant: usage?.sideVariants.join(';') ?? '',
    currentCandidateKey: candidate?.key ?? null,
    currentCandidateScript: candidate?.script ?? null,
    claraStatus: candidate?.existsForBothVoices ? 'exists' : 'missing',
    marcusStatus: candidate?.existsForBothVoices ? 'exists' : 'missing',
    semanticMatch: candidate?.semanticMatch ?? false,
    reuseDecision:
      status === 'exact_existing_pair'
        ? 'reuse_exact_existing_pair'
        : status === 'existing_pair_script_mismatch'
          ? 'existing_pair_script_mismatch'
          : 'new_pair_required',
    generationRequiredLater: status !== 'exact_existing_pair',
    requiredForVoiceFirst: cue.requiredForVoiceFirst,
    budgetClass: budgetClassFor(cue),
    implementationBlockers: usage?.implementationBlockers ?? [],
    status,
    notes:
      status === 'exact_existing_pair'
        ? 'Exact Clara/Marcus pair exists in the current physical manifest.'
        : candidate
          ? 'A physical candidate exists, but V2.1 requires a separate exact logical cue.'
          : 'No current physical pair exists for this logical Training Voice V2.1 cue.',
  };
}

interface CueUsage {
  readonly exerciseIds: readonly string[];
  readonly usageRoles: readonly string[];
  readonly sideVariants: readonly string[];
  readonly implementationBlockers: readonly TrainingVoiceImplementationRequirementId[];
}

function cueUsage(): Map<string, CueUsage> {
  const draft = new Map<string, {
    exerciseIds: Set<string>;
    usageRoles: Set<string>;
    sideVariants: Set<string>;
    implementationBlockers: Set<TrainingVoiceImplementationRequirementId>;
  }>();
  const touch = (
    key: string,
    exerciseId: string,
    role: string,
    blockers: readonly TrainingVoiceImplementationRequirementId[],
    sideVariant = ''
  ) => {
    const item = draft.get(key) ?? {
      exerciseIds: new Set<string>(),
      usageRoles: new Set<string>(),
      sideVariants: new Set<string>(),
      implementationBlockers: new Set<TrainingVoiceImplementationRequirementId>(),
    };
    item.exerciseIds.add(exerciseId);
    item.usageRoles.add(role);
    if (sideVariant) item.sideVariants.add(sideVariant);
    for (const blocker of blockers) item.implementationBlockers.add(blocker);
    draft.set(key, item);
  };

  for (const shared of TRAINING_VOICE_SHARED_LOGICAL_CUES_V21) {
    touch(shared.key, 'session', 'shared', []);
  }
  for (const contract of TRAINING_VOICE_EXERCISE_CONTRACTS_V21) {
    touch(contract.firstUseCue.key, contract.exerciseId, 'first_use', contract.implementationRequirements);
    touch(contract.laterSetCue.key, contract.exerciseId, 'later_set', contract.implementationRequirements);
    touch(contract.targetCue.key, contract.exerciseId, 'target', contract.implementationRequirements);
    if (contract.finalPositionRequired) {
      touch('final-position-set-v21', contract.exerciseId, 'final_position', contract.implementationRequirements);
    }
    if (contract.safetyPlan.cue) {
      touch(contract.safetyPlan.cue.key, contract.exerciseId, 'equipment_first_use', contract.implementationRequirements);
    }
    for (const progressCue of contract.progressPlan.cues) {
      touch(progressCue.cue.key, contract.exerciseId, 'progress', contract.implementationRequirements);
    }
    if (contract.sidePlan.switchCue) {
      touch(contract.sidePlan.switchCue.key, contract.exerciseId, 'side_switch', contract.implementationRequirements);
    }
    for (const variant of contract.sidePlan.variants) {
      touch(variant.cue.key, contract.exerciseId, 'side_setup', contract.implementationRequirements, variant.variantId);
    }
  }

  return new Map(
    [...draft.entries()].map(([key, value]) => [
      key,
      {
        exerciseIds: [...value.exerciseIds].sort(),
        usageRoles: [...value.usageRoles].sort(),
        sideVariants: [...value.sideVariants].sort(),
        implementationBlockers: [...value.implementationBlockers].sort(),
      },
    ])
  );
}

function contractCueKeys(contract: TrainingVoiceExerciseContractV21): string[] {
  return [
    contract.firstUseCue.key,
    contract.laterSetCue.key,
    contract.targetCue.key,
    ...(contract.finalPositionRequired ? ['final-position-set-v21'] : []),
    ...(contract.safetyPlan.cue ? [contract.safetyPlan.cue.key] : []),
    ...(contract.sidePlan.switchCue ? [contract.sidePlan.switchCue.key] : []),
    ...contract.sidePlan.variants.map((variant) => variant.cue.key),
  ];
}

function budgetClassFor(cue: TrainingVoiceLogicalCueV21): string {
  if (cue.category === 'exercise_later_set') return 'later_set_reminder';
  if (cue.category === 'exercise_first_use' || cue.category === 'equipment_first_use') return 'ordinary_first_use_pre_countdown';
  if (cue.category === 'session_intro' || cue.category === 'universal_safety') return 'training_intro_universal_safety';
  if (cue.category === 'control' || cue.category === 'completion' || cue.category === 'rest_transition') return 'control_confirmation';
  if (cue.category === 'recovery') return 'tracking_loss_recovery_sequence';
  if (cue.category === 'progress') return 'active_progress';
  return 'shared';
}

function assetStatusFor(candidate: PhysicalCandidate | null): TrainingVoiceAssetStatusV21 {
  if (!candidate) return 'new_pair_required';
  return candidate.semanticMatch ? 'exact_existing_pair' : 'existing_pair_script_mismatch';
}

function exact(key: string, script: string): PhysicalCandidate {
  return { key, script, existsForBothVoices: true, semanticMatch: true };
}

function mismatch(key: string, script: string): PhysicalCandidate {
  return { key, script, existsForBothVoices: true, semanticMatch: false };
}
