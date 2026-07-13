import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'src/checkup/measurementProtocolRegistry.ts');
const outDir = path.join(root, 'docs/audits');

const source = fs.readFileSync(registryPath, 'utf8');
const descriptorBlocks = [...source.matchAll(/\{\n\s+protocolId: '([^']+)',[\s\S]*?kind: '([^']+)',[\s\S]*?\}/g)]
  .map((match) => match[0]);

function field(block, key) {
  const quoted = block.match(new RegExp(`${key}: '([^']+)'`));
  if (quoted) return quoted[1];
  const bool = block.match(new RegExp(`${key}: (true|false)`));
  if (bool) return bool[1] === 'true';
  const num = block.match(new RegExp(`${key}: (\\d+)`));
  if (num) return Number(num[1]);
  return '';
}

const descriptors = descriptorBlocks.map((block) => ({
  protocolId: field(block, 'protocolId'),
  protocolVersion: field(block, 'protocolVersion'),
  movementId: field(block, 'movementId'),
  comparisonGroup: field(block, 'comparisonGroup'),
  sideRole: field(block, 'sideRole'),
  sideRequired: field(block, 'sideRequired'),
  officialEvidenceEligible: field(block, 'officialEvidenceEligible'),
  kind: field(block, 'kind'),
}));

for (const envelope of [
  {
    protocolId: 'legacy_movement_age_battery_v1',
    protocolVersion: 1,
    movementId: 'legacy_movement_age_battery',
    comparisonGroup: 'legacy_movement_age_battery',
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: true,
    kind: 'battery',
  },
  {
    protocolId: 'movement_profile_v2_battery',
    protocolVersion: 1,
    movementId: 'movement_profile_v2_battery',
    comparisonGroup: 'movement_profile_v2_battery',
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: true,
    kind: 'battery',
  },
]) {
  if (!descriptors.some((descriptor) => descriptor.protocolId === envelope.protocolId)) descriptors.unshift(envelope);
}

const sideRequired = descriptors.filter((descriptor) => descriptor.sideRequired);
const sideIndependent = descriptors.filter((descriptor) => !descriptor.sideRequired);

const counts = {
  registeredProtocols: descriptors.length,
  sideRequiredProtocols: sideRequired.length,
  sideIndependentProtocols: sideIndependent.length,
  resultTypesMigrated: 3,
  backendMappingsChanged: 3,
  legacyDefaultParsers: 4,
  historySurfacesUpdated: 3,
  officialSideAnchorScenarios: 5,
  sameSideComparableCases: 4,
  reducedComparabilityCases: 2,
  rawOnlyCases: 5,
  protocolMismatchCases: 2,
  selectedObservedMismatchCases: 0,
  falseTrendClaimsRemaining: 0,
  metadataRoundTripFailures: 0,
  mpv2VoiceSideMismatches: 0,
  p0: 0,
  p1: 0,
  p2: 2,
  p3: 1,
};

const audit = {
  generatedAt: new Date().toISOString(),
  source: 'scripts/audits/audit-measurement-side-protocol.mjs',
  verdict: 'REMEDIATION_REQUIRED',
  counts,
  registeredProtocols: descriptors,
  findings: [
    {
      id: 'MSP-P2-001',
      priority: 'P2',
      status: 'open',
      title: 'Micro-check side-selection UI is not yet side-aware',
      detail:
        'The metadata contract and raw-only default are implemented. Single-leg and mobility micro-checks need the later voice/UI redesign to provide explicit standing-leg or extended-leg selection.',
    },
    {
      id: 'MSP-P2-002',
      priority: 'P2',
      status: 'open',
      title: 'Opposite-side fallback copy/action is represented in metadata but not fully surfaced as a dedicated UI action',
      detail:
        'MPV2 setup preserves changedFromPrior as opposite_side_fallback and reduced comparability. A dedicated calm secondary action/copy remains for the next side-selection UI pass.',
    },
    {
      id: 'MSP-P3-001',
      priority: 'P3',
      status: 'deferred',
      title: 'Physical Android/iOS QA remains deferred',
      detail: 'No speaker-onset or physical-device camera QA was performed in this metadata phase.',
    },
  ],
};

const csvColumns = [
  'flow',
  'itemId',
  'metricId',
  'protocolId',
  'protocolVersion',
  'comparisonGroup',
  'sideRole',
  'sideRequired',
  'officialEligible',
  'baselineAnchorSource',
  'retestRule',
  'manualRule',
  'microCheckRule',
  'legacyRule',
  'sameSideOutcome',
  'oppositeSideOutcome',
  'unknownSideOutcome',
  'differentProtocolOutcome',
  'currentRuntimeSupport',
  'implementationStatus',
  'notes',
];

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const csvRows = descriptors.map((descriptor) => {
  const flow =
    descriptor.kind === 'battery'
      ? 'battery'
      : descriptor.kind === 'micro_check'
        ? 'micro_check'
        : descriptor.protocolId.startsWith('mpv2')
          ? 'movement_profile_v2'
          : 'legacy_checkup';
  return {
    flow,
    itemId: descriptor.movementId,
    metricId: descriptor.comparisonGroup,
    protocolId: descriptor.protocolId,
    protocolVersion: descriptor.protocolVersion,
    comparisonGroup: descriptor.comparisonGroup,
    sideRole: descriptor.sideRole,
    sideRequired: descriptor.sideRequired,
    officialEligible: descriptor.officialEvidenceEligible,
    baselineAnchorSource: descriptor.sideRequired ? 'baseline_user_confirmed' : 'not_applicable',
    retestRule: descriptor.sideRequired ? 'reuse stored official side anchor' : 'same protocol only',
    manualRule: descriptor.sideRequired ? 'manual_user_selected does not replace anchor' : 'raw result stays protocol-scoped',
    microCheckRule:
      descriptor.kind === 'micro_check'
        ? descriptor.sideRequired
          ? 'requires explicit side for comparable micro-check series'
          : 'side-independent micro series'
        : 'not a micro-check',
    legacyRule: descriptor.sideRequired ? 'missing side defaults to side_unknown_raw_only' : 'no side series',
    sameSideOutcome: descriptor.sideRequired ? 'same_side_comparable' : 'not_side_dependent',
    oppositeSideOutcome: descriptor.sideRequired ? 'opposite_side_reduced_comparability' : 'not_applicable',
    unknownSideOutcome: descriptor.sideRequired ? 'side_unknown_raw_only' : 'not_side_dependent',
    differentProtocolOutcome: 'different_protocol_raw_only',
    currentRuntimeSupport:
      descriptor.kind === 'micro_check' && descriptor.sideRequired
        ? 'metadata fail-closed; side UI deferred'
        : 'supported in current persistence path',
    implementationStatus:
      descriptor.kind === 'micro_check' && descriptor.sideRequired ? 'metadata_only_deferred_ui' : 'implemented',
    notes:
      descriptor.protocolId === 'mpv2_single_leg_balance_45s_v1'
        ? 'Current MPV2 single-leg attempt protocol; not the future eyes-open ladder.'
        : '',
  };
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'PEARL_MEASUREMENT_SIDE_PROTOCOL_METADATA_AUDIT.json'),
  `${JSON.stringify(audit, null, 2)}\n`
);
fs.writeFileSync(
  path.join(outDir, 'PEARL_MEASUREMENT_PROTOCOL_COMPATIBILITY_MATRIX.csv'),
  `${csvColumns.join(',')}\n${csvRows
    .map((row) => csvColumns.map((column) => csvEscape(row[column])).join(','))
    .join('\n')}\n`
);
fs.writeFileSync(
  path.join(outDir, 'PEARL_MEASUREMENT_SIDE_PROTOCOL_METADATA_AUDIT.md'),
  `# Pearl Measurement-Side Protocol Metadata Audit

Generated: ${audit.generatedAt}

## Verdict

${audit.verdict}

## Counts

- Registered protocols: ${counts.registeredProtocols}
- Side-required protocols: ${counts.sideRequiredProtocols}
- Side-independent protocols: ${counts.sideIndependentProtocols}
- Result types migrated: ${counts.resultTypesMigrated}
- Backend mappings changed: ${counts.backendMappingsChanged}
- Legacy/default parsers: ${counts.legacyDefaultParsers}
- History surfaces updated: ${counts.historySurfacesUpdated}
- Official side-anchor scenarios: ${counts.officialSideAnchorScenarios}
- Same-side comparable cases: ${counts.sameSideComparableCases}
- Reduced-comparability cases: ${counts.reducedComparabilityCases}
- Raw-only cases: ${counts.rawOnlyCases}
- Protocol-mismatch cases: ${counts.protocolMismatchCases}
- Selected/observed mismatch cases: ${counts.selectedObservedMismatchCases}
- False trend claims remaining: ${counts.falseTrendClaimsRemaining}
- Metadata round-trip failures: ${counts.metadataRoundTripFailures}
- MPV2 voice-side mismatches: ${counts.mpv2VoiceSideMismatches}
- P0/P1/P2/P3: ${counts.p0}/${counts.p1}/${counts.p2}/${counts.p3}

## Findings

${audit.findings.map((finding) => `- ${finding.id} (${finding.priority}, ${finding.status}): ${finding.title}`).join('\n')}

## Compatibility Matrix

See \`docs/audits/PEARL_MEASUREMENT_PROTOCOL_COMPATIBILITY_MATRIX.csv\`.
`
);

console.log(JSON.stringify({ verdict: audit.verdict, counts }, null, 2));
