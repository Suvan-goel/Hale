import * as fs from 'fs';
import * as path from 'path';

import { listExercises } from '../../exercises';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  CHAIR_RISE_V2_ID,
  HINGE_REACH_ID,
  ONE_LEG_BALANCE_V2_ID,
} from '../../movements';
import {
  CONTROLLED_BETA_CHECKUP_PROTOCOL_IDS,
  CONTROLLED_BETA_MICRO_CHECK_TYPES,
  getMicroCheckInstructionProfile,
  instructionCueIds,
  listCheckUpInstructionProfiles,
  listMicroCheckInstructionProfiles,
  listTrainingInstructionProfiles,
  movementProfileV2InstructionCueIdsForStage,
  movementProfileV2InstructionTextForStage,
  protocolIdForMovementProfileV2Stage,
  visibleInstructionText,
} from '../instructionProfiles';

const FORBIDDEN_PUBLIC_COPY = [
  'Movement Age',
  'body age',
  'strength age',
  'weakest',
  'diagnosis',
  'fall risk',
  'sarcopenia',
  'pass/fail',
  'improved',
  'declined',
  'better',
  'worse',
  'younger',
  'older',
  'Warden',
  'LMS',
  'centile',
  'schema',
  'fingerprint',
  'V1',
  'V2',
  'internal',
  'medical advice',
  'guarantee',
] as const;

describe('canonical instruction profiles', () => {
  it('covers every registered training exercise with first, repeat, help, and visible copy', () => {
    const exercises = listExercises();
    const profiles = listTrainingInstructionProfiles();
    expect(exercises).toHaveLength(37);
    expect(profiles).toHaveLength(exercises.length);
    expect(new Set(profiles.map((profile) => profile.exerciseId))).toEqual(
      new Set(exercises.map((exercise) => exercise.id))
    );

    for (const profile of profiles) {
      expect(profile.kind).toBe('training_exercise');
      expect(profile.schemaVersion).toBe(1);
      expect(profile.firstTime.text.trim()).not.toHaveLength(0);
      expect(profile.repeat.text.trim()).not.toHaveLength(0);
      expect(profile.help.text.trim()).not.toHaveLength(0);
      expect(instructionCueIds(profile.firstTime)).not.toHaveLength(0);
      expect(instructionCueIds(profile.repeat)).not.toHaveLength(0);
      expect(instructionCueIds(profile.help)).not.toHaveLength(0);
      expect(visibleInstructionText(profile)).toMatch(/\w/);
    }
  });

  it('covers the four controlled-beta Movement Check-Up protocols', () => {
    const profiles = listCheckUpInstructionProfiles();
    expect(CONTROLLED_BETA_CHECKUP_PROTOCOL_IDS).toEqual([
      CHAIR_RISE_V2_ID,
      ONE_LEG_BALANCE_V2_ID,
      ACTIVE_SHOULDER_REACH_V2_ID,
      HINGE_REACH_ID,
    ]);
    expect(profiles.map((profile) => profile.protocolId)).toEqual(CONTROLLED_BETA_CHECKUP_PROTOCOL_IDS);
    expect(protocolIdForMovementProfileV2Stage('chair_setup')).toBe(CHAIR_RISE_V2_ID);
    expect(protocolIdForMovementProfileV2Stage('balance_ready')).toBe(ONE_LEG_BALANCE_V2_ID);
    expect(protocolIdForMovementProfileV2Stage('shoulder_ready')).toBe(ACTIVE_SHOULDER_REACH_V2_ID);
    expect(protocolIdForMovementProfileV2Stage('hinge_setup')).toBe(HINGE_REACH_ID);
    expect(movementProfileV2InstructionCueIdsForStage({ stage: 'shoulder_ready', selectedShoulder: 'left' })).toEqual([
      'checkup-shoulder-turn-left-v21',
      'checkup-shoulder-raise-left-v21',
    ]);
    expect(movementProfileV2InstructionCueIdsForStage({ stage: 'hinge_setup' })).toEqual([
      'checkup-hinge-setup-v21',
      'hinge-setup',
    ]);
    expect(movementProfileV2InstructionTextForStage('hinge_setup')).toMatch(/reach your hands toward the floor/i);
  });

  it('covers the three micro-check types with side-specific help cues where needed', () => {
    expect(CONTROLLED_BETA_MICRO_CHECK_TYPES).toEqual([
      'chair-power',
      'single-leg-balance',
      'mobility-reach',
    ]);
    expect(listMicroCheckInstructionProfiles().map((profile) => profile.protocolId)).toEqual(
      CONTROLLED_BETA_MICRO_CHECK_TYPES
    );
    expect(instructionCueIds(getMicroCheckInstructionProfile('single-leg-balance', 'right')!.help)).toEqual([
      'micro-single-leg-right-v21',
    ]);
    expect(instructionCueIds(getMicroCheckInstructionProfile('mobility-reach')!.help)).toEqual([
      'micro-mobility-left-v21',
    ]);
  });

  it('keeps forbidden public copy out of spoken and visible instruction text', () => {
    const publicText = [
      ...listTrainingInstructionProfiles(),
      ...listCheckUpInstructionProfiles(),
      ...listMicroCheckInstructionProfiles(),
    ].flatMap((profile) => [
      profile.displayName,
      profile.firstTime.text,
      profile.repeat.text,
      profile.help.text,
      profile.visibleSetupText,
      profile.visibleExecutionText,
    ]);
    for (const text of publicText) {
      for (const forbidden of FORBIDDEN_PUBLIC_COPY) {
        expect(text).not.toMatch(new RegExp(`\\b${escapeRegExp(forbidden)}\\b`, 'i'));
      }
    }
  });

  it('does not import runtime services, backends, media APIs, or env access', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'instructionProfiles.ts'), 'utf8');
    expect(source).not.toMatch(/process\.env|VoiceChannel|PosePipeline|SafePoseDetectionView|supabase|ElevenLabs|FileSystem/);
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
