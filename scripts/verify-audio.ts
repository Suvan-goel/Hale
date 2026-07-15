import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  movementProfileV2AudioCueIds,
  movementProfileV2AudioExpectedPath,
  movementProfileV2AudioFingerprint,
} from '../src/audio/movementProfileV2Audio';
import { MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA } from '../src/audio/movementProfileV2AudioManifest';
import {
  safetyAudioCueIds,
  safetyAudioExpectedPath,
  safetyAudioFingerprint,
} from '../src/audio/safetyAudio';
import { SAFETY_AUDIO_ASSET_METADATA } from '../src/audio/safetyAudioManifest';
import { VOICE_OPTIONS } from '../src/profile/voices';
import {
  voiceV21AudioExpectedPath,
  voiceV21AudioFingerprint,
} from '../src/audio/voiceV21Audio';
import { VOICE_V2_1_AUDIO_ASSET_METADATA } from '../src/audio/voiceV21AudioManifest';
import {
  isMovementProfileV2CueId,
  movementProfileV2CueText,
  type MovementProfileV2CueId,
} from '../src/movementProfileV2/voiceCues';
import {
  isSafetyCueId,
  safetyCueText,
  type SafetyCueId,
} from '../src/training/safetyCueDefinitions';

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'src/audio/manifest.ts');
const MIN_MP3_BYTES = 1024;

type RequiredAudioGroup = 'safety' | 'movementProfileV2';
type RequiredCueId = SafetyCueId | MovementProfileV2CueId;

interface ManifestEntry {
  cueId: string;
  voiceId: string;
  path: string;
}

interface VerifiedAsset {
  group: RequiredAudioGroup;
  cueId: RequiredCueId;
  voiceId: string;
  path: string;
  bytes: number;
  durationSec: number;
  fingerprint: string;
  sha256: string;
}

interface GroupSummary {
  group: RequiredAudioGroup;
  requiredCues: number;
  requiredAssets: number;
  totalBytes: number;
  minDuration: number;
  maxDuration: number;
}

const issues: string[] = [];

function main(): void {
  const manifestEntries = parseVoiceManifest();
  const manifestByVoiceCue = new Map<string, ManifestEntry>();
  const voiceV21GeneratedCueIds = voiceV21MetadataCueIds();
  for (const entry of manifestEntries) {
    manifestByVoiceCue.set(`${entry.voiceId}:${entry.cueId}`, entry);
    if (looksLikeSafetyCueKey(entry.cueId) && !isSafetyCueId(entry.cueId)) {
      issues.push(`unknown safety-like cue in static manifest: ${entry.voiceId}/${entry.cueId}`);
    }
    if (
      looksLikeMovementProfileV2CueKey(entry.cueId) &&
      !isMovementProfileV2CueId(entry.cueId) &&
      !voiceV21GeneratedCueIds.has(entry.cueId)
    ) {
      issues.push(`unknown Movement Profile V2 cue in static manifest: ${entry.voiceId}/${entry.cueId}`);
    }
  }

  const safetyAssets = verifySafetyAssets(manifestByVoiceCue);
  const movementProfileV2Assets = verifyMovementProfileV2Assets(manifestByVoiceCue);
  const voiceV21Assets = verifyVoiceV21Assets(manifestByVoiceCue);
  const verified = [...safetyAssets, ...movementProfileV2Assets, ...voiceV21Assets];

  verifyDuplicateAudio(verified);
  verifyNoPartialFiles();
  verifyNoRequiredAudioOrphans(manifestByVoiceCue);

  if (issues.length > 0) {
    console.error(`AUDIO VERIFICATION FAIL issues=${issues.length}`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }

  const safetySummary = summarizeGroup('safety', safetyAssets, safetyAudioCueIds().length);
  const movementProfileV2Summary = summarizeGroup(
    'movementProfileV2',
    movementProfileV2Assets,
    movementProfileV2AudioCueIds().length
  );
  console.log(
    [
      'AUDIO VERIFICATION PASS',
      `safety: requiredCues=${safetySummary.requiredCues}`,
      `voices=${VOICE_OPTIONS.map((voice) => voice.id).join(',')}`,
      `requiredAssets=${safetySummary.requiredAssets}`,
      `totalBytes=${safetySummary.totalBytes}`,
      `durationRange=${safetySummary.minDuration.toFixed(3)}-${safetySummary.maxDuration.toFixed(3)}s`,
      `movementProfileV2: requiredCues=${movementProfileV2Summary.requiredCues}`,
      `voices=${VOICE_OPTIONS.map((voice) => voice.id).join(',')}`,
      `requiredAssets=${movementProfileV2Summary.requiredAssets}`,
      `totalBytes=${movementProfileV2Summary.totalBytes}`,
      `durationRange=${movementProfileV2Summary.minDuration.toFixed(3)}-${movementProfileV2Summary.maxDuration.toFixed(3)}s`,
      `voiceV21: requiredAssets=${voiceV21Assets.length}`,
      `total: requiredAssets=${verified.length}`,
    ].join(' ')
  );
}

function verifySafetyAssets(manifestByVoiceCue: ReadonlyMap<string, ManifestEntry>): VerifiedAsset[] {
  return verifyRequiredAssets({
    group: 'safety',
    cueIds: safetyAudioCueIds(),
    expectedPath: (voiceId, cueId) => safetyAudioExpectedPath(voiceId, cueId as SafetyCueId),
    expectedFingerprint: ({ cueId, voiceId, providerVoiceId }) =>
      safetyAudioFingerprint({ cueId: cueId as SafetyCueId, voiceId, providerVoiceId }),
    metadata: ({ cueId, voiceId }) => SAFETY_AUDIO_ASSET_METADATA[voiceId]?.[cueId as SafetyCueId],
    cueText: (cueId) => safetyCueText(cueId as SafetyCueId),
    manifestByVoiceCue,
  });
}

function verifyMovementProfileV2Assets(
  manifestByVoiceCue: ReadonlyMap<string, ManifestEntry>
): VerifiedAsset[] {
  return verifyRequiredAssets({
    group: 'movementProfileV2',
    cueIds: movementProfileV2AudioCueIds(),
    expectedPath: (voiceId, cueId) =>
      movementProfileV2AudioExpectedPath(voiceId, cueId as MovementProfileV2CueId),
    expectedFingerprint: ({ cueId, voiceId, providerVoiceId }) =>
      movementProfileV2AudioFingerprint({ cueId: cueId as MovementProfileV2CueId, voiceId, providerVoiceId }),
    metadata: ({ cueId, voiceId }) =>
      MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA[voiceId]?.[cueId as MovementProfileV2CueId],
    cueText: (cueId) => movementProfileV2CueText(cueId as MovementProfileV2CueId),
    manifestByVoiceCue,
  });
}

function verifyVoiceV21Assets(manifestByVoiceCue: ReadonlyMap<string, ManifestEntry>): VerifiedAsset[] {
  const planRows = parseGenerationPlanRows();
  const planByVoiceCue = new Map(planRows.map((row) => [`${row.voiceId}:${row.physicalCueKey}`, row]));
  const metadataEntries = voiceV21MetadataEntries();
  const verified: VerifiedAsset[] = [];

  if (metadataEntries.length === 0) return verified;

  if (planRows.length > 0) {
    for (const row of planRows) {
      const metadata = VOICE_V2_1_AUDIO_ASSET_METADATA[row.voiceId]?.[row.physicalCueKey];
      if (!metadata) {
        issues.push(`missing Voice V2.1 generated metadata for ${row.voiceId}:${row.physicalCueKey}`);
      }
    }
  }

  for (const metadata of metadataEntries) {
    const key = `${metadata.voiceId}:${metadata.physicalCueKey}`;
    const plan = planByVoiceCue.get(key);
    if (planRows.length > 0 && !plan) {
      issues.push(`Voice V2.1 metadata is outside generation plan: ${key}`);
    }
    const expectedPath = voiceV21AudioExpectedPath(metadata.voiceId, metadata.physicalCueKey);
    if (metadata.path !== expectedPath) {
      issues.push(`wrong Voice V2.1 metadata path for ${key}: expected ${expectedPath}, got ${metadata.path}`);
    }
    if (metadata.logicalCueKey !== metadata.physicalCueKey) {
      issues.push(`Voice V2.1 logical/physical key mismatch for ${key}`);
    }
    if (plan && metadata.script !== plan.exactScript) {
      issues.push(`Voice V2.1 metadata script conflicts with generation plan for ${key}`);
    }
    const voice = VOICE_OPTIONS.find((item) => item.id === metadata.voiceId);
    if (!voice) {
      issues.push(`Voice V2.1 metadata has unknown voice id: ${metadata.voiceId}`);
      continue;
    }
    const expectedFingerprint = voiceV21AudioFingerprint({
      logicalCueKey: metadata.logicalCueKey,
      physicalCueKey: metadata.physicalCueKey,
      voiceId: metadata.voiceId,
      providerVoiceId: voice.elevenLabsVoiceId,
      script: metadata.script,
    });
    if (metadata.providerVoiceId !== voice.elevenLabsVoiceId) {
      issues.push(`Voice V2.1 provider voice id mismatch for ${key}`);
    }
    if (metadata.fingerprint !== expectedFingerprint) {
      issues.push(`stale Voice V2.1 fingerprint for ${key}`);
    }

    const entry = manifestByVoiceCue.get(key);
    if (!entry) {
      issues.push(`missing static mapping for Voice V2.1 ${key}`);
    } else if (entry.path !== expectedPath) {
      issues.push(`wrong static path for Voice V2.1 ${key}: expected ${expectedPath}, got ${entry.path}`);
    }

    const absPath = path.join(ROOT, expectedPath);
    if (!fs.existsSync(absPath)) {
      issues.push(`missing mp3 file for Voice V2.1 ${key}: ${expectedPath}`);
      continue;
    }
    const stat = fs.statSync(absPath);
    if (!stat.isFile()) {
      issues.push(`audio path is not a regular file for Voice V2.1 ${key}: ${expectedPath}`);
      continue;
    }
    if (stat.size < MIN_MP3_BYTES) {
      issues.push(`audio file too small for Voice V2.1 ${key}: ${stat.size} bytes`);
    }
    const bytes = fs.readFileSync(absPath);
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    if (sha256 !== metadata.sha256) {
      issues.push(`Voice V2.1 sha256 mismatch for ${key}`);
    }
    if (stat.size !== metadata.fileSizeBytes) {
      issues.push(`Voice V2.1 file size mismatch for ${key}`);
    }
    if (!looksLikeMp3(bytes)) {
      issues.push(`audio file is not recognized as mp3 for Voice V2.1 ${key}`);
    }
    const durationSec = probeDuration(absPath, `Voice V2.1 ${key}`);
    const durationMs = Math.round(durationSec * 1000);
    if (!Number.isFinite(durationSec) || durationSec <= 0) {
      issues.push(`audio duration is not finite and positive for Voice V2.1 ${key}: ${durationSec}`);
    } else if (Math.abs(durationMs - metadata.durationMs) > 5) {
      issues.push(`Voice V2.1 duration metadata mismatch for ${key}: expected ${metadata.durationMs}, got ${durationMs}`);
    } else if (!durationLooksPlausible(metadata.script, durationSec)) {
      issues.push(`audio duration is outside broad text bounds for Voice V2.1 ${key}: ${durationSec.toFixed(3)}s`);
    }
    verified.push({
      group: 'movementProfileV2',
      cueId: metadata.physicalCueKey as MovementProfileV2CueId,
      voiceId: metadata.voiceId,
      path: expectedPath,
      bytes: stat.size,
      durationSec,
      fingerprint: metadata.fingerprint,
      sha256,
    });
  }
  return verified;
}

function verifyRequiredAssets(input: {
  group: RequiredAudioGroup;
  cueIds: readonly RequiredCueId[];
  expectedPath: (voiceId: string, cueId: RequiredCueId) => string;
  expectedFingerprint: (input: { cueId: RequiredCueId; voiceId: string; providerVoiceId: string }) => string;
  metadata: (input: { cueId: RequiredCueId; voiceId: string }) => {
    path: string;
    fingerprint: string;
    voiceId: string;
    cueId: string;
    durationMs?: number;
  } | undefined;
  cueText: (cueId: RequiredCueId) => string;
  manifestByVoiceCue: ReadonlyMap<string, ManifestEntry>;
}): VerifiedAsset[] {
  const verified: VerifiedAsset[] = [];
  for (const voice of VOICE_OPTIONS) {
    for (const cueId of input.cueIds) {
      const expectedPath = input.expectedPath(voice.id, cueId);
      const key = `${voice.id}:${cueId}`;
      const entry = input.manifestByVoiceCue.get(key);
      if (!entry) {
        issues.push(`missing static mapping for ${input.group} ${key}`);
      } else if (entry.path !== expectedPath) {
        issues.push(`wrong static path for ${input.group} ${key}: expected ${expectedPath}, got ${entry.path}`);
      }

      const metadata = input.metadata({ cueId, voiceId: voice.id });
      const expectedFingerprint = input.expectedFingerprint({
        cueId,
        voiceId: voice.id,
        providerVoiceId: voice.elevenLabsVoiceId,
      });
      if (!metadata) {
        issues.push(`missing ${input.group} audio metadata for ${key}`);
      } else {
        if (metadata.path !== expectedPath) {
          issues.push(`wrong ${input.group} metadata path for ${key}: expected ${expectedPath}, got ${metadata.path}`);
        }
        if (metadata.fingerprint !== expectedFingerprint) {
          issues.push(`stale ${input.group} audio fingerprint for ${key}`);
        }
      }

      const absPath = path.join(ROOT, expectedPath);
      if (!fs.existsSync(absPath)) {
        issues.push(`missing mp3 file for ${input.group} ${key}: ${expectedPath}`);
        continue;
      }
      const stat = fs.statSync(absPath);
      if (!stat.isFile()) {
        issues.push(`audio path is not a regular file for ${input.group} ${key}: ${expectedPath}`);
        continue;
      }
      if (stat.size < MIN_MP3_BYTES) {
        issues.push(`audio file too small for ${input.group} ${key}: ${stat.size} bytes`);
      }
      const bytes = fs.readFileSync(absPath);
      if (!looksLikeMp3(bytes)) {
        issues.push(`audio file is not recognized as mp3 for ${input.group} ${key}`);
      }
      const durationSec = probeDuration(absPath, `${input.group} ${key}`);
      const durationMs = Math.round(durationSec * 1000);
      const metadataDurationMs = Number(metadata?.durationMs);
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        issues.push(`audio duration is not finite and positive for ${input.group} ${key}: ${durationSec}`);
      } else if (
        input.group === 'movementProfileV2' &&
        (!Number.isFinite(metadataDurationMs) || Math.abs(durationMs - metadataDurationMs) > 5)
      ) {
        issues.push(
          `${input.group} duration metadata mismatch for ${key}: expected ${metadata?.durationMs}, got ${durationMs}`
        );
      } else if (!durationLooksPlausible(input.cueText(cueId), durationSec)) {
        issues.push(`audio duration is outside broad text bounds for ${input.group} ${key}: ${durationSec.toFixed(3)}s`);
      }

      verified.push({
        group: input.group,
        cueId,
        voiceId: voice.id,
        path: expectedPath,
        bytes: stat.size,
        durationSec,
        fingerprint: expectedFingerprint,
        sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
  return verified;
}

function parseVoiceManifest(): ManifestEntry[] {
  const source = fs.readFileSync(MANIFEST_PATH, 'utf8');
  const entries: ManifestEntry[] = [];
  const re = /'([^']+)': require\('\.\.\/\.\.\/assets\/audio\/voice\/([^/]+)\/([^']+\.mp3)'\)/g;
  for (const match of source.matchAll(re)) {
    const cueId = match[1];
    const voiceId = match[2];
    const fileName = match[3];
    entries.push({
      cueId,
      voiceId,
      path: `assets/audio/voice/${voiceId}/${fileName}`,
    });
  }
  return entries;
}

function voiceV21MetadataCueIds(): Set<string> {
  return new Set(voiceV21MetadataEntries().map((entry) => entry.physicalCueKey));
}

function voiceV21MetadataEntries() {
  return Object.values(VOICE_V2_1_AUDIO_ASSET_METADATA)
    .flatMap((byCue) => Object.values(byCue ?? {}))
    .filter((metadata): metadata is NonNullable<typeof metadata> => Boolean(metadata));
}

function parseGenerationPlanRows(): Array<{
  voiceId: string;
  logicalCueKey: string;
  physicalCueKey: string;
  exactScript: string;
}> {
  const planPath = path.join(ROOT, 'docs/audits/PEARL_VOICE_V2_1_GENERATION_PLAN.csv');
  if (!fs.existsSync(planPath)) return [];
  const lines = fs.readFileSync(planPath, 'utf8').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  const configuredVoiceIds = new Set(VOICE_OPTIONS.map((voice) => voice.id));
  return lines
    .slice(1)
    .map((line) => {
      const values = parseCsvLine(line);
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
      return {
        voiceId: row.voiceId,
        logicalCueKey: row.logicalCueKey,
        physicalCueKey: row.physicalCueKey,
        exactScript: row.exactScript,
      };
    })
    // Generation plans are retained as historical evidence. Only voices in
    // the live catalog are required by the current app bundle.
    .filter((row) => configuredVoiceIds.has(row.voiceId));
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      out.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  out.push(current);
  return out;
}

function looksLikeSafetyCueKey(key: string): boolean {
  return /^(global|support|chair|floor|step|band|door_anchor|comfortable|mobility|balance|tracking)_/.test(key);
}

function looksLikeMovementProfileV2CueKey(key: string): boolean {
  return key.startsWith('mpv2_') || key.endsWith('-v21');
}

function looksLikeMp3(bytes: Buffer): boolean {
  if (bytes.length < 4) return false;
  if (bytes.subarray(0, 3).toString('ascii') === 'ID3') return true;
  return bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
}

function probeDuration(absPath: string, key: string): number {
  const result = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', absPath],
    { encoding: 'utf8' }
  );
  if (result.error) {
    issues.push(`ffprobe unavailable for ${key}: ${result.error.message}`);
    return NaN;
  }
  if (result.status !== 0) {
    issues.push(`ffprobe failed for ${key}: ${result.stderr.trim()}`);
    return NaN;
  }
  return Number(result.stdout.trim());
}

function durationLooksPlausible(text: string, durationSec: number): boolean {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const maxSec = Math.max(3, wordCount * 0.85 + 3);
  return durationSec >= 0.25 && durationSec <= maxSec;
}

function verifyDuplicateAudio(assets: readonly VerifiedAsset[]): void {
  const byHash = new Map<string, VerifiedAsset[]>();
  for (const asset of assets) {
    const group = byHash.get(asset.sha256) ?? [];
    group.push(asset);
    byHash.set(asset.sha256, group);
  }
  for (const group of byHash.values()) {
    if (group.length <= 1) continue;
    const labels = group.map((asset) => `${asset.voiceId}/${asset.cueId}`).join(', ');
    issues.push(`duplicate required mp3 bytes found across distinct assets: ${labels}`);
  }
}

function verifyNoPartialFiles(): void {
  const voiceRoot = path.join(ROOT, 'assets/audio/voice');
  if (!fs.existsSync(voiceRoot)) return;
  for (const voiceId of fs.readdirSync(voiceRoot)) {
    const dir = path.join(voiceRoot, voiceId);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.includes('.tmp-') || file.endsWith('.part') || file.endsWith('.partial')) {
        issues.push(`temporary audio file remains: assets/audio/voice/${voiceId}/${file}`);
      }
    }
  }
}

function verifyNoRequiredAudioOrphans(manifestByVoiceCue: ReadonlyMap<string, ManifestEntry>): void {
  for (const voice of VOICE_OPTIONS) {
    for (const cueId of safetyAudioCueIds()) {
      const relPath = safetyAudioExpectedPath(voice.id, cueId);
      if (fs.existsSync(path.join(ROOT, relPath)) && !manifestByVoiceCue.has(`${voice.id}:${cueId}`)) {
        issues.push(`safety mp3 exists without static mapping: ${relPath}`);
      }
    }
    for (const cueId of movementProfileV2AudioCueIds()) {
      const relPath = movementProfileV2AudioExpectedPath(voice.id, cueId);
      if (fs.existsSync(path.join(ROOT, relPath)) && !manifestByVoiceCue.has(`${voice.id}:${cueId}`)) {
        issues.push(`Movement Profile V2 mp3 exists without static mapping: ${relPath}`);
      }
    }
  }
}

function summarizeGroup(
  group: RequiredAudioGroup,
  assets: readonly VerifiedAsset[],
  requiredCues: number
): GroupSummary {
  const totalBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0);
  const durations = assets.map((asset) => asset.durationSec);
  return {
    group,
    requiredCues,
    requiredAssets: assets.length,
    totalBytes,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
  };
}

main();
