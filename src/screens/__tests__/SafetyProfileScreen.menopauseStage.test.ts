import fs from 'fs';
import path from 'path';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('SafetyProfileScreen menopause-stage question (2026-07-05 repositioning)', () => {
  const text = source('src/screens/SafetyProfileScreen.tsx');

  it('asks the stage question only for the female reference group', () => {
    expect(text).toContain("{referenceSex === 'female' ? (");
    expect(text).toContain('Where are you in the menopause transition?');
  });

  it('starts unanswered and requires an answer before Continue for the female group only', () => {
    expect(text).toContain("(referenceSex !== 'female' || menopauseStage !== null)");
  });

  it('never persists a stage for other reference groups', () => {
    expect(text).toContain("menopauseStage: draft.referenceSex === 'female' ? draft.menopauseStage : null");
  });

  it('says the stage shapes guidance, never measurements', () => {
    expect(text).toContain("This shapes {BRAND.appName}'s guidance — it never changes how your results are measured.");
  });

  it('offers honest opt-outs and no medical language', () => {
    const options = source('src/profile/types.ts');
    expect(options).toContain("label: 'Neither / not sure'");
    expect(options).toContain("label: 'Prefer not to say'");
    const questionBlock = text.slice(text.indexOf('Where are you in the menopause transition?'));
    expect(questionBlock.slice(0, 1200)).not.toMatch(/medical|diagnos|hormone|HRT|estrogen|bone density|fracture/i);
  });
});
