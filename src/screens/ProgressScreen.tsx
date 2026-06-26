import * as React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  Card,
  Screen,
} from '../components/ui';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import {
  getLifeGoalDisplayText,
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
  getLatestDomainEvidence,
  getRetestDueSummary,
  getRetestHistory,
  type MovementProfileV2ProgressViewModel,
  type ProgressDataAuthority,
} from '../haleFlow';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../history';
import {
  latestMovementProfileV2ResultsViewModel,
  type MovementProfileV2Domain,
  type MovementProfileV2ResultsViewModel,
} from '../movementProfileV2/viewModel';
import {
  createCurrentVersionedScoreSnapshot,
  type CheckUpScore,
  type Domain,
  type VersionedCheckUpScoreSnapshot,
} from '../scoring';
import { BALANCE_FEET_TOGETHER_ID, HAMSTRING_REACH_ID, STS_STANDARD_ID } from '../exercises';
import type { LadderProgress } from '../training';
import { colors, fonts, imageOverlayControl, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';
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
  reports,
  completions,
  ladderProgressById,
  lifeGoal,
  today,
  onBeginFirstCheckUp,
  onBeginAdditionalCheckUp,
  onStartRetest,
  onViewLatest,
  onViewCheckUp,
  showMovementProfileV2Internal,
  onViewMovementProfileV2,
  progressDataAuthority,
  movementProfileV2Progress,
  onStartMovementProfileV2CheckUp,
  onContinueMovementProfileV2,
  onViewMovementProfileV2Profile,
  onViewMovementProfileV2Report,
  onViewCurrentPlan,
  historyOpen: controlledHistoryOpen,
  onHistoryOpenChange,
  onOpenSettings,
}: ProgressScreenProps) {
  const responsive = useResponsiveLayout();
  const [uncontrolledHistoryOpen, setUncontrolledHistoryOpen] = React.useState(false);
  const historyOpen = controlledHistoryOpen ?? uncontrolledHistoryOpen;

  React.useEffect(() => {
    return () => onHistoryOpenChange?.(false);
  }, [onHistoryOpenChange]);

  const setHistoryOpen = React.useCallback(
    (open: boolean) => {
      if (controlledHistoryOpen === undefined) {
        setUncontrolledHistoryOpen(open);
      }
      onHistoryOpenChange?.(open);
    },
    [controlledHistoryOpen, onHistoryOpenChange]
  );

  const visibleHistory = history;
  const visibleAssessments = assessments;
  const visibleActiveBlock = activeBlock;
  const visibleBlocks = blocks;
  const visibleReports = reports;
  const visibleCompletions = completions;
  const visibleLadderProgressById = ladderProgressById;

  const latest = getLatestCheckUpSummary(visibleHistory, visibleAssessments);
  const latestMovementProfileV2 = showMovementProfileV2Internal
    ? latestMovementProfileV2ResultsViewModel(visibleHistory)
    : null;
  const latestEvidence = getLatestDomainEvidence(visibleHistory, visibleAssessments);
  const domainCards = getDomainProgressCards(visibleHistory, visibleAssessments);
  const ladderCards = getLadderProgressCards(visibleLadderProgressById);
  const retestHistory = getRetestHistory(visibleHistory, visibleAssessments);
  const reportedBlockIds = new Set(visibleReports.map((report) => report.blockId));
  const completedPlanSummary = getBlockReportSummaries({
    blocks: visibleBlocks,
    reports: visibleReports,
    completions: visibleCompletions,
  }).find((summary) => reportedBlockIds.has(summary.blockId)) ?? null;
  const hasComparison = retestHistory.length > 1;
  const retest = getRetestDueSummary({ activeBlock: visibleActiveBlock, today, hasBaseline: !!latest, completions: visibleCompletions });
  const retestBody = retestLine({ activeBlock: visibleActiveBlock, today, fallback: retest.body, due: retest.due });
  const handleViewLatest = onViewLatest;
  const renderMovementProfileV2Progress =
    progressDataAuthority?.kind === 'movement_profile_v2' || progressDataAuthority?.kind === 'unavailable';

  if (!renderMovementProfileV2Progress && historyOpen) {
    return (
      <ProgressHistoryView
        history={retestHistory}
        onBack={() => setHistoryOpen(false)}
        onViewCheckUp={onViewCheckUp}
      />
    );
  }

  if (renderMovementProfileV2Progress) {
    return (
      <Screen contentStyle={styles.screenContent}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleGroup}>
              <HeaderLogo />
              <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>Progress</Text>
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

        <MovementProfileV2ProgressContent
          viewModel={movementProfileV2Progress ?? null}
          unavailable={progressDataAuthority?.kind === 'unavailable'}
          onStartCheckUp={onStartMovementProfileV2CheckUp ?? onBeginFirstCheckUp}
          onContinue={onContinueMovementProfileV2 ?? onBeginFirstCheckUp}
          onViewProfile={onViewMovementProfileV2Profile}
          onViewReport={onViewMovementProfileV2Report}
          onViewCurrentPlan={onViewCurrentPlan}
          ladderCards={ladderCards}
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleGroup}>
            <HeaderLogo />
            <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>Progress</Text>
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

      {!latest && !latestMovementProfileV2 ? (
        <ProgressEmptyState onBeginCheckUp={onBeginFirstCheckUp} />
      ) : (
        <>
          {latest ? (
            <ProgressHeroSection
              latest={latest}
              retestTitle={retest.title}
              retestBody={retestBody}
              lifeGoal={lifeGoal}
            />
          ) : null}

          {latest && retest.due ? (
            <RetestCard
              title={retest.title}
              body={retestBody}
              onPress={retest.ctaLabel ? onStartRetest : undefined}
            />
          ) : null}

          {latestMovementProfileV2 ? (
            <MovementProfileV2InternalCard
              viewModel={latestMovementProfileV2}
              onPress={onViewMovementProfileV2}
            />
          ) : null}

          {latest ? (
            hasComparison && domainCards.length > 0 ? (
              <ChangeSinceBaselineCard cards={domainCards} latest={latest} onViewResults={handleViewLatest} />
            ) : (
              <MovementProfileCard latest={latest} evidence={latestEvidence} onViewResults={handleViewLatest} />
            )
          ) : null}

          {ladderCards.length > 0 ? <TrainingProgressCard cards={ladderCards} /> : null}

          {latest ? (
            <ProgressRecordsCard
              retestBody={retestBody}
              showRetest={!retest.due}
              history={retestHistory}
              completedPlan={completedPlanSummary}
              onBeginCheckUp={onBeginAdditionalCheckUp}
              onOpenHistory={() => setHistoryOpen(true)}
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}

function ProgressEmptyState({ onBeginCheckUp }: { onBeginCheckUp: () => void }) {
  const responsive = useResponsiveLayout();
  return (
    <View style={styles.emptyProgressWrap}>
      <View style={[styles.emptyProgressCard, responsive.isCompactPhone && styles.compactCardPadding]}>
        <View style={styles.emptyProgressHeader}>
          <Text style={styles.emptyProgressKicker}>Set your starting point</Text>
          <View style={styles.emptyProgressMetaPill}>
            <Text style={styles.emptyProgressMetaText}>~10 min</Text>
          </View>
        </View>

        <Text style={styles.emptyProgressTitle}>Start with your first Movement Check-Up</Text>
        <Text style={styles.emptyProgressBody}>
          Hale guides you through simple movements and saves your first strength, balance, and mobility numbers. Future check-ups use the same movements so you can see what changed.
        </Text>

        <View style={[styles.emptyProgressSteps, responsive.isCompactPhone && styles.compactCardPadding]} accessibilityLabel="Progress preparation steps">
          <ProgressEmptyStep
            index="1"
            title="Do the first check-up"
            body="Hale talks you through each movement while the camera estimates your results."
            state="current"
          />
          <ProgressEmptyStep
            index="2"
            title="Get a 4-week plan"
            body="Your plan starts with the area that needs the most practice."
            state="upcoming"
          />
          <ProgressEmptyStep
            index="3"
            title="Repeat the check-up"
            body="After a few weeks, repeat it so Hale can compare the same movements."
            state="upcoming"
            last
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.emptyProgressButton,
            responsive.isCompactPhone && styles.compactCardPadding,
            pressed && styles.pressed,
          ]}
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
          Progress is based on repeat check-ups, not one-day changes. That keeps this page focused on meaningful patterns.
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

function MovementProfileV2ProgressContent({
  viewModel,
  unavailable,
  onStartCheckUp,
  onContinue,
  onViewProfile,
  onViewReport,
  onViewCurrentPlan,
  ladderCards,
}: {
  viewModel: MovementProfileV2ProgressViewModel | null;
  unavailable: boolean;
  onStartCheckUp: () => void;
  onContinue: () => void;
  onViewProfile?: (sourceCheckUpId: string) => void;
  onViewReport?: (reportId: string) => void;
  onViewCurrentPlan?: () => void;
  ladderCards: ReturnType<typeof getLadderProgressCards>;
}) {
  if (!viewModel || unavailable) {
    return (
      <MovementProfileV2RecoveryCard
        title="Movement Profile needs attention"
        body="Your saved Movement Profile data is still on this phone, but Hale cannot safely show it here yet."
        actionLabel="Continue"
        onPress={onContinue}
      />
    );
  }

  if (viewModel.status !== 'ready') {
    if (viewModel.status === 'no_profile') {
      return <ProgressEmptyState onBeginCheckUp={onStartCheckUp} />;
    }
    const primary = viewModel.actions[0];
    return (
      <MovementProfileV2RecoveryCard
        title={viewModel.recovery.title}
        body={viewModel.recovery.body}
        actionLabel={primary?.label}
        onPress={
          primary?.id === 'start_movement_checkup'
            ? onStartCheckUp
            : primary
              ? onContinue
              : undefined
        }
      />
    );
  }

  return (
    <>
      <MovementProfileV2HeroSection hero={viewModel.hero} />
      <MovementProfileV2ProfileCard
        viewModel={viewModel}
        onViewProfile={onViewProfile}
      />
      {viewModel.currentPlan ? (
        <MovementProfileV2CurrentPlanCard
          plan={viewModel.currentPlan}
          onViewCurrentPlan={onViewCurrentPlan}
        />
      ) : null}
      {ladderCards.length > 0 ? <TrainingProgressCard cards={ladderCards} /> : null}
      <MovementProfileV2OfficialHistoryCard
        history={viewModel.officialHistory}
        onViewProfile={onViewProfile}
      />
      {viewModel.reports.length > 0 ? (
        <MovementProfileV2ReportHistoryCard
          reports={viewModel.reports}
          onViewReport={onViewReport}
        />
      ) : null}
    </>
  );
}

function MovementProfileV2RecoveryCard({
  title,
  body,
  actionLabel,
  onPress,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  return (
    <Card style={styles.progressCard}>
      <View style={styles.profileHeader}>
        <View style={styles.sectionText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionIntro}>{body}</Text>
        </View>
      </View>
      {actionLabel && onPress ? (
        <ProgressActionRow
          title={actionLabel}
          body={
            actionLabel === 'Start Movement Check-Up'
              ? 'Opens camera setup for your Movement Check-Up.'
              : 'Opens the next safe continuation step.'
          }
          onPress={onPress}
          accessibilityLabel={`${actionLabel}. ${body}`}
        />
      ) : null}
    </Card>
  );
}

function MovementProfileV2HeroSection({ hero }: { hero: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['hero'] }) {
  const responsive = useResponsiveLayout();
  const compactHero = responsive.isCompactPhone;
  const heroMinHeightStyle = { minHeight: responsive.progressHeroHeight };
  const focus = hero.focusTitle;
  const heroFacts = [
    { label: 'Last check-up', value: compactHero ? compactHeroDate(hero.dateLabel) : hero.dateLabel },
    { label: 'Suggested focus', value: focus },
    { label: 'Profile', value: 'Saved Movement Profile', wide: true },
  ];

  return (
    <View style={styles.heroSection}>
      <ImageBackground
        source={PROGRESS_HERO_IMAGE}
        style={[styles.progressHero, heroMinHeightStyle]}
        imageStyle={[styles.progressHeroImage, compactHero && styles.progressHeroImageCompact]}
        resizeMode="cover"
      >
        <View style={styles.progressHeroScrim} />
        <View style={[styles.progressHeroContent, compactHero && styles.progressHeroContentCompact, heroMinHeightStyle]}>
          <View style={[styles.progressHeroCopy, compactHero && styles.progressHeroCopyCompact]}>
            <Text style={styles.progressHeroEyebrow}>{hero.title}</Text>
            <Text style={[styles.progressHeroTitle, compactHero && styles.progressHeroTitleCompact]}>{focus}</Text>
            <Text style={[styles.progressHeroBody, compactHero && styles.progressHeroBodyCompact]}>{hero.focusBody}</Text>
          </View>
          <View style={[styles.progressHeroFacts, compactHero && styles.progressHeroFactsCompact]}>
            {heroFacts.map((fact) => (
              <HeroFact
                key={fact.label}
                label={fact.label}
                value={fact.value}
                compact={compactHero}
                wide={fact.wide}
              />
            ))}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

function MovementProfileV2ProfileCard({
  viewModel,
  onViewProfile,
}: {
  viewModel: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>;
  onViewProfile?: (sourceCheckUpId: string) => void;
}) {
  return (
    <Card style={styles.progressCard}>
      <View style={styles.profileHeader}>
        <View style={styles.sectionText}>
          <Text style={styles.sectionTitle}>Latest Movement Profile</Text>
          <Text style={styles.sectionIntro}>Frozen from {viewModel.hero.dateLabel}. Hale shows saved raw results and saved reference labels only.</Text>
        </View>
      </View>
      <View style={styles.profileRows}>
        {viewModel.hero.domains.map((card, index) => (
          <MovementProfileV2ProgressRow key={card.domain} card={card} showDivider={index > 0} />
        ))}
      </View>
      <ProgressActionRow
        title="View Movement Profile"
        body="Opens the saved read-only Movement Profile."
        onPress={() => onViewProfile?.(viewModel.hero.profileId)}
        accessibilityLabel={`View Movement Profile. Opens saved read-only results from ${viewModel.hero.dateLabel}.`}
      />
    </Card>
  );
}

function MovementProfileV2ProgressRow({
  card,
  showDivider,
}: {
  card: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['hero']['domains'][number];
  showDivider: boolean;
}) {
  return (
    <View style={[styles.profileRow, showDivider && styles.rowDivider]}>
      <IconBadge domain={domainIconForMovementProfileV2(card.domain)} size={36} iconSize={22} />
      <View style={styles.profileRowText}>
        <Text style={styles.profileRowTitle} numberOfLines={1}>{card.title}</Text>
        <Text style={styles.profileRowMetric} numberOfLines={1}>{card.metric}</Text>
      </View>
      <View style={styles.profileStatusPill}>
        <Text style={styles.profileStatusText} numberOfLines={1}>{card.interpretation}</Text>
      </View>
    </View>
  );
}

function MovementProfileV2CurrentPlanCard({
  plan,
  onViewCurrentPlan,
}: {
  plan: NonNullable<Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['currentPlan']>;
  onViewCurrentPlan?: () => void;
}) {
  return (
    <Card style={styles.progressCard}>
      <View style={styles.profileHeader}>
        <View style={styles.sectionText}>
          <Text style={styles.sectionTitle}>Current plan</Text>
          <Text style={styles.sectionIntro}>{plan.sourceNote}</Text>
        </View>
      </View>
      <View style={styles.planSummaryRows}>
        <PlanSummaryPill label="Focus" value={plan.focusTitle} />
        <PlanSummaryPill label="Week" value={plan.weekLabel} />
        <PlanSummaryPill label="Sessions" value={plan.sessionsLabel} wide />
      </View>
      <Text style={styles.sectionIntro}>{plan.scheduleLabel}</Text>
      <ProgressActionRow
        title="View current plan"
        body="Opens your saved plan without starting a session."
        onPress={onViewCurrentPlan}
        accessibilityLabel={`View current plan. ${plan.focusTitle}. ${plan.sessionsLabel}.`}
      />
    </Card>
  );
}

function PlanSummaryPill({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.planSummaryPill, wide && styles.planSummaryPillWide]}>
      <Text style={styles.progressHeroFactLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.progressHeroFactValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function MovementProfileV2OfficialHistoryCard({
  history,
  onViewProfile,
}: {
  history: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['officialHistory'];
  onViewProfile?: (sourceCheckUpId: string) => void;
}) {
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>Movement Profile history</Text>
      <Text style={styles.sectionIntro}>Saved official Check-Ups, newest first.</Text>
      <View style={styles.historyList}>
        {history.map((entry, index) => (
          <MovementProfileV2HistoryRow
            key={entry.id}
            entry={entry}
            latest={index === 0}
            showDivider={index > 0}
            onPress={() => onViewProfile?.(entry.id)}
          />
        ))}
      </View>
    </Card>
  );
}

function MovementProfileV2HistoryRow({
  entry,
  latest,
  showDivider,
  onPress,
}: {
  entry: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['officialHistory'][number];
  latest: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.historyRow, showDivider && styles.rowDivider, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${entry.dateLabel}. ${entry.sourceLabel}. ${entry.focusTitle}. Opens saved read-only Movement Profile.`}
    >
      <View style={styles.historyRowText}>
        <View style={styles.historyTitleRow}>
          <Text style={styles.historyRowTitle} numberOfLines={1}>{entry.dateLabel}</Text>
          {latest ? (
            <View style={styles.historyLatestPill}>
              <Text style={styles.historyLatestText}>Latest</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.historyRowMeta} numberOfLines={2}>
          {entry.sourceLabel} · {entry.focusTitle}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function MovementProfileV2ReportHistoryCard({
  reports,
  onViewReport,
}: {
  reports: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['reports'];
  onViewReport?: (reportId: string) => void;
}) {
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>Block reports</Text>
      <Text style={styles.sectionIntro}>Saved 4-week block reports from completed follow-up Check-Ups.</Text>
      <View style={styles.historyList}>
        {reports.map((entry, index) => (
          <Pressable
            key={entry.action.targetId ?? entry.id}
            style={({ pressed }) => [styles.historyRow, index > 0 && styles.rowDivider, pressed && styles.pressed]}
            onPress={() => entry.action.targetId && onViewReport?.(entry.action.targetId)}
            accessibilityRole="button"
            accessibilityLabel={`4-week block complete. ${entry.completedAtLabel}. ${entry.sessionsLabel}. Opens saved read-only block report.`}
          >
            <View style={styles.historyRowText}>
              <Text style={styles.historyRowTitle} numberOfLines={1}>4-week block complete</Text>
              <Text style={styles.historyRowMeta} numberOfLines={2}>
                {entry.completedAtLabel} · {entry.priorFocusTitle} to {entry.currentFocusTitle} · {entry.sessionsLabel}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function ProgressActionRow({
  title,
  body,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  body: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.latestResultsAction, !onPress && styles.disabledAction, pressed && onPress && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      accessibilityLabel={accessibilityLabel ?? `${title}. ${body}`}
      disabled={!onPress}
    >
      <View style={styles.latestResultsIconWell}>
        <ProgressPictogram name="calendar" size={20} color={colors.accent} />
      </View>
      <View style={styles.latestResultsCopy}>
        <Text style={styles.latestResultsTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.latestResultsBody} numberOfLines={2}>{body}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
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
  onViewCheckUp: (checkUpId: string) => void;
  showMovementProfileV2Internal?: boolean;
  onViewMovementProfileV2?: () => void;
  progressDataAuthority?: ProgressDataAuthority;
  movementProfileV2Progress?: MovementProfileV2ProgressViewModel | null;
  onStartMovementProfileV2CheckUp?: () => void;
  onContinueMovementProfileV2?: () => void;
  onViewMovementProfileV2Profile?: (sourceCheckUpId: string) => void;
  onViewMovementProfileV2Report?: (reportId: string) => void;
  onViewCurrentPlan?: () => void;
  historyOpen?: boolean;
  onHistoryOpenChange?: (open: boolean) => void;
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
    previousCheckUp: baseline.record.checkUp,
    latestCheckUp: latest.record.checkUp,
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
    focusDomain: block.focusDomain ?? undefined,
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
    focusDomain: block.focusDomain ?? undefined,
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
  lifeGoal,
}: {
  latest: NonNullable<ReturnType<typeof getLatestCheckUpSummary>>;
  retestTitle: string;
  retestBody: string;
  lifeGoal?: LifeGoal | null;
}) {
  const responsive = useResponsiveLayout();
  const compactHero = responsive.isCompactPhone;
  const focus = cleanFocusTitle(latest.focusTitle);
  const heroBody = heroFocusBody(focus);
  const goalText = lifeGoal ? getLifeGoalDisplayText(lifeGoal) : 'Not set yet';
  const heroMinHeightStyle = { minHeight: responsive.progressHeroHeight };
  const heroFacts = [
    { label: 'Last check-up', value: compactHero ? compactHeroDate(latest.dateLabel) : latest.dateLabel },
    { label: 'Next check-up', value: compactRetestValue(retestTitle, retestBody) },
    { label: 'Everyday goal', value: goalText, wide: true, valueLines: 2 },
  ];

  return (
    <View style={styles.heroSection}>
      <ImageBackground
        source={PROGRESS_HERO_IMAGE}
        style={[styles.progressHero, heroMinHeightStyle]}
        imageStyle={[styles.progressHeroImage, compactHero && styles.progressHeroImageCompact]}
        resizeMode="cover"
      >
        <View style={styles.progressHeroScrim} />
        <View style={[styles.progressHeroContent, compactHero && styles.progressHeroContentCompact, heroMinHeightStyle]}>
          <View style={[styles.progressHeroCopy, compactHero && styles.progressHeroCopyCompact]}>
            <Text style={styles.progressHeroEyebrow}>Main focus right now</Text>
            <Text style={[styles.progressHeroTitle, compactHero && styles.progressHeroTitleCompact]}>{focus}</Text>
            <Text style={[styles.progressHeroBody, compactHero && styles.progressHeroBodyCompact]}>{heroBody}</Text>
          </View>
          <View style={[styles.progressHeroFacts, compactHero && styles.progressHeroFactsCompact]}>
            {heroFacts.map((fact) => (
              <HeroFact
                key={fact.label}
                label={fact.label}
                value={fact.value}
                compact={compactHero}
                wide={fact.wide}
                valueLines={fact.valueLines}
              />
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
  valueLines = 1,
}: {
  label: string;
  value: string;
  compact?: boolean;
  wide?: boolean;
  valueLines?: number;
}) {
  return (
    <View style={[styles.progressHeroFact, compact && styles.progressHeroFactCompact, wide && styles.progressHeroFactWide]}>
      <Text style={styles.progressHeroFactLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.progressHeroFactValue} numberOfLines={valueLines}>{value}</Text>
    </View>
  );
}

function compactHeroDate(label: string): string {
  const compact = label.replace(/\s*,?\s*\d{4}$/, '').trim();
  return compact.length > 0 ? compact : label;
}

type MovementProfileBand = NonNullable<ReturnType<typeof getLatestCheckUpSummary>>['bands'][Domain];
type LatestDomainEvidence = ReturnType<typeof getLatestDomainEvidence>[number];

function MovementProfileCard({
  latest,
  evidence,
  onViewResults,
}: {
  latest: NonNullable<ReturnType<typeof getLatestCheckUpSummary>>;
  evidence: ReturnType<typeof getLatestDomainEvidence>;
  onViewResults: () => void;
}) {
  const evidenceByDomain = new Map(evidence.map((card) => [card.domain, card]));
  const rows: readonly { domain: Domain; title: string; band: MovementProfileBand; metric: string }[] = [
    {
      domain: 'strength',
      title: 'Strength / Power',
      band: latest.bands.strength,
      metric: latestResultLine(evidenceByDomain.get('strength')),
    },
    {
      domain: 'balance',
      title: 'Balance',
      band: latest.bands.balance,
      metric: latestResultLine(evidenceByDomain.get('balance')),
    },
    {
      domain: 'mobility',
      title: 'Mobility',
      band: latest.bands.mobility,
      metric: latestResultLine(evidenceByDomain.get('mobility')),
    },
  ];

  return (
    <Card style={styles.progressCard}>
      <View style={styles.profileHeader}>
        <View style={styles.sectionText}>
          <Text style={styles.sectionTitle}>Latest check-up</Text>
          <Text style={styles.sectionIntro}>Here is what Hale measured most recently.</Text>
        </View>
      </View>

      <View style={styles.profileRows}>
        {rows.map((row, index) => (
          <MovementProfileRow
            key={row.domain}
            domain={row.domain}
            title={row.title}
            metric={row.metric}
            band={row.band}
            showDivider={index > 0}
          />
        ))}
      </View>

      <LatestCheckUpActionRow
        latest={latest}
        title="See full results"
        body="Tap here to see every movement from this check-up."
        onPress={onViewResults}
      />
    </Card>
  );
}

function MovementProfileV2InternalCard({
  viewModel,
  onPress,
}: {
  viewModel: MovementProfileV2ResultsViewModel;
  onPress?: () => void;
}) {
  return (
    <Card style={styles.progressCard}>
      <View style={styles.profileHeader}>
        <View style={styles.sectionText}>
          <Text style={styles.sectionTitle}>Latest Movement Profile</Text>
          <Text style={styles.sectionIntro}>
            Frozen from {viewModel.dateLabel}. This internal V2 card does not compare against other check-ups.
          </Text>
        </View>
      </View>

      <View style={styles.profileRows}>
        {viewModel.domainCards.map((card, index) => (
          <MovementProfileV2InternalRow key={card.domain} card={card} showDivider={index > 0} />
        ))}
      </View>

      {onPress ? (
        <Pressable
          style={({ pressed }) => [styles.latestResultsAction, pressed && styles.pressed]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Open internal Movement Profile V2 results from ${viewModel.dateLabel}.`}
        >
          <View style={styles.latestResultsIconWell}>
            <ProgressPictogram name="calendar" size={20} color={colors.accent} />
          </View>
          <View style={styles.latestResultsCopy}>
            <Text style={styles.latestResultsTitle} numberOfLines={1}>Review internal V2 profile</Text>
            <Text style={styles.latestResultsBody} numberOfLines={2}>{viewModel.focusTitle}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function MovementProfileV2InternalRow({
  card,
  showDivider,
}: {
  card: MovementProfileV2ResultsViewModel['domainCards'][number];
  showDivider: boolean;
}) {
  return (
    <View style={[styles.profileRow, showDivider && styles.rowDivider]}>
      <IconBadge domain={domainIconForMovementProfileV2(card.domain)} size={36} iconSize={22} />
      <View style={styles.profileRowText}>
        <Text style={styles.profileRowTitle} numberOfLines={1}>{card.title}</Text>
        <Text style={styles.profileRowMetric} numberOfLines={1}>{card.metric}</Text>
      </View>
      <View style={styles.profileStatusPill}>
        <Text style={styles.profileStatusText} numberOfLines={1}>{card.status}</Text>
      </View>
    </View>
  );
}

function domainIconForMovementProfileV2(domain: MovementProfileV2Domain): Domain {
  if (domain === 'strength_power') return 'strength';
  return domain;
}

function MovementProfileRow({
  domain,
  title,
  metric,
  band,
  showDivider,
}: {
  domain: Domain;
  title: string;
  metric: string;
  band: MovementProfileBand;
  showDivider: boolean;
}) {
  return (
    <View style={[styles.profileRow, showDivider && styles.rowDivider]}>
      <IconBadge domain={domain} size={36} iconSize={22} />
      <View style={styles.profileRowText}>
        <Text style={styles.profileRowTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.profileRowMetric} numberOfLines={1}>{metric}</Text>
      </View>
      <View style={[styles.profileStatusPill, band === 'pending' && styles.profileStatusPillMuted]}>
        <Text style={[styles.profileStatusText, band === 'pending' && styles.profileStatusTextMuted]} numberOfLines={1}>
          {bandLabel(band)}
        </Text>
      </View>
    </View>
  );
}

function latestResultLine(card?: LatestDomainEvidence): string {
  const metric = card?.metrics.find((item) => item.measured);
  if (!metric) return 'Not checked this time';
  return `${friendlyMetricLabel(metric.label)}: ${metric.display}`;
}

function friendlyMetricLabel(label: string): string {
  if (label === 'Chair stands in 30s') return 'Chair stands';
  if (label === 'Rise velocity') return 'Standing speed';
  if (label === 'Up-and-go time') return 'Up-and-go time';
  if (label === 'One-leg balance') return 'One-leg balance';
  if (label === 'Shoulder reach') return 'Shoulder reach';
  if (label === 'Forward reach to floor') return 'Forward reach';
  return label;
}

function LatestCheckUpActionRow({
  latest,
  title,
  body,
  onPress,
}: {
  latest: NonNullable<ReturnType<typeof getLatestCheckUpSummary>>;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.latestResultsAction, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body} Latest check-up was ${latest.dateLabel}. Camera estimated strength, balance, and mobility.`}
    >
      <View style={styles.latestResultsIconWell}>
        <ProgressPictogram name="calendar" size={20} color={colors.accent} />
      </View>
      <View style={styles.latestResultsCopy}>
        <Text style={styles.latestResultsTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.latestResultsBody} numberOfLines={2}>{body}</Text>
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
      <Text style={styles.sectionTitle}>What you are practicing now</Text>
      <Text style={styles.sectionIntro}>Hale can make these movements easier or harder based on how your sessions go.</Text>
      <View style={styles.levelRows}>
        {visible.map((card, index) => (
          <LadderProgressRow key={card.ladderId} card={card} showDivider={index > 0} />
        ))}
      </View>
      {cards.length > visible.length ? (
        <Text style={styles.moreHistory}>{cards.length - visible.length} more movement groups may appear in future sessions.</Text>
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
  latest,
  onViewResults,
}: {
  cards: ReturnType<typeof getDomainProgressCards>;
  latest: NonNullable<ReturnType<typeof getLatestCheckUpSummary>>;
  onViewResults: () => void;
}) {
  const allRowsSimilar = cards.length > 0 && cards.every((card) => card.trend === 'similar');
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>Since your first check-up</Text>
      <Text style={styles.sectionIntro}>
        {allRowsSimilar
          ? 'Your latest results are very close to your first check-up. That is normal. Hale looks for patterns over repeat check-ups.'
          : 'Hale compares these numbers with your first check-up and looks for patterns over repeat check-ups.'}
      </Text>
      <View style={styles.changeRows}>
        {cards.map((card, index) => (
          <ChangeRow key={card.domain} card={card} showDivider={index > 0} />
        ))}
      </View>
      <LatestCheckUpActionRow
        latest={latest}
        title="See latest check-up results"
        body="Tap here to see the full results from your latest check-up."
        onPress={onViewResults}
      />
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
  const trend = visibleTrendLabel(card.trend);
  return (
    <View style={[styles.changeRow, showDivider && styles.rowDivider]}>
      <IconBadge domain={card.domain} size={36} iconSize={22} />
      <View style={styles.changeRowText}>
        <Text style={styles.changeRowTitle} numberOfLines={1}>{card.title}</Text>
        <Text style={styles.changeRowMetric} numberOfLines={1}>{displayMetric(card.metric)}</Text>
      </View>
      {trend ? <InlineStatusPill label={trend} compact /> : null}
    </View>
  );
}

type ProgressRecordTile = {
  key: string;
  title: string;
  meta: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  separated?: boolean;
};

function ProgressRecordsCard({
  retestBody,
  showRetest,
  history,
  completedPlan,
  onBeginCheckUp,
  onOpenHistory,
}: {
  retestBody: string;
  showRetest: boolean;
  history: ReturnType<typeof getRetestHistory>;
  completedPlan: ReturnType<typeof getBlockReportSummaries>[number] | null;
  onBeginCheckUp: () => void;
  onOpenHistory: () => void;
}) {
  const nextCheckUp = showRetest ? recordNextCheckUp(retestBody) : null;
  const tiles: ProgressRecordTile[] = [];

  if (history.length > 1) {
    tiles.push({
      key: 'history',
      title: 'Check-up history',
      meta: `${history.length} check-ups saved.`,
      onPress: onOpenHistory,
      accessibilityLabel: `Check-up history. ${history.length} check-ups saved.`,
    });
  }

  if (completedPlan) {
    tiles.push({
      key: 'completed-plan',
      title: 'Last 4-week plan',
      meta: `${completedPlan.focus} · ${completedPlan.sessions}. ${completedPlan.mainChange}`,
      separated: tiles.length > 0,
    });
  }

  tiles.push({
    key: 'extra-checkup',
    title: 'Extra check-up',
    meta: 'Start this if you want to check one area before your next scheduled check-up.',
    onPress: onBeginCheckUp,
    accessibilityLabel: 'Extra check-up. Start this if you want to check one area before your next scheduled check-up.',
    separated: tiles.length > 0,
  });

  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>{nextCheckUp ? 'Your next check-up' : 'Your check-up records'}</Text>
      {nextCheckUp ? (
        <View style={styles.nextCheckUpPanel}>
          <IconBadge domain="calendar" size={38} iconSize={23} />
          <View style={styles.nextCheckUpCopy}>
            <Text style={styles.nextCheckUpTitle}>{nextCheckUp.title}</Text>
            <Text style={styles.nextCheckUpBody}>{nextCheckUp.body}</Text>
          </View>
        </View>
      ) : null}
      <View style={[styles.recordRows, nextCheckUp && styles.recordRowsAfterLead]}>
        {tiles.map(({ key, ...tile }, index) => (
          <RecordRow key={key} {...tile} showDivider={index > 0} />
        ))}
      </View>
    </Card>
  );
}

function recordNextCheckUp(body: string): { title: string; body: string } {
  const dayMatch = body.match(/\bopens in (\d+) (day|days)\b/i);
  if (dayMatch) {
    return {
      title: `Opens in ${dayMatch[1]} ${dayMatch[2]}.`,
      body: 'Hale will let you repeat the same check-up then, so you can compare results.',
    };
  }
  if (body.includes('Finish the planned sessions')) {
    return {
      title: 'Opens after this 4-week plan.',
      body: 'Finish the planned sessions, then Hale will open your next check-up.',
    };
  }
  if (body.includes('Start a 4-week plan')) {
    return {
      title: 'Not scheduled yet.',
      body: 'Start a 4-week plan to set the date for your next check-up.',
    };
  }
  return { title: 'Next check-up', body };
}

function ProgressHistoryView({
  history,
  onBack,
  onViewCheckUp,
}: {
  history: ReturnType<typeof getRetestHistory>;
  onBack: () => void;
  onViewCheckUp: (checkUpId: string) => void;
}) {
  return (
    <Screen contentStyle={styles.screenContent}>
      <BackArrowButton accessibilityLabel="Back to Progress" onPress={onBack} style={styles.historyBackButton} />
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <HeaderLogo />
          <Text style={styles.title}>Check-up history</Text>
        </View>
        <Text style={styles.subtitle}>
          These are your saved check-ups. Tap one to see the full results.
        </Text>
      </View>

      <Card style={styles.progressCard}>
        <View style={styles.historyList}>
          {history.map((entry, index) => (
            <HistoryRecordRow
              key={entry.id}
              entry={entry}
              latest={index === 0}
              showDivider={index > 0}
              onPress={() => onViewCheckUp(entry.id)}
            />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

function HistoryRecordRow({
  entry,
  latest,
  showDivider,
  onPress,
}: {
  entry: ReturnType<typeof getRetestHistory>[number];
  latest: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.historyRow, showDivider && styles.rowDivider, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${entry.dateLabel}. ${entry.summaryLine}.`}
    >
      <View style={styles.historyRowText}>
        <View style={styles.historyTitleRow}>
          <Text style={styles.historyRowTitle} numberOfLines={1}>{entry.dateLabel}</Text>
          {latest ? (
            <View style={styles.historyLatestPill}>
              <Text style={styles.historyLatestText}>Latest</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.historyRowMeta} numberOfLines={2}>{entry.summaryLine}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function RecordRow({
  title,
  meta,
  onPress,
  accessibilityLabel,
  showDivider,
  separated,
}: {
  title: string;
  meta: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  showDivider: boolean;
  separated?: boolean;
}) {
  const content = (
    <>
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
        style={({ pressed }) => [
          styles.recordRow,
          showDivider && styles.rowDivider,
          separated && styles.recordRowSeparated,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.recordRow, showDivider && styles.rowDivider, separated && styles.recordRowSeparated]}>{content}</View>;
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
  const responsive = useResponsiveLayout();
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
        style={({ pressed }) => [
          styles.retestPressable,
          responsive.isCompactPhone && styles.compactCardPadding,
          pressed && styles.pressed,
        ]}
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

function cleanFocusTitle(title: string): string {
  return title.replace(/^Suggested focus:\s*/, '').replace(/^Closely matched:\s*/, '');
}

function heroFocusBody(focus: string): string {
  if (focus === 'Strength / Power') return 'Your current sessions are helping you build leg power for chairs, stairs, and carrying.';
  if (focus === 'Balance') return 'Your current sessions are helping you feel steadier on stairs, curbs, turns, and uneven ground.';
  if (focus === 'Mobility') return 'Your current sessions are helping reaching, bending, and daily movement feel easier.';
  return 'Your current sessions are shaped by your latest check-up and kept simple.';
}

function compactRetestValue(title: string, body: string): string {
  if (title === 'Time for your next check-up') return 'Due now';
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

  if (body.includes('Start a 4-week plan')) return 'Not scheduled';
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

function visibleTrendLabel(trend: string): string | null {
  if (trend === 'higher' || trend === 'lower') return trendLabel(trend);
  return null;
}

function compactLadderStatus(status: string): string {
  if (status === 'Ready for next step') return 'Ready';
  if (status === 'Same level for now') return 'Same level';
  return status;
}

function bandLabel(band: MovementProfileBand): string {
  if (band === 'strong') return 'Strong area';
  if (band === 'building') return 'In progress';
  if (band === 'starting_point') return 'Focus area';
  return 'Not checked';
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
  historyBackButton: {
    marginBottom: 0,
  },
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
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    maxWidth: '88%',
  },
  progressHeroCopy: {
    gap: 12,
  },
  progressHeroCopyCompact: {
    gap: 10,
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
    fontSize: 46,
    lineHeight: 52,
    letterSpacing: 0,
  },
  progressHeroTitleCompact: {
    fontSize: 43,
    lineHeight: 48,
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
    paddingTop: 18,
  },
  progressHeroFactsCompact: {
    gap: 6,
    paddingTop: 18,
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
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.72,
  },
  progressHeroFactValue: {
    color: imageOverlayControl.text,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    marginTop: 2,
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
  planSummaryRows: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    marginBottom: 12,
  },
  planSummaryPill: {
    minWidth: 108,
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.input,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  planSummaryPillWide: {
    flexBasis: '100%',
  },
  profileRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
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
  profileRowMetric: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  latestResultsAction: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  disabledAction: {
    opacity: 0.58,
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
    minHeight: 72,
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
  recordRowsAfterLead: {
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  nextCheckUpPanel: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.bgElevated,
  },
  nextCheckUpCopy: {
    flex: 1,
    minWidth: 0,
  },
  nextCheckUpTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  nextCheckUpBody: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  recordRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  recordRowSeparated: {
    marginTop: spacing.xs,
    paddingTop: spacing.lg,
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
  historyList: {
    marginTop: -spacing.sm,
  },
  historyRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  historyRowText: {
    flex: 1,
    minWidth: 0,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyRowTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    flexShrink: 1,
  },
  historyRowMeta: {
    ...type.cardCaption,
    marginTop: 3,
  },
  historyLatestPill: {
    minHeight: 24,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
  },
  historyLatestText: {
    color: colors.sageDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
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
