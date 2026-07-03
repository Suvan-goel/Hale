import { syntheticCheckUp } from '../../checkup/devFixture';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  createCheckUpProtocolPolicy,
} from '../../checkup/protocolPolicy';
import {
  CURRENT_NORM_VERSION,
  CURRENT_SCORING_VERSION,
  FOCUS_SELECTION_POLICY_VERSION,
  INTERIM_NEAR_TIE_MARGIN_YEARS,
  SCORE_SNAPSHOT_SCHEMA_VERSION,
  classifyStoredScoreSnapshot,
  compareScoreSnapshots,
  createCurrentVersionedScoreSnapshot,
  parseStoredScoreSnapshot,
  scoreSnapshotMatchesScore,
  toStoredScoreSnapshot,
  type CheckUpScore,
  type Domain,
  type DomainResult,
} from '../index';

const START = '2026-06-20T08:00:00.000Z';

function domainResult(domain: Domain, midpoint: number): DomainResult {
  return {
    domain,
    label: domain,
    measured: true,
    ageLow: midpoint - 2,
    ageHigh: midpoint + 2,
    estimated: false,
    interpretation: 'Measured.',
    rows: [],
    primaryMetricValue: midpoint,
  };
}

function score(midpoints: Record<Domain, number>, weakestDomain: Domain | null = null): CheckUpScore {
  return {
    startedAt: START,
    weakestDomain,
    domains: [
      domainResult('strength', midpoints.strength),
      domainResult('balance', midpoints.balance),
      domainResult('mobility', midpoints.mobility),
    ],
  };
}

describe('versioned score snapshots', () => {
  it('freezes a current score interpretation with scoring and norm versions', () => {
    const checkUp = syntheticCheckUp('2026-06-20T08:00:00.000Z');
    const scored = createCurrentVersionedScoreSnapshot(checkUp, { createdAt: '2026-06-20T08:05:00.000Z' });

    expect(scored.snapshot).toMatchObject({
      schemaVersion: SCORE_SNAPSHOT_SCHEMA_VERSION,
      scoringVersion: CURRENT_SCORING_VERSION,
      normVersion: CURRENT_NORM_VERSION,
      createdAt: '2026-06-20T08:05:00.000Z',
      sourceCheckUpId: checkUp.startedAt,
    });
    expect(scored.snapshot?.score.domains).toHaveLength(3);
    expect(parseStoredScoreSnapshot(scored.snapshot).ok).toBe(true);
    expect(scoreSnapshotMatchesScore(scored.snapshot!, scored.score)).toBe(true);
  });

  it('does not create a current V1 score snapshot for Movement Profile V2 raw Check-Ups', () => {
    const checkUp = syntheticCheckUp('2026-06-20T08:00:00.000Z');
    checkUp.protocolPolicy = createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, checkUp.startedAt);
    const scored = createCurrentVersionedScoreSnapshot(checkUp, { createdAt: '2026-06-20T08:05:00.000Z' });

    expect(scored.snapshot).toBeNull();
    expect(scored.issues).toContainEqual({ code: 'unsupported_checkup_protocol', field: 'protocolPolicy' });
    expect(scored.score.weakestDomain).toBeNull();
  });

  it('uses only the current version constants when creating snapshots', () => {
    const checkUp = syntheticCheckUp('2026-06-20T08:00:00.000Z');
    const first = createCurrentVersionedScoreSnapshot(checkUp, { createdAt: '2026-06-20T08:05:00.000Z' }).snapshot!;
    const second = createCurrentVersionedScoreSnapshot(checkUp, { createdAt: '2026-06-20T08:06:00.000Z' }).snapshot!;

    expect([SCORE_SNAPSHOT_SCHEMA_VERSION, CURRENT_SCORING_VERSION, CURRENT_NORM_VERSION].every(Number.isInteger)).toBe(true);
    expect([SCORE_SNAPSHOT_SCHEMA_VERSION, CURRENT_SCORING_VERSION, CURRENT_NORM_VERSION].every((value) => value > 0)).toBe(true);
    expect(first).toMatchObject({
      schemaVersion: SCORE_SNAPSHOT_SCHEMA_VERSION,
      scoringVersion: CURRENT_SCORING_VERSION,
      normVersion: CURRENT_NORM_VERSION,
      sourceCheckUpId: checkUp.startedAt,
    });
    expect(second).toMatchObject({
      schemaVersion: SCORE_SNAPSHOT_SCHEMA_VERSION,
      scoringVersion: CURRENT_SCORING_VERSION,
      normVersion: CURRENT_NORM_VERSION,
      sourceCheckUpId: checkUp.startedAt,
    });
  });

  it('round-trips unmeasured domains as JSON-safe nulls without losing runtime NaN semantics', () => {
    const checkUp = syntheticCheckUp('2026-06-20T08:00:00.000Z');
    checkUp.items = checkUp.items.map((item) => ({
      movementId: item.movementId,
      status: 'measured',
      result: { movementId: item.movementId, flags: ['no-measurement'], interruptions: 0 } as never,
    }));

    const scored = createCurrentVersionedScoreSnapshot(checkUp);
    const strength = scored.snapshot?.score.domains.find((domain) => domain.domain === 'strength');
    const parsed = parseStoredScoreSnapshot(JSON.parse(JSON.stringify(scored.snapshot)));

    expect(strength?.ageLow).toBeNull();
    expect(parsed.ok).toBe(true);
    expect(parsed.ok && Number.isNaN(parsed.score.domains.find((domain) => domain.domain === 'strength')!.ageLow)).toBe(true);
  });

  it('stores clear focus metadata on new complete snapshots', () => {
    const snapshot = toStoredScoreSnapshot(score({ strength: 58, balance: 76, mobility: 62 }))!;

    expect(snapshot.focusSelection).toEqual({
      kind: 'clear',
      focusDomain: 'balance',
      tiedDomains: ['balance'],
    });
    expect(snapshot.score.weakestDomain).toBe('balance');
    expect(parseStoredScoreSnapshot(snapshot)).toMatchObject({ ok: true });
  });

  it('stores exact-tie metadata with deterministic fallback when no active focus is supplied', () => {
    const snapshot = toStoredScoreSnapshot(score({ strength: 74, balance: 74, mobility: 60 }))!;

    expect(snapshot.focusSelection).toEqual({
      kind: 'exact_tie',
      focusDomain: 'strength',
      tiedDomains: ['strength', 'balance'],
      tieBreakReason: 'deterministic_fallback',
    });
    expect(snapshot.score.weakestDomain).toBe('strength');
  });

  it('preserves active focus in exact-tie re-test snapshots', () => {
    const snapshot = toStoredScoreSnapshot(score({ strength: 60, balance: 74, mobility: 74 }, 'balance'), {
      activeFocusDomain: 'mobility',
    })!;
    const parsed = parseStoredScoreSnapshot(snapshot);

    expect(snapshot.focusSelection).toEqual({
      kind: 'exact_tie',
      focusDomain: 'mobility',
      tiedDomains: ['balance', 'mobility'],
      tieBreakReason: 'preserve_current_focus',
    });
    expect(snapshot.score.weakestDomain).toBe('mobility');
    expect(parsed.ok && parsed.score.weakestDomain).toBe('mobility');
  });

  it('stores near-tie metadata with the interim margin and deterministic fallback', () => {
    const snapshot = toStoredScoreSnapshot(score({ strength: 74, balance: 70, mobility: 60 }))!;
    const parsed = parseStoredScoreSnapshot(snapshot);

    expect(snapshot.focusSelection).toEqual({
      kind: 'near_tie',
      focusDomain: 'strength',
      tiedDomains: ['strength', 'balance'],
      nearTiedDomains: ['strength', 'balance'],
      nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
      policyVersion: FOCUS_SELECTION_POLICY_VERSION,
      tieBreakReason: 'near_tie_deterministic_fallback',
    });
    expect(snapshot.score.weakestDomain).toBe('strength');
    expect(parsed.ok && parsed.score.weakestDomain).toBe('strength');
  });

  it('preserves active focus in near-tie re-test snapshots', () => {
    const snapshot = toStoredScoreSnapshot(score({ strength: 60, balance: 74, mobility: 70 }, 'balance'), {
      activeFocusDomain: 'mobility',
    })!;
    const parsed = parseStoredScoreSnapshot(snapshot);

    expect(snapshot.focusSelection).toEqual({
      kind: 'near_tie',
      focusDomain: 'mobility',
      tiedDomains: ['balance', 'mobility'],
      nearTiedDomains: ['balance', 'mobility'],
      nearTieMarginYears: INTERIM_NEAR_TIE_MARGIN_YEARS,
      policyVersion: FOCUS_SELECTION_POLICY_VERSION,
      tieBreakReason: 'near_tie_preserve_current_focus',
    });
    expect(snapshot.score.weakestDomain).toBe('mobility');
    expect(parsed.ok && parsed.score.weakestDomain).toBe('mobility');
  });

  it('continues to parse older snapshots without focus metadata but rejects contradictory metadata', () => {
    const snapshot = toStoredScoreSnapshot(score({ strength: 74, balance: 74, mobility: 60 }))!;
    const { focusSelection: _focusSelection, ...legacyShape } = snapshot;

    expect(parseStoredScoreSnapshot(legacyShape).ok).toBe(true);
    expect(classifyStoredScoreSnapshot({
      ...snapshot,
      focusSelection: {
        kind: 'exact_tie',
        focusDomain: 'mobility',
        tiedDomains: ['strength', 'balance'],
        tieBreakReason: 'deterministic_fallback',
      },
    })).toBe('invalid_snapshot');
  });

  it('continues to parse older near-tie snapshots without near-tie metadata', () => {
    const snapshot = toStoredScoreSnapshot(score({ strength: 74, balance: 70, mobility: 60 }))!;
    const { focusSelection: _focusSelection, ...legacyShape } = snapshot;
    const parsed = parseStoredScoreSnapshot(legacyShape);

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.snapshot.focusSelection).toBeUndefined();
    expect(parsed.ok && parsed.score.weakestDomain).toBe('strength');
  });

  it('classifies legacy, malformed, unsupported, and incompatible snapshots distinctly', () => {
    const snapshot = createCurrentVersionedScoreSnapshot(syntheticCheckUp()).snapshot!;
    const { scoringVersion: _missingScoringVersion, ...missingScoringVersion } = snapshot;
    const { normVersion: _missingNormVersion, ...missingNormVersion } = snapshot;

    expect(classifyStoredScoreSnapshot(undefined)).toBe('legacy_unversioned');
    expect(classifyStoredScoreSnapshot(missingScoringVersion)).toBe('legacy_unversioned');
    expect(classifyStoredScoreSnapshot(missingNormVersion)).toBe('legacy_unversioned');
    expect(classifyStoredScoreSnapshot({ scoringVersion: 1, normVersion: 1 })).toBe('invalid_snapshot');
    expect(classifyStoredScoreSnapshot({ ...snapshot, schemaVersion: 0 })).toBe('invalid_snapshot');
    expect(classifyStoredScoreSnapshot({ ...snapshot, scoringVersion: -1 })).toBe('invalid_snapshot');
    expect(classifyStoredScoreSnapshot({ ...snapshot, normVersion: 1.5 })).toBe('invalid_snapshot');
    expect(classifyStoredScoreSnapshot({ ...snapshot, schemaVersion: SCORE_SNAPSHOT_SCHEMA_VERSION + 1 })).toBe(
      'unsupported_schema'
    );
    expect(classifyStoredScoreSnapshot({ ...snapshot, scoringVersion: CURRENT_SCORING_VERSION + 1 })).toBe(
      'incompatible_version'
    );
  });

  it('allows direct comparisons only when both endpoints share exact snapshot versions', () => {
    const first = createCurrentVersionedScoreSnapshot(syntheticCheckUp('2026-06-01T08:00:00.000Z')).snapshot!;
    const second = createCurrentVersionedScoreSnapshot(syntheticCheckUp('2026-06-29T08:00:00.000Z')).snapshot!;

    expect(compareScoreSnapshots(first, second)).toBe('compatible');
    expect(compareScoreSnapshots(first, { ...second, normVersion: CURRENT_NORM_VERSION + 1 })).toBe('incompatible_version');
    expect(compareScoreSnapshots(first, null)).toBe('missing_snapshot');
  });

  it('parses snapshots deterministically without mutating stored payloads', () => {
    const snapshot = createCurrentVersionedScoreSnapshot(syntheticCheckUp('2026-06-01T08:00:00.000Z')).snapshot!;
    const stored = JSON.parse(JSON.stringify(snapshot));
    const before = JSON.stringify(stored);

    const first = parseStoredScoreSnapshot(stored);
    const second = parseStoredScoreSnapshot(stored);

    expect(JSON.stringify(stored)).toBe(before);
    expect(first).toEqual(second);
    expect(first.ok && first.score).toEqual(second.ok && second.score);
  });
});
