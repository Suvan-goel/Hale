/**
 * Domain scoring: a Movement Check-Up → three domain results expressed as
 * "typical of age X–Y" ranges. No composite score (CLAUDE.md product law 4 —
 * domain ages lead, any composite is garnish, and we keep none in V1).
 *
 * Domain → primary age-mapped metric (others are shown as supporting detail):
 *   Strength & Power → chair-stand reps   (Rikli & Jones norm)
 *   Balance          → single-leg hold    (Bohannon norm); TUG remains a
 *                      historical supporting row when older check-ups have it
 *   Mobility         → shoulder flexion    (estimated norm) + forward reach
 *
 * Rise velocity and forward-reach are body-unit trend metrics with no
 * published age norm; they appear as detail rows, never as an age claim.
 * Every value is presented as a range and flagged when the underlying norm is
 * estimated or extrapolated. Wellness-side language only — never a diagnosis.
 */

import { CheckUp } from '../checkup/types';
import { AgeNorm, CHAIR_STAND_REPS_NORM, inferAge, SHOULDER_FLEXION_NORM, SINGLE_LEG_STANCE_NORM } from './norms';
import {
  ScoringInputIssue,
  ValidatedScoringInputs,
  validateCheckUpForScoring,
} from './scoringInputValidation';

export type Domain = 'strength' | 'balance' | 'mobility';

export const DOMAIN_LABEL: Record<Domain, string> = {
  strength: 'Strength & Power',
  balance: 'Balance',
  mobility: 'Mobility',
};

export interface MetricRow {
  label: string;
  display: string;
  measured: boolean;
}

export interface DomainResult {
  domain: Domain;
  label: string;
  measured: boolean;
  /** Inferred movement-age range (inclusive years); NaN bounds when unmeasured. */
  ageLow: number;
  ageHigh: number;
  /** The range rests on an estimated/extrapolated norm. */
  estimated: boolean;
  interpretation: string;
  rows: MetricRow[];
}

export interface CheckUpScore {
  startedAt: string;
  domains: DomainResult[];
  /** Oldest measured domain (the training target); null if nothing measured. */
  weakestDomain: Domain | null;
}

export interface CheckUpScoreWithDiagnostics {
  score: CheckUpScore;
  issues: ScoringInputIssue[];
}

const NO_VALUE = '—';

/** "early 60s" / "mid 50s" / "late 70s". */
export function ageToPhrase(age: number): string {
  const decade = Math.floor(age / 10) * 10;
  const within = age - decade;
  const part = within < 3.34 ? 'early' : within < 6.67 ? 'mid' : 'late';
  return `${part} ${decade}s`;
}

const DOMAIN_NOUN: Record<Domain, string> = {
  strength: 'leg strength and power',
  balance: 'balance and walking',
  mobility: 'shoulder and trunk mobility',
};

interface AgeMapping {
  ageLow: number;
  ageHigh: number;
  estimated: boolean;
  interpretation: string;
}

function mapAge(domain: Domain, norm: AgeNorm, value: number): AgeMapping {
  const est = inferAge(norm, value);
  const band = est.estimated ? 6 : 4;
  const ageLow = Math.max(18, Math.round(est.age - band));
  const ageHigh = Math.round(est.age + band);
  const noun = DOMAIN_NOUN[domain];
  const tail = est.estimated ? ' This range is an estimate.' : '';
  let interpretation: string;
  if (est.ceiling) {
    interpretation = `Your ${noun} is about as good as this check-up can measure — typical of a younger adult.${tail}`;
  } else {
    interpretation = `Your ${noun} looks typical for someone in their ${ageToPhrase(est.age)}.${tail}`;
  }
  return { ageLow, ageHigh, estimated: est.estimated, interpretation };
}

function unmeasured(domain: Domain, rows: MetricRow[]): DomainResult {
  return {
    domain,
    label: DOMAIN_LABEL[domain],
    measured: false,
    ageLow: NaN,
    ageHigh: NaN,
    estimated: false,
    interpretation: 'Not measured this time. You can complete this part on your next check-up.',
    rows,
  };
}

function measuredDomain(domain: Domain, m: AgeMapping, rows: MetricRow[]): DomainResult {
  const result: DomainResult = {
    domain,
    label: DOMAIN_LABEL[domain],
    measured: true,
    ...m,
    rows,
  };
  if (!domainResultIsSafe(result)) return unmeasured(domain, rows);
  return result;
}

function domainResultIsSafe(result: DomainResult): boolean {
  return (
    result.measured &&
    Number.isFinite(result.ageLow) &&
    Number.isFinite(result.ageHigh) &&
    result.ageLow <= result.ageHigh
  );
}

function strengthDomain(inputs: ValidatedScoringInputs): DomainResult {
  const cs = inputs.chairStand;
  const sessionMeanVel = cs?.sessionMeanVel;
  const hasSessionMeanVel = typeof sessionMeanVel === 'number' && Number.isFinite(sessionMeanVel);
  const rows: MetricRow[] = [
    {
      label: 'Chair stands in 30s',
      display: cs ? `${cs.reps} reps` : NO_VALUE,
      measured: !!cs,
    },
    {
      label: 'Rise velocity',
      display: hasSessionMeanVel ? `${sessionMeanVel.toFixed(2)} bu/s` : NO_VALUE,
      measured: hasSessionMeanVel,
    },
  ];
  if (!cs) return unmeasured('strength', rows);
  const m = mapAge('strength', CHAIR_STAND_REPS_NORM, cs.reps);
  return measuredDomain('strength', m, rows);
}

function balanceDomain(inputs: ValidatedScoringInputs): DomainResult {
  const tug = inputs.tug;
  const bal = inputs.balanceLadder;
  const slSec = bal ? bal.singleLegEyesOpenSec : NaN;
  const rows: MetricRow[] = [
    {
      label: 'Up-and-go time',
      display:
        tug
          ? `${tug.totalSec.toFixed(1)} s${tug.nonStandardShortPath ? ' (short path)' : ''}`
          : NO_VALUE,
      measured: !!tug,
    },
    {
      label: 'One-leg balance',
      display: Number.isFinite(slSec) ? `${Math.round(slSec)} s` : NO_VALUE,
      measured: Number.isFinite(slSec),
    },
  ];
  if (!Number.isFinite(slSec)) return unmeasured('balance', rows);
  const m = mapAge('balance', SINGLE_LEG_STANCE_NORM, slSec);
  let interpretation = m.interpretation;
  if (slSec < 8) {
    interpretation += ' Holding a one-leg stand was tricky — a good thing to practise.';
  }
  return measuredDomain('balance', { ...m, interpretation }, rows);
}

function mobilityDomain(inputs: ValidatedScoringInputs): DomainResult {
  const sh = inputs.shoulderFlexion;
  const hinge = inputs.hingeReach;
  const rows: MetricRow[] = [
    {
      label: 'Shoulder reach',
      display: sh && Number.isFinite(sh.peakFlexionDeg) ? `${Math.round(sh.peakFlexionDeg)}°` : NO_VALUE,
      measured: !!sh && Number.isFinite(sh.peakFlexionDeg),
    },
    {
      label: 'Forward reach to floor',
      display: hinge && Number.isFinite(hinge.reachBu) ? `${hinge.reachBu.toFixed(2)} bu` : NO_VALUE,
      measured: !!hinge && Number.isFinite(hinge.reachBu),
    },
  ];
  if (!sh) return unmeasured('mobility', rows);
  const m = mapAge('mobility', SHOULDER_FLEXION_NORM, sh.peakFlexionDeg);
  return measuredDomain('mobility', m, rows);
}

export function scoreCheckUpWithDiagnostics(checkUp: CheckUp): CheckUpScoreWithDiagnostics {
  const inputs = validateCheckUpForScoring(checkUp);
  const domains = [strengthDomain(inputs), balanceDomain(inputs), mobilityDomain(inputs)];
  // Weakest = oldest measured domain (highest range midpoint).
  let weakestDomain: Domain | null = null;
  let oldest = -Infinity;
  for (const d of domains) {
    if (!domainResultIsSafe(d)) continue;
    const mid = (d.ageLow + d.ageHigh) / 2;
    if (mid > oldest) {
      oldest = mid;
      weakestDomain = d.domain;
    }
  }
  return {
    score: { startedAt: inputs.startedAt, domains, weakestDomain },
    issues: inputs.issues,
  };
}

export function scoreCheckUp(checkUp: CheckUp): CheckUpScore {
  return scoreCheckUpWithDiagnostics(checkUp).score;
}
