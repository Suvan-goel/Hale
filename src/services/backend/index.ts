// Old-engine sync services (blocks, block reports, training state, session
// completions, micro-checks) retired 2026-07-08 with the old-engine cleanup:
// the promoted programme engine's state is LOCAL-ONLY by ruling, so the app
// no longer produces those record kinds. What remains is the living backup
// seam — auth, profile + check-up sync, restore (profile + history), the
// full-server data export, and local account-data hygiene.
export * from './AuthProvider';
export * from './authScope';
export * from './accountDataService';
export * from './accountDeletionService';
export * from './onlineProfileSyncService';
export * from './authService';
export * from './profileService';
export * from './profileSyncService';
export * from './types';
