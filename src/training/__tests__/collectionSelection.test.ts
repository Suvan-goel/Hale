import {
  HAMSTRING_REACH_ID,
  HIP_FLEXOR_STRETCH_ID,
  NECK_ROTATION_ID,
  THORACIC_ROTATION_ID,
  WALL_CALF_STRETCH_ID,
} from '../../exercises';
import { normalizeMovementCapabilityProfile } from '../../profile';
import type { PersistedGeneratedSessionSummary } from '../dynamicState';
import type { DiscomfortConstraint } from '../dailyTrainingContext';
import {
  MOBILITY_COLLECTION_CORE_MEMBER_IDS,
  MOBILITY_COLLECTION_ID,
  PRESET_COLLECTION_EXPOSURE_SCOPE_ID,
  collectionCoverageSummary,
  collectionExposuresFromGeneratedSessionSummaries,
  eligibleCollectionMemberIds,
  presetCollectionExposuresFromGeneratedSessionSummaries,
  selectCollectionMember,
  type CollectionExposure,
} from '../collectionSelection';

const BLOCK_ID = 'block-mobility';
const CONFIRMED_CAPABILITIES = normalizeMovementCapabilityProfile({
  schemaVersion: 1,
  floorTransfer: { status: 'confirmed' as const },
  stepUpEnvironment: {
    status: 'confirmed' as const,
    lowStableStep: true,
    fixedSupport: true,
    clearDryArea: true,
    phoneOutOfPath: true,
  },
  singleLegBalance: { status: 'confirmed_with_support' as const },
  revision: 1,
  updatedAt: '2026-06-01T08:00:00.000Z',
}, { source: 'local_user' });

const NO_DISCOMFORT: DiscomfortConstraint = {
  blockedStimulusKinds: [],
  blockedLadderIds: [],
  blockedExerciseIds: [],
  reasonCodes: [],
};

describe('collectionSelection', () => {
  it('derives the controlled-beta mobility collection members and excludes hidden neck rotation', () => {
    const eligible = eligibleCollectionMemberIds(baseInput());

    expect(eligible).toEqual([
      HAMSTRING_REACH_ID,
      THORACIC_ROTATION_ID,
      HIP_FLEXOR_STRETCH_ID,
      WALL_CALF_STRETCH_ID,
    ]);
    expect(eligible).not.toContain(NECK_ROTATION_ID);
    expect(MOBILITY_COLLECTION_CORE_MEMBER_IDS).toHaveLength(4);
  });

  it('rejects invalid collections without falling back to hidden members', () => {
    expect(selectCollectionMember({ ...baseInput(), collectionId: 'shoulder-reach-press', blockId: BLOCK_ID })).toEqual({
      available: false,
      reason: 'invalid_collection',
    });
  });

  it('selects never-practised eligible members in canonical order', () => {
    const first = selectCollectionMember({ ...baseInput(), blockId: BLOCK_ID });
    const second = selectCollectionMember({
      ...baseInput(),
      blockId: BLOCK_ID,
      exposures: [exposure(HAMSTRING_REACH_ID, '2026-06-01')],
    });

    expect(first).toMatchObject({
      available: true,
      selectedExerciseId: HAMSTRING_REACH_ID,
      reason: 'never_practised_first',
    });
    expect(second).toMatchObject({
      available: true,
      selectedExerciseId: THORACIC_ROTATION_ID,
      reason: 'never_practised_first',
      practisedExerciseIds: [HAMSTRING_REACH_ID],
    });
  });

  it('uses least-recently-practised once all currently eligible members are covered', () => {
    const exposures = [
      exposure(HAMSTRING_REACH_ID, '2026-06-04'),
      exposure(THORACIC_ROTATION_ID, '2026-06-01'),
      exposure(HIP_FLEXOR_STRETCH_ID, '2026-06-03'),
      exposure(WALL_CALF_STRETCH_ID, '2026-06-02'),
    ];

    expect(selectCollectionMember({ ...baseInput(), blockId: BLOCK_ID, exposures })).toMatchObject({
      available: true,
      selectedExerciseId: THORACIC_ROTATION_ID,
      reason: 'least_recently_practised',
    });
    expect(selectCollectionMember({ ...baseInput(), blockId: BLOCK_ID, exposures: exposures.slice().reverse() })).toMatchObject({
      available: true,
      selectedExerciseId: THORACIC_ROTATION_ID,
      reason: 'least_recently_practised',
    });
  });

  it('breaks equal-date ties by canonical member order and ignores duplicate exposure representations', () => {
    const exposures = [
      exposure(HAMSTRING_REACH_ID, '2026-06-01', 'same-1'),
      exposure(HAMSTRING_REACH_ID, '2026-06-01', 'same-1'),
      exposure(THORACIC_ROTATION_ID, '2026-06-01', 'same-2'),
      exposure(HIP_FLEXOR_STRETCH_ID, '2026-06-01', 'same-3'),
      exposure(WALL_CALF_STRETCH_ID, '2026-06-01', 'same-4'),
    ];
    const coverage = collectionCoverageSummary({ ...baseInput(), blockId: BLOCK_ID, exposures });

    expect(selectCollectionMember({ ...baseInput(), blockId: BLOCK_ID, exposures })).toMatchObject({
      available: true,
      selectedExerciseId: HAMSTRING_REACH_ID,
      reason: 'least_recently_practised',
    });
    expect(coverage.completedExposureCount).toBe(4);
    expect(coverage.coverageLabel).toBe('All currently available mobility areas have been practised.');
  });

  it('ignores wrong-block, manual, preset, skipped, malformed, fallback-only, and legacy summaries', () => {
    const summaries = [
      summary({ exerciseId: HAMSTRING_REACH_ID }),
      summary({ id: 'wrong-block', blockId: 'other-block', exerciseId: THORACIC_ROTATION_ID }),
      summary({ id: 'manual', source: 'manual', completionSource: 'manual', exerciseId: HIP_FLEXOR_STRETCH_ID }),
      summary({ id: 'preset', source: 'preset', completionSource: 'preset', exerciseId: WALL_CALF_STRETCH_ID }),
      summary({ id: 'skipped', status: 'skipped', exerciseId: THORACIC_ROTATION_ID }),
      summary({ id: 'malformed', malformedResultCount: 1, exerciseId: HIP_FLEXOR_STRETCH_ID }),
      summary({ id: 'fallback', role: 'fallback', fallbackOnly: true, exerciseId: WALL_CALF_STRETCH_ID }),
      summary({ id: 'legacy', source: 'legacy', completionSource: 'legacy_fallback', exerciseId: THORACIC_ROTATION_ID }),
      summary({ id: 'retest', sessionType: 'retest', exerciseId: THORACIC_ROTATION_ID }),
    ];

    const exposures = collectionExposuresFromGeneratedSessionSummaries({ blockId: BLOCK_ID, summaries });

    expect(exposures.map((item) => item.exerciseId)).toEqual([HAMSTRING_REACH_ID]);
  });

  it('tracks preset/manual session exposures under a shared pseudo-block scope so repeats rotate', () => {
    const summaries = [
      summary({ id: 'preset-1', source: 'preset', completionSource: 'preset', exerciseId: HAMSTRING_REACH_ID }),
      summary({ id: 'manual-1', source: 'manual', completionSource: 'manual', exerciseId: THORACIC_ROTATION_ID }),
      // Block-generated and skipped sessions never contribute to preset variety.
      summary({ id: 'block-1', exerciseId: HIP_FLEXOR_STRETCH_ID }),
      summary({ id: 'skipped-preset', source: 'preset', completionSource: 'preset', status: 'skipped', exerciseId: WALL_CALF_STRETCH_ID }),
    ];

    const exposures = presetCollectionExposuresFromGeneratedSessionSummaries({ summaries });

    // Same plannedDateKey/completedAt (fixture defaults), so ties break on
    // completionId ('manual-1' < 'preset-1').
    expect(exposures.map((item) => item.exerciseId)).toEqual([THORACIC_ROTATION_ID, HAMSTRING_REACH_ID]);
    expect(exposures.every((item) => item.blockId === PRESET_COLLECTION_EXPOSURE_SCOPE_ID)).toBe(true);

    // Feeding that history back in picks a member the presets haven't used yet.
    expect(
      selectCollectionMember({
        ...baseInput(),
        blockId: PRESET_COLLECTION_EXPOSURE_SCOPE_ID,
        exposures,
      })
    ).toMatchObject({ available: true, selectedExerciseId: HIP_FLEXOR_STRETCH_ID, reason: 'never_practised_first' });
  });

  it('applies equipment, discomfort, no-eligible, and same-session duplicate filters deterministically', () => {
    expect(selectCollectionMember({ ...baseInput({ availableEquipment: ['none'] }), blockId: BLOCK_ID })).toMatchObject({
      available: true,
      selectedExerciseId: THORACIC_ROTATION_ID,
      reason: 'only_eligible_member',
    });

    const allBlocked: DiscomfortConstraint = {
      ...NO_DISCOMFORT,
      blockedExerciseIds: [...MOBILITY_COLLECTION_CORE_MEMBER_IDS],
    };
    expect(selectCollectionMember({ ...baseInput({ discomfortConstraint: allBlocked }), blockId: BLOCK_ID })).toEqual({
      available: false,
      reason: 'no_eligible_member',
    });

    const noMutationInput = {
      ...baseInput(),
      blockId: BLOCK_ID,
      exposures: [exposure(HAMSTRING_REACH_ID, '2026-06-01')],
      alreadySelectedExerciseIds: new Set([THORACIC_ROTATION_ID]),
    };
    const before = JSON.stringify(noMutationInput.exposures);
    expect(selectCollectionMember(noMutationInput)).toMatchObject({
      available: true,
      selectedExerciseId: HIP_FLEXOR_STRETCH_ID,
    });
    expect(JSON.stringify(noMutationInput.exposures)).toBe(before);
  });

  it('summarizes current-block coverage without shame copy as eligibility changes', () => {
    const exposures = [
      exposure(HAMSTRING_REACH_ID, '2026-06-01'),
      exposure(THORACIC_ROTATION_ID, '2026-06-02'),
      exposure(HAMSTRING_REACH_ID, '2026-06-01', 'duplicate-ignored'),
      exposure(WALL_CALF_STRETCH_ID, '2026-06-03', 'wrong-block', 'wrong-block'),
    ];

    expect(collectionCoverageSummary({ ...baseInput(), blockId: BLOCK_ID, exposures })).toMatchObject({
      totalEligibleMembers: 4,
      practisedMemberIds: [HAMSTRING_REACH_ID, THORACIC_ROTATION_ID],
      unpractisedMemberIds: [HIP_FLEXOR_STRETCH_ID, WALL_CALF_STRETCH_ID],
      coverageLabel: '2 of 4 mobility areas practised this block.',
    });
    expect(collectionCoverageSummary({ ...baseInput({ availableEquipment: ['none'] }), blockId: BLOCK_ID, exposures })).toMatchObject({
      totalEligibleMembers: 1,
      practisedMemberIds: [THORACIC_ROTATION_ID],
      coverageLabel: 'All currently available mobility areas have been practised.',
    });
  });
});

function baseInput(overrides: Partial<Parameters<typeof eligibleCollectionMemberIds>[0]> = {}) {
  return {
    collectionId: MOBILITY_COLLECTION_ID,
    availableEquipment: ['chair', 'wall'] as const,
    movementCapabilities: CONFIRMED_CAPABILITIES,
    discomfortConstraint: NO_DISCOMFORT,
    ...overrides,
  };
}

function exposure(
  exerciseId: string,
  date: string,
  completionId = `completion-${exerciseId}-${date}`,
  blockId = BLOCK_ID
): CollectionExposure {
  return {
    blockId,
    exerciseId,
    plannedDateKey: date,
    completedAt: `${date}T09:00:00.000Z`,
    completionId,
  };
}

function summary({
  id,
  blockId = BLOCK_ID,
  source = 'block_generated',
  completionSource = 'block_generated',
  sessionType = 'standard',
  status = 'completed',
  exerciseId,
  role = 'primary',
  fallbackOnly = false,
  malformedResultCount = 0,
}: {
  id?: string;
  blockId?: string;
  source?: PersistedGeneratedSessionSummary['source'];
  completionSource?: PersistedGeneratedSessionSummary['completionSource'];
  sessionType?: PersistedGeneratedSessionSummary['sessionType'];
  status?: PersistedGeneratedSessionSummary['status'];
  exerciseId: string;
  role?: 'primary' | 'supporting' | 'fallback';
  fallbackOnly?: boolean;
  malformedResultCount?: number;
}): PersistedGeneratedSessionSummary {
  const summaryId = id ?? `summary-${exerciseId}-${role}-${source}-${sessionType}`;
  const primaryIds = !fallbackOnly && role === 'primary' ? [exerciseId] : [];
  const supportingIds = !fallbackOnly && role === 'supporting' ? [exerciseId] : [];
  const fallbackIds = fallbackOnly || role === 'fallback' ? [exerciseId] : [];
  return {
    id: summaryId,
    blockId,
    source,
    completionSource,
    sessionType,
    status,
    templateId: 'mobility-A',
    plannedDateKey: 'mobility-A:2026-06-01',
    completedAt: '2026-06-01T09:00:00.000Z',
    title: 'Mobility A',
    exerciseIds: [exerciseId],
    workEvidence: {
      plannedExerciseCount: 1,
      resultItemCount: 1,
      completedExerciseCount: 1,
      skippedExerciseCount: 0,
      missingResultCount: 0,
      duplicateResultCount: 0,
      malformedResultCount,
      unmatchedResultCount: 0,
    },
    focusStimulusEvidence: {
      planStatus: 'eligible',
      status: primaryIds.length > 0 ? 'credited_focus_work' : 'primary_focus_not_completed',
      exclusionReason: primaryIds.length > 0 ? 'none' : fallbackIds.length > 0 ? 'fallback_only' : 'supporting_only',
      mainPlanCredit: primaryIds.length > 0,
      blockFocusDomain: 'mobility',
      plannedPrimaryFocusExerciseCount: primaryIds.length,
      completedPrimaryFocusExerciseCount: primaryIds.length,
      completedSupportingExerciseCount: supportingIds.length,
      completedFallbackExerciseCount: fallbackIds.length,
      completedCrossDomainExerciseCount: 0,
      plannedPrimaryFocusExerciseIds: primaryIds,
      completedPrimaryFocusExerciseIds: primaryIds,
      completedSupportingExerciseIds: supportingIds,
      completedFallbackExerciseIds: fallbackIds,
      completedCrossDomainExerciseIds: [],
      fallbackFocusSlotIds: fallbackIds.length > 0 ? ['slot-fallback'] : [],
      skippedFocusSlotIds: [],
      focusStimulusExclusionReasons: [],
      missingMetadataExerciseIds: [],
      malformedMetadataExerciseIds: [],
      focusMismatchExerciseIds: [],
    },
    exercises: [{
      exerciseId,
      ladderId: MOBILITY_COLLECTION_ID,
      levelId: exerciseId,
      intendedDomain: 'mobility_flexibility',
      stimulusRole: role,
      stimulusReason: role === 'fallback' ? 'equipment_limited' : 'direct_match',
    }],
  };
}
