import {
  isDevMockDataAllowed,
  isDiagnosticsDeveloperSurfaceAllowed,
  isInternalHarnessSurfaceAllowed,
  isReleaseGatedFlowAllowed,
} from '../releaseSurfacePolicy';

describe('release surface policy', () => {
  it('blocks developer flows outside dev runtime even when flags are true', () => {
    expect(isReleaseGatedFlowAllowed('dev-live', { dev: false })).toBe(false);
    expect(
      isReleaseGatedFlowAllowed('dev-live', {
        dev: false,
        poseLatencyDiagnosticsEnabled: true,
      })
    ).toBe(false);
  });

  it('allows the dev live flow only in a dev runtime', () => {
    expect(isReleaseGatedFlowAllowed('dev-live', { dev: true })).toBe(true);
    expect(
      isDiagnosticsDeveloperSurfaceAllowed({
        dev: true,
        poseLatencyDiagnosticsEnabled: true,
      })
    ).toBe(true);
    expect(
      isDiagnosticsDeveloperSurfaceAllowed({
        dev: true,
        poseLatencyDiagnosticsEnabled: false,
      })
    ).toBe(false);
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
