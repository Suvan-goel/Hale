/**
 * Programme state (de)serialization — schema-versioned from day one, with
 * the repo's defensive-parse discipline: any malformed or foreign field falls
 * back to its default so a bad file degrades to a fresh (conservative) state
 * rather than crashing. Pure — no native imports, fully unit-testable.
 *
 * LOCAL-ONLY BY RULING (2026-07-06, ambiguity 6): this state contains
 * special-category health flags and is never included in Supabase backup
 * shapes — pinned by programmeLocalOnly.test.ts. Sync, if ever wanted, is
 * its own feature behind its own consent + encryption review.
 */

import type { ActivityLevel } from '../adherence';
import { clampLevel, freshPatternLadderState } from './promotion';
import { programmePolicyFingerprint } from './policy';
import {
  PROGRAMME_PATTERNS,
  type AssessmentStatus,
  type EffortAnswer,
  type FinisherState,
  type GatewayProgress,
  type JointFlag,
  type PatternLadderState,
  type PelvicRouting,
  type ProgrammePattern,
  type ProgrammeProfile,
  type ProgrammeState,
  type Weekday,
} from './types';

export const PROGRAMME_STATE_SCHEMA_VERSION = 1;

const ACTIVITY_LEVELS: readonly ActivityLevel[] = [
  'very_inactive',
  'lightly_active',
  'moderately_active',
  'very_active',
];
const ASSESSMENT_STATUSES: readonly AssessmentStatus[] = ['done', 'deferred', 'skipped', 'bypassed_b1'];
const EFFORT_ANSWERS: readonly EffortAnswer[] = ['none', 'a_few', 'lots'];
const JOINT_FLAGS: readonly JointFlag[] = ['knee', 'hip', 'shoulder', 'wrist', 'low_back'];
const WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Conservative defaults: unanswered always routes to the safe side. */
export function defaultProgrammeProfile(): ProgrammeProfile {
  return {
    consentHealthData: false,
    activityLevel: null,
    gentleStartActive: false,
    gpConfirmed: false,
    pelvicRouting: 'none',
    quietMode: false,
    jointFlags: [],
    balanceSupportDefault: false,
    hasStairs: null,
    hasBand: null,
    diastasisFlag: false,
    placement: {},
    assessmentStatus: null,
    lastAssessmentAtIso: null,
    chosenDays: [],
    firstSessionStarted: false,
    oneTimeSurfacesShown: [],
  };
}

export function defaultProgrammeState(): ProgrammeState {
  const ladders = {} as Record<ProgrammePattern, PatternLadderState>;
  for (const pattern of PROGRAMME_PATTERNS) {
    ladders[pattern] = freshPatternLadderState(pattern, 1);
  }
  return {
    profile: defaultProgrammeProfile(),
    ladders,
    finisher: { track: 'quiet_power', completedSessions: 0, currentContacts: 20 },
    onboardingCompletedAtIso: null,
    completedSessionCount: 0,
    lastSessionAtIso: null,
    lastSessionEffort: null,
    inactivityRegressionAppliedForGapEndingAtIso: null,
    policyFingerprint: programmePolicyFingerprint(),
  };
}

export function serializeProgrammeState(state: ProgrammeState): string {
  return JSON.stringify({ schemaVersion: PROGRAMME_STATE_SCHEMA_VERSION, ...state });
}

export function deserializeProgrammeState(json: string): ProgrammeState | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  return {
    profile: validProfile(obj.profile),
    ladders: validLadders(obj.ladders),
    finisher: validFinisher(obj.finisher),
    onboardingCompletedAtIso: isoOrNull(obj.onboardingCompletedAtIso),
    completedSessionCount: nonNegativeInt(obj.completedSessionCount),
    lastSessionAtIso: isoOrNull(obj.lastSessionAtIso),
    lastSessionEffort: oneOf(obj.lastSessionEffort, EFFORT_ANSWERS) ?? null,
    inactivityRegressionAppliedForGapEndingAtIso: isoOrNull(
      obj.inactivityRegressionAppliedForGapEndingAtIso
    ),
    policyFingerprint:
      typeof obj.policyFingerprint === 'string' ? obj.policyFingerprint : '',
  };
}

function validProfile(v: unknown): ProgrammeProfile {
  const def = defaultProgrammeProfile();
  if (typeof v !== 'object' || v === null) return def;
  const p = v as Partial<ProgrammeProfile>;
  return {
    consentHealthData: p.consentHealthData === true,
    activityLevel: oneOf(p.activityLevel, ACTIVITY_LEVELS) ?? null,
    gentleStartActive: p.gentleStartActive === true,
    gpConfirmed: p.gpConfirmed === true,
    pelvicRouting: (oneOf(p.pelvicRouting, ['none', 'low_impact'] as const) ??
      'none') as PelvicRouting,
    quietMode: p.quietMode === true,
    jointFlags: stringSubset(p.jointFlags, JOINT_FLAGS),
    balanceSupportDefault: p.balanceSupportDefault === true,
    hasStairs: typeof p.hasStairs === 'boolean' ? p.hasStairs : null,
    hasBand: typeof p.hasBand === 'boolean' ? p.hasBand : null,
    diastasisFlag: p.diastasisFlag === true,
    placement: validPlacement(p.placement),
    assessmentStatus: oneOf(p.assessmentStatus, ASSESSMENT_STATUSES) ?? null,
    lastAssessmentAtIso: isoOrNull(p.lastAssessmentAtIso),
    chosenDays: stringSubset(p.chosenDays, WEEKDAYS),
    firstSessionStarted: p.firstSessionStarted === true,
    oneTimeSurfacesShown: Array.isArray(p.oneTimeSurfacesShown)
      ? p.oneTimeSurfacesShown.filter((v): v is string => typeof v === 'string')
      : [],
  };
}

function validPlacement(v: unknown): Partial<Record<ProgrammePattern, number>> {
  if (typeof v !== 'object' || v === null) return {};
  const out: Partial<Record<ProgrammePattern, number>> = {};
  for (const pattern of PROGRAMME_PATTERNS) {
    const value = (v as Record<string, unknown>)[pattern];
    if (typeof value === 'number' && Number.isFinite(value)) {
      out[pattern] = clampLevel(pattern, value);
    }
  }
  return out;
}

function validLadders(v: unknown): Record<ProgrammePattern, PatternLadderState> {
  const out = {} as Record<ProgrammePattern, PatternLadderState>;
  const source = typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  for (const pattern of PROGRAMME_PATTERNS) {
    out[pattern] = validLadderState(pattern, source[pattern]);
  }
  return out;
}

function validLadderState(pattern: ProgrammePattern, v: unknown): PatternLadderState {
  const def = freshPatternLadderState(pattern, 1);
  if (typeof v !== 'object' || v === null) return def;
  const s = v as Partial<PatternLadderState>;
  return {
    pattern,
    currentLevel:
      typeof s.currentLevel === 'number' && Number.isFinite(s.currentLevel)
        ? clampLevel(pattern, s.currentLevel)
        : def.currentLevel,
    consecutiveTopSessions: nonNegativeInt(s.consecutiveTopSessions),
    consecutiveBottomNoneSessions: nonNegativeInt(s.consecutiveBottomNoneSessions),
    recentPainFlags: Array.isArray(s.recentPainFlags)
      ? s.recentPainFlags.filter((f): f is boolean => typeof f === 'boolean').slice(-2)
      : [],
    lastPainFreeLevel:
      typeof s.lastPainFreeLevel === 'number' && Number.isFinite(s.lastPainFreeLevel)
        ? clampLevel(pattern, s.lastPainFreeLevel)
        : null,
    gatewayProgress: validGatewayProgress(s.gatewayProgress),
    bonusSetSuspended: s.bonusSetSuspended === true,
    currentRepTarget:
      typeof s.currentRepTarget === 'number' && Number.isFinite(s.currentRepTarget)
        ? s.currentRepTarget
        : null,
    lastPerformedAtIso: isoOrNull(s.lastPerformedAtIso),
  };
}

function validGatewayProgress(v: unknown): Record<number, GatewayProgress> {
  if (typeof v !== 'object' || v === null) return {};
  const out: Record<number, GatewayProgress> = {};
  for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1) continue;
    if (typeof value !== 'object' || value === null) continue;
    const p = value as Partial<GatewayProgress>;
    out[level] = {
      demoWatched: p.demoWatched === true,
      rehearsalExposures: nonNegativeInt(p.rehearsalExposures),
      selfConfirmed: p.selfConfirmed === true,
    };
  }
  return out;
}

function validFinisher(v: unknown): FinisherState {
  const def: FinisherState = { track: 'quiet_power', completedSessions: 0, currentContacts: 20 };
  if (typeof v !== 'object' || v === null) return def;
  const f = v as Partial<FinisherState>;
  return {
    track: 'quiet_power',
    completedSessions: nonNegativeInt(f.completedSessions),
    currentContacts:
      typeof f.currentContacts === 'number' && Number.isFinite(f.currentContacts)
        ? Math.min(Math.max(20, Math.round(f.currentContacts)), 50)
        : def.currentContacts,
  };
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function stringSubset<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    if (typeof item === 'string' && (allowed as readonly string[]).includes(item) && !out.includes(item as T)) {
      out.push(item as T);
    }
  }
  return out;
}

function nonNegativeInt(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

function isoOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
