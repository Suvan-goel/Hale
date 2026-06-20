import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  Card,
  EmptyState,
  Screen,
  StatusBadge,
} from '../components/ui';
import {
  daysUntil,
  LOCAL_USER_ID,
  type MovementAssessment,
  type MovementBlock,
  type MovementBlockReport,
  type MovementDomain,
  type TrainingSessionCompletion,
} from '../adherence';
import { syntheticCheckUp } from '../checkup/devFixture';
import type { CheckUp } from '../checkup/types';
import {
  createMovementAssessment,
  createMovementBlockReport,
  getBlockReportSummaries,
  getDomainProgressCards,
  getLatestDomainEvidence,
  getLatestCheckUpSummary,
  getRetestDueSummary,
  getRetestHistory,
} from '../haleFlow';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../history';
import {
  createCurrentVersionedScoreSnapshot,
  type CheckUpScore,
  type Domain,
  type VersionedCheckUpScoreSnapshot,
} from '../scoring';
import type { LadderProgress } from '../training';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { SettingsIcon } from '../navigation/icons';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
  type BalanceResult,
  type ChairStandResult,
  type HingeReachResult,
  type ShoulderFlexionResult,
} from '../movements';

const DOMAIN_LABEL: Record<Domain, string> = {
  strength: 'Strength / Power',
  balance: 'Balance',
  mobility: 'Mobility',
};

export function ProgressScreen({
  history,
  assessments,
  activeBlock,
  blocks,
  reports: blockReports,
  completions,
  today,
  onBeginCheckUp,
  onStartRetest,
  onViewLatest,
  onViewReport,
  onOpenSettings,
}: ProgressScreenProps) {
  const devMock = useProgressDevMockData({
    enabled: __DEV__ && !getLatestCheckUpSummary(history, assessments),
    today,
  });
  const visibleHistory = devMock?.history ?? history;
  const visibleAssessments = devMock?.assessments ?? assessments;
  const visibleActiveBlock = devMock?.activeBlock ?? activeBlock;
  const visibleBlocks = devMock?.blocks ?? blocks;
  const visibleReports = devMock?.reports ?? blockReports;
  const visibleCompletions = devMock?.completions ?? completions;

  const latest = getLatestCheckUpSummary(visibleHistory, visibleAssessments);
  const latestEvidence = getLatestDomainEvidence(visibleHistory, visibleAssessments);
  const domainCards = getDomainProgressCards(visibleHistory, visibleAssessments);
  const blockSummaries = getBlockReportSummaries({
    blocks: visibleBlocks,
    reports: visibleReports,
    completions: visibleCompletions,
  });
  const retestHistory = getRetestHistory(visibleHistory, visibleAssessments);
  const hasComparison = retestHistory.length > 1;
  const retest = getRetestDueSummary({ activeBlock: visibleActiveBlock, today, hasBaseline: !!latest });
  const handleViewLatest = devMock ? noop : onViewLatest;
  const handleViewReport = devMock ? noopReport : onViewReport;

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Progress</Text>
          <Pressable
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <SettingsIcon size={25} color={colors.accentDeep} strokeWidth={1.8} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Your check-up evidence, training reports, and next re-test.</Text>
      </View>

      {!latest ? (
        <EmptyState
          title="Complete your first Movement Check-Up to see your baseline."
          body="Hale will use it to build your 4-week block and start a home estimate."
          actionLabel="Start Movement Check-Up"
          onAction={onBeginCheckUp}
        />
      ) : (
        <>
          <LatestCheckUpCard latest={latest} evidence={latestEvidence} onPress={handleViewLatest} />

          {hasComparison && domainCards.length > 0 ? <ChangeSinceBaselineCard cards={domainCards} /> : null}

          {blockSummaries.length > 0 ? (
            <BlockReportsCard summaries={blockSummaries} onViewReport={handleViewReport} />
          ) : null}

          <RetestCard
            title={retest.title}
            body={retestLine({ activeBlock: visibleActiveBlock, today, fallback: retest.body, due: retest.due })}
            onPress={retest.due && retest.ctaLabel ? onStartRetest : undefined}
          />

          {retestHistory.length > 1 ? <CheckUpHistoryCard entries={retestHistory} /> : null}
        </>
      )}
    </Screen>
  );
}

interface ProgressScreenProps {
  history: readonly StoredCheckUp[];
  assessments?: readonly MovementAssessment[];
  activeBlock?: MovementBlock | null;
  blocks: readonly MovementBlock[];
  reports: readonly MovementBlockReport[];
  completions: readonly TrainingSessionCompletion[];
  ladderProgressById?: Record<string, LadderProgress>;
  today: string;
  onBeginCheckUp: () => void;
  onStartRetest: () => void;
  onViewLatest: () => void;
  onViewReport: (blockId: string) => void;
  onOpenSettings: () => void;
}

function noop() {}

function noopReport(_blockId: string) {}

interface ProgressDevMockData {
  history: StoredCheckUp[];
  assessments: MovementAssessment[];
  activeBlock: MovementBlock;
  blocks: MovementBlock[];
  reports: MovementBlockReport[];
  completions: TrainingSessionCompletion[];
}

interface ScoredDevCheckUp {
  record: StoredCheckUp;
  assessment: MovementAssessment;
  score: CheckUpScore;
  snapshot: VersionedCheckUpScoreSnapshot;
}

function useProgressDevMockData({
  enabled,
  today,
}: {
  enabled: boolean;
  today: string;
}): ProgressDevMockData | null {
  // Temporary dev-only layout fixture; it is never persisted and release builds never use it.
  return React.useMemo(() => (enabled ? buildProgressDevMockData(today) : null), [enabled, today]);
}

function buildProgressDevMockData(today: string): ProgressDevMockData {
  const base = devBaseDate(today);
  const baseline = createScoredDevCheckUp(
    devCheckUp(devIso(base, -74), {
      chairStandReps: 10,
      riseVelocity: 0.18,
      peakRiseVelocity: 0.25,
      balanceSec: 6,
      shoulderDeg: 148,
      hingeReachBu: 0.32,
    }),
    'baseline'
  );

  const completedBlock = devBlock({
    id: 'dev-progress-block-1',
    sourceAssessmentId: baseline.assessment.id,
    status: 'completed',
    focusDomain: scoreToMovementDomain(baseline.score.weakestDomain) ?? 'balance',
    startDate: devIso(base, -73),
    endDate: devIso(base, -45),
    retestDate: devIso(base, -45),
    completedSessions: 11,
    microChecksCompleted: 2,
    updatedAt: devIso(base, -38),
  });

  const latest = createScoredDevCheckUp(
    devCheckUp(devIso(base, -38), {
      chairStandReps: 14,
      riseVelocity: 0.23,
      peakRiseVelocity: 0.33,
      balanceSec: 12,
      shoulderDeg: 164,
      hingeReachBu: 0.18,
    }),
    'official_retest',
    completedBlock.id
  );

  const activeBlock = devBlock({
    id: 'dev-progress-block-2',
    sourceAssessmentId: latest.assessment.id,
    status: 'active',
    focusDomain: scoreToMovementDomain(latest.score.weakestDomain) ?? 'balance',
    startDate: devIso(base, -21),
    endDate: devIso(base, 7),
    retestDate: devIso(base, 7),
    completedSessions: 5,
    microChecksCompleted: 1,
    updatedAt: devIso(base, -1),
  });

  const completions = [
    ...devSessionCompletions(completedBlock, base, -70, 11),
    ...devMicroCheckCompletions(completedBlock, base, [-63, -52]),
    ...devSessionCompletions(activeBlock, base, -19, 5),
    ...devMicroCheckCompletions(activeBlock, base, [-8]),
  ];

  const report = createMovementBlockReport({
    block: completedBlock,
    baselineAssessment: baseline.assessment,
    retestAssessment: latest.assessment,
    previousScore: baseline.score,
    latestScore: latest.score,
    previousScoreSnapshot: baseline.snapshot,
    latestScoreSnapshot: latest.snapshot,
    completions,
    nowIso: devIso(base, -37),
  });

  return {
    history: [baseline.record, latest.record],
    assessments: [baseline.assessment, latest.assessment],
    activeBlock,
    blocks: [completedBlock, activeBlock],
    reports: [report],
    completions,
  };
}

function createScoredDevCheckUp(
  checkUp: CheckUp,
  checkupType: StoredCheckUp['checkupType'],
  sourceBlockId?: string
): ScoredDevCheckUp {
  const scored = createCurrentVersionedScoreSnapshot(checkUp, {
    createdAt: checkUp.startedAt,
    sourceCheckUpId: checkUp.startedAt,
  });
  if (!scored.snapshot) {
    throw new Error('[ProgressScreen] Unable to build dev mock score snapshot.');
  }
  const assessment = createMovementAssessment({
    checkUpId: checkUp.startedAt,
    type: checkupType,
    score: scored.score,
    scoreSnapshot: scored.snapshot,
    sourceBlockId,
    completedAt: checkUp.startedAt,
  });
  return {
    record: {
      schemaVersion: HISTORY_SCHEMA_VERSION,
      checkUp,
      checkupType,
      sourceAssessmentId: assessment.id,
      scoreSnapshot: scored.snapshot,
      scoreSnapshotCompatibility: 'current',
    },
    assessment,
    score: scored.score,
    snapshot: scored.snapshot,
  };
}

function devCheckUp(
  startedAt: string,
  values: {
    chairStandReps: number;
    riseVelocity: number;
    peakRiseVelocity: number;
    balanceSec: number;
    shoulderDeg: number;
    hingeReachBu: number;
  }
): CheckUp {
  const checkUp = syntheticCheckUp(startedAt);
  return {
    ...checkUp,
    items: checkUp.items.map((item) => {
      if (!item.result) return item;
      if (item.movementId === CHAIR_STAND_ID) {
        const result = item.result as ChairStandResult;
        return {
          ...item,
          result: {
            ...result,
            reps: values.chairStandReps,
            sessionMeanVel: values.riseVelocity,
            sessionMeanPeakVel: values.peakRiseVelocity,
          },
        };
      }
      if (item.movementId === BALANCE_LADDER_ID) {
        const result = item.result as BalanceResult;
        return { ...item, result: { ...result, singleLegEyesOpenSec: values.balanceSec } };
      }
      if (item.movementId === SHOULDER_FLEXION_ID) {
        const result = item.result as ShoulderFlexionResult;
        return { ...item, result: { ...result, peakFlexionDeg: values.shoulderDeg } };
      }
      if (item.movementId === HINGE_REACH_ID) {
        const result = item.result as HingeReachResult;
        return { ...item, result: { ...result, reachBu: values.hingeReachBu } };
      }
      return item;
    }),
  };
}

function devBlock({
  id,
  sourceAssessmentId,
  status,
  focusDomain,
  startDate,
  endDate,
  retestDate,
  completedSessions,
  microChecksCompleted,
  updatedAt,
}: {
  id: string;
  sourceAssessmentId: string;
  status: MovementBlock['status'];
  focusDomain: MovementDomain;
  startDate: string;
  endDate: string;
  retestDate: string;
  completedSessions: number;
  microChecksCompleted: number;
  updatedAt: string;
}): MovementBlock {
  return {
    id,
    userId: LOCAL_USER_ID,
    status,
    startDate,
    endDate,
    retestDate,
    focusDomain,
    secondaryDomains: secondaryDomainsFor(focusDomain),
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions,
    microChecksCompleted,
    sourceAssessmentId,
    createdAt: startDate,
    updatedAt,
  };
}

function devSessionCompletions(
  block: MovementBlock,
  base: Date,
  firstOffsetDays: number,
  count: number
): TrainingSessionCompletion[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${block.id}-session-${index + 1}`,
    userId: LOCAL_USER_ID,
    blockId: block.id,
    plannedDate: `session-${index + 1}`,
    completedAt: devIso(base, firstOffsetDays + index * 2),
    sessionType: index === 0 ? 'starter' : 'standard',
    focusDomain: block.focusDomain,
    durationMinutes: index % 3 === 0 ? 16 : 18,
    perceivedEffort: ((index % 3) + 2) as 2 | 3 | 4,
    painReported: false,
  }));
}

function devMicroCheckCompletions(
  block: MovementBlock,
  base: Date,
  offsets: readonly number[]
): TrainingSessionCompletion[] {
  return offsets.map((offset, index) => ({
    id: `${block.id}-micro-${index + 1}`,
    userId: LOCAL_USER_ID,
    blockId: block.id,
    completedAt: devIso(base, offset),
    sessionType: 'micro_check',
    focusDomain: block.focusDomain,
    durationMinutes: 2,
    perceivedEffort: 2,
    painReported: false,
  }));
}

function scoreToMovementDomain(domain: Domain | null | undefined): MovementDomain | null {
  if (domain === 'strength') return 'strength_power';
  if (domain === 'balance' || domain === 'mobility') return domain;
  return null;
}

function secondaryDomainsFor(focusDomain: MovementDomain): MovementDomain[] {
  return (['strength_power', 'balance', 'mobility'] as MovementDomain[]).filter((domain) => domain !== focusDomain).slice(0, 2);
}

const DEV_DAY_MS = 24 * 60 * 60 * 1000;

function devBaseDate(today: string): Date {
  const parsed = new Date(today);
  const source = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate(), 9));
}

function devIso(base: Date, offsetDays: number): string {
  return new Date(base.getTime() + offsetDays * DEV_DAY_MS).toISOString();
}

function LatestCheckUpCard({
  latest,
  evidence,
  onPress,
}: {
  latest: NonNullable<ReturnType<typeof getLatestCheckUpSummary>>;
  evidence: ReturnType<typeof getLatestDomainEvidence>;
  onPress: () => void;
}) {
  return (
    <Card style={styles.progressCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionText}>
          <Text style={styles.sectionTitle}>Latest Movement Check-Up</Text>
          <Text style={styles.sectionIntro}>{latest.dateLabel}</Text>
        </View>
        <StatusBadge label="Camera estimated" tone="gold" />
      </View>
      <Text style={styles.latestFocus}>{latest.focusTitle}</Text>

      <View style={styles.evidenceList}>
        {evidence.map((item, index) => (
          <DomainEvidenceRow key={item.domain} item={item} showDivider={index > 0} onPress={onPress} />
        ))}
      </View>
    </Card>
  );
}

function DomainEvidenceRow({
  item,
  showDivider,
  onPress,
}: {
  item: ReturnType<typeof getLatestDomainEvidence>[number];
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.evidenceRow, showDivider && styles.rowDivider, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.ageLabel}. ${bandLabel(item.band)}.`}
    >
      <IconBadge domain={item.domain} size={46} iconSize={28} />
      <View style={styles.evidenceText}>
        <View style={styles.evidenceTitleRow}>
          <Text style={styles.domainTitle}>{item.title}</Text>
          <StatusBadge label={bandLabel(item.band)} tone={bandTone(item.band)} />
        </View>
        <Text style={styles.ageLabel}>{item.ageLabel}</Text>
        <Text style={styles.interpretation}>{item.interpretation}</Text>
        <View style={styles.metricGrid}>
          {item.metrics.map((metric) => (
            <View key={metric.label} style={styles.metricCell}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={[styles.metricValue, !metric.measured && styles.metricValueMuted]}>{metric.display}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

function ChangeSinceBaselineCard({
  cards,
}: {
  cards: ReturnType<typeof getDomainProgressCards>;
}) {
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>Change since baseline</Text>
      <Text style={styles.sectionIntro}>
        Compares official Movement Check-Ups using the same scoring version. Small changes may reflect setup or
        day-to-day variation.
      </Text>
      <View style={styles.domainList}>
        {cards.map((card, index) => (
          <DomainProgressRow key={card.domain} card={card} showDivider={index > 0} />
        ))}
      </View>
    </Card>
  );
}

function DomainProgressRow({
  card,
  showDivider,
}: {
  card: ReturnType<typeof getDomainProgressCards>[number];
  showDivider: boolean;
}) {
  return (
    <View style={[styles.domainRow, showDivider && styles.rowDivider]}>
      <IconBadge domain={card.domain} size={44} iconSize={27} />
      <View style={styles.domainText}>
        <Text style={styles.domainTitle}>{card.title}</Text>
        <Text style={styles.metricLine}>{displayMetric(card.metric)}</Text>
        <Text style={styles.domainBody}>{card.body}</Text>
      </View>
      <StatusBadge label={trendLabel(card.trend)} tone="neutral" />
    </View>
  );
}

function BlockReportsCard({
  summaries,
  onViewReport,
}: {
  summaries: ReturnType<typeof getBlockReportSummaries>;
  onViewReport: (blockId: string) => void;
}) {
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>4-week reports</Text>
      <Text style={styles.sectionIntro}>A report appears after a block has a re-test.</Text>
      <View style={styles.reportList}>
        {summaries.map((summary, index) => (
          <Pressable
            key={summary.blockId}
            style={({ pressed }) => [styles.reportRow, index > 0 && styles.rowDivider, pressed && styles.pressed]}
            onPress={() => onViewReport(summary.blockId)}
            accessibilityRole="button"
            accessibilityLabel={`${summary.focus} report. ${summary.sessions}. ${summary.mainChange}`}
          >
            <View style={styles.reportText}>
              <Text style={styles.reportTitle}>{summary.focus} block</Text>
              <Text style={styles.reportMeta}>{summary.dateRange} · {summary.sessions}</Text>
              <Text style={styles.reportChange}>{summary.mainChange}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function CheckUpHistoryCard({
  entries,
}: {
  entries: ReturnType<typeof getRetestHistory>;
}) {
  const visible = entries.slice(0, 4);
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>Check-up history</Text>
      <Text style={styles.sectionIntro}>A compact record of each official Movement Check-Up.</Text>
      <View style={styles.historyList}>
        {visible.map((entry, index) => (
          <View key={entry.id} style={[styles.historyRow, index > 0 && styles.rowDivider]}>
            <IconBadge domain="calendar" size={38} iconSize={23} />
            <View style={styles.historyText}>
              <Text style={styles.historyDate}>{entry.dateLabel}</Text>
              <Text style={styles.historyMeta}>{historyBandSummary(entry.bands)}</Text>
            </View>
          </View>
        ))}
      </View>
      {entries.length > visible.length ? (
        <Text style={styles.moreHistory}>{entries.length - visible.length} earlier check-ups saved locally.</Text>
      ) : null}
    </Card>
  );
}

function RetestCard({
  title,
  body,
  onPress,
}: {
  title: string;
  body: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <IconBadge domain="calendar" size={44} iconSize={26} />
      <View style={styles.retestText}>
        <Text style={styles.retestTitle}>{title}</Text>
        <Text style={styles.retestBody}>{body}</Text>
      </View>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  if (!onPress) {
    return <Card style={[styles.progressCard, styles.retestCard]}>{content}</Card>;
  }

  return (
    <Card style={[styles.progressCard, styles.retestCardInteractive]}>
      <Pressable
        style={({ pressed }) => [styles.retestPressable, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${body}`}
      >
        {content}
      </Pressable>
    </Card>
  );
}

function IconBadge({
  domain,
  size,
  iconSize,
}: {
  domain: Domain | 'calendar';
  size: number;
  iconSize: number;
}) {
  return (
    <View style={[styles.iconBadge, { width: size, height: size, borderRadius: size / 2 }]}>
      <ProgressPictogram name={domain} size={iconSize} color={colors.accent} />
    </View>
  );
}

function ProgressPictogram({
  name,
  size,
  color,
}: {
  name: Domain | 'calendar';
  size: number;
  color: string;
}) {
  const s = iconStroke(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'strength' ? (
        <>
          <Path d="M5 8.5 V15.5" {...s} />
          <Path d="M8 6.8 V17.2" {...s} />
          <Path d="M16 6.8 V17.2" {...s} />
          <Path d="M19 8.5 V15.5" {...s} />
          <Path d="M8 12 H16" {...s} />
          <Path d="M3 10 V14" {...s} />
          <Path d="M21 10 V14" {...s} />
        </>
      ) : name === 'balance' ? (
        <>
          <Path d="M12 4 V19" {...s} />
          <Path d="M7 7 H17" {...s} />
          <Path d="M5 19 H19" {...s} />
          <Path d="M7 7 L4.5 13.5 H9.5 L7 7 Z" {...s} />
          <Path d="M17 7 L14.5 13.5 H19.5 L17 7 Z" {...s} />
          <Path d="M4.8 13.5 C5.4 15.1 8.6 15.1 9.2 13.5" {...s} />
          <Path d="M14.8 13.5 C15.4 15.1 18.6 15.1 19.2 13.5" {...s} />
        </>
      ) : name === 'mobility' ? (
        <>
          <Circle cx={12} cy={5.4} r={1.6} {...s} />
          <Path d="M12 8.6 V13.2" {...s} />
          <Path d="M12 10.2 L7.8 12.6" {...s} />
          <Path d="M12 10.2 L16.4 13" {...s} />
          <Path d="M12 13.2 L8.7 19.2" {...s} />
          <Path d="M12 13.2 L16.4 19.2" {...s} />
        </>
      ) : (
        <>
          <Rect x={5.2} y={5.8} width={13.6} height={13.2} rx={2.2} {...s} />
          <Path d="M5.2 9.8 H18.8" {...s} />
          <Path d="M8.5 4.2 V7.1" {...s} />
          <Path d="M15.5 4.2 V7.1" {...s} />
          <Path d="M8.8 13.3 H10.2" {...s} />
          <Path d="M12.9 13.3 H15.1" {...s} />
          <Path d="M8.8 16.2 H10.2" {...s} />
        </>
      )}
    </Svg>
  );
}

function iconStroke(color: string) {
  return {
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };
}

function bandLabel(band: 'starting_point' | 'building' | 'strong' | 'pending'): string {
  if (band === 'strong') return 'Strong';
  if (band === 'building') return 'Building';
  if (band === 'starting_point') return 'Starting point';
  return 'Pending';
}

function bandTone(band: 'starting_point' | 'building' | 'strong' | 'pending'): 'neutral' | 'good' | 'gold' {
  if (band === 'strong') return 'good';
  if (band === 'building') return 'gold';
  return 'neutral';
}

function historyBandSummary(bands: Record<Domain, 'starting_point' | 'building' | 'strong' | 'pending'>): string {
  return (['strength', 'balance', 'mobility'] as Domain[])
    .map((domain) => `${DOMAIN_LABEL[domain]}: ${bandLabel(bands[domain])}`)
    .join(' · ');
}

function displayMetric(metric: string): string {
  return metric.replace(/ -> /g, ' → ');
}

function trendLabel(trend: string): string {
  if (trend === 'higher') return 'Recorded higher';
  if (trend === 'similar') return 'Similar result';
  if (trend === 'lower') return 'Recorded lower';
  return 'Starting point';
}

function retestLine({
  activeBlock,
  today,
  fallback,
  due,
}: {
  activeBlock?: MovementBlock | null;
  today: string;
  fallback: string;
  due: boolean;
}): string {
  if (!activeBlock || due) return fallback;
  return `${formatShortDate(activeBlock.retestDate)} · ${relativeRetestLabel(daysUntil(activeBlock.retestDate, today))}`;
}

function relativeRetestLabel(days: number): string {
  if (days <= 0) return 'Due now';
  if (days === 1) return 'Tomorrow';
  if (days >= 14) {
    const weeks = Math.ceil(days / 7);
    return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  return `In ${days} days`;
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Next check-up';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  screenContent: {
    gap: spacing.lg,
    paddingTop: spacing.pageTop,
  },
  header: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  title: { ...type.pageTitle },
  subtitle: { ...type.pageSubtitle, maxWidth: 360 },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    padding: spacing.lg + spacing.xs,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  sectionText: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: { ...type.cardTitle },
  sectionIntro: {
    ...type.cardBody,
    marginTop: spacing.xs,
  },
  latestFocus: {
    ...type.bodySmall,
    color: colors.sageDeep,
    marginTop: spacing.md,
  },
  evidenceList: {
    marginTop: spacing.md,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  evidenceText: {
    flex: 1,
    minWidth: 0,
  },
  evidenceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ageLabel: {
    ...type.bodySmall,
    color: colors.sageDeep,
    marginTop: spacing.xs,
  },
  interpretation: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metricCell: {
    flexGrow: 1,
    minWidth: 124,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.sageMist,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  metricLabel: {
    ...type.caption,
    color: colors.textSecondary,
  },
  metricValue: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    marginTop: 2,
  },
  metricValueMuted: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sageMist,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  domainList: { marginTop: spacing.md },
  domainRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  domainText: { flex: 1, minWidth: 0 },
  domainTitle: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    flexShrink: 1,
  },
  metricLine: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  domainBody: { ...type.caption, color: colors.textSecondary, marginTop: spacing.xs },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  reportList: {
    marginTop: spacing.md,
  },
  reportRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  reportText: {
    flex: 1,
    minWidth: 0,
  },
  reportTitle: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  reportMeta: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reportChange: {
    ...type.bodySmall,
    color: colors.sageDeep,
    marginTop: spacing.xs,
  },
  historyList: {
    marginTop: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  historyText: {
    flex: 1,
    minWidth: 0,
  },
  historyDate: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  historyMeta: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  moreHistory: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  retestCard: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  retestCardInteractive: {
    padding: 0,
    overflow: 'hidden',
  },
  retestPressable: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg + spacing.xs,
  },
  retestText: { flex: 1, minWidth: 0 },
  retestTitle: { ...type.cardTitle },
  retestBody: { ...type.cardBody, color: colors.sageDeep, marginTop: spacing.xs },
  chevron: { ...type.h2, color: colors.textSecondary },
  pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
});
