/**
 * Central movement registry. Definitions self-register at import time;
 * src/movements/index.ts owns the import list. Screens look movements up by
 * id and never import a definition module directly.
 */

import { MovementDefinition, MovementResultBase } from './types';

const registry = new Map<string, MovementDefinition>();

export function registerMovement<R extends MovementResultBase>(
  definition: MovementDefinition<R>
): void {
  if (registry.has(definition.id)) {
    throw new Error(`movement '${definition.id}' is already registered`);
  }
  registry.set(definition.id, definition as unknown as MovementDefinition);
}

export function getMovement(id: string): MovementDefinition {
  const definition = registry.get(id);
  if (!definition) {
    throw new Error(`unknown movement '${id}' — is it imported in src/movements/index.ts?`);
  }
  return definition;
}

export function listMovements(): MovementDefinition[] {
  return Array.from(registry.values());
}
