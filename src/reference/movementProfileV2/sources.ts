import { deterministicFingerprint } from './fingerprint';
import {
  SPRINGER_2007_BALANCE_DATA_FINGERPRINT,
  validateBalanceBenchmarkTable,
} from './balance';
import {
  GILL_2020_SHOULDER_DATA_FINGERPRINT,
  validateGillShoulderTable,
} from './shoulder';
import { WARDEN_2022_30S_STS_DATA_FINGERPRINT } from './wardenChairTransform';
import type { ReferenceEngineDiagnostic, ReferenceSourceDefinition } from './types';

function sourceFingerprint(definition: Omit<ReferenceSourceDefinition, 'sourceFingerprint'>): string {
  return deterministicFingerprint('reference-source-v1', definition);
}

function defineSource(definition: Omit<ReferenceSourceDefinition, 'sourceFingerprint'>): ReferenceSourceDefinition {
  return {
    ...definition,
    sourceFingerprint: sourceFingerprint(definition),
  };
}

export const REFERENCE_SOURCES: readonly ReferenceSourceDefinition[] = [
  defineSource({
    sourceId: 'warden_2022_30s_sts',
    sourceVersion: 1,
    title: 'Sex- and Age-Specific Centile Curves and Downloadable Calculator for Clinical Muscle Strength Tests to Identify Probable Sarcopenia',
    authors: 'Warden SJ, Liu Z, Moe SM',
    year: 2022,
    doi: '10.1093/ptj/pzab299',
    protocolIds: ['chair-rise-30s-v2'],
    populationSummary: 'Adults age 18 to 80 for female reference values and 18 to 79.3 for male reference values; sex-specific 30-second sit-to-stand centile calculator.',
    statisticKind: 'official LMS calculator table with lower-bound CDF adjustment and z > 2 linear upper-tail modification',
    publicUseStatus: 'approved_calculator_transform',
    sourceDataFingerprint: WARDEN_2022_30S_STS_DATA_FINGERPRINT,
  }),
  defineSource({
    sourceId: 'springer_2007_unipedal_eyes_open',
    sourceVersion: 1,
    title: 'Normative Values for the Unipedal Stance Test with Eyes Open and Closed',
    authors: 'Springer BA, Marin R, Cyhan T, Roberts H, Gill NW',
    year: 2007,
    doi: '10.1519/00139143-200704000-00001',
    protocolIds: ['one-leg-balance-45s-v2'],
    populationSummary: 'Healthy adults age 18 to 99; total age-group means for best of three eyes-open trials.',
    statisticKind: 'published age-group benchmark mean only',
    publicUseStatus: 'approved_benchmark_only',
    sourceDataFingerprint: SPRINGER_2007_BALANCE_DATA_FINGERPRINT,
  }),
  defineSource({
    sourceId: 'gill_2020_active_shoulder_flexion',
    sourceVersion: 1,
    title: 'Shoulder range of movement in the general population: age and gender stratified normative data using a community-based cohort',
    authors: 'Gill TK, Shanahan EM, Tucker GR, Buchbinder R, Hill CL',
    year: 2020,
    doi: '10.1186/s12891-020-03665-9',
    protocolIds: ['active-shoulder-reach-v2'],
    populationSummary: 'Community cohort age 20 to 91; active shoulder flexion by five-year age group, sex, and side.',
    statisticKind: 'published median and interquartile range category',
    publicUseStatus: 'approved_numeric_table',
    sourceDataFingerprint: GILL_2020_SHOULDER_DATA_FINGERPRINT,
  }),
] as const;

export function validateReferenceSources(
  sources: readonly ReferenceSourceDefinition[] = REFERENCE_SOURCES
): ReferenceEngineDiagnostic[] {
  const diagnostics: ReferenceEngineDiagnostic[] = [];
  const ids = new Set<string>();
  for (const source of sources) {
    if (ids.has(source.sourceId)) diagnostics.push({ code: 'reference_source_duplicate_id', severity: 'error', domain: 'engine' });
    ids.add(source.sourceId);
    if (source.sourceFingerprint !== sourceFingerprint(omitSourceFingerprint(source))) {
      diagnostics.push({ code: 'reference_source_fingerprint_mismatch', severity: 'error', domain: 'engine' });
    }
  }
  for (const expected of ['warden_2022_30s_sts', 'springer_2007_unipedal_eyes_open', 'gill_2020_active_shoulder_flexion'] as const) {
    if (!ids.has(expected)) diagnostics.push({ code: `reference_source_missing_${expected}`, severity: 'error', domain: 'engine' });
  }
  diagnostics.push(...validateBalanceBenchmarkTable(), ...validateGillShoulderTable());
  return diagnostics;
}

export function sourceMetadata(source: ReferenceSourceDefinition) {
  return {
    sourceId: source.sourceId,
    sourceVersion: source.sourceVersion,
    sourceFingerprint: source.sourceFingerprint,
  };
}

function omitSourceFingerprint(source: ReferenceSourceDefinition): Omit<ReferenceSourceDefinition, 'sourceFingerprint'> {
  const { sourceFingerprint: _sourceFingerprint, ...rest } = source;
  return rest;
}
