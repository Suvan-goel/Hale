import {
  assessmentStatusAfterHealthChange,
  confirmGentleStartSafetyStep,
  removeHealthAnswers,
  saveHealthAnswers,
  type SettingsSafetyPreferences,
} from '../healthAnswerPreferences';

function preferences(
  overrides: Partial<SettingsSafetyPreferences> = {}
): SettingsSafetyPreferences {
  return {
    balanceSupportDefault: false,
    balanceSupportPreference: null,
    balanceSupportRequired: false,
    lowImpact: false,
    quietMode: true,
    hasStairs: false,
    consentHealthData: false,
    gentleStartActive: false,
    heartSafetyAnswer: null,
    gpConfirmed: false,
    jointFlags: [],
    ...overrides,
  };
}

describe('Settings health-answer preferences', () => {
  it('saves only derived local routing fields and starts Gentle Start conservatively', () => {
    const next = saveHealthAnswers(preferences(), {
      heartAnswer: 'prefer_not_to_say',
      jointFlags: ['knee', 'wrist'],
      pelvicSupport: true,
      balanceSupport: true,
    });

    expect(next).toMatchObject({
      consentHealthData: true,
      gentleStartActive: true,
      heartSafetyAnswer: 'prefer_not_to_say',
      gpConfirmed: false,
      jointFlags: ['knee', 'wrist'],
      lowImpact: true,
      balanceSupportDefault: true,
      balanceSupportPreference: true,
    });
  });

  it('never lets an editor draft clear measurement-required support', () => {
    const next = saveHealthAnswers(
      preferences({ balanceSupportDefault: true, balanceSupportRequired: true }),
      {
        heartAnswer: 'no',
        jointFlags: [],
        pelvicSupport: false,
        balanceSupport: false,
      }
    );

    expect(next.balanceSupportDefault).toBe(true);
    expect(next.balanceSupportRequired).toBe(true);
  });

  it('removes health-derived fields without weakening support', () => {
    const next = removeHealthAnswers(
      preferences({
        consentHealthData: true,
        gentleStartActive: true,
        jointFlags: ['hip'],
        lowImpact: true,
        balanceSupportDefault: true,
      })
    );

    expect(next).toMatchObject({
      consentHealthData: false,
      gentleStartActive: false,
      gpConfirmed: false,
      jointFlags: [],
      lowImpact: false,
      balanceSupportDefault: true,
      balanceSupportPreference: null,
      heartSafetyAnswer: null,
    });
  });

  it('confirms the safety step only for a consented active Gentle Start', () => {
    expect(
      confirmGentleStartSafetyStep(
        preferences({ consentHealthData: true, gentleStartActive: true })
      ).gpConfirmed
    ).toBe(true);
    expect(confirmGentleStartSafetyStep(preferences())).toEqual(preferences());
  });

  it('keeps accepted results frozen while recovering blocked baseline states', () => {
    expect(
      assessmentStatusAfterHealthChange(
        'done',
        preferences({ consentHealthData: false })
      )
    ).toBe('done');
    expect(
      assessmentStatusAfterHealthChange(
        'skipped',
        preferences({ consentHealthData: true, gentleStartActive: true })
      )
    ).toBe('bypassed_b1');
    expect(
      assessmentStatusAfterHealthChange(
        'bypassed_b1',
        preferences({ consentHealthData: true, gentleStartActive: false })
      )
    ).toBe('skipped');
  });
});
