import {
  CHECKUP_SETUP_ISSUE_BODY,
  FRAMING_READY_COPY,
  WORKOUT_SETUP_ISSUE_BODY,
} from '../setupCopy';

describe('setup trust copy', () => {
  it('uses soft ready and timeout language', () => {
    expect(FRAMING_READY_COPY).toBe('That looks good. Stay there.');
    expect(CHECKUP_SETUP_ISSUE_BODY).toContain("We couldn't get a clear reading");
    expect(WORKOUT_SETUP_ISSUE_BODY).toContain('try again');
    expect(`${FRAMING_READY_COPY} ${CHECKUP_SETUP_ISSUE_BODY} ${WORKOUT_SETUP_ISSUE_BODY}`).not.toMatch(
      /failed|failure|diagnosis|treatment|fall risk|frailty|medical-grade|poor score|lost streak|skipped workout/i
    );
  });
});
