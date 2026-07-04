import {
  buildMovementProfileV2UnifiedResultsPresentation,
  type MovementProfileV2UnifiedPlanState,
} from '../movementProfileV2ResultsAdapter';
import type { MovementProfileV2RetestComparison } from '../../adherence';
import type { MovementProfileV2ResultsViewModel } from '../../movementProfileV2/viewModel';

describe('Movement Profile V2 unified results adapter', () => {
  it('exposes the exact prepared-plan CTA only when the matching plan is ready', () => {
    const presentation = buildMovementProfileV2UnifiedResultsPresentation({
      viewModel: movementProfileViewModel({
        focus: {
          kind: 'domain',
          domain: 'balance',
          title: 'Balance',
          body: "This was the clearest area to build from today's Check-Up.",
          planMode: 'checkup_hale_band_focus',
        },
      }),
      planState: { status: 'ready', blockId: 'movement-block-v2:abc' },
    });

    expect(presentation.header.title).toBe('Your Movement Profile');
    expect(presentation.plan).toMatchObject({
      status: 'ready',
      title: 'Your 4-week plan is ready',
    });
    expect(presentation.plan.body).toContain('extra attention to balance');
    expect(presentation.actions).toEqual([
      expect.objectContaining({
        label: 'View my 4-week plan',
        action: { type: 'view_plan' },
        button: 'primary',
      }),
    ]);
  });

  it('keeps active-block conflicts calm and navigation-only', () => {
    const presentation = buildMovementProfileV2UnifiedResultsPresentation({
      viewModel: movementProfileViewModel(),
      planState: { status: 'active_block_conflict', existingBlockId: 'existing-block' },
    });

    expect(presentation.plan).toEqual({
      status: 'conflict',
      title: 'Your current plan is unchanged.',
      body: 'You can still view this Movement Profile in Progress.',
    });
    expect(presentation.actions).toEqual([
      expect.objectContaining({
        label: 'Done',
        action: { type: 'done' },
      }),
    ]);
    expect(JSON.stringify(presentation.actions)).not.toContain('View my 4-week plan');
  });

  it('treats balanced focus as first-class plan copy', () => {
    const presentation = buildMovementProfileV2UnifiedResultsPresentation({
      viewModel: movementProfileViewModel({
        focus: {
          kind: 'balanced',
          title: 'Balanced',
          body: 'Your results did not point to one clear area today.',
          planMode: 'balanced_insufficient_reference',
        },
      }),
      planState: { status: 'sync_pending_local_ready', blockId: 'movement-block-v2:balanced' },
    });

    expect(presentation.focus).toEqual({
      kicker: 'Where to focus',
      title: 'Balanced',
      body: 'Your results did not point to one clear area today.',
    });
    expect(presentation.plan.body).toBe(
      'Your plan gives strength, balance, and mobility equal attention across each week.'
    );
    expect(presentation.actions[0]?.label).toBe('View my 4-week plan');
  });

  it('uses the block report CTA and neutral previous/current rows for official retests', () => {
    const presentation = buildMovementProfileV2UnifiedResultsPresentation({
      viewModel: movementProfileViewModel(),
      planState: { status: 'ready', blockId: 'movement-block-v2-next' },
      retestComparison: comparison(),
    });
    const text = JSON.stringify(presentation);

    expect(presentation.header.subtitle).toBe('Your latest Check-Up is saved.');
    expect(presentation.plan.status).toBe('hidden');
    expect(presentation.actions).toEqual([
      expect.objectContaining({
        label: 'View my block report',
        action: { type: 'view_block_report' },
        button: 'primary',
      }),
    ]);
    expect(presentation.comparison?.rows[0]).toMatchObject({
      title: 'Chair-rise capacity',
      previousLabel: 'Previous: 12 reps',
      currentLabel: 'Current: 13 reps',
    });
    expect(text).not.toMatch(/improv|declin|younger|older|percent|delta/i);
  });

  it('renders saved history read-only: no plan section or plan actions, honest copy', () => {
    const presentation = buildMovementProfileV2UnifiedResultsPresentation({
      viewModel: movementProfileViewModel(),
      // Even a "ready" plan state must not surface plan actions in history —
      // a saved profile is a record, not a call to action.
      planState: { status: 'ready', blockId: 'movement-block-v2:abc' },
      variant: 'history',
    });

    expect(presentation.variant).toBe('history');
    expect(presentation.header.eyebrow).toBe('Saved check-up');
    expect(presentation.header.subtitle).toBe(
      'A saved check-up from your history. Opening it does not change your plan.'
    );
    expect(presentation.focus.kicker).toBe('Focus at the time');
    expect(presentation.plan.status).toBe('hidden');
    expect(presentation.actions).toEqual([
      expect.objectContaining({ label: 'Done', action: { type: 'done' } }),
    ]);
    expect(JSON.stringify(presentation.actions)).not.toContain('View my 4-week plan');
  });

  it('keeps the presentation wellness-side and protocol-neutral', () => {
    const presentation = buildMovementProfileV2UnifiedResultsPresentation({
      viewModel: movementProfileViewModel(),
      planState: unavailablePlanState(),
      variant: 'onboarding',
    });
    const text = JSON.stringify(presentation);

    expect(presentation.variant).toBe('onboarding');
    expect(presentation.domains.map((domain) => domain.id)).toEqual([
      'strength_power',
      'balance_stability',
      'mobility_flexibility',
    ]);
    expect(text).not.toMatch(/movement age|fall-risk|diagnos|fingerprint|v2_/i);
  });
});

function movementProfileViewModel(
  override: Partial<Pick<MovementProfileV2ResultsViewModel, 'focus'>> = {}
): MovementProfileV2ResultsViewModel {
  const focus = override.focus ?? {
    kind: 'domain' as const,
    domain: 'strength_power' as const,
    title: 'Strength and power',
    body: "This was the clearest area to build from today's Check-Up.",
    planMode: 'checkup_reference_focus' as const,
  };
  const domainCards: MovementProfileV2ResultsViewModel['domainCards'] = [
    {
      domain: 'strength_power',
      title: 'Strength and power',
      metric: '12 rises in 30 seconds',
      status: 'Saved result',
      body: 'Saved as your personal starting point.',
    },
    {
      domain: 'balance',
      title: 'Balance',
      metric: '32 sec best hold',
      status: 'Building',
      body: 'Your longest steady hold from this check-up.',
    },
    {
      domain: 'mobility',
      title: 'Mobility',
      metric: '151° reach',
      status: 'On track',
      body: 'Within the typical range for your age group.',
    },
  ];

  return {
    checkUpId: '2026-06-24T09:00:00.000Z',
    dateLabel: '24 Jun 2026',
    title: 'Your Movement Profile',
    summary: 'Camera results are beta estimates to help you track your movement at home.',
    focus,
    focusTitle: focus.kind === 'balanced' ? 'Suggested focus: Balanced plan' : `Suggested focus: ${focus.title}`,
    focusBody: focus.body,
    domainCards,
  };
}

function unavailablePlanState(): MovementProfileV2UnifiedPlanState {
  return {
    status: 'unavailable',
    title: 'Plan unavailable right now',
    body: 'Your Movement Profile is saved, but Hale could not find a matching prepared plan.',
  };
}

function comparison(): MovementProfileV2RetestComparison {
  const prior = {
    checkUpId: '2026-06-01T08:00:00.000Z',
    snapshotId: 'snapshot-prior',
    snapshotFingerprint: 'snapshot-fp-prior',
    assessmentId: 'assessment-prior',
    assessmentFingerprint: 'assessment-fp-prior',
    completedAt: '2026-06-01T08:00:00.000Z',
  };
  const current = {
    checkUpId: '2026-06-29T08:00:00.000Z',
    snapshotId: 'snapshot-current',
    snapshotFingerprint: 'snapshot-fp-current',
    assessmentId: 'assessment-current',
    assessmentFingerprint: 'assessment-fp-current',
    completedAt: '2026-06-29T08:00:00.000Z',
  };
  return {
    kind: 'movement_profile_v2_retest_comparison',
    schemaVersion: 1,
    comparisonPolicyVersion: 1,
    comparisonPolicyFingerprint: 'policy',
    comparisonId: 'comparison',
    comparisonFingerprint: 'fingerprint',
    prior,
    current,
    domains: {
      strength_power: {
        status: 'raw_comparable',
        previousValue: 12,
        currentValue: 13,
        unit: 'reps',
        metricLabel: 'Chair-rise capacity',
        referenceComparable: true,
        reasonCodes: [],
      },
      balance: {
        status: 'shown_separately',
        previousValue: 20,
        currentValue: 18,
        unit: 'seconds',
        metricLabel: 'Balance hold',
        reasonCodes: ['DIFFERENT_STANDING_LEG'],
        note: 'A different standing leg was used this time, so Hale is showing the current balance result separately.',
      },
      mobility: {
        status: 'raw_comparable',
        previousValue: 151,
        currentValue: 153,
        unit: 'degrees',
        metricLabel: 'Shoulder reach',
        referenceComparable: true,
        reasonCodes: [],
      },
    },
    overallStatus: 'partially_comparable',
  };
}
