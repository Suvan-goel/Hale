import {
  blockProgress,
  type MovementAssessment,
  type MovementBlock,
  type MovementBlockReport,
  type TrainingSessionCompletion,
} from '../../adherence';
import { supabase } from '../../lib/supabase';
import { addBreadcrumb } from '../observability/sentry';

import { getCurrentSession } from './authService';
import type { BackendJson } from './types';

type BlockReportSyncStatus = 'signed_out' | 'synced' | 'failed' | 'skipped';

export interface MovementBlockReportSyncInput {
  report: MovementBlockReport;
  movementBlock?: MovementBlock | null;
  assessments?: readonly MovementAssessment[];
  baselineAssessment?: MovementAssessment | null;
  retestAssessment?: MovementAssessment | null;
  completions?: readonly TrainingSessionCompletion[];
  movementBlockRemoteId?: string | null;
  fromCheckupRemoteId?: string | null;
  toCheckupRemoteId?: string | null;
}

export interface MovementBlockReportSyncResult {
  status: BlockReportSyncStatus;
  localReportId?: string;
  error?: unknown;
}

interface MovementBlockReportRemotePayload {
  user_id: string;
  movement_block_id?: string | null;
  from_checkup_id?: string | null;
  to_checkup_id?: string | null;
  report_json: BackendJson;
  created_at?: string;
}

interface LinkResolution {
  id?: string | null;
  lookupFailed: boolean;
}

interface ExistingReportResolution {
  id?: string;
  reportJson?: BackendJson;
  lookupFailed: boolean;
}

const inFlightSyncs = new Set<string>();
const successfulFingerprints = new Map<string, string>();

export async function syncMovementBlockReportToRemote(
  input: MovementBlockReportSyncInput
): Promise<MovementBlockReportSyncResult> {
  const localReportId = localReportIdFor(input.report);

  try {
    const session = await getCurrentSession();
    const userId = session?.user.id;
    if (!userId) return { status: 'signed_out', localReportId };

    const syncKey = `${userId}:${localReportId}`;
    if (inFlightSyncs.has(syncKey)) {
      return { status: 'skipped', localReportId };
    }

    inFlightSyncs.add(syncKey);

    try {
      const movementBlockResolution = await resolveMovementBlockId(input, userId);
      const fromCheckupResolution = await resolveCheckupId({
        userId,
        remoteId: input.fromCheckupRemoteId,
        localCheckupId: localCheckupIdForAssessment(
          input.report.baselineAssessmentId,
          input.baselineAssessment,
          input.assessments
        ),
        label: 'from_checkup_id',
      });
      const toCheckupResolution = await resolveCheckupId({
        userId,
        remoteId: input.toCheckupRemoteId,
        localCheckupId: localCheckupIdForAssessment(
          input.report.retestAssessmentId,
          input.retestAssessment,
          input.assessments
        ),
        label: 'to_checkup_id',
      });
      const existingReport = await findExistingRemoteReport(userId, localReportId, {
        movementBlockId: movementBlockResolution.id,
        fromCheckupId: fromCheckupResolution.id,
        toCheckupId: toCheckupResolution.id,
      });

      if (existingReport.lookupFailed) {
        throw new Error(
          `Could not confirm whether local_report_id=${localReportId} already exists; skipped insert to avoid duplicates.`
        );
      }

      const payload = mapLocalBlockReportToRemotePayload(input, userId, {
        movementBlockId: movementBlockResolution.id,
        omitMovementBlockId:
          movementBlockResolution.lookupFailed || (!!existingReport.id && !movementBlockResolution.id),
        fromCheckupId: fromCheckupResolution.id,
        omitFromCheckupId: fromCheckupResolution.lookupFailed || (!!existingReport.id && !fromCheckupResolution.id),
        toCheckupId: toCheckupResolution.id,
        omitToCheckupId: toCheckupResolution.lookupFailed || (!!existingReport.id && !toCheckupResolution.id),
        existingReportJson: existingReport.reportJson,
      });
      const fingerprint = JSON.stringify({ existingId: existingReport.id ?? null, payload });

      if (successfulFingerprints.get(syncKey) === fingerprint) {
        return { status: 'skipped', localReportId };
      }

      if (__DEV__) {
        console.log(`[block-report-sync] started local_report_id=${localReportId}`);
      }
      addBreadcrumb('sync category started', {
        category: 'block_reports',
        localReportId,
      });

      const { error } = existingReport.id
        ? await supabase
            .from('movement_block_reports')
            .update(payload)
            .eq('id', existingReport.id)
            .eq('user_id', userId)
        : await supabase.from('movement_block_reports').insert(payload);

      if (error) throw error;

      successfulFingerprints.set(syncKey, fingerprint);

      if (__DEV__) {
        console.log(`[block-report-sync] synced local_report_id=${localReportId}`);
      }
      addBreadcrumb('sync category succeeded', {
        category: 'block_reports',
        localReportId,
      });

      return { status: 'synced', localReportId };
    } finally {
      inFlightSyncs.delete(syncKey);
    }
  } catch (error) {
    console.warn(`[block-report-sync] Supabase report sync failed for ${localReportId}`, error);
    addBreadcrumb('sync category failed', {
      category: 'block_reports',
      localReportId,
    });
    return { status: 'failed', localReportId, error };
  }
}

export async function syncRecentMovementBlockReportsToRemote(
  reports: readonly MovementBlockReport[],
  options: {
    blocks?: readonly MovementBlock[];
    assessments?: readonly MovementAssessment[];
    completions?: readonly TrainingSessionCompletion[];
    limit?: number;
  } = {}
): Promise<MovementBlockReportSyncResult[]> {
  const recent = reports
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-(options.limit ?? 8));
  const results: MovementBlockReportSyncResult[] = [];

  for (const report of recent) {
    const movementBlock = options.blocks?.find((block) => block.id === report.blockId) ?? null;
    results.push(
      await syncMovementBlockReportToRemote({
        report,
        movementBlock,
        assessments: options.assessments,
        baselineAssessment: assessmentForReportId(report.baselineAssessmentId, options.assessments),
        retestAssessment: assessmentForReportId(report.retestAssessmentId, options.assessments),
        completions: options.completions,
      })
    );
  }

  return results;
}

export function mapLocalBlockReportToRemotePayload(
  input: MovementBlockReportSyncInput,
  userId: string,
  options: {
    movementBlockId?: string | null;
    omitMovementBlockId?: boolean;
    fromCheckupId?: string | null;
    omitFromCheckupId?: boolean;
    toCheckupId?: string | null;
    omitToCheckupId?: boolean;
    existingReportJson?: BackendJson;
  } = {}
): MovementBlockReportRemotePayload {
  const existingReportJson = jsonRecord(options.existingReportJson);
  const movementBlock = input.movementBlock;
  const baselineAssessment =
    input.baselineAssessment ?? assessmentForReportId(input.report.baselineAssessmentId, input.assessments);
  const retestAssessment =
    input.retestAssessment ?? assessmentForReportId(input.report.retestAssessmentId, input.assessments);
  const completions = completionsForReport(input.report, input.completions);

  return omitUndefined({
    user_id: userId,
    movement_block_id: options.omitMovementBlockId ? undefined : options.movementBlockId ?? null,
    from_checkup_id: options.omitFromCheckupId ? undefined : options.fromCheckupId ?? null,
    to_checkup_id: options.omitToCheckupId ? undefined : options.toCheckupId ?? null,
    report_json: toBackendJson({
      ...existingReportJson,
      schemaVersion: 1,
      localReportId: localReportIdFor(input.report),
      report: sanitizeReport(input.report),
      movementBlock: sanitizeMovementBlock(movementBlock) ?? existingReportJson.movementBlock ?? null,
      baselineAssessment: sanitizeAssessment(baselineAssessment) ?? existingReportJson.baselineAssessment ?? null,
      retestAssessment: sanitizeAssessment(retestAssessment) ?? existingReportJson.retestAssessment ?? null,
      progress: progressForReport(input.report, movementBlock, completions),
      completionContext: completions.map(sanitizeCompletion),
      displayCopy: {
        title: 'Your 4-week report',
        summary: input.report.summary,
      },
    }),
    created_at: validIsoLike(input.report.createdAt),
  });
}

async function resolveMovementBlockId(
  input: MovementBlockReportSyncInput,
  userId: string
): Promise<LinkResolution> {
  if (input.movementBlockRemoteId) {
    return { id: input.movementBlockRemoteId, lookupFailed: false };
  }

  const localBlockId = normalizedString(input.report.blockId ?? input.movementBlock?.id);
  if (!localBlockId) return { id: null, lookupFailed: false };

  const { data, error } = await supabase
    .from('movement_blocks')
    .select('id')
    .eq('user_id', userId)
    .eq('local_block_id', localBlockId)
    .maybeSingle();

  if (error) {
    console.warn(`[block-report-sync] movement block lookup failed for local_block_id=${localBlockId}`, error);
    return { lookupFailed: true };
  }

  return { id: normalizedString(data?.id) ?? null, lookupFailed: false };
}

async function resolveCheckupId({
  userId,
  remoteId,
  localCheckupId,
  label,
}: {
  userId: string;
  remoteId?: string | null;
  localCheckupId?: string | null;
  label: string;
}): Promise<LinkResolution> {
  if (remoteId) {
    return { id: remoteId, lookupFailed: false };
  }

  const localId = normalizedString(localCheckupId);
  if (!localId) return { id: null, lookupFailed: false };

  const { data, error } = await supabase
    .from('movement_checkups')
    .select('id')
    .eq('user_id', userId)
    .eq('local_checkup_id', localId)
    .maybeSingle();

  if (error) {
    console.warn(`[block-report-sync] ${label} lookup failed for local_checkup_id=${localId}`, error);
    return { lookupFailed: true };
  }

  return { id: normalizedString(data?.id) ?? null, lookupFailed: false };
}

async function findExistingRemoteReport(
  userId: string,
  localReportId: string,
  links: {
    movementBlockId?: string | null;
    fromCheckupId?: string | null;
    toCheckupId?: string | null;
  }
): Promise<ExistingReportResolution> {
  const byLocalReportId = await supabase
    .from('movement_block_reports')
    .select('id, report_json, local_report_id')
    .eq('user_id', userId)
    .eq('local_report_id', localReportId)
    .limit(1)
    .maybeSingle();

  if (byLocalReportId.error) {
    console.warn(
      `[block-report-sync] existing report lookup failed for local_report_id=${localReportId}`,
      byLocalReportId.error
    );
    return { lookupFailed: true };
  }

  if (byLocalReportId.data?.id) {
    return {
      id: normalizedString(byLocalReportId.data.id),
      reportJson: isBackendJson(byLocalReportId.data.report_json) ? byLocalReportId.data.report_json : undefined,
      lookupFailed: false,
    };
  }

  if (!links.movementBlockId || !links.fromCheckupId || !links.toCheckupId) {
    return { lookupFailed: false };
  }

  const byLinks = await supabase
    .from('movement_block_reports')
    .select('id, report_json')
    .eq('user_id', userId)
    .eq('movement_block_id', links.movementBlockId)
    .eq('from_checkup_id', links.fromCheckupId)
    .eq('to_checkup_id', links.toCheckupId)
    .limit(1)
    .maybeSingle();

  if (byLinks.error) {
    console.warn(`[block-report-sync] existing report lookup by linked ids failed`, byLinks.error);
    return { lookupFailed: true };
  }

  return {
    id: normalizedString(byLinks.data?.id),
    reportJson: isBackendJson(byLinks.data?.report_json) ? byLinks.data.report_json : undefined,
    lookupFailed: false,
  };
}

function assessmentForReportId(
  reportAssessmentId: string | undefined,
  assessments: readonly MovementAssessment[] | undefined
): MovementAssessment | null {
  if (!reportAssessmentId || !assessments) return null;
  return (
    assessments.find((assessment) => assessment.id === reportAssessmentId) ??
    assessments.find((assessment) => assessment.results?.rawMetrics?.checkUpId === reportAssessmentId) ??
    null
  );
}

function localCheckupIdForAssessment(
  reportAssessmentId: string | undefined,
  assessment: MovementAssessment | null | undefined,
  assessments: readonly MovementAssessment[] | undefined
): string | undefined {
  const resolvedAssessment = assessment ?? assessmentForReportId(reportAssessmentId, assessments);
  const rawCheckupId = normalizedString(resolvedAssessment?.results?.rawMetrics?.checkUpId);
  if (rawCheckupId) return rawCheckupId;

  const explicit = normalizedString(reportAssessmentId);
  if (!explicit || explicit.startsWith('assessment-')) return undefined;
  return explicit;
}

function completionsForReport(
  report: MovementBlockReport,
  completions: readonly TrainingSessionCompletion[] | undefined
): TrainingSessionCompletion[] {
  return (completions ?? [])
    .filter((completion) => completion.blockId === report.blockId)
    .slice()
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

function progressForReport(
  report: MovementBlockReport,
  movementBlock: MovementBlock | null | undefined,
  completions: readonly TrainingSessionCompletion[]
): BackendJson {
  const computed = movementBlock ? blockProgress(movementBlock, completions) : null;
  return sanitizeForBackendJson({
    sessionsCompleted: computed?.completedSessions ?? report.sessionsCompleted,
    totalPlannedSessions: computed?.totalSessions ?? report.totalPlannedSessions,
    microChecksCompleted: computed?.microChecksCompleted ?? report.microChecksCompleted,
  });
}

function localReportIdFor(report: MovementBlockReport): string {
  const explicit = normalizedString(report.id);
  if (explicit) return explicit;
  return `block-report-${stableHash(JSON.stringify(sanitizeReport(report)))}`;
}

function sanitizeReport(report: MovementBlockReport): BackendJson {
  return sanitizeForBackendJson({
    id: report.id,
    blockId: report.blockId,
    baselineAssessmentId: report.baselineAssessmentId,
    retestAssessmentId: report.retestAssessmentId,
    createdAt: report.createdAt,
    summary: report.summary,
    sessionsCompleted: report.sessionsCompleted,
    totalPlannedSessions: report.totalPlannedSessions,
    microChecksCompleted: report.microChecksCompleted,
    domainChanges: report.domainChanges,
    comparison: report.comparison,
    recommendedNextFocusDomain: report.recommendedNextFocusDomain,
  });
}

function sanitizeMovementBlock(block: MovementBlock | null | undefined): BackendJson {
  if (!block) return null;
  return sanitizeForBackendJson({
    id: block.id,
    status: block.status,
    focusDomain: block.focusDomain,
    secondaryDomains: block.secondaryDomains,
    startDate: block.startDate,
    endDate: block.endDate,
    retestDate: block.retestDate,
    totalPlannedSessions: block.totalPlannedSessions,
    completedSessions: block.completedSessions,
    microChecksCompleted: block.microChecksCompleted,
    focusSelectionKind: block.focusSelectionKind,
    focusTiedDomains: block.focusTiedDomains,
    focusTieBreakReason: block.focusTieBreakReason,
    focusNearTieMarginYears: block.focusNearTieMarginYears,
    focusSelectionPolicyVersion: block.focusSelectionPolicyVersion,
    sourceAssessmentId: block.sourceAssessmentId,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
  });
}

function sanitizeAssessment(assessment: MovementAssessment | null | undefined): BackendJson {
  if (!assessment) return null;
  return sanitizeForBackendJson({
    id: assessment.id,
    type: assessment.type,
    status: assessment.status,
    completedAt: assessment.completedAt,
    sourceBlockId: assessment.sourceBlockId,
    isOfficialForProgress: assessment.isOfficialForProgress,
    results: assessment.results,
  });
}

function sanitizeCompletion(completion: TrainingSessionCompletion): BackendJson {
  return sanitizeForBackendJson({
    id: completion.id,
    blockId: completion.blockId,
    completedAt: completion.completedAt,
    sessionType: completion.sessionType,
    focusDomain: completion.focusDomain,
    source: completion.source,
    templateId: completion.templateId,
    mainPlanCredit: completion.mainPlanCredit,
    workEvidence: completion.workEvidence,
    focusStimulusEvidence: completion.focusStimulusEvidence,
    durationMinutes: completion.durationMinutes,
    perceivedEffort: completion.perceivedEffort,
    painReported: completion.painReported,
  });
}

function validIsoLike(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function normalizedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function jsonRecord(value: unknown): Record<string, BackendJson> {
  return !!value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, BackendJson>) : {};
}

function isBackendJson(value: unknown): value is BackendJson {
  if (value === null) return true;
  if (typeof value === 'boolean' || typeof value === 'string') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isBackendJson);
  if (typeof value === 'object') return Object.values(value).every(isBackendJson);
  return false;
}

function sanitizeForBackendJson(value: unknown, key = ''): BackendJson {
  if (isSensitivePayloadKey(key)) return null;
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map((item) => sanitizeForBackendJson(item));
  if (typeof value === 'object') {
    const out: Record<string, BackendJson> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      if (isSensitivePayloadKey(childKey)) continue;
      out[childKey] = sanitizeForBackendJson(childValue, childKey);
    }
    return out;
  }
  return null;
}

function isSensitivePayloadKey(key: string): boolean {
  return /(^|_)(frame|frames|landmark|landmarks|video|image|base64|uri|path)$/i.test(key);
}

function toBackendJson(value: unknown): BackendJson {
  return sanitizeForBackendJson(value);
}

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) out[key] = item;
  }
  return out as T;
}

function stableHash(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
