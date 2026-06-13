/**
 * Central exercise registry — parallel to the movement registry. Definitions
 * self-register at import time; src/exercises/index.ts owns the import list.
 * The session player and block builder look exercises up by id and never import
 * a definition module directly.
 */

import { ExerciseDefinition } from './types';

const registry = new Map<string, ExerciseDefinition>();

export function registerExercise(definition: ExerciseDefinition): void {
  if (registry.has(definition.id)) {
    throw new Error(`exercise '${definition.id}' is already registered`);
  }
  registry.set(definition.id, definition);
}

export function getExercise(id: string): ExerciseDefinition {
  const definition = registry.get(id);
  if (!definition) {
    throw new Error(`unknown exercise '${id}' — is it imported in src/exercises/index.ts?`);
  }
  return definition;
}

export function hasExercise(id: string): boolean {
  return registry.has(id);
}

export function listExercises(): ExerciseDefinition[] {
  return Array.from(registry.values());
}

/**
 * All registered levels of a family, ascending by level. Used by the
 * progression engine to clamp promotion/demotion to the ladder bounds and by
 * the block player to resolve a slot's current level.
 */
export function familyLevels(family: string): ExerciseDefinition[] {
  return listExercises()
    .filter((e) => e.family === family)
    .sort((a, b) => a.level - b.level);
}
