import {
  isDevMockDataAllowed,
  isDiagnosticsDeveloperSurfaceAllowed,
  isInternalHarnessSurfaceAllowed,
  isReleaseGatedFlowAllowed,
} from '../releaseSurfacePolicy';

describe('release surface policy', () => {
  it('blocks developer and diagnostics flows outside dev runtime even when flags are true', () => {
    expect(
      isReleaseGatedFlowAllowed('fit-frame-pose-trace-preview', {
        dev: false,
        poseLatencyDiagnosticsEnabled: true,
      })
    ).toBe(false);
    expect(
      isReleaseGatedFlowAllowed('pose-benchmark', {
        dev: false,
        poseLatencyDiagnosticsEnabled: true,
      })
    ).toBe(false);
    expect(isReleaseGatedFlowAllowed('dev-live', { dev: false })).toBe(false);
  });

  it('allows diagnostics flows only when both dev runtime and diagnostics are enabled', () => {
    expect(
      isReleaseGatedFlowAllowed('fit-frame-pose-trace-preview', {
        dev: true,
        poseLatencyDiagnosticsEnabled: false,
      })
    ).toBe(false);
    expect(
      isReleaseGatedFlowAllowed('fit-frame-pose-trace-preview', {
        dev: true,
        poseLatencyDiagnosticsEnabled: true,
      })
    ).toBe(true);
    expect(
      isDiagnosticsDeveloperSurfaceAllowed({
        dev: true,
        poseLatencyDiagnosticsEnabled: true,
      })
    ).toBe(true);
  });

  it('keeps normal product flows allowed while blocking release-only developer surfaces', () => {
    expect(isReleaseGatedFlowAllowed(null, { dev: false })).toBe(true);
    expect(isReleaseGatedFlowAllowed('settings', { dev: false })).toBe(true);
    expect(isReleaseGatedFlowAllowed('movement-profile-v2-unified-checkup', { dev: false })).toBe(true);
    expect(isDevMockDataAllowed({ dev: false })).toBe(false);
    expect(isInternalHarnessSurfaceAllowed({ dev: false, internalEnabled: true })).toBe(false);
    expect(isInternalHarnessSurfaceAllowed({ dev: true, internalEnabled: true })).toBe(true);
  });
});
