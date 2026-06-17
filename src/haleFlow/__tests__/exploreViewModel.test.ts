import {
  getEquipmentSetupSummary,
  getExtraSessionCards,
  getLearnCards,
  getLearnDetail,
  getMovementLadderCards,
  getMovementLadderDetail,
} from '../exploreViewModel';

describe('exploreViewModel', () => {
  it('lists the V1 extra session presets and gates required equipment clearly', () => {
    const cards = getExtraSessionCards({
      equipment: { stair: false, band: false, miniBand: false, load: false },
    });

    expect(cards.map((card) => card.title)).toEqual([
      '10-Minute Mobility Reset',
      'Gentle Restart Session',
      'Steady Balance Practice',
      'No-Optional-Equipment Strength',
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
  });

  it('enables band and stair extras when the matching equipment is available', () => {
    const cards = getExtraSessionCards({
      equipment: { stair: true, band: true, miniBand: false, load: false },
    });

    expect(cards.find((card) => card.id === 'preset-band-upper-back')?.disabled).toBe(false);
    expect(cards.find((card) => card.id === 'preset-stairs-confidence')?.disabled).toBe(false);
  });

  it('builds movement ladder cards from V1 core ladder data', () => {
    const cards = getMovementLadderCards();

    expect(cards.map((card) => card.title)).toContain('Sit-to-Stand');
    expect(cards.map((card) => card.title)).toContain('Mobility / Flexibility');
    expect(cards.every((card) => card.currentLevelName.length > 0)).toBe(true);
  });

  it('shows only V1 core levels in ladder detail by default', () => {
    const detail = getMovementLadderDetail('mobility-flexibility');

    expect(detail).not.toBeNull();
    expect(detail?.levels.map((level) => level.name)).not.toContain('Neck Rotations');
    expect(detail?.levels.every((level) => level.measurementLabel.length > 0)).toBe(true);
  });

  it('provides six bundled learn cards with clean product language', () => {
    const cards = getLearnCards();
    const allCopy = cards
      .flatMap((card) => {
        const detail = getLearnDetail(card.id);
        return [card.title, card.body, ...(detail?.sections.flatMap((section) => [section.title, section.body]) ?? [])];
      })
      .join(' ')
      .toLowerCase();

    expect(cards).toHaveLength(6);
    for (const banned of ['fall risk', 'frailty', 'failed', 'skipped workout', 'lost streak', 'medical-grade']) {
      expect(allCopy).not.toContain(banned);
    }
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
      },
    });

    expect(summary.availableLabel).toContain('stable chair');
    expect(summary.availableLabel).toContain('bottom stair');
    expect(summary.availableLabel).toContain('mini band');
    expect(summary.missingOptionalLabel).toContain('resistance band');
    expect(summary.phoneStandLabel).toBe('Phone stand available');
  });
});
