import * as fs from 'fs';
import * as path from 'path';

import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  CHAIR_RISE_V2_ID,
  HINGE_REACH_ID,
  ONE_LEG_BALANCE_V2_ID,
} from '../../movements';
import {
  CONTROLLED_BETA_CHECKUP_PROTOCOL_IDS,
  instructionCueIds,
  listCheckUpInstructionProfiles,
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
    // The frame check borrows the FIRST battery item's intro: chair in the
    // default battery, balance in the hosted balance-first check-up.
    expect(protocolIdForMovementProfileV2Stage('standing_frame_check')).toBe(CHAIR_RISE_V2_ID);
    expect(protocolIdForMovementProfileV2Stage('standing_frame_check', 'balance')).toBe(ONE_LEG_BALANCE_V2_ID);
    expect(
      movementProfileV2InstructionCueIdsForStage({ stage: 'standing_frame_check', firstBatteryMovement: 'balance' })
    ).toEqual(['checkup-balance-intro-v21', 'checkup-balance-single-leg-v21']);
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

  it('keeps forbidden public copy out of spoken and visible instruction text', () => {
    const publicText = [
      ...listCheckUpInstructionProfiles(),
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
