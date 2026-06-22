import * as React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  Card,
  Screen,
} from '../components/ui';
import { HeaderLogo } from '../components/HeaderLogo';
import {
  getLifeGoalDisplayText,
  getLifeGoalTrainingRelevance,
  LOCAL_USER_ID,
  type LifeGoal,
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
  getLadderProgressCards,
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
import { BALANCE_FEET_TOGETHER_ID, HAMSTRING_REACH_ID, STS_STANDARD_ID } from '../exercises';
import type { LadderProgress } from '../training';
import { colors, fonts, imageOverlayControl, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
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

const PROGRESS_HERO_IMAGE = require('../../assets/images/progress-hero-botanical.png');

export function ProgressScreen({
  history,
  assessments,
  activeBlock,
  blocks,
  reports: blockReports,
  completions,
  ladderProgressById,
  lifeGoal,
  today,
  onBeginFirstCheckUp,
  onBeginAdditionalCheckUp,
  onStartRetest,
  onViewLatest,
  onViewReport,
  onOpenSettings,
}: ProgressScreenProps) {
  const visibleHistory = history;
  const visibleAssessments = assessments;
  const visibleActiveBlock = activeBlock;
  const visibleBlocks = blocks;
  const visibleReports = blockReports;
  const visibleCompletions = completions;
  const visibleLadderProgressById = ladderProgressById;

  const latest = getLatestCheckUpSummary(visibleHistory, visibleAssessments);
  const domainCards = getDomainProgressCards(visibleHistory, visibleAssessments);
  const ladderCards = getLadderProgressCards(visibleLadderProgressById);
  const blockSummaries = getBlockReportSummaries({
    blocks: visibleBlocks,
    reports: visibleReports,
    completions: visibleCompletions,
  });
  const retestHistory = getRetestHistory(visibleHistory, visibleAssessments);
  const hasComparison = retestHistory.length > 1;
  const retest = getRetestDueSummary({ activeBlock: visibleActiveBlock, today, hasBaseline: !!latest, completions: visibleCompletions });
  const retestBody = retestLine({ activeBlock: visibleActiveBlock, today, fallback: retest.body, due: retest.due });
  const handleViewLatest = onViewLatest;
  const handleViewReport = onViewReport;

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            <HeaderLogo />
            <Text style={styles.title}>Progress</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <SettingsIcon size={25} color={colors.accentDeep} strokeWidth={1.8} />
          </Pressable>
        </View>
      </View>

      {!latest ? (
        <ProgressEmptyState onBeginCheckUp={onBeginFirstCheckUp} />
      ) : (
        <>
          <ProgressHeroSection
            latest={latest}
            retestTitle={retest.title}
            retestBody={retestBody}
            activeBlock={visibleActiveBlock}
            completions={visibleCompletions}
            today={today}
          />

          <DailyLifeProgressCard lifeGoal={lifeGoal} activeBlock={visibleActiveBlock} latest={latest} />

          {retest.due ? (
            <RetestCard
              title={retest.title}
              body={retestBody}
              onPress={retest.ctaLabel ? onStartRetest : undefined}
            />
          ) : null}

          <MovementProfileCard latest={latest} onViewResults={handleViewLatest} />

          {domainCards.length > 0 ? <ChangeSinceBaselineCard cards={domainCards} hasComparison={hasComparison} /> : null}

          {ladderCards.length > 0 ? <TrainingProgressCard cards={ladderCards} /> : null}

          <ProgressRecordsCard
            summaries={blockSummaries}
            retestTitle={retest.title}
            retestBody={retestBody}
            showRetest={!retest.due}
            history={retestHistory}
            onBeginCheckUp={onBeginAdditionalCheckUp}
            onViewReport={handleViewReport}
          />
        </>
      )}
    </Screen>
  );
}

function ProgressEmptyState({ onBeginCheckUp }: { onBeginCheckUp: () => void }) {
  return (
    <View style={styles.emptyProgressWrap}>
      <View style={styles.emptyProgressCard}>
        <View style={styles.emptyProgressHeader}>
          <Text style={styles.emptyProgressKicker}>Before progress appears</Text>
          <View style={styles.emptyProgressMetaPill}>
            <Text style={styles.emptyProgressMetaText}>~10 min</Text>
          </View>
        </View>

        <Text style={styles.emptyProgressTitle}>Complete your first Movement Check-Up</Text>
        <Text style={styles.emptyProgressBody}>
          Hale uses your first home estimate to start a baseline for strength, balance, and mobility.
        </Text>

        <View style={styles.emptyProgressSteps} accessibilityLabel="Progress preparation steps">
          <ProgressEmptyStep
            index="1"
            title="Baseline"
            body="Capture your first strength, balance, and mobility estimate."
            state="current"
          />
          <ProgressEmptyStep
            index="2"
            title="Training block"
            body="Hale builds the first four-week block from that result."
            state="upcoming"
          />
          <ProgressEmptyStep
            index="3"
            title="Re-test"
            body="Your next check-up starts the first clear progress comparison."
            state="upcoming"
            last
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.emptyProgressButton, pressed && styles.pressed]}
          onPress={onBeginCheckUp}
          accessibilityRole="button"
          accessibilityLabel="Start Movement Check-Up"
        >
          <Text style={styles.emptyProgressButtonText}>Start Movement Check-Up</Text>
          <Text style={styles.emptyProgressButtonArrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.emptyProgressNote}>
        <Text style={styles.emptyProgressNoteText}>
          Progress appears after repeat check-ups, so small day-to-day variation does not become the story.
        </Text>
      </View>
    </View>
  );
}

function ProgressEmptyStep({
  index,
  title,
  body,
  state,
  last = false,
}: {
  index: string;
  title: string;
  body: string;
  state: 'current' | 'upcoming';
  last?: boolean;
}) {
  const active = state === 'current';
  return (
    <View style={[styles.emptyProgressStep, last && styles.emptyProgressStepLast]}>
      <View style={styles.emptyProgressStepMarkerCol}>
        <View style={[styles.emptyProgressStepMarker, active && styles.emptyProgressStepMarkerActive]}>
          <Text style={[styles.emptyProgressStepMarkerText, active && styles.emptyProgressStepMarkerTextActive]}>{index}</Text>
        </View>
        {!last ? <View style={[styles.emptyProgressStepLine, active && styles.emptyProgressStepLineActive]} /> : null}
      </View>
      <View style={styles.emptyProgressStepCopy}>
        <Text style={styles.emptyProgressStepTitle}>{title}</Text>
        <Text style={styles.emptyProgressStepBody}>{body}</Text>
      </View>
    </View>
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
  lifeGoal?: LifeGoal | null;
  today: string;
  onBeginFirstCheckUp: () => void;
  onBeginAdditionalCheckUp: () => void;
  onStartRetest: () => void;
  onViewLatest: () => void;
  onViewReport: (blockId: string) => void;
  onOpenSettings: () => void;
}

export interface ProgressDevMockData {
  history: StoredCheckUp[];
  assessments: MovementAssessment[];
  activeBlock: MovementBlock;
  blocks: MovementBlock[];
  reports: MovementBlockReport[];
  completions: TrainingSessionCompletion[];
  ladderProgressById: Record<string, LadderProgress>;
}

interface ScoredDevCheckUp {
  record: StoredCheckUp;
  assessment: MovementAssessment;
  score: CheckUpScore;
  snapshot: VersionedCheckUpScoreSnapshot;
}

export function buildProgressDevMockData(today: string): ProgressDevMockData {
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
    sourceCheckUpId: baseline.record.checkUp.startedAt,
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
    sourceCheckUpId: latest.record.checkUp.startedAt,
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
    ladderProgressById: devLadderProgress(base),
  };
}

function devLadderProgress(base: Date): Record<string, LadderProgress> {
  const setbackCountKey = ['fail', 'edSessionsAtLevel'].join('') as keyof LadderProgress;
  return {
    'sit-to-stand': {
      ladderId: 'sit-to-stand',
      currentLevelId: STS_STANDARD_ID,
      completedSessionsAtLevel: 2,
      [setbackCountKey]: 0,
      recentCompletionRates: [1, 1],
      recentRpe: [2, 3],
      recentPain: [false, false],
      readyToProgress: true,
      updatedAt: devIso(base, -2),
    },
    balance: {
      ladderId: 'balance',
      currentLevelId: BALANCE_FEET_TOGETHER_ID,
      completedSessionsAtLevel: 1,
      [setbackCountKey]: 0,
      recentCompletionRates: [0.85],
      recentRpe: [2],
      recentPain: [false],
      updatedAt: devIso(base, -5),
    },
    'mobility-flexibility': {
      ladderId: 'mobility-flexibility',
      currentLevelId: HAMSTRING_REACH_ID,
      completedSessionsAtLevel: 1,
      [setbackCountKey]: 0,
      recentCompletionRates: [0.9],
      recentRpe: [2],
      recentPain: [false],
      updatedAt: devIso(base, -8),
    },
  } as unknown as Record<string, LadderProgress>;
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
  sourceCheckUpId,
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
  sourceCheckUpId: string;
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
    sourceCheckUpId,
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

function ProgressHeroSection({
  latest,
  retestTitle,
  retestBody,
  activeBlock,
  completions,
  today,
}: {
  latest: NonNullable<ReturnType<typeof getLatestCheckUpSummary>>;
  retestTitle: string;
  retestBody: string;
  activeBlock?: MovementBlock | null;
  completions: readonly TrainingSessionCompletion[];
  today: string;
}) {
  const responsive = useResponsiveLayout();
  const compactHero = responsive.isCompactPhone;
  const focus = cleanFocusTitle(latest.focusTitle);
  const heroBody = heroFocusBody(focus);
  const sessionValue = activeBlock ? weeklySessionValue(activeBlock, completions, today) : 'Not started';
  const heroFacts = [
    { label: 'This week', value: sessionValue },
    { label: 'Next check-up', value: compactRetestValue(retestTitle, retestBody) },
    { label: 'Latest check-up', value: compactHero ? compactHeroDate(latest.dateLabel) : latest.dateLabel },
  ];

  return (
    <View style={styles.heroSection}>
      <ImageBackground
        source={PROGRESS_HERO_IMAGE}
        style={[styles.progressHero, { height: responsive.progressHeroHeight }]}
        imageStyle={[styles.progressHeroImage, compactHero && styles.progressHeroImageCompact]}
        resizeMode="cover"
      >
        <View style={styles.progressHeroScrim} />
        <View style={[styles.progressHeroContent, compactHero && styles.progressHeroContentCompact]}>
          <View style={[styles.progressHeroCopy, compactHero && styles.progressHeroCopyCompact]}>
            <Text style={styles.progressHeroEyebrow}>Progress at a glance</Text>
            <Text style={[styles.progressHeroTitle, compactHero && styles.progressHeroTitleCompact]}>{focus} is your current focus.</Text>
            <Text style={[styles.progressHeroBody, compactHero && styles.progressHeroBodyCompact]}>{heroBody}</Text>
          </View>
          <View style={[styles.progressHeroFacts, compactHero && styles.progressHeroFactsCompact]}>
            {heroFacts.map((fact, index) => (
              <HeroFact key={fact.label} label={fact.label} value={fact.value} compact={compactHero} wide={compactHero && index === 2} />
            ))}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

function HeroFact({
  label,
  value,
  compact,
  wide,
}: {
  label: string;
  value: string;
  compact?: boolean;
  wide?: boolean;
}) {
  return (
    <View style={[styles.progressHeroFact, compact && styles.progressHeroFactCompact, wide && styles.progressHeroFactWide]}>
      <Text style={styles.progressHeroFactLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.progressHeroFactValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function compactHeroDate(label: string): string {
  const compact = label.replace(/\s*,?\s*\d{4}$/, '').trim();
  return compact.length > 0 ? compact : label;
}

function DailyLifeProgressCard({
  lifeGoal,
  activeBlock,
  latest,
}: {
  lifeGoal?: LifeGoal | null;
  activeBlock?: MovementBlock | null;
  latest: NonNullable<ReturnType<typeof getLatestCheckUpSummary>>;
}) {
  const relevance = getLifeGoalTrainingRelevance(lifeGoal);
  const goalText = lifeGoal ? getLifeGoalDisplayText(lifeGoal) : null;
  const rows = dailyLifeRows({
    lifeGoal,
    activeBlock,
    latest,
    primaryDomains: relevance.primaryDomains,
  });

  return (
    <Card style={[styles.progressCard, styles.dailyLifeCard]}>
      <Text style={styles.dailyLifeEyebrow}>{goalText ? 'Your goal' : 'Daily independence'}</Text>
      <Text style={styles.dailyLifeTitle}>
        {goalText ? goalText : 'Stay capable for the everyday actions that matter.'}
      </Text>
      <Text style={styles.dailyLifeBody}>
        {goalText
          ? relevance.copy
          : 'Hale translates check-ups and training into the strength, balance, and mobility that help you move through your day with confidence.'}
      </Text>

      <View style={styles.dailyLifeRows}>
        {rows.map((row, index) => (
          <View key={row.domain} style={[styles.dailyLifeRow, index > 0 && styles.rowDivider]}>
            <IconBadge domain={movementDomainIcon(row.domain)} size={38} iconSize={23} />
            <View style={styles.dailyLifeRowText}>
              <Text style={styles.domainTitle}>{movementDomainTitle(row.domain)}</Text>
              <Text style={styles.metricLine}>{row.copy}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

type MovementProfileBand = NonNullable<ReturnType<typeof getLatestCheckUpSummary>>['bands'][Domain];

function MovementProfileCard({
  latest,
  onViewResults,
}: {
  latest: NonNullable<ReturnType<typeof getLatestCheckUpSummary>>;
  onViewResults: () => void;
}) {
  const rows: readonly { domain: Domain; title: string; band: MovementProfileBand }[] = [
    { domain: 'strength', title: 'Strength / Power', band: latest.bands.strength },
    { domain: 'balance', title: 'Balance', band: latest.bands.balance },
    { domain: 'mobility', title: 'Mobility', band: latest.bands.mobility },
  ];

  return (
    <Card style={styles.progressCard}>
      <View style={styles.profileHeader}>
        <View style={styles.sectionText}>
          <Text style={styles.sectionTitle}>Movement profile</Text>
          <Text style={styles.sectionIntro}>Latest check-up snapshot from {latest.dateLabel}.</Text>
        </View>
      </View>

      <View style={styles.profileRows}>
        {rows.map((row, index) => (
          <MovementProfileRow
            key={row.domain}
            domain={row.domain}
            title={row.title}
            band={row.band}
            showDivider={index > 0}
          />
        ))}
      </View>

      <LatestCheckUpActionRow latest={latest} onPress={onViewResults} />
    </Card>
  );
}

function MovementProfileRow({
  domain,
  title,
  band,
  showDivider,
}: {
  domain: Domain;
  title: string;
  band: MovementProfileBand;
  showDivider: boolean;
}) {
  return (
    <View style={[styles.profileRow, showDivider && styles.rowDivider]}>
      <IconBadge domain={domain} size={36} iconSize={22} />
      <View style={styles.profileRowText}>
        <Text style={styles.profileRowTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.profileRowMeta} numberOfLines={1}>{profileBandDescription(band)}</Text>
      </View>
      <View style={[styles.profileStatusPill, band === 'pending' && styles.profileStatusPillMuted]}>
        <Text style={[styles.profileStatusText, band === 'pending' && styles.profileStatusTextMuted]} numberOfLines={1}>
          {bandLabel(band)}
        </Text>
      </View>
    </View>
  );
}

function LatestCheckUpActionRow({
  latest,
  onPress,
}: {
  latest: NonNullable<ReturnType<typeof getLatestCheckUpSummary>>;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.latestResultsAction, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Latest check-up results from ${latest.dateLabel}. Camera estimated strength, balance, and mobility estimates.`}
    >
      <View style={styles.latestResultsIconWell}>
        <ProgressPictogram name="calendar" size={20} color={colors.accent} />
      </View>
      <View style={styles.latestResultsCopy}>
        <Text style={styles.latestResultsTitle} numberOfLines={1}>Latest check-up results</Text>
        <Text style={styles.latestResultsBody} numberOfLines={1}>View full check-up detail</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function TrainingProgressCard({
  cards,
}: {
  cards: ReturnType<typeof getLadderProgressCards>;
}) {
  const visible = cards.slice(0, 3);
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>Current levels</Text>
      <Text style={styles.sectionIntro}>Where Hale is meeting you in training right now.</Text>
      <View style={styles.levelRows}>
        {visible.map((card, index) => (
          <LadderProgressRow key={card.ladderId} card={card} showDivider={index > 0} />
        ))}
      </View>
      {cards.length > visible.length ? (
        <Text style={styles.moreHistory}>{cards.length - visible.length} more movement levels saved locally.</Text>
      ) : null}
    </Card>
  );
}

function LadderProgressRow({
  card,
  showDivider,
}: {
  card: ReturnType<typeof getLadderProgressCards>[number];
  showDivider: boolean;
}) {
  return (
    <View style={[styles.levelRow, showDivider && styles.rowDivider]}>
      <IconBadge domain={ladderDomain(card.ladderId)} size={36} iconSize={22} />
      <View style={styles.levelRowText}>
        <Text style={styles.levelRowTitle} numberOfLines={1}>{card.title}</Text>
        <Text style={styles.levelRowMeta} numberOfLines={1}>{card.levelName}</Text>
      </View>
      <InlineStatusPill label={compactLadderStatus(card.status)} compact />
    </View>
  );
}

function ChangeSinceBaselineCard({
  cards,
  hasComparison,
}: {
  cards: ReturnType<typeof getDomainProgressCards>;
  hasComparison: boolean;
}) {
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>Since last check-up</Text>
      {hasComparison ? (
        <View style={styles.changeRows}>
          {cards.map((card, index) => (
            <ChangeRow key={card.domain} card={card} showDivider={index > 0} />
          ))}
        </View>
      ) : (
        <View style={styles.baselineStateRow}>
          <IconBadge domain="calendar" size={38} iconSize={23} />
          <View style={styles.baselineStateText}>
            <Text style={styles.domainTitle}>Baseline saved</Text>
            <Text style={styles.metricLine}>Your first trend appears after the next re-test.</Text>
          </View>
        </View>
      )}
    </Card>
  );
}

function ChangeRow({
  card,
  showDivider,
}: {
  card: ReturnType<typeof getDomainProgressCards>[number];
  showDivider: boolean;
}) {
  return (
    <View style={[styles.changeRow, showDivider && styles.rowDivider]}>
      <IconBadge domain={card.domain} size={36} iconSize={22} />
      <View style={styles.changeRowText}>
        <Text style={styles.changeRowTitle} numberOfLines={1}>{card.title}</Text>
        <Text style={styles.changeRowMetric} numberOfLines={1}>{displayMetric(card.metric)}</Text>
      </View>
      <InlineStatusPill label={trendLabel(card.trend)} compact />
    </View>
  );
}

type ProgressRecordTile = {
  key: string;
  title: string;
  meta: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

function ProgressRecordsCard({
  summaries,
  retestTitle,
  retestBody,
  showRetest,
  history,
  onBeginCheckUp,
  onViewReport,
}: {
  summaries: ReturnType<typeof getBlockReportSummaries>;
  retestTitle: string;
  retestBody: string;
  showRetest: boolean;
  history: ReturnType<typeof getRetestHistory>;
  onBeginCheckUp: () => void;
  onViewReport: (blockId: string) => void;
}) {
  const latestReport = summaries[0];
  const tiles: ProgressRecordTile[] = [];

  if (latestReport) {
    tiles.push({
      key: 'report',
      title: 'Latest block report',
      meta: `${latestReport.focus} · ${latestReport.sessions}`,
      onPress: () => onViewReport(latestReport.blockId),
      accessibilityLabel: `${latestReport.focus} block report. ${latestReport.sessions}.`,
    });
  }

  tiles.push({
    key: 'extra-checkup',
    title: 'Start another check-up',
    meta: 'Choose a quick re-check or a full extra check-up saved separately.',
    onPress: onBeginCheckUp,
    accessibilityLabel: 'Start another Movement Check-Up. Choose a quick re-check or a full extra check-up.',
  });

  if (showRetest) {
    tiles.push({
      key: 'retest',
      title: retestTitle,
      meta: retestBody,
    });
  }

  if (history.length > 1) {
    tiles.push({
      key: 'history',
      title: 'Check-up history',
      meta: `${history.length} official check-ups saved locally`,
    });
  }

  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>Records</Text>
      <View style={styles.recordRows}>
        {tiles.map(({ key, ...tile }, index) => (
          <RecordRow key={key} {...tile} showDivider={index > 0} />
        ))}
      </View>
    </Card>
  );
}

function RecordRow({
  title,
  meta,
  onPress,
  accessibilityLabel,
  showDivider,
}: {
  title: string;
  meta: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  showDivider: boolean;
}) {
  const content = (
    <>
      <IconBadge domain="calendar" size={36} iconSize={22} />
      <View style={styles.recordRowText}>
        <Text style={styles.recordRowTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.recordRowMeta} numberOfLines={2}>{meta}</Text>
      </View>
      {onPress ? <Text style={styles.chevron}>›</Text> : <View style={styles.recordChevronSpacer} />}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [styles.recordRow, showDivider && styles.rowDivider, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.recordRow, showDivider && styles.rowDivider]}>{content}</View>;
}

function InlineStatusPill({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <View style={[styles.inlineStatusPill, compact && styles.inlineStatusPillCompact]}>
      <Text style={styles.inlineStatusText} numberOfLines={1}>{label}</Text>
    </View>
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
      <View style={styles.retestIconWell}>
        <ProgressPictogram name="calendar" size={24} color={colors.accent} />
      </View>
      <View style={styles.retestText}>
        <Text style={styles.retestTitle}>{title}</Text>
        <Text style={styles.retestBody}>{body}</Text>
      </View>
      {onPress ? (
        <View style={styles.retestCtaPill}>
          <Text style={styles.retestCtaText}>Start</Text>
        </View>
      ) : null}
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

function dailyLifeRows({
  lifeGoal,
  activeBlock,
  latest,
  primaryDomains,
}: {
  lifeGoal?: LifeGoal | null;
  activeBlock?: MovementBlock | null;
  latest: NonNullable<ReturnType<typeof getLatestCheckUpSummary>>;
  primaryDomains: readonly MovementDomain[];
}): { domain: MovementDomain; copy: string }[] {
  const focus = activeBlock?.focusDomain ?? focusMovementDomain(latest.focusTitle);
  const domains = uniqueDomains([
    focus,
    ...primaryDomains,
    'strength_power',
    'balance',
    'mobility',
  ]).slice(0, 3);
  return domains.map((domain) => ({
    domain,
    copy: dailyLifeDomainCopy(domain, lifeGoal),
  }));
}

function uniqueDomains(domains: readonly (MovementDomain | null)[]): MovementDomain[] {
  const out: MovementDomain[] = [];
  for (const domain of domains) {
    if (!domain || out.includes(domain)) continue;
    out.push(domain);
  }
  return out;
}

function focusMovementDomain(title: string): MovementDomain | null {
  if (title.includes('Strength')) return 'strength_power';
  if (title.includes('Balance')) return 'balance';
  if (title.includes('Mobility')) return 'mobility';
  return null;
}

function movementDomainIcon(domain: MovementDomain): Domain {
  return domain === 'strength_power' ? 'strength' : domain;
}

function movementDomainTitle(domain: MovementDomain): string {
  if (domain === 'strength_power') return 'Strength / Power';
  if (domain === 'balance') return 'Balance';
  return 'Mobility';
}

function dailyLifeDomainCopy(domain: MovementDomain, lifeGoal?: LifeGoal | null): string {
  const category = lifeGoal?.category;
  if (domain === 'strength_power') {
    if (category === 'stairs') return 'Supports standing from chairs and climbing steps with less effort.';
    if (category === 'travel') return 'Helps with long days out, luggage, transfers, and getting up after sitting.';
    if (category === 'grandchildren') return 'Supports getting down low, standing back up, and keeping pace.';
    if (category === 'gardening_hobbies') return 'Helps with lifting, carrying, and repeated sit-to-stand moments.';
    if (category === 'floor_confidence') return 'Builds the leg power used when getting up from lower positions.';
    if (category === 'carrying_loads') return 'Supports groceries, bags, and household carrying without feeling as taxed.';
    return 'Supports chair rises, stairs, carrying, and the force everyday movement asks for.';
  }
  if (domain === 'balance') {
    if (category === 'stairs') return 'Supports steadier footing on stairs, curbs, and turns.';
    if (category === 'travel') return 'Helps with uneven paths, busy places, curbs, and moving while distracted.';
    if (category === 'walking_hiking_sport') return 'Supports confident footing on walks, paths, and changing surfaces.';
    if (category === 'independence') return 'Helps you move through turns, steps, and busy spaces with more confidence.';
    return 'Supports steadier turns, curbs, uneven ground, and moving with confidence.';
  }
  if (category === 'gardening_hobbies') return 'Supports reaching, bending, and moving comfortably through hobbies.';
  if (category === 'travel') return 'Helps with comfortable walking, sitting, reaching, and long days away from home.';
  if (category === 'grandchildren') return 'Supports reaching, bending, floor-level play, and easier transitions.';
  if (category === 'floor_confidence') return 'Helps hips, trunk, and shoulders move more comfortably near the floor.';
  return 'Supports reaching, bending, getting dressed, and moving comfortably day to day.';
}

function cleanFocusTitle(title: string): string {
  return title.replace(/^Suggested focus:\s*/, '').replace(/^Closely matched:\s*/, '');
}

function heroFocusBody(focus: string): string {
  if (focus === 'Strength / Power') return 'Build everyday force for chairs, stairs, and carrying with steady weekly practice.';
  if (focus === 'Balance') return 'Keep building steadier movement through short, repeatable sessions this week.';
  if (focus === 'Mobility') return 'Use calm range work to make everyday reaching, bending, and moving feel easier.';
  return 'Keep your next sessions simple, consistent, and shaped by your latest check-up.';
}

function weeklySessionValue(
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[],
  today: string
): string {
  const completed = creditedTemplateCountThisWeek(block, completions, today);
  const target = Math.max(1, block.sessionsPerWeekTarget);
  if (completed > target) return `${completed} this week`;
  return `${completed} of ${target}`;
}

function creditedTemplateCountThisWeek(
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[],
  today: string
): number {
  const week = currentWeekNumber(block, today);
  const templates = new Set<string>();
  for (const completion of completions) {
    if (
      completion.blockId !== block.id ||
      completion.mainPlanCredit !== true ||
      completion.focusStimulusEvidence?.mainPlanCredit !== true ||
      !completion.templateId
    ) {
      continue;
    }
    if (currentWeekNumber(block, completion.completedAt) !== week) continue;
    templates.add(completion.templateId);
  }
  return templates.size;
}

function currentWeekNumber(block: MovementBlock, value: string): number {
  const start = Date.parse(block.startDate);
  const date = Date.parse(value);
  if (!Number.isFinite(start) || !Number.isFinite(date)) return 1;
  return Math.max(1, Math.min(4, Math.floor((date - start) / (7 * 24 * 60 * 60 * 1000)) + 1));
}

function compactRetestValue(title: string, body: string): string {
  if (title === "It's time to re-test") return 'Due now';
  const [, relative] = body.split(' · ');
  if (relative) return relative;

  const dayMatch = body.match(/\bin (\d+) (day|days)\b/i);
  if (dayMatch) {
    const days = Number(dayMatch[1]);
    if (days === 1) return 'Tomorrow';
    if (days >= 14) {
      const weeks = Math.ceil(days / 7);
      return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    }
    return `In ${days} days`;
  }

  if (body.includes('Create a 4-week block')) return 'Not scheduled';
  return body;
}

function ladderDomain(ladderId: string): Domain {
  if (ladderId === 'balance') return 'balance';
  if (ladderId === 'mobility-flexibility') return 'mobility';
  return 'strength';
}

function displayMetric(metric: string): string {
  return metric.replace(/ -> /g, ' → ');
}

function trendLabel(trend: string): string {
  if (trend === 'higher') return 'Higher';
  if (trend === 'similar') return 'Similar';
  if (trend === 'lower') return 'Lower';
  return 'Starting';
}

function compactLadderStatus(status: string): string {
  if (status === 'Ready for next step') return 'Ready';
  return status;
}

function bandLabel(band: MovementProfileBand): string {
  if (band === 'strong') return 'Strong';
  if (band === 'building') return 'Building';
  if (band === 'starting_point') return 'Starting point';
  return 'Pending';
}

function profileBandDescription(band: MovementProfileBand): string {
  if (band === 'strong') return 'A relative strength in your latest check-up.';
  if (band === 'building') return 'Improving this area should support daily action.';
  if (band === 'starting_point') return 'A useful focus area for this training block.';
  return 'Re-test to refresh this estimate.';
}

function retestLine({
  fallback,
}: {
  activeBlock?: MovementBlock | null;
  today: string;
  fallback: string;
  due: boolean;
}): string {
  return fallback;
}

const styles = StyleSheet.create({
  screenContent: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...type.pageTitle, flexShrink: 1 },
  subtitle: { ...type.pageSubtitle, maxWidth: 360 },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  emptyProgressWrap: {
    gap: spacing.md,
  },
  emptyProgressCard: {
    overflow: 'hidden',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 18px 40px rgba(17,20,18,0.045)',
  },
  emptyProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  emptyProgressKicker: {
    ...type.label,
    color: colors.accentDeep,
    flex: 1,
    minWidth: 0,
  },
  emptyProgressMetaPill: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  emptyProgressMetaText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  emptyProgressTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifMedium,
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: 0,
    marginTop: 22,
  },
  emptyProgressBody: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 25,
    letterSpacing: 0,
    marginTop: 18,
  },
  emptyProgressSteps: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  emptyProgressStep: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 72,
  },
  emptyProgressStepLast: {
    minHeight: 44,
  },
  emptyProgressStepMarkerCol: {
    width: 28,
    alignItems: 'center',
  },
  emptyProgressStepMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  emptyProgressStepMarkerActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  emptyProgressStepMarkerText: {
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
  emptyProgressStepMarkerTextActive: {
    color: colors.onAccent,
  },
  emptyProgressStepLine: {
    flex: 1,
    width: StyleSheet.hairlineWidth,
    marginVertical: 7,
    backgroundColor: colors.borderHairline,
  },
  emptyProgressStepLineActive: {
    backgroundColor: colors.accentBorder,
  },
  emptyProgressStepCopy: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 18,
  },
  emptyProgressStepTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  emptyProgressStepBody: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
    marginTop: 3,
  },
  emptyProgressButton: {
    minHeight: 58,
    marginTop: 24,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
  },
  emptyProgressButtonText: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
    textAlign: 'center',
  },
  emptyProgressButtonArrow: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 22,
    lineHeight: 23,
    letterSpacing: 0,
    marginTop: -1,
  },
  emptyProgressNote: {
    paddingHorizontal: 14,
  },
  emptyProgressNoteText: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
  },
  heroSection: {
    gap: 0,
  },
  progressHero: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.accent,
    ...shadow.card,
  },
  progressHeroImage: {
    borderRadius: 20,
  },
  progressHeroImageCompact: {
    width: '108%',
    left: '-8%',
  },
  progressHeroScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(17,20,18,0.22)',
  },
  progressHeroContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 30,
    maxWidth: '84%',
  },
  progressHeroContentCompact: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    maxWidth: '88%',
  },
  progressHeroCopy: {
    gap: 14,
  },
  progressHeroCopyCompact: {
    gap: 12,
  },
  progressHeroEyebrow: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    opacity: 0.9,
  },
  progressHeroTitle: {
    color: colors.onAccent,
    fontFamily: fonts.serifMedium,
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: 0,
  },
  progressHeroTitleCompact: {
    fontSize: 27,
    lineHeight: 32,
  },
  progressHeroBody: {
    color: colors.onAccent,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    opacity: 0.94,
  },
  progressHeroBodyCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressHeroFacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 'auto',
  },
  progressHeroFactsCompact: {
    gap: 6,
  },
  progressHeroFact: {
    minWidth: 108,
    minHeight: 54,
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.input,
    backgroundColor: imageOverlayControl.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: imageOverlayControl.border,
  },
  progressHeroFactCompact: {
    minWidth: 98,
    minHeight: 50,
    flexBasis: '47%',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  progressHeroFactWide: {
    flexBasis: '100%',
    flexGrow: 0,
  },
  progressHeroFactLabel: {
    ...type.cardCaption,
    color: imageOverlayControl.text,
    opacity: 0.72,
  },
  progressHeroFactValue: {
    color: imageOverlayControl.text,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: 2,
  },
  dailyLifeCard: {
    gap: 0,
  },
  dailyLifeEyebrow: {
    ...type.cardCaption,
    color: colors.sageDeep,
    fontFamily: fonts.sansMedium,
    textTransform: 'uppercase',
  },
  dailyLifeTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifMedium,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0,
    marginTop: spacing.xs,
  },
  dailyLifeBody: {
    ...type.cardBody,
    marginTop: spacing.sm,
  },
  dailyLifeRows: {
    marginTop: 14,
  },
  dailyLifeRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  dailyLifeRowText: {
    flex: 1,
    minWidth: 0,
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  profileRows: {
    marginTop: 14,
  },
  profileRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  profileRowText: {
    flex: 1,
    minWidth: 0,
  },
  profileStatusPill: {
    minWidth: 86,
    maxWidth: 116,
    minHeight: 28,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.bgSurface,
  },
  profileStatusPillMuted: {
    backgroundColor: colors.bgElevated,
  },
  profileStatusText: {
    color: colors.sageDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    textAlign: 'center',
  },
  profileStatusTextMuted: {
    color: colors.textTertiary,
  },
  profileRowTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  profileRowMeta: {
    ...type.cardCaption,
    marginTop: 3,
  },
  latestResultsAction: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  latestResultsIconWell: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  latestResultsCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  latestResultsTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  latestResultsBody: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeRows: {
    marginTop: 14,
  },
  changeRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  changeRowText: {
    flex: 1,
    minWidth: 0,
  },
  changeRowTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  changeRowMetric: {
    ...type.cardCaption,
    marginTop: 3,
  },
  domainTitle: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    flexShrink: 1,
  },
  metricLine: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  baselineStateRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 14,
  },
  baselineStateText: {
    flex: 1,
    minWidth: 0,
  },
  inlineStatusPill: {
    maxWidth: 118,
    minHeight: 34,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 17,
    backgroundColor: colors.bgElevated,
  },
  inlineStatusText: {
    color: colors.sageDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: 'center',
  },
  inlineStatusPillCompact: {
    maxWidth: 88,
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  levelRows: {
    marginTop: 14,
  },
  levelRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  levelRowText: {
    flex: 1,
    minWidth: 0,
  },
  levelRowTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  levelRowMeta: {
    ...type.cardCaption,
    marginTop: 3,
  },
  recordRows: {
    marginTop: 14,
  },
  recordRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  recordRowText: {
    flex: 1,
    minWidth: 0,
  },
  recordRowTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  recordRowMeta: {
    ...type.cardCaption,
    marginTop: 3,
  },
  recordChevronSpacer: {
    width: 18,
  },
  moreHistory: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  retestCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  retestCardInteractive: {
    padding: 0,
    overflow: 'hidden',
  },
  retestPressable: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  retestIconWell: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  retestText: { flex: 1, minWidth: 0 },
  retestTitle: { ...type.cardTitle },
  retestBody: { ...type.cardBody, color: colors.sageDeep, marginTop: spacing.xs },
  retestCtaPill: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 17,
    backgroundColor: colors.accent,
  },
  retestCtaText: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  chevron: { ...type.h2, color: colors.textSecondary },
  pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
});
