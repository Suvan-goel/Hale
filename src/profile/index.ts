/**
 * Profile + preferences entry point. Like the history barrel, the
 * expo-file-system store adapter is NOT re-exported here — app code constructs
 * ProfileStore with the shared fs adapter directly — so importing this barrel
 * never pulls in a native module.
 */

export type { AppSettings, OnboardingState, OnboardingStep, Preferences, UserProfile } from './types';
export { EMPTY_PROFILE } from './types';
export {
  CANONICAL_EQUIPMENT_SCHEMA_VERSION,
  CANONICAL_EQUIPMENT_ORDER,
  canonicalEquipmentFromSafetyProfile,
  canonicalEquipmentToAvailableEquipment,
  equipmentFingerprint,
  equipmentSnapshotFingerprint,
  isCanonicalEquipmentCapability,
  isCanonicalEquipmentStatus,
  legacyEquipmentFromCanonical,
  migrateLegacyEquipmentProfile,
  normalizeAvailableEquipmentForPersistence,
  normalizeCanonicalEquipment,
  plannedEquipmentSnapshotFromCanonical,
  resolveCanonicalEquipmentRecords,
  safetyProfileWithCanonicalEquipment,
  sortCapabilities,
  validatePlanEquipmentSnapshot,
} from './equipment';
export type {
  CanonicalEquipmentCapability,
  CanonicalEquipmentProfile,
  CanonicalEquipmentSource,
  CanonicalEquipmentStatus,
  EquipmentDiagnostic,
  EquipmentDiagnosticReason,
  PlannedEquipmentSnapshot,
  PlanEquipmentValidation,
  PlanEquipmentValidationStatus,
} from './equipment';
export {
  MOVEMENT_CAPABILITY_SCHEMA_VERSION,
  defaultMovementCapabilityProfile,
  isFloorTransferConfirmed,
  isPlannedMovementCapabilitySnapshot,
  isSingleLegBalanceConfirmed,
  isStepUpEnvironmentConfirmed,
  movementCapabilitiesFromSafetyProfile,
  movementCapabilityFingerprint,
  movementCapabilityProfileForPersistence,
  movementCapabilitySnapshotFingerprint,
  normalizeMovementCapabilityProfile,
  plannedMovementCapabilitySnapshotFromProfile,
  resolveMovementCapabilityRecords,
  safetyProfileWithMovementCapabilities,
  validatePlanMovementCapabilitySnapshot,
} from './movementCapabilities';
export type {
  MovementCapabilityDiagnostic,
  MovementCapabilityDiagnosticReason,
  MovementCapabilitySource,
  NormalizedMovementCapabilityProfile,
  PlannedMovementCapabilitySnapshot,
  PlanMovementCapabilityValidation,
  PlanMovementCapabilityValidationStatus,
} from './movementCapabilities';
export {
  PREFERENCES_SCHEMA_VERSION,
  defaultPreferences,
  deserializePreferences,
  serializePreferences,
} from './serialize';
export { ProfileStore } from './store';
export { DEFAULT_VOICE_ID, VOICE_OPTIONS, getVoice } from './voices';
export type { VoiceOption } from './voices';
