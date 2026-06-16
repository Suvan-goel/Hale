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

import { CheckUp, CheckUpItem, findItem } from '../checkup/types';
import {
  BALANCE_LADDER_ID,
  BalanceResult,
  CHAIR_STAND_ID,
  ChairStandResult,
  HINGE_REACH_ID,
  HingeReachResult,
  SHOULDER_FLEXION_ID,
  ShoulderFlexionResult,
  TUG_ID,
  TugResult,
} from '../movements';
import { AgeNorm, CHAIR_STAND_REPS_NORM, inferAge, SHOULDER_FLEXION_NORM, SINGLE_LEG_STANCE_NORM } from './norms';

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

const NO_VALUE = '—';

function usableResult<T>(item: CheckUpItem | undefined): T | null {
  if (!item || item.status !== 'measured' || !item.result) return null;
  if (item.result.flags.includes('no-measurement')) return null;
  return item.result as unknown as T;
}

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

function strengthDomain(checkUp: CheckUp): DomainResult {
  const cs = usableResult<ChairStandResult>(findItem(checkUp, CHAIR_STAND_ID));
  const rows: MetricRow[] = [
    {
      label: 'Chair stands in 30s',
      display: cs ? `${cs.reps} reps` : NO_VALUE,
      measured: !!cs,
    },
    {
      label: 'Rise velocity',
      display: cs && Number.isFinite(cs.sessionMeanVel) ? `${cs.sessionMeanVel.toFixed(2)} bu/s` : NO_VALUE,
      measured: !!cs && Number.isFinite(cs.sessionMeanVel),
    },
  ];
  if (!cs || cs.reps <= 0) return unmeasured('strength', rows);
  const m = mapAge('strength', CHAIR_STAND_REPS_NORM, cs.reps);
  return { domain: 'strength', label: DOMAIN_LABEL.strength, measured: true, ...m, rows };
}

function balanceDomain(checkUp: CheckUp): DomainResult {
  const tug = usableResult<TugResult>(findItem(checkUp, TUG_ID));
  const bal = usableResult<BalanceResult>(findItem(checkUp, BALANCE_LADDER_ID));
  const slSec = bal ? bal.singleLegEyesOpenSec : NaN;
  const rows: MetricRow[] = [
    {
      label: 'Up-and-go time',
      display:
        tug && tug.completed && Number.isFinite(tug.totalSec)
          ? `${tug.totalSec.toFixed(1)} s${tug.nonStandardShortPath ? ' (short path)' : ''}`
          : NO_VALUE,
      measured: !!tug && tug.completed,
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
  if (Number.isFinite(slSec) && slSec < 8) {
    interpretation += ' Holding a one-leg stand was tricky — a good thing to practise.';
  }
  return { domain: 'balance', label: DOMAIN_LABEL.balance, measured: true, ...m, interpretation, rows };
}

function mobilityDomain(checkUp: CheckUp): DomainResult {
  const sh = usableResult<ShoulderFlexionResult>(findItem(checkUp, SHOULDER_FLEXION_ID));
  const hinge = usableResult<HingeReachResult>(findItem(checkUp, HINGE_REACH_ID));
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
  if (!sh || !Number.isFinite(sh.peakFlexionDeg)) return unmeasured('mobility', rows);
  const m = mapAge('mobility', SHOULDER_FLEXION_NORM, sh.peakFlexionDeg);
  return { domain: 'mobility', label: DOMAIN_LABEL.mobility, measured: true, ...m, rows };
}

export function scoreCheckUp(checkUp: CheckUp): CheckUpScore {
  const domains = [strengthDomain(checkUp), balanceDomain(checkUp), mobilityDomain(checkUp)];
  // Weakest = oldest measured domain (highest range midpoint).
  let weakestDomain: Domain | null = null;
  let oldest = -Infinity;
  for (const d of domains) {
    if (!d.measured) continue;
    const mid = (d.ageLow + d.ageHigh) / 2;
    if (mid > oldest) {
      oldest = mid;
      weakestDomain = d.domain;
    }
  }
  return { startedAt: checkUp.startedAt, domains, weakestDomain };
}
