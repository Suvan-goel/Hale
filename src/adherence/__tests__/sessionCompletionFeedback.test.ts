import { buildSessionFeedback } from '../screens/SessionCompletionScreen';

describe('SessionCompletionScreen feedback payload', () => {
  it('submits RPE with no discomfort by default', () => {
    expect(buildSessionFeedback({ effort: 3, painReported: false })).toEqual({
      perceivedEffort: 3,
      painReported: false,
      painArea: undefined,
      completed: true,
      trackingQuality: 'good',
    });
  });

  it('submits discomfort and pain area when selected', () => {
    expect(buildSessionFeedback({ effort: 5, painReported: true, painArea: 'knee', trackingQuality: 'poor' })).toEqual({
      perceivedEffort: 5,
      painReported: true,
      painArea: 'knee',
      completed: true,
      trackingQuality: 'poor',
    });
  });
});
