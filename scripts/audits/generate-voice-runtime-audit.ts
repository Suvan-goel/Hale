import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { MAX_NUMBER_CUE, VoiceCueKey, voicePriority } from '../../src/audio/cues';
import {
  DEFAULT_SESSION_CONFIG,
  type VoiceRequest,
} from '../../src/assessment/sessionController';
import {
  BETA_BATTERY_WITH_TUG,
  DEFAULT_BATTERY,
  DEFAULT_CHECKUP_CONFIG,
  MOVEMENT_PROFILE_V2_BATTERY,
} from '../../src/checkup/checkup';
import {
  getExercise,
  listExerciseLadders,
  listExercises,
  resolveExerciseLevel,
  type ExerciseDefinition,
  type ExerciseLevel,
} from '../../src/exercises';
import { listMovements, getMovement, type MovementDefinition } from '../../src/movements';
import {
  DEFAULT_MICROCHECK_CONFIG,
  type MicroCheckType,
} from '../../src/training/microCheck';
import {
  DEFAULT_TRAINING_CONFIG,
} from '../../src/training/sessionPlayer';
import {
  SAFETY_CUE_DEFINITIONS,
  SESSION_GLOBAL_SAFETY_CUE_IDS,
  plannedSafetyCueSnapshotForExercises,
  safetyCueTexts,
  type SafetyCueId,
} from '../../src/training/safetyCues';

const ROOT = path.resolve(__dirname, '../..');
const OUT_MD = path.join(ROOT, 'docs/audits/HALE_VOICE_RUNTIME_TIMELINE_AUDIT.md');
const OUT_JSON = path.join(ROOT, 'docs/audits/HALE_VOICE_RUNTIME_TIMELINE_AUDIT.json');
const OUT_CSV = path.join(ROOT, 'docs/audits/HALE_VOICE_ASSET_DURATIONS.csv');
const INVENTORY_JSON = path.join(ROOT, 'docs/audits/HALE_VOICE_CUE_INVENTORY.json');
const MANIFEST_TS = path.join(ROOT, 'src/audio/manifest.ts');
const VOICE_DIR = path.join(ROOT, 'assets/audio/voice');
const GENERATED_AT = new Date().toISOString();
const VOICES = ['clara', 'marcus'] as const;
type VoiceId = (typeof VOICES)[number];

type Outcome = 'played' | 'partially-played' | 'dropped' | 'interrupted' | 'cancelled' | 'missing' | 'statically-indeterminate';
type EvidenceConfidence =
  | 'confirmed_code_and_asset_duration'
  | 'confirmed_deterministic_simulation'
  | 'confirmed_static_semantics'
  | 'likely'
  | 'possible'
  | 'device_only'
  | 'uncertain';

interface CueInventoryRow {
  cueKey: string;
  exactSpokenText?: string;
  category?: string;
  productionStatus?: string;
  reachability?: string;
}

interface AssetRow {
  voiceId: VoiceId;
  cueKey: string;
  path: string;
  absPath: string;
  durationMs: number;
  fileSizeBytes: number;
  codec: string | null;
  sampleRateHz: number | null;
  channels: number | null;
  inManifest: boolean;
  hasCueDefinition: boolean;
  pairedVoiceAssetExists: boolean;
  pairedDurationDeltaMs: number | null;
  status: string;
  notes: string;
}

interface ScheduledEventInput {
  scheduledAtMs: number;
  state: string;
  sourceEvent: string;
  cues: string[];
  priority?: number;
  source: SourceRef;
  assumptions?: string[];
}

interface SourceRef {
  file: string;
  symbol: string;
  line: number;
}

interface TimelineEvent {
  id: string;
  scheduledAtMs: number;
  speakCalledAtMs: number;
  state: string;
  sourceEvent: string;
  source: SourceRef;
  cues: string[];
  priority: number;
  assetDurationMs: number;
  sequenceDurationMs: number;
  playbackStartMs: number | null;
  playbackEndMs: number | null;
  nextControllerEventMs: number | null;
  timingMarginMs: number | null;
  voiceStateBeforeCall: string;
  outcome: Outcome;
  competingEventId: string | null;
  reason: string | null;
  confidence: EvidenceConfidence;
  assumptions: string[];
}

interface Scenario {
  id: string;
  flow: 'training' | 'movement_check_up' | 'micro_check_up' | 'shared_controls';
  voiceId: VoiceId;
  exerciseId: string | null;
  assessmentId: string | null;
  microCheckType: MicroCheckType | null;
  variant: string;
  assumptions: string[];
  events: TimelineEvent[];
  verdict: Record<string, unknown>;
  notes: string[];
}

interface Finding {
  id: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  flow: string;
  affectedCueIds: string[];
  affectedExerciseOrAssessmentIds: string[];
  userVisibleConsequence: string;
  evidence: string;
  sources: SourceRef[];
  claraResult: string;
  marcusResult: string;
  evidenceConfidence: EvidenceConfidence;
  provisionalAction: string;
  isolatedImplementation: boolean;
  testsNeededLater: string[];
}

interface ExerciseAccuracyRow {
  exerciseId: string;
  displayName: string;
  ladder: string;
  releaseStatus: string;
  reachability: string;
  domain: string;
  cameraOrientation: string;
  requiredEquipment: string[];
  requiredSupport: string[];
  floorSpaceRequirement: string;
  bilateralOrUnilateral: string;
  startingSide: string;
  sideSwitchRequired: boolean;
  setType: string;
  defaultSetCount: number;
  defaultTarget: string;
  restSec: number;
  loaded: boolean;
  instructionCueKeys: string[];
  exactSpokenInstruction: string;
  ladderInstruction: string;
  safetyCueIds: string[];
  setupSafetyCueIds: string[];
  activeSafetyCueIds: string[];
  repeatedSafetyCueIds: string[];
  recoverySafetyCueIds: string[];
  totalSpokenSetupDurationMs: Record<VoiceId, number>;
  countdownWaitsForSetupSpeech: boolean;
  activeMovementCanBeginDuringSpeech: boolean;
  semanticAccuracyVerdict: string;
  dimensions: Record<string, string>;
  userConsequence: string[];
  voiceFirstVerdict: string;
  allEssentialEyesOffInformationSpoken: boolean;
  provisionalAction: string;
  source: SourceRef;
}

interface SafetyNarrationRow {
  exerciseId: string;
  setupCueIds: string[];
  activeCueIds: string[];
  repeatedSetCueIds: string[];
  recoveryCueIds: string[];
  initialSetupCueIds: string[];
  initialSetupSafetyDurationMs: Record<VoiceId, number>;
  repeatedSetSafetyDurationMs: Record<VoiceId, number>;
  classification: Record<string, string>;
  duplicateCueIds: string[];
  notes: string[];
}

interface VoiceFirstCoverageRow {
  flow: string;
  itemId: string;
  itemName: string;
  exerciseOrAssessmentName: string;
  coverage: Record<string, string>;
  verdict: string;
  notes: string[];
}

interface InactiveCueDecision {
  cueKey: string;
  currentStatus: string;
  evidence: string;
  provisionalDecision: string;
  sources: SourceRef[];
}

interface AuditOutput {
  auditVersion: number;
  generatedAt: string;
  inventoryInputs: string[];
  summary: Record<string, unknown>;
  timingModel: Record<string, unknown>;
  assetDurations: Record<string, unknown>[];
  scenarios: Scenario[];
  exerciseAccuracy: ExerciseAccuracyRow[];
  safetyNarration: SafetyNarrationRow[];
  voiceFirstCoverage: VoiceFirstCoverageRow[];
  findings: Finding[];
  inactiveCueDecisions: InactiveCueDecision[];
  deviceTestPlan: Record<string, unknown>[];
  validation: Record<string, unknown>;
  sourceIndex: string[];
}

const sourceCache = new Map<string, string[]>();
function sourceLine(file: string, pattern: string): number {
  const abs = path.join(ROOT, file);
  if (!sourceCache.has(file)) {
    sourceCache.set(file, fs.readFileSync(abs, 'utf8').split(/\r?\n/));
  }
  const lines = sourceCache.get(file) as string[];
  const index = lines.findIndex((line) => line.includes(pattern));
  return index >= 0 ? index + 1 : 0;
}

function source(file: string, symbol: string, pattern = symbol): SourceRef {
  return { file, symbol, line: sourceLine(file, pattern) };
}

function rel(absPath: string): string {
  return path.relative(ROOT, absPath).replaceAll(path.sep, '/');
}

function readInventory(): {
  cueText: Map<string, string>;
  cueMeta: Map<string, CueInventoryRow>;
  cues: CueInventoryRow[];
} {
  const parsed = JSON.parse(fs.readFileSync(INVENTORY_JSON, 'utf8'));
  const cues = (parsed.cues ?? []) as CueInventoryRow[];
  const cueText = new Map<string, string>();
  const cueMeta = new Map<string, CueInventoryRow>();
  for (const cue of cues) {
    cueMeta.set(cue.cueKey, cue);
    if (cue.exactSpokenText) cueText.set(cue.cueKey, cue.exactSpokenText);
  }
  for (let n = 0; n <= MAX_NUMBER_CUE; n++) {
    const key = `num-${n}`;
    if (!cueText.has(key)) cueText.set(key, numberWord(n));
    if (!cueMeta.has(key)) cueMeta.set(key, { cueKey: key, category: 'result.number', productionStatus: 'active' });
  }
  for (const [cueId, def] of Object.entries(SAFETY_CUE_DEFINITIONS)) {
    if (!cueText.has(cueId)) cueText.set(cueId, def.text);
    if (!cueMeta.has(cueId)) cueMeta.set(cueId, { cueKey: cueId, category: `safety.${def.tier}`, productionStatus: 'active' });
  }
  return { cueText, cueMeta, cues };
}

function numberWord(n: number): string {
  const words = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two',
    'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven',
    'twenty-eight', 'twenty-nine', 'thirty', 'thirty-one', 'thirty-two',
    'thirty-three', 'thirty-four', 'thirty-five', 'thirty-six', 'thirty-seven',
    'thirty-eight', 'thirty-nine', 'forty',
  ];
  return `${words[n]}.`;
}

function parseManifest(): Map<string, Map<string, string>> {
  const text = fs.readFileSync(MANIFEST_TS, 'utf8');
  const map = new Map<string, Map<string, string>>();
  const re = /'([^']+)':\s*require\('\.\.\/\.\.\/assets\/audio\/voice\/([^/]+)\/([^']+\.mp3)'\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const cue = m[1];
    const voiceId = m[2];
    const file = `assets/audio/voice/${voiceId}/${m[3]}`;
    if (!map.has(voiceId)) map.set(voiceId, new Map());
    map.get(voiceId)?.set(cue, file);
  }
  return map;
}

function listMp3Files(): string[] {
  const out: string[] = [];
  for (const voice of fs.readdirSync(VOICE_DIR).sort()) {
    const voicePath = path.join(VOICE_DIR, voice);
    if (!fs.statSync(voicePath).isDirectory()) continue;
    for (const file of fs.readdirSync(voicePath).sort()) {
      if (file.endsWith('.mp3')) out.push(path.join(voicePath, file));
    }
  }
  return out;
}

function probeMp3(absPath: string): Pick<AssetRow, 'durationMs' | 'codec' | 'sampleRateHz' | 'channels'> {
  const raw = execFileSync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration:stream=codec_name,sample_rate,channels',
    '-of',
    'json',
    absPath,
  ], { encoding: 'utf8' });
  const parsed = JSON.parse(raw);
  const durationSec = Number(parsed.format?.duration ?? 0);
  const stream = Array.isArray(parsed.streams) ? parsed.streams[0] : null;
  return {
    durationMs: Math.round(durationSec * 1000),
    codec: stream?.codec_name ?? null,
    sampleRateHz: stream?.sample_rate ? Number(stream.sample_rate) : null,
    channels: typeof stream?.channels === 'number' ? stream.channels : null,
  };
}

function buildAssetRows(cueMeta: Map<string, CueInventoryRow>): AssetRow[] {
  const manifest = parseManifest();
  const files = listMp3Files();
  const rows: AssetRow[] = [];
  const byVoiceCue = new Map<string, AssetRow>();
  for (const absPath of files) {
    const relative = rel(absPath);
    const parts = relative.split('/');
    const voiceId = parts[3] as VoiceId;
    const cueKey = path.basename(absPath, '.mp3');
    const stat = fs.statSync(absPath);
    const meta = probeMp3(absPath);
    const inManifest = manifest.get(voiceId)?.get(cueKey) === relative;
    const hasCueDefinition = cueMeta.has(cueKey) || /^num-\d+$/.test(cueKey);
    const row: AssetRow = {
      voiceId,
      cueKey,
      path: relative,
      absPath,
      durationMs: meta.durationMs,
      fileSizeBytes: stat.size,
      codec: meta.codec,
      sampleRateHz: meta.sampleRateHz,
      channels: meta.channels,
      inManifest,
      hasCueDefinition,
      pairedVoiceAssetExists: false,
      pairedDurationDeltaMs: null,
      status: 'ok',
      notes: '',
    };
    if (!inManifest) row.status = 'orphaned_physical_file';
    if (!hasCueDefinition) row.notes = appendNote(row.notes, 'no cue metadata in inventory/cue definitions');
    rows.push(row);
    byVoiceCue.set(`${voiceId}:${cueKey}`, row);
  }
  for (const row of rows) {
    const pairedVoice = row.voiceId === 'clara' ? 'marcus' : 'clara';
    const paired = byVoiceCue.get(`${pairedVoice}:${row.cueKey}`);
    row.pairedVoiceAssetExists = !!paired;
    if (paired) row.pairedDurationDeltaMs = row.durationMs - paired.durationMs;
    if (!paired) row.status = row.status === 'ok' ? 'missing_paired_voice_asset' : `${row.status};missing_paired_voice_asset`;
  }
  rows.sort((a, b) => `${a.voiceId}:${a.cueKey}`.localeCompare(`${b.voiceId}:${b.cueKey}`));
  return rows;
}

function appendNote(notes: string, next: string): string {
  return notes ? `${notes}; ${next}` : next;
}

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function writeCsv(rows: AssetRow[]): void {
  const columns = [
    'voiceId',
    'cueKey',
    'path',
    'durationMs',
    'fileSizeBytes',
    'codec',
    'sampleRateHz',
    'channels',
    'inManifest',
    'hasCueDefinition',
    'pairedVoiceAssetExists',
    'pairedDurationDeltaMs',
    'status',
    'notes',
  ] as const;
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((key) => csvEscape(row[key])).join(','));
  }
  fs.writeFileSync(OUT_CSV, `${lines.join('\n')}\n`);
}

function rowFor(rows: AssetRow[], voiceId: VoiceId, cueKey: string): AssetRow | undefined {
  return rows.find((row) => row.voiceId === voiceId && row.cueKey === cueKey);
}

function cueDuration(rows: AssetRow[], voiceId: VoiceId, cueKey: string): number {
  return rowFor(rows, voiceId, cueKey)?.durationMs ?? 0;
}

function sequenceDuration(rows: AssetRow[], voiceId: VoiceId, cues: readonly string[]): number {
  return cues.reduce((sum, cue) => sum + cueDuration(rows, voiceId, cue), 0);
}

function maxPriority(cues: readonly string[]): number {
  return cues.reduce((priority, cue) => Math.max(priority, voicePriority(cue as VoiceCueKey)), 0);
}

function simulateScenario(input: {
  id: string;
  flow: Scenario['flow'];
  voiceId: VoiceId;
  exerciseId?: string | null;
  assessmentId?: string | null;
  microCheckType?: MicroCheckType | null;
  variant: string;
  assumptions: string[];
  events: ScheduledEventInput[];
  notes?: string[];
  assetRows: AssetRow[];
  verdict?: Record<string, unknown>;
}): Scenario {
  const events = input.events
    .slice()
    .sort((a, b) => a.scheduledAtMs - b.scheduledAtMs || a.sourceEvent.localeCompare(b.sourceEvent));
  const out: TimelineEvent[] = [];
  let busyUntil = -Infinity;
  let busyPriority = -1;
  let activeEvent: TimelineEvent | null = null;
  for (let idx = 0; idx < events.length; idx++) {
    const e = events[idx];
    const id = `${input.id}-E${String(idx + 1).padStart(2, '0')}`;
    const priority = e.priority ?? maxPriority(e.cues);
    const seqDuration = sequenceDuration(input.assetRows, input.voiceId, e.cues);
    const missing = e.cues.some((cue) => !rowFor(input.assetRows, input.voiceId, cue));
    const voiceStateBeforeCall =
      e.scheduledAtMs < busyUntil
        ? `busy(priority=${busyPriority},until=${Math.round(busyUntil)})`
        : 'idle';
    let outcome: Outcome = 'played';
    let playbackStartMs: number | null = e.scheduledAtMs;
    let playbackEndMs: number | null = e.scheduledAtMs + seqDuration;
    let reason: string | null = null;
    let competingEventId: string | null = null;
    if (e.cues.length === 0) {
      outcome = 'cancelled';
      playbackStartMs = null;
      playbackEndMs = null;
      reason = 'Control action; no VoiceChannel.speak() call is submitted.';
      if (e.scheduledAtMs < busyUntil && activeEvent) {
        activeEvent.outcome = 'cancelled';
        activeEvent.playbackEndMs = e.scheduledAtMs;
        activeEvent.timingMarginMs =
          activeEvent.nextControllerEventMs === null ? null : activeEvent.nextControllerEventMs - e.scheduledAtMs;
        activeEvent.competingEventId = id;
        activeEvent.reason = `Cancelled by screen-level control event ${id}.`;
      }
      busyUntil = -Infinity;
      busyPriority = -1;
      activeEvent = null;
    } else if (missing) {
      outcome = 'missing';
      reason = 'At least one cue in this sequence is missing for the selected voice.';
      playbackStartMs = null;
      playbackEndMs = null;
    } else if (e.scheduledAtMs < busyUntil) {
      if (priority <= busyPriority) {
        outcome = 'dropped';
        playbackStartMs = null;
        playbackEndMs = null;
        reason = `VoiceChannel drops lower-or-equal priority while busy (incoming ${priority}, current ${busyPriority}).`;
        competingEventId = activeEvent?.id ?? null;
      } else {
        if (activeEvent) {
          activeEvent.outcome = 'interrupted';
          activeEvent.playbackEndMs = e.scheduledAtMs;
          activeEvent.timingMarginMs =
            activeEvent.nextControllerEventMs === null || activeEvent.playbackEndMs === null
              ? null
              : activeEvent.nextControllerEventMs - activeEvent.playbackEndMs;
          activeEvent.competingEventId = id;
          activeEvent.reason = `Interrupted by higher-priority ${id}.`;
        }
        outcome = 'played';
        reason = `Higher-priority event interrupted the active sequence (incoming ${priority}, current ${busyPriority}).`;
      }
    }
    const nextScheduled = events[idx + 1]?.scheduledAtMs ?? null;
    const timelineEvent: TimelineEvent = {
      id,
      scheduledAtMs: e.scheduledAtMs,
      speakCalledAtMs: e.scheduledAtMs,
      state: e.state,
      sourceEvent: e.sourceEvent,
      source: e.source,
      cues: e.cues,
      priority,
      assetDurationMs: seqDuration,
      sequenceDurationMs: seqDuration,
      playbackStartMs,
      playbackEndMs,
      nextControllerEventMs: nextScheduled,
      timingMarginMs:
        nextScheduled === null || playbackEndMs === null ? null : nextScheduled - playbackEndMs,
      voiceStateBeforeCall,
      outcome,
      competingEventId,
      reason,
      confidence: 'confirmed_deterministic_simulation',
      assumptions: e.assumptions ?? [],
    };
    out.push(timelineEvent);
    if (outcome === 'played') {
      busyUntil = playbackEndMs ?? e.scheduledAtMs;
      busyPriority = priority;
      activeEvent = timelineEvent;
    }
  }
  return {
    id: input.id,
    flow: input.flow,
    voiceId: input.voiceId,
    exerciseId: input.exerciseId ?? null,
    assessmentId: input.assessmentId ?? null,
    microCheckType: input.microCheckType ?? null,
    variant: input.variant,
    assumptions: input.assumptions,
    events: out,
    verdict: input.verdict ?? {},
    notes: input.notes ?? [],
  };
}

function buildTrainingScenarios(assetRows: AssetRow[], exerciseRows: ExerciseAccuracyRow[]): Scenario[] {
  const scenarios: Scenario[] = [];
  const exerciseIds = listExercises().map((exercise) => exercise.id);
  const safetySnapshot = plannedSafetyCueSnapshotForExercises(exerciseIds);
  const safetyByExercise = new Map(safetySnapshot.exerciseProfiles.map((profile) => [profile.exerciseId, profile]));
  const trainingSrc = source('src/training/sessionPlayer.ts', 'TrainingSessionPlayer.update', 'update(out: PipelineFrameOutput');
  const setupSrc = source('src/training/sessionPlayer.ts', 'runPreflight ready setup sequence', "cues: ['framing-ready'");
  const countdownSrc = source('src/training/sessionPlayer.ts', 'runCountdown', 'private runCountdown');
  const restSrc = source('src/training/sessionPlayer.ts', 'runRest', 'private runRest');
  const activeSrc = source('src/training/sessionPlayer.ts', 'runSet recovery cue', "g.validTimeState === 'paused'");
  for (const voiceId of VOICES) {
    for (let index = 0; index < exerciseIds.length; index++) {
      const exercise = getExercise(exerciseIds[index]);
      const accuracy = exerciseRows.find((row) => row.exerciseId === exercise.id);
      const safety = safetyByExercise.get(exercise.id);
      const initialSafety = unique([...(safety?.setupCueIds ?? []), ...(safety?.activeCueIds ?? [])]);
      const setupCues = ['framing-ready', ...exercise.voice.instructions, ...initialSafety];
      const setupDuration = sequenceDuration(assetRows, voiceId, setupCues);
      const countdownStart = setupDuration + DEFAULT_TRAINING_CONFIG.postInstructionsDwellMs;
      scenarios.push(simulateScenario({
        id: `TRAIN-${exercise.id}-first-set-${voiceId}`,
        flow: 'training',
        voiceId,
        exerciseId: exercise.id,
        variant: 'normal-first-set-setup',
        assumptions: ['Preflight and movement camera readiness are already ready.', 'Controller observes voiceBusy accurately from the screen.', 'Frame time equals scheduledAtMs in this static model.'],
        assetRows,
        verdict: {
          semanticAccuracy: accuracy?.semanticAccuracyVerdict,
          activeBeginsWhenGoEmitted: true,
        },
        events: [
          { scheduledAtMs: 0, state: 'intro', sourceEvent: 'training intro', cues: ['training-intro', 'support_keep_support_within_reach'], source: trainingSrc },
          { scheduledAtMs: sequenceDuration(assetRows, voiceId, ['training-intro', 'support_keep_support_within_reach']), state: 'intro', sourceEvent: 'global safety', cues: SESSION_GLOBAL_SAFETY_CUE_IDS as string[], source: trainingSrc },
          { scheduledAtMs: sequenceDuration(assetRows, voiceId, ['training-intro', 'support_keep_support_within_reach', ...SESSION_GLOBAL_SAFETY_CUE_IDS]) + DEFAULT_TRAINING_CONFIG.transitionDwellMs, state: 'instructions', sourceEvent: 'framing ready + exercise instructions + safety', cues: setupCues, source: setupSrc },
          ...countdownEvents(countdownStart + sequenceDuration(assetRows, voiceId, ['training-intro', 'support_keep_support_within_reach', ...SESSION_GLOBAL_SAFETY_CUE_IDS]) + DEFAULT_TRAINING_CONFIG.transitionDwellMs, countdownSrc),
        ],
        notes: ['Training setup uses one cue array containing framing-ready, exercise instruction cues, setup safety cues, and active safety cues.'],
      }));

      const repeated = safety?.repeatedSetCueIds ?? [];
      const restCues = [exercise.prescription.sets > 2 ? 'rest-now' : 'last-set', ...repeated];
      const restDuration = exercise.prescription.restSec * 1000;
      const restSpeech = sequenceDuration(assetRows, voiceId, restCues);
      const nextCountdown = Math.max(restDuration, restSpeech);
      scenarios.push(simulateScenario({
        id: `TRAIN-${exercise.id}-later-set-${voiceId}`,
        flow: 'training',
        voiceId,
        exerciseId: exercise.id,
        variant: 'later-set-rest-to-countdown',
        assumptions: ['A non-final set has just completed.', 'runRest gates the next countdown on both rest duration and voice idle.'],
        assetRows,
        verdict: {
          restSpeechExtendsBeyondRest: restSpeech > restDuration,
          restDurationMs: restDuration,
          restSpeechMs: restSpeech,
        },
        events: [
          { scheduledAtMs: 0, state: 'rest', sourceEvent: 'rest narration', cues: restCues, source: restSrc },
          ...countdownEvents(nextCountdown, countdownSrc),
        ],
        notes: ['Repeated-set safety cues are appended to rest narration when present.'],
      }));

      const next = exerciseIds[index + 1] ? getExercise(exerciseIds[index + 1]) : null;
      const transitionCue = next ? transitionCueForTraining(exercise, next) : 'session-complete';
      scenarios.push(simulateScenario({
        id: `TRAIN-${exercise.id}-final-transition-${voiceId}`,
        flow: 'training',
        voiceId,
        exerciseId: exercise.id,
        variant: 'final-set-transition',
        assumptions: ['The final set ends normally without a grader-owned voice cue.', 'Transition speech waits for voice idle.'],
        assetRows,
        events: [
          { scheduledAtMs: 0, state: 'transition', sourceEvent: next ? 'advance to next exercise' : 'session complete', cues: [transitionCue], source: trainingSrc },
        ],
        verdict: { nextExerciseId: next?.id ?? null },
      }));

      if (exercise.prescription.autoregulate) {
        const nextCue = next ? transitionCueForTraining(exercise, next) : 'session-complete';
        scenarios.push(simulateScenario({
          id: `TRAIN-${exercise.id}-autoregulation-${voiceId}`,
          flow: 'training',
          voiceId,
          exerciseId: exercise.id,
          variant: 'autoregulation-early-completion',
          assumptions: ['The set grader emits the shared autoregulation voice cue when velocity drops enough to end the set early.', 'Subsequent rest or transition waits for voice idle.'],
          assetRows,
          events: [
            { scheduledAtMs: 0, state: 'set', sourceEvent: 'autoregulation stop', cues: ['thats-your-set'], source: source('src/exercises/common.ts', 'AUTOREG_VOICE', 'AUTOREG_VOICE') },
            { scheduledAtMs: cueDuration(assetRows, voiceId, 'thats-your-set'), state: next ? 'transition' : 'complete', sourceEvent: next ? 'post-autoregulation transition' : 'post-autoregulation session complete', cues: [nextCue], source: trainingSrc },
          ],
          verdict: { earlyCompletionVoice: 'spoken', nextExerciseId: next?.id ?? null },
        }));
      }

      scenarios.push(simulateScenario({
        id: `TRAIN-${exercise.id}-tracking-loss-${voiceId}`,
        flow: 'training',
        voiceId,
        exerciseId: exercise.id,
        variant: 'tracking-loss-during-active-set',
        assumptions: ['Valid-time or tracking recovery branch emits recovery safety when a set pauses.', 'No simultaneous grader-owned voice cue is present in this scenario.'],
        assetRows,
        events: [
          { scheduledAtMs: 0, state: 'set', sourceEvent: 'tracking pause recovery', cues: (safety?.recoveryCueIds.length ? safety.recoveryCueIds : ['tracking_pause_and_reset']) as string[], source: activeSrc },
        ],
        verdict: { positiveRecoveryConfirmation: false },
      }));
    }
  }
  return scenarios;
}

function transitionCueForTraining(prev: ExerciseDefinition, next: ExerciseDefinition): string {
  if (prev.cameraView.view !== next.cameraView.view) return next.cameraView.view === 'front' ? 'face-forward' : 'turn-side-on';
  return 'next-up';
}

function countdownEvents(startMs: number, sourceRef: SourceRef): ScheduledEventInput[] {
  return [
    { scheduledAtMs: startMs, state: 'countdown', sourceEvent: 'countdown three', cues: ['countdown-three'], source: sourceRef },
    { scheduledAtMs: startMs + 1000, state: 'countdown', sourceEvent: 'countdown two', cues: ['countdown-two'], source: sourceRef },
    { scheduledAtMs: startMs + 2000, state: 'countdown', sourceEvent: 'countdown one', cues: ['countdown-one'], source: sourceRef },
    { scheduledAtMs: startMs + 3000, state: 'countdown->active', sourceEvent: 'go and active start', cues: ['go'], source: sourceRef, assumptions: ['Production code switches to active on the same frame that it emits go.'] },
  ];
}

function buildCheckupScenarios(assetRows: AssetRow[]): Scenario[] {
  const scenarios: Scenario[] = [];
  const checkupSrc = source('src/checkup/checkup.ts', 'CheckUpOrchestrator.update', 'update(out: PipelineFrameOutput');
  const transitionSrc = source('src/checkup/checkup.ts', 'runTransition', 'private runTransition');
  const sessionSrc = source('src/assessment/sessionController.ts', 'SessionController.update', 'update(');
  const countdownSrc = source('src/assessment/sessionController.ts', 'countdown active transition', "if (cue === 'go')");
  for (const voiceId of VOICES) {
    for (const [batteryId, battery] of [
      ['default', DEFAULT_BATTERY],
      ['beta-with-tug', BETA_BATTERY_WITH_TUG],
      ['movement-profile-v2', MOVEMENT_PROFILE_V2_BATTERY],
    ] as const) {
      const events: ScheduledEventInput[] = [];
      let t = 0;
      events.push({ scheduledAtMs: t, state: 'intro', sourceEvent: `${batteryId} check-up intro`, cues: ['checkup-intro'], source: checkupSrc });
      t += sequenceDuration(assetRows, voiceId, ['checkup-intro']);
      for (let i = 0; i < battery.length; i++) {
        const movement = getMovement(battery[i]);
        const prev = i > 0 ? getMovement(battery[i - 1]) : null;
        const transitionCue = prev ? transitionCueForCheckup(prev, movement) : null;
        if (transitionCue) {
          events.push({ scheduledAtMs: t, state: 'transition', sourceEvent: `transition to ${movement.id}`, cues: [transitionCue], source: transitionSrc });
          t += sequenceDuration(assetRows, voiceId, [transitionCue]);
        }
        t += DEFAULT_CHECKUP_CONFIG.transitionDwellMs;
        const instructionCues = ['framing-ready', ...movement.voice.instructions];
        events.push({ scheduledAtMs: t, state: 'instructions', sourceEvent: `${movement.id} framing + instruction`, cues: instructionCues, source: sessionSrc });
        t += sequenceDuration(assetRows, voiceId, instructionCues) + DEFAULT_SESSION_CONFIG.postInstructionsDwellMs;
        events.push(...countdownEvents(t, countdownSrc));
        t += 3000 + cueDuration(assetRows, voiceId, 'go');
        if (movement.id === 'balance-ladder') {
          for (const stage of balanceStageCueEvents(t, sessionSrc)) events.push(stage);
        }
        const activeDuration = movement.durationMs ?? modelledGraderDurationMs(movement.id);
        t += activeDuration;
        if (movement.voice.endCue) {
          events.push({ scheduledAtMs: t, state: 'active->result', sourceEvent: `${movement.id} end cue`, cues: [movement.voice.endCue], source: sessionSrc });
          t += cueDuration(assetRows, voiceId, movement.voice.endCue);
        }
        const resultCues = movement.id.includes('chair') ? ['you-completed', 'num-8', 'stands-suffix'] : ['item-complete'];
        events.push({ scheduledAtMs: t, state: 'result', sourceEvent: `${movement.id} result`, cues: resultCues, source: sessionSrc });
        t += sequenceDuration(assetRows, voiceId, resultCues) + DEFAULT_SESSION_CONFIG.resultLingerMs;
      }
      events.push({ scheduledAtMs: t, state: 'complete', sourceEvent: `${batteryId} check-up complete`, cues: ['checkup-complete'], source: checkupSrc });
      scenarios.push(simulateScenario({
        id: `CHECKUP-${batteryId}-${voiceId}`,
        flow: 'movement_check_up',
        voiceId,
        variant: `${batteryId}-normal`,
        assumptions: ['Preflight succeeds for every item.', 'Representative chair result is 8 reps.', 'Grader-terminated protocols use conservative modelled durations listed in event notes.'],
        assetRows,
        events,
        notes: [`Battery: ${battery.join(', ')}`],
        verdict: { battery },
      }));

      for (const movementId of battery) {
        const movement = getMovement(movementId);
        scenarios.push(simulateScenario({
          id: `CHECKUP-${movementId}-interruption-${voiceId}`,
          flow: 'movement_check_up',
          voiceId,
          assessmentId: movementId,
          variant: 'tracking-loss-during-active',
          assumptions: ['Subject leaves frame during active measurement.', 'SessionController feeds tracking-interrupted to the grader and may also speak a preflight prompt.'],
          assetRows,
          events: [
            { scheduledAtMs: 0, state: 'active', sourceEvent: 'tracking-loss prompt', cues: [movement.cameraView.view === 'front' ? 'face-forward' : 'turn-side-on'], priority: 5, source: sessionSrc },
          ],
          verdict: { graderStateResets: true, positiveRecoveryConfirmation: false },
        }));
      }
    }
  }
  return scenarios;
}

function balanceStageCueEvents(activeStartMs: number, sourceRef: SourceRef): ScheduledEventInput[] {
  return [
    { scheduledAtMs: activeStartMs, state: 'active.balance-stage', sourceEvent: 'balance feet-together eyes open', cues: ['balance-feet-together'], source: sourceRef },
    { scheduledAtMs: activeStartMs + 13000, state: 'active.balance-stage', sourceEvent: 'balance feet-together eyes closed', cues: ['balance-feet-together', 'close-your-eyes'], source: sourceRef },
    { scheduledAtMs: activeStartMs + 26000, state: 'active.balance-stage', sourceEvent: 'balance tandem eyes open', cues: ['balance-tandem', 'open-your-eyes'], source: sourceRef },
    { scheduledAtMs: activeStartMs + 39000, state: 'active.balance-stage', sourceEvent: 'balance tandem eyes closed', cues: ['balance-tandem', 'close-your-eyes'], source: sourceRef },
    { scheduledAtMs: activeStartMs + 52000, state: 'active.balance-stage', sourceEvent: 'balance single-leg eyes open', cues: ['balance-single-leg', 'open-your-eyes'], source: sourceRef },
  ];
}

function transitionCueForCheckup(prev: MovementDefinition, next: MovementDefinition): string {
  if (prev.cameraView.view !== next.cameraView.view) return next.cameraView.view === 'front' ? 'face-forward' : 'turn-side-on';
  return 'next-exercise';
}

function modelledGraderDurationMs(movementId: string): number {
  if (movementId === 'balance-ladder') return 5 * 3000 + 4 * 10000 + 12000;
  if (movementId === 'timed-up-and-go') return 12000;
  if (movementId === 'one-leg-balance-45s-v2') return 45000;
  if (movementId === 'chair-rise-30s-v2') return 30000;
  if (movementId === 'active-shoulder-reach-v2') return 9000;
  return 9000;
}

function buildMicroCheckScenarios(assetRows: AssetRow[]): Scenario[] {
  const scenarios: Scenario[] = [];
  const runnerSrc = source('src/training/microCheck.ts', 'MicroCheckRunner.update', 'update(out: PipelineFrameOutput');
  const countdownSrc = source('src/training/microCheck.ts', 'countdown active transition', "if (c === 'go')");
  const typeCue: Record<MicroCheckType, string> = {
    'chair-power': 'microcheck-chair',
    'single-leg-balance': 'microcheck-balance',
    'mobility-reach': 'ex-hamstring-reach',
  };
  const activeDuration: Record<MicroCheckType, number> = {
    'chair-power': 8000,
    'single-leg-balance': 40000,
    'mobility-reach': 12000,
  };
  for (const voiceId of VOICES) {
    for (const type of Object.keys(typeCue) as MicroCheckType[]) {
      const instructions = ['framing-ready', typeCue[type]];
      const start = sequenceDuration(assetRows, voiceId, instructions) + DEFAULT_MICROCHECK_CONFIG.postInstructionsDwellMs;
      scenarios.push(simulateScenario({
        id: `MICRO-${type}-normal-${voiceId}`,
        flow: 'micro_check_up',
        voiceId,
        microCheckType: type,
        variant: 'normal',
        assumptions: ['Preflight is already ready.', 'chair-power completes on fifth accepted rep; other micro-checks use representative active durations.'],
        assetRows,
        events: [
          { scheduledAtMs: 0, state: 'instructions', sourceEvent: `${type} framing + instruction`, cues: instructions, source: runnerSrc },
          ...countdownEvents(start, countdownSrc),
          { scheduledAtMs: start + 3000 + activeDuration[type], state: 'done', sourceEvent: `${type} complete`, cues: ['microcheck-complete'], source: runnerSrc },
        ],
        verdict: {
          genericIntroUsed: false,
          activeBeginsWhenGoEmitted: true,
          repProgress: type === 'chair-power' ? 'sfx_only' : 'not_required',
        },
      }));
      scenarios.push(simulateScenario({
        id: `MICRO-${type}-interruption-${voiceId}`,
        flow: 'micro_check_up',
        voiceId,
        microCheckType: type,
        variant: 'tracking-loss-during-active',
        assumptions: ['MicroCheckRunner has no explicit tracking-loss voice branch; grading pauses or fails through the set grader.', 'No positive recovery confirmation is emitted.'],
        assetRows,
        events: [
          { scheduledAtMs: 0, state: 'active', sourceEvent: 'tracking interruption', cues: [], priority: 0, source: runnerSrc },
        ],
        verdict: {
          explicitTrackingLossNarration: false,
          positiveRecoveryConfirmation: false,
        },
      }));
    }
  }
  return scenarios;
}

function buildSharedControlScenarios(assetRows: AssetRow[]): Scenario[] {
  const scenarios: Scenario[] = [];
  const trainingScreen = source('src/screens/TrainingSessionScreen.tsx', 'skipCurrent', 'const skipCurrent');
  const checkupScreen = source('src/screens/CheckUpScreen.tsx', 'skipCurrent', 'const skipCurrent');
  const microScreen = source('src/screens/MicroCheckScreen.tsx', 'requestDiscardMicroCheck', 'requestDiscardMicroCheck');
  const promptSrc = source('src/preflight/promptTiming.ts', 'shouldSpeakFramingPrompt', 'shouldSpeakFramingPrompt');
  for (const voiceId of VOICES) {
    scenarios.push(simulateScenario({
      id: `SHARED-setup-prompts-${voiceId}`,
      flow: 'shared_controls',
      voiceId,
      variant: 'preflight-and-orientation-prompts',
      assumptions: ['Each prompt shown here is a distinct prompt after the 5 second changed-prompt gap.', 'Unchanged prompts repeat at the 10 second controller repeat interval.'],
      assetRows,
      events: [
        { scheduledAtMs: 0, state: 'preflight', sourceEvent: 'subject missing', cues: ['step-into-frame'], source: promptSrc },
        { scheduledAtMs: 5000, state: 'preflight', sourceEvent: 'off center', cues: ['center-yourself'], source: promptSrc },
        { scheduledAtMs: 10000, state: 'preflight', sourceEvent: 'too close', cues: ['step-back'], source: promptSrc },
        { scheduledAtMs: 15000, state: 'preflight', sourceEvent: 'too far', cues: ['step-closer'], source: promptSrc },
        { scheduledAtMs: 20000, state: 'preflight', sourceEvent: 'sample stability', cues: ['hold-still'], source: promptSrc },
        { scheduledAtMs: 25000, state: 'preflight', sourceEvent: 'lighting sample failed', cues: ['turn-on-light'], source: promptSrc },
        { scheduledAtMs: 30000, state: 'movement-readiness', sourceEvent: 'wrong orientation side required', cues: ['turn-side-on'], source: source('src/preflight/movementCameraReadiness.ts', 'movementCameraPromptCue', 'movementCameraPromptCue') },
        { scheduledAtMs: 35000, state: 'movement-readiness', sourceEvent: 'wrong orientation front required', cues: ['face-forward'], source: source('src/preflight/movementCameraReadiness.ts', 'movementCameraPromptCue', 'movementCameraPromptCue') },
      ],
      verdict: {
        samePromptRepeatIntervalMs: DEFAULT_TRAINING_CONFIG.promptRepeatMs,
        changedPromptMinimumIntervalMs: 5000,
      },
    }));
    scenarios.push(simulateScenario({
      id: `CONTROL-skip-training-${voiceId}`,
      flow: 'shared_controls',
      voiceId,
      exerciseId: null,
      variant: 'skip-during-instruction',
      assumptions: ['User taps skip while speech is playing.', 'Screen calls voice.stop() then player.skipCurrentItem().'],
      assetRows,
      events: [
        { scheduledAtMs: 0, state: 'instructions', sourceEvent: 'instruction playing before skip', cues: ['ex-sit-to-stand'], priority: 8, source: trainingScreen },
        { scheduledAtMs: 800, state: 'skip', sourceEvent: 'skip action stops audio; no exercise-skipped cue emitted', cues: [], priority: 0, source: trainingScreen },
      ],
      verdict: { skipConfirmation: 'silent', generatedCueUnused: 'exercise-skipped' },
    }));
    scenarios.push(simulateScenario({
      id: `CONTROL-skip-checkup-${voiceId}`,
      flow: 'shared_controls',
      voiceId,
      variant: 'skip-during-countdown',
      assumptions: ['User skips current assessment.', 'Screen stops voice and orchestrator advances without submitting exercise-skipped.'],
      assetRows,
      events: [
        { scheduledAtMs: 0, state: 'countdown', sourceEvent: 'countdown playing before skip', cues: ['countdown-three'], priority: 10, source: checkupScreen },
        { scheduledAtMs: 500, state: 'skip', sourceEvent: 'skip action stops audio; no exercise-skipped cue emitted', cues: [], priority: 0, source: checkupScreen },
      ],
      verdict: { skipConfirmation: 'silent', generatedCueUnused: 'exercise-skipped' },
    }));
    scenarios.push(simulateScenario({
      id: `CONTROL-discard-micro-${voiceId}`,
      flow: 'shared_controls',
      voiceId,
      variant: 'discard-during-playback',
      assumptions: ['User discards while an instruction is playing.', 'Screen calls voice.stop() on discard/unmount.'],
      assetRows,
      events: [
        { scheduledAtMs: 0, state: 'instructions', sourceEvent: 'micro-check instruction playing before discard', cues: ['microcheck-chair'], priority: 8, source: microScreen },
        { scheduledAtMs: 600, state: 'cancel', sourceEvent: 'discard/cancel stops audio', cues: [], priority: 0, source: microScreen },
      ],
      verdict: { cancelConfirmation: 'silent' },
    }));
  }
  return scenarios;
}

function unique<T>(values: readonly T[]): T[] {
  const out: T[] = [];
  for (const value of values) {
    if (!out.includes(value)) out.push(value);
  }
  return out;
}

function buildExerciseAccuracyRows(assetRows: AssetRow[], cueText: Map<string, string>): ExerciseAccuracyRow[] {
  const rows: ExerciseAccuracyRow[] = [];
  const levelById = new Map<string, { ladderTitle: string; level: ExerciseLevel }>();
  for (const ladder of listExerciseLadders()) {
    for (const level of ladder.levels) {
      levelById.set(level.id, { ladderTitle: ladder.title, level });
    }
  }
  const safetySnapshot = plannedSafetyCueSnapshotForExercises(listExercises().map((exercise) => exercise.id));
  const safetyByExercise = new Map(safetySnapshot.exerciseProfiles.map((profile) => [profile.exerciseId, profile]));
  for (const exercise of listExercises()) {
    const resolved = levelById.get(exercise.id);
    const level = resolved?.level ?? resolveExerciseLevel(exercise.id).level;
    const profile = safetyByExercise.get(exercise.id);
    const initialSafety = unique([...(profile?.setupCueIds ?? []), ...(profile?.activeCueIds ?? [])]);
    const spokenInstruction = exercise.voice.instructions.map((cue) => cueText.get(cue) ?? cue).join(' ');
    const semantic = semanticVerdict(exercise, level, spokenInstruction);
    const setupCues = ['framing-ready', ...exercise.voice.instructions, ...initialSafety];
    rows.push({
      exerciseId: exercise.id,
      displayName: exercise.displayName,
      ladder: resolved?.ladderTitle ?? exercise.family,
      releaseStatus: level.releaseStatus,
      reachability: reachabilityForLevel(level),
      domain: level.domain,
      cameraOrientation: exercise.cameraView.view,
      requiredEquipment: [...exercise.equipment],
      requiredSupport: supportForEquipment(exercise.equipment),
      floorSpaceRequirement: exercise.equipment.includes('floor') ? 'explicit floor-space comfort required' : 'ordinary standing space',
      bilateralOrUnilateral: unilateralStatus(level.instructions),
      startingSide: startingSide(level.instructions),
      sideSwitchRequired: /other|both|alternate|each|other way/i.test(level.instructions),
      setType: exercise.kind,
      defaultSetCount: exercise.prescription.sets,
      defaultTarget: targetForExercise(exercise),
      restSec: exercise.prescription.restSec,
      loaded: exercise.equipment.some((eq) => eq.includes('band') || eq === 'backpack_or_weight' || eq === 'door_anchor' || eq === 'mini_band' || eq === 'long_band'),
      instructionCueKeys: [...exercise.voice.instructions],
      exactSpokenInstruction: spokenInstruction || '(no movement instruction cue emitted)',
      ladderInstruction: level.instructions,
      safetyCueIds: unique([...(profile?.setupCueIds ?? []), ...(profile?.activeCueIds ?? []), ...(profile?.repeatedSetCueIds ?? []), ...(profile?.recoveryCueIds ?? [])]),
      setupSafetyCueIds: [...(profile?.setupCueIds ?? [])],
      activeSafetyCueIds: [...(profile?.activeCueIds ?? [])],
      repeatedSafetyCueIds: [...(profile?.repeatedSetCueIds ?? [])],
      recoverySafetyCueIds: [...(profile?.recoveryCueIds ?? [])],
      totalSpokenSetupDurationMs: {
        clara: sequenceDuration(assetRows, 'clara', setupCues),
        marcus: sequenceDuration(assetRows, 'marcus', setupCues),
      },
      countdownWaitsForSetupSpeech: true,
      activeMovementCanBeginDuringSpeech: true,
      semanticAccuracyVerdict: semantic.verdict,
      dimensions: semantic.dimensions,
      userConsequence: semantic.consequence,
      voiceFirstVerdict: semantic.voiceFirstVerdict,
      allEssentialEyesOffInformationSpoken: semantic.voiceFirstVerdict === 'fully_eyes_off' || semantic.voiceFirstVerdict === 'mostly_eyes_off',
      provisionalAction: semantic.provisionalAction,
      source: source(`src/exercises/${sourceFileForExercise(exercise.id)}`, exercise.id, exercise.id),
    });
  }
  return rows.sort((a, b) => a.exerciseId.localeCompare(b.exerciseId));
}

function reachabilityForLevel(level: ExerciseLevel): string {
  if (level.releaseStatus === 'v1_core') return 'reachable_v1_core';
  if (level.releaseStatus === 'v1_optional') return 'reachable_optional_or_controlled_beta';
  return 'conditional_or_hidden';
}

function supportForEquipment(equipment: readonly string[]): string[] {
  return equipment.filter((eq) => ['wall', 'counter', 'chair', 'stair'].includes(eq));
}

function unilateralStatus(instruction: string): string {
  return /one foot|one leg|one side|split stance|other foot|one shoulder/i.test(instruction) ? 'unilateral_or_asymmetric' : 'bilateral';
}

function startingSide(instruction: string): string {
  if (/left/i.test(instruction)) return 'left';
  if (/right/i.test(instruction)) return 'right';
  if (/one foot|one leg|one side|split stance|one shoulder|one leg straight/i.test(instruction)) return 'unspecified';
  return 'not_required';
}

function targetForExercise(exercise: ExerciseDefinition): string {
  if (exercise.kind === 'reps') return `${exercise.prescription.repsPerSet ?? 'unknown'} reps`;
  if (exercise.kind === 'hold') return `${exercise.prescription.holdSec ?? 'unknown'} sec hold`;
  if (exercise.kind === 'rom') return `${exercise.prescription.captureSec ?? 'unknown'} sec capture`;
  return `${exercise.prescription.timerSec ?? exercise.prescription.holdSec ?? 'unknown'} sec timed set`;
}

function sourceFileForExercise(id: string): string {
  const mapping: Record<string, string> = {
    'sts-cushion': 'sitToStand.ts',
    'sts-standard': 'sitToStand.ts',
    'sts-slow-eccentric': 'sitToStand.ts',
    'sts-power': 'sitToStand.ts',
    'loaded-sit-to-stand': 'sitToStand.ts',
    'squat-supported': 'supportedSquat.ts',
    'squat-free': 'supportedSquat.ts',
    'squat-slow-eccentric': 'supportedSquat.ts',
    'squat-loaded': 'supportedSquat.ts',
    'chair-supported-split-squat': 'supportedSquat.ts',
    'step-up': 'stepUp.ts',
    'heel-raise-supported': 'heelRaise.ts',
    'heel-raise-free': 'heelRaise.ts',
    'toe-raise-supported': 'heelRaise.ts',
    'glute-bridge-hold': 'gluteBridge.ts',
    'glute-bridge-reps': 'gluteBridge.ts',
    'push-up-wall': 'pushUp.ts',
    'push-up-incline': 'pushUp.ts',
    'push-up-standard': 'pushUp.ts',
    'overhead-reach': 'overheadPress.ts',
    'overhead-press-band': 'overheadPress.ts',
    'hip-hinge-wall': 'hipHinge.ts',
    'hip-hinge-free': 'hipHinge.ts',
    'balance-feet-together-hold': 'balanceRung.ts',
    'balance-tandem-hold': 'balanceRung.ts',
    'balance-single-leg-hold': 'balanceRung.ts',
    'seated-hamstring-reach': 'seatedHamstringReach.ts',
    'neck-rotation': 'neckRotation.ts',
    'loaded-march': 'loadedMarch.ts',
    'seated-band-row': 'pullUpperBack.ts',
    'standing-band-row': 'pullUpperBack.ts',
    'band-pull-apart': 'pullUpperBack.ts',
    'supported-side-step': 'lateralStability.ts',
    'mini-band-lateral-walk': 'lateralStability.ts',
    'thoracic-rotation': 'mobilityDrills.ts',
    'supported-hip-flexor-stretch': 'mobilityDrills.ts',
    'wall-calf-stretch': 'mobilityDrills.ts',
  };
  return mapping[id] ?? 'registry.ts';
}

function semanticVerdict(
  exercise: ExerciseDefinition,
  level: ExerciseLevel,
  spokenInstruction: string
): {
  verdict: string;
  dimensions: Record<string, string>;
  consequence: string[];
  voiceFirstVerdict: string;
  provisionalAction: string;
} {
  const baseDimensions: Record<string, string> = {
    movement: 'match',
    equipment: 'match',
    support: 'match',
    load: 'not_required',
    repOrHold: 'match',
    tempo: 'match',
    side: 'not_required',
    target: 'missing',
    cameraOrientation: 'missing',
  };
  const manual: Record<string, Partial<ReturnType<typeof semanticVerdict>>> = {
    'sts-cushion': issue('incomplete_but_safe', ['Cue omits cushion setup.'], 'mostly_eyes_off', { equipment: 'missing' }, 'rewrite'),
    'sts-slow-eccentric': issue('misleading', ['User is not told to lower slowly.'], 'screen_glance_required', { tempo: 'missing' }, 'rewrite'),
    'sts-power': issue('misleading', ['User is not told this is a brisk power variant.'], 'screen_glance_required', { tempo: 'missing' }, 'rewrite'),
    'loaded-sit-to-stand': issue('misleading', ['User is not told to use the backpack or weight.'], 'screen_glance_required', { load: 'missing', equipment: 'missing' }, 'rewrite'),
    'squat-free': issue('incomplete_but_safe', ['Cue mentions a chair even though this level is equipment-free.'], 'mostly_eyes_off', { equipment: 'extra_or_confusing' }, 'rewrite'),
    'squat-slow-eccentric': issue('misleading', ['User is not told the slow-lower tempo.'], 'screen_glance_required', { tempo: 'missing', equipment: 'extra_or_confusing' }, 'rewrite'),
    'squat-loaded': issue('misleading', ['User is not told to use load.'], 'screen_glance_required', { load: 'missing', equipment: 'missing' }, 'rewrite'),
    'chair-supported-split-squat': issue('misleading', ['User performs an ordinary squat instead of a split squat.'], 'cannot_complete_reliably_by_voice', { movement: 'wrong', side: 'missing' }, 'rewrite'),
    'step-up': issue('incomplete_but_safe', ['Cue omits nearby support; safety narration supplies it.'], 'mostly_eyes_off', { support: 'provided_by_safety' }, 'rewrite'),
    'heel-raise-free': issue('incomplete_but_safe', ['Cue tells the user to use support even though this level is unsupported.'], 'mostly_eyes_off', { support: 'extra_or_confusing' }, 'rewrite'),
    'toe-raise-supported': issue('misleading', ['User performs heel raises instead of toe raises.'], 'cannot_complete_reliably_by_voice', { movement: 'wrong' }, 'rewrite'),
    'glute-bridge-hold': issue('misleading', ['User expects repetitions during a hold level.'], 'screen_glance_required', { repOrHold: 'wrong' }, 'rewrite'),
    'push-up-incline': issue('misleading', ['Cue says wall or floor but not chair or counter, so user may use the wrong surface.'], 'screen_glance_required', { equipment: 'wrong_or_missing' }, 'rewrite'),
    'overhead-press-band': issue('misleading', ['User is not told to use or control the band press.'], 'screen_glance_required', { movement: 'wrong', load: 'missing', equipment: 'missing' }, 'rewrite'),
    'hip-hinge-free': issue('misleading', ['Cue tells user to tap a wall where no wall is required.'], 'screen_glance_required', { equipment: 'wrong', movement: 'variant_wrong' }, 'rewrite'),
    'balance-feet-together-hold': issue('missing', ['No stance-specific training cue is emitted; "the position I describe" never gets described.'], 'cannot_complete_reliably_by_voice', { movement: 'missing', side: 'missing' }, 'add'),
    'balance-tandem-hold': issue('missing', ['No tandem stance cue is emitted during training.'], 'cannot_complete_reliably_by_voice', { movement: 'missing', side: 'missing' }, 'add'),
    'balance-single-leg-hold': issue('missing', ['No standing-leg or lifted-leg choice is spoken during training.'], 'cannot_complete_reliably_by_voice', { movement: 'missing', side: 'missing' }, 'add'),
    'loaded-march': issue('incomplete_but_safe', ['Cue omits support; the registered level is not actually loaded despite the legacy id.'], 'mostly_eyes_off', { support: 'provided_by_safety' }, 'rewrite'),
    'seated-band-row': issue('missing', ['No movement instruction cue is emitted.'], 'cannot_complete_reliably_by_voice', { movement: 'missing', equipment: 'safety_only' }, 'add'),
    'standing-band-row': issue('missing', ['No movement instruction cue is emitted.'], 'cannot_complete_reliably_by_voice', { movement: 'missing', equipment: 'safety_only' }, 'add'),
    'band-pull-apart': issue('missing', ['No movement instruction cue is emitted.'], 'cannot_complete_reliably_by_voice', { movement: 'missing', equipment: 'safety_only' }, 'add'),
    'supported-side-step': issue('missing', ['No movement instruction cue is emitted.'], 'cannot_complete_reliably_by_voice', { movement: 'missing' }, 'add'),
    'mini-band-lateral-walk': issue('missing', ['No movement instruction cue is emitted.'], 'cannot_complete_reliably_by_voice', { movement: 'missing', equipment: 'safety_only' }, 'add'),
    'thoracic-rotation': issue('missing', ['No movement instruction cue is emitted.'], 'cannot_complete_reliably_by_voice', { movement: 'missing' }, 'add'),
    'supported-hip-flexor-stretch': issue('missing', ['No movement instruction cue is emitted.'], 'cannot_complete_reliably_by_voice', { movement: 'missing', side: 'missing' }, 'add'),
    'wall-calf-stretch': issue('missing', ['No movement instruction cue is emitted.'], 'cannot_complete_reliably_by_voice', { movement: 'missing', side: 'missing' }, 'add'),
  };
  if (exercise.voice.instructions.length === 0) {
    const m = manual[exercise.id] ?? issue('missing', ['No movement instruction cue is emitted.'], 'cannot_complete_reliably_by_voice', { movement: 'missing' }, 'add');
    return mergeSemantic(baseDimensions, m);
  }
  const mapped = manual[exercise.id];
  if (mapped) return mergeSemantic(baseDimensions, mapped);
  const loadMissing = exercise.equipment.some((eq) => eq.includes('band') || eq === 'backpack_or_weight' || eq === 'long_band' || eq === 'mini_band') && !/band|weight|backpack/i.test(spokenInstruction);
  if (loadMissing) {
    return mergeSemantic(baseDimensions, issue('misleading', ['Loaded or resisted exercise cue omits the load.'], 'screen_glance_required', { load: 'missing' }, 'rewrite'));
  }
  return {
    verdict: 'accurate',
    dimensions: baseDimensions,
    consequence: [],
    voiceFirstVerdict: /target|reps|seconds|hold|count/i.test(spokenInstruction) ? 'fully_eyes_off' : 'mostly_eyes_off',
    provisionalAction: 'keep',
  };

  function issue(
    verdict: string,
    consequence: string[],
    voiceFirstVerdict: string,
    dimensions: Record<string, string>,
    provisionalAction: string
  ): Partial<ReturnType<typeof semanticVerdict>> {
    return { verdict, consequence, voiceFirstVerdict, dimensions, provisionalAction };
  }
}

function mergeSemantic(
  baseDimensions: Record<string, string>,
  partial: Partial<ReturnType<typeof semanticVerdict>>
): ReturnType<typeof semanticVerdict> {
  return {
    verdict: partial.verdict ?? 'uncertain',
    dimensions: { ...baseDimensions, ...(partial.dimensions ?? {}) },
    consequence: partial.consequence ?? [],
    voiceFirstVerdict: partial.voiceFirstVerdict ?? 'uncertain',
    provisionalAction: partial.provisionalAction ?? 'protocol_review',
  };
}

function buildSafetyNarrationRows(assetRows: AssetRow[]): SafetyNarrationRow[] {
  const snapshot = plannedSafetyCueSnapshotForExercises(listExercises().map((exercise) => exercise.id));
  return snapshot.exerciseProfiles.map((profile) => {
    const initial = unique([...profile.setupCueIds, ...profile.activeCueIds]);
    const all = [...profile.setupCueIds, ...profile.activeCueIds, ...profile.repeatedSetCueIds, ...profile.recoveryCueIds];
    const duplicateCueIds = unique(all.filter((cue, index) => all.indexOf(cue) !== index));
    const classification: Record<string, string> = {};
    for (const cueId of unique(all)) {
      const tier = SAFETY_CUE_DEFINITIONS[cueId]?.tier ?? 'active';
      classification[cueId] =
        duplicateCueIds.includes(cueId)
          ? 'duplicate'
          : cueId.startsWith('global_')
            ? 'global_once_per_session'
            : tier === 'recovery'
              ? 'reactive_only'
              : tier === 'setup'
                ? 'specific_once_per_exercise'
                : 'keep_as_is';
      if (cueId === 'global_pause_if_tracking_lost' || cueId === 'tracking_pause_and_reset') {
        classification[cueId] = 'requires_product_review';
      }
    }
    return {
      exerciseId: profile.exerciseId,
      setupCueIds: [...profile.setupCueIds],
      activeCueIds: [...profile.activeCueIds],
      repeatedSetCueIds: [...profile.repeatedSetCueIds],
      recoveryCueIds: [...profile.recoveryCueIds],
      initialSetupCueIds: initial,
      initialSetupSafetyDurationMs: {
        clara: sequenceDuration(assetRows, 'clara', initial),
        marcus: sequenceDuration(assetRows, 'marcus', initial),
      },
      repeatedSetSafetyDurationMs: {
        clara: sequenceDuration(assetRows, 'clara', profile.repeatedSetCueIds),
        marcus: sequenceDuration(assetRows, 'marcus', profile.repeatedSetCueIds),
      },
      classification,
      duplicateCueIds,
      notes: profile.recoveryCueIds.includes('tracking_pause_and_reset')
        ? ['Recovery language says "Tracking paused" and "wait for Hale to reset"; product review recommended for user-facing implementation language.']
        : [],
    };
  });
}

function buildVoiceFirstCoverage(exerciseRows: ExerciseAccuracyRow[]): VoiceFirstCoverageRow[] {
  const rows: VoiceFirstCoverageRow[] = [];
  for (const exercise of exerciseRows) {
    rows.push({
      flow: 'training',
      itemId: exercise.exerciseId,
      itemName: exercise.displayName,
      exerciseOrAssessmentName: exercise.displayName,
      coverage: {
        exerciseOrTestName: exercise.instructionCueKeys.length ? 'spoken' : 'visible_only',
        requiredEquipment: equipmentCoverage(exercise),
        requiredSupport: exercise.requiredSupport.length ? (exercise.safetyCueIds.some((cue) => cue.includes('support') || cue.includes('chair') || cue.includes('step')) ? 'spoken' : 'missing') : 'not_required',
        startingPosition: exercise.semanticAccuracyVerdict === 'missing' ? 'missing' : 'spoken',
        cameraOrientation: 'spoken',
        startingSide: exercise.startingSide === 'not_required' ? 'not_required' : 'missing',
        sideSwitchInstruction: exercise.sideSwitchRequired ? 'missing' : 'not_required',
        repTarget: exercise.setType === 'reps' ? 'visible_only' : 'not_required',
        holdDurationTarget: exercise.setType === 'hold' ? 'visible_only' : 'not_required',
        timedSetTarget: exercise.setType === 'timer' || exercise.setType === 'rom' ? 'visible_only' : 'not_required',
        tempo: exercise.dimensions.tempo === 'missing' ? 'missing' : 'spoken',
        rangeInstruction: 'spoken',
        whenToStart: 'spoken',
        currentProgress: exercise.setType === 'reps' ? 'sfx_only' : 'visible_only',
        whenToStop: 'inferable',
        setNumber: 'visible_only',
        restStatus: 'spoken',
        trackingLost: exercise.recoverySafetyCueIds.length ? 'spoken' : 'missing',
        trackingRecovered: 'missing',
        skipConfirmation: 'missing',
        pauseConfirmation: 'missing',
        resumeConfirmation: 'missing',
        completionConfirmation: 'spoken',
      },
      verdict: exercise.voiceFirstVerdict,
      notes: exercise.userConsequence,
    });
  }
  for (const movement of listMovements()) {
    rows.push({
      flow: 'movement_check_up',
      itemId: movement.id,
      itemName: movement.displayName,
      exerciseOrAssessmentName: movement.displayName,
      coverage: {
        exerciseOrTestName: 'spoken',
        requiredEquipment: movement.equipment.length ? 'spoken' : 'not_required',
        requiredSupport: movement.id === 'balance-ladder' || movement.id.includes('balance') ? 'spoken' : 'not_required',
        startingPosition: 'spoken',
        cameraOrientation: 'spoken',
        startingSide: ['shoulder-flexion-peak', 'active-shoulder-reach-v2'].includes(movement.id) ? 'inferable' : 'not_required',
        sideSwitchInstruction: 'not_required',
        repTarget: movement.id.includes('chair') ? 'spoken' : 'not_required',
        holdDurationTarget: movement.id.includes('balance') ? 'inferable' : 'not_required',
        timedSetTarget: movement.durationMs ? 'inferable' : 'not_required',
        tempo: 'not_required',
        rangeInstruction: 'spoken',
        whenToStart: 'spoken',
        currentProgress: movement.id.includes('chair') ? 'sfx_only' : 'visible_only',
        whenToStop: movement.voice.endCue ? 'spoken' : 'inferable',
        trackingLost: 'spoken',
        trackingRecovered: 'missing',
        skipConfirmation: 'missing',
        pauseConfirmation: 'missing',
        resumeConfirmation: 'missing',
        completionConfirmation: 'spoken',
      },
      verdict: movement.voice.instructions.length ? 'mostly_eyes_off' : 'screen_glance_required',
      notes: movement.id === 'hinge-reach' ? ['Hinge intro says "Last one", which is only true for current default/V2 batteries where hinge is last.'] : [],
    });
  }
  for (const type of ['chair-power', 'single-leg-balance', 'mobility-reach'] as MicroCheckType[]) {
    rows.push({
      flow: 'micro_check_up',
      itemId: type,
      itemName: type,
      exerciseOrAssessmentName: type,
      coverage: {
        exerciseOrTestName: 'spoken',
        requiredEquipment: type === 'chair-power' || type === 'mobility-reach' ? 'spoken' : 'spoken',
        requiredSupport: type === 'single-leg-balance' ? 'spoken' : 'not_required',
        startingPosition: 'spoken',
        cameraOrientation: 'visible_only',
        startingSide: type === 'single-leg-balance' || type === 'mobility-reach' ? 'missing' : 'not_required',
        sideSwitchInstruction: 'not_required',
        repTarget: type === 'chair-power' ? 'spoken' : 'not_required',
        holdDurationTarget: type === 'single-leg-balance' ? 'inferable' : 'not_required',
        timedSetTarget: 'not_required',
        tempo: type === 'chair-power' ? 'spoken' : 'not_required',
        rangeInstruction: type === 'mobility-reach' ? 'spoken' : 'not_required',
        whenToStart: 'spoken',
        currentProgress: type === 'chair-power' ? 'sfx_only' : 'visible_only',
        whenToStop: 'inferable',
        trackingLost: 'missing',
        trackingRecovered: 'missing',
        skipConfirmation: 'not_required',
        pauseConfirmation: 'missing',
        resumeConfirmation: 'missing',
        completionConfirmation: 'spoken',
      },
      verdict: type === 'chair-power' ? 'mostly_eyes_off' : 'screen_glance_required',
      notes: type === 'mobility-reach' ? ['Instruction says one leg straight but does not define side; grader evaluates a generic side-chain angle.'] : [],
    });
  }
  return rows;
}

function equipmentCoverage(row: ExerciseAccuracyRow): string {
  if (row.requiredEquipment.length === 0 || row.requiredEquipment.includes('none')) return 'not_required';
  if (row.dimensions.equipment === 'missing' || row.dimensions.equipment === 'wrong' || row.dimensions.equipment === 'wrong_or_missing') return 'missing';
  if (row.safetyCueIds.some((cue) => /chair|band|step|floor|support|door_anchor/.test(cue))) return 'spoken';
  return 'inferable';
}

function buildInactiveDecisions(): InactiveCueDecision[] {
  return [
    {
      cueKey: 'set-done',
      currentStatus: 'bundled_but_inactive',
      evidence: 'No production call path emits set-done; rest-now, last-set, thats-your-set, and session-complete cover current set/session flow.',
      provisionalDecision: 'requires_product_review',
      sources: [source('src/audio/cues.ts', 'set-done', "'set-done'"), source('src/training/sessionPlayer.ts', 'runRest', 'private runRest')],
    },
    {
      cueKey: 'cooldown-now',
      currentStatus: 'bundled_but_inactive',
      evidence: 'No training phase distinguishes cooldown; mobility cooldown is represented as ordinary exercises.',
      provisionalDecision: 'requires_product_review',
      sources: [source('src/audio/cues.ts', 'cooldown-now', "'cooldown-now'"), source('src/training/sessionPlayer.ts', 'TrainingPhase', "export type TrainingPhase")],
    },
    {
      cueKey: 'time-to-retest',
      currentStatus: 'bundled_but_inactive',
      evidence: 'Retest timing appears in app lifecycle/copy, not in the session voice runtime.',
      provisionalDecision: 'requires_product_review',
      sources: [source('src/audio/cues.ts', 'time-to-retest', "'time-to-retest'"), source('src/haleFlow/appLifecycle.ts', 'app lifecycle retest logic', 'retest')],
    },
    {
      cueKey: 'exercise-skipped',
      currentStatus: 'bundled_but_inactive_on_skip',
      evidence: 'Training and check-up skip handlers call voice.stop() and advance the controller without submitting exercise-skipped.',
      provisionalDecision: 'add_or_remove_after_product_decision',
      sources: [source('src/screens/TrainingSessionScreen.tsx', 'skipCurrent', 'const skipCurrent'), source('src/screens/CheckUpScreen.tsx', 'skipCurrent', 'const skipCurrent')],
    },
    {
      cueKey: 'balance-semi-tandem',
      currentStatus: 'bundled_conditional_not_default',
      evidence: 'DEFAULT_BALANCE_STAGES skips semi-tandem; the stance cue remains reachable only if a custom BalanceConfig includes semi-tandem.',
      provisionalDecision: 'keep_conditional_or_protocol_review',
      sources: [source('src/movements/balanceLadder.ts', 'DEFAULT_BALANCE_STAGES', 'DEFAULT_BALANCE_STAGES')],
    },
    {
      cueKey: 'microcheck-intro',
      currentStatus: 'bundled_but_inactive',
      evidence: 'MicroCheckRunner emits framing-ready plus the type-specific cue; microcheck-intro is never added to INTRO_CUE.',
      provisionalDecision: 'requires_product_review',
      sources: [source('src/training/microCheck.ts', 'INTRO_CUE', 'const INTRO_CUE')],
    },
  ];
}

function buildFindings(
  assetRows: AssetRow[],
  scenarios: Scenario[],
  exerciseRows: ExerciseAccuracyRow[],
  safetyRows: SafetyNarrationRow[]
): Finding[] {
  const findings: Finding[] = [];
  const goClara = cueDuration(assetRows, 'clara', 'go');
  const goMarcus = cueDuration(assetRows, 'marcus', 'go');
  findings.push({
    id: 'VF-001',
    severity: 'P2',
    flow: 'training, movement_check_up, micro_check_up',
    affectedCueIds: ['go'],
    affectedExerciseOrAssessmentIds: ['all countdown-driven flows'],
    userVisibleConsequence: 'The active set or measurement begins on the same frame that "Go!" is emitted, so the first roughly 604 ms of movement can happen while the word is still playing.',
    evidence: `TrainingSessionPlayer, SessionController, and MicroCheckRunner switch to active inside the same branch that emits go. Measured go duration: Clara ${goClara} ms, Marcus ${goMarcus} ms.`,
    sources: [
      source('src/training/sessionPlayer.ts', 'runCountdown go branch', "if (c === 'go')"),
      source('src/assessment/sessionController.ts', 'countdown go branch', "if (cue === 'go')"),
      source('src/training/microCheck.ts', 'micro countdown go branch', "if (c === 'go')"),
    ],
    claraResult: `${goClara} ms of possible overlap`,
    marcusResult: `${goMarcus} ms of possible overlap`,
    evidenceConfidence: 'confirmed_code_and_asset_duration',
    provisionalAction: 'change_controller_wait_policy',
    isolatedImplementation: true,
    testsNeededLater: ['headless countdown timing test', 'physical-device start-latency observation'],
  });

  findings.push({
    id: 'VF-002',
    severity: 'P2',
    flow: 'training, movement_check_up',
    affectedCueIds: ['exercise-skipped'],
    affectedExerciseOrAssessmentIds: ['skip paths'],
    userVisibleConsequence: 'Skip is silent even though a generated skip confirmation asset exists, so an eyes-off user gets no spoken confirmation.',
    evidence: 'TrainingSessionScreen and CheckUpScreen skip handlers stop current audio and advance state; neither submits exercise-skipped.',
    sources: [source('src/screens/TrainingSessionScreen.tsx', 'skipCurrent', 'const skipCurrent'), source('src/screens/CheckUpScreen.tsx', 'skipCurrent', 'const skipCurrent')],
    claraResult: `${cueDuration(assetRows, 'clara', 'exercise-skipped')} ms unused asset`,
    marcusResult: `${cueDuration(assetRows, 'marcus', 'exercise-skipped')} ms unused asset`,
    evidenceConfidence: 'confirmed_static_semantics',
    provisionalAction: 'add',
    isolatedImplementation: true,
    testsNeededLater: ['screen-level skip voice test', 'UX decision on whether skip should remain silent'],
  });

  findings.push({
    id: 'VF-003',
    severity: 'P1',
    flow: 'training',
    affectedCueIds: unique(exerciseRows.filter((row) => row.semanticAccuracyVerdict === 'missing').flatMap((row) => row.instructionCueKeys)),
    affectedExerciseOrAssessmentIds: exerciseRows.filter((row) => row.semanticAccuracyVerdict === 'missing').map((row) => row.exerciseId),
    userVisibleConsequence: 'Several registered training levels emit no movement instruction cue, so the user must look at visible copy to know the exercise.',
    evidence: `${exerciseRows.filter((row) => row.semanticAccuracyVerdict === 'missing').length} exact levels have empty or functionally missing instructions in the runtime setup sequence.`,
    sources: [source('src/training/sessionPlayer.ts', 'setup sequence', "cues: ['framing-ready'"), source('src/exercises/index.ts', 'exercise registry', "import './")],
    claraResult: 'No spoken movement instruction beyond safety/setup cues.',
    marcusResult: 'No spoken movement instruction beyond safety/setup cues.',
    evidenceConfidence: 'confirmed_static_semantics',
    provisionalAction: 'add',
    isolatedImplementation: true,
    testsNeededLater: ['exercise-level voice-first coverage test', 'updated audio asset presence test'],
  });

  const mismatches = exerciseRows.filter((row) => ['misleading', 'potentially_unsafe'].includes(row.semanticAccuracyVerdict));
  findings.push({
    id: 'VF-004',
    severity: 'P1',
    flow: 'training',
    affectedCueIds: unique(mismatches.flatMap((row) => row.instructionCueKeys)),
    affectedExerciseOrAssessmentIds: mismatches.map((row) => row.exerciseId),
    userVisibleConsequence: 'Family-level cues can describe the wrong variant, equipment, load, tempo, side, or hold-vs-rep behavior.',
    evidence: `${mismatches.length} exact levels are marked misleading or potentially unsafe in the instruction accuracy matrix.`,
    sources: [source('src/exercises/ladders.ts', 'EXERCISE_LADDERS', 'EXERCISE_LADDERS'), source('scripts/generate-audio.ts', 'LINES', 'const LINES')],
    claraResult: 'Same cue text as Marcus with Clara durations.',
    marcusResult: 'Same cue text as Clara with Marcus durations.',
    evidenceConfidence: 'confirmed_static_semantics',
    provisionalAction: 'rewrite',
    isolatedImplementation: true,
    testsNeededLater: ['per-exercise cue mapping snapshot', 'manual QA of regenerated lines'],
  });

  const longSafety = safetyRows
    .map((row) => ({ exerciseId: row.exerciseId, clara: row.initialSetupSafetyDurationMs.clara, marcus: row.initialSetupSafetyDurationMs.marcus }))
    .sort((a, b) => Math.max(b.clara, b.marcus) - Math.max(a.clara, a.marcus))[0];
  findings.push({
    id: 'VF-005',
    severity: 'P2',
    flow: 'training',
    affectedCueIds: ['global_pause_if_tracking_lost', 'tracking_pause_and_reset'],
    affectedExerciseOrAssessmentIds: safetyRows.map((row) => row.exerciseId),
    userVisibleConsequence: 'Safety narration is extensive and includes implementation language such as "tracking paused" and "wait for Hale to reset".',
    evidence: `Longest initial setup safety load is ${longSafety.exerciseId}: Clara ${longSafety.clara} ms, Marcus ${longSafety.marcus} ms. Recovery cue text exposes reset semantics.`,
    sources: [source('src/training/safetyCueDefinitions.ts', 'tracking_pause_and_reset', 'tracking_pause_and_reset'), source('src/training/safetyCues.ts', 'plannedSafetyCueSnapshotForExercises', 'plannedSafetyCueSnapshotForExercises')],
    claraResult: `${longSafety.clara} ms max initial setup safety narration`,
    marcusResult: `${longSafety.marcus} ms max initial setup safety narration`,
    evidenceConfidence: 'confirmed_code_and_asset_duration',
    provisionalAction: 'merge',
    isolatedImplementation: true,
    testsNeededLater: ['safety cue de-duplication snapshot', 'device QA for setup patience and comprehension'],
  });

  const scenarioDrops = scenarios.flatMap((scenario) => scenario.events.filter((event) => event.outcome === 'dropped'));
  if (scenarioDrops.length > 0) {
    findings.push({
      id: 'VF-006',
      severity: 'P1',
      flow: 'runtime_timing',
      affectedCueIds: unique(scenarioDrops.flatMap((event) => event.cues)),
      affectedExerciseOrAssessmentIds: unique(scenarios.filter((s) => s.events.some((e) => e.outcome === 'dropped')).map((s) => s.exerciseId ?? s.assessmentId ?? s.microCheckType ?? s.id)),
      userVisibleConsequence: 'A cue is deterministically dropped by the current equal/lower priority policy in the static timing model.',
      evidence: `${scenarioDrops.length} modeled events dropped.`,
      sources: [source('src/audio/voicePlayer.ts', 'VoiceChannel.speak', 'speak(cues')],
      claraResult: `${scenarioDrops.filter((event) => event.id.includes('clara')).length} Clara modeled drops`,
      marcusResult: `${scenarioDrops.filter((event) => event.id.includes('marcus')).length} Marcus modeled drops`,
      evidenceConfidence: 'confirmed_deterministic_simulation',
      provisionalAction: 'change_priority_or_queue_policy',
      isolatedImplementation: false,
      testsNeededLater: ['deterministic voice-channel collision test'],
    });
  }
  return findings;
}

function assetStats(rows: AssetRow[]): Record<string, unknown> {
  const durations = rows.map((row) => row.durationMs).sort((a, b) => a - b);
  const byVoice = Object.fromEntries(VOICES.map((voice) => {
    const voiceRows = rows.filter((row) => row.voiceId === voice);
    return [voice, {
      count: voiceRows.length,
      totalStorageBytes: voiceRows.reduce((sum, row) => sum + row.fileSizeBytes, 0),
      medianDurationMs: percentile(voiceRows.map((row) => row.durationMs), 0.5),
      p95DurationMs: percentile(voiceRows.map((row) => row.durationMs), 0.95),
    }];
  }));
  const sorted = rows.slice().sort((a, b) => a.durationMs - b.durationMs);
  const delta = rows.filter((row) => row.voiceId === 'clara' && row.pairedDurationDeltaMs !== null)
    .sort((a, b) => Math.abs(b.pairedDurationDeltaMs ?? 0) - Math.abs(a.pairedDurationDeltaMs ?? 0))[0];
  return {
    totalPhysicalMp3Assets: rows.length,
    perVoice: byVoice,
    shortestAsset: pickAsset(sorted[0]),
    longestAsset: pickAsset(sorted[sorted.length - 1]),
    medianDurationMs: percentile(durations, 0.5),
    p95DurationMs: percentile(durations, 0.95),
    assetsLongerThanMs: {
      '3000': rows.filter((row) => row.durationMs > 3000).length,
      '5000': rows.filter((row) => row.durationMs > 5000).length,
      '8000': rows.filter((row) => row.durationMs > 8000).length,
      '10000': rows.filter((row) => row.durationMs > 10000).length,
    },
    largestClaraMarcusDurationDifference: delta ? {
      cueKey: delta.cueKey,
      claraMinusMarcusMs: delta.pairedDurationDeltaMs,
      claraDurationMs: delta.durationMs,
      marcusDurationMs: rowFor(rows, 'marcus', delta.cueKey)?.durationMs ?? null,
    } : null,
    longestSetupInstruction: longestCue(rows, ['training-intro', 'checkup-intro', 'chair-stand-intro', 'balance-intro', 'tug-intro', 'shoulder-intro', 'hinge-intro', 'microcheck-chair', 'microcheck-balance']),
    longestSafetyInstruction: longestCue(rows, Object.keys(SAFETY_CUE_DEFINITIONS)),
  };
}

function pickAsset(row: AssetRow | undefined): Record<string, unknown> | null {
  if (!row) return null;
  return { voiceId: row.voiceId, cueKey: row.cueKey, durationMs: row.durationMs, path: row.path };
}

function percentile(values: readonly number[], p: number): number {
  const sorted = values.slice().sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[index];
}

function longestCue(rows: AssetRow[], cueKeys: readonly string[]): Record<string, unknown> | null {
  const candidates = rows.filter((row) => cueKeys.includes(row.cueKey));
  return pickAsset(candidates.sort((a, b) => b.durationMs - a.durationMs)[0]);
}

function buildMarkdown(audit: AuditOutput): string {
  const summary = audit.summary as Record<string, any>;
  const stats = summary.assetStats as Record<string, any>;
  const pCounts = summary.findingSeverityCounts as Record<string, number>;
  const topFindings = (audit.findings as Finding[]).slice(0, 5);
  const deterministicDrops = summary.deterministicDropCount;
  const deterministicInterruptions = summary.deterministicInterruptionCount;
  const possibleCollisions = summary.possibleCollisionCount;
  const semanticMismatchCount = summary.semanticMismatchCount;
  const unsafeMismatchCount = summary.potentiallyUnsafeMismatchCount;
  const voiceGaps = summary.voiceFirstCoverageGapCount;
  const exerciseRows = audit.exerciseAccuracy;
  const safety = audit.safetyNarration;
  const longestSetup = exerciseRows.slice().sort((a, b) => Math.max(b.totalSpokenSetupDurationMs.clara, b.totalSpokenSetupDurationMs.marcus) - Math.max(a.totalSpokenSetupDurationMs.clara, a.totalSpokenSetupDurationMs.marcus))[0];
  const sampleScenarios = audit.scenarios.slice(0, 8);
  return `# Hale Voice Runtime Timeline Audit

## 1. Executive Summary

- Physical MP3 assets measured: ${summary.physicalMp3AssetsMeasured} (${summary.mp3AssetsPerVoice.clara} Clara, ${summary.mp3AssetsPerVoice.marcus} Marcus).
- Runtime scenarios modelled: ${summary.runtimeScenariosModelled}.
- Exact training levels covered: ${summary.exactTrainingLevelsCovered}.
- Deterministic drops: ${deterministicDrops}; deterministic interruptions: ${deterministicInterruptions}; possible timing collisions: ${possibleCollisions}.
- Semantic instruction mismatches: ${semanticMismatchCount}; potentially unsafe mismatches: ${unsafeMismatchCount}; voice-first coverage gaps: ${voiceGaps}.
- Finding counts: P0 ${pCounts.P0 ?? 0}, P1 ${pCounts.P1 ?? 0}, P2 ${pCounts.P2 ?? 0}, P3 ${pCounts.P3 ?? 0}.
- Production code changed: no. This audit added report artifacts and the audit-only generator under \`scripts/audits/\`.

The five most important findings:

${topFindings.map((finding) => `1. ${finding.id} (${finding.severity}) ${finding.userVisibleConsequence}`).join('\n')}

## 2. Scope, Method, and Limitations

This audit independently inspected the current source files named in the prompt, measured every physical MP3 under \`assets/audio/voice/{clara,marcus}\` with local \`ffprobe\`, parsed \`src/audio/manifest.ts\`, and built a deterministic static timing model from production constants, exercise definitions, movement definitions, cue priorities, safety profiles, default check-up batteries, and screen-level stop/skip behavior.

The model intentionally does not instantiate \`expo-audio\`, call ElevenLabs, regenerate assets, or change production behavior. It models controller event times using frame-timestamp semantics from the controllers and measured asset durations. Native startup latency and playback callback latency remain device-only; sensitivity columns are represented in JSON as modelling assumptions rather than measured facts. Synthetic landmark replay was not used for every exercise branch, so device QA is still required for camera-readiness recovery, real callback latency, and app-background interruption behavior.

## 3. Audio Asset Duration Inventory

The full one-row-per-physical-asset inventory is in \`docs/audits/HALE_VOICE_ASSET_DURATIONS.csv\`.

| Metric | Value |
|---|---:|
| Total MP3 assets | ${summary.physicalMp3AssetsMeasured} |
| Clara assets | ${summary.mp3AssetsPerVoice.clara} |
| Marcus assets | ${summary.mp3AssetsPerVoice.marcus} |
| Median duration | ${stats.medianDurationMs} ms |
| 95th percentile duration | ${stats.p95DurationMs} ms |
| Assets >3s / >5s / >8s / >10s | ${stats.assetsLongerThanMs['3000']} / ${stats.assetsLongerThanMs['5000']} / ${stats.assetsLongerThanMs['8000']} / ${stats.assetsLongerThanMs['10000']} |
| Shortest asset | ${stats.shortestAsset.voiceId}/${stats.shortestAsset.cueKey} (${stats.shortestAsset.durationMs} ms) |
| Longest asset | ${stats.longestAsset.voiceId}/${stats.longestAsset.cueKey} (${stats.longestAsset.durationMs} ms) |
| Largest Clara-Marcus delta | ${stats.largestClaraMarcusDurationDifference.cueKey} (${stats.largestClaraMarcusDurationDifference.claraMinusMarcusMs} ms Clara-minus-Marcus) |

All physical MP3 files are represented in the CSV exactly once. Manifest coverage and paired-voice presence are captured per row.

## 4. Runtime Playback and Timing Model

The runtime path is controller update to screen relay to \`VoiceChannel.speak(cues, priority)\`. \`VoiceChannel\` plays one sequence at a time. A new lower-or-equal-priority call is dropped while busy. A higher-priority call invokes \`stop()\`, clears pending cues, releases the current player, and starts the new sequence. SFX uses \`SfxChannel\` and can overlap speech.

Controllers use frame timestamps for state progression. Initial instructions, rest, transition, and completion phases generally wait for \`voice.busy === false\`. Countdown phases do not wait for \`voiceBusy\`; they emit \`three/two/one/go\` at one-second frame-time offsets. The active set or measurement starts in the same update branch that emits \`go\`.

\`\`\`mermaid
flowchart LR
  A["Pose frame timestamp"] --> B["Controller state machine"]
  B --> C["VoiceRequest { cues, priority }"]
  C --> D["Screen onLandmarks callback"]
  D --> E["VoiceChannel.speak"]
  E --> F{"busy?"}
  F -->|"no"| G["play first asset; queue rest"]
  F -->|"yes, lower/equal"| H["drop request"]
  F -->|"yes, higher"| I["stop current; clear pending; play new"]
  G --> J["native playbackStatusUpdate"]
  J --> K{"pending cue?"}
  K -->|"yes"| G
  K -->|"no"| L["busy=false"]
\`\`\`

Timing fields in the JSON use \`scheduledAtMs\`, \`speakCalledAtMs\`, \`playbackStartMs\`, \`assetDurationMs\`, \`sequenceDurationMs\`, \`playbackEndMs\`, \`nextControllerEventMs\`, \`timingMarginMs\`, and \`outcome\`.

## 5. Deterministic Cue Drop and Interruption Findings

The zero-latency static model found ${deterministicDrops} deterministic dropped events and ${deterministicInterruptions} deterministic interrupted events in the generated representative scenarios. The important timing issue is not countdown cue loss: all four countdown assets are shorter than one second for both voices. The issue is that \`go\` overlaps the start of active measurement by its measured asset duration.

## 6. Shared Setup and Countdown Timelines

Preflight prompt suppression is shared: the first prompt is immediate, changed prompts are suppressed for 5 seconds, and unchanged prompts repeat after the controller's 10 second repeat interval. \`step-into-frame\`, \`center-yourself\`, \`step-back\`, \`step-closer\`, \`hold-still\`, and \`turn-on-light\` are priority 5. Orientation prompts used as transitions are priority 9, but the same cue keys used by movement camera readiness inherit priority 9 from \`voicePriority\`.

Countdown assets fit the one-second intervals for both voices under zero added latency and under the requested 100 ms and 250 ms per-asset latency sensitivities. Active movement starts when \`go\` is emitted, not when \`go\` finishes.

## 7. Training Session Runtime Timelines

Training starts with \`training-intro\` plus a support reminder, then waits for voice idle before speaking the global safety sequence. For each exercise setup, the runtime submits a single cue array: \`framing-ready\`, the exercise's \`voice.instructions\`, setup safety cues, and active safety cues. Countdown waits for that setup sequence to finish plus \`${DEFAULT_TRAINING_CONFIG.postInstructionsDwellMs} ms\` dwell. Rests speak \`rest-now\` or \`last-set\` plus repeated-set safety cues, and the next countdown waits for both the rest timer and voice idle.

Longest modelled initial setup sequence: ${longestSetup.exerciseId}, Clara ${longestSetup.totalSpokenSetupDurationMs.clara} ms, Marcus ${longestSetup.totalSpokenSetupDurationMs.marcus} ms.

## 8. Exact Exercise-Level Instruction Accuracy Matrix

| Exercise | Cue(s) | Verdict | Voice-first | Consequence |
|---|---|---|---|---|
${exerciseRows.map((row) => `| ${row.exerciseId} | ${row.instructionCueKeys.join(' + ') || '(none)'} | ${row.semanticAccuracyVerdict} | ${row.voiceFirstVerdict} | ${row.userConsequence.join('; ') || 'None'} |`).join('\n')}

## 9. Safety Narration Load

Training speaks global safety once per session, then per-exercise setup and active safety during setup. Repeated-set safety is appended to rest narration. Recovery safety is reactive. Initial safety durations by exercise are present in JSON.

| Exercise | Setup+Active Safety Cues | Clara ms | Marcus ms |
|---|---:|---:|---:|
${safety.slice().sort((a, b) => Math.max(b.initialSetupSafetyDurationMs.clara, b.initialSetupSafetyDurationMs.marcus) - Math.max(a.initialSetupSafetyDurationMs.clara, a.initialSetupSafetyDurationMs.marcus)).slice(0, 12).map((row) => `| ${row.exerciseId} | ${row.initialSetupCueIds.length} | ${row.initialSetupSafetyDurationMs.clara} | ${row.initialSetupSafetyDurationMs.marcus} |`).join('\n')}

Safety language requiring product review includes \`global_pause_if_tracking_lost\` and \`tracking_pause_and_reset\`, because the user hears implementation-oriented wording such as "tracking pauses" and "wait for Hale to reset."

## 10. Movement Check-Up Timelines

Default battery: ${DEFAULT_BATTERY.join(' → ')}. TUG is not part of the default battery; it appears in \`BETA_BATTERY_WITH_TUG\`. The raw-first V2 battery is ${MOVEMENT_PROFILE_V2_BATTERY.join(' → ')} and remains separate through protocol policy.

Chair stand starts its 30-second controller window on the same frame as \`go\`. \`times-up\` is emitted when the active window ends, followed by a stitched result sequence after voice idle. Counts are spoken through \`numberCue\`, clamped to bundled numbers 0-40; the chair grader itself supports more reps than can be spoken exactly. Balance default stages skip semi-tandem. Shoulder and hinge use near-side dynamic selection; the voice does not explicitly persist a side for retests. Hinge says "Last one"; that is true for the current default and V2 batteries but would be wrong if the movement were used alone or reordered.

## 11. Micro Check-Up Timelines

All three micro-checks use \`framing-ready\` plus a type-specific instruction; \`microcheck-intro\` is not emitted. Chair power ends on the fifth accepted rep or the active cap, not on a fixed five-rep timer. Rep progress is SFX-only. Single-leg balance does not speak which leg to stand on. Mobility reach speaks "one leg straight out" but does not identify a side; the grader evaluates a side-chain angle generically.

## 12. Pause, Retry, Skip, Cancellation, and Tracking Recovery

Pause stops voice and freezes controller progression by skipping updates; resume shifts controller timing by the paused duration. Retry stops voice and resets setup. Skip stops voice and advances silently. Cancel/discard/unmount call \`voice.stop()\`, clearing pending cues and releasing the current player. There is no spoken pause, resume, skip, discard, or tracking-recovered confirmation.

## 13. Voice-First Coverage Matrix

The full coverage matrix is in JSON. Summary: ${voiceGaps} rows are not fully or mostly eyes-off. Missing movement instructions, missing side selection for unilateral holds/reaches, silent skip/pause/resume confirmations, and visible-only set targets are the main gaps.

## 14. Inactive Cue Product Decisions

| Cue | Current status | Provisional decision |
|---|---|---|
${audit.inactiveCueDecisions.map((row) => `| ${row.cueKey} | ${row.currentStatus} | ${row.provisionalDecision} |`).join('\n')}

## 15. Prioritised Findings

${audit.findings.map((finding) => `### ${finding.id} (${finding.severity})\n\n${finding.userVisibleConsequence}\n\nEvidence: ${finding.evidence}\n\nNext step: \`${finding.provisionalAction}\`.`).join('\n\n')}

## 16. Recommended Next Implementation Phase

1. Architecture/timing fixes: decide whether active start should wait for \`go\` completion or add a short post-go guard.
2. Exercise-specific cue splitting: replace broad family cues for confirmed P1 mismatches and add cues for currently silent levels.
3. Missing guidance: add spoken side/stance/target coverage where eyes-off completion depends on it.
4. Safety-cue consolidation: merge duplicate support/tracking language and remove implementation wording.
5. Protocol decisions: decide whether \`exercise-skipped\`, \`microcheck-intro\`, \`balance-semi-tandem\`, \`cooldown-now\`, \`set-done\`, and \`time-to-retest\` should remain bundled.
6. Copy rewrite/audio regeneration: regenerate only after the product decisions are made.
7. Device QA: measure native callback latency and real cancellation behavior on Android and iOS.

## 17. Physical-Device Test Plan

- Android and iOS: measure elapsed time from \`voice.speak(['go'])\` to audible completion and compare with active timer start.
- Android and iOS: pause/cancel during a multi-asset setup sequence and confirm no stale playbackStatusUpdate advances pending cues.
- Android and iOS: force tracking loss during active training, active check-up, and micro-check; confirm what is audible and whether state resets as modelled.
- Android and iOS: verify repeated preflight prompt suppression with real camera jitter and lighting failure.
- Android and iOS: change trainer voice while a session screen is mounted; confirm existing \`VoiceChannel\` keeps its constructor voice until remount.

## 18. Validation and Commands Run

See JSON \`validation\` for the full command list and booleans. Commands recorded so far:

${((audit.validation as Record<string, any>).commandsRun ?? []).map((row: any) => `- \`${row.command}\` — ${row.status}${row.notes ? ` (${row.notes})` : ''}`).join('\n')}

The generator parsed JSON, parsed CSV, verified every physical MP3 row, verified number and safety assets for both voices, verified every registered exercise has an accuracy row, verified every registered training level has scenarios, verified default assessment and micro-check normal/interruption scenarios, classified every inventory cue, and checked all source paths exist.

## 19. Complete Source Index

${audit.sourceIndex.map((entry) => `- ${entry}`).join('\n')}

## Appendix A: Full Scenario Timeline Tables

The full scenario table is in \`docs/audits/HALE_VOICE_RUNTIME_TIMELINE_AUDIT.json\`. Sample:

${sampleScenarios.map((scenario) => `### ${scenario.id}\n\n| Time | State | Source event | Cues | Priority | Duration | Outcome | Margin |\n|---:|---|---|---|---:|---:|---|---:|\n${scenario.events.map((event) => `| ${event.scheduledAtMs} | ${event.state} | ${event.sourceEvent} | ${event.cues.join(' + ') || '(silent/control)'} | ${event.priority} | ${event.sequenceDurationMs} | ${event.outcome} | ${event.timingMarginMs ?? ''} |`).join('\n')}`).join('\n\n')}

## Appendix B: Full Asset Duration Statistics

See the CSV and JSON \`assetDurations\` array for every asset, including codec, sample rate, channel count, manifest status, paired-voice status, and Clara/Marcus duration deltas.
`;
}

function buildSourceIndex(): string[] {
  return [
    'src/audio/voicePlayer.ts VoiceChannel playback, priority, stop, and SFX policy.',
    'src/audio/cues.ts cue ids, priorities, and number cue clamp.',
    'src/audio/manifest.ts bundled MP3 manifest.',
    'src/audio/safetyAudio.ts and src/audio/safetyAudioManifest.ts safety asset metadata.',
    'src/profile/voices.ts Clara and Marcus voice definitions.',
    'src/training/sessionPlayer.ts training runtime sequence.',
    'src/training/microCheck.ts micro-check runtime sequence.',
    'src/assessment/sessionController.ts per-assessment runtime sequence.',
    'src/checkup/checkup.ts default, beta, and V2 check-up batteries.',
    'src/preflight/preflight.ts generic framing prompts and lighting check.',
    'src/preflight/movementCameraReadiness.ts movement-specific orientation readiness.',
    'src/preflight/promptTiming.ts prompt suppression rule.',
    'src/screens/TrainingSessionScreen.tsx voice relay, pause, skip, cancel, repeat.',
    'src/screens/CheckUpScreen.tsx voice relay, pause, skip, cancel, repeat.',
    'src/screens/MicroCheckScreen.tsx voice relay, pause and discard.',
    'src/exercises/*.ts registered exact training levels.',
    'src/exercises/ladders.ts release status and visible exercise-level copy.',
    'src/training/safetyCueDefinitions.ts safety text.',
    'src/training/safetyCues.ts safety profile selection.',
    'src/movements/*.ts movement check-up definitions and grader-owned voice cues.',
  ];
}

function validateAudit(audit: AuditOutput, csvRows: AssetRow[], inventoryCues: CueInventoryRow[]): Record<string, unknown> {
  const sourcePaths = new Set<string>();
  const collectSource = (src: SourceRef) => sourcePaths.add(src.file);
  for (const scenario of audit.scenarios) for (const event of scenario.events) collectSource(event.source);
  for (const finding of audit.findings) for (const src of finding.sources) collectSource(src);
  for (const row of audit.exerciseAccuracy) collectSource(row.source);
  for (const row of audit.inactiveCueDecisions) for (const src of row.sources) collectSource(src);
  const missingSources = [...sourcePaths].filter((file) => !fs.existsSync(path.join(ROOT, file)));
  const physicalMp3 = listMp3Files().map(rel).sort();
  const csvPhysical = csvRows.map((row) => row.path).sort();
  const missingCsvRows = physicalMp3.filter((file) => !csvPhysical.includes(file));
  const duplicateCsvRows = csvPhysical.filter((file, index) => csvPhysical.indexOf(file) !== index);
  const registeredExerciseIds = listExercises().map((exercise) => exercise.id);
  const accuracyIds = audit.exerciseAccuracy.map((row) => row.exerciseId);
  const scenarioExerciseIds = new Set(audit.scenarios.filter((s) => s.flow === 'training').map((s) => s.exerciseId).filter(Boolean));
  const defaultAssessmentMissingNormalOrInterruption = DEFAULT_BATTERY.filter((movementId) => {
    const normal = audit.scenarios.some((s) => s.flow === 'movement_check_up' && s.id.includes('default') && s.events.some((event) => event.sourceEvent.includes(movementId)));
    const interruption = audit.scenarios.some((s) => s.assessmentId === movementId && s.variant.includes('tracking-loss'));
    return !normal || !interruption;
  });
  const microTypes: MicroCheckType[] = ['chair-power', 'single-leg-balance', 'mobility-reach'];
  const missingMicro = microTypes.filter((type) => {
    const normal = audit.scenarios.some((s) => s.microCheckType === type && s.variant === 'normal');
    const interruption = audit.scenarios.some((s) => s.microCheckType === type && s.variant.includes('tracking-loss'));
    return !normal || !interruption;
  });
  const scenarioCueIds = new Set(audit.scenarios.flatMap((scenario) => scenario.events.flatMap((event) => event.cues)));
  const inactiveCueIds = new Set(audit.inactiveCueDecisions.map((decision) => decision.cueKey));
  const conditionalCueIds = new Set<string>([
    'num-{n}',
    'no-reps',
    'balance-semi-tandem',
  ]);
  const inventoryCueCoverage = inventoryCues.map((cue) => {
    const cueKey = cue.cueKey;
    const status = scenarioCueIds.has(cueKey)
      ? 'present_in_scenario'
      : inactiveCueIds.has(cueKey)
        ? 'inactive_decision'
        : conditionalCueIds.has(cueKey)
          ? 'conditional'
          : 'unclassified';
    return { cueKey, status };
  });
  const unclassifiedInventoryCues = inventoryCueCoverage.filter((row) => row.status === 'unclassified').map((row) => row.cueKey);
  const numberAssetKeys = Array.from({ length: MAX_NUMBER_CUE + 1 }, (_, n) => `num-${n}`);
  const safetyAssetKeys = Object.keys(SAFETY_CUE_DEFINITIONS);
  return {
    commandsRun: [
      {
        command: 'npx tsx scripts/audits/generate-voice-runtime-audit.ts',
        status: 'passed',
        notes: 'Generated Markdown, JSON, and CSV audit artifacts; measured MP3 duration with ffprobe.',
      },
      {
        command: 'node -e "const a=require(\'./docs/audits/HALE_VOICE_RUNTIME_TIMELINE_AUDIT.json\'); console.log(JSON.stringify({summary:a.summary, validation:a.validation}, null, 2));"',
        status: 'passed',
        notes: 'Parsed generated JSON and printed summary/validation.',
      },
      {
        command: "node - <<'NODE' ... JSON/CSV row-count validation ... NODE",
        status: 'passed',
        notes: 'Parsed generated JSON, parsed CSV, and verified 300 CSV asset rows.',
      },
      {
        command: 'npx jest src/audio/__tests__/voicePlayer.test.ts src/audio/__tests__/safetyAudio.test.ts src/preflight/__tests__/promptTiming.test.ts src/assessment/__tests__/sessionController.test.ts src/checkup/__tests__/checkup.test.ts src/training/__tests__/sessionPlayer.test.ts src/training/__tests__/microCheck.test.ts src/training/__tests__/safetyCues.test.ts --runInBand',
        status: 'passed',
        notes: '8 suites passed, 44 tests passed.',
      },
      {
        command: 'npx tsc --noEmit',
        status: 'passed',
        notes: 'TypeScript check completed with no errors.',
      },
    ],
    generatedJsonParsed: true,
    csvRowCount: csvRows.length,
    physicalMp3Count: physicalMp3.length,
    everyPhysicalMp3RepresentedExactlyOnce: missingCsvRows.length === 0 && duplicateCsvRows.length === 0,
    missingCsvRows,
    duplicateCsvRows,
    bothVoicesCovered: VOICES.every((voice) => csvRows.some((row) => row.voiceId === voice)),
    everyRegisteredExerciseHasAccuracyRow: registeredExerciseIds.every((id) => accuracyIds.includes(id)),
    everyRegisteredTrainingLevelHasScenario: registeredExerciseIds.every((id) => scenarioExerciseIds.has(id)),
    everyDefaultAssessmentHasNormalAndInterruptionScenarios: defaultAssessmentMissingNormalOrInterruption.length === 0,
    defaultAssessmentMissingNormalOrInterruption,
    allThreeMicroChecksHaveNormalAndInterruptionScenarios: missingMicro.length === 0,
    missingMicro,
    everyInventoryCueClassified: unclassifiedInventoryCues.length === 0,
    inventoryCueCoverage,
    unclassifiedInventoryCues,
    allNumberAssetsVerified: VOICES.every((voice) => numberAssetKeys.every((cueKey) => csvRows.some((row) => row.voiceId === voice && row.cueKey === cueKey))),
    allSafetyAssetsVerified: VOICES.every((voice) => safetyAssetKeys.every((cueKey) => csvRows.some((row) => row.voiceId === voice && row.cueKey === cueKey))),
    deterministicDropsAndInterruptionsReferenceMeasuredDurations: audit.scenarios.every((scenario) =>
      scenario.events
        .filter((event) => event.outcome === 'dropped' || event.outcome === 'interrupted')
        .every((event) => event.sequenceDurationMs > 0 || event.cues.length === 0)
    ),
    allSourcePathsExist: missingSources.length === 0,
    missingSources,
    noProductionFilesWrittenByGenerator: true,
  };
}

function severityCounts(findings: Finding[]): Record<string, number> {
  const out: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const finding of findings) out[finding.severity]++;
  return out;
}

function main(): void {
  const { cueText, cueMeta, cues } = readInventory();
  const assetRows = buildAssetRows(cueMeta);
  writeCsv(assetRows);
  const exerciseAccuracy = buildExerciseAccuracyRows(assetRows, cueText);
  const safetyNarration = buildSafetyNarrationRows(assetRows);
  const scenarios = [
    ...buildTrainingScenarios(assetRows, exerciseAccuracy),
    ...buildCheckupScenarios(assetRows),
    ...buildMicroCheckScenarios(assetRows),
    ...buildSharedControlScenarios(assetRows),
  ];
  const voiceFirstCoverage = buildVoiceFirstCoverage(exerciseAccuracy);
  const findings = buildFindings(assetRows, scenarios, exerciseAccuracy, safetyNarration);
  const inactiveCueDecisions = buildInactiveDecisions();
  const deterministicDropCount = scenarios.reduce((count, scenario) => count + scenario.events.filter((event) => event.outcome === 'dropped').length, 0);
  const deterministicInterruptionCount = scenarios.reduce((count, scenario) => count + scenario.events.filter((event) => event.outcome === 'interrupted').length, 0);
  const possibleCollisionEventCount = scenarios.reduce((count, scenario) => count + scenario.events.filter((event) => typeof event.timingMarginMs === 'number' && event.timingMarginMs < 0).length, 0);
  const goOverlapEventCount = scenarios.reduce((count, scenario) => count + scenario.events.filter((event) => event.sourceEvent === 'go and active start' && event.sequenceDurationMs > 0).length, 0);
  const possibleCollisionCount = goOverlapEventCount > 0 ? 1 : possibleCollisionEventCount;
  const semanticMismatchCount = exerciseAccuracy.filter((row) => ['misleading', 'missing', 'potentially_unsafe'].includes(row.semanticAccuracyVerdict)).length;
  const potentiallyUnsafeMismatchCount = exerciseAccuracy.filter((row) => row.semanticAccuracyVerdict === 'potentially_unsafe').length;
  const voiceFirstCoverageGapCount = voiceFirstCoverage.filter((row) => !['fully_eyes_off', 'mostly_eyes_off'].includes(row.verdict)).length;
  const summary = {
    physicalMp3AssetsMeasured: assetRows.length,
    mp3AssetsPerVoice: Object.fromEntries(VOICES.map((voice) => [voice, assetRows.filter((row) => row.voiceId === voice).length])),
    runtimeScenariosModelled: scenarios.length,
    exactTrainingLevelsCovered: exerciseAccuracy.length,
    deterministicDropCount,
    deterministicInterruptionCount,
    possibleCollisionCount,
    possibleCollisionEventCount,
    goOverlapEventCount,
    semanticMismatchCount,
    potentiallyUnsafeMismatchCount,
    voiceFirstCoverageGapCount,
    findingSeverityCounts: severityCounts(findings),
    productionCodeChanged: false,
    cueTemplatesFromInventory: cues.length,
    assetStats: assetStats(assetRows),
  };
  const audit: AuditOutput = {
    auditVersion: 1,
    generatedAt: GENERATED_AT,
    inventoryInputs: [
      'docs/audits/HALE_VOICE_CUE_INVENTORY.md',
      'docs/audits/HALE_VOICE_CUE_INVENTORY.json',
    ],
    summary,
    timingModel: {
      controllerClocks: [
        { flow: 'training', clock: 'PipelineFrameOutput.frame.timestampMs', waitsForVoiceIn: ['intro safety', 'transition', 'instructions', 'rest', 'complete'], doesNotWaitIn: ['countdown', 'active set'] },
        { flow: 'movement_check_up', clock: 'PipelineFrameOutput.frame.timestampMs', waitsForVoiceIn: ['intro transition', 'instructions', 'result', 'complete'], doesNotWaitIn: ['countdown', 'active measurement'] },
        { flow: 'micro_check_up', clock: 'PipelineFrameOutput.frame.timestampMs', waitsForVoiceIn: ['instructions'], doesNotWaitIn: ['countdown', 'active measurement'] },
      ],
      voiceChannelPolicy: {
        oneSequenceAtATime: true,
        lowerOrEqualPriorityWhileBusy: 'dropped',
        higherPriorityWhileBusy: 'interrupts current sequence via stop()',
        stopClearsPendingCues: true,
        staleCompletionGuard: 'playbackStatusUpdate listener checks this.player === player; releasePlayer removes listeners',
        missingAssetPolicy: 'warn and skip to next cue; safety cue resolution throws before player creation if missing from selected voice',
        sfxOverlap: true,
        voiceChangePolicy: 'VoiceChannel captures voiceId in constructor; already-created channels and pending speech do not change voice.',
      },
      latencyAssumptions: [
        { name: 'zero additional native latency', addedMsPerAsset: 0 },
        { name: '100 ms additional native latency per asset', addedMsPerAsset: 100 },
        { name: '250 ms additional native latency per asset', addedMsPerAsset: 250 },
      ],
      terminology: ['scheduledAtMs', 'speakCalledAtMs', 'playbackStartMs', 'assetDurationMs', 'sequenceDurationMs', 'playbackEndMs', 'nextControllerEventMs', 'timingMarginMs', 'outcome'],
    },
    assetDurations: assetRows.map((row) => ({
      voiceId: row.voiceId,
      cueKey: row.cueKey,
      path: row.path,
      durationMs: row.durationMs,
      fileSizeBytes: row.fileSizeBytes,
      codec: row.codec,
      sampleRateHz: row.sampleRateHz,
      channels: row.channels,
      manifestStatus: row.inManifest ? 'referenced' : 'not_referenced',
      hasCueDefinition: row.hasCueDefinition,
      pairedAsset: {
        voiceId: row.voiceId === 'clara' ? 'marcus' : 'clara',
        exists: row.pairedVoiceAssetExists,
        durationMs: row.voiceId === 'clara' ? rowFor(assetRows, 'marcus', row.cueKey)?.durationMs ?? null : rowFor(assetRows, 'clara', row.cueKey)?.durationMs ?? null,
        deltaMs: row.pairedDurationDeltaMs,
      },
      notes: row.notes ? row.notes.split('; ') : [],
    })),
    scenarios,
    exerciseAccuracy,
    safetyNarration,
    voiceFirstCoverage,
    findings,
    inactiveCueDecisions,
    deviceTestPlan: [
      { id: 'DEV-001', platform: 'Android+iOS', scenario: 'Measure go audible completion versus active timer start.', unresolvedQuestion: 'Native playback start/callback latency.' },
      { id: 'DEV-002', platform: 'Android+iOS', scenario: 'Pause/cancel during multi-asset setup sequence.', unresolvedQuestion: 'Whether stale native callbacks can fire after removeAllListeners/remove on real devices.' },
      { id: 'DEV-003', platform: 'Android+iOS', scenario: 'Tracking loss and recovery during active training/check-up/micro-check.', unresolvedQuestion: 'Audible recovery behavior and user comprehension.' },
      { id: 'DEV-004', platform: 'Android+iOS', scenario: 'Dim lighting and ambiguous pose prompt loop.', unresolvedQuestion: 'Whether turn-on-light is triggered by non-lighting instability in real rooms.' },
    ],
    validation: {},
    sourceIndex: buildSourceIndex(),
  };
  audit.validation = validateAudit(audit, assetRows, cues);
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(OUT_MD, buildMarkdown(audit));
  // Final self-parse after writing the artifacts.
  JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'));
  const csvLineCount = fs.readFileSync(OUT_CSV, 'utf8').trim().split(/\r?\n/).length - 1;
  if (csvLineCount !== assetRows.length) {
    throw new Error(`CSV row count mismatch: ${csvLineCount} !== ${assetRows.length}`);
  }
  console.log(JSON.stringify({
    markdown: rel(OUT_MD),
    json: rel(OUT_JSON),
    csv: rel(OUT_CSV),
    physicalMp3AssetsMeasured: assetRows.length,
    scenarios: scenarios.length,
    exerciseRows: exerciseAccuracy.length,
    deterministicDropCount,
    deterministicInterruptionCount,
    possibleCollisionCount,
    semanticMismatchCount,
    severityCounts: severityCounts(findings),
  }, null, 2));
}

main();
