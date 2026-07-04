import {
  isDevMockDataAllowed,
  isDiagnosticsDeveloperSurfaceAllowed,
  isInternalHarnessSurfaceAllowed,
} from '../releaseSurfacePolicy';

describe('release surface policy', () => {
  it('gates diagnostics surfaces on a dev runtime plus the explicit flag', () => {
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
    expect(
      isDiagnosticsDeveloperSurfaceAllowed({
        dev: false,
        poseLatencyDiagnosticsEnabled: true,
      })
    ).toBe(false);
  });

  it('keeps dev mock data and internal harness surfaces out of release runtimes', () => {
    expect(isDevMockDataAllowed({ dev: false })).toBe(false);
    expect(isDevMockDataAllowed({ dev: true })).toBe(true);
    expect(isInternalHarnessSurfaceAllowed({ dev: false, internalEnabled: true })).toBe(false);
    expect(isInternalHarnessSurfaceAllowed({ dev: true, internalEnabled: true })).toBe(true);
  });
});
