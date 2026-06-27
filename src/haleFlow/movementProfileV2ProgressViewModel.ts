import type {
  MovementBlock,
  MovementBlockFocus,
  MovementBlockReport,
  MovementDomain,
  MovementProfileV2BlockReport,
} from '../adherence';
import type { StoredCheckUp, StoredCheckUpType } from '../history';
import {
  buildMovementProfileV2ResultsViewModel,
  type MovementProfileV2Domain,
} from '../movementProfileV2/viewModel';
import { type MovementProfileV2Assessment } from '../reference/movementProfileV2';
import type { StoredMovementProfileV2Snapshot } from '../reference/movementProfileV2';
import {
  officialMovementProfileV2AssessmentSelection,
  type OfficialMovementProfileV2AssessmentRecord,
} from './checkupHistory';
import {
  isMovementProfileV2BlockReport,
  parseMovementProfileV2BlockReport,
} from './movementProfileV2BlockReport';

export type MovementProfileV2ProgressStatus =
  | 'ready'
  | 'no_profile'
  | 'pending_reference_details'
  | 'pending_artifact_materialisation'
  | 'needs_retake'
  | 'artifact_recovery'
  | 'active_block_conflict';

export interface MovementProfileV2ProgressAction {
  id:
    | 'start_movement_checkup'
    | 'continue_movement_profile'
    | 'view_movement_profile'
    | 'view_block_report';
  label: string;
  targetId?: string;
}

export interface MovementProfileV2ProgressDomainSummary {
  domain: MovementProfileV2Domain;
  title: string;
  metric: string;
  interpretation: string;
  body: string;
}

export interface MovementProfileV2ProgressHero {
  profileId: string;
  dateLabel: string;
  title: string;
  focusKind: 'domain' | 'balanced';
  focusTitle: string;
  focusBody: string;
  domains: readonly MovementProfileV2ProgressDomainSummary[];
}

export interface MovementProfileV2HistoryEntry {
  id: string;
  sourceType: Extract<StoredCheckUpType, 'baseline' | 'baseline_retake' | 'official_retest'>;
  sourceLabel: string;
  dateLabel: string;
  focusTitle: string;
  metrics: readonly string[];
  hasReport: boolean;
  action: MovementProfileV2ProgressAction;
}

export interface MovementProfileV2ReportHistoryEntry {
  id: string;
  blockId: string;
  completedAtLabel: string;
  priorFocusTitle: string;
  currentFocusTitle: string;
  sessionsLabel: string;
  action: MovementProfileV2ProgressAction;
}

export interface MovementProfileV2ProgressDiagnostic {
  code:
    | 'progress_v2_latest_profile_selected'
    | 'progress_v2_history_conflict'
    | 'progress_v2_report_invalid'
    | 'progress_v2_pending_continuation'
    | 'progress_v2_malformed_artifact';
  checkUpId?: string;
  snapshotId?: string;
  assessmentId?: string;
  reportId?: string;
  blockId?: string;
  reason?: string;
}

export interface MovementProfileV2ProgressAuthorityFacts {
  acceptedProfileIds: readonly string[];
  v2BlockIds: readonly string[];
  acceptedReportIds: readonly string[];
  hasPendingContinuation: boolean;
  hasMalformedState: boolean;
}

export type MovementProfileV2ProgressViewModel =
  | {
      status: 'ready';
      authorityFacts: MovementProfileV2ProgressAuthorityFacts;
      hero: MovementProfileV2ProgressHero;
      officialHistory: readonly MovementProfileV2HistoryEntry[];
      reports: readonly MovementProfileV2ReportHistoryEntry[];
      actions: readonly MovementProfileV2ProgressAction[];
      diagnostics: readonly MovementProfileV2ProgressDiagnostic[];
    }
  | {
      status: Exclude<MovementProfileV2ProgressStatus, 'ready'>;
      authorityFacts: MovementProfileV2ProgressAuthorityFacts;
      recovery: {
        title: string;
        body: string;
      };
      actions: readonly MovementProfileV2ProgressAction[];
      diagnostics: readonly MovementProfileV2ProgressDiagnostic[];
      officialHistory: readonly MovementProfileV2HistoryEntry[];
      reports: readonly MovementProfileV2ReportHistoryEntry[];
    };

export interface MovementProfileV2ProgressInput {
  history: readonly StoredCheckUp[] | null | undefined;
  blocks: readonly MovementBlock[] | null | undefined;
  reports: readonly MovementBlockReport[] | null | undefined;
  today: string;
  pendingV2RawCheckUpId?: string | null;
}

type AcceptedProfile = OfficialMovementProfileV2AssessmentRecord;

export function buildMovementProfileV2ProgressViewModel(
  input: MovementProfileV2ProgressInput
): MovementProfileV2ProgressViewModel {
  const history = input.history ?? [];
  const blocks = input.blocks ?? [];
  const reports = input.reports ?? [];
  const selection = officialMovementProfileV2AssessmentSelection(history);
  const acceptedProfiles = sortProfiles(selection.records);
  const acceptedReports = selectMovementProfileV2ReportHistory({
    reports,
    profiles: acceptedProfiles,
  });
  const malformed = collectMalformedDiagnostics({
    history,
    reports,
    selectionConflictCount: selection.conflicts.length,
  });
  const diagnostics: MovementProfileV2ProgressDiagnostic[] = [
    ...selection.conflicts.map((conflict) => ({
      code: 'progress_v2_history_conflict' as const,
      checkUpId: conflict.rejected.record.checkUp.startedAt,
      snapshotId: conflict.rejected.snapshot.snapshotId,
      assessmentId: conflict.assessmentId,
      reason: conflict.diagnostic.code,
    })),
    ...malformed,
    ...acceptedReports.diagnostics,
  ];
  const authorityFacts: MovementProfileV2ProgressAuthorityFacts = {
    acceptedProfileIds: acceptedProfiles.map((profile) => profile.assessment.sourceCheckUpId),
    v2BlockIds: blocks
      .filter((block) => block.origin?.kind === 'movement_profile_v2_assessment')
      .map((block) => block.id),
    acceptedReportIds: acceptedReports.acceptedReports.map((report) => report.id),
    hasPendingContinuation: !!input.pendingV2RawCheckUpId,
    hasMalformedState: malformed.length > 0 || selection.conflicts.length > 0,
  };
  const officialHistory = buildOfficialHistory(acceptedProfiles, acceptedReports.entries);

  if (input.pendingV2RawCheckUpId) {
    return {
      status: 'pending_reference_details',
      authorityFacts,
      recovery: {
        title: 'Finish your Movement Profile',
        body: 'Your Check-Up is saved.',
      },
      actions: [{ id: 'continue_movement_profile', label: 'Continue', targetId: input.pendingV2RawCheckUpId }],
      diagnostics: [
        ...diagnostics,
        {
          code: 'progress_v2_pending_continuation',
          checkUpId: input.pendingV2RawCheckUpId,
        },
      ],
      officialHistory,
      reports: acceptedReports.entries,
    };
  }

  const latest = acceptedProfiles[acceptedProfiles.length - 1] ?? null;
  if (!latest) {
    const hasV2State =
      authorityFacts.v2BlockIds.length > 0 ||
      authorityFacts.acceptedReportIds.length > 0 ||
      authorityFacts.hasMalformedState;
    if (hasV2State) {
      return {
        status: authorityFacts.v2BlockIds.length > 0 ? 'active_block_conflict' : 'artifact_recovery',
        authorityFacts,
        recovery: {
          title: 'Movement Profile needs attention',
          body: 'Your saved Movement Profile data is still on this phone, but Hale cannot safely show it here yet.',
        },
        actions: [],
        diagnostics,
        officialHistory,
        reports: acceptedReports.entries,
      };
    }
    return {
      status: 'no_profile',
      authorityFacts,
      recovery: {
        title: 'Complete your Movement Check-Up',
        body: 'Your Movement Profile will appear here after your Check-Up.',
      },
      actions: [{ id: 'start_movement_checkup', label: 'Start Movement Check-Up' }],
      diagnostics,
      officialHistory,
      reports: acceptedReports.entries,
    };
  }

  const profileViewModel = buildMovementProfileV2ResultsViewModel({
    snapshot: latest.snapshot,
    assessment: latest.assessment,
  });
  if (profileViewModel.focus.kind === 'needs_retake') {
    return {
      status: 'needs_retake',
      authorityFacts,
      recovery: {
        title: 'Retake your Movement Check-Up',
        body: 'Your latest Check-Up is saved, but Hale needs a retake before showing a Movement Profile.',
      },
      actions: [{ id: 'start_movement_checkup', label: 'Start Movement Check-Up' }],
      diagnostics,
      officialHistory,
      reports: acceptedReports.entries,
    };
  }

  const hero: MovementProfileV2ProgressHero = {
    profileId: latest.assessment.sourceCheckUpId,
    dateLabel: profileViewModel.dateLabel,
    title: 'Movement Profile',
    focusKind: profileViewModel.focus.kind,
    focusTitle: profileViewModel.focus.title,
    focusBody: profileViewModel.focus.body,
    domains: profileViewModel.domainCards.map((card) => ({
      domain: card.domain,
      title: card.title,
      metric: card.metric,
      interpretation: card.status,
      body: card.body,
    })),
  };

  const actions: MovementProfileV2ProgressAction[] = [
    { id: 'view_movement_profile', label: 'View Movement Profile', targetId: latest.assessment.sourceCheckUpId },
  ];

  diagnostics.push({
    code: 'progress_v2_latest_profile_selected',
    checkUpId: latest.assessment.sourceCheckUpId,
    snapshotId: latest.snapshot.snapshotId,
    assessmentId: latest.assessment.assessmentId,
  });

  return {
    status: 'ready',
    authorityFacts,
    hero,
    officialHistory,
    reports: acceptedReports.entries,
    actions,
    diagnostics,
  };
}

export function latestMovementProfileV2ProgressProfile(
  history: readonly StoredCheckUp[] | null | undefined
): AcceptedProfile | null {
  const records = sortProfiles(officialMovementProfileV2AssessmentSelection(history).records);
  return records[records.length - 1] ?? null;
}

export function movementProfileV2ProgressProfileBySourceCheckUpId(
  history: readonly StoredCheckUp[] | null | undefined,
  sourceCheckUpId: string
): AcceptedProfile | null {
  return sortProfiles(officialMovementProfileV2AssessmentSelection(history).records).find(
    (profile) => profile.assessment.sourceCheckUpId === sourceCheckUpId
  ) ?? null;
}

export function movementProfileV2ProgressReportById(
  reports: readonly MovementBlockReport[] | null | undefined,
  history: readonly StoredCheckUp[] | null | undefined,
  reportId: string
): MovementProfileV2BlockReport | null {
  const profiles = sortProfiles(officialMovementProfileV2AssessmentSelection(history).records);
  const selection = selectMovementProfileV2ReportHistory({ reports: reports ?? [], profiles });
  return selection.acceptedReports.find((report) => report.id === reportId) ?? null;
}

function buildOfficialHistory(
  profiles: readonly AcceptedProfile[],
  reports: readonly MovementProfileV2ReportHistoryEntry[]
): MovementProfileV2HistoryEntry[] {
  const reportCurrentIds = new Set(reports.map((report) => report.id));
  return profiles
    .slice()
    .sort((a, b) => compareProfiles(b, a))
    .map((profile) => {
      const viewModel = buildMovementProfileV2ResultsViewModel({
        snapshot: profile.snapshot,
        assessment: profile.assessment,
      });
      return {
        id: profile.assessment.sourceCheckUpId,
        sourceType: profile.type,
        sourceLabel: sourceLabel(profile.type),
        dateLabel: viewModel.dateLabel,
        focusTitle: viewModel.focus.title,
        metrics: viewModel.domainCards.map((card) => `${card.title}: ${card.metric}`),
        hasReport: reportCurrentIds.has(profile.assessment.sourceCheckUpId),
        action: {
          id: 'view_movement_profile',
          label: 'View Movement Profile',
          targetId: profile.assessment.sourceCheckUpId,
        },
      };
    });
}

function selectMovementProfileV2ReportHistory({
  reports,
  profiles,
}: {
  reports: readonly MovementBlockReport[];
  profiles: readonly AcceptedProfile[];
}): {
  entries: MovementProfileV2ReportHistoryEntry[];
  acceptedReports: MovementProfileV2BlockReport[];
  diagnostics: MovementProfileV2ProgressDiagnostic[];
} {
  const diagnostics: MovementProfileV2ProgressDiagnostic[] = [];
  const acceptedReports: MovementProfileV2BlockReport[] = [];
  const seen = new Set<string>();

  for (const report of reports) {
    if (!isMovementProfileV2BlockReport(report)) continue;
    const parsed = parseMovementProfileV2BlockReport(report);
    if (!parsed.ok) {
      diagnostics.push({ code: 'progress_v2_report_invalid', reportId: report.id, reason: parsed.reason });
      continue;
    }
    if (seen.has(parsed.report.id)) continue;
    seen.add(parsed.report.id);
    const prior = profiles.find((profile) => reportEndpointMatchesProfile(parsed.report.prior, profile));
    const current = profiles.find((profile) => reportEndpointMatchesProfile(parsed.report.current, profile));
    if (!prior || !current) {
      diagnostics.push({ code: 'progress_v2_report_invalid', reportId: parsed.report.id, reason: 'source_mismatch' });
      continue;
    }
    acceptedReports.push(parsed.report);
  }

  acceptedReports.sort((a, b) => (b.current.completedAt || b.createdAt).localeCompare(a.current.completedAt || a.createdAt));
  const entries = acceptedReports.map((report) => ({
    id: report.current.checkUpId,
    blockId: report.blockId,
    completedAtLabel: formatDate(report.current.completedAt || report.createdAt),
    priorFocusTitle: focusTitle(report.priorSuggestedFocus),
    currentFocusTitle: focusTitle(report.currentSuggestedFocus),
    sessionsLabel: `${report.sessionsCompleted} plan sessions completed`,
    action: {
      id: 'view_block_report' as const,
      label: 'View block report',
      targetId: report.id,
    },
  }));
  return { entries, acceptedReports, diagnostics };
}

function collectMalformedDiagnostics({
  history,
  reports,
  selectionConflictCount,
}: {
  history: readonly StoredCheckUp[];
  reports: readonly MovementBlockReport[];
  selectionConflictCount: number;
}): MovementProfileV2ProgressDiagnostic[] {
  const diagnostics: MovementProfileV2ProgressDiagnostic[] = [];
  for (const record of history) {
    const snapshotCompatibility = record.movementProfileV2SnapshotCompatibility;
    const assessmentCompatibility = record.movementProfileV2AssessmentCompatibility;
    if (snapshotCompatibility && snapshotCompatibility !== 'current' && snapshotCompatibility !== 'missing') {
      diagnostics.push({
        code: 'progress_v2_malformed_artifact',
        checkUpId: record.checkUp.startedAt,
        reason: `snapshot_${snapshotCompatibility}`,
      });
    }
    if (assessmentCompatibility && assessmentCompatibility !== 'current' && assessmentCompatibility !== 'missing') {
      diagnostics.push({
        code: 'progress_v2_malformed_artifact',
        checkUpId: record.checkUp.startedAt,
        reason: `assessment_${assessmentCompatibility}`,
      });
    }
  }
  for (const report of reports) {
    if (report.kind === 'movement_profile_v2_block_report' && !parseMovementProfileV2BlockReport(report).ok) {
      diagnostics.push({ code: 'progress_v2_report_invalid', reportId: report.id, reason: 'parse_failed' });
    }
  }
  if (selectionConflictCount > 0 && diagnostics.length === 0) {
    diagnostics.push({ code: 'progress_v2_malformed_artifact', reason: 'assessment_conflict' });
  }
  return diagnostics;
}

function reportEndpointMatchesProfile(
  endpoint: {
    checkUpId: string;
    snapshotId: string;
    snapshotFingerprint: string;
    assessmentId: string;
    assessmentFingerprint: string;
  },
  profile: AcceptedProfile
): boolean {
  return (
    endpoint.checkUpId === profile.assessment.sourceCheckUpId &&
    endpoint.snapshotId === profile.snapshot.snapshotId &&
    endpoint.snapshotFingerprint === profile.snapshot.snapshotFingerprint &&
    endpoint.assessmentId === profile.assessment.assessmentId &&
    endpoint.assessmentFingerprint === profile.assessment.assessmentFingerprint
  );
}

function sortProfiles(records: readonly AcceptedProfile[]): AcceptedProfile[] {
  return records.slice().sort(compareProfiles);
}

function compareProfiles(a: AcceptedProfile, b: AcceptedProfile): number {
  const byCompletion = profileCompletionTimestamp(a).localeCompare(profileCompletionTimestamp(b));
  if (byCompletion !== 0) return byCompletion;
  const bySourceId = a.assessment.sourceCheckUpId.localeCompare(b.assessment.sourceCheckUpId);
  if (bySourceId !== 0) return bySourceId;
  const byAssessmentId = a.assessment.assessmentId.localeCompare(b.assessment.assessmentId);
  if (byAssessmentId !== 0) return byAssessmentId;
  return a.assessment.assessmentFingerprint.localeCompare(b.assessment.assessmentFingerprint);
}

function profileCompletionTimestamp(profile: {
  record: StoredCheckUp;
  assessment: MovementProfileV2Assessment;
  snapshot: StoredMovementProfileV2Snapshot;
}): string {
  return profile.assessment.sourceCheckUpId || profile.record.checkUp.startedAt || profile.snapshot.sourceCheckUpId;
}

function sourceLabel(type: Extract<StoredCheckUpType, 'baseline' | 'baseline_retake' | 'official_retest'>): string {
  if (type === 'official_retest') return 'Follow-up Movement Check-Up';
  if (type === 'baseline_retake') return 'Movement Check-Up retake';
  return 'First Movement Check-Up';
}

function focusTitle(focus: MovementBlockFocus | null | undefined): string {
  if (!focus) return 'Saved plan';
  if (focus.kind === 'balanced') return 'Balanced';
  return domainTitle(focus.domain);
}

function domainTitle(domain: MovementDomain): string {
  if (domain === 'balance') return 'Balance';
  if (domain === 'mobility') return 'Mobility';
  return 'Strength / Power';
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Saved date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
