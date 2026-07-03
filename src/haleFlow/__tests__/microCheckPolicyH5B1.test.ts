import {
  createLifeGoal,
  defaultAdherenceStoreState,
  makeTrainingSessionCompletion,
  recordTrainingSessionCompletion,
  type AdherenceStoreState,
  type MovementAssessment,
  type MovementBlock,
  type MovementDomain,
  type MovementProfileV2RetestComparison,
  type MovementSafetyProfile,
  type TrainingFocusStimulusEvidenceSummary,
  type TrainingSessionCompletion,
} from '../../adherence';
import { defaultPreferences } from '../../profile';
import type { CheckUpScore, Domain, DomainResult } from '../../scoring';
import { toStoredScoreSnapshot } from '../../scoring';
import { defaultTrainingState } from '../../training';
import { createMovementAssessment } from '../assessments';
import {
  getHaleAppLifecycle,
} from '../appLifecycle';
import {
  getBlockScheduleState,
  type BlockScheduleState,
} from '../blockSchedule';
import { requiredMainPlanTemplatesForBlock } from '../mainPlanEvents';
import {
  BALANCED_MICRO_CHECK_POLICY_FINGERPRINT,
  BALANCED_MICRO_CHECK_POLICY_VERSION,
  MICRO_CHECK_POLICY_FINGERPRINT,
  MICRO_CHECK_POLICY_VERSION,
  getBlockMicroCheckTarget,
  microCheckSlotMetadataFromTarget,
} from '../microCheckPolicy';
import { createMovementProfileV2BlockReport } from '../movementProfileV2BlockReport';
import {
  MOVEMENT_PROFILE_V2_RETEST_COMPARISON_POLICY_FINGERPRINT,
  MOVEMENT_PROFILE_V2_RETEST_COMPARISON_POLICY_VERSION,
  movementProfileV2RetestComparisonFingerprint,
} from '../movementProfileV2RetestComparison';
import { getManualCheckupOptions } from '../manualCheckup';
import { getNextBestAction } from '../nextBestAction';

const START = '2026-06-01T08:00:00.000Z';
const USER_ID = 'local-device-user';

describe('H5B.1 Balanced micro-check verification closure', () => {
  it('keeps policy versions and fingerprints deterministic and pure', () => {
    expect(MICRO_CHECK_POLICY_VERSION).toBe(1);
    expect(MICRO_CHECK_POLICY_FINGERPRINT).toContain('hale-micro-check-policy-v1');
    expect(BALANCED_MICRO_CHECK_POLICY_VERSION).toBe(1);
    expect(BALANCED_MICRO_CHECK_POLICY_FINGERPRINT).toContain('hale-balanced-micro-check-policy-v1');

    const block = balancedBlock();
    const completions = [credit(block, 0, '2026-06-02')];
    const schedule = scheduleFor(block, completions, '2026-06-03T08:00:00.000Z');
    const before = JSON.stringify({ block, schedule, completions });

    const first = getBlockMicroCheckTarget({ block, schedule, completions });
    const second = getBlockMicroCheckTarget({ block, schedule, completions });

    expect(first).toEqual(second);
    expect(JSON.stringify({ block, schedule, completions })).toBe(before);
    expect(first).toMatchObject({
      status: 'available',
      policyVersion: MICRO_CHECK_POLICY_VERSION,
      policyFingerprint: MICRO_CHECK_POLICY_FINGERPRINT,
      balancedPolicyVersion: BALANCED_MICRO_CHECK_POLICY_VERSION,
      balancedPolicyFingerprint: BALANCED_MICRO_CHECK_POLICY_FINGERPRINT,
    });
  });

  it('proves the Balanced week 1-4 scheduler-credit matrix', () => {
    const block = balancedBlock();

    expect(targetFor(block, [], '2026-06-02T08:00:00.000Z')).toMatchObject({
      status: 'not_available',
      reason: 'week_not_started',
      scheduleWeekNumber: 1,
    });

    const week1One = [credit(block, 0, '2026-06-02')];
    const week1Two = [...week1One, credit(block, 1, '2026-06-03')];
    const week1Three = [...week1Two, credit(block, 2, '2026-06-04')];
    const week1Target = targetFor(block, week1One, '2026-06-03T08:00:00.000Z');
    expect(week1Target).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 1,
      targetSource: 'balanced_schedule_rotation',
      targetDomain: 'strength_power',
      microCheckType: 'chair-power',
    });
    expect(targetFor(block, week1Two, '2026-06-04T08:00:00.000Z')).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 1,
      targetDomain: 'strength_power',
      microCheckType: 'chair-power',
    });
    expect(targetFor(block, week1Three, '2026-06-04T12:00:00.000Z')).toMatchObject({
      status: 'not_available',
      reason: 'week_complete',
      scheduleWeekNumber: 1,
    });

    const week2Base = weekCredits(block, 0, '2026-06-02');
    expect(targetFor(block, week2Base, '2026-06-09T08:00:00.000Z')).toMatchObject({
      status: 'not_available',
      reason: 'week_not_started',
      scheduleWeekNumber: 2,
    });
    const week2One = [...week2Base, credit(block, 0, '2026-06-09', 'w2-a')];
    const week2Two = [...week2One, credit(block, 1, '2026-06-10', 'w2-b')];
    const week2Three = [...week2Two, credit(block, 2, '2026-06-11', 'w2-c')];
    const week2Target = targetFor(block, week2One, '2026-06-10T08:00:00.000Z');
    expect(week2Target).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 2,
      targetSource: 'balanced_schedule_rotation',
      targetDomain: 'balance',
      microCheckType: 'single-leg-balance',
    });
    expect(targetFor(block, week2Two, '2026-06-11T08:00:00.000Z')).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 2,
      targetDomain: 'balance',
      microCheckType: 'single-leg-balance',
    });
    expect(targetFor(block, week2Three, '2026-06-11T12:00:00.000Z')).toMatchObject({
      status: 'not_available',
      reason: 'week_complete',
      scheduleWeekNumber: 2,
    });
    if (week1Target.status !== 'available' || week2Target.status !== 'available') {
      throw new Error('Expected week 1 and week 2 targets');
    }
    expect(week2Target.slotId).not.toBe(week1Target.slotId);

    const week3Base = [...week2Base, ...weekCredits(block, 1, '2026-06-09')];
    const week3One = [...week3Base, credit(block, 0, '2026-06-16', 'w3-a')];
    expect(targetFor(block, week3Base, '2026-06-16T08:00:00.000Z')).toMatchObject({
      status: 'not_available',
      reason: 'week_not_started',
      scheduleWeekNumber: 3,
    });
    expect(targetFor(block, week3One, '2026-06-17T08:00:00.000Z')).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 3,
      targetDomain: 'mobility',
      microCheckType: 'mobility-reach',
    });
    expect(targetFor(block, [...week3One, credit(block, 1, '2026-06-17', 'w3-b')], '2026-06-18T08:00:00.000Z')).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 3,
      targetDomain: 'mobility',
      microCheckType: 'mobility-reach',
    });
    expect(targetFor(block, [...week3Base, ...weekCredits(block, 2, '2026-06-16')], '2026-06-18T12:00:00.000Z')).toMatchObject({
      status: 'not_available',
      reason: 'week_complete',
      scheduleWeekNumber: 3,
    });

    const week4Base = [...week3Base, ...weekCredits(block, 2, '2026-06-16')];
    expect(targetFor(block, week4Base, '2026-06-23T08:00:00.000Z')).toMatchObject({
      status: 'not_available',
      reason: 'week_not_started',
      scheduleWeekNumber: 4,
    });
    expect(targetFor(block, [...week4Base, credit(block, 0, '2026-06-23', 'w4-a')], '2026-06-24T08:00:00.000Z')).toMatchObject({
      status: 'not_available',
      reason: 'balanced_week_4_official_retest',
      scheduleWeekNumber: 4,
    });
    expect(
      targetFor(block, [...week4Base, credit(block, 0, '2026-06-23', 'w4-a'), credit(block, 1, '2026-06-24', 'w4-b')], '2026-06-25T08:00:00.000Z')
    ).toMatchObject({
      status: 'not_available',
      reason: 'balanced_week_4_official_retest',
      scheduleWeekNumber: 4,
    });
    expect(targetFor(block, [...week4Base, ...weekCredits(block, 3, '2026-06-23')], '2026-06-25T12:00:00.000Z')).toMatchObject({
      status: 'not_available',
      reason: 'training_complete',
      scheduleWeekNumber: 4,
    });
  });

  it('does not carry skipped, unavailable, cancelled, or incomplete slots into later Balanced weeks', () => {
    const block = balancedBlock();
    const week1Started = [credit(block, 0, '2026-06-02')];
    expect(
      getBlockMicroCheckTarget({
        block,
        schedule: scheduleFor(block, week1Started, '2026-06-03T08:00:00.000Z'),
        completions: week1Started,
        eligibleTypes: { 'chair-power': false },
      })
    ).toMatchObject({ status: 'not_available', reason: 'target_ineligible', scheduleWeekNumber: 1 });

    const week2NoMicroCheck = [...weekCredits(block, 0, '2026-06-02'), credit(block, 0, '2026-06-09', 'w2-a')];
    expect(targetFor(block, week2NoMicroCheck, '2026-06-10T08:00:00.000Z')).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 2,
      targetDomain: 'balance',
      microCheckType: 'single-leg-balance',
    });

    const cancelledWeek2Micro = microCompletion(block, 'expired-week-2-slot', '2026-06-10T09:00:00.000Z', {
      includeSlot: false,
      measured: false,
    });
    const week3NoBacklog = [
      ...weekCredits(block, 0, '2026-06-02'),
      ...weekCredits(block, 1, '2026-06-09'),
      cancelledWeek2Micro,
      credit(block, 0, '2026-06-16', 'w3-a'),
    ];
    expect(targetFor(block, week3NoBacklog, '2026-06-17T08:00:00.000Z')).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 3,
      targetDomain: 'mobility',
      microCheckType: 'mobility-reach',
    });
  });

  it('keeps the same target and slot when calendar time passes without schedule-week advancement', () => {
    const block = balancedBlock({ id: 'movement-block-v2-h5b1-balanced-lapse' });
    const completions = [credit(block, 0, '2026-12-30')];
    const dec31 = targetFor(block, completions, '2026-12-31T08:00:00.000Z');
    const jan02 = targetFor(block, completions, '2027-01-02T08:00:00.000Z');

    expect(dec31).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 1,
      targetDomain: 'strength_power',
    });
    expect(jan02).toEqual(dec31);
  });

  it('reconstructs domain-focused policy including week 4 and true V1 rollback behavior', () => {
    for (const domain of ['strength_power', 'balance', 'mobility'] as const) {
      const block = domainBlock(domain, { id: `movement-block-h5b1-${domain}` });
      const expectedType =
        domain === 'balance' ? 'single-leg-balance' : domain === 'mobility' ? 'mobility-reach' : 'chair-power';
      const week4Completions = [
        ...weekCredits(block, 0, '2026-06-02'),
        ...weekCredits(block, 1, '2026-06-09'),
        ...weekCredits(block, 2, '2026-06-16'),
        credit(block, 0, '2026-06-23', 'w4-a'),
      ];
      expect(targetFor(block, [credit(block, 0, '2026-06-02')], '2026-06-03T08:00:00.000Z')).toMatchObject({
        status: 'available',
        targetSource: 'domain_focus',
        targetDomain: domain,
        microCheckType: expectedType,
      });
      expect(targetFor(block, week4Completions, '2026-06-24T08:00:00.000Z')).toMatchObject({
        status: 'available',
        scheduleWeekNumber: 4,
        targetSource: 'domain_focus',
        targetDomain: domain,
        microCheckType: expectedType,
      });
    }

    const v1RollbackBlock = domainBlock('balance', {
      id: 'legacy-v1-domain-block',
      origin: { kind: 'legacy_v1_assessment', assessmentId: 'legacy-assessment-1' },
    });
    const target = targetFor(v1RollbackBlock, [credit(v1RollbackBlock, 0, '2026-06-02')], '2026-06-03T08:00:00.000Z');
    expect(target).toMatchObject({
      status: 'available',
      targetSource: 'domain_focus',
      targetDomain: 'balance',
      microCheckType: 'single-leg-balance',
    });
    if (target.status !== 'available') throw new Error('Expected V1 rollback domain target');
    expect(target.balancedPolicyFingerprint).toBeUndefined();
  });

  it('opens due state only from authoritative schedule credit and keeps micro-checks non-credit', () => {
    const block = balancedBlock();
    const nonTriggers = [
      completionCandidate(block, { sessionType: 'standard', source: 'manual', templateIndex: 0, dateKey: '2026-06-02' }),
      completionCandidate(block, { sessionType: 'standard', source: 'preset', templateIndex: 0, dateKey: '2026-06-03' }),
      completionCandidate(block, { sessionType: 'micro_check', source: undefined, templateIndex: 0, dateKey: '2026-06-04' }),
      completionCandidate(block, { sessionType: 'retest', source: undefined, templateIndex: 0, dateKey: '2026-06-05' }),
      completionCandidate({ ...block, id: 'wrong-block' }, { sessionType: 'standard', source: 'block_generated', templateIndex: 0, dateKey: '2026-06-06' }),
      completionCandidate(block, { sessionType: 'standard', source: 'block_generated', templateId: 'unknown-template', dateKey: '2026-06-07' }),
      completionCandidate(block, { sessionType: 'standard', source: 'block_generated', templateIndex: 0, dateKey: '2026-06-08', mainPlanCredit: false }),
      completionCandidate(block, { sessionType: 'standard', source: 'block_generated', templateIndex: 0, dateKey: '2026-06-09', focusCredit: false }),
    ];

    expect(targetFor(block, nonTriggers, '2026-06-10T08:00:00.000Z')).toMatchObject({
      status: 'not_available',
      reason: 'week_not_started',
      scheduleWeekNumber: 1,
    });

    const validA = withScheduleCredit(credit(block, 0, '2026-06-02', 'valid-a'), 0);
    const sameDayDeniedB = credit(block, 1, '2026-06-02', 'same-day-denied-b');
    const schedule = scheduleFor(block, [validA, sameDayDeniedB], '2026-06-03T08:00:00.000Z');
    expect(schedule.totalCredits).toBe(1);
    expect(schedule.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'daily_credit_already_used' })])
    );

    const target = getBlockMicroCheckTarget({ block, schedule, completions: [validA, sameDayDeniedB] });
    expect(target).toMatchObject({
      status: 'available',
      targetDomain: 'strength_power',
      microCheckType: 'chair-power',
    });
    if (target.status !== 'available') throw new Error('Expected micro-check target');

    const state = recordTrainingSessionCompletion(
      { ...defaultAdherenceStoreState(), blocks: [block], completions: [validA] },
      makeTrainingSessionCompletion({
        block,
        sessionType: 'micro_check',
        completedAt: '2026-06-03T09:00:00.000Z',
        plannedDate: target.slotId,
        durationMinutes: 1,
        mainPlanCredit: false,
        microCheckSlot: microCheckSlotMetadataFromTarget(target),
      })
    );
    const afterMicro = scheduleFor(block, state.completions, '2026-06-03T10:00:00.000Z');
    expect(afterMicro.totalCredits).toBe(1);
    expect(afterMicro.nextTemplateId).toBe(requiredMainPlanTemplatesForBlock(block).templateIds[1]);
    expect(state.blocks[0]).toMatchObject({
      completedSessions: 1,
      microChecksCompleted: 1,
      status: 'active',
    });
    expect(state.completions.find((completion) => completion.sessionType === 'micro_check')).toMatchObject({
      mainPlanCredit: false,
      scheduleCredit: undefined,
      templateId: undefined,
    });
  });

  it('preserves stable slot identity and binds slot metadata to the resolved target', () => {
    const block = balancedBlock();
    const completions = [...weekCredits(block, 0, '2026-06-02'), credit(block, 0, '2026-06-09', 'w2-a')];
    const schedule = scheduleFor(block, completions, '2026-06-10T08:00:00.000Z');
    const first = getBlockMicroCheckTarget({ block, schedule, completions });
    const second = getBlockMicroCheckTarget({ block, schedule, completions });

    expect(first).toEqual(second);
    if (first.status !== 'available') throw new Error('Expected week 2 target');
    expect(microCheckSlotMetadataFromTarget(first)).toEqual({
      slotId: first.slotId,
      policyVersion: MICRO_CHECK_POLICY_VERSION,
      policyFingerprint: MICRO_CHECK_POLICY_FINGERPRINT,
      targetSource: 'balanced_schedule_rotation',
      targetDomain: 'balance',
      microCheckType: 'single-leg-balance',
      scheduleWeekIndex: 1,
      scheduleWeekNumber: 2,
    });

    const differentBlock = balancedBlock({ id: 'movement-block-v2-h5b1-balanced-other' });
    const differentWeek = targetFor(block, [...completions, credit(block, 1, '2026-06-10', 'w2-b'), credit(block, 2, '2026-06-11', 'w2-c'), credit(block, 0, '2026-06-16', 'w3-a')], '2026-06-17T08:00:00.000Z');
    const differentType = targetFor(differentBlock, [credit(differentBlock, 0, '2026-06-02')], '2026-06-03T08:00:00.000Z');
    expect(differentWeek).toMatchObject({ status: 'available', scheduleWeekNumber: 3, targetDomain: 'mobility' });
    expect(differentType).toMatchObject({ status: 'available', scheduleWeekNumber: 1, targetDomain: 'strength_power' });
    if (differentWeek.status !== 'available' || differentType.status !== 'available') throw new Error('Expected comparison targets');
    expect(first.slotId).not.toBe(differentWeek.slotId);
    expect(first.slotId).not.toBe(differentType.slotId);
  });

  it('keeps Today, Home/next-best-action, and manual Check-Up options on one target authority', () => {
    const block = balancedBlock();
    const completions = [...weekCredits(block, 0, '2026-06-02'), credit(block, 0, '2026-06-09', 'w2-a')];
    const adherence = adherenceFor(block, completions);
    const profile = {
      ...defaultPreferences().profile,
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
      safetyProfile: safetyProfile(),
    };
    const latestAssessment = assessment();

    const today = getHaleAppLifecycle({
      profile,
      history: [],
      training: defaultTrainingState(),
      adherence: { ...adherence, assessments: [latestAssessment] },
      today: '2026-06-10T08:00:00.000Z',
    });
    const nextBestAction = getNextBestAction({
      profile,
      lifeGoal: profile.lifeGoal,
      latestAssessment,
      activeBlock: block,
      sessionCompletions: completions,
      now: '2026-06-10T08:00:00.000Z',
    });
    const manual = getManualCheckupOptions({
      latestAssessment,
      activeBlock: block,
      completions,
      now: '2026-06-10T08:00:00.000Z',
    });

    expect(today.state).toBe('weekly_micro_check_due');
    expect(today.primaryAction.type).toBe('start_micro_check');
    expect(today.microCheckTarget).toMatchObject({ domain: 'balance', type: 'single-leg-balance' });
    expect(nextBestAction).toMatchObject({
      state: 'active_block_micro_check_due',
      title: 'Balance check-in',
      primaryRoute: 'microcheck',
    });
    expect(manual[0]).toMatchObject({
      type: 'micro_check',
      title: 'Quick micro check-up',
      route: 'optional-microcheck',
      recommended: true,
      isOfficialForProgress: false,
    });
    expect(manual[1]).toMatchObject({
      type: 'manual_extra_v2',
      title: 'Full Movement Check-Up',
      route: 'manual-extra-v2-checkup',
      recommended: false,
      isOfficialForProgress: false,
    });

    const completedSlot = microCompletion(block, todaySlotId(block, completions, '2026-06-10T08:00:00.000Z'), '2026-06-10T09:00:00.000Z');
    const afterCompletion = [...completions, completedSlot];
    expect(
      getHaleAppLifecycle({
        profile,
        history: [],
        training: defaultTrainingState(),
        adherence: { ...adherenceFor(block, afterCompletion), assessments: [latestAssessment] },
        today: '2026-06-10T10:00:00.000Z',
      }).primaryAction.type
    ).toBe('start_today_session');
    expect(
      getManualCheckupOptions({
        latestAssessment,
        activeBlock: block,
        completions: afterCompletion,
        now: '2026-06-10T10:00:00.000Z',
      })
    ).toEqual([
      expect.objectContaining({
        type: 'micro_check',
        title: 'Quick micro check-up',
        route: 'optional-microcheck',
        isOfficialForProgress: false,
      }),
      expect.objectContaining({
        type: 'manual_extra_v2',
        title: 'Full Movement Check-Up',
        route: 'manual-extra-v2-checkup',
        isOfficialForProgress: false,
      }),
    ]);
  });

  it('counts unique Balanced slots for the frozen V2 block report and ignores next-block micro-check state', () => {
    const block = balancedBlock();
    const nextBlock = domainBlock('mobility', { id: 'movement-block-v2-h5b1-next' });
    const schedule = scheduleFor(block, scheduledBlockCompletions(block), '2026-06-29T08:00:00.000Z');
    expect(schedule.status).toBe('retest_due');

    for (const count of [0, 1, 2, 3] as const) {
      const reportResult = createMovementProfileV2BlockReport({
        priorBlock: { ...block, microChecksCompleted: count },
        nextBlock: { ...nextBlock, microChecksCompleted: 99 },
        schedule,
        comparison: comparison(),
        createdAt: '2026-06-29T09:00:00.000Z',
        userId: USER_ID,
      });
      expect(reportResult.ok).toBe(true);
      if (!reportResult.ok) throw new Error(reportResult.reason);
      expect(reportResult.report.microChecksCompleted).toBe(count);
      const refrozen = createMovementProfileV2BlockReport({
        priorBlock: { ...block, microChecksCompleted: count },
        nextBlock: { ...nextBlock, microChecksCompleted: 0 },
        schedule,
        comparison: comparison(),
        createdAt: '2026-06-29T09:00:00.000Z',
        userId: USER_ID,
      });
      expect(refrozen.ok).toBe(true);
      if (!refrozen.ok) throw new Error(refrozen.reason);
      expect(refrozen.report.reportFingerprint).toBe(reportResult.report.reportFingerprint);
    }
  });

  it('keeps H5C/H5D, official artifact, credit/progression, and Warden authorities out of micro-check modules', () => {
    const guardedSources = [
      source('src/haleFlow/microCheckPolicy.ts'),
      source('src/haleFlow/microCheck.ts'),
      source('src/training/microCheck.ts'),
      source('src/training/store.ts'),
    ].join('\n');

    expect(guardedSources).not.toMatch(/createMovementProfileV2Snapshot|createMovementProfileV2Assessment|createMovementProfileV2BlockReport|transitionMovementProfileV2OfficialRetest/);
    expect(guardedSources).not.toMatch(/annotateCompletionWithScheduleCredit|applyProgressionEvidence|recordCompletedSession/);
    expect(guardedSources).not.toMatch(/Warden|percentile|Movement Age|weakest/);
  });
});

function targetFor(block: MovementBlock, completions: TrainingSessionCompletion[], today: string) {
  return getBlockMicroCheckTarget({
    block,
    schedule: scheduleFor(block, completions, today),
    completions,
  });
}

function scheduleFor(block: MovementBlock, completions: readonly TrainingSessionCompletion[], today: string): BlockScheduleState {
  return getBlockScheduleState({ block, completions, today });
}

function todaySlotId(block: MovementBlock, completions: TrainingSessionCompletion[], today: string): string {
  const target = targetFor(block, completions, today);
  if (target.status !== 'available') throw new Error(`Expected target, got ${target.reason}`);
  return target.slotId;
}

function balancedBlock(overrides: Partial<MovementBlock> = {}): MovementBlock {
  return blockBase({
    id: 'movement-block-v2-h5b1-balanced',
    focusDomain: undefined,
    focus: {
      kind: 'balanced',
      balancedPolicyVersion: 1,
      balancedPolicyFingerprint: 'balanced-policy-h5b1',
    },
    origin: {
      kind: 'movement_profile_v2_assessment',
      assessmentId: 'assessment-balanced-h5b1',
      assessmentFingerprint: 'assessment-fingerprint-balanced-h5b1',
      snapshotId: 'snapshot-balanced-h5b1',
      snapshotFingerprint: 'snapshot-fingerprint-balanced-h5b1',
      sourceCheckUpId: 'checkup-balanced-h5b1',
      sourceCheckUpType: 'baseline',
      focusPolicyVersion: 1,
      focusPolicyFingerprint: 'focus-policy-h5b1',
    },
    templateIds: ['balanced-A', 'balanced-B', 'balanced-C'],
    secondaryDomains: ['strength_power', 'balance', 'mobility'],
    ...overrides,
  });
}

function domainBlock(domain: MovementDomain, overrides: Partial<MovementBlock> = {}): MovementBlock {
  return blockBase({
    id: `movement-block-v2-h5b1-${domain}`,
    focusDomain: domain,
    focus: { kind: 'domain', domain },
    secondaryDomains: (['strength_power', 'balance', 'mobility'] as MovementDomain[]).filter((item) => item !== domain),
    ...overrides,
  });
}

function blockBase(overrides: Partial<MovementBlock>): MovementBlock {
  return {
    id: 'movement-block-h5b1',
    userId: USER_ID,
    status: 'active',
    startDate: START,
    endDate: '2026-06-29T08:00:00.000Z',
    retestDate: '2026-06-29T08:00:00.000Z',
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 0,
    microChecksCompleted: 0,
    secondaryDomains: ['balance', 'mobility'],
    createdAt: START,
    updatedAt: START,
    ...overrides,
  };
}

function weekCredits(block: MovementBlock, weekIndex: number, startDateKey: string): TrainingSessionCompletion[] {
  return [0, 1, 2].map((templateIndex) =>
    credit(block, templateIndex, addDays(startDateKey, templateIndex), `w${weekIndex + 1}-${templateIndex}`)
  );
}

function scheduledBlockCompletions(block: MovementBlock): TrainingSessionCompletion[] {
  return [
    ...weekCredits(block, 0, '2026-06-02'),
    ...weekCredits(block, 1, '2026-06-09'),
    ...weekCredits(block, 2, '2026-06-16'),
    ...weekCredits(block, 3, '2026-06-23'),
  ];
}

function credit(
  block: MovementBlock,
  templateIndex: number,
  dateKey: string,
  id = `${templateIndex}-${dateKey}`
): TrainingSessionCompletion {
  return completionCandidate(block, {
    sessionType: 'standard',
    source: 'block_generated',
    templateIndex,
    dateKey,
    id,
  });
}

function completionCandidate(
  block: MovementBlock,
  input: {
    sessionType: TrainingSessionCompletion['sessionType'];
    source?: TrainingSessionCompletion['source'];
    templateIndex?: number;
    templateId?: string;
    dateKey: string;
    id?: string;
    mainPlanCredit?: boolean;
    focusCredit?: boolean;
  }
): TrainingSessionCompletion {
  const templateId =
    input.templateId ?? requiredMainPlanTemplatesForBlock(block).templateIds[input.templateIndex ?? 0];
  return makeTrainingSessionCompletion({
    block,
    sessionType: input.sessionType,
    completedAt: `${input.dateKey}T08:00:00.000Z`,
    plannedDate: templateId ? `${templateId}:${input.dateKey}` : undefined,
    source: input.source,
    templateId,
    mainPlanCredit: input.mainPlanCredit ?? true,
    focusStimulusEvidence:
      input.focusCredit === false
        ? { ...focusEvidence(block, templateId), mainPlanCredit: false }
        : focusEvidence(block, templateId),
    userId: USER_ID,
  });
}

function microCompletion(
  block: MovementBlock,
  slotId: string,
  completedAt: string,
  options: { includeSlot?: boolean; measured?: boolean } = {}
): TrainingSessionCompletion {
  const target = targetFor(block, [credit(block, 0, '2026-06-02')], '2026-06-03T08:00:00.000Z');
  const metadata = target.status === 'available' ? microCheckSlotMetadataFromTarget({ ...target, slotId }) : undefined;
  return makeTrainingSessionCompletion({
    block,
    sessionType: 'micro_check',
    completedAt,
    plannedDate: slotId,
    durationMinutes: 1,
    mainPlanCredit: false,
    microCheckSlot: options.includeSlot === false ? undefined : metadata,
    userId: USER_ID,
    notes: options.measured === false ? 'cancelled' : undefined,
  });
}

function focusEvidence(block: MovementBlock, templateId?: string): TrainingFocusStimulusEvidenceSummary {
  const exerciseId = `${templateId ?? 'template'}-primary`;
  return {
    planStatus: 'eligible',
    status: 'credited_focus_work',
    exclusionReason: 'none',
    mainPlanCredit: true,
    blockFocusDomain: block.focusDomain,
    plannedPrimaryFocusExerciseCount: 1,
    completedPrimaryFocusExerciseCount: 1,
    completedSupportingExerciseCount: 0,
    completedFallbackExerciseCount: 0,
    completedCrossDomainExerciseCount: 0,
    plannedPrimaryFocusExerciseIds: [exerciseId],
    completedPrimaryFocusExerciseIds: [exerciseId],
    completedSupportingExerciseIds: [],
    completedFallbackExerciseIds: [],
    completedCrossDomainExerciseIds: [],
    fallbackFocusSlotIds: [],
    skippedFocusSlotIds: [],
    focusStimulusExclusionReasons: [],
    missingMetadataExerciseIds: [],
    malformedMetadataExerciseIds: [],
    focusMismatchExerciseIds: [],
  };
}

function adherenceFor(block: MovementBlock, completions: TrainingSessionCompletion[]): AdherenceStoreState {
  return { ...defaultAdherenceStoreState(), blocks: [block], completions };
}

function assessment(): MovementAssessment {
  const inputScore = score('balance');
  return createMovementAssessment({
    checkUpId: START,
    type: 'baseline',
    score: inputScore,
    scoreSnapshot: toStoredScoreSnapshot(inputScore),
    completedAt: START,
  });
}

function safetyProfile(): MovementSafetyProfile {
  return {
    id: 'safety-h5b1',
    userId: USER_ID,
    age: 62,
    activityLevel: 'lightly_active' as const,
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: ['chair', 'wall'],
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: START,
    updatedAt: START,
  };
}

function comparison(): MovementProfileV2RetestComparison {
  const base: Omit<MovementProfileV2RetestComparison, 'comparisonFingerprint'> = {
    kind: 'movement_profile_v2_retest_comparison',
    schemaVersion: 1,
    comparisonPolicyVersion: MOVEMENT_PROFILE_V2_RETEST_COMPARISON_POLICY_VERSION,
    comparisonPolicyFingerprint: MOVEMENT_PROFILE_V2_RETEST_COMPARISON_POLICY_FINGERPRINT,
    comparisonId: 'comparison-h5b1',
    prior: {
      checkUpId: 'prior-checkup-h5b1',
      snapshotId: 'prior-snapshot-h5b1',
      snapshotFingerprint: 'prior-snapshot-fingerprint-h5b1',
      assessmentId: 'prior-assessment-h5b1',
      assessmentFingerprint: 'prior-assessment-fingerprint-h5b1',
      completedAt: '2026-06-01T08:00:00.000Z',
    },
    current: {
      checkUpId: 'current-checkup-h5b1',
      snapshotId: 'current-snapshot-h5b1',
      snapshotFingerprint: 'current-snapshot-fingerprint-h5b1',
      assessmentId: 'current-assessment-h5b1',
      assessmentFingerprint: 'current-assessment-fingerprint-h5b1',
      completedAt: '2026-06-29T08:00:00.000Z',
    },
    domains: {
      strength_power: domainComparison('Chair-rise capacity', 'reps'),
      balance: domainComparison('Single-leg balance', 'seconds'),
      mobility: domainComparison('Shoulder reach', 'degrees'),
    },
    overallStatus: 'comparable',
  };
  return {
    ...base,
    comparisonFingerprint: movementProfileV2RetestComparisonFingerprint(base),
  };
}

function domainComparison(metricLabel: string, unit: 'reps' | 'seconds' | 'degrees') {
  return {
    status: 'raw_comparable' as const,
    previousValue: 1,
    currentValue: 1,
    unit,
    metricLabel,
    referenceComparable: true,
    reasonCodes: [],
  };
}

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function withScheduleCredit(
  completion: TrainingSessionCompletion,
  weekIndex: number
): TrainingSessionCompletion {
  return {
    ...completion,
    scheduleCredit: {
      policyVersion: 1,
      credited: true,
      status: 'credited',
      weekIndex,
      weekNumber: weekIndex + 1,
      dateKey: completion.completedAt.slice(0, 10),
      templateId: completion.templateId,
      creditId: completion.plannedDate,
    },
  };
}

function domainResult(domain: Domain, age: number): DomainResult {
  return {
    domain,
    label: domain,
    measured: true,
    ageLow: age - 1,
    ageHigh: age + 1,
    estimated: false,
    interpretation: 'Measured range.',
    rows: [],
    primaryMetricValue: age,
  };
}

function score(weakestDomain: Domain): CheckUpScore {
  return {
    startedAt: START,
    weakestDomain,
    domains: [
      domainResult('strength', weakestDomain === 'strength' ? 70 : 58),
      domainResult('balance', weakestDomain === 'balance' ? 70 : 57),
      domainResult('mobility', weakestDomain === 'mobility' ? 70 : 56),
    ],
  };
}

function source(path: string): string {
  return require('node:fs').readFileSync(`${process.cwd()}/${path}`, 'utf8') as string;
}
