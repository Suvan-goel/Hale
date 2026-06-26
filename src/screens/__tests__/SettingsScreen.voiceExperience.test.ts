import fs from 'fs';
import path from 'path';

describe('SettingsScreen voice guidance rollback toggle', () => {
  const source = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/screens/SettingsScreen.tsx'), 'utf8');

  it('renders the new voice system toggle, current mode label, and next-session copy', () => {
    const text = source();

    expect(text).toContain('Current system:');
    expect(text).toContain('New voice system');
    expect(text).toContain('Legacy voice system');
    expect(text).toContain('This will apply from your next session.');
    expect(text).toContain('Switch back if anything sounds wrong during testing.');
  });

  it('persists v21_beta on toggle on and legacy on toggle off without approval copy', () => {
    const text = source();

    expect(text).toContain("voiceExperienceMode: enabled ? 'v21_beta' : 'legacy'");
    expect(text).not.toMatch(/approved|production ready|clinically validated|AI voice beta|experimental unsafe/i);
  });
});
