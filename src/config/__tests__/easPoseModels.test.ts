import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('EAS pose model assets', () => {
  it('downloads and verifies MediaPipe models before EAS native generation', () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));

    expect(packageJson.scripts['eas-build-pre-install']).toContain('scripts/download-models.sh');
    expect(packageJson.scripts['eas-build-pre-install']).toContain('scripts/verify-pose-models.sh');
    expect(packageJson.scripts['build:android:beta']).toContain('scripts/download-models.sh');
    expect(packageJson.scripts['build:android:beta']).toContain('verify:pose-models');
  });

  it('keeps the pose-model verifier pointed at both native asset folders', () => {
    const verifier = readFileSync(join(process.cwd(), 'scripts/verify-pose-models.sh'), 'utf8');

    expect(verifier).toContain('modules/expo-pose-detection/android/src/main/assets');
    expect(verifier).toContain('modules/expo-pose-detection/ios/assets');
    expect(verifier).toContain('pose_landmarker_${variant}.task');
    expect(verifier).toContain('check_model lite');
    expect(verifier).toContain('check_model full');
  });
});
