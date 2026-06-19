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
