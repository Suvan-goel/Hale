export type ProgressDataAuthority =
  | {
      kind: 'movement_profile_v2';
      reason:
        | 'accepted_v2_profile'
        | 'v2_block_exists'
        | 'v2_report_exists'
        | 'v2_pending_continuation'
        | 'public_v2_default';
    }
  | {
      kind: 'legacy_v1';
      reason: 'rollback_no_v2_state';
    }
  | {
      kind: 'unavailable';
      reason: 'v2_malformed_state';
    };

export interface ProgressDataAuthorityInput {
  unifiedReleaseEnabled?: boolean;
  acceptedV2OfficialProfiles: readonly unknown[];
  v2OriginBlocks: readonly { origin?: { kind?: string } | null }[];
  acceptedV2Reports: readonly { kind?: string }[];
  hasPendingV2Continuation: boolean;
  hasMalformedV2State: boolean;
  v1RollbackAvailable: boolean;
}

export function selectProgressDataAuthority(
  input: ProgressDataAuthorityInput
): ProgressDataAuthority {
  if (input.acceptedV2OfficialProfiles.length > 0) {
    return { kind: 'movement_profile_v2', reason: 'accepted_v2_profile' };
  }
  if (input.v2OriginBlocks.some((block) => block.origin?.kind === 'movement_profile_v2_assessment')) {
    return { kind: 'movement_profile_v2', reason: 'v2_block_exists' };
  }
  if (input.acceptedV2Reports.some((report) => report.kind === 'movement_profile_v2_block_report')) {
    return { kind: 'movement_profile_v2', reason: 'v2_report_exists' };
  }
  if (input.hasPendingV2Continuation) {
    return { kind: 'movement_profile_v2', reason: 'v2_pending_continuation' };
  }
  if (input.hasMalformedV2State) {
    return { kind: 'unavailable', reason: 'v2_malformed_state' };
  }
  if (input.v1RollbackAvailable) {
    return { kind: 'legacy_v1', reason: 'rollback_no_v2_state' };
  }
  return { kind: 'movement_profile_v2', reason: 'public_v2_default' };
}
