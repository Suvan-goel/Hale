import { Fraunces_400Regular, Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import {
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  setAndroidNavigationBarVisibleAsync,
} from './modules/expo-pose-detection';
import { BackArrowButton } from './src/components/BackArrowButton';
import { HeaderLogo } from './src/components/HeaderLogo';
import { SystemInsetsProvider, useSystemInsets } from './src/components/SystemInsetsProvider';
import {
  PrimaryButton,
  Screen,
  ScreenHeader,
  ScreenScrollClearanceProvider,
} from './src/components/ui';
import { LEGACY_V1_CHECKUP_ROLLBACK_ENABLED } from './src/config/legacyV1CheckUpRollback';
import { MOVEMENT_PROFILE_V2_INTERNAL_ENABLED } from './src/config/movementProfileV2Internal';
import {
  isDevMockDataAllowed,
  isDiagnosticsDeveloperSurfaceAllowed,
  isInternalHarnessSurfaceAllowed,
  isReleaseGatedFlowAllowed,
} from './src/config/releaseSurfacePolicy';
import { resolveVoiceV21Activation } from './src/config/voiceExperience';
import {
  AdherenceStore,
  AdherenceStoreState,
  ActivityLevel,
  AgeBand,
  AvailableEquipment,
  BlockIntroScreen,
  CheckupType,
  LifeGoal,
  LifeGoalOnboardingScreen,
  LOCAL_USER_ID,
  MovementAssessment,
  MovementBlock,
  MovementDomain,
  MovementProfileV2BlockReport,
  MovementProfileV2RetestComparison,
  MovementSafetyProfile,
  RestartSessionScreen,
  SessionCompletionScreen,
  TrainingSessionCompletion,
  TrainingSessionCompletionType,
  createMovementBlockFromAssessment,
  createLifeGoal,
  defaultAdherenceStoreState,
  generateMilestones,
  getActiveMovementBlock,
  getLatestMovementBlock,
  getLifeGoalDisplayText,
  latestMilestone,
  makeTrainingSessionCompletion,
  markMovementBlockComplete,
  mergeMilestones,
  movementBlockSourceCheckUpId,
  normalizeLifeGoalDisplayText,
  recordTrainingSessionCompletion,
  scoreDomainFromMovementDomain,
  upsertMovementAssessment,
  upsertMovementBlockReport,
  upsertMovementBlock,
} from './src/adherence';
import { configureSessionAudio } from './src/audio/voicePlayer';
import {
  CheckUp,
  latestV2ShoulderSide,
  latestV2StandingLeg,
  mergeCheckUpRetry,
  retryBatteryForMissingHeadlineDomains,
} from './src/checkup';
import type { BodySide } from './src/checkup/protocolSetup';
import {
  selectPublicMovementCheckUpLaunch,
  type PublicMovementCheckUpEntryContext,
  type PublicMovementProfileV2SourceType,
} from './src/checkup/publicCheckUpEngine';
import {
  createMovementAssessment,
  createAutomaticMovementBlock,
  createMovementBlockReport,
  createGeneratedSessionSummary,
  checkUpCompletionTimestamp,
  countsTowardMainPlan,
  evaluateCompletedFocusStimulusEvidence,
  evaluateSessionWorkEvidence,
  findAssessmentForCheckUp,
  focusStimulusEvidenceSummary,
  annotateCompletionWithScheduleCredit,
  attachMicroCheckTargetMetadata,
  getBlockScheduleState,
  getBlockMicroCheckTarget,
  getSessionPlanningRecoveryCopy,
  getBlockCreationEligibility,
  getHaleAppLifecycle,
  headlineEvidenceFromScore,
  historicalOfficialCheckUpRecords,
  latestUsableOfficialCheckUpRecord,
  latestUsableOfficialAssessment,
  buildMovementProfileV2ProgressViewModel,
  materializeMovementProfileV2Block,
  measuredCapabilityFromMovementProfileV2Interpretation,
  movementProfileV2ProgressProfileBySourceCheckUpId,
  movementProfileV2ProgressReportById,
  movementProfileV2AssessmentForSourceCheckUpId,
  selectProgressDataAuthority,
  transitionMovementProfileV2OfficialRetest,
  applyProgressionEvidenceFromSession,
  planLadderPracticeSessionResult,
  planTodayHaleSession,
  staleEquipmentPlanningResult,
  staleMovementCapabilityPlanningResult,
  staleProgressionPolicyPlanningResult,
  staleReleasePolicyPlanningResult,
  staleSafetyCuePlanningResult,
  sessionPlanFromPlanningResult,
  buildMicroCheckSummaryViewModel,
  microCheckSlotMetadataFromTarget,
  microCheckTypeForDomain,
  validateHaleSessionPlanEquipment,
  validateHaleSessionPlanMovementCapabilities,
  validateHaleSessionPlanProgressionPolicy,
  validateHaleSessionPlanReleasePolicy,
  validateHaleSessionPlanSafetyCues,
  type GenerationRecoveryAction,
  type BlockMicroCheckTarget,
  type HaleSessionPlanningResult,
  type HaleSessionPlan,
  type MicroCheckSummaryViewModel,
  type OfficialMovementProfileV2AssessmentRecord,
  type PlanSessionId,
  type TodaySessionPreferences,
} from './src/haleFlow';
import { HistoryStore, HISTORY_SCHEMA_VERSION, StoredCheckUp } from './src/history';
import { createExpoHistoryFs } from './src/history/fsAdapter';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
} from './src/movements';
import {
  createMovementProfileV2InternalFlow,
  latestMaterializedMovementProfileV2Result,
  latestPendingMovementProfileV2RawCheckUp,
  type MovementProfileV2InternalFlowState,
} from './src/movementProfileV2/internalCheckupFlow';
import {
  latestMovementProfileV2ReferenceDetailsDraft,
  movementProfileV2ReferenceDetailsDraftFromProfile,
  movementProfileV2ReferenceDetailsDraftFromSnapshot,
  referenceProfileFromMovementProfileV2Draft,
} from './src/movementProfileV2/referenceDetailsDraft';
import {
  buildMovementProfileV2ResultsViewModel,
  movementProfileV2ResultsViewModelForRecord,
  type MovementProfileV2Domain,
  type MovementProfileV2ResultsViewModel,
} from './src/movementProfileV2/viewModel';
import type { MovementProfileV2UnifiedPlanState } from './src/results/movementProfileV2ResultsAdapter';
import {
  DEFAULT_TAB_KEY,
  TabBar,
  TAB_BAR_SCROLL_CLEARANCE,
  TabKey,
  getTabDef,
  normalizeTabKey,
} from './src/navigation/TabBar';
import { deriveOnboardingStep } from './src/onboarding/state';
import {
  AppSettings,
  OnboardingStep,
  Preferences,
  ProfileStore,
  UserProfile,
  canonicalEquipmentFromSafetyProfile,
  defaultPreferences,
  legacyEquipmentFromCanonical,
  onboardingActivityLevel,
  representativeAgeForAgeBand,
  safetyProfileWithCanonicalEquipment,
} from './src/profile';
import {
  materializeOfficialMovementProfileV2Artifacts,
  type MovementProfileV2Assessment,
  type MovementProfileV2ReferenceProfile,
  type StoredMovementProfileV2Snapshot,
} from './src/reference/movementProfileV2';
import {
  CheckUpScore,
  ScoringInputIssue,
  VersionedCheckUpScoreSnapshot,
  createCurrentVersionedScoreSnapshot,
  parseStoredScoreSnapshot,
} from './src/scoring';
import {
  AuthProvider,
  syncMovementBlockReportToRemote,
  syncMovementBlockToRemote,
  syncMovementCheckupToRemote,
  syncMicroCheckToRemote,
  syncRecentMicroChecksToRemote,
  syncRecentMovementBlockReportsToRemote,
  syncRecentMovementBlocksToRemote,
  syncRecentMovementCheckupsToRemote,
  syncRecentTrainingSessionCompletionsToRemote,
  syncLocalPreferencesToRemote,
  syncTrainingStateToRemote,
  syncTrainingSessionCompletionToRemote,
  isLocalStateEmptyForRestore,
  restoreRemoteStateIfLocalEmpty,
  shouldCommitLaunchSyncFingerprint,
  shouldRetryLaunchSync,
  shouldSyncTrainingStateAfterLaunchRestore,
  type LaunchRestoreOutcome,
  type RestoreStatus,
  useAuth,
} from './src/services/backend';
import {
  addBreadcrumb,
  captureError,
  initObservability,
  wrapWithObservability,
} from './src/services/observability/sentry';
import { AuthScreen } from './src/screens/AuthScreen';
import { CameraExplanationScreen } from './src/screens/CameraExplanationScreen';
import { CameraSetupScreen } from './src/screens/CameraSetupScreen';
import { CheckUpScreen } from './src/screens/CheckUpScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { LadderDetailScreen, LearnDetailScreen } from './src/screens/ExploreDetailScreens';
import { LiveSessionScreen } from './src/screens/LiveSessionScreen';
import { ManualCheckupStartScreen } from './src/screens/ManualCheckupStartScreen';
import {
  ManualMicroCheckDomainScreen,
  ManualMicroCheckUnavailableScreen,
} from './src/screens/ManualMicroCheckChoiceScreen';
import { MicroCheckScreen } from './src/screens/MicroCheckScreen';
import { MicroCheckSummaryScreen } from './src/screens/MicroCheckSummaryScreen';
import { MovementProfileV2BlockReportScreen } from './src/screens/MovementProfileV2BlockReportScreen';
import { MovementProfileV2ResultsScreen } from './src/screens/MovementProfileV2ResultsScreen';
import { MovementProfileV2UnifiedCheckUpScreen } from './src/screens/MovementProfileV2UnifiedCheckUpScreen';
import { MovementProfileV2UnifiedResultsScreen } from './src/screens/MovementProfileV2UnifiedResultsScreen';
import { MovementProfileV2PracticeResultsScreen } from './src/screens/MovementProfileV2PracticeResultsScreen';
import { OnboardingBlockScreen } from './src/screens/OnboardingBlockScreen';
import { OnboardingEquipmentScreen } from './src/screens/OnboardingEquipmentScreen';
import { OnboardingResultsScreen } from './src/screens/OnboardingResultsScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { ProgressScreen, buildProgressDevMockData } from './src/screens/ProgressScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { SafetyProfileScreen } from './src/screens/SafetyProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SessionPlanningRecoveryScreen } from './src/screens/SessionPlanningRecoveryScreen';
import { SessionPreviewScreen } from './src/screens/SessionPreviewScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { TrainingSessionScreen } from './src/screens/TrainingSessionScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { isPoseLatencyDiagnosticsEnabled } from './src/diagnostics/poseLatencyDiagnostics';
import {
  EquipmentProfile,
  MicroCheckResult,
  MicroCheckType,
  PainArea,
  PersistedPostSessionFeedback,
  TrainingState,
  TrainingStore,
  TrainingSessionResult,
  TrackingQuality,
  applyBothSidesExerciseCompletionToStartSideSeed,
  buildBlock,
  buildSessionInProgress,
  defaultTrainingState,
  deriveMicroCheckSideSetup,
  initialLadderProgressFromMeasuredCapability,
  mergeResumedSessionResult,
  microCheckTrendPoints,
  resumableSessionStart,
  startBlock,
  upsertGeneratedSessionSummary,
  validTimeSessionSummaryCards,
  type SessionIntensity,
  type SessionResumeStart,
  type TrainingItemResult,
  type TrainingSessionInProgress,
} from './src/training';
import { colors, fonts, radius, shadow, spacing, type } from './src/theme';

type PermissionState = 'checking' | 'granted' | 'undetermined' | 'denied';
/** Full-screen flows launched on top of the tab shell (hands-free sessions + dev tools). */
type Flow =
  | 'welcome'
  | 'equipment'
  | 'camera-explanation'
  | 'safety-profile'
  | 'camera-setup'
  | 'manual-checkup'
  | 'manual-microcheck-domain'
  | 'manual-microcheck-unavailable'
  | 'checkup'
  | 'results'
  | 'session-unavailable'
  | 'session-preview'
  | 'training'
  | 'microcheck'
  | 'microcheck-summary'
  | 'life-goal'
  | 'onboarding-block'
  | 'block-intro'
  | 'restart-intro'
  | 'session-complete'
  | 'ladder-detail'
  | 'learn-detail'
  | 'settings'
  | 'movement-profile-v2-unified-checkup'
  | 'movement-profile-v2-results'
  | 'movement-profile-v2-practice-results'
  | 'movement-profile-v2-unified-results'
  | 'movement-profile-v2-domain-detail'
  | 'movement-profile-v2-unified-domain-detail'
  | 'movement-profile-v2-block-report'
  | 'movement-profile-v2-retest-unavailable'
  | 'dev-live';

type CameraSetupEntry = 'checkup' | 'review';
type LifeGoalEntry = 'onboarding' | 'review';
type SafetyProfileEntry = 'onboarding' | 'review';
type MovementProfileV2ResultSurface = 'standalone' | 'unified';
type MovementProfileV2EntryContext = 'internal' | 'public_standard' | 'public_onboarding' | 'public_official_retest';
type MovementProfileV2OfficialCheckUpSourceType = Extract<CheckupType, 'baseline' | 'baseline_retake' | 'official_retest'>;
type MovementProfileV2PracticeCheckUpSourceType = Extract<CheckupType, 'manual_extra_v2'>;
type MovementProfileV2CheckUpSourceType = MovementProfileV2OfficialCheckUpSourceType | MovementProfileV2PracticeCheckUpSourceType;
type MovementProfileV2RawCompletion = {
  checkUp: CheckUp;
  sourceType: MovementProfileV2CheckUpSourceType;
};
type MovementProfileV2OfficialRetestContext = {
  priorBlockId: string;
  priorArtifacts: OfficialMovementProfileV2AssessmentRecord;
  priorStandingLeg: BodySide | null;
  priorShoulderSide: BodySide | null;
};

type MicroCheckLaunch =
  | {
      mode: 'scheduled';
      target: Extract<BlockMicroCheckTarget, { status: 'available' }>;
    }
  | {
      mode: 'optional';
      microCheckType: MicroCheckType;
      domain: MovementDomain;
    };

const DEFAULT_MOVEMENT_PROFILE_V2_PLAN_STATE: MovementProfileV2UnifiedPlanState = {
  status: 'unavailable',
};
const UNKNOWN_MOVEMENT_PROFILE_V2_REFERENCE_PROFILE: MovementProfileV2ReferenceProfile = {
  ageBasis: 'unknown',
  referenceSex: 'unknown',
};

type NavigationLocation = {
  tab: TabKey;
  flow: Flow | null;
};

/** Flows that mount the camera; gated on permission + audio configuration. */
const CAMERA_FLOWS = new Set<Flow>([
  'checkup',
  'training',
  'microcheck',
  'movement-profile-v2-unified-checkup',
  'dev-live',
]);
const PUBLIC_MOVEMENT_PROFILE_V2_FLOWS = new Set<Flow>([
  'movement-profile-v2-unified-checkup',
  'movement-profile-v2-results',
  'movement-profile-v2-unified-results',
  'movement-profile-v2-domain-detail',
  'movement-profile-v2-unified-domain-detail',
  'movement-profile-v2-block-report',
  'movement-profile-v2-retest-unavailable',
]);
const MAX_NAVIGATION_HISTORY_ENTRIES = 40;
const LAUNCH_SYNC_RETRY_DELAY_MS = 5000;
const STATUS_BAR_BACKDROP_EXTRA_HEIGHT = 8;
const EXPECTED_SCORING_INPUT_ISSUES = new Set<ScoringInputIssue['code']>(['no_measurement']);
const TEMP_PREVIEW_BLOCK_INTRO_SCREEN = __DEV__ && false;

initObservability();

function buildBlockIntroPreview(nowIso: string): {
  block: MovementBlock;
  lifeGoal: LifeGoal;
} {
  const start = new Date(nowIso);
  const end = new Date(start);
  end.setDate(start.getDate() + 28);
  const retest = new Date(start);
  retest.setDate(start.getDate() + 7);

  return {
    lifeGoal: {
      id: 'dev-preview-life-goal-stairs',
      userId: LOCAL_USER_ID,
      category: 'stairs',
      createdAt: nowIso,
      updatedAt: nowIso,
      isPrimary: true,
    },
    block: {
      id: 'dev-preview-movement-block',
      userId: LOCAL_USER_ID,
      lifeGoalId: 'dev-preview-life-goal-stairs',
      status: 'active',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      retestDate: retest.toISOString(),
      focusDomain: 'balance',
      secondaryDomains: ['strength_power', 'mobility'],
      sessionsPerWeekTarget: 3,
      totalPlannedSessions: 12,
      completedSessions: 0,
      microChecksCompleted: 0,
      sourceCheckUpId: 'dev-preview-checkup',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  };
}

function buildDevMicroCheckSummaryPreview(variant: string | null): MicroCheckSummaryViewModel | null {
  if (!__DEV__) return null;
  const history = [buildDevMicroCheckBaseline()];
  if (variant === 'scheduled-mobility') {
    return buildMicroCheckSummaryViewModel({
      result: {
        type: 'mobility-reach',
        startedAt: '2026-06-28T08:00:00.000Z',
        completedAt: '2026-06-28T08:01:00.000Z',
        value: 0.24,
        reps: 0,
        measured: true,
        targetDomain: 'mobility',
        scheduleWeekNumber: 3,
      },
      source: 'scheduled',
      targetDomain: 'mobility',
      scheduleWeekNumber: 3,
      history,
    });
  }
  if (variant === 'optional' || variant === 'optional-mobility') {
    return buildMicroCheckSummaryViewModel({
      result: {
        type: 'mobility-reach',
        startedAt: '2026-06-28T08:00:00.000Z',
        completedAt: '2026-06-28T08:01:00.000Z',
        value: 0.24,
        reps: 0,
        measured: true,
        targetDomain: 'mobility',
      },
      source: 'optional',
      targetDomain: 'mobility',
      history,
    });
  }
  if (!variant || variant === 'scheduled' || variant === 'scheduled-strength') {
    return buildMicroCheckSummaryViewModel({
      result: {
        type: 'chair-power',
        startedAt: '2026-06-28T08:00:00.000Z',
        completedAt: '2026-06-28T08:01:00.000Z',
        value: 0.42,
        reps: 5,
        measured: true,
        targetDomain: 'strength_power',
        scheduleWeekNumber: 2,
      },
      source: 'scheduled',
      targetDomain: 'strength_power',
      scheduleWeekNumber: 2,
      history,
    });
  }
  return null;
}

function buildDevMicroCheckBaseline(): StoredCheckUp {
  const startedAt = '2026-06-19T08:00:00.000Z';
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType: 'baseline',
    checkUp: {
      startedAt,
      bodyUnit: 0.33,
      items: [
        devMeasuredCheckUpItem(CHAIR_STAND_ID, {
          reps: 12,
          repStats: [],
          sessionMeanVel: 0.34,
          sessionMeanPeakVel: 0.44,
          pushOffDetected: false,
        }),
        devMeasuredCheckUpItem(BALANCE_LADDER_ID, {
          stages: [],
          singleLegEyesOpenSec: 10,
        }),
        devMeasuredCheckUpItem(HINGE_REACH_ID, {
          reachBu: 0.3,
        }),
      ],
    },
    scoreSnapshotCompatibility: 'legacy_unversioned',
  };
}

function devMeasuredCheckUpItem(
  movementId: string,
  result: Record<string, unknown>
): CheckUp['items'][number] {
  return {
    movementId,
    status: 'measured',
    result: {
      movementId,
      flags: [],
      interruptions: 0,
      ...result,
    } as never,
  };
}

function movementProfileV2BlockMatchesResult(
  block: MovementBlock,
  snapshot: StoredMovementProfileV2Snapshot,
  assessment: MovementProfileV2Assessment
): boolean {
  const origin = block.origin;
  return (
    origin?.kind === 'movement_profile_v2_assessment' &&
    origin.assessmentId === assessment.assessmentId &&
    origin.assessmentFingerprint === assessment.assessmentFingerprint &&
    origin.snapshotId === snapshot.snapshotId &&
    origin.snapshotFingerprint === snapshot.snapshotFingerprint &&
    origin.sourceCheckUpId === assessment.sourceCheckUpId &&
    origin.sourceCheckUpType === assessment.sourceCheckUpType &&
    origin.focusPolicyVersion === assessment.focusProvenance.focusPolicyVersion &&
    origin.focusPolicyFingerprint === assessment.focusProvenance.focusPolicyFingerprint
  );
}

function flowForOnboardingStep(step: OnboardingStep): Flow | null {
  switch (step) {
    case 'welcome':
      return 'welcome';
    case 'life_goal':
      return 'life-goal';
    case 'safety_profile':
      return 'safety-profile';
    case 'equipment':
      return 'equipment';
    case 'camera_explanation':
      return 'camera-explanation';
    case 'camera_setup':
    case 'baseline_checkup':
      return 'camera-setup';
    case 'results':
    case 'create_block':
      return 'results';
    case 'complete':
      return null;
  }
}

function recordScoringInputIssues(
  context: string,
  issues: readonly ScoringInputIssue[],
  checkupType?: CheckupType
): void {
  const unexpected = issues.filter((issue) => !EXPECTED_SCORING_INPUT_ISSUES.has(issue.code));
  if (unexpected.length === 0) return;
  addBreadcrumb('scoring input validation issues', {
    area: 'scoring_input_validation',
    context,
    checkupType,
    issueCount: unexpected.length,
    issueCodes: uniqueStrings(unexpected.map((issue) => issue.code)),
    movementIds: uniqueStrings(
      unexpected
        .map((issue) => issue.movementId)
        .filter((movementId): movementId is string => typeof movementId === 'string')
    ),
  });
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function isOfficialMovementProfileV2SourceType(
  sourceType: MovementProfileV2CheckUpSourceType
): sourceType is MovementProfileV2OfficialCheckUpSourceType {
  return sourceType === 'baseline' || sourceType === 'baseline_retake' || sourceType === 'official_retest';
}

function isOptionalMicroCheckResult(result: MicroCheckResult): boolean {
  return typeof result.id === 'string' && result.id.startsWith('optional:');
}

function navigationLocation(tab: TabKey, flow: Flow | null): NavigationLocation {
  return { tab: normalizeTabKey(tab), flow };
}

function sameNavigationLocation(
  a: NavigationLocation | undefined,
  b: NavigationLocation | undefined
): boolean {
  return !!a && !!b && a.tab === b.tab && a.flow === b.flow;
}

function blockNumberForBlocks(
  blocks: readonly MovementBlock[],
  blockId: string
): number | undefined {
  const ordered = blocks
    .slice()
    .sort((a, b) => (a.startDate || a.createdAt).localeCompare(b.startDate || b.createdAt));
  const index = ordered.findIndex((block) => block.id === blockId);
  return index >= 0 ? index + 1 : undefined;
}

function sessionIndexForCompletions(
  completions: readonly TrainingSessionCompletion[],
  completion: TrainingSessionCompletion
): number | undefined {
  const ordered = completions
    .filter(
      (item) =>
        item.blockId === completion.blockId &&
        item.scheduleCredit?.credited === true &&
        isSyncableWorkoutCompletionType(item.sessionType)
    )
    .slice()
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  const index = ordered.findIndex((item) => item.id === completion.id);
  return index >= 0 ? index + 1 : undefined;
}

function isSyncableWorkoutCompletionType(type: TrainingSessionCompletionType): boolean {
  return type === 'standard' || type === 'starter' || type === 'restart';
}

function workEvidenceSummary(
  evidence: ReturnType<typeof evaluateSessionWorkEvidence>
): NonNullable<TrainingSessionCompletion['workEvidence']> {
  return {
    plannedExerciseCount: evidence.plannedExerciseCount,
    resultItemCount: evidence.resultItemCount,
    completedExerciseCount: evidence.completedExerciseCount,
    skippedExerciseCount: evidence.skippedExerciseCount,
    missingResultCount: evidence.missingResultCount,
    duplicateResultCount: evidence.duplicateResultCount,
    malformedResultCount: evidence.malformedResultCount,
    unmatchedResultCount: evidence.unmatchedResultCount,
  };
}

function launchRestoreOutcomeFromStatus(status: RestoreStatus): LaunchRestoreOutcome {
  switch (status) {
    case 'skipped_local_not_empty':
      return 'skipped_non_empty_local';
    case 'remote_empty':
      return 'no_remote_data';
    case 'signed_out':
    case 'restored':
    case 'failed':
    case 'timeout':
      return status;
  }
}

function syncStatusCounts(results: readonly { status?: string }[]): Record<string, number> {
  return results.reduce<Record<string, number>>((counts, result) => {
    const status = result.status ?? 'unknown';
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});
}

function assessmentForCheckUp(
  assessments: readonly MovementAssessment[],
  checkUpStartedAt: string
): MovementAssessment | null {
  return (
    assessments
      .slice()
      .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))
      .find((assessment) => {
        const checkUpId = assessment.results?.rawMetrics?.checkUpId;
        return checkUpId === checkUpStartedAt || assessment.createdAt === checkUpStartedAt;
      }) ?? null
  );
}

function App() {
  return (
    <SystemInsetsProvider>
      <StatusBarBackdrop>
        <AuthProvider>
          <AppGate />
        </AuthProvider>
      </StatusBarBackdrop>
    </SystemInsetsProvider>
  );
}

export default wrapWithObservability(App);

function StatusBarBackdrop({ children }: { children: React.ReactNode }) {
  const systemInsets = useSystemInsets();
  return (
    <View style={styles.appChrome}>
      <NativeStatusBar
        barStyle="dark-content"
        backgroundColor={colors.bgBase}
        translucent={false}
      />
      <StatusBar style="dark" />
      <View style={styles.appChromeContent}>{children}</View>
      {Platform.OS === 'ios' ? (
        <View
          pointerEvents="none"
          style={[
            styles.statusBarSafeAreaStrip,
            { height: systemInsets.top + STATUS_BAR_BACKDROP_EXTRA_HEIGHT },
          ]}
        />
      ) : (
        <View
          pointerEvents="none"
          style={[
            styles.statusBarAndroidStrip,
            {
              height: (NativeStatusBar.currentHeight ?? 0) + STATUS_BAR_BACKDROP_EXTRA_HEIGHT,
            },
          ]}
        />
      )}
    </View>
  );
}

function AppGate() {
  // Fonts are bundled (no runtime fetch); gate the first paint until they load
  // so headings never flash in a fallback face.
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Inter_400Regular,
    Inter_500Medium,
  });
  const auth = useAuth();
  const authUserId =
    typeof auth.user?.id === 'string' && auth.user.id.length > 0 ? auth.user.id : null;
  const shouldRenderHaleApp =
    fontsLoaded &&
    !auth.loading &&
    auth.isSignedIn &&
    authUserId !== null &&
    !auth.isPasswordRecovery;

  React.useEffect(() => {
    if (shouldRenderHaleApp) return;
    void setAndroidNavigationBarVisibleAsync(false);
  }, [shouldRenderHaleApp]);

  if (!fontsLoaded || auth.loading || (auth.isSignedIn && authUserId === null)) {
    return <AuthLoadingScreen />;
  }

  if (!auth.isSignedIn || auth.isPasswordRecovery) {
    return <AuthScreen />;
  }

  return <HaleApp key={authUserId} />;
}

function HaleApp() {
  const { isSignedIn: backendSignedIn, signOut, user } = useAuth();
  const systemInsets = useSystemInsets();
  const backendUserId = user?.id ?? null;
  const [permission, setPermission] = React.useState<PermissionState>('checking');
  // Audio mode must be configured BEFORE the camera mounts — audio session
  // changes must never interrupt a running camera session.
  const [audioReady, setAudioReady] = React.useState(false);
  const poseLatencyDiagnosticsEnabled = isPoseLatencyDiagnosticsEnabled();
  const developerRuntime = __DEV__;
  const diagnosticsDeveloperSurfaceEnabled = isDiagnosticsDeveloperSurfaceAllowed({
    dev: developerRuntime,
    poseLatencyDiagnosticsEnabled,
  });
  const movementProfileV2InternalSurfaceEnabled = isInternalHarnessSurfaceAllowed({
    dev: developerRuntime,
    internalEnabled: MOVEMENT_PROFILE_V2_INTERNAL_ENABLED,
  });

  // Navigation: which bottom tab is showing, and whether a full-screen flow is
  // on top of it (a flow hides the tab bar; null means "show the tabs").
  const [tab, setTab] = React.useState<TabKey>(DEFAULT_TAB_KEY);
  const [flow, setFlow] = React.useState<Flow | null>(() =>
    TEMP_PREVIEW_BLOCK_INTRO_SCREEN ? 'block-intro' : null
  );
  const [progressHistoryOpen, setProgressHistoryOpen] = React.useState(false);
  const [progressResultCheckUpId, setProgressResultCheckUpId] = React.useState<string | null>(null);
  const [cameraSetupEntry, setCameraSetupEntry] =
    React.useState<CameraSetupEntry>('checkup');
  const [lifeGoalEntry, setLifeGoalEntry] =
    React.useState<LifeGoalEntry>('onboarding');
  const [safetyProfileEntry, setSafetyProfileEntry] =
    React.useState<SafetyProfileEntry>('onboarding');
  const [devOnboardingReplay, setDevOnboardingReplay] = React.useState(false);
  const [movementProfileV2InitialFlow, setMovementProfileV2InitialFlow] =
    React.useState<MovementProfileV2InternalFlowState | null>(null);
  const [movementProfileV2Raw, setMovementProfileV2Raw] =
    React.useState<MovementProfileV2RawCompletion | null>(null);
  const [movementProfileV2Result, setMovementProfileV2Result] =
    React.useState<MovementProfileV2ResultsViewModel | null>(null);
  const [movementProfileV2OfficialRetestContext, setMovementProfileV2OfficialRetestContext] =
    React.useState<MovementProfileV2OfficialRetestContext | null>(null);
  const [movementProfileV2RetestComparison, setMovementProfileV2RetestComparison] =
    React.useState<MovementProfileV2RetestComparison | null>(null);
  const [movementProfileV2BlockReport, setMovementProfileV2BlockReport] =
    React.useState<MovementProfileV2BlockReport | null>(null);
  const [movementProfileV2PlanBlockId, setMovementProfileV2PlanBlockId] =
    React.useState<string | null>(null);
  const [movementProfileV2PlanState, setMovementProfileV2PlanState] =
    React.useState<MovementProfileV2UnifiedPlanState>(DEFAULT_MOVEMENT_PROFILE_V2_PLAN_STATE);
  const [movementProfileV2ResultSurface, setMovementProfileV2ResultSurface] =
    React.useState<MovementProfileV2ResultSurface>('standalone');
  const [movementProfileV2EntryContext, setMovementProfileV2EntryContext] =
    React.useState<MovementProfileV2EntryContext>('internal');
  const [movementProfileV2DetailDomain, setMovementProfileV2DetailDomain] =
    React.useState<MovementProfileV2Domain | null>(null);
  const [movementProfileV2SelectedProfileId, setMovementProfileV2SelectedProfileId] =
    React.useState<string | null>(null);
  const [movementProfileV2SelectedReportId, setMovementProfileV2SelectedReportId] =
    React.useState<string | null>(null);

  // Auth-scoped local stores. Each backend user gets a separate on-device cache
  // so sign-out/sign-in never lets another account inherit local Hale state.
  const localFs = React.useMemo(
    () => createExpoHistoryFs({ userId: backendUserId }),
    [backendUserId]
  );
  const store = React.useMemo(() => new HistoryStore(localFs), [localFs]);
  const trainingStore = React.useMemo(() => new TrainingStore(localFs), [localFs]);
  const profileStore = React.useMemo(() => new ProfileStore(localFs), [localFs]);
  const adherenceStore = React.useMemo(() => new AdherenceStore(localFs), [localFs]);
  const [history, setHistory] = React.useState<StoredCheckUp[]>([]);
  const [lastResult, setLastResult] = React.useState<CheckUp | null>(null);
  const [lastResultScore, setLastResultScore] = React.useState<CheckUpScore | null>(null);
  const [lastResultScoreSnapshot, setLastResultScoreSnapshot] =
    React.useState<VersionedCheckUpScoreSnapshot | null>(null);
  const [lastResultCheckupType, setLastResultCheckupType] = React.useState<CheckupType | null>(
    null
  );
  const [training, setTraining] = React.useState<TrainingState>(() => defaultTrainingState());
  const [adherence, setAdherence] = React.useState<AdherenceStoreState>(() =>
    defaultAdherenceStoreState()
  );
  const [microChecks, setMicroChecks] = React.useState<MicroCheckResult[]>([]);
  const [microCheckLaunch, setMicroCheckLaunch] = React.useState<MicroCheckLaunch | null>(null);
  const [lastMicroCheckSummary, setLastMicroCheckSummary] =
    React.useState<MicroCheckSummaryViewModel | null>(null);
  const [prefs, setPrefs] = React.useState<Preferences>(() => defaultPreferences());
  const voiceActivation = React.useMemo(() => resolveVoiceV21Activation(), []);
  const [historyReady, setHistoryReady] = React.useState(false);
  const [profileReady, setProfileReady] = React.useState(false);
  const [trainingReady, setTrainingReady] = React.useState(false);
  const [microChecksReady, setMicroChecksReady] = React.useState(false);
  const [adherenceReady, setAdherenceReady] = React.useState(false);
  const [restoreReady, setRestoreReady] = React.useState(false);
  const [restoreOutcome, setRestoreOutcome] = React.useState<LaunchRestoreOutcome>('pending');
  const [localWasEmptyAtRestore, setLocalWasEmptyAtRestore] = React.useState(false);
  const [launchSyncRetryTick, setLaunchSyncRetryTick] = React.useState(0);
  const [pendingCheckup, setPendingCheckup] = React.useState<{
    type: CheckupType;
    sourceBlockId?: string;
    isOfficialForProgress?: boolean;
    battery?: readonly string[];
    retryOfCheckUpId?: string;
    retryMovementIds?: readonly string[];
  } | null>(null);
  // The exercise ids of the session about to run (resolved at launch).
  const [sessionIds, setSessionIds] = React.useState<string[]>([]);
  const [sessionType, setSessionType] = React.useState<TrainingSessionCompletionType>('standard');
  const [activeSessionPlan, setActiveSessionPlan] = React.useState<HaleSessionPlan | null>(null);
  // Mid-session snapshot surviving from an interrupted run (crash/kill/stop);
  // consumed by resumableSessionStart when the same plan is started again.
  const [sessionInProgress, setSessionInProgress] = React.useState<TrainingSessionInProgress | null>(null);
  const sessionResumeContextRef = React.useRef<Pick<
    SessionResumeStart,
    'completedItems' | 'startedAt'
  > | null>(null);
  const sessionRunStartedAtRef = React.useRef<string>('');
  const [planningRecoveryResult, setPlanningRecoveryResult] =
    React.useState<HaleSessionPlanningResult | null>(null);
  const [lastCompletion, setLastCompletion] = React.useState<TrainingSessionCompletion | null>(
    null
  );
  const [lastSessionResult, setLastSessionResult] = React.useState<TrainingSessionResult | null>(
    null
  );
  const [selectedLadderId, setSelectedLadderId] = React.useState<string | null>(null);
  const [selectedLearnId, setSelectedLearnId] = React.useState<string | null>(null);
  const profileSyncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const trainingStateSyncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProfileSyncFingerprintRef = React.useRef<string | null>(null);
  const lastTrainingStateSyncFingerprintRef = React.useRef<string | null>(null);
  const lastCheckupSyncFingerprintRef = React.useRef<string | null>(null);
  const lastBlockSyncFingerprintRef = React.useRef<string | null>(null);
  const lastSessionSyncFingerprintRef = React.useRef<string | null>(null);
  const lastMicroCheckSyncFingerprintRef = React.useRef<string | null>(null);
  const lastBlockReportSyncFingerprintRef = React.useRef<string | null>(null);
  const autoPreparedBlockSourceRef = React.useRef<string | null>(null);
  const movementProfileV2AutoFinalizeAttemptRef = React.useRef<string | null>(null);
  const remoteProfileHydrationAttemptedRef = React.useRef(false);
  const remoteRestoreAttemptedRef = React.useRef(false);
  const launchSyncRetryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationHistoryRef = React.useRef<NavigationLocation[]>([]);
  const currentLocationRef = React.useRef<NavigationLocation>(
    navigationLocation(DEFAULT_TAB_KEY, null)
  );
  const navigationInitializedRef = React.useRef(false);
  const suppressNextHistoryPushRef = React.useRef(false);

  React.useEffect(() => {
    const next = navigationLocation(tab, flow);
    if (!navigationInitializedRef.current) {
      currentLocationRef.current = next;
      navigationInitializedRef.current = true;
      suppressNextHistoryPushRef.current = false;
      return;
    }

    const previous = currentLocationRef.current;
    if (sameNavigationLocation(previous, next)) {
      suppressNextHistoryPushRef.current = false;
      return;
    }

    if (suppressNextHistoryPushRef.current) {
      suppressNextHistoryPushRef.current = false;
    } else {
      const historyStack = navigationHistoryRef.current;
      if (!sameNavigationLocation(historyStack[historyStack.length - 1], previous)) {
        navigationHistoryRef.current = [...historyStack, previous].slice(
          -MAX_NAVIGATION_HISTORY_ENTRIES
        );
      }
    }

    currentLocationRef.current = next;
  }, [flow, tab]);

  const replaceNextNavigationLocation = React.useCallback(
    (target: NavigationLocation, options: { clearHistory?: boolean } = {}) => {
      if (options.clearHistory) {
        navigationHistoryRef.current = [];
      }
      suppressNextHistoryPushRef.current = !sameNavigationLocation(
        currentLocationRef.current,
        target
      );
    },
    []
  );

  const replaceFlow = React.useCallback(
    (nextFlow: Flow | null, nextTab: TabKey = currentLocationRef.current.tab) => {
      const target = navigationLocation(nextTab, nextFlow);
      replaceNextNavigationLocation(target);
      setTab(target.tab);
      setFlow(target.flow);
    },
    [replaceNextNavigationLocation]
  );

  React.useEffect(() => {
    if (!__DEV__) return undefined;
    const openDevMicroCheckSummary = (url: string | null | undefined) => {
      if (!url || !url.startsWith('hale://')) return;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return;
      }
      if (parsed.hostname !== 'dev' || parsed.pathname !== '/microcheck-summary') return;
      const summary = buildDevMicroCheckSummaryPreview(parsed.searchParams.get('variant'));
      if (!summary) return;
      setLastMicroCheckSummary(summary);
      setMicroCheckLaunch(null);
      replaceFlow('microcheck-summary');
    };
    const subscription = Linking.addEventListener('url', (event) => openDevMicroCheckSummary(event.url));
    void Linking.getInitialURL()
      .then(openDevMicroCheckSummary)
      .catch(() => undefined);
    return () => subscription.remove();
  }, [replaceFlow]);

  React.useEffect(() => {
    if (flow !== 'results') {
      setProgressResultCheckUpId(null);
    }
  }, [flow]);

  React.useEffect(() => {
    addBreadcrumb('voice activation resolved', {
      area: 'voice_v21_activation',
      trainingVoiceV21Enabled: voiceActivation.trainingVoiceV21Enabled,
      microCheckVoiceV21Enabled: voiceActivation.microCheckVoiceV21Enabled,
      movementCheckUpV21Enabled: voiceActivation.movementCheckUpV21Enabled,
      eyesOpenBalanceV2Enabled: voiceActivation.eyesOpenBalanceV2Enabled,
      reasonCodes: voiceActivation.reasonCodes,
    });
  }, [voiceActivation]);

  React.useEffect(() => {
    addBreadcrumb('app startup hydration started', { area: 'startup' });
    // Check-only at startup: the OS permission dialog must first appear from
    // the camera-explanation screen, after the privacy case has been made.
    getCameraPermissionsAsync()
      .then((response) =>
        setPermission(
          response.granted
            ? 'granted'
            : response.status === 'undetermined'
              ? 'undetermined'
              : 'denied'
        )
      )
      .catch((error) => {
        captureError(error, { area: 'startup', action: 'camera_permission' });
        setPermission('undetermined');
      });
    configureSessionAudio()
      .catch((error) => {
        console.warn('[audio] mode configuration failed', error);
        captureError(error, { area: 'startup', action: 'audio_configuration' });
      })
      .finally(() => setAudioReady(true));
  }, []);

  React.useEffect(() => {
    let active = true;
    setHistoryReady(false);
    setTrainingReady(false);
    setMicroChecksReady(false);
    setProfileReady(false);
    setAdherenceReady(false);
    setHistory([]);
    setLastResult(null);
    setLastResultScore(null);
    setLastResultScoreSnapshot(null);
    setLastResultCheckupType(null);
    setMovementProfileV2InitialFlow(null);
    setMovementProfileV2Raw(null);
    setMovementProfileV2Result(null);
    setMovementProfileV2OfficialRetestContext(null);
    setMovementProfileV2RetestComparison(null);
    setMovementProfileV2BlockReport(null);
    setMovementProfileV2PlanBlockId(null);
    setMovementProfileV2PlanState(DEFAULT_MOVEMENT_PROFILE_V2_PLAN_STATE);
    setMovementProfileV2ResultSurface('standalone');
    setMovementProfileV2EntryContext('internal');
    setMovementProfileV2DetailDomain(null);
    setMovementProfileV2SelectedProfileId(null);
    setMovementProfileV2SelectedReportId(null);
    setTraining(defaultTrainingState());
    setMicroChecks([]);
    setPrefs(defaultPreferences());
    setAdherence(defaultAdherenceStoreState());

    store
      .loadAll()
      .then((next) => {
        if (active) setHistory(next);
      })
      .catch((error) => {
        captureError(error, { area: 'startup', action: 'load_history' });
        if (active) setHistory([]);
      })
      .finally(() => {
        if (active) setHistoryReady(true);
      });
    trainingStore
      .loadState()
      .then((next) => {
        if (active) setTraining(next);
      })
      .catch((error) => {
        captureError(error, { area: 'startup', action: 'load_training_state' });
      })
      .finally(() => {
        if (active) setTrainingReady(true);
      });
    trainingStore
      .loadMicroChecks()
      .then((next) => {
        if (active) setMicroChecks(next);
      })
      .catch((error) => {
        captureError(error, { area: 'startup', action: 'load_micro_checks' });
      })
      .finally(() => {
        if (active) setMicroChecksReady(true);
      });
    trainingStore
      .loadSessionInProgress()
      .then((next) => {
        if (active) setSessionInProgress(next);
      })
      .catch((error) => {
        captureError(error, { area: 'startup', action: 'load_session_in_progress' });
      });
    profileStore
      .load()
      .then((next) => {
        if (active) setPrefs(next);
      })
      .catch((error) => {
        captureError(error, {
          area: 'startup',
          action: 'load_profile_preferences',
        });
      })
      .finally(() => {
        if (active) setProfileReady(true);
      });
    adherenceStore
      .load()
      .then((next) => {
        if (active) setAdherence(next);
      })
      .catch((error) => {
        captureError(error, {
          area: 'startup',
          action: 'load_adherence_state',
        });
      })
      .finally(() => {
        if (active) setAdherenceReady(true);
      });

    return () => {
      active = false;
    };
  }, [store, trainingStore, profileStore, adherenceStore]);

  React.useEffect(() => {
    if (backendSignedIn && backendUserId) {
      remoteProfileHydrationAttemptedRef.current = false;
      remoteRestoreAttemptedRef.current = false;
      setRestoreOutcome('pending');
      setLocalWasEmptyAtRestore(false);
      setRestoreReady(false);
    } else {
      lastProfileSyncFingerprintRef.current = null;
      lastTrainingStateSyncFingerprintRef.current = null;
      lastCheckupSyncFingerprintRef.current = null;
      lastBlockSyncFingerprintRef.current = null;
      lastSessionSyncFingerprintRef.current = null;
      lastMicroCheckSyncFingerprintRef.current = null;
      lastBlockReportSyncFingerprintRef.current = null;
      remoteRestoreAttemptedRef.current = false;
      setRestoreOutcome('signed_out');
      setLocalWasEmptyAtRestore(false);
      if (launchSyncRetryTimerRef.current) {
        clearTimeout(launchSyncRetryTimerRef.current);
        launchSyncRetryTimerRef.current = null;
      }
      setRestoreReady(false);
      if (trainingStateSyncTimerRef.current) {
        clearTimeout(trainingStateSyncTimerRef.current);
        trainingStateSyncTimerRef.current = null;
      }
    }
  }, [backendSignedIn, backendUserId]);

  React.useEffect(() => {
    return () => {
      if (profileSyncTimerRef.current) {
        clearTimeout(profileSyncTimerRef.current);
      }
      if (trainingStateSyncTimerRef.current) {
        clearTimeout(trainingStateSyncTimerRef.current);
      }
      if (launchSyncRetryTimerRef.current) {
        clearTimeout(launchSyncRetryTimerRef.current);
      }
    };
  }, []);

  const scheduleLaunchSyncRetry = React.useCallback(() => {
    if (launchSyncRetryTimerRef.current) return;

    launchSyncRetryTimerRef.current = setTimeout(() => {
      launchSyncRetryTimerRef.current = null;
      setLaunchSyncRetryTick((tick) => tick + 1);
    }, LAUNCH_SYNC_RETRY_DELAY_MS);
  }, []);

  React.useEffect(() => {
    if (!backendSignedIn || !backendUserId) return;
    if (!historyReady || !profileReady || !trainingReady || !microChecksReady || !adherenceReady)
      return;
    if (remoteRestoreAttemptedRef.current) return;
    if (flow !== null) {
      remoteRestoreAttemptedRef.current = true;
      setRestoreOutcome('skipped_active_flow');
      setLocalWasEmptyAtRestore(false);
      setRestoreReady(true);
      addBreadcrumb('restore skipped', { status: 'skipped_active_flow' });
      return;
    }

    remoteRestoreAttemptedRef.current = true;
    const launchLocalState = {
      preferences: prefs,
      history,
      training,
      microChecks,
      adherence,
    };
    setLocalWasEmptyAtRestore(isLocalStateEmptyForRestore(launchLocalState));
    addBreadcrumb('restore started', {
      localWasEmpty: isLocalStateEmptyForRestore(launchLocalState),
    });
    let cancelled = false;

    void restoreRemoteStateIfLocalEmpty({
      local: launchLocalState,
      stores: {
        profileStore,
        historyStore: store,
        trainingStore,
        adherenceStore,
      },
    })
      .then((result) => {
        if (cancelled) return;
        setRestoreOutcome(launchRestoreOutcomeFromStatus(result.status));
        addBreadcrumb('restore completed', {
          status: result.status,
          gaps: result.gaps.length,
          restoredCounts: result.restoredCounts,
        });

        if (result.status === 'restored' && result.restoredState) {
          setPrefs(result.restoredState.preferences);
          setHistory(result.restoredState.history);
          setTraining(result.restoredState.training);
          setMicroChecks(result.restoredState.microChecks);
          setAdherence(result.restoredState.adherence);
          lastProfileSyncFingerprintRef.current = null;
          lastTrainingStateSyncFingerprintRef.current = null;
          lastCheckupSyncFingerprintRef.current = null;
          lastBlockSyncFingerprintRef.current = null;
          lastSessionSyncFingerprintRef.current = null;
          lastMicroCheckSyncFingerprintRef.current = null;
          lastBlockReportSyncFingerprintRef.current = null;
        }

        if (__DEV__) {
          console.log(`[restore] launch restore status=${result.status}`);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRestoreOutcome('failed');
          console.warn('[restore] launch restore failed', error);
          captureError(error, { area: 'restore', action: 'launch_restore' });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRestoreReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    adherence,
    adherenceReady,
    backendSignedIn,
    backendUserId,
    flow,
    history,
    historyReady,
    microChecks,
    microChecksReady,
    prefs,
    profileReady,
    profileStore,
    adherenceStore,
    store,
    training,
    trainingReady,
    trainingStore,
  ]);

  const goHome = React.useCallback(() => {
    replaceNextNavigationLocation(navigationLocation(DEFAULT_TAB_KEY, null), {
      clearHistory: true,
    });
    setDevOnboardingReplay(false);
    setFlow(null);
    setTab(DEFAULT_TAB_KEY);
    setSessionIds([]);
    setActiveSessionPlan(null);
    setPlanningRecoveryResult(null);
    setLastSessionResult(null);
    setSelectedLadderId(null);
    setSelectedLearnId(null);
    setMovementProfileV2InitialFlow(null);
    setMovementProfileV2Raw(null);
    setMovementProfileV2Result(null);
    setMovementProfileV2OfficialRetestContext(null);
    setMovementProfileV2RetestComparison(null);
    setMovementProfileV2BlockReport(null);
    setMovementProfileV2PlanBlockId(null);
    setMovementProfileV2PlanState(DEFAULT_MOVEMENT_PROFILE_V2_PLAN_STATE);
    setMovementProfileV2ResultSurface('standalone');
    setMovementProfileV2EntryContext('internal');
    setMovementProfileV2DetailDomain(null);
    setMicroCheckLaunch(null);
    setLastMicroCheckSummary(null);
  }, [replaceNextNavigationLocation]);

  const movementProfileV2FlowAllowed =
    movementProfileV2InternalSurfaceEnabled ||
    flow === null ||
    !flow.startsWith('movement-profile-v2') ||
    flow === 'movement-profile-v2-retest-unavailable' ||
    (movementProfileV2EntryContext !== 'internal' && PUBLIC_MOVEMENT_PROFILE_V2_FLOWS.has(flow));
  const releaseGatedFlowAllowed = isReleaseGatedFlowAllowed(flow, {
    dev: developerRuntime,
    poseLatencyDiagnosticsEnabled,
  });

  React.useEffect(() => {
    if (movementProfileV2FlowAllowed && releaseGatedFlowAllowed) return;
    goHome();
  }, [goHome, movementProfileV2FlowAllowed, releaseGatedFlowAllowed]);

  const goBack = React.useCallback(
    (fallback?: () => void) => {
      const current = currentLocationRef.current;
      const historyStack = navigationHistoryRef.current.slice();
      let previous = historyStack.pop();

      while (previous && sameNavigationLocation(previous, current)) {
        previous = historyStack.pop();
      }

      navigationHistoryRef.current = historyStack;

      if (previous) {
        replaceNextNavigationLocation(previous);
        setTab(previous.tab);
        setFlow(previous.flow);
        return;
      }

      if (fallback) {
        fallback();
        return;
      }

      goHome();
    },
    [goHome, replaceNextNavigationLocation]
  );

  const handleAndroidHardwareBack = React.useCallback(() => {
    if (progressHistoryOpen) {
      setProgressHistoryOpen(false);
      return true;
    }

    const current = currentLocationRef.current;
    const hasPreviousLocation = navigationHistoryRef.current.some(
      (location) => !sameNavigationLocation(location, current)
    );

    if (hasPreviousLocation) {
      goBack(() => undefined);
      return true;
    }

    if (current.flow !== null) {
      goHome();
      return true;
    }

    // Home tab with no history: let the OS handle back (backgrounds the app).
    return false;
  }, [goBack, goHome, progressHistoryOpen]);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleAndroidHardwareBack
    );
    return () => subscription.remove();
  }, [handleAndroidHardwareBack]);

  const goExplore = React.useCallback(() => {
    replaceNextNavigationLocation(navigationLocation('explore', null));
    setDevOnboardingReplay(false);
    setFlow(null);
    setTab('explore');
    setPlanningRecoveryResult(null);
    setSelectedLadderId(null);
    setSelectedLearnId(null);
  }, [replaceNextNavigationLocation]);

  const goSettings = React.useCallback(() => {
    setFlow('settings');
    setPlanningRecoveryResult(null);
    setSelectedLadderId(null);
    setSelectedLearnId(null);
  }, []);

  const openCameraSetup = React.useCallback((entry: CameraSetupEntry = 'checkup') => {
    setCameraSetupEntry(entry);
    setFlow('camera-setup');
  }, []);

  const openLifeGoal = React.useCallback((entry: LifeGoalEntry = 'onboarding') => {
    setLifeGoalEntry(entry);
    setFlow('life-goal');
  }, []);

  const openSafetyProfile = React.useCallback((entry: SafetyProfileEntry = 'onboarding') => {
    setSafetyProfileEntry(entry);
    setFlow('safety-profile');
  }, []);

  const persistTraining = React.useCallback(
    (next: TrainingState) => {
      setTraining(next);
      try {
        trainingStore.saveState(next);
        return true;
      } catch (e) {
        console.warn('[training] save failed', e);
        return false;
      }
    },
    [trainingStore]
  );

  const persistPrefs = React.useCallback(
    (next: Preferences) => {
      setPrefs(next);
      try {
        profileStore.save(next);
      } catch (e) {
        console.warn('[profile] save failed', e);
      }
    },
    [profileStore]
  );

  const queueProfileSync = React.useCallback(
    (nextPrefs: Preferences, options: { hydrateLocalFromRemote?: boolean } = {}) => {
      const fingerprint = JSON.stringify(nextPrefs);
      if (
        !options.hydrateLocalFromRemote &&
        lastProfileSyncFingerprintRef.current === fingerprint
      ) {
        return;
      }
      if (profileSyncTimerRef.current) {
        clearTimeout(profileSyncTimerRef.current);
      }

      profileSyncTimerRef.current = setTimeout(() => {
        addBreadcrumb('sync category started', {
          category: 'profile_preferences',
        });
        void syncLocalPreferencesToRemote(nextPrefs, {
          hydrateLocalFromRemote: options.hydrateLocalFromRemote,
          hydrateRoutingFields: false,
        })
          .then((result) => {
            addBreadcrumb('sync category completed', {
              category: 'profile_preferences',
              status: result.status,
            });
            if (result.status === 'signed_out' || result.status === 'failed') return;

            if (result.status === 'hydrated' && result.preferences) {
              const hydratedFingerprint = JSON.stringify(result.preferences);
              lastProfileSyncFingerprintRef.current = hydratedFingerprint;
              setPrefs(result.preferences);
              try {
                profileStore.save(result.preferences);
              } catch (e) {
                console.warn('[profile] save failed after remote hydration', e);
              }
              return;
            }

            lastProfileSyncFingerprintRef.current = fingerprint;
          })
          .catch((error) => {
            console.warn('[profile-sync] launch sync failed', error);
            addBreadcrumb('sync category failed', {
              category: 'profile_preferences',
            });
          });
      }, 750);
    },
    [profileStore]
  );

  React.useEffect(() => {
    if (!profileReady || !backendSignedIn || !backendUserId || !restoreReady) return;
    const hydrateLocalFromRemote = !remoteProfileHydrationAttemptedRef.current;
    remoteProfileHydrationAttemptedRef.current = true;
    queueProfileSync(prefs, { hydrateLocalFromRemote });
  }, [backendSignedIn, backendUserId, prefs, profileReady, queueProfileSync, restoreReady]);

  React.useEffect(() => {
    if (!backendSignedIn || !backendUserId || !trainingReady || !restoreReady) return;
    if (
      !shouldSyncTrainingStateAfterLaunchRestore({
        localWasEmptyAtRestore,
        restoreOutcome,
        training,
      })
    ) {
      if (__DEV__) {
        console.log(`[training-state-sync] launch sync blocked after restore ${restoreOutcome}`);
      }
      addBreadcrumb('sync category skipped', {
        category: 'training_state',
        reason: 'restore_guard',
        restoreOutcome,
      });
      return;
    }

    const fingerprint = JSON.stringify({
      block: training.block,
      progression: training.progression,
      equipment: training.equipment,
      progress: training.progress,
      ladderProgressById: training.ladderProgressById,
      generatedSessionSummaries: training.generatedSessionSummaries,
      lastPostSessionFeedback: training.lastPostSessionFeedback,
      planPreferences: training.planPreferences,
    });

    if (lastTrainingStateSyncFingerprintRef.current === fingerprint) return;
    if (trainingStateSyncTimerRef.current) {
      clearTimeout(trainingStateSyncTimerRef.current);
    }

    trainingStateSyncTimerRef.current = setTimeout(() => {
      addBreadcrumb('sync category started', { category: 'training_state' });
      void syncTrainingStateToRemote({ training })
        .then((result) => {
          addBreadcrumb('sync category completed', {
            category: 'training_state',
            status: result.status,
          });
          if (result.status === 'synced') {
            lastTrainingStateSyncFingerprintRef.current = fingerprint;
          } else if (shouldRetryLaunchSync([result])) {
            scheduleLaunchSyncRetry();
          }
        })
        .catch((error) => {
          console.warn('[training-state-sync] launch sync failed', error);
          addBreadcrumb('sync category failed', { category: 'training_state' });
          scheduleLaunchSyncRetry();
        });
    }, 1000);
  }, [
    backendSignedIn,
    backendUserId,
    launchSyncRetryTick,
    localWasEmptyAtRestore,
    restoreOutcome,
    restoreReady,
    scheduleLaunchSyncRetry,
    training,
    trainingReady,
  ]);

  React.useEffect(() => {
    if (!backendSignedIn || !backendUserId || !historyReady || !adherenceReady || !restoreReady)
      return;
    const fingerprint = JSON.stringify({
      checkups: history.map((record) => [record.checkUp.startedAt, record.checkupType]),
      assessments: adherence.assessments.map((assessment) => [
        assessment.id,
        assessment.type,
        assessment.status,
        assessment.completedAt,
      ]),
    });

    if (lastCheckupSyncFingerprintRef.current === fingerprint) return;

    addBreadcrumb('sync category started', { category: 'checkups' });
    void syncRecentMovementCheckupsToRemote(history, {
      assessments: adherence.assessments,
    })
      .then((results) => {
        addBreadcrumb('sync category completed', {
          category: 'checkups',
          ...syncStatusCounts(results),
        });
        if (shouldCommitLaunchSyncFingerprint(results)) {
          lastCheckupSyncFingerprintRef.current = fingerprint;
        }
        if (shouldRetryLaunchSync(results)) {
          scheduleLaunchSyncRetry();
        }
        if (__DEV__) {
          const synced = results.filter((result) => result.status === 'synced').length;
          const failed = results.filter((result) => result.status === 'failed').length;
          if (synced > 0 || failed > 0) {
            console.log(`[checkup-sync] launch sync complete synced=${synced} failed=${failed}`);
          }
        }
      })
      .catch((error) => {
        console.warn('[checkup-sync] launch sync failed', error);
        addBreadcrumb('sync category failed', { category: 'checkups' });
        scheduleLaunchSyncRetry();
      });
  }, [
    adherence.assessments,
    adherenceReady,
    backendSignedIn,
    backendUserId,
    history,
    historyReady,
    launchSyncRetryTick,
    restoreReady,
    scheduleLaunchSyncRetry,
  ]);

  React.useEffect(() => {
    if (
      !backendSignedIn ||
      !backendUserId ||
      !adherenceReady ||
      !trainingReady ||
      !restoreReady ||
      adherence.blocks.length === 0
    )
      return;
    const fingerprint = JSON.stringify({
      blocks: adherence.blocks.map((block) => [
        block.id,
        movementBlockSourceCheckUpId(block),
        block.status,
        block.completedSessions,
        block.microChecksCompleted,
        block.updatedAt,
      ]),
      training: {
        blockCreatedAt: training.block?.createdAt ?? null,
        progress: training.progress,
        equipment: training.equipment,
      },
      localCheckups: history.map((record) => record.checkUp.startedAt),
    });

    if (lastBlockSyncFingerprintRef.current === fingerprint) return;

    addBreadcrumb('sync category started', { category: 'movement_blocks' });
    void syncRecentMovementBlocksToRemote(adherence.blocks, { training })
      .then((results) => {
        addBreadcrumb('sync category completed', {
          category: 'movement_blocks',
          ...syncStatusCounts(results),
        });
        if (shouldCommitLaunchSyncFingerprint(results)) {
          lastBlockSyncFingerprintRef.current = fingerprint;
        }
        if (shouldRetryLaunchSync(results)) {
          scheduleLaunchSyncRetry();
        }
        if (__DEV__) {
          const synced = results.filter((result) => result.status === 'synced').length;
          const failed = results.filter((result) => result.status === 'failed').length;
          if (synced > 0 || failed > 0) {
            console.log(`[block-sync] launch sync complete synced=${synced} failed=${failed}`);
          }
        }
      })
      .catch((error) => {
        console.warn('[block-sync] launch sync failed', error);
        addBreadcrumb('sync category failed', { category: 'movement_blocks' });
        scheduleLaunchSyncRetry();
      });
  }, [
    adherence.blocks,
    adherenceReady,
    backendSignedIn,
    backendUserId,
    history,
    launchSyncRetryTick,
    restoreReady,
    scheduleLaunchSyncRetry,
    training,
    trainingReady,
  ]);

  React.useEffect(() => {
    if (
      !backendSignedIn ||
      !backendUserId ||
      !adherenceReady ||
      !trainingReady ||
      !restoreReady ||
      adherence.completions.length === 0
    )
      return;
    const fingerprint = JSON.stringify({
      completions: adherence.completions.map((completion) => [
        completion.id,
        completion.blockId,
        completion.sessionType,
        completion.plannedDate,
        completion.completedAt,
        completion.durationMinutes,
        completion.perceivedEffort,
        completion.painReported,
        (completion as { painArea?: PainArea }).painArea,
        (completion as { completed?: boolean }).completed,
        (completion as { trackingQuality?: TrackingQuality }).trackingQuality,
      ]),
      blocks: adherence.blocks.map((block) => [block.id, block.updatedAt]),
      generatedSummaries: training.generatedSessionSummaries.map((summary) => [
        summary.id,
        summary.blockId,
        summary.completedAt,
        summary.feedback?.submittedAt,
      ]),
    });

    if (lastSessionSyncFingerprintRef.current === fingerprint) return;

    addBreadcrumb('sync category started', { category: 'session_completions' });
    void syncRecentTrainingSessionCompletionsToRemote(adherence.completions, {
      blocks: adherence.blocks,
      generatedSummaries: training.generatedSessionSummaries,
    })
      .then((results) => {
        addBreadcrumb('sync category completed', {
          category: 'session_completions',
          ...syncStatusCounts(results),
        });
        if (shouldCommitLaunchSyncFingerprint(results)) {
          lastSessionSyncFingerprintRef.current = fingerprint;
        }
        if (shouldRetryLaunchSync(results)) {
          scheduleLaunchSyncRetry();
        }
        if (__DEV__) {
          const synced = results.filter((result) => result.status === 'synced').length;
          const failed = results.filter((result) => result.status === 'failed').length;
          if (synced > 0 || failed > 0) {
            console.log(`[session-sync] launch sync complete synced=${synced} failed=${failed}`);
          }
        }
      })
      .catch((error) => {
        console.warn('[session-sync] launch sync failed', error);
        addBreadcrumb('sync category failed', {
          category: 'session_completions',
        });
        scheduleLaunchSyncRetry();
      });
  }, [
    adherence.blocks,
    adherence.completions,
    adherenceReady,
    backendSignedIn,
    backendUserId,
    launchSyncRetryTick,
    restoreReady,
    scheduleLaunchSyncRetry,
    training.generatedSessionSummaries,
    trainingReady,
  ]);

  React.useEffect(() => {
    const syncableMicroChecks = microChecks.filter((result) => !isOptionalMicroCheckResult(result));
    if (
      !backendSignedIn ||
      !backendUserId ||
      !adherenceReady ||
      !microChecksReady ||
      !restoreReady ||
      syncableMicroChecks.length === 0
    )
      return;
    const fingerprint = JSON.stringify({
      microChecks: syncableMicroChecks.map((result) => [
        result.slotId,
        result.blockId,
        result.type,
        result.startedAt,
        result.completedAt,
        result.value,
        result.reps,
        result.measured,
      ]),
      microCheckCompletions: adherence.completions
        .filter((completion) => completion.sessionType === 'micro_check')
        .map((completion) => [
          completion.id,
          completion.blockId,
          completion.completedAt,
          completion.microCheckSlot?.slotId,
        ]),
      blocks: adherence.blocks.map((block) => [
        block.id,
        block.updatedAt,
        block.microChecksCompleted,
      ]),
    });

    if (lastMicroCheckSyncFingerprintRef.current === fingerprint) return;

    addBreadcrumb('sync category started', { category: 'micro_checks' });
    void syncRecentMicroChecksToRemote(syncableMicroChecks, {
      blocks: adherence.blocks,
      completions: adherence.completions,
    })
      .then((results) => {
        addBreadcrumb('sync category completed', {
          category: 'micro_checks',
          ...syncStatusCounts(results),
        });
        if (shouldCommitLaunchSyncFingerprint(results)) {
          lastMicroCheckSyncFingerprintRef.current = fingerprint;
        }
        if (shouldRetryLaunchSync(results)) {
          scheduleLaunchSyncRetry();
        }
        if (__DEV__) {
          const synced = results.filter((result) => result.status === 'synced').length;
          const failed = results.filter((result) => result.status === 'failed').length;
          if (synced > 0 || failed > 0) {
            console.log(`[microcheck-sync] launch sync complete synced=${synced} failed=${failed}`);
          }
        }
      })
      .catch((error) => {
        console.warn('[microcheck-sync] launch sync failed', error);
        addBreadcrumb('sync category failed', { category: 'micro_checks' });
        scheduleLaunchSyncRetry();
      });
  }, [
    adherence.blocks,
    adherence.completions,
    adherenceReady,
    backendSignedIn,
    backendUserId,
    launchSyncRetryTick,
    microChecks,
    microChecksReady,
    restoreReady,
    scheduleLaunchSyncRetry,
  ]);

  React.useEffect(() => {
    if (
      !backendSignedIn ||
      !backendUserId ||
      !adherenceReady ||
      !restoreReady ||
      adherence.reports.length === 0
    )
      return;
    const fingerprint = JSON.stringify({
      reports: adherence.reports.map((report) => [
        report.id,
        report.blockId,
        report.baselineAssessmentId,
        report.retestAssessmentId,
        report.createdAt,
        report.sessionsCompleted,
        report.microChecksCompleted,
        report.recommendedNextFocusDomain,
      ]),
      blocks: adherence.blocks.map((block) => [block.id, block.updatedAt, block.status]),
      assessments: adherence.assessments.map((assessment) => [
        assessment.id,
        assessment.completedAt,
        assessment.results?.rawMetrics?.checkUpId,
      ]),
      completions: adherence.completions.map((completion) => [
        completion.id,
        completion.blockId,
        completion.sessionType,
        completion.completedAt,
      ]),
    });

    if (lastBlockReportSyncFingerprintRef.current === fingerprint) return;

    addBreadcrumb('sync category started', { category: 'block_reports' });
    void syncRecentMovementBlockReportsToRemote(adherence.reports, {
      blocks: adherence.blocks,
      assessments: adherence.assessments,
      completions: adherence.completions,
    })
      .then((results) => {
        addBreadcrumb('sync category completed', {
          category: 'block_reports',
          ...syncStatusCounts(results),
        });
        if (shouldCommitLaunchSyncFingerprint(results)) {
          lastBlockReportSyncFingerprintRef.current = fingerprint;
        }
        if (shouldRetryLaunchSync(results)) {
          scheduleLaunchSyncRetry();
        }
        if (__DEV__) {
          const synced = results.filter((result) => result.status === 'synced').length;
          const failed = results.filter((result) => result.status === 'failed').length;
          if (synced > 0 || failed > 0) {
            console.log(
              `[block-report-sync] launch sync complete synced=${synced} failed=${failed}`
            );
          }
        }
      })
      .catch((error) => {
        console.warn('[block-report-sync] launch sync failed', error);
        addBreadcrumb('sync category failed', { category: 'block_reports' });
        scheduleLaunchSyncRetry();
      });
  }, [
    adherence.assessments,
    adherence.blocks,
    adherence.completions,
    adherence.reports,
    adherenceReady,
    backendSignedIn,
    backendUserId,
    launchSyncRetryTick,
    restoreReady,
    scheduleLaunchSyncRetry,
  ]);

  const persistAdherence = React.useCallback(
    (next: AdherenceStoreState) => {
      setAdherence(next);
      try {
        adherenceStore.save(next);
        return true;
      } catch (e) {
        console.warn('[adherence] save failed', e);
        return false;
      }
    },
    [adherenceStore]
  );

  const recordBlockedBlockCreation = React.useCallback(
    (
      source: string,
      eligibility: ReturnType<typeof getBlockCreationEligibility>,
      checkupType?: CheckupType | null
    ) => {
      if (eligibility.eligible) return;
      addBreadcrumb('block creation blocked', {
        area: 'assessment_validity',
        source,
        reason: eligibility.reason,
        checkupType: checkupType ?? 'unknown',
        measuredDomainCount: eligibility.measuredDomains.length,
      });
    },
    []
  );

  const prepareBlockFromOfficialCheckUp = React.useCallback(
    ({
      baseAdherence,
      baseTraining,
      sourceCheckUpId,
      score,
      scoreSnapshot,
      assessment,
      nowIso,
      source,
    }: {
      baseAdherence: AdherenceStoreState;
      baseTraining: TrainingState;
      sourceCheckUpId: string;
      score: CheckUpScore;
      scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
      assessment: MovementAssessment | null | undefined;
      nowIso: string;
      source: string;
    }) => {
      const result = createAutomaticMovementBlock({
        adherence: baseAdherence,
        training: baseTraining,
        sourceCheckUpId,
        assessment,
        score,
        scoreSnapshot,
        lifeGoal: prefs.profile.lifeGoal,
        user: prefs.profile,
        nowIso,
      });
      if (!result.ok) {
        recordBlockedBlockCreation(source, result.eligibility, assessment?.type);
        return null;
      }

      const adherenceSaved = persistAdherence(result.adherence);
      persistTraining(result.training);
      if (adherenceSaved && backendSignedIn && backendUserId) {
        void syncMovementBlockToRemote({
          block: result.movementBlock,
          trainingBlock: result.trainingBlock,
          training: result.training,
          blockNumber: blockNumberForBlocks(result.adherence.blocks, result.movementBlock.id),
          sourceCheckupLocalId: sourceCheckUpId,
        });
      }
      return result;
    },
    [
      backendSignedIn,
      backendUserId,
      persistAdherence,
      persistTraining,
      prefs.profile,
      recordBlockedBlockCreation,
    ]
  );

  const activeMovementBlock = React.useMemo(
    () => getActiveMovementBlock(adherence.blocks),
    [adherence.blocks]
  );
  const devMockDataEnabled =
    isDevMockDataAllowed({ dev: developerRuntime }) && prefs.settings.devMockDataEnabled;
  const devPreviewNowIso = React.useMemo(() => new Date().toISOString(), [devMockDataEnabled]);
  const devMockData = React.useMemo(
    () => (devMockDataEnabled ? buildProgressDevMockData(devPreviewNowIso) : null),
    [devMockDataEnabled, devPreviewNowIso]
  );
  const blockIntroPreview = React.useMemo(
    () => (TEMP_PREVIEW_BLOCK_INTRO_SCREEN ? buildBlockIntroPreview(devPreviewNowIso) : null),
    [devPreviewNowIso]
  );
  const displayProfile = React.useMemo(
    () =>
      devMockDataEnabled
        ? buildDevCompletedOnboardingProfile(prefs.profile, devPreviewNowIso)
        : prefs.profile,
    [devMockDataEnabled, devPreviewNowIso, prefs.profile]
  );
  const displayPrefs = React.useMemo(
    () =>
      devMockDataEnabled
        ? {
            ...prefs,
            profile: displayProfile,
            onboarding: {
              ...prefs.onboarding,
              currentStep: 'complete' as const,
              completedAt: prefs.onboarding.completedAt ?? devPreviewNowIso,
              updatedAt: prefs.onboarding.updatedAt ?? devPreviewNowIso,
            },
          }
        : prefs,
    [devMockDataEnabled, devPreviewNowIso, displayProfile, prefs]
  );
  const displayHistory = devMockData ? devMockData.history : history;
  const pendingMovementProfileV2Raw = React.useMemo(
    () => latestPendingMovementProfileV2RawCheckUp(history),
    [history]
  );
  const displayAdherence = React.useMemo(() => {
    if (devMockData) {
      return {
        ...adherence,
        assessments: devMockData.assessments,
        blocks: devMockData.blocks,
        reports: devMockData.reports,
        completions: devMockData.completions,
      };
    }
    return adherence;
  }, [adherence, devMockData]);
  const displayTraining = React.useMemo(() => {
    if (devMockData) {
      return {
        ...training,
        ladderProgressById: devMockData.ladderProgressById,
      };
    }
    return training;
  }, [devMockData, training]);
  const displayActiveMovementBlock = React.useMemo(
    () => getActiveMovementBlock(displayAdherence.blocks),
    [displayAdherence.blocks]
  );
  const movementProfileV2Progress = React.useMemo(() => {
    return buildMovementProfileV2ProgressViewModel({
      history: displayHistory,
      blocks: displayAdherence.blocks,
      reports: displayAdherence.reports,
      today: new Date().toISOString(),
    });
  }, [displayAdherence.blocks, displayAdherence.reports, displayHistory]);
  const movementProfileV2AuthorityFacts = movementProfileV2Progress.authorityFacts;
  const hasMovementProfileV2AuthorityState =
    movementProfileV2AuthorityFacts.acceptedProfileIds.length > 0 ||
    movementProfileV2AuthorityFacts.v2BlockIds.length > 0 ||
    movementProfileV2AuthorityFacts.acceptedReportIds.length > 0 ||
    movementProfileV2AuthorityFacts.hasMalformedState;
  const legacyV1RollbackAvailable =
    LEGACY_V1_CHECKUP_ROLLBACK_ENABLED && !hasMovementProfileV2AuthorityState;
  const legacyV1CheckUpFlowAllowed =
    legacyV1RollbackAvailable &&
    !!pendingCheckup &&
    (pendingCheckup.type === 'baseline' ||
      pendingCheckup.type === 'baseline_retake' ||
      (pendingCheckup.type === 'official_retest' &&
        activeMovementBlock?.origin?.kind === 'legacy_v1_assessment'));
  const legacyV1ResultsFlowAllowed = legacyV1RollbackAvailable;
  const progressDataAuthority = React.useMemo(
    () =>
      selectProgressDataAuthority({
        acceptedV2OfficialProfiles: movementProfileV2AuthorityFacts.acceptedProfileIds,
        v2OriginBlocks: displayAdherence.blocks,
        acceptedV2Reports: displayAdherence.reports.filter((report) =>
          movementProfileV2AuthorityFacts.acceptedReportIds.includes(report.id)
        ),
        hasMalformedV2State: movementProfileV2AuthorityFacts.hasMalformedState,
        v1RollbackAvailable: LEGACY_V1_CHECKUP_ROLLBACK_ENABLED,
      }),
    [displayAdherence.blocks, displayAdherence.reports, movementProfileV2AuthorityFacts]
  );
  React.useEffect(() => {
    if (flow === 'checkup' && !legacyV1CheckUpFlowAllowed) {
      goHome();
      return;
    }
    if (flow === 'results' && !legacyV1ResultsFlowAllowed) {
      goHome();
    }
  }, [flow, goHome, legacyV1CheckUpFlowAllowed, legacyV1ResultsFlowAllowed]);
  const displayMovementBlock = React.useMemo(
    () =>
      blockIntroPreview?.block ?? activeMovementBlock ?? getLatestMovementBlock(adherence.blocks),
    [activeMovementBlock, adherence.blocks, blockIntroPreview]
  );
  const onboardingStep = React.useMemo(
    () =>
      deriveOnboardingStep({
        prefs: displayPrefs,
        history: displayHistory,
        assessments: displayAdherence.assessments,
        activeBlock: displayActiveMovementBlock,
      }),
    [displayActiveMovementBlock, displayAdherence.assessments, displayHistory, displayPrefs]
  );
  const onboardingIncomplete = onboardingStep !== 'complete';
  const onboardingFlowActive = onboardingIncomplete || devOnboardingReplay;
  const latestStoredCheckUp = history.length > 0 ? history[history.length - 1].checkUp : null;
  const visibleResult = lastResult ?? latestStoredCheckUp;
  const visibleResultRecord = React.useMemo(
    () =>
      visibleResult
        ? (history.find((record) => record.checkUp.startedAt === visibleResult.startedAt) ?? null)
        : null,
    [history, visibleResult]
  );
  const visibleResultSnapshot = React.useMemo(() => {
    if (visibleResult && lastResult?.startedAt === visibleResult.startedAt)
      return lastResultScoreSnapshot;
    return visibleResultRecord?.scoreSnapshot ?? null;
  }, [lastResult, lastResultScoreSnapshot, visibleResult, visibleResultRecord]);
  const visibleResultScore = React.useMemo(() => {
    if (visibleResult && lastResult?.startedAt === visibleResult.startedAt) return lastResultScore;
    const parsed = parseStoredScoreSnapshot(visibleResultRecord?.scoreSnapshot);
    return parsed.ok ? parsed.score : null;
  }, [lastResult, lastResultScore, visibleResult, visibleResultRecord]);
  const visibleResultAssessment = React.useMemo(
    () =>
      visibleResult ? assessmentForCheckUp(adherence.assessments, visibleResult.startedAt) : null,
    [adherence.assessments, visibleResult]
  );
  const visibleResultNextPlanReady = React.useMemo(() => {
    const visibleType = lastResultCheckupType ?? visibleResultAssessment?.type ?? null;
    if (visibleType !== 'official_retest' || !visibleResult || !activeMovementBlock) return false;
    return movementBlockSourceCheckUpId(activeMovementBlock) === visibleResult.startedAt;
  }, [activeMovementBlock, lastResultCheckupType, visibleResult, visibleResultAssessment]);
  const visibleResultOpenedFromProgress =
    !!visibleResult && progressResultCheckUpId === visibleResult.startedAt;
  const showingPendingOnboardingResult =
    !prefs.onboarding.completedAt &&
    (prefs.onboarding.currentStep === 'results' || prefs.onboarding.currentStep === 'create_block');
  const showOnboardingResult =
    (onboardingFlowActive || showingPendingOnboardingResult) &&
    (prefs.onboarding.currentStep === 'results' || prefs.onboarding.currentStep === 'create_block');
  const onboardingDecisionReady = historyReady && profileReady && adherenceReady && restoreReady;
  const pendingInitialOnboardingFlow =
    onboardingDecisionReady && flow === null ? flowForOnboardingStep(onboardingStep) : null;

  React.useEffect(() => {
    if (!pendingInitialOnboardingFlow) return;
    if (pendingMovementProfileV2Raw) {
      return;
    }
    replaceNextNavigationLocation(
      navigationLocation(currentLocationRef.current.tab, pendingInitialOnboardingFlow)
    );
    setFlow(pendingInitialOnboardingFlow);
  }, [
    pendingInitialOnboardingFlow,
    pendingMovementProfileV2Raw,
    replaceNextNavigationLocation,
  ]);

  React.useEffect(() => {
    if (!historyReady || !adherenceReady || !trainingReady || !restoreReady || activeMovementBlock)
      return;
    const official = latestUsableOfficialCheckUpRecord(history, adherence.assessments);
    if (!official) return;

    const sourceKey = `${official.record.checkUp.startedAt}:${official.assessment.id}`;
    if (autoPreparedBlockSourceRef.current === sourceKey) return;
    autoPreparedBlockSourceRef.current = sourceKey;

    prepareBlockFromOfficialCheckUp({
      baseAdherence: adherence,
      baseTraining: training,
      sourceCheckUpId: official.record.checkUp.startedAt,
      score: official.score,
      scoreSnapshot: official.scoreSnapshot,
      assessment: official.assessment,
      nowIso: new Date().toISOString(),
      source: 'automatic_missing_block_repair',
    });
  }, [
    activeMovementBlock,
    adherence,
    adherenceReady,
    history,
    historyReady,
    prepareBlockFromOfficialCheckUp,
    restoreReady,
    training,
    trainingReady,
  ]);

  const onProfileChange = React.useCallback(
    (profile: UserProfile) => persistPrefs({ ...prefs, profile }),
    [prefs, persistPrefs]
  );
  const onSettingsChange = React.useCallback(
    (settings: AppSettings) => {
      persistPrefs({ ...prefs, settings });
    },
    [prefs, persistPrefs]
  );

  const onLifeGoalSave = React.useCallback(
    (lifeGoal: LifeGoal) => {
      const now = new Date().toISOString();
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          lifeGoal,
          goal: getLifeGoalDisplayText(lifeGoal),
        },
        onboarding: onboardingFlowActive && lifeGoalEntry !== 'review'
          ? {
              ...prefs.onboarding,
              currentStep: 'safety_profile',
              updatedAt: now,
            }
          : prefs.onboarding,
      });
      if (onboardingFlowActive && lifeGoalEntry !== 'review') {
        openSafetyProfile();
      } else if (lifeGoalEntry === 'review') {
        setFlow('settings');
      } else {
        goHome();
      }
    },
    [goHome, lifeGoalEntry, onboardingFlowActive, openSafetyProfile, persistPrefs, prefs]
  );

  const onSafetyProfileSave = React.useCallback(
    (
      safetyProfile: MovementSafetyProfile,
      referenceDetails: {
        dateOfBirth: string;
        exactAge: number;
        ageBand: AgeBand | null;
        referenceSex: 'female' | 'male';
      },
      options?: { stayOnScreen?: boolean }
    ) => {
      const now = new Date().toISOString();
      const nextSafetyProfile = safetyProfileWithCanonicalEquipment(
        {
          ...safetyProfile,
          age: referenceDetails.exactAge,
          ageBand: referenceDetails.ageBand ?? undefined,
        },
        safetyProfile.availableEquipment,
        {
          status:
            safetyProfile.equipmentStatus ??
            (onboardingFlowActive ? 'needs_confirmation' : 'confirmed'),
          updatedAt: now,
          revision: safetyProfile.equipmentRevision,
        }
      );
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          dateOfBirth: referenceDetails.dateOfBirth,
          exactAge: referenceDetails.exactAge,
          referenceSex: referenceDetails.referenceSex,
          age: referenceDetails.exactAge,
          ageBand: referenceDetails.ageBand,
          safetyProfile: nextSafetyProfile,
        },
        onboarding: onboardingFlowActive
          ? { ...prefs.onboarding, currentStep: 'equipment', updatedAt: now }
          : prefs.onboarding,
      });
      persistTraining({
        ...training,
        equipment: legacyEquipmentFromCanonical(
          canonicalEquipmentFromSafetyProfile(nextSafetyProfile)
        ),
      });
      if (onboardingFlowActive) {
        setFlow('equipment');
      } else if (!options?.stayOnScreen) {
        goHome();
      }
    },
    [goHome, onboardingFlowActive, persistPrefs, persistTraining, prefs, training]
  );

  const handleEquipmentSave = React.useCallback(
    (input: {
      selectedEquipment: string[];
      availableEquipment: AvailableEquipment[];
      equipment: EquipmentProfile;
    }) => {
      const now = new Date().toISOString();
      const existingSafetyProfile = prefs.profile.safetyProfile;
      const nextSafetyProfile = existingSafetyProfile
        ? safetyProfileWithCanonicalEquipment(existingSafetyProfile, input.availableEquipment, {
            status: 'confirmed',
            updatedAt: now,
          })
        : null;
      persistPrefs({
        ...prefs,
        profile: nextSafetyProfile
          ? {
              ...prefs.profile,
              safetyProfile: nextSafetyProfile,
            }
          : prefs.profile,
        onboarding: {
          ...prefs.onboarding,
          currentStep: 'camera_explanation',
          selectedEquipment: input.selectedEquipment,
          updatedAt: now,
        },
      });
      if (nextSafetyProfile) {
        persistTraining({
          ...training,
          equipment: legacyEquipmentFromCanonical(
            canonicalEquipmentFromSafetyProfile(nextSafetyProfile)
          ),
        });
      }
      setFlow('camera-explanation');
    },
    [persistPrefs, persistTraining, prefs, training]
  );

  const handleCameraExplanationContinue = React.useCallback(() => {
    const now = new Date().toISOString();
    persistPrefs({
      ...prefs,
      onboarding: {
        ...prefs.onboarding,
        currentStep: 'camera_setup',
        updatedAt: now,
      },
    });
    openCameraSetup();
  }, [openCameraSetup, persistPrefs, prefs]);

  const handleWelcomeStart = React.useCallback(() => {
    if (onboardingFlowActive) {
      const now = new Date().toISOString();
      persistPrefs({
        ...prefs,
        onboarding: {
          ...prefs.onboarding,
          currentStep: 'life_goal',
          updatedAt: now,
        },
      });
    }
    openLifeGoal();
  }, [onboardingFlowActive, openLifeGoal, persistPrefs, prefs]);

  const replayOnboardingForDev = React.useCallback(() => {
    if (!__DEV__) return;
    const now = new Date().toISOString();
    setDevOnboardingReplay(true);
    persistPrefs({
      ...prefs,
      onboarding: {
        ...prefs.onboarding,
        currentStep: 'welcome',
        completedAt: null,
        updatedAt: now,
      },
    });
    setLastResult(null);
    setLastResultScore(null);
    setLastResultScoreSnapshot(null);
    setLastResultCheckupType(null);
    setFlow('welcome');
  }, [persistPrefs, prefs]);

  const signOutFromOnboarding = React.useCallback(async () => {
    setDevOnboardingReplay(false);
    await signOut();
  }, [signOut]);

  const newestMilestone = React.useMemo(() => latestMilestone(adherence), [adherence]);
  // Scored most-recent check-up, for Home's progress snapshot and adherence milestones.
  const lastScore: CheckUpScore | null = React.useMemo(() => {
    return (
      latestUsableOfficialCheckUpRecord(displayHistory, displayAdherence.assessments)?.score ?? null
    );
  }, [displayAdherence.assessments, displayHistory]);

  const latestAssessment: MovementAssessment | null = React.useMemo(() => {
    return latestUsableOfficialAssessment(adherence.assessments);
  }, [adherence.assessments]);

  const lifecycle = React.useMemo(
    () =>
      getHaleAppLifecycle({
        profile: displayPrefs.profile,
        history: displayHistory,
        training: displayTraining,
        adherence: displayAdherence,
        today: new Date().toISOString(),
      }),
    [displayAdherence, displayHistory, displayPrefs.profile, displayTraining]
  );

  const activeBlockSchedule = React.useMemo(() => {
    if (!activeMovementBlock) return null;
    return getBlockScheduleState({
      block: activeMovementBlock,
      completions: adherence.completions,
      generatedSessionSummaries: training.generatedSessionSummaries,
      today: new Date().toISOString(),
    });
  }, [activeMovementBlock, adherence.completions, training.generatedSessionSummaries]);

  const activeMicroCheckTarget = React.useMemo(() => {
    if (!activeMovementBlock || !activeBlockSchedule) return null;
    const target = getBlockMicroCheckTarget({
      block: activeMovementBlock,
      schedule: activeBlockSchedule,
      completions: adherence.completions,
    });
    return target.status === 'available' ? target : null;
  }, [activeMovementBlock, activeBlockSchedule, adherence.completions]);

  const requestCameraPermission = React.useCallback(() => {
    requestCameraPermissionsAsync()
      .then((response) =>
        setPermission(
          response.granted
            ? 'granted'
            : response.status === 'undetermined'
              ? 'undetermined'
              : 'denied'
        )
      )
      .catch(() => setPermission('denied'));
  }, []);

  const beginUnifiedMovementProfileV2Public = React.useCallback(
    (
      sourceType: PublicMovementProfileV2SourceType,
      entryContext: PublicMovementCheckUpEntryContext,
      officialRetestContext: MovementProfileV2OfficialRetestContext | null = null
    ) => {
      const latestPendingRaw =
        sourceType === 'baseline' || sourceType === 'baseline_retake'
          ? latestPendingMovementProfileV2RawCheckUp(history)
          : null;
      // A stranded official-retest raw is finalized by the launch effect with
      // its rebuilt prior-block context, never as a baseline here.
      const pendingRaw =
        latestPendingRaw &&
        (latestPendingRaw.sourceType === 'baseline' ||
          latestPendingRaw.sourceType === 'baseline_retake')
          ? latestPendingRaw
          : null;
      setMovementProfileV2Result(null);
      setMovementProfileV2RetestComparison(null);
      setMovementProfileV2BlockReport(null);
      setMovementProfileV2PlanBlockId(null);
      setMovementProfileV2PlanState(DEFAULT_MOVEMENT_PROFILE_V2_PLAN_STATE);
      setMovementProfileV2ResultSurface('unified');
      setMovementProfileV2EntryContext(
        entryContext === 'onboarding'
          ? 'public_onboarding'
          : entryContext === 'public_official_retest'
            ? 'public_official_retest'
            : 'public_standard'
      );
      setMovementProfileV2OfficialRetestContext(officialRetestContext);
      setMovementProfileV2DetailDomain(null);
      setMovementProfileV2SelectedProfileId(null);
      setMovementProfileV2SelectedReportId(null);

      if (pendingRaw) {
        const raw = {
          checkUp: pendingRaw.record.checkUp,
          sourceType: pendingRaw.sourceType,
        };
        setMovementProfileV2InitialFlow(null);
        setMovementProfileV2Raw(raw);
        finalizeMovementProfileV2Raw(raw, {
          entryContext:
            entryContext === 'onboarding'
              ? 'public_onboarding'
              : entryContext === 'public_official_retest'
                ? 'public_official_retest'
                : 'public_standard',
          officialRetestContext,
          resultSurface: 'unified',
        });
        return;
      }

      const startedAt = new Date().toISOString();
      const initialFlow = createMovementProfileV2InternalFlow({ startedAt, history });
      addBreadcrumb('movement check-up voice runtime pinned', {
        area: 'voice_v21_activation',
        flow: 'movement_profile_v2',
        v21Enabled: voiceActivation.movementCheckUpV21Enabled,
      });
      setMovementProfileV2InitialFlow({
        ...initialFlow,
        sourceType,
        ...(sourceType === 'official_retest' && officialRetestContext?.priorStandingLeg
          ? {
              priorStandingLeg: officialRetestContext.priorStandingLeg,
              standingLeg: officialRetestContext.priorStandingLeg,
            }
          : {}),
        ...(sourceType === 'official_retest' && officialRetestContext?.priorShoulderSide
          ? {
              priorShoulderSide: officialRetestContext.priorShoulderSide,
              shoulderSide: officialRetestContext.priorShoulderSide,
            }
          : {}),
      });
      setMovementProfileV2Raw(null);
      setFlow('movement-profile-v2-unified-checkup');
    },
    [finalizeMovementProfileV2Raw, history, voiceActivation]
  );

  const beginCheckUp = React.useCallback(
    (
      type?: CheckupType,
      options: {
        battery?: readonly string[];
        retryOfCheckUpId?: string;
        retryMovementIds?: readonly string[];
      } = {}
    ) => {
      const resolvedType = type ?? (latestAssessment ? 'baseline_retake' : 'baseline');
      const activeBlockV2Record =
        activeMovementBlock?.origin?.kind === 'movement_profile_v2_assessment'
          ? movementProfileV2AssessmentForSourceCheckUpId(
              history,
              activeMovementBlock.origin.sourceCheckUpId
            )
          : null;
      const activeBlockSchedule = activeMovementBlock
        ? getBlockScheduleState({
            block: activeMovementBlock,
            completions: adherence.completions,
            generatedSessionSummaries: training.generatedSessionSummaries,
            today: new Date().toISOString(),
          })
        : null;
      const officialRetestContext =
        resolvedType === 'official_retest' &&
        activeMovementBlock?.origin?.kind === 'movement_profile_v2_assessment' &&
        activeBlockV2Record
          ? {
              priorBlockId: activeMovementBlock.id,
              priorArtifacts: activeBlockV2Record,
              priorStandingLeg: latestV2StandingLeg([activeBlockV2Record.record.checkUp]),
              priorShoulderSide: latestV2ShoulderSide([activeBlockV2Record.record.checkUp]),
            }
          : null;
      const launchDecision = selectPublicMovementCheckUpLaunch({
        sourceType: resolvedType,
        entryContext: onboardingFlowActive ? 'onboarding' : 'standard',
        legacyV1RollbackEnabled: LEGACY_V1_CHECKUP_ROLLBACK_ENABLED,
        hasAcceptedMovementProfileV2State:
          movementProfileV2AuthorityFacts.acceptedProfileIds.length > 0 ||
          !!latestMaterializedMovementProfileV2Result(history),
        hasMalformedMovementProfileV2State: movementProfileV2AuthorityFacts.hasMalformedState,
        hasMovementProfileV2BlockOrReportState:
          movementProfileV2AuthorityFacts.v2BlockIds.length > 0 ||
          movementProfileV2AuthorityFacts.acceptedReportIds.length > 0,
        hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts: !!officialRetestContext,
        movementProfileV2OfficialRetestScheduleStatus: activeBlockSchedule?.status ?? null,
        activeBlockOriginKind: activeMovementBlock?.origin?.kind ?? null,
      });
      if (launchDecision.status === 'unavailable') {
        addBreadcrumb('movement check-up unavailable', {
          area: 'checkup_launch',
          reason: launchDecision.reason,
          sourceType: launchDecision.sourceType,
        });
        setPendingCheckup(null);
        setMovementProfileV2EntryContext('public_standard');
        setMovementProfileV2OfficialRetestContext(null);
        setMovementProfileV2RetestComparison(null);
        setMovementProfileV2BlockReport(null);
        setFlow('movement-profile-v2-retest-unavailable');
        return;
      }
      if (launchDecision.engine === 'unified_movement_profile') {
        addBreadcrumb('public movement check-up launch', {
          area: 'checkup_launch',
          engine: launchDecision.engine,
          sourceType: launchDecision.sourceType,
          entryContext: launchDecision.entryContext,
        });
        setPendingCheckup(null);
        beginUnifiedMovementProfileV2Public(
          launchDecision.sourceType,
          launchDecision.entryContext,
          launchDecision.sourceType === 'official_retest' ? officialRetestContext : null
        );
        return;
      }
      const legacyType = launchDecision.sourceType;
      addBreadcrumb('movement check-up voice runtime pinned', {
        area: 'voice_v21_activation',
        flow: 'legacy_checkup',
        v21Enabled: false,
      });
      setPendingCheckup({
        type: legacyType,
        sourceBlockId:
          legacyType === 'official_retest' || legacyType === 'quick_recheck'
            ? activeMovementBlock?.id
            : undefined,
        isOfficialForProgress:
          legacyType === 'baseline' ||
          legacyType === 'baseline_retake' ||
          legacyType === 'official_retest',
        battery: options.battery,
        retryOfCheckUpId: options.retryOfCheckUpId,
        retryMovementIds: options.retryMovementIds,
      });
      setFlow('checkup');
    },
    [
      activeMovementBlock,
      adherence.completions,
      beginUnifiedMovementProfileV2Public,
      history,
      latestAssessment,
      movementProfileV2AuthorityFacts,
      onboardingFlowActive,
      training.generatedSessionSummaries,
    ]
  );

  const beginOnboardingCheckUp = React.useCallback(() => {
    const now = new Date().toISOString();
    persistPrefs({
      ...prefs,
      onboarding: {
        ...prefs.onboarding,
        currentStep: 'baseline_checkup',
        updatedAt: now,
      },
    });
    beginCheckUp('baseline');
  }, [beginCheckUp, persistPrefs, prefs]);

  // A finished check-up: persist it, show it, reload history (feeds trends).
  const handleCheckUpComplete = React.useCallback(
    (completedCheckUp: CheckUp, checkupOverride?: typeof pendingCheckup) => {
      const block = activeMovementBlock;
      const resolvedPendingCheckup = checkupOverride ?? pendingCheckup;
      const baseRetryCheckUp = resolvedPendingCheckup?.retryOfCheckUpId
        ? (history.find(
            (record) => record.checkUp.startedAt === resolvedPendingCheckup.retryOfCheckUpId
          )?.checkUp ?? null)
        : null;
      const checkUp =
        baseRetryCheckUp && resolvedPendingCheckup?.retryMovementIds
          ? mergeCheckUpRetry({
              baseCheckUp: baseRetryCheckUp,
              retryCheckUp: completedCheckUp,
              retriedMovementIds: resolvedPendingCheckup.retryMovementIds,
            })
          : completedCheckUp;
      const completedAt = checkUpCompletionTimestamp(checkUp, new Date().toISOString());
      const scheduleAtCheckup = block
        ? getBlockScheduleState({
            block,
            completions: adherence.completions,
            generatedSessionSummaries: training.generatedSessionSummaries,
            today: completedAt,
          })
        : null;
      const scheduleRetestDue = scheduleAtCheckup?.status === 'retest_due';
      const requestedCheckupType =
        resolvedPendingCheckup?.type ??
        (block && scheduleRetestDue
          ? 'official_retest'
          : history.length === 0
            ? 'baseline'
            : 'manual_extra');
      const checkupType =
        requestedCheckupType === 'official_retest' && !scheduleRetestDue
          ? 'manual_extra'
          : requestedCheckupType;
      const isRetest = !!block && checkupType === 'official_retest' && scheduleRetestDue;
      const {
        score,
        snapshot: scoreSnapshot,
        issues: scoringInputIssues,
      } = createCurrentVersionedScoreSnapshot(checkUp, {
        createdAt: completedAt,
        activeFocusDomain:
          isRetest && block?.focusDomain ? scoreDomainFromMovementDomain(block.focusDomain) : null,
      });
      recordScoringInputIssues('checkup_completion', scoringInputIssues, checkupType);
      const assessment = createMovementAssessment({
        checkUpId: checkUp.startedAt,
        type: checkupType,
        score,
        scoreSnapshot,
        sourceBlockId: resolvedPendingCheckup?.sourceBlockId ?? (isRetest ? block?.id : undefined),
        completedAt,
        isOfficialForProgress: isRetest
          ? true
          : checkupType === requestedCheckupType
            ? resolvedPendingCheckup?.isOfficialForProgress
            : false,
      });
      const eligibility = getBlockCreationEligibility({
        score,
        scoreSnapshot,
        assessment,
      });
      let localHistorySaved = false;
      try {
        store.save(checkUp, {
          checkupType,
          sourceAssessmentId: assessment.id,
          retryOfCheckUpId: resolvedPendingCheckup?.retryOfCheckUpId,
          scoreSnapshot,
        });
        localHistorySaved = true;
      } catch (e) {
        console.warn('[history] save failed', e);
      }
      if (localHistorySaved && backendSignedIn && backendUserId) {
        void syncMovementCheckupToRemote({
          checkUp,
          checkupType,
          status: assessment.status,
          completedAt,
          score,
          scoreSnapshot,
          assessment,
        });
      }
      setLastResult(checkUp);
      setLastResultScore(score);
      setLastResultScoreSnapshot(scoreSnapshot);
      setLastResultCheckupType(checkupType);
      store
        .loadAll()
        .then(setHistory)
        .catch(() => {});
      let nextAdherence = upsertMovementAssessment(adherence, assessment);
      if (isRetest && block) {
        if (!eligibility.eligible) {
          recordBlockedBlockCreation('official_retest_completion', eligibility, checkupType);
          persistAdherence(nextAdherence);
          setPendingCheckup(null);
          replaceFlow('results');
          return;
        }
        const completion = makeTrainingSessionCompletion({
          block,
          sessionType: 'retest',
          completedAt,
          plannedDate: 'retest',
        });
        nextAdherence = recordTrainingSessionCompletion(nextAdherence, completion);
        nextAdherence = markMovementBlockComplete(nextAdherence, block.id, completedAt);
        const updatedBlock = nextAdherence.blocks.find((b) => b.id === block.id) ?? block;
        const sourceCheckUpId = movementBlockSourceCheckUpId(block);
        const previous = sourceCheckUpId
          ? history.find((h) => h.checkUp.startedAt === sourceCheckUpId)
          : undefined;
        const previousParsed = parseStoredScoreSnapshot(previous?.scoreSnapshot);
        const previousScore = previousParsed.ok ? previousParsed.score : null;
        const reportComparisonCompatible =
          previousParsed.ok && scoreSnapshot
            ? previousParsed.snapshot.schemaVersion === scoreSnapshot.schemaVersion &&
              previousParsed.snapshot.scoringVersion === scoreSnapshot.scoringVersion &&
              previousParsed.snapshot.normVersion === scoreSnapshot.normVersion
            : false;
        nextAdherence = mergeMilestones(
          nextAdherence,
          generateMilestones({
            user: prefs.profile,
            block: updatedBlock,
            lifeGoal: prefs.profile.lifeGoal,
            latestAssessment: score,
            previousAssessment: reportComparisonCompatible ? previousScore : null,
            completions: nextAdherence.completions,
            existing: nextAdherence.milestones,
            nowIso: completedAt,
          })
        );
        const blockReport = createMovementBlockReport({
          block: updatedBlock,
          baselineAssessment: sourceCheckUpId
            ? findAssessmentForCheckUp(nextAdherence.assessments, sourceCheckUpId)
            : null,
          retestAssessment: assessment,
          previousScore,
          latestScore: score,
          previousScoreSnapshot: previousParsed.ok ? previousParsed.snapshot : null,
          latestScoreSnapshot: scoreSnapshot,
          completions: nextAdherence.completions,
          nowIso: completedAt,
        });
        nextAdherence = upsertMovementBlockReport(nextAdherence, blockReport);
        const nextTrainingBlock = buildBlock(score, training.equipment, completedAt);
        const nextMovementBlock = createMovementBlockFromAssessment({
          latestAssessment: {
            score,
            scoreSnapshot,
            sourceCheckUpId: checkUp.startedAt,
            assessment,
          },
          lifeGoal: prefs.profile.lifeGoal,
          startDate: completedAt,
        });
        nextAdherence = upsertMovementBlock(nextAdherence, nextMovementBlock);
        const adherenceSaved = persistAdherence(nextAdherence);
        const nextTraining = startBlock(training, nextTrainingBlock);
        persistTraining(nextTraining);
        if (adherenceSaved && backendSignedIn && backendUserId) {
          void syncMovementBlockToRemote({
            block: updatedBlock,
            trainingBlock: training.block,
            training,
            blockNumber: blockNumberForBlocks(nextAdherence.blocks, updatedBlock.id),
            sourceCheckupLocalId: movementBlockSourceCheckUpId(updatedBlock),
          });
          void syncMovementBlockToRemote({
            block: nextMovementBlock,
            trainingBlock: nextTrainingBlock,
            training: nextTraining,
            blockNumber: blockNumberForBlocks(nextAdherence.blocks, nextMovementBlock.id),
            sourceCheckupLocalId: checkUp.startedAt,
          });
          void syncMovementBlockReportToRemote({
            report: blockReport,
            movementBlock: updatedBlock,
            assessments: nextAdherence.assessments,
            baselineAssessment:
              nextAdherence.assessments.find((a) => a.id === blockReport.baselineAssessmentId) ??
              null,
            retestAssessment: assessment,
            completions: nextAdherence.completions,
          });
        }
        setLastCompletion(completion);
        setPendingCheckup(null);
        replaceFlow('results');
      } else {
        const preparedBlock = eligibility.eligible
          ? prepareBlockFromOfficialCheckUp({
              baseAdherence: nextAdherence,
              baseTraining: training,
              sourceCheckUpId: checkUp.startedAt,
              score,
              scoreSnapshot,
              assessment,
              nowIso: completedAt,
              source: 'official_checkup_completion',
            })
          : null;
        if (!preparedBlock) {
          if (!eligibility.eligible && assessment.isOfficialForProgress) {
            recordBlockedBlockCreation('official_checkup_completion', eligibility, checkupType);
          }
          persistAdherence(nextAdherence);
        }
        if (onboardingFlowActive) {
          persistPrefs({
            ...prefs,
            onboarding: {
              ...prefs.onboarding,
              currentStep: 'results',
              baselineResultId: checkUp.startedAt,
              updatedAt: completedAt,
            },
          });
        }
        setPendingCheckup(null);
        replaceFlow('results');
      }
    },
    [
      activeMovementBlock,
      adherence,
      backendSignedIn,
      backendUserId,
      history,
      onboardingFlowActive,
      pendingCheckup,
      persistAdherence,
      persistPrefs,
      persistTraining,
      prepareBlockFromOfficialCheckUp,
      prefs,
      recordBlockedBlockCreation,
      replaceFlow,
      store,
      training,
    ]
  );

  const completeDevOnboardingCheckUp = React.useCallback(() => {
    if (!__DEV__) return;
    const { syntheticCheckUp } = require('./src/checkup/devFixture') as typeof import(
      './src/checkup/devFixture'
    );
    handleCheckUpComplete(syntheticCheckUp(new Date().toISOString()), {
      type: 'baseline',
      isOfficialForProgress: true,
    });
  }, [handleCheckUpComplete]);

  const deferOnboardingCheckUp = React.useCallback(() => {
    const now = new Date().toISOString();
    persistPrefs({
      ...prefs,
      onboarding: {
        ...prefs.onboarding,
        currentStep: 'complete',
        completedAt: now,
        updatedAt: now,
      },
    });
    setPendingCheckup(null);
    goHome();
  }, [goHome, persistPrefs, prefs]);

  const handleOnboardingResultsContinue = React.useCallback(() => {
    const now = new Date().toISOString();
    setDevOnboardingReplay(false);
    persistPrefs({
      ...prefs,
      onboarding: {
        ...prefs.onboarding,
        currentStep: 'complete',
        completedAt: prefs.onboarding.completedAt ?? now,
        updatedAt: now,
      },
    });
    if (displayMovementBlock) {
      setFlow('onboarding-block');
    } else {
      setFlow(null);
      setTab('plan');
    }
  }, [displayMovementBlock, persistPrefs, prefs]);

  const handleStartSession = React.useCallback(
    (
      preferences?: TodaySessionPreferences & {
        lifecycleState?: typeof lifecycle.state;
        presetId?: string;
        targetSessionTemplateId?: PlanSessionId | string;
        sessionIntensity?: SessionIntensity;
      }
    ) => {
      const planningLifecycleState = preferences?.lifecycleState ?? lifecycle.state;
      const result = planTodayHaleSession({
        safetyProfile: prefs.profile.safetyProfile,
        lifeGoal: prefs.profile.lifeGoal,
        activeBlock: activeMovementBlock,
        training,
        lifecycleState: planningLifecycleState,
        recentCompletions: adherence.completions,
        adjustment: preferences?.adjustment,
        painArea: preferences?.painArea,
        sessionIntensity: preferences?.sessionIntensity,
        today: new Date(),
        presetId: preferences?.presetId,
        targetSessionTemplateId: preferences?.targetSessionTemplateId,
      });
      const plan = sessionPlanFromPlanningResult(result);
      if (plan) {
        setPlanningRecoveryResult(null);
        setActiveSessionPlan(plan);
        setFlow('session-preview');
        return;
      }
      setActiveSessionPlan(null);
      setSessionIds([]);
      if (result.kind === 'unavailable') {
        addBreadcrumb('session planning unavailable', {
          area: 'session_planning',
          reason: result.reason,
          issueCodes: result.diagnostics.issueCodes,
          blockId: result.blockId,
          templateId: result.templateId,
          planningDateKey: result.planningDateKey,
          focusDomain: result.diagnostics.focusDomain,
          exerciseIds: result.diagnostics.exerciseIds,
        });
        setPlanningRecoveryResult(result);
        setFlow('session-unavailable');
        return;
      }
      addBreadcrumb('session planning lifecycle state', {
        area: 'session_planning',
        kind: result.kind,
        blockId: 'blockId' in result ? result.blockId : undefined,
      });
      setPlanningRecoveryResult(null);
      goHome();
    },
    [
      activeMovementBlock,
      adherence.completions,
      goHome,
      lifecycle.state,
      prefs.profile.lifeGoal,
      prefs.profile.safetyProfile,
      training,
    ]
  );

  const handleStartRestartSession = React.useCallback(() => {
    handleStartSession({ lifecycleState: 'inactive_restart' });
  }, [handleStartSession]);

  const handleStartPlanSession = React.useCallback(
    (targetSessionTemplateId: PlanSessionId, preferences?: TodaySessionPreferences | null) => {
      if (lifecycle.state === 'inactive_restart') {
        setFlow('restart-intro');
        return;
      }
      handleStartSession({ ...(preferences ?? {}), targetSessionTemplateId });
    },
    [handleStartSession, lifecycle.state]
  );

  const handleStartExtraSession = React.useCallback(
    (presetId: string, preferences?: TodaySessionPreferences | null) => {
      handleStartSession({
        ...(preferences ?? {}),
        presetId,
      });
    },
    [handleStartSession]
  );

  const openLadderDetail = React.useCallback((ladderId: string) => {
    setSelectedLadderId(ladderId);
    setFlow('ladder-detail');
  }, []);

  const openLearnDetail = React.useCallback((articleId: string) => {
    setSelectedLearnId(articleId);
    setFlow('learn-detail');
  }, []);

  const handleStartLadderPractice = React.useCallback(
    (ladderId: string, preferences?: TodaySessionPreferences | null) => {
      const practicePreferences: TodaySessionPreferences = preferences ?? {
        adjustment: null,
        painArea: null,
      };
      const result = planLadderPracticeSessionResult({
        ladderId,
        safetyProfile: prefs.profile.safetyProfile,
        lifeGoal: prefs.profile.lifeGoal,
        activeBlock: activeMovementBlock,
        training,
        ...practicePreferences,
        today: new Date(),
      });
      const plan = sessionPlanFromPlanningResult(result);
      if (result.kind === 'unavailable') {
        setActiveSessionPlan(null);
        setPlanningRecoveryResult(result);
        setFlow('session-unavailable');
        return;
      }
      if (!plan || plan.exercises.length === 0) return;
      setPlanningRecoveryResult(null);
      setActiveSessionPlan(plan);
      setFlow('session-preview');
    },
    [activeMovementBlock, prefs.profile.lifeGoal, prefs.profile.safetyProfile, training]
  );

  // A surviving mid-session snapshot that matches today's plan (same block,
  // template, planned day, and exercise list) — non-null means the next start
  // of this plan should continue after the last finished item.
  const sessionResume = React.useMemo(
    () =>
      activeSessionPlan
        ? resumableSessionStart(
            sessionInProgress,
            {
              planId: activeSessionPlan.id,
              blockId: activeSessionPlan.blockId,
              templateId: activeSessionPlan.metadata?.templateId,
              plannedDateKey: activeSessionPlan.metadata?.plannedDateKey,
              exerciseIds: activeSessionPlan.exercises.map((exercise) => exercise.id),
            },
            new Date().toISOString()
          )
        : null,
    [activeSessionPlan, sessionInProgress]
  );

  const handleSessionItemCompleted = React.useCallback(
    (completedItems: TrainingItemResult[]) => {
      const plan = activeSessionPlan;
      const plannedDateKey = plan?.metadata?.plannedDateKey;
      if (!plan || !plannedDateKey) return; // resume covers planned daily sessions only
      const resumeContext = sessionResumeContextRef.current;
      const snapshot = buildSessionInProgress({
        startedAt: sessionRunStartedAtRef.current || new Date().toISOString(),
        savedAt: new Date().toISOString(),
        plan: {
          planId: plan.id,
          blockId: plan.blockId,
          templateId: plan.metadata?.templateId,
          plannedDateKey,
          exerciseIds: plan.exercises.map((exercise) => exercise.id),
        },
        completedItems: resumeContext
          ? [...resumeContext.completedItems, ...completedItems]
          : completedItems,
      });
      try {
        trainingStore.saveSessionInProgress(snapshot);
      } catch (error) {
        captureError(error, { area: 'session_resume', action: 'save_snapshot' });
      }
      setSessionInProgress(snapshot);
    },
    [activeSessionPlan, trainingStore]
  );

  const discardSessionInProgress = React.useCallback(() => {
    trainingStore.clearSessionInProgress();
    setSessionInProgress(null);
    sessionResumeContextRef.current = null;
  }, [trainingStore]);

  const beginPlannedSession = React.useCallback(() => {
    if (!activeSessionPlan || activeSessionPlan.exercises.length === 0) return;
    const validation = validateHaleSessionPlanEquipment({
      plan: activeSessionPlan,
      safetyProfile: prefs.profile.safetyProfile,
    });
    if (validation.status !== 'current') {
      addBreadcrumb('stale plan invalidated', {
        area: 'session_planning',
        status: validation.status,
        blockId: activeSessionPlan.blockId,
        templateId: activeSessionPlan.metadata?.templateId,
        plannedDateKey: activeSessionPlan.metadata?.plannedDateKey,
        plannedFingerprint: activeSessionPlan.metadata?.equipmentSnapshot?.fingerprint,
        currentFingerprint: validation.diagnostics[0]?.currentFingerprint,
      });
      setPlanningRecoveryResult(
        staleEquipmentPlanningResult({ plan: activeSessionPlan, validation })
      );
      setFlow('session-unavailable');
      return;
    }
    const movementCapabilityValidation = validateHaleSessionPlanMovementCapabilities({
      plan: activeSessionPlan,
      safetyProfile: prefs.profile.safetyProfile,
    });
    if (movementCapabilityValidation.status !== 'current') {
      addBreadcrumb('stale movement setup invalidated', {
        area: 'session_planning',
        status: movementCapabilityValidation.status,
        blockId: activeSessionPlan.blockId,
        templateId: activeSessionPlan.metadata?.templateId,
        plannedDateKey: activeSessionPlan.metadata?.plannedDateKey,
        plannedFingerprint: activeSessionPlan.metadata?.movementCapabilitySnapshot?.fingerprint,
        currentFingerprint: movementCapabilityValidation.diagnostics[0]?.currentFingerprint,
      });
      setPlanningRecoveryResult(
        staleMovementCapabilityPlanningResult({
          plan: activeSessionPlan,
          validation: movementCapabilityValidation,
        })
      );
      setFlow('session-unavailable');
      return;
    }
    const releasePolicyValidation = validateHaleSessionPlanReleasePolicy({
      plan: activeSessionPlan,
    });
    if (releasePolicyValidation.status !== 'current') {
      addBreadcrumb('release policy plan invalidated', {
        area: 'session_planning',
        status: releasePolicyValidation.status,
        blockId: activeSessionPlan.blockId,
        templateId: activeSessionPlan.metadata?.templateId,
        plannedDateKey: activeSessionPlan.metadata?.plannedDateKey,
        plannedFingerprint: activeSessionPlan.metadata?.releasePolicySnapshot?.fingerprint,
        currentFingerprint: releasePolicyValidation.diagnostics[0]?.currentFingerprint,
        issueCount: releasePolicyValidation.diagnostics.length,
      });
      setPlanningRecoveryResult(
        staleReleasePolicyPlanningResult({
          plan: activeSessionPlan,
          validation: releasePolicyValidation,
        })
      );
      setFlow('session-unavailable');
      return;
    }
    const progressionPolicyValidation = validateHaleSessionPlanProgressionPolicy({
      plan: activeSessionPlan,
    });
    if (progressionPolicyValidation.status !== 'current') {
      addBreadcrumb('progression policy plan invalidated', {
        area: 'session_planning',
        status: progressionPolicyValidation.status,
        blockId: activeSessionPlan.blockId,
        templateId: activeSessionPlan.metadata?.templateId,
        plannedDateKey: activeSessionPlan.metadata?.plannedDateKey,
        plannedFingerprint: activeSessionPlan.metadata?.progressionPolicySnapshot?.fingerprint,
        currentFingerprint: progressionPolicyValidation.diagnostics[0]?.currentFingerprint,
        issueCount: progressionPolicyValidation.diagnostics.length,
      });
      setPlanningRecoveryResult(
        staleProgressionPolicyPlanningResult({
          plan: activeSessionPlan,
          validation: progressionPolicyValidation,
        })
      );
      setFlow('session-unavailable');
      return;
    }
    const safetyCueValidation = validateHaleSessionPlanSafetyCues({
      plan: activeSessionPlan,
    });
    if (safetyCueValidation.status !== 'current') {
      addBreadcrumb('stale safety cue plan invalidated', {
        area: 'session_planning',
        status: safetyCueValidation.status,
        blockId: activeSessionPlan.blockId,
        templateId: activeSessionPlan.metadata?.templateId,
        plannedDateKey: activeSessionPlan.metadata?.plannedDateKey,
        issueCount: safetyCueValidation.diagnostics.length,
      });
      setPlanningRecoveryResult(
        staleSafetyCuePlanningResult({
          plan: activeSessionPlan,
          validation: safetyCueValidation,
        })
      );
      setFlow('session-unavailable');
      return;
    }
      // Resume a surviving snapshot of this same plan (crash/kill/explicit
      // stop): the relaunched run plays only the remaining items and the
      // results merge on completion. A fully-banked snapshot (death during
      // the closing line) can't finalize without a result, so it clears and
      // the session starts over.
      const resume = sessionResume && sessionResume.remainingExerciseIds.length > 0 ? sessionResume : null;
      if (sessionResume && !resume) {
        trainingStore.clearSessionInProgress();
        setSessionInProgress(null);
      }
      sessionResumeContextRef.current = resume
        ? { completedItems: resume.completedItems, startedAt: resume.startedAt }
        : null;
      sessionRunStartedAtRef.current = resume ? resume.startedAt : new Date().toISOString();
      if (resume) {
        addBreadcrumb('training session resumed from snapshot', {
          area: 'session_resume',
          completedItems: resume.completedItems.length,
          remaining: resume.remainingExerciseIds.length,
        });
      }
      setSessionType(activeSessionPlan.sessionType);
      setSessionIds(
        resume ? resume.remainingExerciseIds : activeSessionPlan.exercises.map((exercise) => exercise.id)
      );
      addBreadcrumb('training voice runtime pinned', {
        area: 'voice_v21_activation',
        flow: 'training',
        v21Enabled: voiceActivation.trainingVoiceV21Enabled,
        selectableCount: voiceActivation.trainingSelectableExerciseCount,
      });
      setLastSessionResult(null);
      setFlow('training');
  }, [activeSessionPlan, prefs.profile.safetyProfile, sessionResume, trainingStore, voiceActivation]);

  const handleSessionComplete = React.useCallback(
    (runResult: TrainingSessionResult) => {
      // Fold any resumed items back in before evidence/credit evaluation, and
      // retire the surviving snapshot — the session is whole again.
      const result = mergeResumedSessionResult(sessionResumeContextRef.current, runResult);
      sessionResumeContextRef.current = null;
      trainingStore.clearSessionInProgress();
      setSessionInProgress(null);
      const completedAt = new Date().toISOString();
      const sessionPlan = activeSessionPlan;
      const evidence = evaluateSessionWorkEvidence(sessionPlan, result);
      const summarizedEvidence = workEvidenceSummary(evidence);
      const focusEvidence = evaluateCompletedFocusStimulusEvidence({
        sessionPlan,
        result,
        activeBlock: activeMovementBlock,
        workEvidence: evidence,
      });
      const summarizedFocusEvidence = focusStimulusEvidenceSummary(focusEvidence);
      const countsTowardPlan = focusEvidence.mainPlanCredit;
      addBreadcrumb('training session credit classified', {
        area: 'main_plan_credit',
        blockId: sessionPlan?.blockId,
        sessionId: sessionPlan?.id,
        templateId: sessionPlan?.metadata?.templateId,
        source: sessionPlan?.metadata?.source,
        mainPlanCredit: countsTowardPlan,
        focusPlanStatus: focusEvidence.planStatus,
        focusCompletionStatus: focusEvidence.status,
        focusExclusionReason: focusEvidence.exclusionReason,
        progressionEvidencePolicy: sessionPlan?.metadata?.progressionEvidencePolicy,
        plannedPrimaryFocusExerciseCount: focusEvidence.plannedPrimaryFocusExerciseCount,
        completedPrimaryFocusExerciseCount: focusEvidence.completedPrimaryFocusExerciseCount,
        completedExerciseCount: evidence.completedExerciseCount,
        skippedExerciseCount: evidence.skippedExerciseCount,
        missingResultCount: evidence.missingResultCount,
        duplicateResultCount: evidence.duplicateResultCount,
        malformedResultCount: evidence.malformedResultCount,
        unmatchedResultCount: evidence.unmatchedResultCount,
      });
      setLastSessionResult(result);
      let nextTraining = training;
      let trainingChanged = false;
      let generatedSessionSummary: ReturnType<typeof createGeneratedSessionSummary> | null = null;
      if (sessionPlan && sessionPlan.metadata?.source !== 'legacy_fallback') {
        const summary = createGeneratedSessionSummary({
          sessionPlan,
          completedAt,
          durationMinutes: sessionPlan.estimatedMinutes,
          mainPlanCredit: countsTowardPlan,
          workEvidence: summarizedEvidence,
          focusStimulusEvidence: summarizedFocusEvidence,
        });
        generatedSessionSummary = summary;
        nextTraining = {
          ...nextTraining,
          generatedSessionSummaries: upsertGeneratedSessionSummary(
            nextTraining.generatedSessionSummaries,
            summary
          ),
        };
        trainingChanged = true;
      }
      const block = activeMovementBlock;
      if (block) {
        const started = Date.parse(result.startedAt);
        const ended = Date.parse(completedAt);
        const durationMinutes =
          sessionPlan?.estimatedMinutes ??
          (Number.isFinite(started) && Number.isFinite(ended)
            ? Math.max(1, Math.round((ended - started) / 60000))
            : undefined);
        if (countsTowardPlan) {
          const baseCompletion = makeTrainingSessionCompletion({
            block,
            sessionType: sessionPlan?.sessionType ?? sessionType,
            completedAt,
            plannedDate: sessionPlan?.metadata?.plannedDateKey,
            durationMinutes,
            source: sessionPlan?.metadata?.source,
            templateId: sessionPlan?.metadata?.templateId,
            mainPlanCredit: true,
            plannedPrimaryDomain: sessionPlan?.metadata?.plannedPrimaryDomain,
            workEvidence: summarizedEvidence,
            focusStimulusEvidence: summarizedFocusEvidence,
            progressionEvidencePolicy: sessionPlan?.metadata?.progressionEvidencePolicy,
          });
          const schedule = getBlockScheduleState({
            block,
            completions: [...adherence.completions, baseCompletion],
            generatedSessionSummaries: nextTraining.generatedSessionSummaries,
            today: completedAt,
          });
          const completion = annotateCompletionWithScheduleCredit(baseCompletion, schedule);
          if (generatedSessionSummary && sessionPlan) {
            generatedSessionSummary = createGeneratedSessionSummary({
              sessionPlan,
              completedAt,
              durationMinutes,
              mainPlanCredit: countsTowardPlan,
              scheduleCredit: completion.scheduleCredit,
              workEvidence: summarizedEvidence,
              focusStimulusEvidence: summarizedFocusEvidence,
            });
            nextTraining = {
              ...nextTraining,
              generatedSessionSummaries: upsertGeneratedSessionSummary(
                nextTraining.generatedSessionSummaries,
                generatedSessionSummary
              ),
            };
            trainingChanged = true;
          }
          for (const item of result.items) {
            if (item.exerciseId !== 'step-up' || item.status !== 'completed') continue;
            const nextSeed = applyBothSidesExerciseCompletionToStartSideSeed(
              nextTraining.bothSidesStartSideSeed,
              {
                exerciseId: item.exerciseId,
                completed: true,
                countsTowardMainPlan: true,
                eventId: `${completion.id}:${item.exerciseId}`,
              }
            );
            if (nextSeed !== nextTraining.bothSidesStartSideSeed) {
              nextTraining = { ...nextTraining, bothSidesStartSideSeed: nextSeed };
              trainingChanged = true;
            }
          }
          let nextAdherence = recordTrainingSessionCompletion(adherence, completion);
          const updatedBlock = nextAdherence.blocks.find((b) => b.id === block.id) ?? block;
          nextAdherence = mergeMilestones(
            nextAdherence,
            generateMilestones({
              user: prefs.profile,
              block: updatedBlock,
              lifeGoal: prefs.profile.lifeGoal,
              latestAssessment: lastScore,
              completions: nextAdherence.completions,
              existing: nextAdherence.milestones,
              nowIso: completedAt,
            })
          );
          const adherenceSaved = persistAdherence(nextAdherence);
          if (adherenceSaved && backendSignedIn && backendUserId) {
            void syncMovementBlockToRemote({
              block: updatedBlock,
              trainingBlock: nextTraining.block,
              training: nextTraining,
              blockNumber: blockNumberForBlocks(nextAdherence.blocks, updatedBlock.id),
              sourceCheckupLocalId: movementBlockSourceCheckUpId(updatedBlock),
            });
            void syncTrainingSessionCompletionToRemote({
              completion,
              sessionPlan,
              sessionResult: result,
              generatedSummary: generatedSessionSummary,
              movementBlock: updatedBlock,
              sessionIndex: sessionIndexForCompletions(nextAdherence.completions, completion),
            });
          }
          setLastCompletion(completion);
        } else {
          setLastCompletion(
            makeTrainingSessionCompletion({
              block,
              sessionType: sessionPlan?.sessionType ?? sessionType,
              completedAt,
              plannedDate: sessionPlan?.metadata?.plannedDateKey,
              durationMinutes,
              source: sessionPlan?.metadata?.source,
              templateId: sessionPlan?.metadata?.templateId,
              mainPlanCredit: false,
              plannedPrimaryDomain: sessionPlan?.metadata?.plannedPrimaryDomain,
              workEvidence: summarizedEvidence,
              focusStimulusEvidence: summarizedFocusEvidence,
              progressionEvidencePolicy: sessionPlan?.metadata?.progressionEvidencePolicy,
            })
          );
        }
        if (trainingChanged) persistTraining(nextTraining);
        replaceFlow('session-complete');
      } else {
        if (trainingChanged) persistTraining(nextTraining);
        goHome();
      }
    },
    [
      activeMovementBlock,
      activeSessionPlan,
      adherence,
      backendSignedIn,
      backendUserId,
      goHome,
      lastScore,
      persistAdherence,
      persistTraining,
      prefs.profile,
      replaceFlow,
      sessionType,
      training,
    ]
  );

  const handleMicroCheckComplete = React.useCallback(
    (result: MicroCheckResult) => {
      const completedAt = new Date().toISOString();
      if (microCheckLaunch?.mode === 'optional') {
        const optionalResult: MicroCheckResult = {
          ...result,
          id: `optional:${result.type}:${result.startedAt}`,
          completedAt,
          targetDomain: microCheckLaunch.domain,
        };
        let localMicroCheckSaved = false;
        try {
          trainingStore.saveMicroCheck(optionalResult);
          localMicroCheckSaved = true;
        } catch (e) {
          console.warn('[training] optional micro-check save failed', e);
        }
        setMicroChecks((prev) => {
          const key = `${optionalResult.type}:${optionalResult.startedAt}`;
          const withoutDuplicate = prev.filter(
            (item) => (item.slotId ?? `${item.type}:${item.startedAt}`) !== key
          );
          return [...withoutDuplicate, optionalResult];
        });
        setLastMicroCheckSummary(
          buildMicroCheckSummaryViewModel({
            result: optionalResult,
            source: 'optional',
            targetDomain: microCheckLaunch.domain,
            saved: localMicroCheckSaved,
            history,
            assessments: adherence.assessments,
          })
        );
        setMicroCheckLaunch(null);
        replaceFlow('microcheck-summary');
        return;
      }

      const scheduledTarget =
        microCheckLaunch?.mode === 'scheduled' ? microCheckLaunch.target : activeMicroCheckTarget;
      if (!activeMovementBlock || !scheduledTarget) {
        console.warn('[training] micro-check completed without an active due slot; result ignored');
        setMicroCheckLaunch(null);
        goHome();
        return;
      }
      const enrichedResult = attachMicroCheckTargetMetadata(result, scheduledTarget, completedAt);
      const microCheckSlot = microCheckSlotMetadataFromTarget(scheduledTarget);
      let localMicroCheckSaved = false;
      try {
        trainingStore.saveMicroCheck(enrichedResult);
        localMicroCheckSaved = true;
      } catch (e) {
        console.warn('[training] micro-check save failed', e);
      }
      setMicroChecks((prev) => {
        const key = enrichedResult.slotId ?? `${enrichedResult.type}:${enrichedResult.startedAt}`;
        const withoutDuplicate = prev.filter(
          (item) => (item.slotId ?? `${item.type}:${item.startedAt}`) !== key
        );
        return [...withoutDuplicate, enrichedResult];
      });
      const completion = makeTrainingSessionCompletion({
        block: activeMovementBlock,
        sessionType: 'micro_check',
        completedAt,
        plannedDate: scheduledTarget.slotId,
        durationMinutes: 1,
        mainPlanCredit: false,
        microCheckSlot,
      });
      const nextAdherence = recordTrainingSessionCompletion(adherence, completion);
      const updatedBlock =
        nextAdherence.blocks.find((b) => b.id === activeMovementBlock.id) ?? activeMovementBlock;
      const adherenceSaved = persistAdherence(nextAdherence);
      if (adherenceSaved && backendSignedIn && backendUserId) {
        void syncMovementBlockToRemote({
          block: updatedBlock,
          trainingBlock: training.block,
          training,
          blockNumber: blockNumberForBlocks(nextAdherence.blocks, updatedBlock.id),
          sourceCheckupLocalId: movementBlockSourceCheckUpId(updatedBlock),
        });
        if (localMicroCheckSaved) {
          void syncMicroCheckToRemote({
            result: enrichedResult,
            movementBlock: updatedBlock,
            completion,
          });
        }
      } else if (localMicroCheckSaved && backendSignedIn && backendUserId) {
        void syncMicroCheckToRemote({
          result: enrichedResult,
          movementBlock: activeMovementBlock,
        });
      }
      setLastCompletion(completion);
      setLastMicroCheckSummary(
        buildMicroCheckSummaryViewModel({
          result: enrichedResult,
          source: 'scheduled',
          targetDomain: scheduledTarget.targetDomain,
          scheduleWeekNumber: scheduledTarget.scheduleWeekNumber,
          saved: localMicroCheckSaved,
          history,
          assessments: adherence.assessments,
        })
      );
      setMicroCheckLaunch(null);
      replaceFlow('microcheck-summary');
    },
    [
      activeMovementBlock,
      activeMicroCheckTarget,
      adherence,
      backendSignedIn,
      backendUserId,
      goHome,
      history,
      microCheckLaunch,
      persistAdherence,
      replaceFlow,
      training,
      trainingStore,
    ]
  );

  const handleSessionFeedback = React.useCallback(
    (feedback: {
      perceivedEffort?: 1 | 2 | 3 | 4 | 5;
      painReported?: boolean;
      painArea?: PainArea;
      completed?: boolean;
      trackingQuality?: TrackingQuality;
    }) => {
      if (!lastCompletion) return;
      // Non-credited completions are never recorded in adherence; syncing them
      // would create remote records that a restore can't reproduce locally.
      const completionRecorded = adherence.completions.some((c) => c.id === lastCompletion.id);
      const nextCompletion = { ...lastCompletion, ...feedback };
      const submittedAt = new Date().toISOString();
      const persistedFeedback: PersistedPostSessionFeedback = {
        sessionId:
          activeSessionPlan?.metadata?.generatedSessionId ??
          activeSessionPlan?.id ??
          lastCompletion.id,
        rpe: feedback.perceivedEffort,
        discomfort: feedback.painReported,
        painArea: feedback.painReported ? feedback.painArea : undefined,
        completed: feedback.completed ?? true,
        trackingQuality: feedback.trackingQuality ?? 'good',
        submittedAt,
      };
      setLastCompletion(nextCompletion);
      const nextAdherence = {
        ...adherence,
        completions: adherence.completions.map((c) =>
          c.id === lastCompletion.id ? nextCompletion : c
        ),
      };
      const adherenceSaved = persistAdherence(nextAdherence);
      let nextTraining: TrainingState = {
        ...training,
        lastPostSessionFeedback: persistedFeedback,
      };
      let generatedSessionSummary: ReturnType<typeof createGeneratedSessionSummary> | null = null;
      if (activeSessionPlan) {
        const summary = createGeneratedSessionSummary({
          sessionPlan: activeSessionPlan,
          completedAt: nextCompletion.completedAt,
          durationMinutes: nextCompletion.durationMinutes,
          feedback: persistedFeedback,
          mainPlanCredit: nextCompletion.mainPlanCredit,
          scheduleCredit: nextCompletion.scheduleCredit,
          workEvidence: nextCompletion.workEvidence,
          focusStimulusEvidence: nextCompletion.focusStimulusEvidence,
        });
        generatedSessionSummary = summary;
        if (activeSessionPlan.metadata?.source !== 'legacy_fallback') {
          nextTraining = {
            ...nextTraining,
            generatedSessionSummaries: upsertGeneratedSessionSummary(
              nextTraining.generatedSessionSummaries,
              summary
            ),
          };
        }
      }
      if (
        activeSessionPlan &&
        activeSessionPlan.metadata?.source !== 'legacy_fallback' &&
        countsTowardMainPlan(activeSessionPlan, activeMovementBlock) &&
        nextCompletion.mainPlanCredit === true &&
        nextCompletion.focusStimulusEvidence?.mainPlanCredit === true &&
        nextCompletion.scheduleCredit?.credited === true
      ) {
        try {
          const progression = applyProgressionEvidenceFromSession({
            state: {
              ladderProgressById: nextTraining.ladderProgressById,
              appliedProgressionEventIds: nextTraining.appliedProgressionEventIds,
            },
            sessionPlan: activeSessionPlan,
            completion: nextCompletion,
            activeBlock: activeMovementBlock,
            sessionResult: lastSessionResult,
            perceivedEffort: feedback.perceivedEffort,
            painReported: feedback.painReported,
            painAreas: feedback.painReported && feedback.painArea ? [feedback.painArea] : [],
            completed: feedback.completed ?? true,
            trackingQuality: feedback.trackingQuality ?? 'good',
          });
          for (const diagnostic of progression.diagnostics) {
            addBreadcrumb('progression evidence classified', {
              area: 'progression_authority',
              reason: diagnostic.reason,
              completionId: diagnostic.completionId,
              progressionEventId: diagnostic.progressionEventId,
              blockId: diagnostic.blockId,
              templateId: diagnostic.templateId,
              ladderId: diagnostic.ladderId,
              exerciseId: diagnostic.exerciseId,
              sessionType: diagnostic.sessionType,
              source: diagnostic.source,
              stimulusRole: diagnostic.stimulusRole,
              progressionEvidencePolicy: diagnostic.progressionEvidencePolicy,
              decisionKind: diagnostic.decisionKind,
              beforeLevelId: diagnostic.beforeLevelId,
              afterLevelId: diagnostic.afterLevelId,
            });
          }
          nextTraining = {
            ...nextTraining,
            ladderProgressById: progression.nextState.ladderProgressById,
            appliedProgressionEventIds: progression.nextState.appliedProgressionEventIds.slice(),
          };
        } catch (e) {
          console.warn('[training] dynamic feedback update failed', e);
        }
      }
      persistTraining(nextTraining);
      if (adherenceSaved && completionRecorded && backendSignedIn && backendUserId) {
        const completionBlock =
          nextAdherence.blocks.find((block) => block.id === nextCompletion.blockId) ??
          activeMovementBlock ??
          displayMovementBlock;
        void syncTrainingSessionCompletionToRemote({
          completion: nextCompletion,
          sessionPlan: activeSessionPlan,
          sessionResult: lastSessionResult,
          generatedSummary: generatedSessionSummary,
          movementBlock: completionBlock,
          sessionIndex: sessionIndexForCompletions(nextAdherence.completions, nextCompletion),
        });
      }
    },
    [
      activeMovementBlock,
      activeSessionPlan,
      adherence,
      backendSignedIn,
      backendUserId,
      displayMovementBlock,
      lastCompletion,
      lastSessionResult,
      persistAdherence,
      persistTraining,
      training,
    ]
  );

  const toggleEquipment = React.useCallback(
    (key: keyof EquipmentProfile) => {
      const safetyProfile = prefs.profile.safetyProfile;
      if (!safetyProfile) return;
      const now = new Date().toISOString();
      const canonical = canonicalEquipmentFromSafetyProfile(safetyProfile);
      const set = new Set(canonical.status === 'confirmed' ? canonical.capabilities : []);
      const capability = legacyEquipmentKeyToCapability(key);
      if (set.has(capability)) set.delete(capability);
      else set.add(capability);
      const nextSafetyProfile = safetyProfileWithCanonicalEquipment(
        safetyProfile,
        Array.from(set),
        {
          status: 'confirmed',
          updatedAt: now,
        }
      );
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          safetyProfile: nextSafetyProfile,
        },
      });
      persistTraining({
        ...training,
        equipment: legacyEquipmentFromCanonical(
          canonicalEquipmentFromSafetyProfile(nextSafetyProfile)
        ),
      });
    },
    [persistPrefs, persistTraining, prefs, training]
  );

  const toggleAvailableEquipment = React.useCallback(
    (item: AvailableEquipment) => {
      const safetyProfile = prefs.profile.safetyProfile;
      if (!safetyProfile) return;
      const now = new Date().toISOString();
      const canonical = canonicalEquipmentFromSafetyProfile(safetyProfile);
      const set = new Set(canonical.status === 'confirmed' ? canonical.capabilities : []);
      if (item === 'none') {
        set.clear();
      } else if (set.has(item)) {
        set.delete(item);
      } else {
        set.add(item);
      }
      const nextSafetyProfile = safetyProfileWithCanonicalEquipment(
        safetyProfile,
        Array.from(set),
        {
          status: 'confirmed',
          updatedAt: now,
        }
      );
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          safetyProfile: nextSafetyProfile,
        },
      });
      persistTraining({
        ...training,
        equipment: legacyEquipmentFromCanonical(
          canonicalEquipmentFromSafetyProfile(nextSafetyProfile)
        ),
      });
    },
    [persistPrefs, persistTraining, prefs, training]
  );

  const handlePreferredWorkoutDaysChange = React.useCallback(
    (preferredWorkoutDays: string[]) => {
      const safetyProfile = prefs.profile.safetyProfile;
      if (!safetyProfile) return;
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          safetyProfile: {
            ...safetyProfile,
            preferredWorkoutDays,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    },
    [persistPrefs, prefs]
  );

  const handleStartingEffortChange = React.useCallback(
    (activityLevel: ActivityLevel) => {
      const safetyProfile = prefs.profile.safetyProfile;
      if (!safetyProfile) return;
      persistPrefs({
        ...prefs,
        profile: {
          ...prefs.profile,
          safetyProfile: {
            ...safetyProfile,
            activityLevel,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    },
    [persistPrefs, prefs]
  );

  const viewLast = React.useCallback(() => {
    const latest = latestUsableOfficialCheckUpRecord(history, adherence.assessments);
    if (latest) {
      setLastResult(latest.record.checkUp);
      setLastResultScore(latest.score);
      setLastResultScoreSnapshot(latest.scoreSnapshot);
      setLastResultCheckupType(latest.type);
      setProgressResultCheckUpId(latest.record.checkUp.startedAt);
      setFlow('results');
    }
  }, [adherence.assessments, history]);

  const viewHistoricalCheckUp = React.useCallback(
    (checkUpId: string) => {
      const selected = historicalOfficialCheckUpRecords(history, adherence.assessments).find(
        (entry) => entry.record.checkUp.startedAt === checkUpId
      );
      if (!selected) return;
      setLastResult(selected.record.checkUp);
      setLastResultScore(selected.score);
      setLastResultScoreSnapshot(selected.scoreSnapshot);
      setLastResultCheckupType(selected.type);
      setProgressResultCheckUpId(selected.record.checkUp.startedAt);
      setFlow('results');
    },
    [adherence.assessments, history]
  );

  const handleStartNextBlock = React.useCallback(() => {
    const official = latestUsableOfficialCheckUpRecord(history, adherence.assessments);
    if (!official) {
      beginCheckUp('baseline');
      return;
    }
    const now = new Date().toISOString();
    const sourceResult = official.record.checkUp;
    const score = official.score;
    const scoreSnapshot = official.scoreSnapshot;
    const sourceAssessment = official.assessment;
    const preparedBlock = prepareBlockFromOfficialCheckUp({
      baseAdherence: adherence,
      baseTraining: training,
      sourceCheckUpId: sourceResult.startedAt,
      score,
      scoreSnapshot,
      assessment: sourceAssessment,
      nowIso: now,
      source: 'start_next_block',
    });
    if (!preparedBlock) {
      setLastResult(sourceResult);
      setLastResultScore(score);
      setLastResultScoreSnapshot(scoreSnapshot);
      setLastResultCheckupType(sourceAssessment?.type ?? null);
      setFlow('results');
      return;
    }
    setLastResult(sourceResult);
    setLastResultScore(score);
    setLastResultScoreSnapshot(scoreSnapshot);
    setFlow('block-intro');
  }, [adherence, beginCheckUp, history, prepareBlockFromOfficialCheckUp, training]);

  const handlePlanningRecoveryAction = React.useCallback(
    (action: GenerationRecoveryAction | undefined) => {
      switch (action) {
        case 'retry':
          handleStartSession();
          return;
        case 'review_setup':
        case 'contact_support':
          goSettings();
          return;
        case 'complete_baseline':
          setPlanningRecoveryResult(null);
          openCameraSetup();
          return;
        case 'create_block':
          setPlanningRecoveryResult(null);
          handleStartNextBlock();
          return;
        case 'open_plan':
          setPlanningRecoveryResult(null);
          setFlow(null);
          setTab('plan');
          return;
        case 'open_progress':
          setPlanningRecoveryResult(null);
          setFlow(null);
          setTab('progress');
          return;
        default:
          goHome();
      }
    },
    [goHome, goSettings, handleStartNextBlock, handleStartSession, openCameraSetup]
  );

  const handleRetakeVisibleResult = React.useCallback(() => {
    const score = visibleResultScore;
    const evidence = headlineEvidenceFromScore(score);
    const retryMovementIds = retryBatteryForMissingHeadlineDomains(evidence.missingDomains);
    const retryOptions =
      visibleResult && evidence.measuredDomainCount > 0 && !evidence.complete
        ? {
            battery: retryMovementIds,
            retryOfCheckUpId: visibleResult.startedAt,
            retryMovementIds,
          }
        : undefined;
    const visibleType = lastResultCheckupType ?? visibleResultAssessment?.type ?? null;
    if (visibleType === 'official_retest') {
      beginCheckUp('official_retest', retryOptions);
      return;
    }
    if (visibleType === 'manual_extra' || visibleType === 'quick_recheck') {
      beginCheckUp(visibleType, retryOptions);
      return;
    }
    if (onboardingFlowActive) {
      if (retryOptions) {
        beginCheckUp('baseline', retryOptions);
        return;
      }
      openCameraSetup();
      return;
    }
    beginCheckUp('baseline_retake', retryOptions);
  }, [
    beginCheckUp,
    lastResultCheckupType,
    onboardingFlowActive,
    openCameraSetup,
    visibleResult,
    visibleResultAssessment,
    visibleResultScore,
  ]);

  const handleViewPlanFromResults = React.useCallback(() => {
    replaceNextNavigationLocation(navigationLocation('plan', null));
    setFlow(null);
    setTab('plan');
  }, [replaceNextNavigationLocation]);

  const handleMovementProfileV2ViewPlan = React.useCallback(() => {
    if (movementProfileV2EntryContext !== 'public_onboarding') {
      handleViewPlanFromResults();
      return;
    }

    const now = new Date().toISOString();
    setDevOnboardingReplay(false);
    persistPrefs({
      ...prefs,
      onboarding: {
        ...prefs.onboarding,
        currentStep: 'complete',
        completedAt: prefs.onboarding.completedAt ?? now,
        updatedAt: now,
      },
    });
    setMovementProfileV2DetailDomain(null);
    replaceFlow('block-intro');
  }, [
    handleViewPlanFromResults,
    movementProfileV2EntryContext,
    persistPrefs,
    prefs,
    replaceFlow,
  ]);

  const beginScheduledMicroCheck = React.useCallback(() => {
    if (activeMicroCheckTarget) {
      addBreadcrumb('micro-check voice runtime pinned', {
        area: 'voice_v21_activation',
        flow: 'microcheck',
        v21Enabled: voiceActivation.microCheckVoiceV21Enabled,
      });
      setMicroCheckLaunch({ mode: 'scheduled', target: activeMicroCheckTarget });
      setFlow('microcheck');
      return;
    }
    goHome();
  }, [activeMicroCheckTarget, goHome, voiceActivation]);

  const handleTodayPrimaryAction = React.useCallback(
    (preferences?: TodaySessionPreferences | null) => {
      switch (lifecycle.primaryAction.type) {
        case 'start_onboarding':
          setFlow(flowForOnboardingStep(onboardingStep) ?? 'welcome');
          return;
        case 'start_checkup':
          openCameraSetup();
          return;
        case 'create_block':
          handleStartNextBlock();
          return;
        case 'start_first_session':
        case 'start_today_session':
          handleStartSession(preferences ?? undefined);
          return;
        case 'start_micro_check':
          beginScheduledMicroCheck();
          return;
        case 'start_retest':
          beginCheckUp('official_retest');
          return;
        case 'start_gentle_restart':
          setFlow('restart-intro');
          return;
        case 'explore_extra_sessions':
          handleStartSession({
            ...(preferences ?? {}),
            lifecycleState: 'week_complete',
            presetId: 'preset-mobility-reset',
          });
          return;
        default:
          handleStartSession(preferences ?? undefined);
      }
    },
    [
      beginCheckUp,
      beginScheduledMicroCheck,
      goHome,
      handleStartNextBlock,
      handleStartSession,
      lifecycle.primaryAction.type,
      onboardingStep,
      openCameraSetup,
    ]
  );

  const beginManualOptionalMicroCheck = React.useCallback(() => {
    setMicroCheckLaunch(null);
    setFlow('manual-microcheck-domain');
  }, []);

  const beginManualMicroCheckForDomain = React.useCallback((domain: MovementDomain) => {
    addBreadcrumb('micro-check voice runtime pinned', {
      area: 'voice_v21_activation',
      flow: 'manual_microcheck_domain',
      v21Enabled: voiceActivation.microCheckVoiceV21Enabled,
    });
    setMicroCheckLaunch({
      mode: 'optional',
      microCheckType: microCheckTypeForDomain(domain),
      domain,
    });
    setFlow('microcheck');
  }, [voiceActivation]);

  const extraTrendPoints = React.useMemo(() => microCheckTrendPoints(microChecks), [microChecks]);
  const activeMicroCheckType =
    microCheckLaunch?.mode === 'scheduled'
      ? microCheckLaunch.target.microCheckType
      : microCheckLaunch?.microCheckType ?? null;
  const activeMicroCheckSideSetup = React.useMemo(
    () =>
      activeMicroCheckType
        ? deriveMicroCheckSideSetup({
            microCheckType: activeMicroCheckType,
            history: microChecks,
            officialCheckUps: history,
          })
        : null,
    [activeMicroCheckType, history, microChecks]
  );
  const openManualCheckup = React.useCallback(() => setFlow('manual-checkup'), []);

  const beginProgressFirstCheckUp = React.useCallback(() => {
    if (lifecycle.state === 'needs_onboarding') {
      setFlow(flowForOnboardingStep(onboardingStep) ?? 'welcome');
      return;
    }
    openCameraSetup();
  }, [lifecycle.state, onboardingStep, openCameraSetup]);

  const beginProgressAdditionalCheckUp = React.useCallback(() => {
    openManualCheckup();
  }, [openManualCheckup]);

  function handleMovementProfileV2RawComplete(
    input: MovementProfileV2RawCompletion,
    surface: MovementProfileV2ResultSurface = 'standalone'
  ) {
    try {
      store.save(input.checkUp, { checkupType: input.sourceType });
    } catch (error) {
      console.warn('[movement-profile-v2] raw save failed', error);
      captureError(error, { area: 'movement_profile_v2', action: 'save_raw_checkup' });
    }
    store
      .loadAll()
      .then(setHistory)
      .catch(() => {});
    finalizeMovementProfileV2Raw(input, { resultSurface: surface });
  }

  function resolveMovementProfileV2ReferenceProfile(
    raw: MovementProfileV2RawCompletion,
    officialRetestContext: MovementProfileV2OfficialRetestContext | null = movementProfileV2OfficialRetestContext
  ): MovementProfileV2ReferenceProfile {
    const completedAt = checkUpCompletionTimestamp(raw.checkUp, raw.checkUp.startedAt);
    const profileDraft = movementProfileV2ReferenceDetailsDraftFromProfile(
      prefs.profile,
      new Date(completedAt)
    );
    const draft =
      raw.sourceType === 'official_retest'
        ? officialRetestContext
          ? movementProfileV2ReferenceDetailsDraftFromSnapshot(officialRetestContext.priorArtifacts.snapshot)
          : latestMovementProfileV2ReferenceDetailsDraft(history) ?? profileDraft
        : raw.sourceType === 'baseline_retake'
          ? latestMovementProfileV2ReferenceDetailsDraft(history) ?? profileDraft
          : profileDraft;
    return draft
      ? referenceProfileFromMovementProfileV2Draft(draft)
      : UNKNOWN_MOVEMENT_PROFILE_V2_REFERENCE_PROFILE;
  }

  function finalizeMovementProfileV2Raw(
    raw: MovementProfileV2RawCompletion,
    options: {
      referenceProfile?: MovementProfileV2ReferenceProfile;
      resultSurface?: MovementProfileV2ResultSurface;
      entryContext?: MovementProfileV2EntryContext;
      officialRetestContext?: MovementProfileV2OfficialRetestContext | null;
    } = {}
  ) {
      const resolvedEntryContext = options.entryContext ?? movementProfileV2EntryContext;
      const resolvedResultSurface = options.resultSurface ?? movementProfileV2ResultSurface;
      const resolvedOfficialRetestContext =
        options.officialRetestContext ?? movementProfileV2OfficialRetestContext;
      const referenceProfile =
        options.referenceProfile ??
        resolveMovementProfileV2ReferenceProfile(raw, resolvedOfficialRetestContext);
      setMovementProfileV2Raw(raw);
      setMovementProfileV2InitialFlow(null);
      setMovementProfileV2Result(null);
      setMovementProfileV2RetestComparison(null);
      setMovementProfileV2BlockReport(null);
      setMovementProfileV2PlanBlockId(null);
      setMovementProfileV2PlanState(DEFAULT_MOVEMENT_PROFILE_V2_PLAN_STATE);
      setMovementProfileV2ResultSurface(resolvedResultSurface);
      setMovementProfileV2EntryContext(resolvedEntryContext);
      setMovementProfileV2OfficialRetestContext(resolvedOfficialRetestContext);
      setMovementProfileV2DetailDomain(null);
      setMovementProfileV2SelectedProfileId(null);
      setMovementProfileV2SelectedReportId(null);

      if (!isOfficialMovementProfileV2SourceType(raw.sourceType)) {
        replaceFlow('movement-profile-v2-practice-results');
        return;
      }
      const now = new Date().toISOString();
      const artifactCreatedAt =
        raw.sourceType === 'official_retest'
          ? checkUpCompletionTimestamp(raw.checkUp, now)
          : now;
      const materialized = materializeOfficialMovementProfileV2Artifacts({
        checkUp: raw.checkUp,
        checkupType: raw.sourceType,
        referenceProfile,
        lifeGoal: prefs.profile.lifeGoal,
        acceptedHistory: history,
        snapshotCreatedAt: artifactCreatedAt,
        assessmentCreatedAt: artifactCreatedAt,
      });

      if (!materialized.ok) {
        console.warn('[movement-profile-v2] materialization failed', materialized.reason);
        captureError(new Error(`[movement-profile-v2] ${materialized.reason}`), {
          area: 'movement_profile_v2',
          action: 'materialize_artifacts',
          reason: materialized.reason,
        });
        goHome();
        return;
      }

      try {
        store.save(materialized.checkUp, {
          checkupType: raw.sourceType,
          movementProfileV2Snapshot: materialized.snapshot,
          movementProfileV2Assessment: materialized.assessment,
        });
      } catch (error) {
        console.warn('[movement-profile-v2] artifact save failed', error);
        captureError(error, { area: 'movement_profile_v2', action: 'save_artifacts' });
      }

      const completedAt = checkUpCompletionTimestamp(materialized.checkUp, artifactCreatedAt);
      if (backendSignedIn && backendUserId) {
        void syncMovementCheckupToRemote({
          checkUp: materialized.checkUp,
          checkupType: raw.sourceType,
          status: 'completed',
          completedAt,
          movementProfileV2Snapshot: materialized.snapshot,
          movementProfileV2Assessment: materialized.assessment,
        });
      }

      if (raw.sourceType === 'official_retest') {
        const priorBlock = resolvedOfficialRetestContext
          ? adherence.blocks.find((block) => block.id === resolvedOfficialRetestContext.priorBlockId)
          : null;
        const priorArtifacts = resolvedOfficialRetestContext?.priorArtifacts ?? null;
        const transition = priorBlock && priorArtifacts
          ? transitionMovementProfileV2OfficialRetest({
              priorState: adherence,
              priorBlock,
              schedule: getBlockScheduleState({
                block: priorBlock,
                completions: adherence.completions,
                generatedSessionSummaries: training.generatedSessionSummaries,
                today: completedAt,
              }),
              priorArtifacts,
              currentCheckUp: materialized.checkUp,
              currentSnapshot: materialized.snapshot,
              currentAssessment: materialized.assessment,
              explicitTransitionTimestamp: completedAt,
              userId: LOCAL_USER_ID,
            })
          : null;

        let preparedPlanBlockId: string | null = null;
        let preparedPlanState: MovementProfileV2UnifiedPlanState = {
          status: 'unavailable',
          title: 'Plan unavailable right now',
          body: 'Your latest Movement Profile is saved, but Hale could not prepare the next 4-week plan on this phone.',
        };
        let retestComparison: MovementProfileV2RetestComparison | null = null;
        let blockReport: MovementProfileV2BlockReport | null = null;

        if (transition?.status === 'ready') {
          const adherenceSaved = persistAdherence(transition.nextState);
          if (adherenceSaved) {
            preparedPlanBlockId = transition.nextBlock.id;
            preparedPlanState = {
              status: backendSignedIn && backendUserId ? 'sync_pending_local_ready' : 'ready',
              blockId: transition.nextBlock.id,
            };
            retestComparison = transition.comparison;
            blockReport = transition.report;
            if (backendSignedIn && backendUserId && priorArtifacts) {
              void syncMovementBlockToRemote({
                block: transition.completedPriorBlock,
                training,
                blockNumber: blockNumberForBlocks(transition.nextState.blocks, transition.completedPriorBlock.id),
                sourceCheckupLocalId: priorArtifacts.assessment.sourceCheckUpId,
              });
              void syncMovementBlockToRemote({
                block: transition.nextBlock,
                training,
                blockNumber: blockNumberForBlocks(transition.nextState.blocks, transition.nextBlock.id),
                sourceCheckupLocalId: materialized.assessment.sourceCheckUpId,
              });
              void syncMovementBlockReportToRemote({
                report: transition.report,
                movementBlock: transition.completedPriorBlock,
                completions: transition.nextState.completions,
              });
            }
          } else {
            preparedPlanState = {
              status: 'unavailable',
              title: 'Plan unavailable right now',
              body: 'Your latest Movement Profile is saved, but Hale could not save the completed block or next plan on this phone.',
            };
          }
        } else {
          addBreadcrumb('movement profile v2 official retest transition blocked', {
            area: 'movement_profile_v2',
            status: transition?.status ?? 'missing_prior_context',
            blockId: priorBlock?.id,
            checkUpId: materialized.checkUp.startedAt,
          });
          if (__DEV__) {
            console.warn(
              '[movement-profile-v2] official retest transition blocked',
              transition?.status ?? 'missing_prior_context'
            );
          }
        }

        setMovementProfileV2Raw(null);
        setMovementProfileV2InitialFlow(null);
        setMovementProfileV2OfficialRetestContext(null);
        setMovementProfileV2DetailDomain(null);
        setMovementProfileV2PlanBlockId(preparedPlanBlockId);
        setMovementProfileV2PlanState(preparedPlanState);
        setMovementProfileV2RetestComparison(retestComparison);
        setMovementProfileV2BlockReport(blockReport);
        setMovementProfileV2Result(
          buildMovementProfileV2ResultsViewModel({
            snapshot: materialized.snapshot,
            assessment: materialized.assessment,
          })
        );
        store
          .loadAll()
          .then(setHistory)
          .catch(() => {});
        replaceFlow('movement-profile-v2-unified-results');
        return;
      }

      const planBlock = materializeMovementProfileV2Block({
        adherence,
        checkUp: materialized.checkUp,
        checkupType: raw.sourceType,
        snapshot: materialized.snapshot,
        assessment: materialized.assessment,
        userId: LOCAL_USER_ID,
        startDate: now,
      });
      let preparedPlanBlockId: string | null = null;
      let preparedPlanState: MovementProfileV2UnifiedPlanState = {
        status: 'unavailable',
        title: 'Plan unavailable right now',
        body: 'Your Movement Profile is saved. Hale could not prepare the matching 4-week plan on this phone.',
      };
      if (planBlock.ok) {
        const adherenceSaved = persistAdherence(planBlock.adherence);
        if (adherenceSaved) {
          preparedPlanBlockId = planBlock.block.id;
          preparedPlanState = {
            status: backendSignedIn && backendUserId ? 'sync_pending_local_ready' : 'ready',
            blockId: planBlock.block.id,
          };
          // Seeds only ladders the user has never touched, from this
          // check-up's own measured chair-stand/single-leg values (never
          // age) — training-earned progress from a prior block is untouched.
          const measuredCapability = measuredCapabilityFromMovementProfileV2Interpretation(
            materialized.snapshot.interpretation
          );
          persistTraining({
            ...training,
            ladderProgressById: initialLadderProgressFromMeasuredCapability({
              previousLadderProgress: training.ladderProgressById,
              chairStandReps: measuredCapability.chairStandReps,
              singleLegHoldSec: measuredCapability.singleLegHoldSec,
              nowIso: now,
            }),
          });
          if (backendSignedIn && backendUserId) {
            void syncMovementBlockToRemote({
              block: planBlock.block,
              training,
              blockNumber: blockNumberForBlocks(planBlock.adherence.blocks, planBlock.block.id),
              sourceCheckupLocalId: materialized.assessment.sourceCheckUpId,
            });
          }
        } else {
          preparedPlanState = {
            status: 'unavailable',
            title: 'Plan unavailable right now',
            body: 'Your Movement Profile is saved, but Hale could not save the prepared plan on this phone.',
          };
        }
      } else {
        addBreadcrumb('movement profile v2 block materialization blocked', {
          area: 'movement_profile_v2',
          reason: planBlock.reason,
          existingBlockId: planBlock.existingBlockId,
          expectedBlockId: planBlock.expectedBlockId,
        });
        if (__DEV__) {
          console.warn('[movement-profile-v2] block materialization blocked', planBlock.reason);
        }
        preparedPlanState =
          planBlock.reason === 'v2_block_active_block_conflict'
            ? {
                status: 'active_block_conflict',
                existingBlockId: planBlock.existingBlockId,
              }
            : {
                status: 'unavailable',
                title: 'Plan unavailable right now',
                body: 'Your Movement Profile is saved, but Hale could not find a matching prepared plan.',
              };
      }

      setMovementProfileV2Raw(null);
      setMovementProfileV2InitialFlow(null);
      setMovementProfileV2DetailDomain(null);
      setMovementProfileV2RetestComparison(null);
      setMovementProfileV2BlockReport(null);
      setMovementProfileV2PlanBlockId(preparedPlanBlockId);
      setMovementProfileV2PlanState(preparedPlanState);
      setMovementProfileV2Result(
        buildMovementProfileV2ResultsViewModel({
          snapshot: materialized.snapshot,
          assessment: materialized.assessment,
        })
      );
      if (resolvedEntryContext === 'public_onboarding') {
        persistPrefs({
          ...prefs,
          onboarding: {
            ...prefs.onboarding,
            currentStep: 'results',
            baselineResultId: materialized.checkUp.startedAt,
            updatedAt: completedAt,
          },
        });
      }
      store
        .loadAll()
        .then(setHistory)
        .catch(() => {});
      replaceFlow(
        resolvedResultSurface === 'unified'
          ? 'movement-profile-v2-unified-results'
          : 'movement-profile-v2-results'
      );
    }

  React.useEffect(() => {
    if (
      !pendingMovementProfileV2Raw ||
      !historyReady ||
      !profileReady ||
      !trainingReady ||
      !adherenceReady ||
      !restoreReady
    ) {
      return;
    }
    const raw = {
      checkUp: pendingMovementProfileV2Raw.record.checkUp,
      sourceType: pendingMovementProfileV2Raw.sourceType,
    };
    const attemptKey = `${raw.sourceType}:${raw.checkUp.startedAt}`;
    if (movementProfileV2AutoFinalizeAttemptRef.current === attemptKey) return;
    movementProfileV2AutoFinalizeAttemptRef.current = attemptKey;
    // A retest stranded by a crash between raw save and finalize still needs
    // its prior-block context so the block transition and report can complete.
    const priorBlock =
      raw.sourceType === 'official_retest' &&
      activeMovementBlock?.origin?.kind === 'movement_profile_v2_assessment'
        ? activeMovementBlock
        : null;
    const priorRecord = priorBlock
      ? movementProfileV2AssessmentForSourceCheckUpId(
          history,
          priorBlock.origin?.kind === 'movement_profile_v2_assessment'
            ? priorBlock.origin.sourceCheckUpId
            : ''
        )
      : null;
    const officialRetestContext =
      priorBlock && priorRecord
        ? {
            priorBlockId: priorBlock.id,
            priorArtifacts: priorRecord,
            priorStandingLeg: latestV2StandingLeg([priorRecord.record.checkUp]),
            priorShoulderSide: latestV2ShoulderSide([priorRecord.record.checkUp]),
          }
        : null;
    if (raw.sourceType === 'official_retest') {
      addBreadcrumb('movement profile v2 pending retest auto-finalize', {
        area: 'movement_profile_v2',
        checkUpId: raw.checkUp.startedAt,
        priorContextRebuilt: !!officialRetestContext,
      });
    }
    finalizeMovementProfileV2Raw(raw, {
      entryContext:
        !prefs.onboarding.completedAt && onboardingStep !== 'complete'
          ? 'public_onboarding'
          : 'public_standard',
      officialRetestContext,
      resultSurface: 'unified',
    });
  }, [
    activeMovementBlock,
    adherenceReady,
    history,
    historyReady,
    onboardingStep,
    pendingMovementProfileV2Raw,
    prefs.onboarding.completedAt,
    profileReady,
    restoreReady,
    trainingReady,
  ]);

  const viewLatestMovementProfileV2 = React.useCallback(() => {
    if (!movementProfileV2InternalSurfaceEnabled) return;
    const latest = latestMaterializedMovementProfileV2Result(history);
    if (!latest) return;
    const planBlock =
      adherence.blocks.find(
        (block) => movementProfileV2BlockMatchesResult(block, latest.snapshot, latest.assessment)
      ) ?? null;
    setMovementProfileV2Raw(null);
    setMovementProfileV2InitialFlow(null);
    setMovementProfileV2DetailDomain(null);
    setMovementProfileV2SelectedProfileId(null);
    setMovementProfileV2SelectedReportId(null);
    setMovementProfileV2PlanBlockId(planBlock?.id ?? null);
    setMovementProfileV2PlanState(
      planBlock
        ? { status: 'ready', blockId: planBlock.id }
        : {
            status: 'unavailable',
            title: 'Plan unavailable right now',
            body: 'This saved Movement Profile does not have a matching prepared 4-week plan on this phone.',
          }
    );
    setMovementProfileV2ResultSurface('unified');
    setMovementProfileV2EntryContext('internal');
    setMovementProfileV2Result(movementProfileV2ResultsViewModelForRecord(latest));
    setFlow('movement-profile-v2-unified-results');
  }, [adherence.blocks, history, movementProfileV2InternalSurfaceEnabled]);

  const viewMovementProfileV2ProgressProfile = React.useCallback(
    (sourceCheckUpId: string) => {
      const profile = movementProfileV2ProgressProfileBySourceCheckUpId(displayHistory, sourceCheckUpId);
      if (!profile) {
        setFlow(null);
        setTab('progress');
        return;
      }
      setMovementProfileV2Raw(null);
      setMovementProfileV2InitialFlow(null);
      setMovementProfileV2DetailDomain(null);
      setMovementProfileV2SelectedProfileId(sourceCheckUpId);
      setMovementProfileV2SelectedReportId(null);
      setMovementProfileV2PlanBlockId(null);
      setMovementProfileV2PlanState(DEFAULT_MOVEMENT_PROFILE_V2_PLAN_STATE);
      setMovementProfileV2ResultSurface('standalone');
      setMovementProfileV2EntryContext('public_standard');
      setMovementProfileV2RetestComparison(null);
      setMovementProfileV2BlockReport(null);
      setMovementProfileV2Result(movementProfileV2ResultsViewModelForRecord(profile));
      setFlow('movement-profile-v2-results');
    },
    [displayHistory]
  );

  const viewMovementProfileV2ProgressReport = React.useCallback(
    (reportId: string) => {
      const report = movementProfileV2ProgressReportById(displayAdherence.reports, displayHistory, reportId);
      if (!report) {
        setFlow(null);
        setTab('progress');
        return;
      }
      setMovementProfileV2Raw(null);
      setMovementProfileV2InitialFlow(null);
      setMovementProfileV2DetailDomain(null);
      setMovementProfileV2SelectedProfileId(null);
      setMovementProfileV2SelectedReportId(reportId);
      setMovementProfileV2ResultSurface('unified');
      setMovementProfileV2EntryContext('public_standard');
      setMovementProfileV2RetestComparison(null);
      setMovementProfileV2BlockReport(report);
      setFlow('movement-profile-v2-block-report');
    },
    [displayAdherence.reports, displayHistory]
  );

  const selectedMovementProfileV2ProgressResult = React.useMemo(() => {
    if (!movementProfileV2SelectedProfileId) return null;
    const profile = movementProfileV2ProgressProfileBySourceCheckUpId(displayHistory, movementProfileV2SelectedProfileId);
    return profile ? movementProfileV2ResultsViewModelForRecord(profile) : null;
  }, [displayHistory, movementProfileV2SelectedProfileId]);

  const selectedMovementProfileV2ProgressReport = React.useMemo(() => {
    if (!movementProfileV2SelectedReportId) return null;
    return movementProfileV2ProgressReportById(displayAdherence.reports, displayHistory, movementProfileV2SelectedReportId);
  }, [displayAdherence.reports, displayHistory, movementProfileV2SelectedReportId]);

  const handleRoute = React.useCallback(
    (route: string | undefined) => {
      switch (route) {
        case 'life-goal':
          openLifeGoal();
          return;
        case 'safety-profile':
          openSafetyProfile();
          return;
        case 'equipment':
          setFlow('equipment');
          return;
        case 'camera-explanation':
          setFlow('camera-explanation');
          return;
        case 'camera-setup':
          openCameraSetup();
          return;
        case 'checkup':
          beginCheckUp();
          return;
        case 'checkup-retake':
        case 'baseline-retake':
          beginCheckUp('baseline_retake');
          return;
        case 'manual-checkup':
          openManualCheckup();
          return;
        case 'manual-extra-checkup':
          beginCheckUp('manual_extra');
          return;
        case 'quick-recheck':
          beginCheckUp('quick_recheck');
          return;
        case 'manual-extra-v2-checkup':
          beginCheckUp('manual_extra_v2');
          return;
        case 'official-retest':
          beginCheckUp('official_retest');
          return;
        case 'create-block':
        case 'next-block':
          handleStartNextBlock();
          return;
        case 'training':
          handleStartSession();
          return;
        case 'microcheck':
          beginScheduledMicroCheck();
          return;
        case 'restart-intro':
          setFlow('restart-intro');
          return;
        case 'progress':
          setFlow(null);
          setTab('progress');
          return;
        case 'home-block':
        default:
          goHome();
      }
    },
    [
      beginCheckUp,
      beginScheduledMicroCheck,
      goHome,
      handleStartNextBlock,
      handleStartSession,
      openCameraSetup,
      openLifeGoal,
      openManualCheckup,
      openSafetyProfile,
    ]
  );

  const cameraReady = permission === 'granted' && audioReady;
  const activeTab = normalizeTabKey(tab);
  const activeTabScreen = getTabDef(activeTab).screen;
  const showTabBar =
    flow === null &&
    restoreReady &&
    onboardingDecisionReady &&
    !pendingInitialOnboardingFlow &&
    !(activeTabScreen === 'ProgressScreen' && progressHistoryOpen);

  React.useEffect(() => {
    void setAndroidNavigationBarVisibleAsync(showTabBar);
  }, [showTabBar]);

  if (
    !restoreReady ||
    (flow === null && (!onboardingDecisionReady || pendingInitialOnboardingFlow))
  ) {
    return <AuthLoadingScreen />;
  }

  if (
    !releaseGatedFlowAllowed ||
    !movementProfileV2FlowAllowed ||
    (flow === 'checkup' && !legacyV1CheckUpFlowAllowed) ||
    (flow === 'results' && !legacyV1ResultsFlowAllowed)
  ) {
    return <View style={styles.container} />;
  }

  // Camera flows need permission + audio first; everything else renders freely.
  if (flow !== null && CAMERA_FLOWS.has(flow) && !cameraReady) {
    return (
      <CameraReadinessGate
        permission={permission}
        audioReady={audioReady}
        onRequestPermission={requestCameraPermission}
        onBack={() => goBack(goHome)}
      />
    );
  }

  const visibleMovementProfileV2Result =
    selectedMovementProfileV2ProgressResult ?? movementProfileV2Result;
  const visibleMovementProfileV2BlockReport =
    selectedMovementProfileV2ProgressReport ?? movementProfileV2BlockReport;
  const movementProfileV2ReportReadOnly = !!selectedMovementProfileV2ProgressReport;

  // A full-screen flow takes over the whole screen (no tab bar).
  if (flow !== null) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        {flow === 'welcome' ? (
          <WelcomeScreen
            onStart={handleWelcomeStart}
            onDone={goHome}
            onBack={onboardingFlowActive ? signOutFromOnboarding : undefined}
            showDashboardLink={!onboardingFlowActive}
          />
        ) : flow === 'safety-profile' ? (
          <SafetyProfileScreen
            profile={prefs.profile}
            onSave={onSafetyProfileSave}
            showContinueAction={onboardingFlowActive || safetyProfileEntry !== 'review'}
            onCancel={() =>
              goBack(() => (onboardingFlowActive ? replaceFlow('life-goal') : goHome()))
            }
          />
        ) : flow === 'equipment' ? (
          <OnboardingEquipmentScreen
            selectedEquipment={prefs.onboarding.selectedEquipment}
            onSave={handleEquipmentSave}
            onBack={() => goBack(() => replaceFlow('safety-profile'))}
          />
        ) : flow === 'camera-explanation' ? (
          <CameraExplanationScreen
            permissionGranted={permission === 'granted'}
            onRequestPermission={requestCameraPermission}
            onContinue={handleCameraExplanationContinue}
            onBack={() => goBack(() => replaceFlow('equipment'))}
          />
        ) : flow === 'camera-setup' ? (
          <CameraSetupScreen
            permissionGranted={permission === 'granted'}
            onRequestPermission={requestCameraPermission}
            showBeginAction={cameraSetupEntry !== 'review'}
            onBegin={() =>
              onboardingFlowActive
                ? beginOnboardingCheckUp()
                : beginCheckUp(latestAssessment ? 'baseline_retake' : 'baseline')
            }
            onDoLater={onboardingFlowActive ? deferOnboardingCheckUp : undefined}
            onDevCompleteCheckup={
              __DEV__ && onboardingFlowActive ? completeDevOnboardingCheckUp : undefined
            }
            onCancel={() =>
              goBack(() => (onboardingFlowActive ? replaceFlow('camera-explanation') : goHome()))
            }
          />
        ) : flow === 'manual-checkup' ? (
          <ManualCheckupStartScreen
            latestAssessment={latestAssessment}
            activeBlock={activeMovementBlock}
            completions={adherence.completions}
            onSelectCheckup={beginCheckUp}
            onMicroCheck={beginManualOptionalMicroCheck}
            onCancel={() => goBack(goHome)}
          />
        ) : flow === 'manual-microcheck-domain' ? (
          <ManualMicroCheckDomainScreen
            onSelectDomain={beginManualMicroCheckForDomain}
            onBack={() => goBack(openManualCheckup)}
          />
        ) : flow === 'manual-microcheck-unavailable' ? (
          <ManualMicroCheckUnavailableScreen
            onBack={() => goBack(openManualCheckup)}
            onDone={goHome}
          />
        ) : flow === 'checkup' && legacyV1CheckUpFlowAllowed ? (
          <CheckUpScreen
            onComplete={handleCheckUpComplete}
            onCancel={() => goBack(goHome)}
            voiceId={prefs.settings.voiceId}
            battery={pendingCheckup?.battery}
          />
        ) : flow === 'results' && legacyV1ResultsFlowAllowed && visibleResult ? (
          showOnboardingResult ? (
            <OnboardingResultsScreen
              checkUp={visibleResult}
              assessment={visibleResultAssessment}
              score={visibleResultScore}
              scoreSnapshot={visibleResultSnapshot}
              plannedBlock={displayMovementBlock}
              userAge={prefs.profile.age}
              onContinue={handleOnboardingResultsContinue}
              onRetake={handleRetakeVisibleResult}
              onDone={goHome}
            />
          ) : (
            <ResultsScreen
              checkUp={visibleResult}
              assessment={visibleResultAssessment}
              score={visibleResultScore}
              scoreSnapshot={visibleResultSnapshot}
              age={prefs.profile.age}
              ageBand={prefs.profile.ageBand}
              history={history}
              extraTrendPoints={extraTrendPoints}
              onDone={() => goBack(goHome)}
              onRetake={handleRetakeVisibleResult}
              nextPlanReady={visibleResultNextPlanReady}
              showBackButton={visibleResultOpenedFromProgress}
              onViewPlan={visibleResultNextPlanReady ? handleViewPlanFromResults : undefined}
            />
          )
        ) : flow === 'session-unavailable' && planningRecoveryResult?.kind === 'unavailable' ? (
          <SessionPlanningRecoveryScreen
            result={planningRecoveryResult}
            copy={getSessionPlanningRecoveryCopy(planningRecoveryResult)}
            onPrimaryAction={() =>
              handlePlanningRecoveryAction(planningRecoveryResult.recoveryActions[0])
            }
            onSecondaryAction={() =>
              handlePlanningRecoveryAction(planningRecoveryResult.recoveryActions[1])
            }
            onCancel={() => goBack(goHome)}
          />
        ) : flow === 'session-preview' && activeSessionPlan ? (
          <SessionPreviewScreen
            plan={activeSessionPlan}
            resumeFromExercise={
              sessionResume && sessionResume.remainingExerciseIds.length > 0
                ? sessionResume.completedItems.length + 1
                : undefined
            }
            onStartOver={sessionResume ? discardSessionInProgress : undefined}
            onStart={beginPlannedSession}
            onCancel={() => goBack(goHome)}
          />
        ) : flow === 'training' && sessionIds.length > 0 ? (
          <TrainingSessionScreen
            exerciseIds={sessionIds}
            sessionTitle={activeSessionPlan?.title}
            generatedExercises={activeSessionPlan?.metadata?.generatedExercises}
            onComplete={handleSessionComplete}
            onItemCompleted={handleSessionItemCompleted}
            onCancel={() => goBack(goHome)}
            voiceId={prefs.settings.voiceId}
            internalRuntime={{
              trainingVoiceMode: 'internal_v21',
              trainingVoiceBehaviorReady: voiceActivation.trainingVoiceV21Enabled,
              stepUpAlternationReady: voiceActivation.stepUpAlternationEnabled,
              floorSetupReady: voiceActivation.floorV21Enabled,
              stepUpAlternationFeatureEnabled: voiceActivation.stepUpAlternationEnabled,
              floorV21FeatureEnabled: voiceActivation.floorV21Enabled,
            }}
          />
        ) : flow === 'microcheck' && activeMicroCheckType ? (
          <MicroCheckScreen
            type={activeMicroCheckType}
            sideSetup={activeMicroCheckSideSetup}
            onComplete={handleMicroCheckComplete}
            onCancel={() => {
              setMicroCheckLaunch(null);
              goBack(goHome);
            }}
            voiceId={prefs.settings.voiceId}
          />
        ) : flow === 'microcheck-summary' && lastMicroCheckSummary ? (
          <MicroCheckSummaryScreen
            summary={lastMicroCheckSummary}
            onDone={goHome}
          />
        ) : flow === 'life-goal' ? (
          <LifeGoalOnboardingScreen
            initialGoal={prefs.profile.lifeGoal}
            mode={lifeGoalEntry === 'review' ? 'review' : 'onboarding'}
            onSave={onLifeGoalSave}
            onCancel={() =>
              lifeGoalEntry === 'review'
                ? setFlow('settings')
                : goBack(() => (onboardingFlowActive ? replaceFlow('welcome') : goHome()))
            }
          />
        ) : flow === 'onboarding-block' && displayMovementBlock ? (
          <OnboardingBlockScreen
            block={displayMovementBlock}
            onStartSession={() => handleStartSession({ lifecycleState: 'first_session_ready' })}
            onGoToday={goHome}
          />
        ) : flow === 'block-intro' && displayMovementBlock ? (
          <BlockIntroScreen
            block={displayMovementBlock}
            lifeGoal={blockIntroPreview?.lifeGoal ?? prefs.profile.lifeGoal}
            onStartSession={blockIntroPreview ? () => undefined : handleStartSession}
            onDone={goHome}
          />
        ) : flow === 'restart-intro' && activeMovementBlock ? (
          <RestartSessionScreen
            block={activeMovementBlock}
            lifeGoal={prefs.profile.lifeGoal}
            completions={adherence.completions}
            onStart={handleStartRestartSession}
            onCancel={() => goBack(goHome)}
          />
        ) : flow === 'session-complete' && displayMovementBlock ? (
          <SessionCompletionScreen
            block={displayMovementBlock}
            lifeGoal={prefs.profile.lifeGoal}
            completion={lastCompletion}
            validTimeSummaries={validTimeSessionSummaryCards(lastSessionResult)}
            onFeedback={handleSessionFeedback}
            onDone={goHome}
          />
        ) : flow === 'ladder-detail' && selectedLadderId ? (
          <LadderDetailScreen
            ladderId={selectedLadderId}
            ladderProgressById={training.ladderProgressById}
            equipment={training.equipment}
            safetyProfile={prefs.profile.safetyProfile}
            activeBlockId={displayActiveMovementBlock?.id}
            generatedSessionSummaries={training.generatedSessionSummaries}
            onPractice={() => handleStartLadderPractice(selectedLadderId)}
            onDone={() => goBack(goExplore)}
          />
        ) : flow === 'learn-detail' && selectedLearnId ? (
          <LearnDetailScreen
            articleId={selectedLearnId}
            onCameraSetup={() => openCameraSetup('review')}
            onEquipment={goSettings}
            onDone={() => goBack(goExplore)}
          />
        ) : flow === 'movement-profile-v2-unified-checkup' && movementProfileV2InitialFlow ? (
          <MovementProfileV2UnifiedCheckUpScreen
            startedAt={movementProfileV2InitialFlow.startedAt}
            sourceType={movementProfileV2InitialFlow.sourceType}
            initialFlow={movementProfileV2InitialFlow}
            voiceId={prefs.settings.voiceId}
            onComplete={(input) => handleMovementProfileV2RawComplete(input, 'unified')}
            onCancel={() => goBack(goHome)}
          />
        ) : flow === 'movement-profile-v2-practice-results' && movementProfileV2Raw ? (
          <MovementProfileV2PracticeResultsScreen
            checkUp={movementProfileV2Raw.checkUp}
            onDone={() => {
              setMovementProfileV2Raw(null);
              goBack(goHome);
            }}
          />
        ) : flow === 'movement-profile-v2-unified-results' && visibleMovementProfileV2Result ? (
          <MovementProfileV2UnifiedResultsScreen
            viewModel={visibleMovementProfileV2Result}
            planState={movementProfileV2PlanState}
            retestComparison={movementProfileV2RetestComparison}
            variant={
              movementProfileV2EntryContext === 'public_onboarding'
                ? 'onboarding'
                : 'standard'
            }
            onOpenDomain={(domain) => {
              setMovementProfileV2DetailDomain(domain);
              setFlow('movement-profile-v2-unified-domain-detail');
            }}
            onViewPlan={
              movementProfileV2PlanBlockId ? handleMovementProfileV2ViewPlan : undefined
            }
            onViewBlockReport={
              movementProfileV2BlockReport
                ? () => setFlow('movement-profile-v2-block-report')
                : undefined
            }
            onDone={() => {
              setMovementProfileV2DetailDomain(null);
              goBack(goHome);
            }}
          />
        ) : flow === 'movement-profile-v2-block-report' && visibleMovementProfileV2BlockReport ? (
          <MovementProfileV2BlockReportScreen
            report={visibleMovementProfileV2BlockReport}
            readOnly={movementProfileV2ReportReadOnly}
            onViewNextPlan={handleMovementProfileV2ViewPlan}
            onDone={() => {
              if (movementProfileV2ReportReadOnly) {
                setMovementProfileV2SelectedReportId(null);
                setFlow(null);
                setTab('progress');
                return;
              }
              goBack(() => setFlow('movement-profile-v2-unified-results'));
            }}
          />
        ) : (flow === 'movement-profile-v2-results' ||
            flow === 'movement-profile-v2-domain-detail' ||
            flow === 'movement-profile-v2-unified-domain-detail') &&
          visibleMovementProfileV2Result ? (
          <MovementProfileV2ResultsScreen
            viewModel={visibleMovementProfileV2Result}
            readOnly={!!selectedMovementProfileV2ProgressResult}
            detailDomain={
              flow === 'movement-profile-v2-domain-detail' ||
              flow === 'movement-profile-v2-unified-domain-detail'
                ? movementProfileV2DetailDomain
                : null
            }
            onOpenDomain={(domain) => {
              setMovementProfileV2DetailDomain(domain);
              setFlow(
                flow === 'movement-profile-v2-unified-domain-detail'
                  ? 'movement-profile-v2-unified-domain-detail'
                  : 'movement-profile-v2-domain-detail'
              );
            }}
            onBackToResults={() => {
              setMovementProfileV2DetailDomain(null);
              replaceFlow(
                flow === 'movement-profile-v2-unified-domain-detail'
                  ? 'movement-profile-v2-unified-results'
                  : 'movement-profile-v2-results'
              );
            }}
            onViewPlan={
              movementProfileV2PlanBlockId ? handleMovementProfileV2ViewPlan : undefined
            }
            onDone={() => {
              setMovementProfileV2DetailDomain(null);
              if (selectedMovementProfileV2ProgressResult) {
                setMovementProfileV2SelectedProfileId(null);
                setFlow(null);
                setTab('progress');
                return;
              }
              goBack(goHome);
            }}
          />
        ) : flow === 'movement-profile-v2-retest-unavailable' ? (
          <MovementProfileRetestUnavailableScreen onDone={goHome} />
        ) : flow === 'settings' ? (
          <SettingsScreen
            profile={prefs.profile}
            settings={prefs.settings}
            equipment={legacyEquipmentFromCanonical(
              canonicalEquipmentFromSafetyProfile(prefs.profile.safetyProfile)
            )}
            preferredDays={prefs.profile.safetyProfile?.preferredWorkoutDays ?? []}
            startingEffort={onboardingActivityLevel(prefs.profile.safetyProfile?.activityLevel)}
            onProfileChange={onProfileChange}
            onSettingsChange={onSettingsChange}
            onToggleEquipment={toggleEquipment}
            onToggleAvailableEquipment={toggleAvailableEquipment}
            onPreferredDaysChange={handlePreferredWorkoutDaysChange}
            onStartingEffortChange={handleStartingEffortChange}
            onOpenLifeGoal={() => openLifeGoal('review')}
            onOpenSafetyProfile={() => openSafetyProfile('review')}
            onOpenCameraSetup={() => openCameraSetup('review')}
            onReplayOnboardingForDev={
              MOVEMENT_PROFILE_V2_INTERNAL_ENABLED && __DEV__ ? replayOnboardingForDev : undefined
            }
            onBack={goHome}
          />
        ) : flow === 'dev-live' && developerRuntime ? (
          <LiveSessionScreen />
        ) : (
          // Defensive: an unsatisfiable flow (e.g. results with no result) falls back home.
          <View />
        )}
        {__DEV__ && flow === 'dev-live' ? (
          <Pressable
            style={styles.back}
            onPress={() => goBack(goHome)}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  // Tab shell.
  const tabBarScrollClearance = showTabBar
    ? TAB_BAR_SCROLL_CLEARANCE + systemInsets.bottom
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenScrollClearanceProvider bottom={tabBarScrollClearance}>
        <View style={styles.tabContent}>
          {activeTabScreen === 'TodayScreen' ? (
            <TodayScreen
              profile={displayPrefs.profile}
              lifecycle={lifecycle}
              onPrimaryAction={handleTodayPrimaryAction}
              onOpenSettings={goSettings}
            />
          ) : activeTabScreen === 'PlanScreen' ? (
            <PlanScreen
              lifecycleState={lifecycle.state}
              lifeGoalText={
                displayPrefs.profile.lifeGoal
                  ? getLifeGoalDisplayText(displayPrefs.profile.lifeGoal)
                  : normalizeLifeGoalDisplayText(displayPrefs.profile.goal)
              }
              activeBlockSummary={lifecycle.activeBlockSummary}
              weekSessionStatuses={lifecycle.weekSessionStatuses ?? []}
              preferredDays={displayPrefs.profile.safetyProfile?.preferredWorkoutDays ?? []}
              startingEffort={onboardingActivityLevel(displayPrefs.profile.safetyProfile?.activityLevel)}
              onStartOnboarding={() => setFlow(flowForOnboardingStep(onboardingStep) ?? 'welcome')}
              onStartCheckUp={() => openCameraSetup()}
              onCreateBlock={handleStartNextBlock}
              onStartPlanSession={handleStartPlanSession}
              onStartRetest={() => beginCheckUp('official_retest')}
              onOpenSettings={goSettings}
            />
          ) : activeTabScreen === 'ProgressScreen' ? (
            <ProgressScreen
              history={displayHistory}
              assessments={displayAdherence.assessments}
              activeBlock={displayActiveMovementBlock}
              blocks={displayAdherence.blocks}
              reports={displayAdherence.reports}
              completions={displayAdherence.completions}
              ladderProgressById={displayTraining.ladderProgressById}
              lifeGoal={displayPrefs.profile.lifeGoal}
              today={new Date().toISOString()}
              onBeginFirstCheckUp={beginProgressFirstCheckUp}
              onBeginAdditionalCheckUp={beginProgressAdditionalCheckUp}
              onStartRetest={() => beginCheckUp('official_retest')}
              onViewLatest={devMockData ? () => undefined : viewLast}
              onViewCheckUp={devMockData ? () => undefined : viewHistoricalCheckUp}
              showMovementProfileV2Internal={
                movementProfileV2InternalSurfaceEnabled && !devMockData
              }
              onViewMovementProfileV2={devMockData ? undefined : viewLatestMovementProfileV2}
              progressDataAuthority={devMockData ? undefined : progressDataAuthority}
              movementProfileV2Progress={devMockData ? null : movementProfileV2Progress}
              onStartMovementProfileV2CheckUp={beginProgressFirstCheckUp}
              onViewMovementProfileV2Profile={viewMovementProfileV2ProgressProfile}
              onViewMovementProfileV2Report={viewMovementProfileV2ProgressReport}
              onViewCurrentPlan={() => {
                setFlow(null);
                setTab('plan');
              }}
              historyOpen={progressHistoryOpen}
              onHistoryOpenChange={setProgressHistoryOpen}
              onOpenSettings={goSettings}
            />
          ) : activeTabScreen === 'ExploreScreen' ? (
            <ExploreScreen
              equipment={displayTraining.equipment}
              safetyProfile={displayPrefs.profile.safetyProfile}
              ladderProgressById={displayTraining.ladderProgressById}
              activeBlockId={displayActiveMovementBlock?.id}
              generatedSessionSummaries={displayTraining.generatedSessionSummaries}
              onStartExtraSession={handleStartExtraSession}
              onOpenLadder={openLadderDetail}
              onOpenLearn={openLearnDetail}
              onOpenSettings={goSettings}
            />
          ) : (
            <TodayScreen
              profile={displayPrefs.profile}
              lifecycle={lifecycle}
              onPrimaryAction={handleTodayPrimaryAction}
              onOpenSettings={goSettings}
            />
          )}
        </View>
      </ScreenScrollClearanceProvider>

      {showTabBar ? (
        <TabBar active={activeTab} onChange={setTab} bottomInset={systemInsets.bottom} />
      ) : null}
    </View>
  );
}

function buildDevCompletedOnboardingProfile(profile: UserProfile, nowIso: string): UserProfile {
  const lifeGoal = profile.lifeGoal ?? createLifeGoal({ category: 'stairs', nowIso });
  const ageBand = profile.ageBand ?? '55_64';
  const safetyProfile = profile.safetyProfile ?? buildDevSafetyProfile(profile.exactAge ?? profile.age, ageBand, nowIso);
  return {
    ...profile,
    name: profile.name.trim() || 'Suvan',
    exactAge: profile.exactAge ?? profile.age ?? 60,
    referenceSex: profile.referenceSex ?? 'male',
    age: profile.exactAge ?? profile.age ?? 60,
    ageBand,
    goal: getLifeGoalDisplayText(lifeGoal) || normalizeLifeGoalDisplayText(profile.goal),
    lifeGoal,
    safetyProfile,
  };
}

function buildDevSafetyProfile(age: number | null, ageBand: AgeBand | null, nowIso: string): MovementSafetyProfile {
  return {
    id: 'dev-preview-safety-profile',
    userId: LOCAL_USER_ID,
    age: age ?? representativeAgeForAgeBand(ageBand) ?? 60,
    ageBand: ageBand ?? undefined,
    activityLevel: 'lightly_active',
    hasCurrentPain: false,
    hasRecentInjury: false,
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: ['chair', 'wall', 'stairs', 'resistance_band', 'floor_space'],
    movementCapabilities: {
      schemaVersion: 1,
      floorTransfer: { status: 'confirmed' },
      stepUpEnvironment: {
        status: 'confirmed',
        lowStableStep: true,
        fixedSupport: true,
        clearDryArea: true,
        phoneOutOfPath: true,
      },
      singleLegBalance: { status: 'confirmed_with_support' },
      revision: 1,
      updatedAt: nowIso,
    },
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function AuthLoadingScreen() {
  return (
    <View style={[styles.container, styles.splash]}>
      <StatusBar style="dark" />
      <View style={styles.splashBrandRow}>
        <HeaderLogo size={28} />
        <Text style={styles.splashBrand}>Hale</Text>
      </View>
      <Text style={styles.splashText}>Preparing your account...</Text>
    </View>
  );
}

function MovementProfileRetestUnavailableScreen({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Screen contentStyle={styles.cameraGateScreen}>
        <ScreenHeader
          eyebrow="Movement Check-Up"
          title="Your next Check-Up is coming soon"
          subtitle="Your current plan and progress are saved. The next guided Check-Up for this plan will be available in a later beta update."
        />
        <CameraGateSection title="For now" meta="Saved">
          <View style={styles.cameraGatePointList}>
            <CameraGatePoint
              index={1}
              title="Keep training"
              body="You can continue the 4-week plan that was prepared from your last Check-Up."
            />
            <CameraGatePoint
              index={2}
              title="No reset needed"
              body="Hale will keep your plan history intact until the next guided Check-Up is available."
            />
          </View>
        </CameraGateSection>
        <View style={styles.cameraGateActions}>
          <PrimaryButton title="Back to home" onPress={onDone} />
        </View>
      </Screen>
    </View>
  );
}

function CameraReadinessGate({
  permission,
  audioReady,
  onRequestPermission,
  onBack,
}: {
  permission: PermissionState;
  audioReady: boolean;
  onRequestPermission: () => void;
  onBack: () => void;
}) {
  const waiting = permission === 'checking' || !audioReady;
  const title = waiting ? 'Getting camera ready' : 'Allow camera access';
  const subtitle = waiting
    ? 'Hale is preparing the camera and voice guidance before the movement session begins.'
    : 'Camera access lets Hale estimate your movement while keeping the experience private and mirror-free.';

  const openSettings = React.useCallback(() => {
    void Linking.openSettings().catch(() => undefined);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Screen contentStyle={styles.cameraGateScreen}>
        {permission === 'denied' || permission === 'undetermined' ? (
          <BackArrowButton accessibilityLabel="Back" onPress={onBack} />
        ) : null}
        <ScreenHeader eyebrow="Camera access" title={title} subtitle={subtitle} />

        <CameraGateSection
          title={waiting ? 'Session readiness' : 'Camera permission'}
          meta={waiting ? 'Preparing' : 'Required'}
          tone={waiting ? 'neutral' : 'attention'}
        >
          <View style={styles.cameraGatePointList}>
            <CameraGatePoint
              index={1}
              title={waiting ? 'Camera and audio' : 'Measure movement'}
              body={
                waiting
                  ? 'Hale is checking that camera access and voice guidance are ready before the session opens.'
                  : 'Camera access lets Hale estimate your movement during guided check-ups and sessions.'
              }
            />
            <CameraGatePoint
              index={2}
              title="No mirror view"
              body="You see a clean outline, never a self-view camera feed."
            />
            <CameraGatePoint
              index={3}
              title="Video is never stored"
              body="The camera is used as a measuring instrument for the session."
            />
          </View>
        </CameraGateSection>

        {permission === 'denied' ? (
          <CameraGateSection title="Turn it on" meta="Settings">
            <View style={styles.cameraGatePointList}>
              <CameraGatePoint
                index={1}
                title="Open Settings"
                body="Use the button below to open this app’s settings."
              />
              <CameraGatePoint
                index={2}
                title="Allow Camera"
                body="Switch Camera on, then return to Hale to begin once you are framed."
              />
            </View>
          </CameraGateSection>
        ) : permission === 'undetermined' ? (
          <CameraGateSection title="Turn it on" meta="One tap">
            <View style={styles.cameraGatePointList}>
              <CameraGatePoint
                index={1}
                title="Allow Camera"
                body="Use the button below, then choose Allow when your phone asks."
              />
            </View>
          </CameraGateSection>
        ) : (
          <CameraGateSection title="Almost ready" meta="One moment">
            <View style={styles.cameraGatePointList}>
              <CameraGatePoint
                index={1}
                title="Hold nearby"
                body="This should only take a moment. Hale will continue automatically when everything is ready."
              />
            </View>
          </CameraGateSection>
        )}

        {permission === 'denied' ? (
          <View style={styles.cameraGateActions}>
            <PrimaryButton title="Open Settings" onPress={openSettings} />
          </View>
        ) : permission === 'undetermined' ? (
          <View style={styles.cameraGateActions}>
            <PrimaryButton title="Allow camera access" onPress={onRequestPermission} />
          </View>
        ) : null}
      </Screen>
    </View>
  );
}

function CameraGateSection({
  title,
  meta,
  tone = 'neutral',
  children,
}: {
  title: string;
  meta: string;
  tone?: 'neutral' | 'attention';
  children: React.ReactNode;
}) {
  return (
    <View style={styles.cameraGateSectionCard}>
      <View style={styles.cameraGateSectionHeader}>
        <Text style={styles.cameraGateSectionTitle}>{title}</Text>
        <View
          style={[
            styles.cameraGateSectionMetaPill,
            tone === 'attention' && styles.cameraGateSectionMetaPillAttention,
          ]}
        >
          <Text style={styles.cameraGateSectionMetaText}>{meta}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function CameraGatePoint({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <View style={styles.cameraGatePoint}>
      <View style={styles.cameraGatePointMark}>
        <Text style={styles.cameraGatePointMarkText}>{index}</Text>
      </View>
      <View style={styles.cameraGatePointCopy}>
        <Text style={styles.cameraGatePointTitle}>{title}</Text>
        <Text style={styles.cameraGatePointBody}>{body}</Text>
      </View>
    </View>
  );
}

function legacyEquipmentKeyToCapability(
  key: keyof EquipmentProfile
): Exclude<AvailableEquipment, 'none'> {
  if (key === 'stair') return 'stairs';
  if (key === 'band') return 'resistance_band';
  if (key === 'miniBand') return 'mini_band';
  return 'backpack';
}

const styles = StyleSheet.create({
  appChrome: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  appChromeContent: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  statusBarSafeAreaStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: colors.bgBase,
  },
  statusBarAndroidStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: colors.bgBase,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  splash: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.pageHorizontal,
  },
  splashBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  splashBrand: {
    color: colors.accentDeep,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
    letterSpacing: 0,
    textAlign: 'center',
    includeFontPadding: false,
  },
  splashText: {
    width: '100%',
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: spacing.sm,
    textAlign: 'center',
    includeFontPadding: false,
  },
  cameraGateScreen: {
    gap: spacing.xl,
    paddingBottom: spacing.huge,
  },
  cameraGateSectionCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  cameraGateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  cameraGateSectionTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  cameraGateSectionMetaPill: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  cameraGateSectionMetaPillAttention: {
    backgroundColor: colors.bgGold,
  },
  cameraGateSectionMetaText: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    lineHeight: 16,
  },
  cameraGatePointList: {
    gap: spacing.sm,
  },
  cameraGatePoint: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
  },
  cameraGatePointMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
  },
  cameraGatePointMarkText: {
    ...type.cardCaption,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  cameraGatePointCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cameraGatePointTitle: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  cameraGatePointBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  cameraGateActions: {
    gap: spacing.md,
  },
  tabContent: {
    flex: 1,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  text: {
    ...type.body,
    textAlign: 'center',
  },
  back: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.button,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  backText: {
    ...type.bodySmall,
    color: colors.accentDeep,
  },
});
