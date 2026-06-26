import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8')) as T;
}

function readCsv(relativePath: string): Record<string, string>[] {
  const text = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  const records: string[][] = [];
  let field = '';
  let row: string[] = [];
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      records.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    records.push(row);
  }
  const [header, ...body] = records.filter((record) => record.some(Boolean));
  return body.map((record) =>
    Object.fromEntries(header.map((key, index) => [key, record[index] ?? '']))
  );
}

describe('Voice V2.1 final cue schema artifacts', () => {
  it('freezes the schema as generation-pending without enabling runtime audio gates', () => {
    const audit = readJson<{
      verdict: string;
      metrics: Record<string, number | string | boolean>;
    }>('docs/audits/HALE_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.json');

    expect(audit.verdict).toBe('VOICE_V2_1_FINAL_SCHEMA_COMPLETE_GENERATION_PENDING');
    expect(audit.metrics.p0).toBe(0);
    expect(audit.metrics.p1).toBe(0);
    expect(audit.metrics.p2).toBe(0);
    expect(audit.metrics.verifyAudioFailureCount).toBe(0);
    expect(audit.metrics.taskAudioHashChangedCount).toBe(0);
    expect(audit.metrics.generationBacklogRowCount).toBeGreaterThan(0);
    expect(audit.metrics.generationBacklogIncludesExactReadyPairCount).toBe(0);
    expect(audit.metrics.pendingCueInPhysicalManifestCount).toBe(0);
    expect(audit.metrics.trainingBehaviorReadyValue).toBe(true);
    expect(audit.metrics.microBehaviorReadyValue).toBe(true);
    expect(audit.metrics.trainingAudioReadyValue).toBe(false);
    expect(audit.metrics.microAudioReadyValue).toBe(false);
    expect(audit.metrics.balanceV2AudioReadyValue).toBe(false);
    expect(audit.metrics.trainingSelectableExerciseCount).toBe(0);
    expect(audit.metrics.microSelectableTypeCount).toBe(0);
    expect(audit.metrics.featureGatesEnabled).toBe(0);
  });

  it('keeps retired, conditional, and mismatched cues out of default V2.1 reuse', () => {
    const registry = readCsv('docs/audits/HALE_VOICE_V2_1_FINAL_CUE_REGISTRY.csv');
    const backlog = readCsv('docs/audits/HALE_VOICE_V2_1_GENERATION_BACKLOG.csv');

    expect(registry.find((row) => row.logicalCueKey === 'microcheck-intro')).toBeUndefined();
    expect(registry.find((row) => row.logicalCueKey === 'micro-relax-v21')).toMatchObject({
      reuseDecision: 'existing_pair_script_mismatch',
      physicalCueKey: 'relax-arm',
      generationRequiredLater: 'true',
    });
    expect(registry.find((row) => row.logicalCueKey === 'close-your-eyes')).toMatchObject({
      lifecycle: 'conditional_legacy_only',
      generationRequiredLater: 'false',
    });
    expect(registry.find((row) => row.logicalCueKey === 'open-your-eyes')).toMatchObject({
      lifecycle: 'conditional_legacy_only',
      generationRequiredLater: 'false',
    });
    expect(backlog.map((row) => row.logicalCueKey)).toContain('micro-relax-v21');
    expect(backlog.some((row) => row.reuseDecision === 'reuse_exact_existing_pair')).toBe(false);
  });

  it('preserves the post-safety floor-readiness blocker baseline', () => {
    const floorAudit = readJson<{
      verdict: string;
      metrics: Record<string, number | string | boolean>;
    }>('docs/audits/HALE_TRAINING_FLOOR_READINESS_POST_SAFETY_REBASE.json');

    expect(floorAudit.verdict).toBe('TRAINING_FLOOR_READINESS_POST_SAFETY_BASELINE_COMPLETE');
    expect(floorAudit.metrics.irVoiceFloorGateRemainingCount).toBe(0);
    expect(floorAudit.metrics.irVoiceFinalPositionRemainingCount).toBe(0);
    expect(floorAudit.metrics.irVoiceSafetySubsumptionRemainingCount).toBe(0);
  });
});
