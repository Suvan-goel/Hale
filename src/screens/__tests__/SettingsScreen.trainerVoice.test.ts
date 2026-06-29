import fs from 'fs';
import path from 'path';

describe('SettingsScreen trainer voice', () => {
  const source = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/screens/SettingsScreen.tsx'), 'utf8');

  it('renders the trainer voice picker without the retired system cards', () => {
    const text = source();
    const voiceSectionStart = text.indexOf("if (openSection === 'voice')");
    const voiceSectionEnd = text.indexOf("if (openSection === 'equipment')");
    const voiceSection = text.slice(voiceSectionStart, voiceSectionEnd);

    expect(text).toContain('Tap a voice to use it next time.');
    expect(text).toContain('selectedVoiceLabel');
    expect(voiceSection).toContain('<VoiceSelectorCard');
    expect(voiceSection).not.toContain('<DetailOverview');
    expect(voiceSection).not.toContain('<DetailCard');
    expect(voiceSection).not.toContain('<ToggleRow');
  });

  it('keeps voice selection separate from retired runtime settings', () => {
    const text = source();

    expect(text).toContain('onSettingsChange({ ...settings, voiceId })');
    expect(text).not.toContain(['voiceExperience', 'Mode'].join(''));
    expect(text).not.toMatch(/approved|production ready|clinically validated|AI voice beta|experimental unsafe/i);
  });
});
