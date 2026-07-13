/**
 * Profile + preferences entry point. Like the history barrel, the
 * expo-file-system store adapter is NOT re-exported here — app code constructs
 * ProfileStore with the shared fs adapter directly — so importing this barrel
 * never pulls in a native module.
 */

export type { AppSettings, MenopauseStage, MenopauseSymptom, MenopauseSymptomPicture, OnboardingState, OnboardingStep, Preferences, ProfileReferenceSex, UserProfile } from './types';
export { EMPTY_PROFILE, MENOPAUSE_STAGE_OPTIONS, MENOPAUSE_SYMPTOM_OPTIONS } from './types';
export {
  AGE_RANGE_OPTIONS,
  ageFromDateOfBirth,
  ageBandForAge,
  ageBandForRepresentativeAge,
  ageBandLabel,
  ageDisplayLabel,
  ageRangeLabelForAge,
  birthYearFromDateOfBirth,
  dateOfBirthInputLabel,
  formatDateOfBirthInputText,
  isAgeBand,
  normalizeDateOfBirth,
  normalizeDateOfBirthInput,
  representativeAgeForAgeBand,
} from './age';
export type { AgeRangeOption } from './age';
export {
  STARTING_PACE_OPTIONS,
  onboardingActivityLevel,
  startingEffortLabel,
} from './activity';
export type { StartingPaceOption } from './activity';
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
export {
  SYMPTOM_PICTURE_TOGGLE_OPTIONS,
  isSymptomToggleSelected,
  toggleSymptomPicture,
} from './symptomPicture';
export type { SymptomPictureToggle } from './symptomPicture';
export { ProfileStore } from './store';
export {
  ONLINE_PROFILE_SYNC_FILE,
  ONLINE_PROFILE_SYNC_SCHEMA_VERSION,
  OnlineProfileSyncStore,
} from './onlineProfileSyncStore';
export type { OnlineProfileSyncMetadata } from './onlineProfileSyncStore';
export { DEFAULT_VOICE_ID, VOICE_OPTIONS, getVoice } from './voices';
export type { VoiceOption } from './voices';
