import {
  getExtraSessionCards,
  getHealthInsightCards,
  getLearnDetail,
} from '../exploreViewModel';

const START = '2026-06-17T08:00:00.000Z';

function confirmedMovementCapabilities() {
  return {
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
    updatedAt: START,
  };
}

describe('exploreViewModel', () => {
  it('lists the V1 extra session presets and gates required equipment clearly', () => {
    const cards = getExtraSessionCards({
      safetyProfile: {
        id: 'safety',
        userId: 'local-device-user',
        availableEquipment: ['chair', 'wall'],
        createdAt: '2026-06-17T08:00:00.000Z',
        updatedAt: '2026-06-17T08:00:00.000Z',
      },
    });

    expect(cards.map((card) => card.title)).toEqual([
      '10-Minute Mobility Reset',
      'Gentle Restart Session',
      'Steady Balance Practice',
      'Chair and wall strength',
      'Upper-back band work',
      'Stairs Confidence',
      'Quick Full-Body Hale Session',
    ]);
    expect(cards.find((card) => card.id === 'preset-band-upper-back')).toMatchObject({
      disabled: true,
      disabledReason: 'Needs a resistance band',
    });
    expect(cards.find((card) => card.id === 'preset-stairs-confidence')).toMatchObject({
      disabled: true,
      disabledReason: 'Needs a bottom stair',
    });
    expect(cards.find((card) => card.id === 'preset-no-equipment-strength')?.disabled).toBe(false);
    expect(cards.find((card) => card.id === 'preset-no-equipment-strength')).toMatchObject({
      cardTitle: 'Chair and wall strength',
      body: 'Strength with a chair and wall.',
      detailBody: expect.stringContaining('chair, wall, and clear space'),
    });
  });

  it('enables band and stair extras when the matching equipment is available', () => {
    const cards = getExtraSessionCards({
      safetyProfile: {
        id: 'safety',
        userId: 'local-device-user',
        availableEquipment: ['chair', 'wall', 'stairs', 'resistance_band'],
        movementCapabilities: confirmedMovementCapabilities(),
        createdAt: START,
        updatedAt: START,
      },
    });

    expect(cards.find((card) => card.id === 'preset-band-upper-back')?.disabled).toBe(false);
    expect(cards.find((card) => card.id === 'preset-stairs-confidence')?.disabled).toBe(false);
  });

  it('keeps stair extras disabled when a bottom stair has no nearby support', () => {
    const cards = getExtraSessionCards({
      safetyProfile: {
        id: 'safety',
        userId: 'local-device-user',
        availableEquipment: ['stairs'],
        createdAt: '2026-06-17T08:00:00.000Z',
        updatedAt: '2026-06-17T08:00:00.000Z',
      },
    });

    expect(cards.find((card) => card.id === 'preset-stairs-confidence')).toMatchObject({
      disabled: true,
      disabledReason: 'Needs wall or counter support',
    });
  });

  it('keeps stair extras disabled when step-up setup is not confirmed', () => {
    const cards = getExtraSessionCards({
      safetyProfile: {
        id: 'safety',
        userId: 'local-device-user',
        availableEquipment: ['chair', 'wall', 'stairs'],
        createdAt: '2026-06-17T08:00:00.000Z',
        updatedAt: '2026-06-17T08:00:00.000Z',
      },
    });

    expect(cards.find((card) => card.id === 'preset-stairs-confidence')).toMatchObject({
      disabled: true,
      disabledReason: 'Needs a step or stair',
    });
  });

  it('provides professional insight cards as a separate feed', () => {
    const cards = getHealthInsightCards();

    expect(cards.map((card) => card.id)).toEqual([
      'insight-strength-balance-aging',
      'insight-sleep-recovery-rhythm',
      'insight-protein-meal-rhythm',
      'insight-walking-breaks',
    ]);
    expect(cards.every((card) => card.categoryLabel && card.authorCredential && card.reviewedLabel)).toBe(true);
    expect(getLearnDetail(cards[0].id)?.sections.length).toBeGreaterThan(0);
  });
});
