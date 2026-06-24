import { deterministicFingerprint } from './fingerprint';
import type {
  ReferenceTransformationDefinition,
  ReferenceTransformationId,
  ReferenceEngineDiagnostic,
} from './types';

export interface ReferenceTransformationRegistryOptions {
  chairPercentileEnabled?: boolean;
  chairApprovalId?: string;
}

function transformationFingerprint(definition: Omit<ReferenceTransformationDefinition, 'transformationFingerprint'>): string {
  return deterministicFingerprint('reference-transform-v1', definition);
}

function defineTransformation(
  definition: Omit<ReferenceTransformationDefinition, 'transformationFingerprint'>
): ReferenceTransformationDefinition {
  return {
    ...definition,
    transformationFingerprint: transformationFingerprint(definition),
  };
}

export function createReferenceTransformations(
  options: ReferenceTransformationRegistryOptions = {}
): readonly ReferenceTransformationDefinition[] {
  const chairEnabled = options.chairPercentileEnabled === true && typeof options.chairApprovalId === 'string' && options.chairApprovalId.length > 0;
  return [
    defineTransformation({
      transformationId: 'chair_percentile_range_v1_pending_transform',
      transformationVersion: 1,
      sourceIds: ['warden_2022_30s_sts'],
      enabled: chairEnabled,
      ...(chairEnabled
        ? { approvalId: options.chairApprovalId }
        : { reasonIfDisabled: 'source_transform_unapproved' }),
    }),
    defineTransformation({
      transformationId: 'balance_task_band_v1',
      transformationVersion: 1,
      sourceIds: [],
      enabled: true,
      productCreated: true,
    }),
    defineTransformation({
      transformationId: 'balance_age_group_benchmark_v1',
      transformationVersion: 1,
      sourceIds: ['springer_2007_unipedal_eyes_open'],
      enabled: true,
    }),
    defineTransformation({
      transformationId: 'shoulder_iqr_category_v1',
      transformationVersion: 1,
      sourceIds: ['gill_2020_active_shoulder_flexion'],
      enabled: true,
    }),
  ] as const;
}

export const REFERENCE_TRANSFORMATIONS = createReferenceTransformations();

export function referenceTransformation(
  transformationId: ReferenceTransformationId,
  transformations: readonly ReferenceTransformationDefinition[] = REFERENCE_TRANSFORMATIONS
): ReferenceTransformationDefinition {
  const transformation = transformations.find((candidate) => candidate.transformationId === transformationId);
  if (!transformation) throw new Error(`Missing V2 reference transformation: ${transformationId}`);
  return transformation;
}

export function transformationMetadata(transformation: ReferenceTransformationDefinition) {
  return {
    transformationId: transformation.transformationId,
    transformationVersion: transformation.transformationVersion,
    transformationFingerprint: transformation.transformationFingerprint,
    enabled: transformation.enabled,
    ...(transformation.reasonIfDisabled ? { reasonIfDisabled: transformation.reasonIfDisabled } : {}),
    ...(transformation.productCreated ? { productCreated: transformation.productCreated } : {}),
  };
}

export function validateReferenceTransformations(
  transformations: readonly ReferenceTransformationDefinition[] = REFERENCE_TRANSFORMATIONS
): ReferenceEngineDiagnostic[] {
  const diagnostics: ReferenceEngineDiagnostic[] = [];
  const ids = new Set<string>();
  for (const transformation of transformations) {
    if (ids.has(transformation.transformationId)) {
      diagnostics.push({ code: 'reference_transformation_duplicate_id', severity: 'error', domain: 'engine' });
    }
    ids.add(transformation.transformationId);
    const recomputed = transformationFingerprint(
      omitTransformationFingerprint(transformation)
    );
    if (transformation.transformationFingerprint !== recomputed) {
      diagnostics.push({ code: 'reference_transformation_fingerprint_mismatch', severity: 'error', domain: 'engine' });
    }
  }
  for (const expected of [
    'chair_percentile_range_v1_pending_transform',
    'balance_task_band_v1',
    'balance_age_group_benchmark_v1',
    'shoulder_iqr_category_v1',
  ] as const) {
    if (!ids.has(expected)) diagnostics.push({ code: `reference_transformation_missing_${expected}`, severity: 'error', domain: 'engine' });
  }
  return diagnostics;
}

function omitTransformationFingerprint(
  transformation: ReferenceTransformationDefinition
): Omit<ReferenceTransformationDefinition, 'transformationFingerprint'> {
  const {
    transformationFingerprint: _transformationFingerprint,
    ...rest
  } = transformation;
  return rest;
}
