/**
 * Preferences (de)serialization with a schema-version field from day one
 * (CLAUDE.md data rule). Parsing is defensive: any malformed or foreign field
 * falls back to its default, so a bad file degrades to a fresh profile rather
 * than crashing the app. Pure — no native imports, fully unit-testable.
 */

import { LIFE_GOAL_CATEGORIES } from '../adherence';
import type { ActivityLevel, AvailableEquipment, LifeGoal, MovementSafetyProfile } from '../adherence';
import { AppSettings, EMPTY_PROFILE, Preferences, UserProfile } from './types';
import { DEFAULT_VOICE_ID, VOICE_OPTIONS } from './voices';

export const PREFERENCES_SCHEMA_VERSION = 3;

export function defaultPreferences(): Preferences {
  return {
    profile: { ...EMPTY_PROFILE },
    settings: { voiceId: DEFAULT_VOICE_ID, remindersEnabled: false },
  };
}

export function serializePreferences(prefs: Preferences): string {
  return JSON.stringify({ schemaVersion: PREFERENCES_SCHEMA_VERSION, ...prefs });
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
  };
}

function validProfile(v: unknown): UserProfile {
  const def = defaultPreferences().profile;
  if (typeof v !== 'object' || v === null) return def;
  const p = v as Partial<UserProfile>;
  return {
    name: typeof p.name === 'string' ? p.name : def.name,
    age: typeof p.age === 'number' && Number.isFinite(p.age) ? p.age : null,
    goal: typeof p.goal === 'string' ? p.goal : def.goal,
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
    customText: typeof g.customText === 'string' ? g.customText : undefined,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    isPrimary: g.isPrimary !== false,
  };
}

const ACTIVITY_LEVELS: ActivityLevel[] = ['very_inactive', 'lightly_active', 'moderately_active', 'very_active'];
const EQUIPMENT: AvailableEquipment[] = [
  'chair',
  'wall',
  'stairs',
  'resistance_band',
  'mini_band',
  'dumbbells',
  'backpack',
  'none',
];

function validSafetyProfile(v: unknown): MovementSafetyProfile | null {
  if (typeof v !== 'object' || v === null) return null;
  const p = v as Partial<MovementSafetyProfile>;
  if (typeof p.id !== 'string' || typeof p.userId !== 'string' || typeof p.createdAt !== 'string' || typeof p.updatedAt !== 'string') {
    return null;
  }
  const activityLevel =
    typeof p.activityLevel === 'string' && ACTIVITY_LEVELS.includes(p.activityLevel as ActivityLevel)
      ? (p.activityLevel as ActivityLevel)
      : undefined;
  const availableEquipment = Array.isArray(p.availableEquipment)
    ? p.availableEquipment.filter((e): e is AvailableEquipment => typeof e === 'string' && EQUIPMENT.includes(e as AvailableEquipment))
    : [];
  const preferredWorkoutDays = Array.isArray(p.preferredWorkoutDays)
    ? p.preferredWorkoutDays.filter((d): d is string => typeof d === 'string')
    : undefined;
  return {
    id: p.id,
    userId: p.userId,
    age: typeof p.age === 'number' && Number.isFinite(p.age) ? p.age : undefined,
    activityLevel,
    hasCurrentPain: typeof p.hasCurrentPain === 'boolean' ? p.hasCurrentPain : undefined,
    painNotes: typeof p.painNotes === 'string' ? p.painNotes : undefined,
    hasRecentInjury: typeof p.hasRecentInjury === 'boolean' ? p.hasRecentInjury : undefined,
    injuryNotes: typeof p.injuryNotes === 'string' ? p.injuryNotes : undefined,
    feelsSafeStandingFromChair:
      typeof p.feelsSafeStandingFromChair === 'boolean' ? p.feelsSafeStandingFromChair : undefined,
    feelsSafeBalancing: typeof p.feelsSafeBalancing === 'boolean' ? p.feelsSafeBalancing : undefined,
    availableEquipment,
    preferredWorkoutDays,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function validSettings(v: unknown): AppSettings {
  const def = defaultPreferences().settings;
  if (typeof v !== 'object' || v === null) return def;
  const s = v as Partial<AppSettings>;
  const voiceKnown = typeof s.voiceId === 'string' && VOICE_OPTIONS.some((o) => o.id === s.voiceId);
  return {
    voiceId: voiceKnown ? (s.voiceId as string) : def.voiceId,
    remindersEnabled: typeof s.remindersEnabled === 'boolean' ? s.remindersEnabled : def.remindersEnabled,
  };
}
