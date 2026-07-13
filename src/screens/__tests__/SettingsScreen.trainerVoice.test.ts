import fs from 'fs';
import path from 'path';

describe('SettingsScreen trainer voice', () => {
  const source = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/screens/SettingsScreen.tsx'), 'utf8');

  it('renders the trainer voice picker without the retired system cards', () => {
    const text = source();
    const workoutSectionStart = text.indexOf("if (openSection === 'workout')");
    const workoutSectionEnd = text.indexOf("if (openSection === 'account')");
    const workoutSection = text.slice(workoutSectionStart, workoutSectionEnd);

    expect(text).toContain('Tap the speaker to preview. Tap a name to use that voice next time.');
    expect(text).toContain('Trainer voice');
    expect(text).toContain('selectedVoiceLabel');
    expect(workoutSection).toContain('<VoiceSelectorCard');
    expect(workoutSection).toContain('<SessionFeelPicker');
    expect(workoutSection).not.toContain('Preferred workout days');
    expect(workoutSection).not.toContain('onToggleAvailableEquipment');
  });

  it('keeps voice selection separate from retired runtime settings', () => {
    const text = source();

    expect(text).toContain('onSettingsChange({ ...settings, voiceId })');
    expect(text).not.toContain(['voiceExperience', 'Mode'].join(''));
    expect(text).not.toMatch(/approved|production ready|clinically validated|AI voice beta|experimental unsafe/i);
  });
});
