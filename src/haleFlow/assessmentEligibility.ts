import type { MovementAssessment, MovementDomain } from '../adherence/types';
import type { CheckUpScore, Domain } from '../scoring';

export type BlockCreationIneligibilityReason =
  | 'assessment_not_completed'
  | 'no_measured_domains'
  | 'missing_focus_domain'
  | 'invalid_focus_measurement'
  | 'inconsistent_assessment';

export type BlockCreationEligibility =
  | {
      eligible: true;
      focusDomain: MovementDomain;
      measuredDomains: MovementDomain[];
    }
  | {
      eligible: false;
      reason: BlockCreationIneligibilityReason;
      measuredDomains: MovementDomain[];
    };

export interface BlockCreationEligibilityInput {
  score?: CheckUpScore | null;
  assessment?: MovementAssessment | null;
}

export function getBlockCreationEligibility({
  score,
  assessment,
}: BlockCreationEligibilityInput): BlockCreationEligibility {
  const scoreEvidence = score ? evidenceFromScore(score) : null;
  const assessmentEvidence = assessment ? evidenceFromAssessment(assessment) : null;
  const evidence = scoreEvidence ?? assessmentEvidence ?? {
    focusDomain: null,
    focusMeasured: false,
    measuredDomains: [],
  };

  if (assessment && assessment.status !== 'completed') {
    return ineligible('assessment_not_completed', evidence.measuredDomains);
  }
  if (evidence.measuredDomains.length === 0) {
    return ineligible('no_measured_domains', evidence.measuredDomains);
  }
  if (!evidence.focusDomain) {
    return ineligible('missing_focus_domain', evidence.measuredDomains);
  }
  if (!evidence.focusMeasured) {
    return ineligible('invalid_focus_measurement', evidence.measuredDomains);
  }
  if (scoreEvidence && assessment && assessmentEvidence && evidenceDisagrees(scoreEvidence, assessmentEvidence, assessment)) {
    return ineligible('inconsistent_assessment', scoreEvidence.measuredDomains);
  }
  if (scoreEvidence && assessment && !assessmentEvidence) {
    return ineligible('inconsistent_assessment', scoreEvidence.measuredDomains);
  }

  return {
    eligible: true,
    focusDomain: evidence.focusDomain,
    measuredDomains: evidence.measuredDomains,
  };
}

export function isMovementAssessmentUsableForTraining(assessment: MovementAssessment): boolean {
  return getBlockCreationEligibility({ assessment }).eligible;
}

export function measuredMovementDomainsFromScore(score: CheckUpScore | null | undefined): MovementDomain[] {
  return score ? evidenceFromScore(score).measuredDomains : [];
}

export function movementDomainFromScoreDomainStrict(domain: unknown): MovementDomain | null {
  if (domain === 'strength' || domain === 'strength_power') return 'strength_power';
  if (domain === 'balance') return 'balance';
  if (domain === 'mobility') return 'mobility';
  return null;
}

function ineligible(
  reason: BlockCreationIneligibilityReason,
  measuredDomains: MovementDomain[]
): BlockCreationEligibility {
  return { eligible: false, reason, measuredDomains };
}

interface Evidence {
  focusDomain: MovementDomain | null;
  focusMeasured: boolean;
  measuredDomains: MovementDomain[];
}

function evidenceFromScore(score: CheckUpScore): Evidence {
  const focusDomain = movementDomainFromScoreDomainStrict(score.weakestDomain);
  const measuredDomains = uniqueDomains(
    score.domains
      .filter((domain) => domain.measured && Number.isFinite(domain.ageLow) && Number.isFinite(domain.ageHigh))
      .map((domain) => movementDomainFromScoreDomainStrict(domain.domain))
      .filter((domain): domain is MovementDomain => !!domain)
  );
  const focusResult = focusDomain
    ? score.domains.find((domain) => movementDomainFromScoreDomainStrict(domain.domain) === focusDomain)
    : undefined;

  return {
    focusDomain,
    measuredDomains,
    focusMeasured:
      !!focusResult &&
      focusResult.measured &&
      Number.isFinite(focusResult.ageLow) &&
      Number.isFinite(focusResult.ageHigh),
  };
}

function evidenceFromAssessment(assessment: MovementAssessment): Evidence | null {
  if (!assessment.results) return null;
  const focusDomain = movementDomainFromScoreDomainStrict(assessment.results.weakestDomain);
  const measuredDomains = uniqueDomains(
    ([
      ['strength_power', assessment.results.strengthPowerScore],
      ['balance', assessment.results.balanceScore],
      ['mobility', assessment.results.mobilityScore],
    ] as const)
      .filter(([, value]) => Number.isFinite(value))
      .map(([domain]) => domain)
  );

  return {
    focusDomain,
    measuredDomains,
    focusMeasured: focusDomain ? Number.isFinite(scoreForAssessmentDomain(assessment, focusDomain)) : false,
  };
}

function evidenceDisagrees(score: Evidence, assessment: Evidence, sourceAssessment: MovementAssessment): boolean {
  if (score.focusDomain !== assessment.focusDomain) return true;
  if (!sameDomains(score.measuredDomains, assessment.measuredDomains)) return true;
  const measuredDomains = sourceAssessment.results?.rawMetrics?.measuredDomains;
  return typeof measuredDomains === 'number' && measuredDomains !== score.measuredDomains.length;
}

function scoreForAssessmentDomain(
  assessment: MovementAssessment,
  domain: MovementDomain
): number | undefined {
  if (domain === 'strength_power') return assessment.results?.strengthPowerScore;
  if (domain === 'balance') return assessment.results?.balanceScore;
  return assessment.results?.mobilityScore;
}

function uniqueDomains(domains: MovementDomain[]): MovementDomain[] {
  const out: MovementDomain[] = [];
  for (const domain of domains) {
    if (!out.includes(domain)) out.push(domain);
  }
  return out;
}

function sameDomains(a: MovementDomain[], b: MovementDomain[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((domain) => b.includes(domain));
}
