import type { BodySide } from '../../checkup';
import { VOICE_V2_1_AUDIO_ASSET_METADATA } from '../../audio/voiceV21AudioManifest';
import {
  MICRO_CHECK_VOICE_SHARED_LOGICAL_CUES_V21,
  allMicroCheckVoiceLogicalCuesV21,
  listMicroCheckVoiceContractsV21,
} from './contracts';
import type {
  MicroCheckTypeV21,
  MicroCheckVoiceAssetRequirementV21,
  MicroCheckVoiceAssetReuseDecisionV21,
  MicroCheckVoiceContractV21,
  MicroCheckVoiceLogicalCueKeyV21,
  MicroCheckVoiceLogicalCueV21,
} from './types';

interface PhysicalCandidate {
  readonly key: string;
  readonly script: string;
  readonly existsForBothVoices: boolean;
  readonly semanticMatch: boolean;
}

const EXACT_EXISTING_PHYSICAL_CANDIDATES: Readonly<Record<string, PhysicalCandidate>> = {
  'final-position-set-v21': exact('final-position-set-v21', "You're set."),
  'countdown-three': exact('countdown-three', 'Three.'),
  'countdown-two': exact('countdown-two', 'Two.'),
  'countdown-one': exact('countdown-one', 'One.'),
  go: exact('go', 'Go!'),
  'times-up-v21': exact('times-up-v21', 'Time.'),
  'tracking-loss-v21': exact('tracking-loss-v21', 'Pause. Return to the setup position.'),
  'tracking-recovered-v21': exact('tracking-recovered-v21', "You're back in position. We'll restart."),
  'retry-v21': exact('retry-v21', "Let's try that again."),
};

const MISMATCH_PHYSICAL_CANDIDATES: Readonly<Record<string, PhysicalCandidate>> = {
  'micro-chair-power-v21': mismatch(
    'microcheck-chair',
    'Power check: five fast chair stands. Cross your arms, stand fully, and sit with control.'
  ),
  'micro-single-leg-left-v21': mismatch(
    'microcheck-balance',
    'Balance check: stand on one leg with a counter or wall nearby. Hold steady as long as you can.'
  ),
  'micro-single-leg-right-v21': mismatch(
    'microcheck-balance',
    'Balance check: stand on one leg with a counter or wall nearby. Hold steady as long as you can.'
  ),
  'micro-mobility-left-v21': mismatch(
    'ex-hamstring-reach',
    'Sit tall with one leg long and reach gently toward your toes. Stay in a comfortable range.'
  ),
  'micro-mobility-right-v21': mismatch(
    'ex-hamstring-reach',
    'Sit tall with one leg long and reach gently toward your toes. Stay in a comfortable range.'
  ),
  'micro-relax-v21': mismatch('relax-arm', 'Lovely. Lower your arm and relax.'),
  'microcheck-complete-v21': mismatch('microcheck-complete', "Got it - that's logged. Nice work."),
};

const SHARED_TYPES: readonly MicroCheckTypeV21[] = ['chair-power', 'single-leg-balance', 'mobility-reach'];
const REQUIRED_GENERATED_VOICE_IDS = ['clara', 'marcus'] as const;

export function listMicroCheckVoiceAssetRequirementsV21(): MicroCheckVoiceAssetRequirementV21[] {
  const usage = cueUsage();
  return allMicroCheckVoiceLogicalCuesV21()
    .map((cue) => assetRequirementForCue(cue, usage.get(cue.key)))
    .sort((a, b) => a.logicalCueKey.localeCompare(b.logicalCueKey));
}

export function assetRequirementForMicroCheckCueV21(
  cueKey: MicroCheckVoiceLogicalCueKeyV21
): MicroCheckVoiceAssetRequirementV21 | null {
  return listMicroCheckVoiceAssetRequirementsV21().find((row) => row.logicalCueKey === cueKey) ?? null;
}

export function requiredAssetCueKeysMissingForMicroCheckContractV21(
  contract: MicroCheckVoiceContractV21
): MicroCheckVoiceLogicalCueKeyV21[] {
  const relevant = contractCueKeys(contract);
  return listMicroCheckVoiceAssetRequirementsV21()
    .filter((row) => relevant.includes(row.logicalCueKey))
    .filter((row) => row.requiredness !== 'optional' && row.reuseDecision !== 'reuse_exact_existing_pair')
    .map((row) => row.logicalCueKey);
}

function assetRequirementForCue(
  cue: MicroCheckVoiceLogicalCueV21,
  usage?: CueUsage
): MicroCheckVoiceAssetRequirementV21 {
  const candidate =
    generatedExactCandidate(cue.key, cue.exactScript) ??
    EXACT_EXISTING_PHYSICAL_CANDIDATES[cue.key] ??
    MISMATCH_PHYSICAL_CANDIDATES[cue.key] ??
    null;
  const reuseDecision = reuseDecisionFor(candidate);
  return {
    logicalCueKey: cue.key,
    exactScript: cue.exactScript,
    category: cue.category,
    policyId: cue.policyId,
    requiredness: cue.requiredForVoiceFirst ? 'required' : 'optional',
    microCheckTypes: usage?.types ?? (MICRO_CHECK_VOICE_SHARED_LOGICAL_CUES_V21.some((shared) => shared.key === cue.key) ? SHARED_TYPES : []),
    sideVariant: usage?.sideVariant ?? 'shared',
    currentCandidateKey: candidate?.key ?? null,
    currentCandidateScript: candidate?.script ?? null,
    claraExists: candidate?.existsForBothVoices ?? false,
    marcusExists: candidate?.existsForBothVoices ?? false,
    semanticMatch: candidate?.semanticMatch ?? false,
    reuseDecision,
    generationRequiredLater: reuseDecision !== 'reuse_exact_existing_pair' && reuseDecision !== 'not_required',
    budgetClass: budgetClassFor(cue),
    notes:
      reuseDecision === 'reuse_exact_existing_pair'
        ? 'Exact Clara/Marcus physical pair exists in the current bundled corpus.'
        : candidate
          ? 'A legacy physical candidate exists, but V2.1 requires a separate exact logical cue.'
          : 'No current physical pair exists for this logical Micro-Check Voice V2.1 cue.',
  };
}

interface CueUsage {
  readonly types: readonly MicroCheckTypeV21[];
  readonly sideVariant: BodySide | 'none' | 'shared';
}

function cueUsage(): Map<MicroCheckVoiceLogicalCueKeyV21, CueUsage> {
  const map = new Map<MicroCheckVoiceLogicalCueKeyV21, CueUsage>();
  for (const contract of listMicroCheckVoiceContractsV21()) {
    map.set(contract.setupCueKey, {
      types: [contract.type],
      sideVariant: sideVariantForSetupCue(contract.setupCueKey),
    });
    for (const key of contractCueKeys(contract)) {
      if (map.has(key)) continue;
      map.set(key, { types: [contract.type], sideVariant: 'shared' });
    }
  }
  for (const shared of MICRO_CHECK_VOICE_SHARED_LOGICAL_CUES_V21) {
    map.set(shared.key, { types: SHARED_TYPES, sideVariant: 'shared' });
  }
  return map;
}

function contractCueKeys(contract: MicroCheckVoiceContractV21): MicroCheckVoiceLogicalCueKeyV21[] {
  return [
    contract.setupCueKey,
    'final-position-set-v21',
    'countdown-three',
    'countdown-two',
    'countdown-one',
    'go',
    ...(contract.stopCueKey ? [contract.stopCueKey] : []),
    contract.completionCueKey,
    'paused-v21',
    'resuming-v21',
    'retry-v21',
    'micro-discard-v21',
    'tracking-loss-v21',
    'tracking-recovered-v21',
  ];
}

function sideVariantForSetupCue(
  key: MicroCheckVoiceLogicalCueKeyV21
): BodySide | 'none' | 'shared' {
  if (key.includes('-left-')) return 'left';
  if (key.includes('-right-')) return 'right';
  if (key === 'micro-chair-power-v21') return 'none';
  return 'shared';
}

function budgetClassFor(cue: MicroCheckVoiceLogicalCueV21): string {
  if (cue.category === 'micro_instruction' || cue.category === 'final_position') return 'micro_check_setup';
  if (cue.category === 'control' || cue.category === 'completion' || cue.category === 'active_stop') return 'control_confirmation';
  if (cue.key === 'tracking-loss-v21') return 'tracking_loss';
  if (cue.key === 'tracking-recovered-v21') return 'tracking_recovery';
  if (cue.category === 'countdown') return 'countdown';
  return 'shared';
}

function reuseDecisionFor(candidate: PhysicalCandidate | null): MicroCheckVoiceAssetReuseDecisionV21 {
  if (!candidate) return 'new_pair_required';
  return candidate.semanticMatch ? 'reuse_exact_existing_pair' : 'existing_pair_script_mismatch';
}

function exact(key: string, script: string): PhysicalCandidate {
  return { key, script, existsForBothVoices: true, semanticMatch: true };
}

function mismatch(key: string, script: string): PhysicalCandidate {
  return { key, script, existsForBothVoices: true, semanticMatch: false };
}

function generatedExactCandidate(key: MicroCheckVoiceLogicalCueKeyV21, script: string): PhysicalCandidate | null {
  const hasExactGeneratedPair = REQUIRED_GENERATED_VOICE_IDS.every((voiceId) => {
    const metadata = VOICE_V2_1_AUDIO_ASSET_METADATA[voiceId]?.[key];
    return (
      metadata?.logicalCueKey === key &&
      metadata.physicalCueKey === key &&
      metadata.script === script &&
      metadata.path === `assets/audio/voice/${voiceId}/${key}.mp3`
    );
  });
  return hasExactGeneratedPair ? exact(key, script) : null;
}
