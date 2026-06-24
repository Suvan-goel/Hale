import type { CheckUp } from '../../checkup/types';
import {
  LIFE_GOAL_CATEGORIES,
  getLifeGoalTrainingRelevance,
} from '../../adherence/goalDomainMapping';
import type {
  LifeGoal,
  LifeGoalCategory,
  MovementDomain,
} from '../../adherence/types';
import { deterministicFingerprint } from './fingerprint';
import {
  parseStoredMovementProfileV2Snapshot,
  validateMovementProfileV2SnapshotSource,
  type MovementProfileV2OfficialSourceCheckUpType,
  type StoredMovementProfileV2Snapshot,
} from './snapshot';
import type {
  BalanceInterpretation,
  ChairInterpretation,
  ReferenceClaimEligibility,
  ShoulderInterpretation,
} from './types';

export const MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_ASSESSMENT_KIND = 'movement_profile_v2_assessment' as const;

export const MOVEMENT_PROFILE_V2_DOMAIN_ORDER: readonly MovementDomain[] = [
  'strength_power',
  'balance',
  'mobility',
] as const;

export type MovementProfileV2DomainEvidenceCategory =
  | 'below_reference'
  | 'within_reference'
  | 'above_reference_or_ceiling'
  | 'hale_starting_point'
  | 'hale_building'
  | 'raw_only_valid'
  | 'invalid_or_missing';

export type MovementProfileV2DomainEvidenceSource =
  | 'published_reference'
  | 'hale_task_band'
  | 'raw_only'
  | 'invalid';

export interface MovementProfileV2DomainEvidence {
  domain: MovementDomain;
  category: MovementProfileV2DomainEvidenceCategory;
  evidenceSource: MovementProfileV2DomainEvidenceSource;
  sourceResultKind: string;
  claimEligibility: string;
  focusEligible: boolean;
  reasons: readonly string[];
}

export type MovementProfileV2LifeGoalContext =
  | {
      kind: 'selected';
      goalId: string;
      goalCategory: LifeGoalCategory;
      mappingAdapterVersion: typeof MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION;
      mappingFingerprint: string;
      mappedDomains: readonly MovementDomain[];
    }
  | {
      kind: 'none';
      mappingAdapterVersion: typeof MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION;
      mappingFingerprint: string;
      mappedDomains: readonly [];
    }
  | {
      kind: 'unknown_or_unsupported';
      rawGoalId?: string;
      mappingAdapterVersion: typeof MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION;
      mappingFingerprint: string;
      mappedDomains: readonly [];
    };

export type MovementProfileV2PriorFocusContext =
  | {
      kind: 'domain';
      focusDomain: MovementDomain;
      sourceAssessmentId: string;
      sourceAssessmentFingerprint: string;
    }
  | {
      kind: 'balanced';
      sourceAssessmentId: string;
      sourceAssessmentFingerprint: string;
    }
  | {
      kind: 'none';
    };

export type MovementProfileV2SuggestedFocus =
  | {
      kind: 'domain';
      focusDomain: MovementDomain;
      planMode:
        | 'checkup_reference_focus'
        | 'checkup_hale_band_focus'
        | 'goal_led_reference_supported';
      reason: MovementProfileV2FocusDecisionReason;
      candidateDomains: readonly MovementDomain[];
    }
  | {
      kind: 'balanced';
      planMode: 'balanced_insufficient_reference';
      reason: MovementProfileV2FocusDecisionReason;
      candidateDomains: readonly MovementDomain[];
    }
  | {
      kind: 'needs_retake';
      planMode: 'needs_retake';
      reason: 'v2_focus_needs_retake';
      invalidDomains: readonly MovementDomain[];
    };

export type MovementProfileV2FocusDecisionReason =
  | 'v2_focus_single_below_reference'
  | 'v2_focus_multiple_below_preserve_current'
  | 'v2_focus_multiple_below_goal_tiebreak'
  | 'v2_focus_multiple_below_balanced'
  | 'v2_focus_single_hale_starting_point'
  | 'v2_focus_starting_point_preserve_current'
  | 'v2_focus_starting_point_goal_tiebreak'
  | 'v2_focus_starting_point_balanced'
  | 'v2_focus_goal_led'
  | 'v2_focus_preserve_current_no_clear_candidate'
  | 'v2_focus_balanced_no_unique_signal'
  | 'v2_focus_needs_retake'
  | 'v2_focus_clear_signal_overrides_goal';

export interface MovementProfileV2FocusProvenance {
  focusPolicyVersion: typeof MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION;
  focusPolicyFingerprint: string;
  domainEvidencePolicyVersion: typeof MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_VERSION;
  domainEvidencePolicyFingerprint: string;
  sourceSnapshotId: string;
  sourceSnapshotFingerprint: string;
  sourceCheckUpId: string;
  sourceCheckUpType: MovementProfileV2OfficialSourceCheckUpType;
  domainEvidence: readonly MovementProfileV2DomainEvidence[];
  lifeGoalContext: MovementProfileV2LifeGoalContext;
  priorFocusContext: MovementProfileV2PriorFocusContext;
  candidateDomains: readonly MovementDomain[];
  excludedDomains: readonly {
    domain: MovementDomain;
    reasons: readonly string[];
  }[];
  decisionReason: MovementProfileV2FocusDecisionReason;
}

export interface MovementProfileV2Assessment {
  kind: typeof MOVEMENT_PROFILE_V2_ASSESSMENT_KIND;
  schemaVersion: typeof MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION;
  assessmentId: string;
  assessmentFingerprint: string;
  sourceSnapshotId: string;
  sourceSnapshotFingerprint: string;
  sourceCheckUpId: string;
  sourceCheckUpType: MovementProfileV2OfficialSourceCheckUpType;
  createdAt: string;
  focus: MovementProfileV2SuggestedFocus;
  focusProvenance: MovementProfileV2FocusProvenance;
}

export type MovementProfileV2AssessmentDiagnosticCode =
  | 'v2_assessment_snapshot_invalid'
  | 'v2_assessment_source_mismatch'
  | 'v2_assessment_raw_incomplete'
  | 'v2_assessment_invalid_created_at'
  | 'v2_assessment_fingerprint_invalid'
  | 'v2_assessment_future_schema'
  | 'v2_assessment_malformed'
  | 'v2_assessment_policy_incompatible';

export interface MovementProfileV2AssessmentDiagnostic {
  code: MovementProfileV2AssessmentDiagnosticCode;
  assessmentId?: string;
  snapshotId?: string;
  checkUpId?: string;
  sourceType?: string;
  domains?: readonly MovementDomain[];
  goalId?: string;
  focusPolicyVersion?: number;
  focusPolicyFingerprint?: string;
  domainEvidencePolicyVersion?: number;
  domainEvidencePolicyFingerprint?: string;
}

export type MovementProfileV2AssessmentCreationResult =
  | {
      ok: true;
      assessment: MovementProfileV2Assessment;
      diagnostics: readonly MovementProfileV2AssessmentDiagnostic[];
    }
  | {
      ok: false;
      reason: MovementProfileV2AssessmentDiagnosticCode;
      diagnostics: readonly MovementProfileV2AssessmentDiagnostic[];
    };

export type ParsedMovementProfileV2Assessment =
  | {
      ok: true;
      assessment: MovementProfileV2Assessment;
    }
  | {
      ok: false;
      diagnostic: MovementProfileV2AssessmentDiagnostic;
    };

export interface CreateMovementProfileV2AssessmentInput {
  checkUp: CheckUp;
  snapshot: unknown;
  lifeGoal?: LifeGoal | null;
  priorFocus?: unknown;
  createdAt: string;
}

export const MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_FINGERPRINT = deterministicFingerprint(
  'mpv2-domain-evidence-policy-v1',
  {
    version: MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_VERSION,
    domainOrder: MOVEMENT_PROFILE_V2_DOMAIN_ORDER,
    chair: {
      rawOnlyProductionFocusEligible: false,
      percentileRangeFocusThresholdApproved: false,
      below10Category: 'below_reference',
      above90Category: 'above_reference_or_ceiling',
    },
    balanceTaskBands: {
      starting_point_low: 'hale_starting_point',
      starting_point: 'hale_starting_point',
      building: 'hale_building',
      ceiling_complete: 'above_reference_or_ceiling',
    },
    shoulderIqr: {
      below_published_middle_range: 'below_reference',
      within_published_middle_range: 'within_reference',
      above_published_middle_range: 'above_reference_or_ceiling',
    },
  }
);

export const MOVEMENT_PROFILE_V2_FOCUS_POLICY_FINGERPRINT = deterministicFingerprint(
  'mpv2-focus-policy-v1',
  {
    version: MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION,
    domainOrder: MOVEMENT_PROFILE_V2_DOMAIN_ORDER,
    priority: [
      'invalid_or_missing_needs_retake',
      'single_below_reference',
      'multiple_below_reference_prior_then_goal_then_balanced',
      'single_hale_starting_point',
      'multiple_hale_starting_point_prior_then_goal_then_balanced',
      'no_clear_candidate_prior_then_goal_then_balanced',
    ],
    balancedFallback: true,
    priorV2FocusOfficialRetestOnly: true,
    rawOnlyChairProductionFocusEligible: false,
  }
);

export const MOVEMENT_PROFILE_V2_LIFE_GOAL_MAPPING_FINGERPRINT = movementProfileV2LifeGoalMappingFingerprint();

export function movementProfileV2LifeGoalMappingFingerprint(): string {
  return deterministicFingerprint(
    'mpv2-life-goal-adapter-v1',
    LIFE_GOAL_CATEGORIES.map((category) => ({
      category,
      mappedDomains: mappedDomainsForGoalCategory(category),
    }))
  );
}

export function createMovementProfileV2Assessment(
  input: CreateMovementProfileV2AssessmentInput
): MovementProfileV2AssessmentCreationResult {
  const parsedSnapshot = parseStoredMovementProfileV2Snapshot(input.snapshot);
  if (!parsedSnapshot.ok) {
    const code =
      parsedSnapshot.compatibility === 'future_schema'
        ? 'v2_assessment_future_schema'
        : 'v2_assessment_snapshot_invalid';
    return fail(code, [
      diagnostic(code, {
        checkUpId: input.checkUp.startedAt,
      }),
    ]);
  }

  const snapshot = parsedSnapshot.snapshot;
  if (!isIsoTimestamp(input.createdAt)) {
    return fail('v2_assessment_invalid_created_at', [
      diagnostic('v2_assessment_invalid_created_at', {
        snapshotId: snapshot.snapshotId,
        checkUpId: input.checkUp.startedAt,
        sourceType: snapshot.sourceCheckUpType,
      }),
    ]);
  }

  const sourceValidation = validateMovementProfileV2SnapshotSource({
    snapshot,
    checkUp: input.checkUp,
    checkupType: snapshot.sourceCheckUpType,
  });
  if (!sourceValidation.valid) {
    return fail('v2_assessment_source_mismatch', [
      diagnostic('v2_assessment_source_mismatch', {
        snapshotId: snapshot.snapshotId,
        checkUpId: input.checkUp.startedAt,
        sourceType: snapshot.sourceCheckUpType,
      }),
    ]);
  }

  if (!snapshotRawComplete(snapshot)) {
    return fail('v2_assessment_raw_incomplete', [
      diagnostic('v2_assessment_raw_incomplete', {
        snapshotId: snapshot.snapshotId,
        checkUpId: snapshot.sourceCheckUpId,
        sourceType: snapshot.sourceCheckUpType,
      }),
    ]);
  }

  const domainEvidence = deriveMovementProfileV2DomainEvidence(snapshot);
  const lifeGoalContext = normalizeMovementProfileV2LifeGoalContext(input.lifeGoal);
  const priorFocusContext = normalizeMovementProfileV2PriorFocusContext(input.priorFocus);
  const selected = selectMovementProfileV2SuggestedFocus({
    sourceSnapshotId: snapshot.snapshotId,
    sourceSnapshotFingerprint: snapshot.snapshotFingerprint,
    sourceCheckUpId: snapshot.sourceCheckUpId,
    sourceCheckUpType: snapshot.sourceCheckUpType,
    domainEvidence,
    lifeGoalContext,
    priorFocusContext,
  });
  const assessmentBase: Omit<MovementProfileV2Assessment, 'assessmentFingerprint'> = {
    kind: MOVEMENT_PROFILE_V2_ASSESSMENT_KIND,
    schemaVersion: MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION,
    assessmentId: movementProfileV2AssessmentIdForSnapshot(snapshot.snapshotId),
    sourceSnapshotId: snapshot.snapshotId,
    sourceSnapshotFingerprint: snapshot.snapshotFingerprint,
    sourceCheckUpId: snapshot.sourceCheckUpId,
    sourceCheckUpType: snapshot.sourceCheckUpType,
    createdAt: input.createdAt,
    focus: selected.focus,
    focusProvenance: selected.provenance,
  };
  const assessment: MovementProfileV2Assessment = {
    ...assessmentBase,
    assessmentFingerprint: movementProfileV2AssessmentFingerprint(assessmentBase),
  };
  const parsedAssessment = parseMovementProfileV2Assessment(assessment);
  if (!parsedAssessment.ok) {
    return fail(parsedAssessment.diagnostic.code, [parsedAssessment.diagnostic]);
  }
  return {
    ok: true,
    assessment: parsedAssessment.assessment,
    diagnostics: [],
  };
}

export function deriveMovementProfileV2DomainEvidence(
  snapshot: StoredMovementProfileV2Snapshot
): readonly MovementProfileV2DomainEvidence[] {
  return [
    chairDomainEvidence(snapshot.interpretation.chair),
    balanceDomainEvidence(snapshot.interpretation.balance),
    shoulderDomainEvidence(snapshot.interpretation.shoulder),
  ];
}

export function normalizeMovementProfileV2LifeGoalContext(
  lifeGoal: LifeGoal | null | undefined
): MovementProfileV2LifeGoalContext {
  const mappingFingerprint = MOVEMENT_PROFILE_V2_LIFE_GOAL_MAPPING_FINGERPRINT;
  if (!lifeGoal) {
    return {
      kind: 'none',
      mappingAdapterVersion: MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION,
      mappingFingerprint,
      mappedDomains: [],
    };
  }
  if (!isLifeGoalCategory(lifeGoal.category) || typeof lifeGoal.id !== 'string') {
    return {
      kind: 'unknown_or_unsupported',
      rawGoalId: typeof lifeGoal.id === 'string' ? lifeGoal.id : undefined,
      mappingAdapterVersion: MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION,
      mappingFingerprint,
      mappedDomains: [],
    };
  }
  return {
    kind: 'selected',
    goalId: lifeGoal.id,
    goalCategory: lifeGoal.category,
    mappingAdapterVersion: MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION,
    mappingFingerprint,
    mappedDomains: mappedDomainsForGoalCategory(lifeGoal.category),
  };
}

export function normalizeMovementProfileV2PriorFocusContext(
  value: unknown
): MovementProfileV2PriorFocusContext {
  if (!value || !isRecord(value)) return { kind: 'none' };

  const parsedAssessment = parseMovementProfileV2Assessment(value);
  if (parsedAssessment.ok) {
    const focus = parsedAssessment.assessment.focus;
    if (focus.kind === 'domain') {
      return {
        kind: 'domain',
        focusDomain: focus.focusDomain,
        sourceAssessmentId: parsedAssessment.assessment.assessmentId,
        sourceAssessmentFingerprint: parsedAssessment.assessment.assessmentFingerprint,
      };
    }
    if (focus.kind === 'balanced') {
      return {
        kind: 'balanced',
        sourceAssessmentId: parsedAssessment.assessment.assessmentId,
        sourceAssessmentFingerprint: parsedAssessment.assessment.assessmentFingerprint,
      };
    }
    return { kind: 'none' };
  }

  if (value.kind === 'domain') {
    if (
      isMovementDomain(value.focusDomain) &&
      typeof value.sourceAssessmentId === 'string' &&
      typeof value.sourceAssessmentFingerprint === 'string'
    ) {
      return {
        kind: 'domain',
        focusDomain: value.focusDomain,
        sourceAssessmentId: value.sourceAssessmentId,
        sourceAssessmentFingerprint: value.sourceAssessmentFingerprint,
      };
    }
    return { kind: 'none' };
  }

  if (value.kind === 'balanced') {
    if (typeof value.sourceAssessmentId === 'string' && typeof value.sourceAssessmentFingerprint === 'string') {
      return {
        kind: 'balanced',
        sourceAssessmentId: value.sourceAssessmentId,
        sourceAssessmentFingerprint: value.sourceAssessmentFingerprint,
      };
    }
    return { kind: 'none' };
  }

  return { kind: 'none' };
}

export function selectMovementProfileV2SuggestedFocus({
  sourceSnapshotId,
  sourceSnapshotFingerprint,
  sourceCheckUpId,
  sourceCheckUpType,
  domainEvidence,
  lifeGoalContext,
  priorFocusContext,
}: {
  sourceSnapshotId: string;
  sourceSnapshotFingerprint: string;
  sourceCheckUpId: string;
  sourceCheckUpType: MovementProfileV2OfficialSourceCheckUpType;
  domainEvidence: readonly MovementProfileV2DomainEvidence[];
  lifeGoalContext: MovementProfileV2LifeGoalContext;
  priorFocusContext: MovementProfileV2PriorFocusContext;
}): { focus: MovementProfileV2SuggestedFocus; provenance: MovementProfileV2FocusProvenance } {
  const evidence = normalizeDomainEvidence(domainEvidence);
  const officialRetest = sourceCheckUpType === 'official_retest';
  const invalidDomains = domainsForCategory(evidence, 'invalid_or_missing');
  if (invalidDomains.length > 0) {
    return focusResult({
      focus: {
        kind: 'needs_retake',
        planMode: 'needs_retake',
        reason: 'v2_focus_needs_retake',
        invalidDomains,
      },
      sourceSnapshotId,
      sourceSnapshotFingerprint,
      sourceCheckUpId,
      sourceCheckUpType,
      domainEvidence: evidence,
      lifeGoalContext,
      priorFocusContext,
      candidateDomains: [],
      decisionReason: 'v2_focus_needs_retake',
    });
  }

  const belowReference = domainsForCategory(evidence, 'below_reference');
  if (belowReference.length === 1) {
    const focusDomain = belowReference[0];
    const uniqueGoal = uniqueGoalDomain(lifeGoalContext);
    const reason =
      uniqueGoal && uniqueGoal !== focusDomain
        ? 'v2_focus_clear_signal_overrides_goal'
        : 'v2_focus_single_below_reference';
    return focusResult({
      focus: domainFocus({
        focusDomain,
        planMode: 'checkup_reference_focus',
        reason,
        candidateDomains: belowReference,
      }),
      sourceSnapshotId,
      sourceSnapshotFingerprint,
      sourceCheckUpId,
      sourceCheckUpType,
      domainEvidence: evidence,
      lifeGoalContext,
      priorFocusContext,
      candidateDomains: belowReference,
      decisionReason: reason,
    });
  }
  if (belowReference.length > 1) {
    const priorDomain = officialRetest ? priorDomainInCandidates(priorFocusContext, belowReference) : null;
    if (priorDomain) {
      return focusResult({
        focus: domainFocus({
          focusDomain: priorDomain,
          planMode: 'checkup_reference_focus',
          reason: 'v2_focus_multiple_below_preserve_current',
          candidateDomains: belowReference,
        }),
        sourceSnapshotId,
        sourceSnapshotFingerprint,
        sourceCheckUpId,
        sourceCheckUpType,
        domainEvidence: evidence,
        lifeGoalContext,
        priorFocusContext,
        candidateDomains: belowReference,
        decisionReason: 'v2_focus_multiple_below_preserve_current',
      });
    }
    const goalDomain = uniqueGoalCandidate(lifeGoalContext, belowReference);
    if (goalDomain) {
      return focusResult({
        focus: domainFocus({
          focusDomain: goalDomain,
          planMode: 'checkup_reference_focus',
          reason: 'v2_focus_multiple_below_goal_tiebreak',
          candidateDomains: belowReference,
        }),
        sourceSnapshotId,
        sourceSnapshotFingerprint,
        sourceCheckUpId,
        sourceCheckUpType,
        domainEvidence: evidence,
        lifeGoalContext,
        priorFocusContext,
        candidateDomains: belowReference,
        decisionReason: 'v2_focus_multiple_below_goal_tiebreak',
      });
    }
    return focusResult({
      focus: balancedFocus('v2_focus_multiple_below_balanced', belowReference),
      sourceSnapshotId,
      sourceSnapshotFingerprint,
      sourceCheckUpId,
      sourceCheckUpType,
      domainEvidence: evidence,
      lifeGoalContext,
      priorFocusContext,
      candidateDomains: belowReference,
      decisionReason: 'v2_focus_multiple_below_balanced',
    });
  }

  const startingPoint = domainsForCategory(evidence, 'hale_starting_point');
  if (startingPoint.length === 1) {
    return focusResult({
      focus: domainFocus({
        focusDomain: startingPoint[0],
        planMode: 'checkup_hale_band_focus',
        reason: 'v2_focus_single_hale_starting_point',
        candidateDomains: startingPoint,
      }),
      sourceSnapshotId,
      sourceSnapshotFingerprint,
      sourceCheckUpId,
      sourceCheckUpType,
      domainEvidence: evidence,
      lifeGoalContext,
      priorFocusContext,
      candidateDomains: startingPoint,
      decisionReason: 'v2_focus_single_hale_starting_point',
    });
  }
  if (startingPoint.length > 1) {
    const priorDomain = officialRetest ? priorDomainInCandidates(priorFocusContext, startingPoint) : null;
    if (priorDomain) {
      return focusResult({
        focus: domainFocus({
          focusDomain: priorDomain,
          planMode: 'checkup_hale_band_focus',
          reason: 'v2_focus_starting_point_preserve_current',
          candidateDomains: startingPoint,
        }),
        sourceSnapshotId,
        sourceSnapshotFingerprint,
        sourceCheckUpId,
        sourceCheckUpType,
        domainEvidence: evidence,
        lifeGoalContext,
        priorFocusContext,
        candidateDomains: startingPoint,
        decisionReason: 'v2_focus_starting_point_preserve_current',
      });
    }
    const goalDomain = uniqueGoalCandidate(lifeGoalContext, startingPoint);
    if (goalDomain) {
      return focusResult({
        focus: domainFocus({
          focusDomain: goalDomain,
          planMode: 'checkup_hale_band_focus',
          reason: 'v2_focus_starting_point_goal_tiebreak',
          candidateDomains: startingPoint,
        }),
        sourceSnapshotId,
        sourceSnapshotFingerprint,
        sourceCheckUpId,
        sourceCheckUpType,
        domainEvidence: evidence,
        lifeGoalContext,
        priorFocusContext,
        candidateDomains: startingPoint,
        decisionReason: 'v2_focus_starting_point_goal_tiebreak',
      });
    }
    return focusResult({
      focus: balancedFocus('v2_focus_starting_point_balanced', startingPoint),
      sourceSnapshotId,
      sourceSnapshotFingerprint,
      sourceCheckUpId,
      sourceCheckUpType,
      domainEvidence: evidence,
      lifeGoalContext,
      priorFocusContext,
      candidateDomains: startingPoint,
      decisionReason: 'v2_focus_starting_point_balanced',
    });
  }

  const validDomains = MOVEMENT_PROFILE_V2_DOMAIN_ORDER.filter(
    (domain) => evidence.find((item) => item.domain === domain)?.category !== 'invalid_or_missing'
  );
  if (officialRetest && priorFocusContext.kind === 'domain' && validDomains.includes(priorFocusContext.focusDomain)) {
    return focusResult({
      focus: domainFocus({
        focusDomain: priorFocusContext.focusDomain,
        planMode: 'goal_led_reference_supported',
        reason: 'v2_focus_preserve_current_no_clear_candidate',
        candidateDomains: validDomains,
      }),
      sourceSnapshotId,
      sourceSnapshotFingerprint,
      sourceCheckUpId,
      sourceCheckUpType,
      domainEvidence: evidence,
      lifeGoalContext,
      priorFocusContext,
      candidateDomains: validDomains,
      decisionReason: 'v2_focus_preserve_current_no_clear_candidate',
    });
  }
  if (officialRetest && priorFocusContext.kind === 'balanced') {
    return focusResult({
      focus: balancedFocus('v2_focus_preserve_current_no_clear_candidate', validDomains),
      sourceSnapshotId,
      sourceSnapshotFingerprint,
      sourceCheckUpId,
      sourceCheckUpType,
      domainEvidence: evidence,
      lifeGoalContext,
      priorFocusContext,
      candidateDomains: validDomains,
      decisionReason: 'v2_focus_preserve_current_no_clear_candidate',
    });
  }

  const goalDomain = uniqueGoalDomain(lifeGoalContext);
  if (goalDomain) {
    return focusResult({
      focus: domainFocus({
        focusDomain: goalDomain,
        planMode: 'goal_led_reference_supported',
        reason: 'v2_focus_goal_led',
        candidateDomains: validDomains,
      }),
      sourceSnapshotId,
      sourceSnapshotFingerprint,
      sourceCheckUpId,
      sourceCheckUpType,
      domainEvidence: evidence,
      lifeGoalContext,
      priorFocusContext,
      candidateDomains: validDomains,
      decisionReason: 'v2_focus_goal_led',
    });
  }

  return focusResult({
    focus: balancedFocus('v2_focus_balanced_no_unique_signal', validDomains),
    sourceSnapshotId,
    sourceSnapshotFingerprint,
    sourceCheckUpId,
    sourceCheckUpType,
    domainEvidence: evidence,
    lifeGoalContext,
    priorFocusContext,
    candidateDomains: validDomains,
    decisionReason: 'v2_focus_balanced_no_unique_signal',
  });
}

export function movementProfileV2AssessmentIdForSnapshot(sourceSnapshotId: string): string {
  return `movement-profile-v2-assessment:${encodeURIComponent(sourceSnapshotId)}`;
}

export function movementProfileV2AssessmentFingerprint(
  assessment: Omit<MovementProfileV2Assessment, 'assessmentFingerprint'> | MovementProfileV2Assessment
): string {
  const { assessmentFingerprint: _assessmentFingerprint, ...material } =
    assessment as MovementProfileV2Assessment;
  return deterministicFingerprint('mpv2-assessment-v1', material);
}

export function parseMovementProfileV2Assessment(value: unknown): ParsedMovementProfileV2Assessment {
  if (!isRecord(value)) {
    return { ok: false, diagnostic: diagnostic('v2_assessment_malformed') };
  }
  if (containsForbiddenAssessmentKeys(value) || !isJsonSafe(value)) {
    return { ok: false, diagnostic: diagnostic('v2_assessment_malformed') };
  }
  const assessment = value as Partial<MovementProfileV2Assessment>;
  const base = {
    assessmentId: typeof assessment.assessmentId === 'string' ? assessment.assessmentId : undefined,
    snapshotId: typeof assessment.sourceSnapshotId === 'string' ? assessment.sourceSnapshotId : undefined,
    checkUpId: typeof assessment.sourceCheckUpId === 'string' ? assessment.sourceCheckUpId : undefined,
    sourceType: typeof assessment.sourceCheckUpType === 'string' ? assessment.sourceCheckUpType : undefined,
  };
  if (assessment.kind !== MOVEMENT_PROFILE_V2_ASSESSMENT_KIND) {
    return { ok: false, diagnostic: diagnostic('v2_assessment_malformed', base) };
  }
  if (assessment.schemaVersion !== MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION) {
    return {
      ok: false,
      diagnostic: diagnostic(
        isPositiveInteger(assessment.schemaVersion) ? 'v2_assessment_future_schema' : 'v2_assessment_malformed',
        base
      ),
    };
  }
  if (
    typeof assessment.assessmentId !== 'string' ||
    typeof assessment.assessmentFingerprint !== 'string' ||
    typeof assessment.sourceSnapshotId !== 'string' ||
    typeof assessment.sourceSnapshotFingerprint !== 'string' ||
    typeof assessment.sourceCheckUpId !== 'string' ||
    !isOfficialV2SourceCheckUpType(assessment.sourceCheckUpType) ||
    !isIsoTimestamp(assessment.createdAt) ||
    assessment.assessmentId !== movementProfileV2AssessmentIdForSnapshot(assessment.sourceSnapshotId)
  ) {
    return { ok: false, diagnostic: diagnostic('v2_assessment_malformed', base) };
  }
  const focus = parseFocus(assessment.focus);
  if (!focus) return { ok: false, diagnostic: diagnostic('v2_assessment_malformed', base) };
  const provenance = parseProvenance(assessment.focusProvenance);
  if (!provenance) return { ok: false, diagnostic: diagnostic('v2_assessment_malformed', base) };
  const normalized: MovementProfileV2Assessment = {
    kind: MOVEMENT_PROFILE_V2_ASSESSMENT_KIND,
    schemaVersion: MOVEMENT_PROFILE_V2_ASSESSMENT_SCHEMA_VERSION,
    assessmentId: assessment.assessmentId,
    assessmentFingerprint: assessment.assessmentFingerprint,
    sourceSnapshotId: assessment.sourceSnapshotId,
    sourceSnapshotFingerprint: assessment.sourceSnapshotFingerprint,
    sourceCheckUpId: assessment.sourceCheckUpId,
    sourceCheckUpType: assessment.sourceCheckUpType,
    createdAt: assessment.createdAt,
    focus,
    focusProvenance: provenance,
  };
  if (
    normalized.sourceSnapshotId !== provenance.sourceSnapshotId ||
    normalized.sourceSnapshotFingerprint !== provenance.sourceSnapshotFingerprint ||
    normalized.sourceCheckUpId !== provenance.sourceCheckUpId ||
    normalized.sourceCheckUpType !== provenance.sourceCheckUpType
  ) {
    return { ok: false, diagnostic: diagnostic('v2_assessment_malformed', base) };
  }
  const expected = selectMovementProfileV2SuggestedFocus({
    sourceSnapshotId: provenance.sourceSnapshotId,
    sourceSnapshotFingerprint: provenance.sourceSnapshotFingerprint,
    sourceCheckUpId: provenance.sourceCheckUpId,
    sourceCheckUpType: provenance.sourceCheckUpType,
    domainEvidence: provenance.domainEvidence,
    lifeGoalContext: provenance.lifeGoalContext,
    priorFocusContext: provenance.priorFocusContext,
  });
  if (!focusesEqual(expected.focus, normalized.focus) || !provenanceEqual(expected.provenance, provenance)) {
    return { ok: false, diagnostic: diagnostic('v2_assessment_malformed', base) };
  }
  if (normalized.assessmentFingerprint !== movementProfileV2AssessmentFingerprint(normalized)) {
    return { ok: false, diagnostic: diagnostic('v2_assessment_fingerprint_invalid', base) };
  }
  return { ok: true, assessment: normalized };
}

function chairDomainEvidence(chair: ChairInterpretation): MovementProfileV2DomainEvidence {
  if (!chair.rawMetric || chair.claimEligibility === 'invalid_measurement') {
    return domainEvidence({
      domain: 'strength_power',
      category: 'invalid_or_missing',
      evidenceSource: 'invalid',
      sourceResultKind: chair.resultKind,
      claimEligibility: chair.claimEligibility,
      reasons: ['chair_raw_metric_invalid_or_missing', ...reasonCodes(chair)],
    });
  }
  if (chair.percentileRange?.kind === 'below_10') {
    return domainEvidence({
      domain: 'strength_power',
      category: 'below_reference',
      evidenceSource: 'published_reference',
      sourceResultKind: chair.resultKind,
      claimEligibility: chair.claimEligibility,
      focusEligible: true,
      reasons: ['chair_percentile_below_10', ...reasonCodes(chair)],
    });
  }
  if (chair.percentileRange?.kind === 'above_90') {
    return domainEvidence({
      domain: 'strength_power',
      category: 'above_reference_or_ceiling',
      evidenceSource: 'published_reference',
      sourceResultKind: chair.resultKind,
      claimEligibility: chair.claimEligibility,
      reasons: ['chair_percentile_above_90', ...reasonCodes(chair)],
    });
  }
  if (chair.percentileRange?.kind === 'range') {
    return domainEvidence({
      domain: 'strength_power',
      category: 'raw_only_valid',
      evidenceSource: 'published_reference',
      sourceResultKind: chair.resultKind,
      claimEligibility: chair.claimEligibility,
      reasons: ['chair_percentile_focus_threshold_not_approved', ...reasonCodes(chair)],
    });
  }
  return domainEvidence({
    domain: 'strength_power',
    category: 'raw_only_valid',
    evidenceSource: 'raw_only',
    sourceResultKind: chair.resultKind,
    claimEligibility: chair.claimEligibility,
    reasons: [
      'v2_domain_evidence_raw_only',
      ...(chair.transformation.enabled ? [] : ['chair_warden_transform_disabled']),
      ...reasonCodes(chair),
    ],
  });
}

function balanceDomainEvidence(balance: BalanceInterpretation): MovementProfileV2DomainEvidence {
  if (!balance.rawMetric || balance.claimEligibility === 'invalid_measurement') {
    return domainEvidence({
      domain: 'balance',
      category: 'invalid_or_missing',
      evidenceSource: 'invalid',
      sourceResultKind: balance.resultKind,
      claimEligibility: balance.claimEligibility,
      reasons: ['balance_raw_metric_invalid_or_missing', ...reasonCodes(balance)],
    });
  }
  if (balance.claimEligibility === 'raw_only_pain_limited') {
    return domainEvidence({
      domain: 'balance',
      category: 'raw_only_valid',
      evidenceSource: 'raw_only',
      sourceResultKind: balance.resultKind,
      claimEligibility: balance.claimEligibility,
      reasons: ['balance_pain_limited_focus_excluded', ...reasonCodes(balance)],
    });
  }
  if (balance.taskBand === 'starting_point' || balance.taskBand === 'starting_point_low') {
    return domainEvidence({
      domain: 'balance',
      category: 'hale_starting_point',
      evidenceSource: 'hale_task_band',
      sourceResultKind: balance.resultKind,
      claimEligibility: balance.claimEligibility,
      focusEligible: true,
      reasons: ['balance_hale_starting_point_band', 'balance_springer_benchmark_not_focus_severity', ...reasonCodes(balance)],
    });
  }
  if (balance.taskBand === 'building') {
    return domainEvidence({
      domain: 'balance',
      category: 'hale_building',
      evidenceSource: 'hale_task_band',
      sourceResultKind: balance.resultKind,
      claimEligibility: balance.claimEligibility,
      reasons: ['balance_hale_building_band', 'balance_springer_benchmark_not_focus_severity', ...reasonCodes(balance)],
    });
  }
  if (balance.taskBand === 'ceiling_complete') {
    return domainEvidence({
      domain: 'balance',
      category: 'above_reference_or_ceiling',
      evidenceSource: 'hale_task_band',
      sourceResultKind: balance.resultKind,
      claimEligibility: balance.claimEligibility,
      reasons: ['balance_hale_ceiling_complete', 'balance_springer_benchmark_not_focus_severity', ...reasonCodes(balance)],
    });
  }
  return domainEvidence({
    domain: 'balance',
    category: 'raw_only_valid',
    evidenceSource: 'raw_only',
    sourceResultKind: balance.resultKind,
    claimEligibility: balance.claimEligibility,
    reasons: ['v2_domain_evidence_raw_only', ...reasonCodes(balance)],
  });
}

function shoulderDomainEvidence(shoulder: ShoulderInterpretation): MovementProfileV2DomainEvidence {
  if (!shoulder.rawMetric || shoulder.claimEligibility === 'invalid_measurement') {
    return domainEvidence({
      domain: 'mobility',
      category: 'invalid_or_missing',
      evidenceSource: 'invalid',
      sourceResultKind: shoulder.resultKind,
      claimEligibility: shoulder.claimEligibility,
      reasons: ['shoulder_raw_metric_invalid_or_missing', ...reasonCodes(shoulder)],
    });
  }
  if (shoulder.painLimited || shoulder.claimEligibility === 'raw_only_pain_limited') {
    return domainEvidence({
      domain: 'mobility',
      category: 'raw_only_valid',
      evidenceSource: 'raw_only',
      sourceResultKind: shoulder.resultKind,
      claimEligibility: shoulder.claimEligibility,
      reasons: ['shoulder_pain_limited_focus_excluded', ...reasonCodes(shoulder)],
    });
  }
  if (!shoulder.iqr || shoulder.claimEligibility !== 'reference_eligible') {
    return domainEvidence({
      domain: 'mobility',
      category: 'raw_only_valid',
      evidenceSource: 'raw_only',
      sourceResultKind: shoulder.resultKind,
      claimEligibility: shoulder.claimEligibility,
      reasons: ['v2_domain_evidence_raw_only', ...reasonCodes(shoulder)],
    });
  }
  if (shoulder.iqr.category === 'below_published_middle_range') {
    return domainEvidence({
      domain: 'mobility',
      category: 'below_reference',
      evidenceSource: 'published_reference',
      sourceResultKind: shoulder.resultKind,
      claimEligibility: shoulder.claimEligibility,
      focusEligible: true,
      reasons: ['shoulder_below_published_middle_range', ...reasonCodes(shoulder)],
    });
  }
  if (shoulder.iqr.category === 'within_published_middle_range') {
    return domainEvidence({
      domain: 'mobility',
      category: 'within_reference',
      evidenceSource: 'published_reference',
      sourceResultKind: shoulder.resultKind,
      claimEligibility: shoulder.claimEligibility,
      reasons: ['shoulder_within_published_middle_range', ...reasonCodes(shoulder)],
    });
  }
  return domainEvidence({
    domain: 'mobility',
    category: 'above_reference_or_ceiling',
    evidenceSource: 'published_reference',
    sourceResultKind: shoulder.resultKind,
    claimEligibility: shoulder.claimEligibility,
    reasons: ['shoulder_above_published_middle_range_neutral', ...reasonCodes(shoulder)],
  });
}

type MovementProfileV2DomainEvidenceInput = Omit<MovementProfileV2DomainEvidence, 'focusEligible'> & {
  focusEligible?: boolean;
};

function domainEvidence({
  domain,
  category,
  evidenceSource,
  sourceResultKind,
  claimEligibility,
  focusEligible = false,
  reasons,
}: MovementProfileV2DomainEvidenceInput): MovementProfileV2DomainEvidence {
  return {
    domain,
    category,
    evidenceSource,
    sourceResultKind,
    claimEligibility,
    focusEligible,
    reasons: uniqueStrings(reasons),
  };
}

function reasonCodes(
  interpretation: {
    protocolEvidence?: string | null;
    eligibilityReasons?: readonly ReferenceClaimEligibility[];
    rawInvalidReasons?: readonly string[];
    claimEligibility: string;
  }
): string[] {
  return uniqueStrings([
    interpretation.claimEligibility,
    ...(interpretation.protocolEvidence ? [interpretation.protocolEvidence] : []),
    ...(interpretation.eligibilityReasons ?? []),
    ...(interpretation.rawInvalidReasons ?? []),
  ]);
}

function focusResult({
  focus,
  sourceSnapshotId,
  sourceSnapshotFingerprint,
  sourceCheckUpId,
  sourceCheckUpType,
  domainEvidence,
  lifeGoalContext,
  priorFocusContext,
  candidateDomains,
  decisionReason,
}: {
  focus: MovementProfileV2SuggestedFocus;
  sourceSnapshotId: string;
  sourceSnapshotFingerprint: string;
  sourceCheckUpId: string;
  sourceCheckUpType: MovementProfileV2OfficialSourceCheckUpType;
  domainEvidence: readonly MovementProfileV2DomainEvidence[];
  lifeGoalContext: MovementProfileV2LifeGoalContext;
  priorFocusContext: MovementProfileV2PriorFocusContext;
  candidateDomains: readonly MovementDomain[];
  decisionReason: MovementProfileV2FocusDecisionReason;
}): { focus: MovementProfileV2SuggestedFocus; provenance: MovementProfileV2FocusProvenance } {
  const stableCandidates = stableDomains(candidateDomains);
  return {
    focus,
    provenance: {
      focusPolicyVersion: MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION,
      focusPolicyFingerprint: MOVEMENT_PROFILE_V2_FOCUS_POLICY_FINGERPRINT,
      domainEvidencePolicyVersion: MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_VERSION,
      domainEvidencePolicyFingerprint: MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_FINGERPRINT,
      sourceSnapshotId,
      sourceSnapshotFingerprint,
      sourceCheckUpId,
      sourceCheckUpType,
      domainEvidence,
      lifeGoalContext,
      priorFocusContext,
      candidateDomains: stableCandidates,
      excludedDomains: MOVEMENT_PROFILE_V2_DOMAIN_ORDER
        .filter((domain) => !stableCandidates.includes(domain))
        .map((domain) => ({
          domain,
          reasons: domainEvidence.find((item) => item.domain === domain)?.reasons ?? ['not_a_candidate'],
        })),
      decisionReason,
    },
  };
}

function domainFocus({
  focusDomain,
  planMode,
  reason,
  candidateDomains,
}: Omit<Extract<MovementProfileV2SuggestedFocus, { kind: 'domain' }>, 'kind'>): MovementProfileV2SuggestedFocus {
  return {
    kind: 'domain',
    focusDomain,
    planMode,
    reason,
    candidateDomains: stableDomains(candidateDomains),
  };
}

function balancedFocus(
  reason: MovementProfileV2FocusDecisionReason,
  candidateDomains: readonly MovementDomain[]
): MovementProfileV2SuggestedFocus {
  return {
    kind: 'balanced',
    planMode: 'balanced_insufficient_reference',
    reason,
    candidateDomains: stableDomains(candidateDomains),
  };
}

function normalizeDomainEvidence(
  evidence: readonly MovementProfileV2DomainEvidence[]
): readonly MovementProfileV2DomainEvidence[] {
  return MOVEMENT_PROFILE_V2_DOMAIN_ORDER.map((domain) => {
    const item = evidence.find((candidate) => candidate.domain === domain);
    return item ?? domainEvidence({
      domain,
      category: 'invalid_or_missing',
      evidenceSource: 'invalid',
      sourceResultKind: 'missing',
      claimEligibility: 'invalid_measurement',
      reasons: ['missing_domain_evidence'],
    });
  });
}

function domainsForCategory(
  evidence: readonly MovementProfileV2DomainEvidence[],
  category: MovementProfileV2DomainEvidenceCategory
): MovementDomain[] {
  return MOVEMENT_PROFILE_V2_DOMAIN_ORDER.filter(
    (domain) => evidence.find((item) => item.domain === domain)?.category === category
  );
}

function uniqueGoalCandidate(
  context: MovementProfileV2LifeGoalContext,
  candidates: readonly MovementDomain[]
): MovementDomain | null {
  const overlap = context.mappedDomains.filter((domain) => candidates.includes(domain));
  return overlap.length === 1 ? overlap[0] : null;
}

function uniqueGoalDomain(context: MovementProfileV2LifeGoalContext): MovementDomain | null {
  return context.mappedDomains.length === 1 ? context.mappedDomains[0] : null;
}

function priorDomainInCandidates(
  context: MovementProfileV2PriorFocusContext,
  candidates: readonly MovementDomain[]
): MovementDomain | null {
  return context.kind === 'domain' && candidates.includes(context.focusDomain) ? context.focusDomain : null;
}

function mappedDomainsForGoalCategory(category: LifeGoalCategory): readonly MovementDomain[] {
  const goal = { category } as LifeGoal;
  return stableDomains(getLifeGoalTrainingRelevance(goal).primaryDomains);
}

function snapshotRawComplete(snapshot: StoredMovementProfileV2Snapshot): boolean {
  return (
    snapshot.interpretation.rawCompleteness.referenceComplete === true &&
    snapshot.interpretation.rawCompleteness.missingHeadlineMovementIds.length === 0 &&
    snapshot.interpretation.chair.rawMetric !== null &&
    snapshot.interpretation.balance.rawMetric !== null &&
    snapshot.interpretation.shoulder.rawMetric !== null
  );
}

function parseFocus(value: unknown): MovementProfileV2SuggestedFocus | null {
  if (!isRecord(value)) return null;
  if (value.kind === 'domain') {
    if (!isMovementDomain(value.focusDomain)) return null;
    if (
      value.planMode !== 'checkup_reference_focus' &&
      value.planMode !== 'checkup_hale_band_focus' &&
      value.planMode !== 'goal_led_reference_supported'
    ) {
      return null;
    }
    if (!isFocusDecisionReason(value.reason)) return null;
    const candidateDomains = parseDomains(value.candidateDomains);
    if (!candidateDomains || !candidateDomains.includes(value.focusDomain)) return null;
    return {
      kind: 'domain',
      focusDomain: value.focusDomain,
      planMode: value.planMode,
      reason: value.reason,
      candidateDomains,
    };
  }
  if (value.kind === 'balanced') {
    if ('focusDomain' in value) return null;
    if (value.planMode !== 'balanced_insufficient_reference') return null;
    if (!isFocusDecisionReason(value.reason)) return null;
    const candidateDomains = parseDomains(value.candidateDomains);
    if (!candidateDomains) return null;
    return {
      kind: 'balanced',
      planMode: 'balanced_insufficient_reference',
      reason: value.reason,
      candidateDomains,
    };
  }
  if (value.kind === 'needs_retake') {
    if (value.planMode !== 'needs_retake' || value.reason !== 'v2_focus_needs_retake') return null;
    const invalidDomains = parseDomains(value.invalidDomains);
    if (!invalidDomains || invalidDomains.length === 0) return null;
    return {
      kind: 'needs_retake',
      planMode: 'needs_retake',
      reason: 'v2_focus_needs_retake',
      invalidDomains,
    };
  }
  return null;
}

function parseProvenance(value: unknown): MovementProfileV2FocusProvenance | null {
  if (!isRecord(value)) return null;
  if (
    value.focusPolicyVersion !== MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION ||
    value.focusPolicyFingerprint !== MOVEMENT_PROFILE_V2_FOCUS_POLICY_FINGERPRINT ||
    value.domainEvidencePolicyVersion !== MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_VERSION ||
    value.domainEvidencePolicyFingerprint !== MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_FINGERPRINT ||
    typeof value.sourceSnapshotId !== 'string' ||
    typeof value.sourceSnapshotFingerprint !== 'string' ||
    typeof value.sourceCheckUpId !== 'string' ||
    !isOfficialV2SourceCheckUpType(value.sourceCheckUpType) ||
    !isFocusDecisionReason(value.decisionReason)
  ) {
    return null;
  }
  const domainEvidence = parseDomainEvidence(value.domainEvidence);
  if (!domainEvidence) return null;
  const lifeGoalContext = parseLifeGoalContext(value.lifeGoalContext);
  if (!lifeGoalContext) return null;
  const priorFocusContext = parsePriorFocusContext(value.priorFocusContext);
  if (!priorFocusContext) return null;
  const candidateDomains = parseDomains(value.candidateDomains);
  if (!candidateDomains) return null;
  const excludedDomains = parseExcludedDomains(value.excludedDomains);
  if (!excludedDomains) return null;
  if (value.sourceCheckUpType !== 'official_retest' && isPreserveReason(value.decisionReason)) return null;
  if (isPreserveReason(value.decisionReason) && priorFocusContext.kind === 'none') return null;
  return {
    focusPolicyVersion: MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION,
    focusPolicyFingerprint: MOVEMENT_PROFILE_V2_FOCUS_POLICY_FINGERPRINT,
    domainEvidencePolicyVersion: MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_VERSION,
    domainEvidencePolicyFingerprint: MOVEMENT_PROFILE_V2_DOMAIN_EVIDENCE_POLICY_FINGERPRINT,
    sourceSnapshotId: value.sourceSnapshotId,
    sourceSnapshotFingerprint: value.sourceSnapshotFingerprint,
    sourceCheckUpId: value.sourceCheckUpId,
    sourceCheckUpType: value.sourceCheckUpType,
    domainEvidence,
    lifeGoalContext,
    priorFocusContext,
    candidateDomains,
    excludedDomains,
    decisionReason: value.decisionReason,
  };
}

function parseDomainEvidence(value: unknown): readonly MovementProfileV2DomainEvidence[] | null {
  if (!Array.isArray(value) || value.length !== MOVEMENT_PROFILE_V2_DOMAIN_ORDER.length) return null;
  const out: MovementProfileV2DomainEvidence[] = [];
  for (let index = 0; index < MOVEMENT_PROFILE_V2_DOMAIN_ORDER.length; index++) {
    const item = value[index];
    const domain = MOVEMENT_PROFILE_V2_DOMAIN_ORDER[index];
    if (!isRecord(item)) return null;
    if (!domain || item.domain !== domain) return null;
    if (!isDomainEvidenceCategory(item.category)) return null;
    if (!isDomainEvidenceSource(item.evidenceSource)) return null;
    if (typeof item.sourceResultKind !== 'string' || typeof item.claimEligibility !== 'string') return null;
    if (typeof item.focusEligible !== 'boolean') return null;
    const reasons = parseStringArray(item.reasons);
    if (!reasons || reasons.length === 0) return null;
    if (item.category === 'below_reference' && item.evidenceSource === 'raw_only') return null;
    out.push({
      domain,
      category: item.category,
      evidenceSource: item.evidenceSource,
      sourceResultKind: item.sourceResultKind,
      claimEligibility: item.claimEligibility,
      focusEligible: item.focusEligible,
      reasons,
    });
  }
  return out;
}

function parseLifeGoalContext(value: unknown): MovementProfileV2LifeGoalContext | null {
  if (!isRecord(value)) return null;
  if (
    value.mappingAdapterVersion !== MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION ||
    value.mappingFingerprint !== MOVEMENT_PROFILE_V2_LIFE_GOAL_MAPPING_FINGERPRINT
  ) {
    return null;
  }
  if (value.kind === 'none') {
    return Array.isArray(value.mappedDomains) && value.mappedDomains.length === 0
      ? {
          kind: 'none',
          mappingAdapterVersion: MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION,
          mappingFingerprint: MOVEMENT_PROFILE_V2_LIFE_GOAL_MAPPING_FINGERPRINT,
          mappedDomains: [],
        }
      : null;
  }
  if (value.kind === 'unknown_or_unsupported') {
    return Array.isArray(value.mappedDomains) && value.mappedDomains.length === 0
      ? {
          kind: 'unknown_or_unsupported',
          rawGoalId: typeof value.rawGoalId === 'string' ? value.rawGoalId : undefined,
          mappingAdapterVersion: MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION,
          mappingFingerprint: MOVEMENT_PROFILE_V2_LIFE_GOAL_MAPPING_FINGERPRINT,
          mappedDomains: [],
        }
      : null;
  }
  if (value.kind === 'selected') {
    if (typeof value.goalId !== 'string' || !isLifeGoalCategory(value.goalCategory)) return null;
    const mappedDomains = parseDomains(value.mappedDomains);
    if (!mappedDomains || !sameDomains(mappedDomains, mappedDomainsForGoalCategory(value.goalCategory))) return null;
    return {
      kind: 'selected',
      goalId: value.goalId,
      goalCategory: value.goalCategory,
      mappingAdapterVersion: MOVEMENT_PROFILE_V2_LIFE_GOAL_ADAPTER_VERSION,
      mappingFingerprint: MOVEMENT_PROFILE_V2_LIFE_GOAL_MAPPING_FINGERPRINT,
      mappedDomains,
    };
  }
  return null;
}

function parsePriorFocusContext(value: unknown): MovementProfileV2PriorFocusContext | null {
  if (!isRecord(value)) return null;
  if (value.kind === 'none') return { kind: 'none' };
  if (value.kind === 'domain') {
    if (
      !isMovementDomain(value.focusDomain) ||
      typeof value.sourceAssessmentId !== 'string' ||
      typeof value.sourceAssessmentFingerprint !== 'string'
    ) {
      return null;
    }
    return {
      kind: 'domain',
      focusDomain: value.focusDomain,
      sourceAssessmentId: value.sourceAssessmentId,
      sourceAssessmentFingerprint: value.sourceAssessmentFingerprint,
    };
  }
  if (value.kind === 'balanced') {
    if (typeof value.sourceAssessmentId !== 'string' || typeof value.sourceAssessmentFingerprint !== 'string') return null;
    return {
      kind: 'balanced',
      sourceAssessmentId: value.sourceAssessmentId,
      sourceAssessmentFingerprint: value.sourceAssessmentFingerprint,
    };
  }
  return null;
}

function parseExcludedDomains(
  value: unknown
): MovementProfileV2FocusProvenance['excludedDomains'] | null {
  if (!Array.isArray(value)) return null;
  const out: { domain: MovementDomain; reasons: readonly string[] }[] = [];
  const seen = new Set<MovementDomain>();
  for (const item of value) {
    if (!isRecord(item) || !isMovementDomain(item.domain) || seen.has(item.domain)) return null;
    const reasons = parseStringArray(item.reasons);
    if (!reasons || reasons.length === 0) return null;
    seen.add(item.domain);
    out.push({ domain: item.domain, reasons });
  }
  return out.sort((a, b) => MOVEMENT_PROFILE_V2_DOMAIN_ORDER.indexOf(a.domain) - MOVEMENT_PROFILE_V2_DOMAIN_ORDER.indexOf(b.domain));
}

function parseDomains(value: unknown): readonly MovementDomain[] | null {
  if (!Array.isArray(value)) return null;
  const domains: MovementDomain[] = [];
  for (const item of value) {
    if (!isMovementDomain(item) || domains.includes(item)) return null;
    domains.push(item);
  }
  const stable = stableDomains(domains);
  return sameDomains(stable, domains) ? stable : null;
}

function parseStringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || out.includes(item)) return null;
    out.push(item);
  }
  return out;
}

function focusesEqual(a: MovementProfileV2SuggestedFocus, b: MovementProfileV2SuggestedFocus): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function provenanceEqual(a: MovementProfileV2FocusProvenance, b: MovementProfileV2FocusProvenance): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function fail(
  reason: MovementProfileV2AssessmentDiagnosticCode,
  diagnostics: readonly MovementProfileV2AssessmentDiagnostic[]
): MovementProfileV2AssessmentCreationResult {
  return { ok: false, reason, diagnostics };
}

function diagnostic(
  code: MovementProfileV2AssessmentDiagnosticCode,
  details: Omit<MovementProfileV2AssessmentDiagnostic, 'code'> = {}
): MovementProfileV2AssessmentDiagnostic {
  return { code, ...details };
}

function stableDomains(domains: readonly MovementDomain[]): readonly MovementDomain[] {
  const seen = new Set<MovementDomain>();
  return MOVEMENT_PROFILE_V2_DOMAIN_ORDER.filter((domain) => {
    if (!domains.includes(domain) || seen.has(domain)) return false;
    seen.add(domain);
    return true;
  });
}

function sameDomains(a: readonly MovementDomain[], b: readonly MovementDomain[]): boolean {
  return a.length === b.length && a.every((domain, index) => domain === b[index]);
}

function uniqueStrings(values: readonly string[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    if (value && !out.includes(value)) out.push(value);
  }
  return out;
}

function isOfficialV2SourceCheckUpType(value: unknown): value is MovementProfileV2OfficialSourceCheckUpType {
  return value === 'baseline' || value === 'baseline_retake' || value === 'official_retest';
}

function isMovementDomain(value: unknown): value is MovementDomain {
  return value === 'strength_power' || value === 'balance' || value === 'mobility';
}

function isLifeGoalCategory(value: unknown): value is LifeGoalCategory {
  return typeof value === 'string' && LIFE_GOAL_CATEGORIES.includes(value as LifeGoalCategory);
}

function isDomainEvidenceCategory(value: unknown): value is MovementProfileV2DomainEvidenceCategory {
  return (
    value === 'below_reference' ||
    value === 'within_reference' ||
    value === 'above_reference_or_ceiling' ||
    value === 'hale_starting_point' ||
    value === 'hale_building' ||
    value === 'raw_only_valid' ||
    value === 'invalid_or_missing'
  );
}

function isDomainEvidenceSource(value: unknown): value is MovementProfileV2DomainEvidenceSource {
  return value === 'published_reference' || value === 'hale_task_band' || value === 'raw_only' || value === 'invalid';
}

function isFocusDecisionReason(value: unknown): value is MovementProfileV2FocusDecisionReason {
  return (
    value === 'v2_focus_single_below_reference' ||
    value === 'v2_focus_multiple_below_preserve_current' ||
    value === 'v2_focus_multiple_below_goal_tiebreak' ||
    value === 'v2_focus_multiple_below_balanced' ||
    value === 'v2_focus_single_hale_starting_point' ||
    value === 'v2_focus_starting_point_preserve_current' ||
    value === 'v2_focus_starting_point_goal_tiebreak' ||
    value === 'v2_focus_starting_point_balanced' ||
    value === 'v2_focus_goal_led' ||
    value === 'v2_focus_preserve_current_no_clear_candidate' ||
    value === 'v2_focus_balanced_no_unique_signal' ||
    value === 'v2_focus_needs_retake' ||
    value === 'v2_focus_clear_signal_overrides_goal'
  );
}

function isPreserveReason(value: MovementProfileV2FocusDecisionReason): boolean {
  return (
    value === 'v2_focus_multiple_below_preserve_current' ||
    value === 'v2_focus_starting_point_preserve_current' ||
    value === 'v2_focus_preserve_current_no_clear_candidate'
  );
}

function containsForbiddenAssessmentKeys(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenAssessmentKeys);
  if (!isRecord(value)) return false;
  for (const [key, child] of Object.entries(value)) {
    if (
      key === 'movementAge' ||
      key === 'bodyAge' ||
      key === 'weakestDomain' ||
      key === 'score' ||
      key === 'scoreSnapshot' ||
      key === 'movementBlock' ||
      key === 'blockReport' ||
      key === 'trainingPlan' ||
      key === 'displayCopy'
    ) {
      return true;
    }
    if (containsForbiddenAssessmentKeys(child)) return true;
  }
  return false;
}

function isJsonSafe(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonSafe);
  if (isRecord(value)) return Object.values(value).every(isJsonSafe);
  return false;
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
