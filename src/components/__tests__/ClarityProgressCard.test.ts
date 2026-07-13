import type { ClarityTrendViewModel } from '../../pearlFlow/clarityTrend';
import { buildClarityProgressCardPresentation } from '../ClarityProgressCard';

const observationalNotes = {
  fluctuationNote:
    'Check-ins fluctuate — sleep, symptom load, and stress all show up here. The pattern across check-ups is what matters, never one reading.',
  activityNote:
    'Regular physical activity supports brain health. These personal signals are for tracking only and never change your training plan.',
};

describe('ClarityProgressCard presentation', () => {
  it('stays hidden until an observational Clarity series has data', () => {
    expect(buildClarityProgressCardPresentation({ status: 'no_data' })).toBeNull();

    expect(
      buildClarityProgressCardPresentation({
        status: 'ready',
        series: [{ id: 'subjective', label: 'Everyday Clarity', trend: { status: 'no_data' } }],
        ...observationalNotes,
      })
    ).toBeNull();
  });

  it('keeps the subjective and paired-task observations as separate series', () => {
    const viewModel: ClarityTrendViewModel = {
      status: 'ready',
      series: [
        {
          id: 'subjective',
          label: 'Everyday Clarity',
          trend: {
            status: 'building',
            checkInCount: 2,
            body: '2 saved. A few more build your own baseline.',
            entries: [
              {
                atIso: '2026-07-01T09:00:00.000Z',
                dateLabel: 'Jul 2026',
                relationLabel: 'Saved',
              },
            ],
          },
        },
        {
          id: 'dual_task',
          label: 'Steadiness while thinking',
          trend: {
            status: 'ready',
            checkInCount: 4,
            latestRelation: 'below',
            headline: 'Less steady under load than usual at this check-up.',
            supportCopy:
              'One less-steady hold can line up with sleep, symptom load, or stress. Keep tracking at programme check-ups; this signal never changes your programme.',
            entries: [
              {
                atIso: '2026-10-01T09:00:00.000Z',
                dateLabel: 'Oct 2026',
                relationLabel: 'Less steady under load than usual',
              },
            ],
          },
        },
      ],
      covariateContext:
        "This dip lines up with a rough night's sleep — clarity usually tracks sleep, symptoms, and stress.",
      ...observationalNotes,
    };

    const presentation = buildClarityProgressCardPresentation(viewModel);

    expect(presentation?.series).toEqual([
      expect.objectContaining({
        id: 'subjective',
        label: 'Everyday Clarity',
        relationText: '2 saved. A few more build your own baseline.',
        basisText:
          'Based on five questions about word-finding, concentration, mental fatigue, and everyday lapses.',
        latestCheckInDate: '1 Jul',
        checkInCount: 2,
      }),
      expect.objectContaining({
        id: 'dual_task',
        label: 'Steadiness while thinking',
        relationText: 'Less steady under load than usual at this check-up.',
      }),
    ]);
    expect(presentation?.series).toHaveLength(2);
    expect(presentation).not.toHaveProperty('score');
    expect(presentation).not.toHaveProperty('combinedScore');
  });

  it('explains a ready self-report in plain language without exposing a score', () => {
    const viewModel: ClarityTrendViewModel = {
      status: 'ready',
      series: [
        {
          id: 'subjective',
          label: 'Everyday Clarity',
          trend: {
            status: 'ready',
            checkInCount: 4,
            latestRelation: 'above',
            headline: 'Clearer than your usual range at this check-up.',
            entries: [
              {
                atIso: '2026-07-12T09:00:00.000Z',
                dateLabel: 'Jul 2026',
                relationLabel: 'Clearer than your usual range',
              },
            ],
          },
        },
      ],
      ...observationalNotes,
    };

    const presentation = buildClarityProgressCardPresentation(viewModel);

    expect(presentation?.series[0]).toMatchObject({
      relationText: 'You reported clearer thinking than usual',
      comparisonText: 'Compared with your previous programme check-ins.',
      latestCheckInDate: '12 Jul',
      checkInCount: 4,
    });
    expect(JSON.stringify(presentation)).not.toMatch(/score|percentile|population/i);
  });

  it('carries cautious support and context without creating a Pearl attribution or recommendation', () => {
    const viewModel: ClarityTrendViewModel = {
      status: 'ready',
      series: [
        {
          id: 'dual_task',
          label: 'Steadiness while thinking',
          trend: {
            status: 'ready',
            checkInCount: 4,
            latestRelation: 'below',
            headline: 'Less steady under load than usual at this check-up.',
            supportCopy:
              'One less-steady hold can line up with sleep, symptom load, or stress. Keep tracking at programme check-ups; this signal never changes your programme.',
            entries: [],
          },
        },
      ],
      covariateContext:
        'This dip lines up with a heavy symptom week — clarity usually tracks sleep, symptoms, and stress.',
      ...observationalNotes,
    };

    const presentation = buildClarityProgressCardPresentation(viewModel);
    const renderedCopy = JSON.stringify(presentation);

    expect(presentation?.series[0]?.supportCopy).toMatch(/never changes your programme/i);
    expect(presentation?.covariateContext).toMatch(/lines up with a heavy symptom week/i);
    expect(presentation).not.toHaveProperty('fluctuationNote');
    expect(presentation).not.toHaveProperty('activityNote');
    expect(renderedCopy).not.toMatch(/Pearl (caused|improved|will improve)/i);
    expect(renderedCopy).not.toMatch(/supports brain health/i);
    expect(renderedCopy).not.toMatch(/change your workout|train harder|do more sessions/i);
    expect(renderedCopy).not.toMatch(/women your age|population|percentile/i);
  });
});
