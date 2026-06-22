import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  safetyAudioCueIds,
  safetyAudioExpectedPath,
  safetyAudioFingerprint,
} from '../src/audio/safetyAudio';
import { SAFETY_AUDIO_ASSET_METADATA } from '../src/audio/safetyAudioManifest';
import { VOICE_OPTIONS } from '../src/profile/voices';
import {
  isSafetyCueId,
  safetyCueText,
  type SafetyCueId,
} from '../src/training/safetyCueDefinitions';

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'src/audio/manifest.ts');
const MIN_MP3_BYTES = 1024;

interface ManifestEntry {
  cueId: string;
  voiceId: string;
  path: string;
}

interface VerifiedAsset {
  cueId: SafetyCueId;
  voiceId: string;
  path: string;
  bytes: number;
  durationSec: number;
  fingerprint: string;
  sha256: string;
}

const issues: string[] = [];

function main(): void {
  const manifestEntries = parseVoiceManifest();
  const manifestByVoiceCue = new Map<string, ManifestEntry>();
  for (const entry of manifestEntries) {
    manifestByVoiceCue.set(`${entry.voiceId}:${entry.cueId}`, entry);
    if (looksLikeSafetyCueKey(entry.cueId) && !isSafetyCueId(entry.cueId)) {
      issues.push(`unknown safety-like cue in static manifest: ${entry.voiceId}/${entry.cueId}`);
    }
  }

  const verified: VerifiedAsset[] = [];
  for (const voice of VOICE_OPTIONS) {
    for (const cueId of safetyAudioCueIds()) {
      const expectedPath = safetyAudioExpectedPath(voice.id, cueId);
      const key = `${voice.id}:${cueId}`;
      const entry = manifestByVoiceCue.get(key);
      if (!entry) {
        issues.push(`missing static mapping for ${key}`);
      } else if (entry.path !== expectedPath) {
        issues.push(`wrong static path for ${key}: expected ${expectedPath}, got ${entry.path}`);
      }

      const metadata = SAFETY_AUDIO_ASSET_METADATA[voice.id]?.[cueId];
      const expectedFingerprint = safetyAudioFingerprint({
        cueId,
        voiceId: voice.id,
        providerVoiceId: voice.elevenLabsVoiceId,
      });
      if (!metadata) {
        issues.push(`missing safety audio metadata for ${key}`);
      } else {
        if (metadata.path !== expectedPath) {
          issues.push(`wrong metadata path for ${key}: expected ${expectedPath}, got ${metadata.path}`);
        }
        if (metadata.fingerprint !== expectedFingerprint) {
          issues.push(`stale safety audio fingerprint for ${key}`);
        }
      }

      const absPath = path.join(ROOT, expectedPath);
      if (!fs.existsSync(absPath)) {
        issues.push(`missing mp3 file for ${key}: ${expectedPath}`);
        continue;
      }
      const stat = fs.statSync(absPath);
      if (!stat.isFile()) {
        issues.push(`audio path is not a regular file for ${key}: ${expectedPath}`);
        continue;
      }
      if (stat.size < MIN_MP3_BYTES) {
        issues.push(`audio file too small for ${key}: ${stat.size} bytes`);
      }
      const bytes = fs.readFileSync(absPath);
      if (!looksLikeMp3(bytes)) {
        issues.push(`audio file is not recognized as mp3 for ${key}`);
      }
      const durationSec = probeDuration(absPath, key);
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        issues.push(`audio duration is not finite and positive for ${key}: ${durationSec}`);
      } else if (!durationLooksPlausible(cueId, durationSec)) {
        issues.push(`audio duration is outside broad text bounds for ${key}: ${durationSec.toFixed(3)}s`);
      }

      verified.push({
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

  verifyDuplicateAudio(verified);
  verifyNoPartialFiles();
  verifyNoSafetyOrphans(manifestByVoiceCue);

  if (issues.length > 0) {
    console.error(`AUDIO VERIFICATION FAIL issues=${issues.length}`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }

  const totalBytes = verified.reduce((sum, asset) => sum + asset.bytes, 0);
  const minDuration = Math.min(...verified.map((asset) => asset.durationSec));
  const maxDuration = Math.max(...verified.map((asset) => asset.durationSec));
  console.log(
    [
      'AUDIO VERIFICATION PASS',
      `requiredCues=${safetyAudioCueIds().length}`,
      `voices=${VOICE_OPTIONS.map((voice) => voice.id).join(',')}`,
      `requiredAssets=${verified.length}`,
      `totalBytes=${totalBytes}`,
      `durationRange=${minDuration.toFixed(3)}-${maxDuration.toFixed(3)}s`,
    ].join(' ')
  );
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

function looksLikeSafetyCueKey(key: string): boolean {
  return /^(global|support|chair|floor|step|band|door_anchor|comfortable|mobility|balance|tracking)_/.test(key);
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

function durationLooksPlausible(cueId: SafetyCueId, durationSec: number): boolean {
  const wordCount = safetyCueText(cueId).split(/\s+/).filter(Boolean).length;
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
    issues.push(`duplicate safety mp3 bytes found across distinct assets: ${labels}`);
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

function verifyNoSafetyOrphans(manifestByVoiceCue: ReadonlyMap<string, ManifestEntry>): void {
  for (const voice of VOICE_OPTIONS) {
    for (const cueId of safetyAudioCueIds()) {
      const relPath = safetyAudioExpectedPath(voice.id, cueId);
      if (fs.existsSync(path.join(ROOT, relPath)) && !manifestByVoiceCue.has(`${voice.id}:${cueId}`)) {
        issues.push(`safety mp3 exists without static mapping: ${relPath}`);
      }
    }
  }
}

main();
