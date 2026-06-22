import {
  getEquipmentSetupSummary,
  getExploreLibrary,
  getExtraSessionCards,
  getHealthInsightCards,
  getLearnCards,
  getLearnDetail,
  getMovementLadderCards,
  getMovementLadderDetail,
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
      'Chair + Wall Strength',
      'Band Upper-Back',
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
      cardTitle: 'Chair + Wall Strength',
      body: 'Strength with a chair and wall.',
      detailBody: expect.stringContaining('chair, wall, and clear space'),
    });
  });

  it('enables band and stair extras when the matching equipment is available', () => {
    const cards = getExtraSessionCards({
      equipment: { stair: false, band: false, miniBand: false, load: false },
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
      equipment: { stair: true, band: false, miniBand: false, load: false },
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
      disabledReason: 'Needs step-up setup',
    });
  });

  it('builds movement ladder cards from V1 core ladder data', () => {
    const cards = getMovementLadderCards({
      safetyProfile: {
        id: 'safety',
        userId: 'local-device-user',
        availableEquipment: ['chair', 'wall'],
        createdAt: '2026-06-17T08:00:00.000Z',
        updatedAt: '2026-06-17T08:00:00.000Z',
      },
    });

    expect(cards.map((card) => card.title)).toContain('Sit-to-Stand');
    expect(cards.map((card) => card.title)).toContain('Mobility / Flexibility');
    expect(cards.every((card) => card.currentLevelName.length > 0)).toBe(true);
    expect(cards.find((card) => card.id === 'sit-to-stand')?.body).toBe(
      'Build chair-rise strength for standing from everyday seats.'
    );
    expect(cards.find((card) => card.id === 'shoulder-reach-press')?.equipmentLabel).toBe('No optional equipment');
    expect(cards.find((card) => card.id === 'step-up')?.equipmentLabel).toBe('Needs a bottom stair');
    expect(cards.find((card) => card.id === 'pull-upper-back')?.equipmentLabel).toBe('Needs a resistance band');
    expect(getMovementLadderDetail('sit-to-stand')?.body).toBe(
      'Chair-rise strength and power, with cushion, tempo, and power options.'
    );
  });

  it('shows only V1 core levels in ladder detail by default', () => {
    const detail = getMovementLadderDetail('mobility-flexibility');

    expect(detail).not.toBeNull();
    expect(detail?.levels.map((level) => level.name)).not.toContain('Neck Rotations');
    expect(detail?.levels.every((level) => level.measurementLabel.length > 0)).toBe(true);
    expect(detail?.levels.every((level) => level.instructions.length > 0)).toBe(true);
    expect(detail?.currentLevel.measurementNote).toContain('Broad rotation');
  });

  it('ignores legacy equipment booleans when canonical safety equipment is absent', () => {
    const cards = getExtraSessionCards({
      equipment: { stair: true, band: true, miniBand: true, load: true },
    });

    expect(cards.find((card) => card.id === 'preset-band-upper-back')?.disabled).toBe(true);
    expect(cards.find((card) => card.id === 'preset-stairs-confidence')?.disabled).toBe(true);
  });

  it('surfaces setup, safety, and tracking notes on movement details', () => {
    const stepUp = getMovementLadderDetail('step-up');
    const push = getMovementLadderDetail('push');

    expect(stepUp?.currentLevel.setupNote).toContain('bottom stair');
    expect(stepUp?.currentLevel.safetyNote).toContain('Stop if the step');
    expect(stepUp?.currentLevel.measurementNote).toContain('does not score foot placement');
    expect(push?.currentLevel.measurementNote).toContain('does not score shoulder or elbow position');
  });

  it('reflects floor-space gating in ladder detail current levels', () => {
    const ladderProgressById = {
      'hinge-glutes': {
        ladderId: 'hinge-glutes',
        currentLevelId: 'glute-bridge-hold',
        completedSessionsAtLevel: 0,
        failedSessionsAtLevel: 0,
        recentCompletionRates: [],
        recentRpe: [],
        recentPain: [],
        updatedAt: '2026-06-17T08:00:00.000Z',
      },
    };
    const withoutFloor = getMovementLadderDetail('hinge-glutes', ladderProgressById, {
      safetyProfile: {
        id: 'safety',
        userId: 'local-device-user',
        availableEquipment: ['chair', 'wall'],
        createdAt: '2026-06-17T08:00:00.000Z',
        updatedAt: '2026-06-17T08:00:00.000Z',
      },
    });
    const withFloor = getMovementLadderDetail('hinge-glutes', ladderProgressById, {
      safetyProfile: {
        id: 'safety',
        userId: 'local-device-user',
        availableEquipment: ['chair', 'wall', 'floor_space'],
        movementCapabilities: confirmedMovementCapabilities(),
        createdAt: START,
        updatedAt: START,
      },
    });

    expect(withoutFloor?.currentLevel.id).toBe('hip-hinge-free');
    expect(withoutFloor?.currentLevel.equipmentLabel).not.toContain('floor');
    expect(withFloor?.currentLevel.id).toBe('glute-bridge-hold');
    expect(withFloor?.currentLevel.equipmentLabel).toBe('floor space');
  });

  it('keeps standing band rows behind explicit door-anchor availability', () => {
    const ladderProgressById = {
      'pull-upper-back': {
        ladderId: 'pull-upper-back',
        currentLevelId: 'standing-band-row',
        completedSessionsAtLevel: 0,
        failedSessionsAtLevel: 0,
        recentCompletionRates: [],
        recentRpe: [],
        recentPain: [],
        updatedAt: '2026-06-17T08:00:00.000Z',
      },
    };
    const equipment = { stair: false, band: true, miniBand: false, load: false };
    const withoutAnchor = getMovementLadderDetail('pull-upper-back', ladderProgressById, {
      equipment,
      safetyProfile: {
        id: 'safety',
        userId: 'local-device-user',
        availableEquipment: ['chair', 'wall', 'resistance_band'],
        createdAt: '2026-06-17T08:00:00.000Z',
        updatedAt: '2026-06-17T08:00:00.000Z',
      },
    });
    const withAnchor = getMovementLadderDetail('pull-upper-back', ladderProgressById, {
      equipment,
      safetyProfile: {
        id: 'safety',
        userId: 'local-device-user',
        availableEquipment: ['chair', 'wall', 'resistance_band', 'door_anchor'],
        createdAt: '2026-06-17T08:00:00.000Z',
        updatedAt: '2026-06-17T08:00:00.000Z',
      },
    });

    expect(withoutAnchor?.currentLevel.id).toBe('seated-band-row');
    expect(withoutAnchor?.currentLevel.equipmentLabel).not.toContain('door anchor');
    expect(withAnchor?.currentLevel.id).toBe('standing-band-row');
    expect(withAnchor?.currentLevel.equipmentLabel).toContain('door anchor');
  });

  it('provides bundled learn cards with clean product language', () => {
    const cards = getLearnCards();
    const allCopy = cards
      .flatMap((card) => {
        const detail = getLearnDetail(card.id);
        return [card.title, card.body, ...(detail?.sections.flatMap((section) => [section.title, section.body]) ?? [])];
      })
      .join(' ')
      .toLowerCase();

    expect(cards).toHaveLength(8);
    for (const banned of ['fall risk', 'frailty', 'failed', 'skipped workout', 'lost streak', 'medical-grade']) {
      expect(allCopy).not.toContain(banned);
    }
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

  it('organizes Explore as a focused reference library', () => {
    const library = getExploreLibrary();

    expect(library.featured.id).toBe('movement-checkup-guide');
    expect(library.sections.map((section) => section.id)).toEqual([
      'movement_checkup',
      'training_basics',
      'setup_safety',
    ]);
    expect(library.sections.find((section) => section.id === 'training_basics')?.articles.map((card) => card.id)).toEqual([
      'chair-rise-strength',
      'balance-practice',
      'mobility-basics',
    ]);
  });

  it('summarizes equipment setup from training, safety, and settings state', () => {
    const summary = getEquipmentSetupSummary({
      equipment: { stair: true, band: false, miniBand: true, load: false },
      safetyProfile: {
        id: 'safety',
        userId: 'local-device-user',
        availableEquipment: ['chair', 'wall', 'stairs', 'mini_band'],
        createdAt: '2026-06-17T08:00:00.000Z',
        updatedAt: '2026-06-17T08:00:00.000Z',
      },
      settings: {
        voiceId: 'clara',
        remindersEnabled: false,
        phoneStandAvailable: true,
        supportSharingLevel: 'private',
        devMockDataEnabled: false,
      },
    });

    expect(summary.availableLabel).toContain('stable chair');
    expect(summary.availableLabel).toContain('bottom stair');
    expect(summary.availableLabel).toContain('mini band');
    expect(summary.missingOptionalLabel).toContain('resistance band');
    expect(summary.phoneStandLabel).toBe('Phone stand available');
  });
});
