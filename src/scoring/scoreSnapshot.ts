import type { CheckUp } from '../checkup/types';
import type { CheckUpScore, Domain, DomainResult, MetricRow } from './scoring';
import { scoreCheckUpWithDiagnostics, type CheckUpScoreWithDiagnostics } from './scoring';
import {
  applyFocusSelectionToScore,
  focusSelectionFromUnknown,
  focusSelectionMatchesScore,
  selectFocusFromScore,
  type ScoreFocusSelection,
} from './focusSelection';
import {
  CURRENT_NORM_VERSION,
  CURRENT_SCORING_VERSION,
  SCORE_SNAPSHOT_SCHEMA_VERSION,
  isPositiveIntegerVersion,
} from './versions';

export type ScoreSnapshotCompatibility =
  | 'current'
  | 'legacy_unversioned'
  | 'incompatible_version'
  | 'unsupported_schema'
  | 'invalid_snapshot';

export type ScoreSnapshotPairCompatibility =
  | 'compatible'
  | 'legacy_unversioned'
  | 'incompatible_version'
  | 'unsupported_schema'
  | 'invalid_snapshot'
  | 'missing_snapshot';

export interface JsonSafeMetricRow {
  label: string;
  display: string;
  measured: boolean;
}

export interface JsonSafeDomainResult {
  domain: Domain;
  label: string;
  measured: boolean;
  ageLow: number | null;
  ageHigh: number | null;
  estimated: boolean;
  interpretation: string;
  rows: JsonSafeMetricRow[];
}

export interface JsonSafeCheckUpScore {
  startedAt: string;
  domains: JsonSafeDomainResult[];
  weakestDomain: Domain | null;
}

export interface VersionedCheckUpScoreSnapshot {
  schemaVersion: number;
  scoringVersion: number;
  normVersion: number;
  createdAt: string;
  sourceCheckUpId: string;
  score: JsonSafeCheckUpScore;
  focusSelection?: ScoreFocusSelection;
}

export interface ScoreSnapshotVersionMetadata {
  schemaVersion: number | null;
  scoringVersion: number | null;
  normVersion: number | null;
  sourceCheckUpId?: string;
}

export type ParsedScoreSnapshot =
  | {
      ok: true;
      compatibility: ScoreSnapshotCompatibility;
      snapshot: VersionedCheckUpScoreSnapshot;
      score: CheckUpScore;
    }
  | {
      ok: false;
      compatibility: Exclude<ScoreSnapshotCompatibility, 'current' | 'incompatible_version'>;
    };

export interface CurrentVersionedScoreResult extends CheckUpScoreWithDiagnostics {
  snapshot: VersionedCheckUpScoreSnapshot | null;
}

interface SnapshotOptions {
  createdAt?: string;
  sourceCheckUpId?: string;
  activeFocusDomain?: Domain | null;
  focusSelection?: ScoreFocusSelection | null;
}

const VALID_DOMAINS: readonly Domain[] = ['strength', 'balance', 'mobility'];

export function createCurrentVersionedScoreSnapshot(
  checkUp: CheckUp,
  options: SnapshotOptions = {}
): CurrentVersionedScoreResult {
  const { score, issues } = scoreCheckUpWithDiagnostics(checkUp);
  const focusSelection = selectFocusFromScore(score, {
    activeFocusDomain: options.activeFocusDomain,
  });
  const effectiveScore = applyFocusSelectionToScore(score, focusSelection);
  return {
    score: effectiveScore,
    issues,
    snapshot: toStoredScoreSnapshot(effectiveScore, {
      createdAt: options.createdAt ?? score.startedAt,
      sourceCheckUpId: options.sourceCheckUpId ?? checkUp.startedAt,
      activeFocusDomain: options.activeFocusDomain,
      focusSelection,
    }),
  };
}

export function toStoredScoreSnapshot(
  score: CheckUpScore,
  options: SnapshotOptions = {}
): VersionedCheckUpScoreSnapshot | null {
  const focusSelection =
    options.focusSelection ??
    selectFocusFromScore(score, {
      activeFocusDomain: options.activeFocusDomain,
    });
  const effectiveScore = applyFocusSelectionToScore(score, focusSelection);
  const snapshot: VersionedCheckUpScoreSnapshot = {
    schemaVersion: SCORE_SNAPSHOT_SCHEMA_VERSION,
    scoringVersion: CURRENT_SCORING_VERSION,
    normVersion: CURRENT_NORM_VERSION,
    createdAt: options.createdAt ?? effectiveScore.startedAt,
    sourceCheckUpId: options.sourceCheckUpId ?? effectiveScore.startedAt,
    score: toJsonSafeScore(effectiveScore),
    ...(focusSelection ? { focusSelection } : {}),
  };
  return parseStoredScoreSnapshot(snapshot).ok ? snapshot : null;
}

export function parseStoredScoreSnapshot(value: unknown): ParsedScoreSnapshot {
  const classification = classifyStoredScoreSnapshot(value);
  if (
    classification === 'legacy_unversioned' ||
    classification === 'unsupported_schema' ||
    classification === 'invalid_snapshot'
  ) {
    return { ok: false, compatibility: classification };
  }

  const record = value as VersionedCheckUpScoreSnapshot;
  const parsedFocusSelection =
    'focusSelection' in record ? focusSelectionFromUnknown(record.focusSelection) : null;
  const snapshot: VersionedCheckUpScoreSnapshot =
    parsedFocusSelection
      ? { ...record, focusSelection: parsedFocusSelection }
      : record;
  const score = scoreFromJsonSafeScore(record.score);
  if (!score) return { ok: false, compatibility: 'invalid_snapshot' };
  return {
    ok: true,
    compatibility: classification,
    snapshot,
    score,
  };
}

export function classifyStoredScoreSnapshot(value: unknown): ScoreSnapshotCompatibility {
  if (value === null || value === undefined) return 'legacy_unversioned';
  if (!isRecord(value)) return 'invalid_snapshot';
  if (!('scoringVersion' in value) || !('normVersion' in value)) return 'legacy_unversioned';
  if (!isPositiveIntegerVersion(value.schemaVersion)) return 'invalid_snapshot';
  if (value.schemaVersion !== SCORE_SNAPSHOT_SCHEMA_VERSION) return 'unsupported_schema';
  if (!isPositiveIntegerVersion(value.scoringVersion) || !isPositiveIntegerVersion(value.normVersion)) {
    return 'invalid_snapshot';
  }
  if (typeof value.createdAt !== 'string' || typeof value.sourceCheckUpId !== 'string') {
    return 'invalid_snapshot';
  }
  const score = scoreFromJsonSafeScore(value.score);
  if (!score) return 'invalid_snapshot';
  if ('focusSelection' in value && value.focusSelection !== undefined) {
    const focusSelection = focusSelectionFromUnknown(value.focusSelection);
    if (!focusSelection) return 'invalid_snapshot';
    if (!focusSelectionMatchesScore(score, focusSelection)) return 'invalid_snapshot';
    if (score.weakestDomain !== focusSelection.focusDomain) return 'invalid_snapshot';
  }
  if (value.scoringVersion !== CURRENT_SCORING_VERSION || value.normVersion !== CURRENT_NORM_VERSION) {
    return 'incompatible_version';
  }
  return 'current';
}

export function compareScoreSnapshots(
  a: unknown,
  b: unknown
): ScoreSnapshotPairCompatibility {
  if (a === null || a === undefined || b === null || b === undefined) return 'missing_snapshot';
  const left = parseStoredScoreSnapshot(a);
  const right = parseStoredScoreSnapshot(b);
  if (!left.ok || !right.ok) {
    return pairFailure(left.ok ? left.compatibility : left.compatibility, right.ok ? right.compatibility : right.compatibility);
  }
  if (
    left.snapshot.schemaVersion === right.snapshot.schemaVersion &&
    left.snapshot.scoringVersion === right.snapshot.scoringVersion &&
    left.snapshot.normVersion === right.snapshot.normVersion
  ) {
    return 'compatible';
  }
  return 'incompatible_version';
}

export function scoreSnapshotVersionMetadata(
  value: unknown
): ScoreSnapshotVersionMetadata {
  if (!isRecord(value)) return { schemaVersion: null, scoringVersion: null, normVersion: null };
  return {
    schemaVersion: isPositiveIntegerVersion(value.schemaVersion) ? value.schemaVersion : null,
    scoringVersion: isPositiveIntegerVersion(value.scoringVersion) ? value.scoringVersion : null,
    normVersion: isPositiveIntegerVersion(value.normVersion) ? value.normVersion : null,
    sourceCheckUpId: typeof value.sourceCheckUpId === 'string' ? value.sourceCheckUpId : undefined,
  };
}

export function scoreSnapshotMatchesScore(
  snapshot: VersionedCheckUpScoreSnapshot,
  score: CheckUpScore
): boolean {
  const parsed = parseStoredScoreSnapshot(snapshot);
  if (!parsed.ok) return false;
  return scoresEquivalent(parsed.score, score);
}

export function isCurrentScoreSnapshot(value: unknown): value is VersionedCheckUpScoreSnapshot {
  return classifyStoredScoreSnapshot(value) === 'current';
}

function toJsonSafeScore(score: CheckUpScore): JsonSafeCheckUpScore {
  return {
    startedAt: score.startedAt,
    weakestDomain: isDomain(score.weakestDomain) ? score.weakestDomain : null,
    domains: score.domains.map(toJsonSafeDomain),
  };
}

function toJsonSafeDomain(domain: DomainResult): JsonSafeDomainResult {
  return {
    domain: domain.domain,
    label: domain.label,
    measured: domain.measured,
    ageLow: finiteOrNull(domain.ageLow),
    ageHigh: finiteOrNull(domain.ageHigh),
    estimated: domain.estimated,
    interpretation: domain.interpretation,
    rows: domain.rows.map(toJsonSafeMetricRow),
  };
}

function toJsonSafeMetricRow(row: MetricRow): JsonSafeMetricRow {
  return {
    label: row.label,
    display: row.display,
    measured: row.measured,
  };
}

function scoreFromJsonSafeScore(value: unknown): CheckUpScore | null {
  if (!isRecord(value)) return null;
  if (typeof value.startedAt !== 'string') return null;
  if (!Array.isArray(value.domains)) return null;
  if (!isDomain(value.weakestDomain) && value.weakestDomain !== null) return null;

  const domains: DomainResult[] = [];
  const seen = new Set<Domain>();
  for (const raw of value.domains) {
    const domain = domainFromJson(raw);
    if (!domain) return null;
    if (seen.has(domain.domain)) return null;
    seen.add(domain.domain);
    domains.push(domain);
  }
  if (!VALID_DOMAINS.every((domain) => seen.has(domain))) return null;

  if (value.weakestDomain && !domains.some((domain) => domain.domain === value.weakestDomain && domain.measured)) {
    return null;
  }

  return {
    startedAt: value.startedAt,
    domains: domains.sort((a, b) => VALID_DOMAINS.indexOf(a.domain) - VALID_DOMAINS.indexOf(b.domain)),
    weakestDomain: value.weakestDomain,
  };
}

function domainFromJson(value: unknown): DomainResult | null {
  if (!isRecord(value)) return null;
  if (!isDomain(value.domain)) return null;
  if (typeof value.label !== 'string') return null;
  if (typeof value.measured !== 'boolean') return null;
  if (typeof value.estimated !== 'boolean') return null;
  if (typeof value.interpretation !== 'string') return null;
  if (!Array.isArray(value.rows)) return null;

  const ageLow = jsonNumberToRuntime(value.ageLow);
  const ageHigh = jsonNumberToRuntime(value.ageHigh);
  if (ageLow === undefined || ageHigh === undefined) return null;

  if (value.measured) {
    if (!Number.isFinite(ageLow) || !Number.isFinite(ageHigh) || ageLow > ageHigh) return null;
  }

  const rows: MetricRow[] = [];
  for (const rawRow of value.rows) {
    const row = metricRowFromJson(rawRow);
    if (!row) return null;
    rows.push(row);
  }

  return {
    domain: value.domain,
    label: value.label,
    measured: value.measured,
    ageLow,
    ageHigh,
    estimated: value.estimated,
    interpretation: value.interpretation,
    rows,
  };
}

function metricRowFromJson(value: unknown): MetricRow | null {
  if (!isRecord(value)) return null;
  if (typeof value.label !== 'string' || typeof value.display !== 'string' || typeof value.measured !== 'boolean') {
    return null;
  }
  return {
    label: value.label,
    display: value.display,
    measured: value.measured,
  };
}

function scoresEquivalent(a: CheckUpScore, b: CheckUpScore): boolean {
  if (a.startedAt !== b.startedAt || a.weakestDomain !== b.weakestDomain) return false;
  if (a.domains.length !== b.domains.length) return false;
  return a.domains.every((left, index) => domainsEquivalent(left, b.domains[index]));
}

function domainsEquivalent(a: DomainResult, b: DomainResult): boolean {
  return (
    a.domain === b.domain &&
    a.label === b.label &&
    a.measured === b.measured &&
    sameNumber(a.ageLow, b.ageLow) &&
    sameNumber(a.ageHigh, b.ageHigh) &&
    a.estimated === b.estimated &&
    a.interpretation === b.interpretation &&
    a.rows.length === b.rows.length &&
    a.rows.every((row, index) => metricRowsEquivalent(row, b.rows[index]))
  );
}

function metricRowsEquivalent(a: MetricRow, b: MetricRow): boolean {
  return a.label === b.label && a.display === b.display && a.measured === b.measured;
}

function pairFailure(
  a: ScoreSnapshotCompatibility,
  b: ScoreSnapshotCompatibility
): ScoreSnapshotPairCompatibility {
  if (a === 'invalid_snapshot' || b === 'invalid_snapshot') return 'invalid_snapshot';
  if (a === 'unsupported_schema' || b === 'unsupported_schema') return 'unsupported_schema';
  if (a === 'legacy_unversioned' || b === 'legacy_unversioned') return 'legacy_unversioned';
  return 'incompatible_version';
}

function jsonNumberToRuntime(value: unknown): number | undefined {
  if (value === null) return NaN;
  if (typeof value !== 'number') return undefined;
  return Number.isFinite(value) ? value : undefined;
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sameNumber(a: number, b: number): boolean {
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  return a === b;
}

function isDomain(value: unknown): value is Domain {
  return value === 'strength' || value === 'balance' || value === 'mobility';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
