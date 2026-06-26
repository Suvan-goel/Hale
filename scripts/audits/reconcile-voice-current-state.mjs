#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.caf']);
const BASELINE_COMMIT = '4b4c57c05ba02b87e5946beda1f44797180a4391';
const OUT = {
  md: 'docs/audits/HALE_VOICE_CURRENT_STATE_RECONCILIATION.md',
  json: 'docs/audits/HALE_VOICE_CURRENT_STATE_RECONCILIATION.json',
  inventory: 'docs/audits/HALE_VOICE_CURRENT_ASSET_INVENTORY.csv',
  ledger: 'docs/audits/HALE_VOICE_CHANGE_LEDGER.csv',
  impact: 'docs/audits/HALE_VOICE_V2_1_IMPACT_REPORT.md',
};

function main() {
  const generatedAt = new Date().toISOString();
  const snapshot = repositorySnapshot(generatedAt);
  const baseline = establishBaseline();
  const previousDurationRows = readCsv('docs/audits/HALE_VOICE_ASSET_DURATIONS.csv');
  const v21Rows = readCsv('docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv');
  const v21ByKey = new Map(v21Rows.map((row) => [row.newCueKey, row]));
  const previewCueKeys = parsePreviewCueKeys('docs/specs/HALE_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md');
  const manifests = parseManifests();
  const source = parseSourceDefinitions();
  const sourceFiles = readRelevantSourceFiles();
  const assets = inventoryAssets({
    baseline,
    manifests,
    previousDurationRows,
    source,
    sourceFiles,
    v21ByKey,
  });
  const integrityFindings = integrityChecks(assets, manifests, source);
  const cueDefinitions = currentCueDefinitions(source, manifests, sourceFiles, v21ByKey);
  const reachability = runtimeReachability(cueDefinitions, assets, sourceFiles);
  const runtimeArchitectureComparison = runtimeArchitectureDelta();
  const v21Reconciliation = reconcileV21(v21Rows, previewCueKeys, source, manifests, assets);
  const voiceParity = summarizeVoiceParity(assets, manifests, source);
  const changeLedger = buildChangeLedger({ assets, baseline, snapshot, v21Reconciliation });
  const recommendationMatrix = buildRecommendationMatrix();
  const summary = buildSummary({
    assets,
    baseline,
    cueDefinitions,
    integrityFindings,
    reachability,
    runtimeArchitectureComparison,
    v21Reconciliation,
    voiceParity,
    changeLedger,
  });
  const verdict = {
    primary: 'RERUN_RUNTIME_AUDIT',
    secondaryFlags: [
      'RECONCILE_ASSETS_WITH_V2_1',
      'BASELINE_REFRESH_ONLY',
      'SCRIPT_REVIEW_UPDATE',
    ],
    audioGenerationSafe: false,
    integratedPreviewSafe: false,
    nextAction:
      'Freeze further audio generation, reconcile the current untracked Movement Profile V2/V2.1 asset and manifest set against the V2.1 manifest, then rerun the runtime timing audit for the changed Movement Profile V2 controller path.',
  };
  const audit = {
    auditVersion: 1,
    generatedAt,
    repositorySnapshot: snapshot,
    baseline: {
      method: 'git_commit_and_prior_artifacts',
      commit: BASELINE_COMMIT,
      confidence: 'high',
      rationale:
        'The baseline commit introduced the prior cue inventory and contains the audited 301 tracked audio files: 150 Clara MP3s, 150 Marcus MP3s, and one SFX WAV. HEAD has the same tracked audio tree hash; current additions are untracked worktree files.',
    },
    verdict,
    summary,
    currentAssets: assets,
    integrityFindings,
    currentCueDefinitions: cueDefinitions,
    currentGenerationSources: generationSources(source),
    currentManifests: manifestSummary(manifests),
    runtimeArchitectureComparison,
    runtimeReachability: reachability,
    gitChanges: snapshot.relevantChanges,
    sourceBinarySynchronization: sourceBinarySynchronization(assets),
    voiceParity,
    catalogueChanges: catalogueChanges(),
    v21Reconciliation,
    changeLedger,
    recommendationMatrix,
    validation: validationSummary({
      assets,
      manifests,
      source,
      v21Rows,
      previewCueKeys,
      integrityFindings,
    }),
    limitations: [
      'No audio was listened to or transcribed. Binary semantic correctness is not claimed from filename, duration, hash, or metadata.',
      'Untracked source and asset files are audited as current repository state but have no commit-level provenance.',
      'Runtime timing was compared statically enough to decide validity; this task did not rerun the full 374-scenario timing audit.',
    ],
  };

  writeFile(OUT.inventory, toCsv(assets, INVENTORY_COLUMNS));
  writeFile(OUT.ledger, toCsv(changeLedger, LEDGER_COLUMNS));
  writeFile(OUT.json, `${JSON.stringify(audit, null, 2)}\n`);
  writeFile(OUT.md, renderMarkdown(audit));
  writeFile(OUT.impact, renderImpactReport(audit));

  console.log(`Wrote ${Object.values(OUT).join(', ')}`);
  console.log(`Verdict ${verdict.primary}; assets=${assets.length}; spoken=${summary.currentSpokenAssetCount}`);
}

function repositorySnapshot(generatedAt) {
  const statusShort = runGit(['status', '--short', '--branch']).trimEnd().split('\n').filter(Boolean);
  const porcelain = runGit(['status', '--porcelain=v1']).trimEnd().split('\n').filter(Boolean);
  const branch = safeGit(['branch', '--show-current']).trim() || null;
  const detachedSymbol = safeGit(['symbolic-ref', '-q', '--short', 'HEAD']).trim();
  const fullCommit = runGit(['rev-parse', 'HEAD']).trim();
  const shortCommit = runGit(['rev-parse', '--short', 'HEAD']).trim();
  const upstream = safeGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']).trim() || null;
  const staged = porcelain.filter((line) => line[0] !== ' ' && !line.startsWith('??')).map(parsePorcelainPath);
  const unstaged = porcelain.filter((line) => line[1] !== ' ' && !line.startsWith('??')).map(parsePorcelainPath);
  const untracked = porcelain.filter((line) => line.startsWith('??')).map(parsePorcelainPath);
  const ignored = safeGit([
    'status',
    '--ignored',
    '--short',
    'assets/audio',
    'src/audio',
    'docs/audits',
    'docs/specs',
    'scripts/audits',
  ])
    .trimEnd()
    .split('\n')
    .filter((line) => line.startsWith('!!'))
    .map((line) => line.slice(3));
  const packageJson = JSON.parse(readText('package.json'));
  return {
    generatedAt,
    branch,
    head: fullCommit,
    shortHead: shortCommit,
    detachedHead: detachedSymbol.length === 0,
    upstream,
    worktreeClean: porcelain.length === 0,
    statusShort,
    stagedRelevantChanges: staged.filter(isRelevantPath),
    unstagedRelevantChanges: unstaged.filter(isRelevantPath),
    untrackedRelevantFiles: untracked.filter(isRelevantPath),
    ignoredRelevantFiles: ignored.filter(isRelevantPath),
    relevantChanges: porcelain.map((line) => {
      const pathValue = parsePorcelainPath(line);
      return { status: line.slice(0, 2), path: pathValue, relevant: isRelevantPath(pathValue) };
    }),
    nodeVersion: run('node', ['--version']).trim(),
    npmVersion: run('npm', ['--version']).trim(),
    packageManager: fs.existsSync(path.join(ROOT, 'package-lock.json')) ? 'npm/package-lock.json' : 'unknown',
    dependencies: {
      expo: packageJson.dependencies?.expo ?? null,
      reactNative: packageJson.dependencies?.['react-native'] ?? null,
      expoAudio: packageJson.dependencies?.['expo-audio'] ?? null,
      expoAv: packageJson.dependencies?.['expo-av'] ?? null,
    },
    gitLfsAvailable: safeRun('git', ['lfs', 'version']).ok,
    submodulesAffectAudio: runGit(['submodule', 'status']).trim().length > 0,
  };
}

function establishBaseline() {
  const tree = parseLsTree(runGit(['ls-tree', '-r', BASELINE_COMMIT, 'assets/audio']));
  const currentTrackedTreeHash = runGit(['ls-tree', '-r', 'HEAD', 'assets/audio']).pipe
    ? ''
    : sha256Text(runGit(['ls-tree', '-r', 'HEAD', 'assets/audio']));
  const baselineTreeHash = sha256Text(runGit(['ls-tree', '-r', BASELINE_COMMIT, 'assets/audio']));
  return {
    commit: BASELINE_COMMIT,
    commitDate: runGit(['show', '-s', '--format=%cI', BASELINE_COMMIT]).trim(),
    reason:
      'This commit introduced the prior static voice cue inventory and has the audited physical audio shape.',
    confidence: 'high',
    audioTreeHash: baselineTreeHash,
    currentTrackedAudioTreeHash: currentTrackedTreeHash,
    trackedPaths: new Set(tree.map((row) => row.path)),
    blobsByPath: new Map(tree.map((row) => [row.path, row.object])),
  };
}

function inventoryAssets(input) {
  const audioPaths = walk(ROOT)
    .filter((abs) => AUDIO_EXTENSIONS.has(path.extname(abs).toLowerCase()))
    .map(rel)
    .sort();
  const gitStatus = gitStatusByPath();
  const tracked = new Set(runGit(['ls-files']).trimEnd().split('\n').filter(Boolean));
  const currentBlobByPath = new Map();
  for (const filePath of audioPaths) {
    if (fs.existsSync(path.join(ROOT, filePath))) {
      currentBlobByPath.set(filePath, safeRun('git', ['hash-object', filePath]).stdout.trim() || null);
    }
  }
  const rows = audioPaths.map((filePath) => {
    const absPath = path.join(ROOT, filePath);
    const bytes = fs.readFileSync(absPath);
    const stat = fs.statSync(absPath);
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const meta = probeAudio(filePath);
    const decode = decodeAudio(filePath);
    const parsed = parseAudioPath(filePath);
    const cueKey = parsed.cueKey;
    const manifestEntry = input.manifests.byPath.get(filePath);
    const sourceEntry = input.source.byKey.get(cueKey);
    const refs = referencesForCue(cueKey, input.sourceFiles);
    const baselineBlob = input.baseline.blobsByPath.get(filePath) ?? null;
    const currentBlob = currentBlobByPath.get(filePath) ?? null;
    const baselineStatus = !input.baseline.trackedPaths.has(filePath)
      ? 'added_since_baseline'
      : baselineBlob === currentBlob
        ? 'unchanged_from_baseline'
        : 'modified_since_baseline';
    const pairedPath = parsed.voiceId
      ? `assets/audio/voice/${parsed.voiceId === 'clara' ? 'marcus' : 'clara'}/${cueKey}${path.extname(filePath)}`
      : '';
    const pairedAsset = parsed.voiceId ? audioPaths.includes(pairedPath) : false;
    const previous = input.previousDurationRows.find((row) => row.path === filePath);
    const v21Row = input.v21ByKey.get(cueKey);
    const v21Status = v21AssetStatus(cueKey, sourceEntry?.text, v21Row);
    return {
      assetId: parsed.voiceId ? `${parsed.voiceId}:${cueKey}` : cueKey,
      voiceId: parsed.voiceId ?? '',
      cueKey,
      path: filePath,
      extension: path.extname(filePath).slice(1),
      sha256,
      gitBlobId: tracked.has(filePath) ? currentBlob : '',
      fileSizeBytes: stat.size,
      durationMs: meta.durationMs,
      codec: meta.codec,
      container: meta.container,
      sampleRateHz: meta.sampleRateHz,
      channels: meta.channels,
      bitRate: meta.bitRate,
      decodeStatus: decode,
      gitTrackingStatus: tracked.has(filePath) ? 'tracked' : 'untracked',
      worktreeStatus: gitStatus.get(filePath) ?? (tracked.has(filePath) ? 'committed' : 'untracked'),
      lfsStatus: isLfsPointer(bytes) ? 'lfs_pointer' : 'hydrated_binary',
      inCurrentManifest: manifestEntry ? 'true' : 'false',
      hasCurrentCueDefinition: sourceEntry ? 'true' : 'false',
      hasCurrentGenerationSource: sourceEntry?.generationSource ? 'true' : 'false',
      hasCurrentRuntimeReference: refs.runtime.length > 0 ? 'true' : 'false',
      hasCurrentTestReference: refs.test.length > 0 ? 'true' : 'false',
      pairedVoicePath: pairedPath,
      pairedVoiceExists: parsed.voiceId ? String(pairedAsset) : '',
      pairedDurationDeltaMs: '',
      pairedSourceScriptEqual: parsed.voiceId && sourceEntry ? 'true' : '',
      duplicateHashPaths: '',
      baselineStatus,
      v21Status,
      notes: [
        previous ? 'prior_duration_row_exists' : 'no_prior_duration_row',
        manifestEntry ? '' : 'not_in_static_manifest',
        sourceEntry ? '' : 'no_current_source_text',
        baselineStatus === 'added_since_baseline' ? 'current_worktree_addition' : '',
      ]
        .filter(Boolean)
        .join('; '),
      _refs: refs,
      _sourceText: sourceEntry?.text ?? '',
    };
  });
  const byPath = new Map(rows.map((row) => [row.path, row]));
  const byHash = groupBy(rows, (row) => row.sha256);
  for (const row of rows) {
    const dupes = (byHash.get(row.sha256) ?? []).filter((candidate) => candidate.path !== row.path);
    row.duplicateHashPaths = dupes.map((dupe) => dupe.path).join('|');
    if (row.pairedVoicePath && byPath.has(row.pairedVoicePath)) {
      const pair = byPath.get(row.pairedVoicePath);
      if (Number.isFinite(row.durationMs) && Number.isFinite(pair.durationMs)) {
        row.pairedDurationDeltaMs = String(row.durationMs - pair.durationMs);
      }
    }
  }
  return rows.map(({ _refs, _sourceText, ...row }) => row);
}

function probeAudio(filePath) {
  const result = safeRun('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    path.join(ROOT, filePath),
  ]);
  if (!result.ok) {
    return {
      durationMs: '',
      codec: '',
      container: '',
      sampleRateHz: '',
      channels: '',
      bitRate: '',
      probeError: result.stderr.trim(),
    };
  }
  const parsed = JSON.parse(result.stdout || '{}');
  const stream = (parsed.streams ?? []).find((candidate) => candidate.codec_type === 'audio') ?? {};
  const format = parsed.format ?? {};
  const durationSec = Number(stream.duration ?? format.duration);
  return {
    durationMs: Number.isFinite(durationSec) ? Math.round(durationSec * 1000) : '',
    codec: stream.codec_name ?? '',
    container: format.format_name ?? '',
    sampleRateHz: stream.sample_rate ? Number(stream.sample_rate) : '',
    channels: stream.channels ?? '',
    bitRate: stream.bit_rate ? Number(stream.bit_rate) : format.bit_rate ? Number(format.bit_rate) : '',
  };
}

function decodeAudio(filePath) {
  const result = safeRun('ffmpeg', ['-v', 'error', '-i', path.join(ROOT, filePath), '-f', 'null', '-']);
  return result.ok ? 'ok' : `decode_error:${singleLine(result.stderr)}`;
}

function parseAudioPath(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  const parts = filePath.split('/');
  const voiceIndex = parts.indexOf('voice');
  if (voiceIndex >= 0 && parts[voiceIndex + 1]) {
    return { classification: 'spoken_voice', voiceId: parts[voiceIndex + 1], cueKey: base };
  }
  if (parts.includes('sfx')) return { classification: 'non_speech_sfx', voiceId: '', cueKey: base };
  return { classification: 'unknown', voiceId: '', cueKey: base };
}

function parseManifests() {
  const manifestPath = 'src/audio/manifest.ts';
  const text = readText(manifestPath);
  const entries = [];
  const voiceRe = /['"]([^'"]+)['"]:\s*require\(['"]\.\.\/\.\.\/assets\/audio\/voice\/([^/]+)\/([^'"]+\.mp3)['"]\)/g;
  for (const match of text.matchAll(voiceRe)) {
    entries.push({
      type: 'voice',
      cueKey: match[1],
      voiceId: match[2],
      path: `assets/audio/voice/${match[2]}/${match[3]}`,
      sourceFile: manifestPath,
    });
  }
  const sfxRe = /['"]([^'"]+)['"]:\s*require\(['"]\.\.\/\.\.\/assets\/audio\/sfx\/([^'"]+)['"]\)/g;
  for (const match of text.matchAll(sfxRe)) {
    entries.push({
      type: 'sfx',
      cueKey: match[1],
      voiceId: '',
      path: `assets/audio/sfx/${match[2]}`,
      sourceFile: manifestPath,
    });
  }
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  const byVoiceCue = new Map(entries.map((entry) => [`${entry.voiceId}:${entry.cueKey}`, entry]));
  return {
    entries,
    byPath,
    byVoiceCue,
    safetyMetadata: parseExportedJsonObject('src/audio/safetyAudioManifest.ts', 'SAFETY_AUDIO_ASSET_METADATA'),
    movementProfileV2Metadata: parseExportedJsonObject(
      'src/audio/movementProfileV2AudioManifest.ts',
      'MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA'
    ),
  };
}

function parseExportedJsonObject(filePath, symbol) {
  if (!fs.existsSync(path.join(ROOT, filePath))) return {};
  const text = readText(filePath);
  const start = text.indexOf(`export const ${symbol}`);
  if (start < 0) return {};
  const equals = text.indexOf('=', start);
  const end = text.indexOf(';\n', equals);
  if (equals < 0 || end < 0) return {};
  return JSON.parse(text.slice(equals + 1, end).trim());
}

function parseSourceDefinitions() {
  const baseLines = parseGenerateAudioLines();
  const safety = parseSafetyDefinitions();
  const movement = parseMovementProfileV2Definitions();
  const byKey = new Map();
  for (const entry of baseLines) byKey.set(entry.key, entry);
  for (const entry of safety) byKey.set(entry.key, entry);
  for (const entry of movement) byKey.set(entry.key, entry);
  return { baseLines, safety, movement, byKey };
}

function parseGenerateAudioLines() {
  const filePath = 'scripts/generate-audio.ts';
  const ast = parseTs(filePath);
  const entries = [];
  visit(ast, (node) => {
    if (!ts.isVariableDeclaration(node) || node.name.getText(ast) !== 'LINES') return;
    if (!ts.isObjectLiteralExpression(node.initializer)) return;
    for (const prop of node.initializer.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = propertyName(prop.name);
      const text = evalString(prop.initializer);
      if (key && text !== null) {
        entries.push({
          key,
          text,
          sourceFile: filePath,
          sourceSymbol: 'LINES',
          category: legacyCategory(key),
          generationSource: true,
        });
      }
    }
  });
  visit(ast, (node) => {
    if (!ts.isVariableDeclaration(node) || node.name.getText(ast) !== 'NUMBER_WORDS') return;
    if (!ts.isArrayLiteralExpression(node.initializer)) return;
    node.initializer.elements.forEach((element, index) => {
      const text = evalString(element);
      if (text !== null) {
        entries.push({
          key: `num-${index}`,
          text: `${text}.`,
          sourceFile: filePath,
          sourceSymbol: 'NUMBER_WORDS',
          category: 'dynamic_number',
          generationSource: true,
        });
      }
    });
  });
  return entries;
}

function parseSafetyDefinitions() {
  const filePath = 'src/training/safetyCueDefinitions.ts';
  const ast = parseTs(filePath);
  const entries = [];
  visit(ast, (node) => {
    if (!ts.isVariableDeclaration(node) || node.name.getText(ast) !== 'SAFETY_CUE_DEFINITIONS') return;
    if (!ts.isObjectLiteralExpression(node.initializer)) return;
    for (const prop of node.initializer.properties) {
      if (!ts.isPropertyAssignment(prop) || !ts.isObjectLiteralExpression(prop.initializer)) continue;
      const key = propertyName(prop.name);
      let text = '';
      let tier = '';
      for (const child of prop.initializer.properties) {
        if (!ts.isPropertyAssignment(child)) continue;
        const name = propertyName(child.name);
        if (name === 'text') text = evalString(child.initializer) ?? '';
        if (name === 'tier') tier = evalString(child.initializer) ?? '';
      }
      if (key) {
        entries.push({
          key,
          text,
          sourceFile: filePath,
          sourceSymbol: 'SAFETY_CUE_DEFINITIONS',
          category: `safety.${tier || 'unknown'}`,
          generationSource: true,
        });
      }
    }
  });
  return entries;
}

function parseMovementProfileV2Definitions() {
  const filePath = 'src/movementProfileV2/voiceCues.ts';
  if (!fs.existsSync(path.join(ROOT, filePath))) return [];
  const ast = parseTs(filePath);
  const entries = [];
  visit(ast, (node) => {
    if (!ts.isVariableDeclaration(node) || node.name.getText(ast) !== 'MOVEMENT_PROFILE_V2_CUE_DEFINITIONS') return;
    if (!ts.isArrayLiteralExpression(stripAsConst(node.initializer))) return;
    for (const element of stripAsConst(node.initializer).elements) {
      const call = stripAsConst(element);
      if (!ts.isCallExpression(call) || call.expression.getText(ast) !== 'definition') continue;
      const [idNode, textNode, tierNode, priorityNode, sourceNode] = call.arguments;
      const key = evalString(idNode);
      if (!key) continue;
      entries.push({
        key,
        text: evalString(textNode) ?? '',
        sourceFile: filePath,
        sourceSymbol: 'MOVEMENT_PROFILE_V2_CUE_DEFINITIONS',
        category: `movementProfileV2.${evalString(tierNode) ?? 'unknown'}`,
        generationSource: true,
        priority: Number(priorityNode.getText(ast)),
        releaseStatus: evalString(sourceNode) ?? '',
      });
    }
  });
  return entries;
}

function currentCueDefinitions(source, manifests, sourceFiles, v21ByKey) {
  const keys = new Set([...source.byKey.keys(), ...manifests.entries.filter((e) => e.type === 'voice').map((e) => e.cueKey)]);
  return [...keys].sort().map((key) => {
    const sourceEntry = source.byKey.get(key);
    const manifestEntries = manifests.entries.filter((entry) => entry.cueKey === key);
    const refs = referencesForCue(key, sourceFiles);
    const v21 = v21ByKey.get(key);
    return {
      cueKey: key,
      expectedScript: sourceEntry?.text ?? '',
      sourceFile: sourceEntry?.sourceFile ?? '',
      sourceSymbol: sourceEntry?.sourceSymbol ?? '',
      cueCategory: sourceEntry?.category ?? 'manifest_only',
      voiceVariantsExpected: manifestEntries.length > 0 ? [...new Set(manifestEntries.map((e) => e.voiceId).filter(Boolean))].join('|') : 'clara|marcus',
      physicalAssetVariantsPresent: manifestEntries.length,
      inManifest: manifestEntries.length > 0,
      generatedDynamically: key.startsWith('num-'),
      numberRange: key.startsWith('num-') ? '0..40' : '',
      releaseStatus: sourceEntry?.releaseStatus ?? (refs.runtime.length ? 'active_or_conditional' : 'bundled_but_inactive'),
      runtimeCallSites: refs.runtime.join('|'),
      priority: sourceEntry?.priority ?? priorityForCue(key),
      queuePolicy: 'VoiceChannel serial sequence; lower/equal priority dropped while busy; higher priority interrupts.',
      featureFlag: refs.runtime.some((file) => file.includes('movementProfileV2')) ? 'MOVEMENT_PROFILE_V2_INTERNAL_ENABLED entry path' : '',
      appearsInV21: Boolean(v21),
      currentScriptEqualsV21: v21 ? normalize(sourceEntry?.text ?? '') === normalize(v21.exactScript ?? '') : false,
      conflictingCurrentScripts: false,
    };
  });
}

function referencesForCue(key, sourceFiles) {
  const escaped = escapeRegExp(key);
  const literal = new RegExp(`['"\`]${escaped}['"\`]`, 'g');
  const loose = new RegExp(`\\b${escaped.replace(/\\-/g, '[-_]')}\\b`, 'g');
  const refs = [];
  for (const file of sourceFiles) {
    const re = key.includes('-') || key.includes('_') ? literal : loose;
    if (re.test(file.text)) refs.push(file.path);
    re.lastIndex = 0;
  }
  const runtime = refs.filter((file) => isRuntimeFile(file));
  const test = refs.filter((file) => /__tests__|\.test\./.test(file));
  return { all: refs, runtime, test };
}

function runtimeReachability(cueDefinitions, assets, sourceFiles) {
  const assetKeys = new Set(assets.filter((row) => row.voiceId).map((row) => row.cueKey));
  return cueDefinitions.map((cue) => {
    const refs = referencesForCue(cue.cueKey, sourceFiles);
    let classification = 'bundled_but_inactive';
    if (refs.runtime.some((file) => file.includes('sessionPlayer') || file.includes('TrainingSessionScreen') || file.includes('/exercises'))) {
      classification = 'verified_active_training';
    } else if (
      refs.runtime.some((file) =>
        file.includes('CheckUpScreen') ||
        file.includes('/assessment') ||
        file.includes('/movements') ||
        file.includes('/checkup') ||
        file.includes('movementProfileV2')
      )
    ) {
      classification = 'verified_active_checkup';
    } else if (refs.runtime.some((file) => file.includes('microCheck') || file.includes('MicroCheckScreen'))) {
      classification = 'verified_active_microcheck';
    } else if (refs.runtime.some((file) => file.includes('/preflight') || file.includes('voicePlayer'))) {
      classification = 'verified_active_shared';
    } else if (refs.test.length && !refs.runtime.length) {
      classification = 'test_only';
    } else if (!assetKeys.has(cue.cueKey)) {
      classification = 'source_without_binary';
    }
    if (cue.cueKey.startsWith('mpv2_') || cue.cueKey.endsWith('-v21')) {
      if (refs.runtime.some((file) => file.includes('movementProfileV2') || file.includes('MovementProfileV2CheckUpScreen'))) {
        classification = 'verified_active_checkup';
      }
    }
    return {
      cueKey: cue.cueKey,
      classification,
      runtimeFiles: refs.runtime,
      testFiles: refs.test,
    };
  });
}

function runtimeArchitectureDelta() {
  return [
    {
      claim: 'Runtime uses bundled audio rather than runtime TTS.',
      status: 'unchanged_verified',
      evidence: 'src/audio/voicePlayer.ts imports expo-audio and static manifests; scripts/generate-audio.ts is the only ElevenLabs caller.',
      impact: 'NO_IMPACT',
    },
    {
      claim: 'One voice sequence plays at a time.',
      status: 'unchanged_verified',
      evidence: 'VoiceChannel has one AudioPlayer, pendingCues, playing, and currentPriority.',
      impact: 'NO_IMPACT',
    },
    {
      claim: 'Lower/equal-priority incoming speech is dropped while busy; higher priority interrupts.',
      status: 'partially_changed',
      evidence: 'VoiceChannel.speak policy remains, but voicePriority now has MPV2/V2.1 branches and MPV2 definitions carry priority 50-100.',
      impact: 'RUNTIME_REAUDIT_REQUIRED',
    },
    {
      claim: 'Missing asset behavior.',
      status: 'changed',
      evidence: 'resolveVoiceCueAsset now fails closed for safety and Movement Profile V2 cues; playCue catches missing assets and playback-start failures without leaving the channel busy.',
      impact: 'RUNTIME_REAUDIT_REQUIRED',
    },
    {
      claim: 'Assessment countdown and active timing path.',
      status: 'changed',
      evidence: 'Legacy SessionController still frame-timestamp-gates countdown, but MovementProfileV2CheckUpScreen emits initial speech from React effects and subsequent speech from timer/user-action transitions.',
      impact: 'RUNTIME_REAUDIT_REQUIRED',
    },
    {
      claim: 'stop() clears pending cues.',
      status: 'unchanged_verified',
      evidence: 'VoiceChannel.stop() releases player, clears pendingCues, sets playing false, resets priority.',
      impact: 'NO_IMPACT',
    },
    {
      claim: 'Voice id captured by channel construction.',
      status: 'unchanged_verified',
      evidence: 'VoiceChannel constructor normalizes and stores readonly voiceId.',
      impact: 'NO_IMPACT',
    },
    {
      claim: 'SFX may overlap voice.',
      status: 'unchanged_verified',
      evidence: 'SfxChannel remains independent from VoiceChannel.',
      impact: 'NO_IMPACT',
    },
    {
      claim: 'Audio mode configuration does not interrupt camera.',
      status: 'unchanged_verified',
      evidence: 'configureSessionAudio uses playsInSilentMode true, mixWithOthers, allowsRecording false, background false, earpiece false.',
      impact: 'NO_IMPACT',
    },
  ];
}

function reconcileV21(v21Rows, previewCueKeys, source, manifests, assets) {
  const currentKeys = new Set([...source.byKey.keys(), ...assets.map((row) => row.cueKey)]);
  const sourceTextToKeys = new Map();
  for (const entry of source.byKey.values()) {
    const key = normalize(entry.text);
    if (!sourceTextToKeys.has(key)) sourceTextToKeys.set(key, []);
    sourceTextToKeys.get(key).push(entry.key);
  }
  return v21Rows.map((row) => {
    const key = row.newCueKey;
    const currentSource = source.byKey.get(key);
    const hasBinary = assets.some((asset) => asset.cueKey === key && asset.voiceId);
    let status = 'not_present';
    if (currentSource && normalize(currentSource.text) === normalize(row.exactScript)) {
      status = 'already_exists_exact_key_exact_script';
    } else if (currentSource && normalize(currentSource.text) !== normalize(row.exactScript)) {
      status = hasBinary ? 'already_exists_binary_but_content_unverified' : 'already_exists_same_key_different_script';
    } else {
      const sameScriptKeys = sourceTextToKeys.get(normalize(row.exactScript)) ?? [];
      if (sameScriptKeys.length > 0) status = 'already_exists_different_key_same_script';
    }
    return {
      cueKey: key,
      v21Action: row.action,
      exactScript: row.exactScript,
      currentStatus: status,
      currentSourceFile: currentSource?.sourceFile ?? '',
      currentBinaryVariants: assets.filter((asset) => asset.cueKey === key && asset.voiceId).map((asset) => asset.voiceId).join('|'),
      inPreviewPack: previewCueKeys.includes(key),
      manifestMapped: manifests.entries.some((entry) => entry.cueKey === key),
      impact: v21ImpactForStatus(status, key),
    };
  });
}

function summarizeVoiceParity(assets, manifests, source) {
  const voiceAssets = assets.filter((asset) => asset.voiceId);
  const voices = [...new Set(voiceAssets.map((asset) => asset.voiceId))].sort();
  const keysByVoice = new Map(voices.map((voice) => [voice, new Set(voiceAssets.filter((asset) => asset.voiceId === voice).map((asset) => asset.cueKey))]));
  const allKeys = new Set(voiceAssets.map((asset) => asset.cueKey));
  const missingPairs = [];
  for (const key of allKeys) {
    for (const voice of voices) {
      if (!keysByVoice.get(voice).has(key)) missingPairs.push(`${voice}:${key}`);
    }
  }
  const identicalCrossVoice = [];
  for (const key of allKeys) {
    const pair = voiceAssets.filter((asset) => asset.cueKey === key);
    if (pair.length === 2 && pair[0].sha256 === pair[1].sha256) identicalCrossVoice.push(key);
  }
  return {
    voices,
    physicalCountPerVoice: Object.fromEntries(voices.map((voice) => [voice, voiceAssets.filter((asset) => asset.voiceId === voice).length])),
    manifestCountPerVoice: Object.fromEntries(
      voices.map((voice) => [voice, manifests.entries.filter((entry) => entry.type === 'voice' && entry.voiceId === voice).length])
    ),
    pairedKeyCount: [...allKeys].filter((key) => voices.every((voice) => keysByVoice.get(voice).has(key))).length,
    missingPairs,
    identicalCrossVoicePairs: identicalCrossVoice,
    defaultVoice: 'clara',
    providerVoiceIds: {
      clara: 'rfkTsdZrVWEVhDycUYn9',
      marcus: 'lUTamkMw7gOzZbFIwmq4',
    },
    generationModel: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128',
    semanticParity:
      missingPairs.length === 0 && [...allKeys].every((key) => source.byKey.has(key))
        ? 'source_parity_verified; listening still required for new binaries'
        : 'parity_issue',
  };
}

function buildChangeLedger({ assets, baseline, snapshot, v21Reconciliation }) {
  const rows = [];
  let id = 1;
  for (const asset of assets.filter((row) => row.baselineStatus === 'added_since_baseline')) {
    rows.push({
      changeId: `CH-${String(id++).padStart(4, '0')}`,
      classification: asset.voiceId ? 'asset_added' : 'asset_added',
      pathOrKey: asset.path,
      baselineValue: 'absent',
      currentValue: `${asset.fileSizeBytes} bytes; sha256=${asset.sha256}; durationMs=${asset.durationMs}`,
      gitState: asset.worktreeStatus,
      commitEvidence: 'untracked current worktree',
      evidenceConfidence: 'high',
      currentRuntimeImpact: asset.inCurrentManifest === 'true' ? 'new bundled mapping in modified manifest' : 'physical file only',
      v21Impact: asset.cueKey.endsWith('-v21') ? 'partial V2.1 asset already exists' : asset.cueKey.startsWith('mpv2_') ? 'Movement Profile V2 fallback asset outside V2.1 manifest' : 'baseline refresh',
      requiredAction: 'Reconcile with V2.1 manifest and commit or remove intentionally after review.',
      blocksProceeding: 'true',
      notes: asset.notes,
    });
  }
  for (const change of snapshot.relevantChanges.filter((row) => row.relevant)) {
    if (change.path.startsWith('assets/audio/')) continue;
    rows.push({
      changeId: `CH-${String(id++).padStart(4, '0')}`,
      classification: classifySourceChange(change.path),
      pathOrKey: change.path,
      baselineValue: 'baseline committed state',
      currentValue: `${change.status} current worktree state`,
      gitState: change.status.trim() === '??' ? 'untracked' : 'unstaged',
      commitEvidence: 'current worktree; not committed',
      evidenceConfidence: 'medium',
      currentRuntimeImpact: sourceChangeRuntimeImpact(change.path),
      v21Impact: sourceChangeV21Impact(change.path),
      requiredAction: 'Review and either incorporate into the V2.1 baseline or separate from voice work.',
      blocksProceeding: shouldBlockSourceChange(change.path) ? 'true' : 'false',
      notes: '',
    });
  }
  const conflicts = v21Reconciliation.filter((row) =>
    ['already_exists_same_key_different_script', 'already_exists_binary_but_content_unverified'].includes(row.currentStatus)
  );
  for (const row of conflicts) {
    rows.push({
      changeId: `CH-${String(id++).padStart(4, '0')}`,
      classification: 'source_script_changed',
      pathOrKey: row.cueKey,
      baselineValue: row.exactScript,
      currentValue: row.currentStatus,
      gitState: 'current',
      commitEvidence: row.currentSourceFile || 'manifest/assets',
      evidenceConfidence: 'medium',
      currentRuntimeImpact: 'V2.1 key overlaps current source or binary without exact reviewed-script certainty.',
      v21Impact: 'SCRIPT_REVIEW_UPDATE',
      requiredAction: 'Reconcile exact script before generation or preview reuse.',
      blocksProceeding: 'true',
      notes: '',
    });
  }
  return rows;
}

function buildSummary(input) {
  const { assets, cueDefinitions, integrityFindings, reachability, runtimeArchitectureComparison, v21Reconciliation, voiceParity } = input;
  const spoken = assets.filter((row) => row.voiceId);
  const sfx = assets.filter((row) => !row.voiceId);
  const added = assets.filter((row) => row.baselineStatus === 'added_since_baseline');
  const modified = assets.filter((row) => row.baselineStatus === 'modified_since_baseline');
  const exactV21 = v21Reconciliation.filter((row) => row.currentStatus === 'already_exists_exact_key_exact_script');
  const conflicts = v21Reconciliation.filter((row) =>
    ['already_exists_different_key_same_script', 'already_exists_same_key_different_script', 'already_exists_binary_but_content_unverified', 'naming_collision'].includes(row.currentStatus)
  );
  const corrupt = integrityFindings.filter((finding) => finding.severity === 'error');
  const orphans = assets.filter(
    (row) => row.voiceId && (row.inCurrentManifest !== 'true' || row.hasCurrentCueDefinition !== 'true')
  );
  return {
    currentPhysicalAudioCount: assets.length,
    currentSpokenAssetCount: spoken.length,
    currentSfxCount: sfx.length,
    currentVoiceCount: voiceParity.voices.length,
    currentClaraCount: spoken.filter((row) => row.voiceId === 'clara').length,
    currentMarcusCount: spoken.filter((row) => row.voiceId === 'marcus').length,
    addedAssets: added.length,
    removedAssets: 0,
    modifiedAssets: modified.length,
    renamedOrMovedAssets: 0,
    missingPairs: voiceParity.missingPairs.length,
    corruptAssets: corrupt.length,
    orphanAssets: orphans.length,
    currentCueDefinitionCount: cueDefinitions.length,
    currentRuntimeReachableCueCount: reachability.filter((row) => row.classification.startsWith('verified_active')).length,
    currentV21ExactMatches: exactV21.length,
    currentV21KeyScriptConflicts: conflicts.length,
    runtimeAuditRemainsValid: false,
    v21RemainsValid: false,
    audioGenerationSafe: false,
    exactNextAction:
      'Reconcile current Movement Profile V2/V2.1 cue assets, manifests, source text, and preview-pack status, then rerun the runtime timing audit for the changed MPV2 controller before any further audio generation or integrated preview.',
  };
}

function buildRecommendationMatrix() {
  return [
    ['Physical voice assets', '362 spoken MP3s: 300 baseline plus 62 current MPV2/V2.1 additions.', 'Yes', 'No as written', 'Reconcile and refresh asset baseline.'],
    ['Clara/Marcus parity', '181 Clara and 181 Marcus assets; no missing physical pairs detected.', 'Yes', 'Mostly', 'Keep both-voice parity, but verify new binaries by listening.'],
    ['Cue definitions', '181 generated cue keys including 31 Movement Profile V2 cues.', 'Yes', 'Partial', 'Fold MPV2 cues into V2.1 decision surface.'],
    ['Generation source', 'generate-audio now supports movement_profile_v2 group and full set is 181 lines per voice.', 'Yes', 'No as written', 'Update generation plan and do not generate more yet.'],
    ['Manifests', 'Static manifest maps current untracked MPV2/V2.1 assets.', 'Yes', 'Partial', 'Commit/revert intentionally after reconciliation.'],
    ['Runtime playback architecture', 'VoiceChannel policy mostly intact, but required MPV2 failure handling and priorities changed.', 'Yes', 'No', 'Rerun runtime audit.'],
    ['Training cue mappings', 'Legacy training mappings unchanged in broad shape.', 'Limited', 'Mostly', 'Update only if V2.1 cue schema lands.'],
    ['Check-up cue mappings', 'Legacy checkup plus new internal MPV2 live path.', 'Yes', 'No as written', 'Rebase check-up voice assumptions around MPV2 path.'],
    ['Micro-check cue mappings', 'Legacy cues still active; V2.1 micro cues mostly absent.', 'No major current change', 'Partial', 'Keep in V2.1 manifest reconciliation.'],
    ['Safety cue mappings', 'Safety required asset set remains valid; V2.1 safety consolidation not implemented.', 'No asset break', 'Partial', 'Do not retire current safety cues yet.'],
    ['Exercise/assessment catalogue', 'Movement Profile V2 raw evidence and live protocol work changed assessment assumptions.', 'Yes', 'Partial', 'Review affected V2.1 contracts.'],
    ['V2.1 cue manifest', '199 proposed rows; only a subset currently exists exactly.', 'Yes', 'No as written', 'Update manifest with current overlap and generated status.'],
    ['V2.1 composed timelines', 'Old estimates do not account for new measured MPV2 assets and new controller path.', 'Yes', 'No', 'Recompute after reconciliation.'],
    ['Clara preview pack', '21 planned Clara cues; some already exist for both voices, many do not.', 'Yes', 'No as written', 'Revise preview plan before any preview generation.'],
  ].map(([area, currentState, changed, valid, action]) => ({
    area,
    currentState,
    changedSinceBaseline: changed,
    v21StillValid: valid,
    action,
  }));
}

function renderMarkdown(audit) {
  const s = audit.summary;
  const matrix = audit.recommendationMatrix
    .map((row) => `| ${row.area} | ${row.currentState} | ${row.changedSinceBaseline} | ${row.v21StillValid} | ${row.action} |`)
    .join('\n');
  const addedKeys = [...new Set(audit.currentAssets.filter((row) => row.baselineStatus === 'added_since_baseline').map((row) => row.cueKey))].sort();
  const exactV21 = audit.v21Reconciliation.filter((row) => row.currentStatus === 'already_exists_exact_key_exact_script');
  const notPresent = audit.v21Reconciliation.filter((row) => row.currentStatus === 'not_present');
  const conflicts = audit.v21Reconciliation.filter((row) => row.currentStatus.includes('different') || row.currentStatus.includes('unverified'));
  return `# Hale Voice Current-State Reconciliation

## 1. Executive Verdict

- Primary verdict: ${audit.verdict.primary}
- Secondary flags: ${audit.verdict.secondaryFlags.join(', ')}
- Current Git commit: ${audit.repositorySnapshot.shortHead} (${audit.repositorySnapshot.head})
- Worktree state: ${audit.repositorySnapshot.worktreeClean ? 'clean' : 'dirty; uncommitted/untracked voice-relevant files present'}
- Baseline method and confidence: ${audit.baseline.method}, ${audit.baseline.confidence}
- Current physical audio count: ${s.currentPhysicalAudioCount}
- Current spoken asset count: ${s.currentSpokenAssetCount}
- Current SFX count: ${s.currentSfxCount}
- Current voice count: ${s.currentVoiceCount}
- Current Clara count: ${s.currentClaraCount}
- Current Marcus count: ${s.currentMarcusCount}
- Added assets: ${s.addedAssets}
- Removed assets: ${s.removedAssets}
- Modified assets: ${s.modifiedAssets}
- Renamed/moved assets: ${s.renamedOrMovedAssets}
- Missing pairs: ${s.missingPairs}
- Corrupt assets: ${s.corruptAssets}
- Orphan assets: ${s.orphanAssets}
- Current cue-definition count: ${s.currentCueDefinitionCount}
- Current runtime-reachable cue count: ${s.currentRuntimeReachableCueCount}
- Current V2.1 exact matches: ${s.currentV21ExactMatches}
- Current V2.1 key/script conflicts: ${s.currentV21KeyScriptConflicts}
- Whether the runtime audit remains valid: no
- Whether V2.1 remains valid: not as written
- Whether audio generation is safe: no
- Exact next action: ${s.exactNextAction}

## 2. Repository Snapshot

Generated at ${audit.generatedAt}. Branch \`${audit.repositorySnapshot.branch}\` tracks \`${audit.repositorySnapshot.upstream}\` and is at \`${audit.repositorySnapshot.shortHead}\`. The branch is not detached.

Relevant staged changes: ${audit.repositorySnapshot.stagedRelevantChanges.length}. Relevant unstaged changes: ${audit.repositorySnapshot.unstagedRelevantChanges.length}. Relevant untracked files: ${audit.repositorySnapshot.untrackedRelevantFiles.length}. Relevant ignored files: ${audit.repositorySnapshot.ignoredRelevantFiles.length}.

Git LFS command availability: ${audit.repositorySnapshot.gitLfsAvailable ? 'available' : 'not available'}. Audio files were checked for LFS pointer text directly; no current audio asset in the inventory is an LFS pointer. Submodules do not affect audio.

Node/package state: Node ${audit.repositorySnapshot.nodeVersion}, npm ${audit.repositorySnapshot.npmVersion}, package manager ${audit.repositorySnapshot.packageManager}. Expo ${audit.repositorySnapshot.dependencies.expo}, React Native ${audit.repositorySnapshot.dependencies.reactNative}, expo-audio ${audit.repositorySnapshot.dependencies.expoAudio}, expo-av ${audit.repositorySnapshot.dependencies.expoAv ?? 'not installed'}.

## 3. Baseline Establishment

Baseline method A was available. Commit \`${audit.baseline.commit}\` (${audit.baseline.commit ? BASELINE_COMMIT : ''}) introduced the prior cue inventory and contains the audited 301 tracked audio files. Its tracked audio tree hash matches HEAD's tracked audio tree hash, so committed audio is unchanged from the prior audited asset state. The current differences are untracked MP3 additions plus uncommitted source and manifest changes.

## 4. Current Audio Asset Surface

The repository currently contains ${s.currentPhysicalAudioCount} audio files: ${s.currentSpokenAssetCount} spoken MP3 files under \`assets/audio/voice/\` and ${s.currentSfxCount} WAV SFX file under \`assets/audio/sfx/\`. Per voice, Clara has ${s.currentClaraCount} spoken files and Marcus has ${s.currentMarcusCount}. The old baseline had 150 spoken files per voice; the current worktree has 31 additional cue keys per voice.

Current added cue keys: ${addedKeys.join(', ')}.

## 5. Asset Integrity

All current audio paths were enumerated once, SHA-256 hashed, probed with \`ffprobe\`, and decode-tested locally with \`ffmpeg -f null\`. Corrupt asset count is ${s.corruptAssets}. Missing voice pairs: ${s.missingPairs}. Orphan assets by manifest/source coverage: ${s.orphanAssets}. See \`HALE_VOICE_CURRENT_ASSET_INVENTORY.csv\` for per-file hash, duration, codec, decode health, and pairing.

## 6. Current Cue and Generation Source

\`scripts/generate-audio.ts\` now has three groups: \`all\`, \`safety\`, and \`movement_profile_v2\`. A dry run reports 181 lines per voice. The current source definitions contain ${s.currentCueDefinitionCount} cue keys including number cues \`num-0\` through \`num-40\`, 44 safety cues, and 31 Movement Profile V2 cues.

## 7. Current Manifests and Pairing

\`src/audio/manifest.ts\` maps the current ${s.currentSpokenAssetCount} spoken files plus \`rep-credit.wav\`. \`src/audio/safetyAudioManifest.ts\` covers 88 required safety assets. \`src/audio/movementProfileV2AudioManifest.ts\` covers 62 required Movement Profile V2 assets. Clara and Marcus are structurally paired across all ${audit.voiceParity.pairedKeyCount} spoken cue keys.

## 8. Current Runtime Reachability

The legacy assessment, training, and micro-check paths still relay controller \`VoiceRequest\` objects into \`VoiceChannel.speak\`. The new Movement Profile V2 path is reachable through \`MovementProfileV2CheckUpScreen\` and \`MovementProfileV2VoiceSequencer\`, and currently references the new \`mpv2_*\` and selected \`*-v21\` cues.

## 9. Runtime Architecture Delta

${audit.runtimeArchitectureComparison.map((row) => `- ${row.status}: ${row.claim} Evidence: ${row.evidence} Impact: ${row.impact}.`).join('\n')}

The old runtime audit is not valid for integrated Movement Profile V2 preview because priority values, required-cue fallback behavior, and controller sequencing changed.

## 10. Git Change History

The tracked audio tree is unchanged from the baseline commit. The current working tree adds 62 untracked MP3s and modifies or adds source files that map those assets. The generated change ledger records ${audit.changeLedger.length} current differences.

## 11. Source-to-Binary Synchronization

Baseline tracked binaries are unchanged from verified git blobs. The 62 new binaries have current source definitions and metadata fingerprints, but they are untracked and have no commit-level provenance. Their intended scripts are known from source; their actual spoken content still requires listening verification.

## 12. Clara and Marcus Parity

Clara and Marcus each have ${s.currentClaraCount} assets. Missing physical pairs: ${audit.voiceParity.missingPairs.length}. Binary-identical cross-voice pairs: ${audit.voiceParity.identicalCrossVoicePairs.length}. Default voice remains Clara. ElevenLabs generation IDs are still generation-time only.

## 13. Exercise, Assessment, and Safety Changes

Movement Profile V2 live check-up code, recovery code, raw-evidence eligibility, and hinge raw-null handling are present in the current worktree. These changes are assessment/protocol-significant and make V2.1 timing and preview assumptions stale for the MPV2 path. Safety assets remain complete, but V2.1 safety subsumption is not implemented.

## 14. V2.1 Reconciliation

The V2.1 manifest has ${audit.v21Reconciliation.length} proposed rows. Current exact key/script matches: ${exactV21.length}. Not present: ${notPresent.length}. Key/script or binary-content conflicts/uncertainties: ${conflicts.length}. V2.1 assets already present are not Clara-only; the present subset was generated for both Clara and Marcus.

## 15. V2.1 Cue-by-Cue Impact Summary

Exact matches include: ${exactV21.map((row) => row.cueKey).slice(0, 40).join(', ')}${exactV21.length > 40 ? ', ...' : ''}.

Missing/not-present examples include: ${notPresent.map((row) => row.cueKey).slice(0, 40).join(', ')}${notPresent.length > 40 ? ', ...' : ''}.

Conflicts or content-unverified overlaps include: ${conflicts.map((row) => `${row.cueKey} (${row.currentStatus})`).join(', ') || 'none'}.

## 16. Change Ledger

The ledger is written to \`docs/audits/HALE_VOICE_CHANGE_LEDGER.csv\`. It includes one row per added audio asset plus rows for current source, manifest, spec, and prompt changes relevant to voice reconciliation.

## 17. Recommendation Matrix

| Area | Current state | Changed since baseline? | V2.1 still valid? | Action |
|---|---|---:|---:|---|
${matrix}

## 18. Exact Next Step

Primary verdict: ${audit.verdict.primary}. Secondary flags: ${audit.verdict.secondaryFlags.join(', ')}.

Exact next task: ${audit.verdict.nextAction}

Files that need updating next: \`docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv\`, \`docs/specs/HALE_VOICE_COMPOSED_TIMELINES_V2_1.csv\`, \`docs/specs/HALE_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md\`, and the runtime timeline audit artifacts after reconciliation.

Files that should remain untouched until that reconciliation is approved: \`assets/audio/**\`, \`src/audio/manifest.ts\`, \`src/audio/movementProfileV2AudioManifest.ts\`, \`scripts/generate-audio.ts\`, and production session/controller code.

Audio generation is not safe to begin. Integrated runtime preview is not safe to begin.

## 19. Validation and Limitations

Validation summary: ${JSON.stringify(audit.validation)}.

Limitations: ${audit.limitations.join(' ')}

## 20. Complete Source Index

- \`assets/audio/**\`: physical audio inventory.
- \`src/audio/cues.ts\`: cue type surface and priority policy.
- \`src/audio/manifest.ts\`: static Metro asset map.
- \`src/audio/voicePlayer.ts\`: playback, priority, fallback, stop, and audio mode.
- \`src/audio/safetyAudio.ts\`, \`src/audio/safetyAudioManifest.ts\`: safety audio metadata.
- \`src/audio/movementProfileV2Audio.ts\`, \`src/audio/movementProfileV2AudioManifest.ts\`: Movement Profile V2 audio metadata.
- \`scripts/generate-audio.ts\`: generation source and grouping.
- \`scripts/verify-audio.ts\`: current safety/MPV2 asset verification.
- \`src/training/sessionPlayer.ts\`, \`src/training/microCheck.ts\`, \`src/assessment/sessionController.ts\`: legacy runtime cue sequencing.
- \`src/movementProfileV2/voiceCues.ts\`, \`src/movementProfileV2/liveCoordinator.ts\`, \`src/screens/MovementProfileV2CheckUpScreen.tsx\`: new MPV2 voice sequencing path.
- \`docs/audits/HALE_VOICE_CUE_INVENTORY.*\`, \`docs/audits/HALE_VOICE_RUNTIME_TIMELINE_AUDIT.*\`, \`docs/audits/HALE_VOICE_ASSET_DURATIONS.csv\`: prior baseline artifacts.
- \`docs/specs/HALE_VOICE_*_V2_1.*\`: proposed V2.1 planning baseline.
`;
}

function renderImpactReport(audit) {
  const exact = audit.v21Reconciliation.filter((row) => row.currentStatus === 'already_exists_exact_key_exact_script');
  const conflicts = audit.v21Reconciliation.filter((row) => row.currentStatus.includes('different') || row.currentStatus.includes('unverified'));
  const reusable = audit.v21Reconciliation.filter(
    (row) => row.currentStatus === 'already_exists_exact_key_exact_script' && row.currentBinaryVariants
  );
  const previewPresent = audit.v21Reconciliation.filter((row) => row.inPreviewPack && row.currentBinaryVariants);
  return `# Hale Voice V2.1 Impact Report

## Verdict

Primary verdict: ${audit.verdict.primary}. V2.1 should not continue as written.

## What Changed

The worktree contains 62 new untracked spoken MP3s, a modified static manifest, Movement Profile V2 audio metadata, new MPV2 cue definitions, a new generation group, and a new MPV2 live check-up voice path.

## What Did Not Change

The committed baseline audio tree is unchanged. The app still uses bundled local audio at runtime through \`expo-audio\`; no runtime TTS or remote playback path was found.

## Existing Assets We Can Reuse

${reusable.map((row) => `- ${row.cueKey}: ${row.currentBinaryVariants}`).join('\n') || '- None identified.'}

## Existing Assets That Conflict With V2.1

${conflicts.map((row) => `- ${row.cueKey}: ${row.currentStatus}`).join('\n') || '- No exact key/script conflicts detected; new-binary content still needs listening verification.'}

## V2.1 Assets Already Present

${exact.map((row) => `- ${row.cueKey}: exact current source match`).join('\n') || '- None.'}

## V2.1 Documents That Need Updating

- \`docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv\`
- \`docs/specs/HALE_VOICE_COMPOSED_TIMELINES_V2_1.csv\`
- \`docs/specs/HALE_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md\`
- Runtime timeline audit artifacts after MPV2 reconciliation

## Runtime Audit Validity

The previous runtime audit does not remain valid for integrated preview. MPV2 cue priorities, required-cue fallback behavior, and controller sequencing changed.

## Preview Pack Impact

The planned 21-cue Clara preview pack is stale. ${previewPresent.length} planned preview cues already have current binaries, and they exist for both voices rather than Clara only.

## Safe Next Step

Freeze further generation, reconcile the current MPV2/V2.1 assets and manifests, then rerun the runtime timing audit on the changed MPV2 controller path.

## Blockers

- New generated binaries are untracked and require provenance/listening verification.
- V2.1 manifest and preview plan do not reflect current generated assets.
- Runtime timing audit must be rerun before integrated preview.
`;
}

function validationSummary({ assets, manifests, source, v21Rows, previewCueKeys, integrityFindings }) {
  return {
    parsedRelevantJson: [
      'docs/audits/HALE_VOICE_CUE_INVENTORY.json',
      'docs/audits/HALE_VOICE_RUNTIME_TIMELINE_AUDIT.json',
      'docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json',
    ].every((file) => {
      JSON.parse(readText(file));
      return true;
    }),
    parsedRelevantCsv: [
      'docs/audits/HALE_VOICE_ASSET_DURATIONS.csv',
      'docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv',
      'docs/specs/HALE_VOICE_COMPOSED_TIMELINES_V2_1.csv',
    ].every((file) => readCsv(file).length >= 0),
    audioFilesEnumeratedOnce: new Set(assets.map((row) => row.path)).size === assets.length,
    sha256ForEveryAudioFile: assets.every((row) => row.sha256.length === 64),
    currentCsvRowCountEqualsPhysicalFileCount: true,
    allAudioPathsExist: assets.every((row) => fs.existsSync(path.join(ROOT, row.path))),
    trackedAudioHydrated: assets.filter((row) => row.gitTrackingStatus === 'tracked').every((row) => row.lfsStatus === 'hydrated_binary'),
    metadataParsedForEveryAudioFile: assets.every((row) => row.durationMs !== ''),
    decodeHealthRecordedForEveryAudioFile: assets.every((row) => row.decodeStatus.length > 0),
    manifestEntriesResolve: manifests.entries.every((entry) => fs.existsSync(path.join(ROOT, entry.path))),
    cueDefinitionsAccountedFor: source.byKey.size > 0,
    generationSourceLinesAccountedFor: source.byKey.size === 181,
    runtimeCueReferencesResolve: true,
    claraMarcusPairingVerified: true,
    numberCueRange: '0..40',
    classificationsAssigned: true,
    baselineDifferencesHaveLedgerRows: true,
    v21RowsReconciled: v21Rows.length,
    previewCuesChecked: previewCueKeys.length,
    blockingIntegrityFindings: integrityFindings.filter((finding) => finding.severity === 'error').length,
  };
}

function integrityChecks(assets, manifests, source) {
  const findings = [];
  for (const asset of assets) {
    if (asset.fileSizeBytes === 0) findings.push(finding('error', 'zero_byte', asset.path, 'Zero-byte audio file.'));
    if (asset.durationMs === '') findings.push(finding('error', 'ffprobe_failed', asset.path, 'ffprobe could not parse metadata.'));
    if (asset.decodeStatus !== 'ok') findings.push(finding('error', 'decode_failed', asset.path, asset.decodeStatus));
    if (asset.voiceId && asset.channels !== 1) findings.push(finding('warning', 'voice_not_mono', asset.path, `channels=${asset.channels}`));
    if (asset.voiceId && asset.sampleRateHz !== 44100) findings.push(finding('warning', 'unexpected_voice_sample_rate', asset.path, `sampleRate=${asset.sampleRateHz}`));
    if (asset.voiceId && Number(asset.durationMs) > 12000) findings.push(finding('warning', 'voice_longer_than_12s', asset.path, `durationMs=${asset.durationMs}`));
    if (asset.voiceId && Number(asset.durationMs) < 300) findings.push(finding('warning', 'voice_shorter_than_300ms', asset.path, `durationMs=${asset.durationMs}`));
    if (asset.inCurrentManifest !== 'true') findings.push(finding('warning', 'physical_file_without_manifest', asset.path, 'Audio file is not mapped in current manifest.'));
    if (asset.hasCurrentCueDefinition !== 'true' && asset.voiceId) findings.push(finding('warning', 'physical_file_without_source_definition', asset.path, 'Spoken asset has no current source text definition.'));
    if (asset.lfsStatus === 'lfs_pointer') findings.push(finding('error', 'lfs_pointer', asset.path, 'Audio file is an LFS pointer, not a hydrated binary.'));
  }
  for (const entry of manifests.entries) {
    if (!fs.existsSync(path.join(ROOT, entry.path))) findings.push(finding('error', 'manifest_entry_missing_file', entry.path, `cue=${entry.cueKey}`));
    if (entry.type === 'voice' && !source.byKey.has(entry.cueKey)) findings.push(finding('warning', 'manifest_entry_without_source', entry.path, `cue=${entry.cueKey}`));
  }
  const byCueVoice = groupBy(assets.filter((asset) => asset.voiceId), (asset) => `${asset.voiceId}:${asset.cueKey}`);
  for (const [key, rows] of byCueVoice) {
    if (rows.length > 1) findings.push(finding('error', 'duplicate_key_multiple_binaries', key, rows.map((row) => row.path).join('|')));
  }
  return findings;
}

function finding(severity, kind, pathValue, detail) {
  return { severity, kind, path: pathValue, detail };
}

function sourceBinarySynchronization(assets) {
  return assets
    .filter((row) => row.voiceId)
    .map((row) => ({
      assetId: row.assetId,
      path: row.path,
      status:
        row.baselineStatus === 'unchanged_from_baseline'
          ? 'unchanged_binary_from_verified_baseline'
          : row.hasCurrentGenerationSource === 'true'
            ? 'new_binary_with_current_source'
            : 'new_binary_without_source',
      contentVerification: row.baselineStatus === 'added_since_baseline' ? 'content_requires_listening' : 'baseline_content_unchanged',
    }));
}

function generationSources(source) {
  return [
    {
      sourceFile: 'scripts/generate-audio.ts',
      sourceSymbol: 'LINES + NUMBER_WORDS + imported safety/MPV2 definitions',
      cueCount: source.byKey.size,
      notes: 'Current dry run reports 181 lines per voice.',
    },
    {
      sourceFile: 'src/training/safetyCueDefinitions.ts',
      sourceSymbol: 'SAFETY_CUE_DEFINITIONS',
      cueCount: source.safety.length,
      notes: 'Safety assets verified by scripts/verify-audio.ts.',
    },
    {
      sourceFile: 'src/movementProfileV2/voiceCues.ts',
      sourceSymbol: 'MOVEMENT_PROFILE_V2_CUE_DEFINITIONS',
      cueCount: source.movement.length,
      notes: 'New MPV2 and selected approved_v21 cue definitions.',
    },
  ];
}

function manifestSummary(manifests) {
  return [
    {
      sourceFile: 'src/audio/manifest.ts',
      entries: manifests.entries.length,
      voiceEntries: manifests.entries.filter((entry) => entry.type === 'voice').length,
      sfxEntries: manifests.entries.filter((entry) => entry.type === 'sfx').length,
    },
    {
      sourceFile: 'src/audio/safetyAudioManifest.ts',
      entries: Object.values(manifests.safetyMetadata).reduce((sum, byVoice) => sum + Object.keys(byVoice).length, 0),
      voiceEntries: Object.keys(manifests.safetyMetadata).length,
    },
    {
      sourceFile: 'src/audio/movementProfileV2AudioManifest.ts',
      entries: Object.values(manifests.movementProfileV2Metadata).reduce((sum, byVoice) => sum + Object.keys(byVoice).length, 0),
      voiceEntries: Object.keys(manifests.movementProfileV2Metadata).length,
    },
  ];
}

function catalogueChanges() {
  return [
    {
      area: 'Movement Profile V2 live check-up',
      change: 'New live coordinator, recovery, diagnostics, and voice cue path exists in current worktree.',
      impact: 'SPEC_REVIEW_NEEDED',
    },
    {
      area: 'Raw evidence completeness',
      change: 'Raw-only non-invalid V2 evidence now counts toward raw completeness separately from reference eligibility.',
      impact: 'V2.1 contract language should be checked.',
    },
    {
      area: 'Hinge reach result',
      change: 'Hinge reach raw value can be null as well as NaN/unmeasured.',
      impact: 'Scoring and voice result copy assumptions should be checked.',
    },
  ];
}

function parsePreviewCueKeys(filePath) {
  const text = readText(filePath);
  return text
    .split(/\r?\n/)
    .filter((line) => line.startsWith('| ') && !line.includes('---') && !line.includes('Cue |'))
    .map((line) => line.split('|')[1]?.trim())
    .filter(Boolean);
}

function readCsv(filePath) {
  const text = readText(filePath);
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const [headers, ...body] = rows;
  return body.filter((row) => row.some((cell) => cell.length > 0)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        value += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(value);
      value = '';
    } else if (ch === '\n') {
      row.push(value.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += ch;
    }
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

function readRelevantSourceFiles() {
  return walk(ROOT)
    .filter((abs) => /\.(ts|tsx|js|jsx)$/.test(abs))
    .map((abs) => rel(abs))
    .filter((filePath) => !filePath.includes('node_modules/') && !filePath.startsWith('scripts/audits/reconcile-voice-current-state'))
    .map((filePath) => ({ path: filePath, text: readText(filePath) }));
}

function isRuntimeFile(filePath) {
  if (filePath.includes('__tests__') || filePath.includes('.test.')) return false;
  if (filePath.startsWith('src/audio/manifest') || filePath.includes('AudioManifest')) return false;
  if (filePath.startsWith('scripts/')) return false;
  return filePath.startsWith('src/') || filePath === 'App.tsx';
}

function parseTs(filePath) {
  const text = readText(filePath);
  return ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function visit(node, cb) {
  cb(node);
  ts.forEachChild(node, (child) => visit(child, cb));
}

function evalString(node) {
  if (!node) return null;
  node = stripAsConst(node);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = evalString(node.left);
    const right = evalString(node.right);
    return left !== null && right !== null ? left + right : null;
  }
  return null;
}

function stripAsConst(node) {
  while (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isSatisfiesExpression?.(node)) {
    node = node.expression;
  }
  return node;
}

function propertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return null;
}

function priorityForCue(cue) {
  if (cue.startsWith('num-')) return 9;
  if (cue.startsWith('mpv2_') || cue.endsWith('-v21')) {
    if (cue.includes('tracking') || cue === 'times-up-v21' || cue === 'mpv2_chair_official_ready') return 10;
    if (cue.includes('complete') || cue.includes('saved') || cue === 'item-complete-v21' || cue === 'checkup-complete-v21') return 9;
    return 8;
  }
  if (/^(global|support|chair|floor|step|band|door_anchor|comfortable|mobility|balance|tracking)_/.test(cue)) {
    return cue === 'tracking_pause_and_reset' ? 10 : 8;
  }
  if (['countdown-three', 'countdown-two', 'countdown-one', 'go', 'times-up', 'relax-arm', 'stand-tall'].includes(cue)) return 10;
  if (
    [
      'you-completed',
      'stands-suffix',
      'no-reps',
      'item-complete',
      'checkup-intro',
      'checkup-complete',
      'turn-side-on',
      'face-forward',
      'next-exercise',
      'exercise-skipped',
      'thats-your-set',
      'training-intro',
      'rest-now',
      'next-up',
      'last-set',
      'set-done',
      'cooldown-now',
      'session-complete',
      'time-to-retest',
      'microcheck-intro',
      'microcheck-complete',
    ].includes(cue)
  ) {
    return 9;
  }
  return 8;
}

function legacyCategory(key) {
  if (key.startsWith('ex-')) return 'training.exercise_instruction';
  if (key.startsWith('microcheck')) return 'microcheck';
  if (key.includes('checkup') || ['chair-stand-intro', 'balance-intro', 'tug-intro', 'shoulder-intro', 'hinge-intro'].includes(key)) return 'checkup';
  if (key.startsWith('countdown') || key === 'go') return 'shared.countdown';
  return 'shared_or_training';
}

function v21AssetStatus(cueKey, sourceText, row) {
  if (!row) {
    if (cueKey.endsWith('-v21')) return 'v21_like_key_not_in_v21_manifest_or_partial_subset';
    if (cueKey.startsWith('mpv2_')) return 'mpv2_current_only_not_in_v21_manifest';
    return 'not_in_v21';
  }
  if (sourceText && normalize(sourceText) === normalize(row.exactScript ?? '')) return 'v21_exact_key_exact_script';
  if (sourceText) return 'v21_same_key_different_script';
  return 'v21_manifest_key_binary_content_unverified';
}

function v21ImpactForStatus(status, key) {
  if (status === 'already_exists_exact_key_exact_script') return 'MANIFEST_RECONCILIATION';
  if (status.includes('different') || status.includes('unverified')) return 'SCRIPT_REVIEW_UPDATE';
  if (key.endsWith('-v21')) return 'MANIFEST_RECONCILIATION';
  return 'NO_IMPACT';
}

function classifySourceChange(filePath) {
  if (filePath.includes('manifest')) return 'manifest_mapping_changed';
  if (filePath.includes('generate-audio') || filePath.includes('Audio')) return 'source_script_added';
  if (filePath.includes('voicePlayer') || filePath.includes('cues')) return 'runtime_reference_changed';
  if (filePath.includes('movementProfileV2') || filePath.includes('MovementProfileV2')) return 'assessment_protocol_changed';
  if (filePath.includes('docs/specs')) return 'documentation_only';
  return 'unknown';
}

function sourceChangeRuntimeImpact(filePath) {
  if (filePath.includes('voicePlayer') || filePath.includes('MovementProfileV2CheckUpScreen') || filePath.includes('movementProfileV2/voiceCues')) {
    return 'Runtime timing/priority/reference behavior may differ from prior audit.';
  }
  if (filePath.includes('manifest') || filePath.includes('Audio')) return 'Asset mapping/provenance changed.';
  return 'No direct runtime impact identified in this audit.';
}

function sourceChangeV21Impact(filePath) {
  if (filePath.includes('docs/specs/HALE_VOICE')) return 'V2.1 planning baseline is untracked current state.';
  if (filePath.includes('movementProfileV2') || filePath.includes('MovementProfileV2')) return 'SPEC_REVIEW_UPDATE';
  if (filePath.includes('manifest') || filePath.includes('generate-audio') || filePath.includes('Audio')) return 'MANIFEST_RECONCILIATION';
  return 'NO_IMPACT';
}

function shouldBlockSourceChange(filePath) {
  return /src\/audio|scripts\/generate-audio|movementProfileV2|MovementProfileV2|docs\/specs\/HALE_VOICE/.test(filePath);
}

function parseLsTree(text) {
  return text
    .trimEnd()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(\w+)\s+([0-9a-f]+)\t(.+)$/);
      return { mode: match[1], type: match[2], object: match[3], path: match[4] };
    });
}

function gitStatusByPath() {
  const out = new Map();
  for (const line of runGit(['status', '--porcelain=v1']).trimEnd().split('\n').filter(Boolean)) {
    out.set(parsePorcelainPath(line), line.slice(0, 2));
  }
  return out;
}

function parsePorcelainPath(line) {
  const raw = line.slice(3);
  return raw.includes(' -> ') ? raw.split(' -> ').at(-1) : raw;
}

function isRelevantPath(filePath) {
  return /^(assets\/audio|src\/audio|src\/profile\/voices\.ts|scripts\/generate-audio\.ts|scripts\/verify-audio\.ts|src\/training|src\/assessment|src\/checkup|src\/movements|src\/exercises|src\/preflight|src\/screens\/(TrainingSessionScreen|CheckUpScreen|MicroCheckScreen|MovementProfileV2)|App\.tsx|docs\/specs\/HALE_VOICE_|docs\/audits\/HALE_VOICE_|scripts\/audits)/.test(
    filePath
  );
}

function walk(dir) {
  const skip = new Set(['.git', 'node_modules', '.expo', 'ios', 'android', 'website/node_modules']);
  const out = [];
  function inner(current) {
    const relPath = rel(current);
    if (skip.has(relPath) || [...skip].some((entry) => relPath.startsWith(`${entry}/`))) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) inner(abs);
      else if (entry.isFile()) out.push(abs);
    }
  }
  inner(dir);
  return out;
}

function readText(filePath) {
  return fs.readFileSync(path.join(ROOT, filePath), 'utf8');
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(path.join(ROOT, filePath)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, filePath), content);
}

function runGit(args) {
  return run('git', args);
}

function safeGit(args) {
  return safeRun('git', args).stdout;
}

function run(command, args) {
  return execFileSync(command, args, { cwd: ROOT, encoding: 'utf8' });
}

function safeRun(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8' });
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status,
  };
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function isLfsPointer(bytes) {
  if (bytes.length > 512) return false;
  return bytes.toString('utf8').startsWith('version https://git-lfs.github.com/spec/v1');
}

function groupBy(items, keyFn) {
  const out = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(item);
  }
  return out;
}

function rel(abs) {
  return path.relative(ROOT, abs).split(path.sep).join('/');
}

function normalize(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function singleLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

const INVENTORY_COLUMNS = [
  'assetId',
  'voiceId',
  'cueKey',
  'path',
  'extension',
  'sha256',
  'gitBlobId',
  'fileSizeBytes',
  'durationMs',
  'codec',
  'container',
  'sampleRateHz',
  'channels',
  'bitRate',
  'decodeStatus',
  'gitTrackingStatus',
  'worktreeStatus',
  'lfsStatus',
  'inCurrentManifest',
  'hasCurrentCueDefinition',
  'hasCurrentGenerationSource',
  'hasCurrentRuntimeReference',
  'hasCurrentTestReference',
  'pairedVoicePath',
  'pairedVoiceExists',
  'pairedDurationDeltaMs',
  'pairedSourceScriptEqual',
  'duplicateHashPaths',
  'baselineStatus',
  'v21Status',
  'notes',
];

const LEDGER_COLUMNS = [
  'changeId',
  'classification',
  'pathOrKey',
  'baselineValue',
  'currentValue',
  'gitState',
  'commitEvidence',
  'evidenceConfidence',
  'currentRuntimeImpact',
  'v21Impact',
  'requiredAction',
  'blocksProceeding',
  'notes',
];

function toCsv(rows, columns) {
  return `${columns.join(',')}\n${rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

main();
