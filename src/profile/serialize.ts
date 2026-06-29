/**
 * Preferences (de)serialization with a schema-version field from day one
 * (CLAUDE.md data rule). Parsing is defensive: any malformed or foreign field
 * falls back to its default, so a bad file degrades to a fresh profile rather
 * than crashing the app. Pure — no native imports, fully unit-testable.
 */

import { LIFE_GOAL_CATEGORIES, normalizeLifeGoalDisplayText } from '../adherence';
import type { ActivityLevel, LifeGoal, MovementSafetyProfile } from '../adherence';
import { AppSettings, EMPTY_PROFILE, OnboardingState, OnboardingStep, Preferences, ProfileReferenceSex, UserProfile } from './types';
import {
  ageBandForAge,
  ageFromDateOfBirth,
  isAgeBand,
  normalizeDateOfBirth,
  representativeAgeForAgeBand,
} from './age';
import { isCanonicalEquipmentStatus, normalizeAvailableEquipmentForPersistence } from './equipment';
import { movementCapabilityProfileForPersistence } from './movementCapabilities';
import { DEFAULT_VOICE_ID, VOICE_OPTIONS } from './voices';

export const PREFERENCES_SCHEMA_VERSION = 8;

const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'life_goal',
  'safety_profile',
  'equipment',
  'camera_explanation',
  'camera_setup',
  'baseline_checkup',
  'results',
  'create_block',
  'complete',
];

export function defaultPreferences(): Preferences {
  return {
    profile: { ...EMPTY_PROFILE },
    settings: {
      voiceId: DEFAULT_VOICE_ID,
      remindersEnabled: false,
      phoneStandAvailable: false,
      supportSharingLevel: 'private',
      devMockDataEnabled: false,
    },
    onboarding: defaultOnboardingState(),
  };
}

export function serializePreferences(prefs: Preferences): string {
  return JSON.stringify({ schemaVersion: PREFERENCES_SCHEMA_VERSION, ...validPreferences(prefs) });
}

export function deserializePreferences(json: string): Preferences | null {
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
    settings: validSettings(obj.settings),
    onboarding: validOnboarding(obj.onboarding),
  };
}

function validPreferences(prefs: Preferences): Preferences {
  return {
    profile: validProfile(prefs.profile),
    settings: validSettings(prefs.settings),
    onboarding: validOnboarding(prefs.onboarding),
  };
}

function defaultOnboardingState(): OnboardingState {
  return {
    currentStep: 'welcome',
    selectedEquipment: [],
    baselineResultId: null,
    completedAt: null,
    updatedAt: null,
  };
}

function validProfile(v: unknown): UserProfile {
  const def = defaultPreferences().profile;
  if (typeof v !== 'object' || v === null) return def;
  const p = v as Partial<UserProfile>;
  const dateOfBirth = normalizeDateOfBirth(p.dateOfBirth);
  const derivedAge = ageFromDateOfBirth(dateOfBirth);
  const exactAge = derivedAge ?? validExactAge(p.exactAge) ?? validExactAge(p.age);
  const ageBand =
    derivedAge !== null
      ? ageBandForAge(derivedAge)
      : isAgeBand(p.ageBand)
        ? p.ageBand
        : ageBandForAge(exactAge);
  return {
    name: typeof p.name === 'string' ? p.name : def.name,
    dateOfBirth,
    exactAge,
    referenceSex: validReferenceSex(p.referenceSex),
    age: exactAge,
    ageBand,
    goal: normalizeLifeGoalDisplayText(typeof p.goal === 'string' ? p.goal : def.goal),
    lifeGoal: validLifeGoal(p.lifeGoal),
    safetyProfile: validSafetyProfile(p.safetyProfile),
  };
}

function validLifeGoal(v: unknown): LifeGoal | null {
  if (typeof v !== 'object' || v === null) return null;
  const g = v as Partial<LifeGoal>;
  if (
    typeof g.id !== 'string' ||
    typeof g.userId !== 'string' ||
    typeof g.category !== 'string' ||
    !LIFE_GOAL_CATEGORIES.includes(g.category as LifeGoal['category']) ||
    typeof g.createdAt !== 'string' ||
    typeof g.updatedAt !== 'string'
  ) {
    return null;
  }
  return {
    id: g.id,
    userId: g.userId,
    category: g.category as LifeGoal['category'],
    customText: typeof g.customText === 'string' ? normalizeLifeGoalDisplayText(g.customText) : undefined,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    isPrimary: g.isPrimary !== false,
  };
}

const ACTIVITY_LEVELS: ActivityLevel[] = ['very_inactive', 'lightly_active', 'moderately_active', 'very_active'];
function validSafetyProfile(v: unknown): MovementSafetyProfile | null {
  if (typeof v !== 'object' || v === null) return null;
  const p = v as Partial<MovementSafetyProfile>;
  if (typeof p.id !== 'string' || typeof p.userId !== 'string' || typeof p.createdAt !== 'string' || typeof p.updatedAt !== 'string') {
    return null;
  }
  const rawAge = typeof p.age === 'number' && Number.isFinite(p.age) ? p.age : undefined;
  const ageBand = isAgeBand(p.ageBand)
    ? p.ageBand
    : ageBandForAge(rawAge);
  const age = rawAge ?? representativeAgeForAgeBand(ageBand) ?? undefined;
  const activityLevel =
    typeof p.activityLevel === 'string' && ACTIVITY_LEVELS.includes(p.activityLevel as ActivityLevel)
      ? (p.activityLevel as ActivityLevel)
      : undefined;
  const normalizedEquipment = normalizeAvailableEquipmentForPersistence(p.availableEquipment, {
    status: isCanonicalEquipmentStatus(p.equipmentStatus) ? p.equipmentStatus : undefined,
    updatedAt: typeof p.equipmentUpdatedAt === 'string' ? p.equipmentUpdatedAt : p.updatedAt,
    revision:
      typeof p.equipmentRevision === 'number' && Number.isFinite(p.equipmentRevision)
        ? p.equipmentRevision
        : undefined,
  });
  const preferredWorkoutDays = Array.isArray(p.preferredWorkoutDays)
    ? p.preferredWorkoutDays.filter((d): d is string => typeof d === 'string')
    : undefined;
  const movementCapabilities = movementCapabilityProfileForPersistence(p.movementCapabilities, {
    updatedAt:
      typeof p.movementCapabilities?.updatedAt === 'string'
        ? p.movementCapabilities.updatedAt
        : p.updatedAt,
    revision:
      typeof p.movementCapabilities?.revision === 'number' && Number.isFinite(p.movementCapabilities.revision)
        ? p.movementCapabilities.revision
        : undefined,
  });
  return {
    id: p.id,
    userId: p.userId,
    age,
    ageBand: ageBand ?? undefined,
    activityLevel,
    hasCurrentPain: typeof p.hasCurrentPain === 'boolean' ? p.hasCurrentPain : undefined,
    painNotes: typeof p.painNotes === 'string' ? p.painNotes : undefined,
    hasRecentInjury: typeof p.hasRecentInjury === 'boolean' ? p.hasRecentInjury : undefined,
    injuryNotes: typeof p.injuryNotes === 'string' ? p.injuryNotes : undefined,
    feelsSafeStandingFromChair:
      typeof p.feelsSafeStandingFromChair === 'boolean' ? p.feelsSafeStandingFromChair : undefined,
    feelsSafeBalancing: typeof p.feelsSafeBalancing === 'boolean' ? p.feelsSafeBalancing : undefined,
    availableEquipment: normalizedEquipment.availableEquipment,
    equipmentStatus: normalizedEquipment.equipmentStatus,
    equipmentRevision: normalizedEquipment.equipmentRevision,
    equipmentUpdatedAt: normalizedEquipment.equipmentUpdatedAt,
    movementCapabilities,
    preferredWorkoutDays,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function validExactAge(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 18 && value <= 120 ? value : null;
}

function validReferenceSex(value: unknown): ProfileReferenceSex | null {
  return value === 'female' || value === 'male' ? value : null;
}

function validSettings(v: unknown): AppSettings {
  const def = defaultPreferences().settings;
  if (typeof v !== 'object' || v === null) return def;
  const s = v as Partial<AppSettings>;
  const voiceKnown = typeof s.voiceId === 'string' && VOICE_OPTIONS.some((o) => o.id === s.voiceId);
  const supportSharingLevel =
    s.supportSharingLevel === 'private' ||
    s.supportSharingLevel === 'completion_only' ||
    s.supportSharingLevel === 'progress_summary' ||
    s.supportSharingLevel === 'detailed'
      ? s.supportSharingLevel
      : def.supportSharingLevel;
  return {
    voiceId: voiceKnown ? (s.voiceId as string) : def.voiceId,
    remindersEnabled: typeof s.remindersEnabled === 'boolean' ? s.remindersEnabled : def.remindersEnabled,
    phoneStandAvailable:
      typeof s.phoneStandAvailable === 'boolean' ? s.phoneStandAvailable : def.phoneStandAvailable,
    supportSharingLevel,
    devMockDataEnabled:
      typeof s.devMockDataEnabled === 'boolean' ? s.devMockDataEnabled : def.devMockDataEnabled,
  };
}

function validOnboarding(v: unknown): OnboardingState {
  const def = defaultOnboardingState();
  if (typeof v !== 'object' || v === null) return def;
  const o = v as Partial<OnboardingState>;
  const currentStep =
    typeof o.currentStep === 'string' && ONBOARDING_STEPS.includes(o.currentStep as OnboardingStep)
      ? (o.currentStep as OnboardingStep)
      : def.currentStep;
  return {
    currentStep,
    selectedEquipment: Array.isArray(o.selectedEquipment)
      ? o.selectedEquipment.filter((item): item is string => typeof item === 'string')
      : [],
    baselineResultId: typeof o.baselineResultId === 'string' ? o.baselineResultId : null,
    completedAt: typeof o.completedAt === 'string' ? o.completedAt : null,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : null,
  };
}
