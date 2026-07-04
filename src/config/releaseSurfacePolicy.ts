export interface RuntimeSurfacePolicyInput {
  dev?: boolean;
  poseLatencyDiagnosticsEnabled?: boolean;
  internalEnabled?: boolean;
}

export function isDeveloperRuntime(input: Pick<RuntimeSurfacePolicyInput, 'dev'> = {}): boolean {
  return input.dev ?? defaultDevMode();
}

export function isDevMockDataAllowed(input: Pick<RuntimeSurfacePolicyInput, 'dev'> = {}): boolean {
  return isDeveloperRuntime(input);
}

export function isInternalHarnessSurfaceAllowed(input: RuntimeSurfacePolicyInput): boolean {
  return isDeveloperRuntime(input) && input.internalEnabled === true;
}

export function isDiagnosticsDeveloperSurfaceAllowed(input: RuntimeSurfacePolicyInput): boolean {
  return isDeveloperRuntime(input) && input.poseLatencyDiagnosticsEnabled === true;
}

function defaultDevMode(): boolean {
  return typeof __DEV__ === 'boolean' && __DEV__;
}
