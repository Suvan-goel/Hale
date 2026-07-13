import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Everyday Clarity self-report screen', () => {
  const screen = source('src/screens/ClarityCheckInScreen.tsx');

  it('renders the frozen five-item set and saves it only when complete', () => {
    expect(screen).toContain('CLARITY_ITEMS.map((item, index)');
    expect(screen).toContain('answeredCount === CLARITY_ITEMS.length');
    expect(screen).toContain('itemSetId: CLARITY_ITEM_SET_ID');
    expect(screen).toContain('const clarity = clarityComplete');
    expect(screen).toContain('Your five Clarity answers save only as a complete set.');
  });

  it('keeps sleep and relevant symptom load optional, collapsed, and independently saveable', () => {
    expect(screen).toContain('<Text style={styles.contextDisclosureTitle}>Add context</Text>');
    expect(screen).toContain('accessibilityState={{ expanded: optionalContextOpen }}');
    expect(screen).toContain('optionalContextOpen ? (');
    expect(screen).toContain('{showSymptomLoad ? (');
    expect(screen).toContain('const symptomContext = showSymptomLoad ? symptomLoad : null;');
    expect(screen).toContain('sleepQuality !== null || symptomContext !== null');
  });

  it('can restore a draft without making an answer required', () => {
    expect(screen).toContain('initialValue?: CheckUpSelfReport | null;');
    expect(screen).toContain('initialValue?.clarity?.itemScores');
    expect(screen).toContain('initialValue?.covariates?.sleepQuality ?? null');
    expect(screen).toContain('initialValue?.covariates?.symptomLoad ?? null');
    expect(screen).toContain('initialValue?.covariates?.sleepQuality !== undefined');
    expect(screen).toContain('initialValue?.covariates?.symptomLoad !== undefined');
    expect(screen).not.toContain('disabled={!clarityComplete}');
  });

  it('is clearly optional and observational, with no effect on the plan or physical results', () => {
    expect(screen).toContain('Everyday Clarity · optional');
    expect(screen).toContain('they never suggest a cause or change your workouts or movement results.');
    expect(screen).toContain('onPress={() => onDone(null)}');
    expect(screen).toContain('Skip this time');
  });

  it('uses one concise trend explanation instead of repeated context cards', () => {
    expect(screen).toContain('Five quick questions for your personal programme trend');
    expect(screen).not.toContain('A note about your trend');
    expect(screen).not.toContain('Clarity can fluctuate with sleep, symptoms, stress');
    expect(screen).not.toContain('Your own pattern across monthly check-ups is the useful view.');
    expect(screen).not.toMatch(/validated|diagnos|Pearl improves|exercise improves|improve cognition/i);
  });
});
