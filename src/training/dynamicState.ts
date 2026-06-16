import type {
  DailyReadiness,
  LadderProgress,
  PainArea,
  SessionSlotType,
  SessionSource,
  TrackingQuality,
  TrainingDomain,
} from './workoutGeneration';

export type PersistedSessionSource = SessionSource | 'legacy';

export interface PersistedGeneratedExerciseSummary {
  exerciseId: string;
  ladderId?: string;
  levelId?: string;
  slotType?: SessionSlotType;
  sets?: number;
  repsPerSet?: number;
  secondsPerSet?: number;
  measurementTier?: 'measured' | 'camera_assisted' | 'voice_guided';
}

export interface PersistedPostSessionFeedback {
  sessionId?: string;
  rpe?: 1 | 2 | 3 | 4 | 5;
  discomfort?: boolean;
  painArea?: PainArea;
  completed?: boolean;
  trackingQuality?: TrackingQuality;
  submittedAt: string;
}

export interface PersistedGeneratedSessionSummary {
  id: string;
  blockId?: string;
  source: PersistedSessionSource;
  templateId?: string;
  title: string;
  focus?: TrainingDomain | string;
  generatedAt?: string;
  completedAt?: string;
  exerciseIds: string[];
  ladderIds?: string[];
  readiness?: DailyReadiness;
  painArea?: PainArea;
  durationMinutes?: number;
  exercises?: PersistedGeneratedExerciseSummary[];
  feedback?: PersistedPostSessionFeedback;
}

export const MAX_GENERATED_SESSION_SUMMARIES = 50;

export function upsertGeneratedSessionSummary(
  summaries: readonly PersistedGeneratedSessionSummary[],
  summary: PersistedGeneratedSessionSummary
): PersistedGeneratedSessionSummary[] {
  const withoutExisting = summaries.filter((item) => item.id !== summary.id);
  return [...withoutExisting, summary].slice(-MAX_GENERATED_SESSION_SUMMARIES);
}

export function emptyLadderProgress(): Record<string, LadderProgress> {
  return {};
}
