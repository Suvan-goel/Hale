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
} from './scoring';
export type { CheckUpScore, Domain, DomainResult, MetricRow } from './scoring';
