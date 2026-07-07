/**
 * Bridge catalogue guardrails: every exercise id a generated plan can name
 * resolves to a valid voice-only definition, every instruction cue has a
 * script line, and the camera can never enter through this door.
 */

import { PROGRAMME_LADDERS, QUIET_FINISHER_ITEMS } from '../ladders';
import { hasProgrammeDisplayName } from '../naming';
import type { ProgrammePattern } from '../types';
import {
  allProgrammeVoiceExerciseIds,
  PROGRAMME_PREP_ITEM_ID,
  programmeVoiceExerciseDefinition,
  programmeVoiceSafetyProfile,
  withSupportCues,
} from '../voiceCatalog';
import { PROGRAMME_VOICE_LINES, programmeInstructionCueKey } from '../voiceScripts';

describe('programme voice catalogue', () => {
  const allIds = allProgrammeVoiceExerciseIds();

  it('covers every level exercise, occasional variation, no-stairs alternate, finisher, and the prep item', () => {
    for (const pattern of Object.keys(PROGRAMME_LADDERS) as ProgrammePattern[]) {
      for (const level of PROGRAMME_LADDERS[pattern].levels) {
        expect(allIds).toContain(level.primary.id);
        expect(allIds).toContain(level.variation.id);
        if (level.occasionalVariation) expect(allIds).toContain(level.occasionalVariation.id);
        for (const exercise of [level.primary, level.variation]) {
          if (exercise.noStairsAlternativeId) expect(allIds).toContain(exercise.noStairsAlternativeId);
        }
      }
    }
    for (const item of QUIET_FINISHER_ITEMS) expect(allIds).toContain(item.id);
    expect(allIds).toContain(PROGRAMME_PREP_ITEM_ID);
  });

  it('resolves every id to a voice-only definition whose grader is unreachable', () => {
    for (const id of allIds) {
      const definition = programmeVoiceExerciseDefinition(id);
      expect(definition.id).toBe(id);
      expect(definition.cameraView.view).toBe('not_required');
      expect(definition.displayName.trim()).not.toHaveLength(0);
      expect(definition.prescription.sets).toBeGreaterThan(0);
      expect(() => definition.createGrader()).toThrow(/voice-only/);
    }
  });

  it('maps scheme kinds onto set kinds (reps stay "done"-gated, timed run on the clock)', () => {
    for (const pattern of Object.keys(PROGRAMME_LADDERS) as ProgrammePattern[]) {
      for (const level of PROGRAMME_LADDERS[pattern].levels) {
        const definition = programmeVoiceExerciseDefinition(level.primary.id);
        const expected =
          level.scheme.kind === 'reps' || level.scheme.kind === 'reps_per_side' ? 'reps' : 'timer';
        expect(definition.kind).toBe(expected);
      }
    }
  });

  it('appends the power-intent line exactly where the spec cues it', () => {
    for (const pattern of Object.keys(PROGRAMME_LADDERS) as ProgrammePattern[]) {
      for (const level of PROGRAMME_LADDERS[pattern].levels) {
        const cues = programmeVoiceExerciseDefinition(level.primary.id).voice.instructions;
        expect(cues.includes('prog-power-intent')).toBe(level.powerIntentCue === true);
      }
    }
  });

  it('rejects unknown ids at construction, like the registry does', () => {
    expect(() => programmeVoiceExerciseDefinition('squat.made_up')).toThrow(/unknown/);
  });

  it('has a script line for every instruction cue, and no orphaned lines', () => {
    // Session-flow cues spoken outside definition instructions.
    const referenced = new Set<string>(['prog-power-intent', 'prog-bonus-set-offer']);
    for (const id of allIds) {
      for (const cue of programmeVoiceExerciseDefinition(id).voice.instructions) {
        referenced.add(cue);
        expect(PROGRAMME_VOICE_LINES[cue]).toBeTruthy();
        expect(PROGRAMME_VOICE_LINES[cue].trim().length).toBeGreaterThan(20);
      }
    }
    for (const key of Object.keys(PROGRAMME_VOICE_LINES)) {
      expect(referenced.has(key)).toBe(true);
    }
  });

  it('uses the plain-language naming layer for every plan-reachable display name', () => {
    for (const id of allIds) {
      if (id === PROGRAMME_PREP_ITEM_ID) continue;
      expect(hasProgrammeDisplayName(id)).toBe(true);
    }
  });

  it('composes safety profiles from equipment (no camera/tracking cues, recovery empty)', () => {
    for (const id of allIds) {
      const profile = programmeVoiceSafetyProfile(id);
      expect(profile.recoveryCueIds).toHaveLength(0);
      for (const cue of [...profile.setupCueIds, ...profile.activeCueIds]) {
        expect(cue.startsWith('tracking_')).toBe(false);
        expect(cue.startsWith('global_')).toBe(false);
      }
      expect(profile.activeCueIds).toContain('comfortable_range_only');
    }
    const stairs = programmeVoiceSafetyProfile('squat.low_step_up');
    expect(stairs.setupCueIds).toContain('step_use_low_stable_step');
    const floor = programmeVoiceSafetyProfile('hinge.glute_bridge');
    expect(floor.setupCueIds).toContain('floor_clear_space');
    const band = programmeVoiceSafetyProfile('pull.seated_band_row');
    expect(band.setupCueIds).toContain('band_inspect_before_use');
  });

  it('support-variant add-on layers balance cues without disturbing the base', () => {
    const base = programmeVoiceSafetyProfile('squat.supported_split_squat');
    const withSupport = withSupportCues(base);
    expect(withSupport.activeCueIds).toContain('balance_support_within_reach');
    for (const cue of base.activeCueIds) expect(withSupport.activeCueIds).toContain(cue);
  });

  it('cue keys are deterministic and collision-free across the catalogue', () => {
    const keys = allIds.map((id) => programmeInstructionCueKey(id));
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^prog-[a-z0-9-]+$/);
  });
});
