/**
 * Local-only instrumentation (no accounts/backend in V1): the setup-funnel
 * records behind friction decisions. Product data lives in history/adherence;
 * everything here is droppable telemetry.
 */

export {
  SESSION_FUNNEL_SCHEMA_VERSION,
  buildStoredSessionFunnel,
  deserializeSessionFunnel,
  serializeSessionFunnel,
} from './sessionFunnelRecord';
export type { SessionFunnelOutcome, StoredSessionFunnel } from './sessionFunnelRecord';
export { SessionFunnelStore } from './sessionFunnelStore';
