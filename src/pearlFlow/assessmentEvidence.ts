import type { CheckupStatus, CheckupType, MovementAssessment, MovementDomain } from '../adherence/types';
import type { CheckUpScore, Domain } from '../scoring';

export const HEADLINE_MOVEMENT_DOMAINS: readonly MovementDomain[] = ['strength_power', 'balance', 'mobility'];

export interface HeadlineEvidence {
  measuredDomains: MovementDomain[];
  missingDomains: MovementDomain[];
  measuredDomainCount: number;
  complete: boolean;
}

export function headlineEvidenceFromScore(score: CheckUpScore | null | undefined): HeadlineEvidence {
  const measured = new Set<MovementDomain>();
  if (score && Array.isArray(score.domains)) {
    for (const domain of score.domains) {
      const mapped = movementDomainFromScoreDomainStrict(domain?.domain);
      if (!mapped) continue;
      if (domain.measured && Number.isFinite(domain.ageLow) && Number.isFinite(domain.ageHigh)) {
        measured.add(mapped);
      }
    }
  }
  return evidenceFromMeasuredDomains(Array.from(measured));
}

export function headlineEvidenceFromAssessment(
  assessment: MovementAssessment | null | undefined
): HeadlineEvidence {
  const results = assessment?.results;
  if (!results) return evidenceFromMeasuredDomains([]);
  const measured: MovementDomain[] = [];
  if (Number.isFinite(results.strengthPowerScore)) measured.push('strength_power');
  if (Number.isFinite(results.balanceScore)) measured.push('balance');
  if (Number.isFinite(results.mobilityScore)) measured.push('mobility');
  return evidenceFromMeasuredDomains(measured);
}

export function evidenceFromMeasuredDomains(domains: readonly MovementDomain[]): HeadlineEvidence {
  const measuredDomains = HEADLINE_MOVEMENT_DOMAINS.filter((domain) => domains.includes(domain));
  const missingDomains = HEADLINE_MOVEMENT_DOMAINS.filter((domain) => !measuredDomains.includes(domain));
  return {
    measuredDomains,
    missingDomains,
    measuredDomainCount: measuredDomains.length,
    complete: missingDomains.length === 0,
  };
}

export function confidenceFromHeadlineEvidence(evidence: HeadlineEvidence): 'low' | 'medium' | 'high' {
  if (evidence.complete) return 'high';
  if (evidence.measuredDomainCount > 0) return 'medium';
  return 'low';
}

export function checkupStatusFromHeadlineEvidence(evidence: HeadlineEvidence): CheckupStatus {
  if (evidence.complete) return 'completed';
  if (evidence.measuredDomainCount > 0) return 'incomplete';
  return 'invalid';
}

export function isOfficialCheckupType(type: CheckupType | string | null | undefined): boolean {
  return type === 'baseline' || type === 'baseline_retake' || type === 'official_retest';
}

export function isExtraCheckupType(type: CheckupType | string | null | undefined): boolean {
  return type === 'manual_extra' || type === 'quick_recheck' || type === 'micro_check' || type === 'legacy_unknown';
}

export function movementDomainFromScoreDomainStrict(domain: unknown): MovementDomain | null {
  if (domain === 'strength' || domain === 'strength_power') return 'strength_power';
  if (domain === 'balance') return 'balance';
  if (domain === 'mobility') return 'mobility';
  return null;
}

export function scoreDomainFromMovementDomainStrict(domain: MovementDomain): Domain {
  return domain === 'strength_power' ? 'strength' : domain;
}

