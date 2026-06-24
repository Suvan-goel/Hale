import type {
  AdherenceStoreState,
  MovementAssessment,
  MovementBlock,
  MovementBlockReport,
  SupportConnection,
  TrainingSessionCompletion,
} from './types';
import { isMovementDomain } from './blockFocus';

export const ADHERENCE_SCHEMA_VERSION = 3;

interface Envelope {
  schemaVersion: number;
  payload: AdherenceStoreState;
}

export function defaultAdherenceStoreState(): AdherenceStoreState {
  return {
    blocks: [],
    assessments: [],
    reports: [],
    completions: [],
    milestones: [],
    supportConnections: [],
    notificationEvents: [],
    weeklySummaries: [],
  };
}

export function serializeAdherenceState(state: AdherenceStoreState): string {
  const env: Envelope = { schemaVersion: ADHERENCE_SCHEMA_VERSION, payload: state };
  return JSON.stringify(env);
}

export function deserializeAdherenceState(json: string): AdherenceStoreState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const env = parsed as Partial<Envelope>;
  if (
    (env.schemaVersion !== 1 && env.schemaVersion !== 2 && env.schemaVersion !== ADHERENCE_SCHEMA_VERSION) ||
    !env.payload ||
    typeof env.payload !== 'object'
  ) {
    return null;
  }
  const payload = env.payload as Partial<AdherenceStoreState>;
  return {
    blocks: Array.isArray(payload.blocks)
      ? payload.blocks.map(normalizeMovementBlock).filter((block): block is MovementBlock => !!block)
      : [],
    assessments: Array.isArray(payload.assessments) ? payload.assessments.filter(isMovementAssessment) : [],
    reports: Array.isArray(payload.reports) ? payload.reports.filter(isMovementBlockReport) : [],
    completions: Array.isArray(payload.completions) ? payload.completions.filter(isCompletion) : [],
    milestones: Array.isArray(payload.milestones) ? payload.milestones : [],
    supportConnections: Array.isArray(payload.supportConnections) ? payload.supportConnections.filter(isSupportConnection) : [],
    notificationEvents: Array.isArray(payload.notificationEvents) ? payload.notificationEvents : [],
    weeklySummaries: Array.isArray(payload.weeklySummaries) ? payload.weeklySummaries : [],
  };
}

function isMovementAssessment(v: unknown): v is MovementAssessment {
  if (!v || typeof v !== 'object') return false;
  const a = v as Partial<MovementAssessment>;
  return (
    typeof a.id === 'string' &&
    typeof a.userId === 'string' &&
    typeof a.type === 'string' &&
    typeof a.status === 'string' &&
    typeof a.createdAt === 'string' &&
    typeof a.isOfficialForProgress === 'boolean'
  );
}

function isMovementBlockReport(v: unknown): v is MovementBlockReport {
  if (!v || typeof v !== 'object') return false;
  const r = v as Partial<MovementBlockReport>;
  return (
    typeof r.id === 'string' &&
    typeof r.userId === 'string' &&
    typeof r.blockId === 'string' &&
    typeof r.createdAt === 'string' &&
    typeof r.summary === 'string'
  );
}

function normalizeMovementBlock(v: unknown): MovementBlock | null {
  if (!v || typeof v !== 'object') return null;
  const b = v as Partial<MovementBlock>;
  const focus = normalizeMovementBlockFocusCandidate(b);
  const valid =
    typeof b.id === 'string' &&
    typeof b.userId === 'string' &&
    typeof b.startDate === 'string' &&
    typeof b.retestDate === 'string' &&
    !!focus &&
    typeof b.totalPlannedSessions === 'number';
  if (!valid) return null;
  const { sourceAssessmentId: _legacySourceAssessmentId, ...rest } = b;
  const focusDomain = focus.kind === 'domain' ? focus.domain : undefined;
  return {
    ...(rest as MovementBlock),
    focus,
    focusDomain,
    ...(typeof b.sourceCheckUpId === 'string'
      ? { sourceCheckUpId: b.sourceCheckUpId }
      : typeof b.sourceAssessmentId === 'string'
        ? { sourceCheckUpId: b.sourceAssessmentId }
        : {}),
  };
}

function normalizeMovementBlockFocusCandidate(block: Partial<MovementBlock>): MovementBlock['focus'] | null {
  if (isMovementDomain(block.focusDomain)) return { kind: 'domain', domain: block.focusDomain };
  if (block.focus?.kind === 'domain' && isMovementDomain(block.focus.domain)) {
    return { kind: 'domain', domain: block.focus.domain };
  }
  if (
    block.focus?.kind === 'balanced' &&
    typeof block.focus.balancedPolicyVersion === 'number' &&
    typeof block.focus.balancedPolicyFingerprint === 'string' &&
    block.focus.balancedPolicyFingerprint.length > 0
  ) {
    return {
      kind: 'balanced',
      balancedPolicyVersion: block.focus.balancedPolicyVersion,
      balancedPolicyFingerprint: block.focus.balancedPolicyFingerprint,
    };
  }
  return null;
}

function isCompletion(v: unknown): v is TrainingSessionCompletion {
  if (!v || typeof v !== 'object') return false;
  const c = v as Partial<TrainingSessionCompletion>;
  return typeof c.id === 'string' && typeof c.blockId === 'string' && typeof c.completedAt === 'string';
}

function isSupportConnection(v: unknown): v is SupportConnection {
  if (!v || typeof v !== 'object') return false;
  const c = v as Partial<SupportConnection>;
  return typeof c.id === 'string' && typeof c.userId === 'string' && typeof c.sharingLevel === 'string';
}
