export type ReleaseGatedFlow =
  | 'fit-frame-pose-trace-preview'
  | 'pose-benchmark'
  | 'dev-live';

export interface RuntimeSurfacePolicyInput {
  dev?: boolean;
  poseLatencyDiagnosticsEnabled?: boolean;
  internalEnabled?: boolean;
}

const DIAGNOSTIC_FLOWS = new Set<string>([
  'fit-frame-pose-trace-preview',
  'pose-benchmark',
]);
const DEV_ONLY_FLOWS = new Set<string>(['dev-live']);

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

export function isReleaseGatedFlowAllowed(
  flow: string | null | undefined,
  input: RuntimeSurfacePolicyInput
): boolean {
  if (!flow) return true;
  if (DEV_ONLY_FLOWS.has(flow)) return isDeveloperRuntime(input);
  if (DIAGNOSTIC_FLOWS.has(flow)) return isDiagnosticsDeveloperSurfaceAllowed(input);
  return true;
}

function defaultDevMode(): boolean {
  return typeof __DEV__ === 'boolean' && __DEV__;
}
