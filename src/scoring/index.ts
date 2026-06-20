/**
 * Norms + domain scoring entry point. Screens and history import from here.
 */

export {
  CHAIR_STAND_REPS_NORM,
  SHOULDER_FLEXION_NORM,
  TUG_SECONDS_NORM,
  inferAge,
} from './norms';
export type { AgeEstimate, AgeNorm } from './norms';
export {
  DOMAIN_LABEL,
  ageToPhrase,
  scoreCheckUp,
  scoreCheckUpWithDiagnostics,
} from './scoring';
export type { CheckUpScore, CheckUpScoreWithDiagnostics, Domain, DomainResult, MetricRow } from './scoring';
export {
  FOCUS_SELECTION_POLICY_VERSION,
  INTERIM_NEAR_TIE_MARGIN_YEARS,
  SCORE_DOMAIN_ORDER,
  applyFocusSelectionToScore,
  focusSelectionFromUnknown,
  focusSelectionMatchesScore,
  focusSelectionsEqual,
  isScoreDomain,
  isTieBreakReason,
  selectFocusFromDomainResults,
  selectFocusFromScore,
} from './focusSelection';
export type {
  FocusSelectionContext,
  FocusSelectionKind,
  FocusTieBreakReason,
  ScoreFocusSelection,
} from './focusSelection';
export {
  classifyStoredScoreSnapshot,
  compareScoreSnapshots,
  createCurrentVersionedScoreSnapshot,
  isCurrentScoreSnapshot,
  parseStoredScoreSnapshot,
  scoreSnapshotMatchesScore,
  scoreSnapshotVersionMetadata,
  toStoredScoreSnapshot,
} from './scoreSnapshot';
export type {
  CurrentVersionedScoreResult,
  JsonSafeCheckUpScore,
  JsonSafeDomainResult,
  JsonSafeMetricRow,
  ParsedScoreSnapshot,
  ScoreSnapshotCompatibility,
  ScoreSnapshotPairCompatibility,
  ScoreSnapshotVersionMetadata,
  VersionedCheckUpScoreSnapshot,
} from './scoreSnapshot';
export {
  BALANCE_SINGLE_LEG_EYES_OPEN_MAX_SEC_FOR_SCORING,
  CHAIR_STAND_MAX_REPS_FOR_SCORING,
  validateCheckUpForScoring,
} from './scoringInputValidation';
export type {
  ScoringInputIssue,
  ScoringInputIssueCode,
  ScoringMovementId,
  ValidatedScoringInputs,
} from './scoringInputValidation';
export {
  CURRENT_NORM_VERSION,
  CURRENT_SCORING_VERSION,
  SCORE_SNAPSHOT_SCHEMA_VERSION,
  isPositiveIntegerVersion,
} from './versions';
