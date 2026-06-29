import fs from 'fs';
import path from 'path';

import {
  isFitFrameCheckUpRecordingVisualEnabled,
} from '../../config/fitFrameCheckUpRecordingVisual';
import {
  isFitFrameMicroCheckRecordingVisualEnabled,
} from '../../config/fitFrameMicroCheckRecordingVisual';
import {
  isFitFrameMpv2RecordingVisualEnabled,
} from '../../config/fitFrameMpv2RecordingVisual';
import {
  isFitFrameTrainingRecordingVisualEnabled,
} from '../../config/fitFrameTrainingRecordingVisual';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Fit Frame recording visual rollback isolation', () => {
  it('defaults all recording flows to Fit Frame with no env flags set', () => {
    const env = {};

    expect(isFitFrameCheckUpRecordingVisualEnabled(env)).toBe(true);
    expect(isFitFrameMicroCheckRecordingVisualEnabled(env)).toBe(true);
    expect(isFitFrameTrainingRecordingVisualEnabled(env)).toBe(true);
    expect(isFitFrameMpv2RecordingVisualEnabled(env)).toBe(true);
  });

  it('rolls back only the flow whose disable flag is set', () => {
    const env = {
      EXPO_PUBLIC_DISABLE_FIT_FRAME_MICRO_CHECK: '1',
    };

    expect(isFitFrameCheckUpRecordingVisualEnabled(env)).toBe(true);
    expect(isFitFrameMicroCheckRecordingVisualEnabled(env)).toBe(false);
    expect(isFitFrameTrainingRecordingVisualEnabled(env)).toBe(true);
    expect(isFitFrameMpv2RecordingVisualEnabled(env)).toBe(true);
  });

  it('can roll back every recording flow by setting every temporary disable flag', () => {
    const env = {
      EXPO_PUBLIC_DISABLE_FIT_FRAME_CHECKUP: '1',
      EXPO_PUBLIC_DISABLE_FIT_FRAME_MICRO_CHECK: '1',
      EXPO_PUBLIC_DISABLE_FIT_FRAME_TRAINING: '1',
      EXPO_PUBLIC_DISABLE_FIT_FRAME_MPV2: '1',
    };

    expect(isFitFrameCheckUpRecordingVisualEnabled(env)).toBe(false);
    expect(isFitFrameMicroCheckRecordingVisualEnabled(env)).toBe(false);
    expect(isFitFrameTrainingRecordingVisualEnabled(env)).toBe(false);
    expect(isFitFrameMpv2RecordingVisualEnabled(env)).toBe(false);
  });

  it('keeps old opt-in flags out of the documented rollout config', () => {
    const envExample = source('.env.example');

    expect(envExample).toContain('EXPO_PUBLIC_DISABLE_FIT_FRAME_CHECKUP=0');
    expect(envExample).toContain('EXPO_PUBLIC_DISABLE_FIT_FRAME_MICRO_CHECK=0');
    expect(envExample).toContain('EXPO_PUBLIC_DISABLE_FIT_FRAME_TRAINING=0');
    expect(envExample).toContain('EXPO_PUBLIC_DISABLE_FIT_FRAME_MPV2=0');
    expect(envExample).not.toMatch(/EXPO_PUBLIC_ENABLE_FIT_FRAME_(CHECKUP|MICRO_CHECK|TRAINING|MPV2)/);
  });
});
