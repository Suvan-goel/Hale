/**
 * Local check-up history entry point. NOTE: the expo-file-system adapter lives
 * in ./fsAdapter and is imported directly by app code, never re-exported here,
 * so importing this barrel never pulls in a native module.
 */

export { HISTORY_SCHEMA_VERSION, deserializeCheckUp, migrate, serializeCheckUp } from './serialize';
export type { StoredCheckUp } from './serialize';
export { HistoryStore, createMemoryFs } from './store';
export type { HistoryFs } from './store';
export { computeTrends, hasTrend } from './trends';
export type { ExtraTrendPoint, MetricTrend, TrendPoint } from './trends';
