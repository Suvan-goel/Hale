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
  type MovementBlock,
  type MovementBlockReport,
  type TrainingSessionCompletion,
} from '../adherence';
import {
  getLadderProgressCards,
  type MovementProfileV2ProgressViewModel,
  type ProgressDataAuthority,
} from '../haleFlow';
import { type MovementProfileV2Domain } from '../movementProfileV2/viewModel';
import { type Domain } from '../scoring';
import type { LadderProgress } from '../training';
import { colors, fonts, imageOverlayControl, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';
import { SettingsIcon } from '../navigation/icons';
import {
  buildProgressNextCheckUpCard,
  buildProgressPlanSummaryCard,
  progressPracticeStatusLabel,
  progressSummaryStatusLabel,
  type ProgressNextCheckUpCardCopy,
  type ProgressPlanSummaryCardCopy,
} from './progressProductPresentation';

const DOMAIN_LABEL: Record<Domain, string> = {
  strength: 'Strength / Power',
  balance: 'Balance',
  mobility: 'Mobility',
};

const PROGRESS_HERO_IMAGE = require('../../assets/images/progress-hero-botanical.png');

export function ProgressScreen({
  activeBlock,
  blocks,
  reports,
  completions,
  ladderProgressById,
  today,
  onBeginFirstCheckUp,
  onBeginAdditionalCheckUp,
  onStartRetest,
  progressDataAuthority,
  movementProfileV2Progress,
  onStartMovementProfileV2CheckUp,
  onViewMovementProfileV2Profile,
  onViewMovementProfileV2Report,
  onViewCurrentPlan,
  onOpenSettings,
}: ProgressScreenProps) {
  const responsive = useResponsiveLayout();
  const ladderCards = getLadderProgressCards(ladderProgressById);

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
        onContinue={onBeginFirstCheckUp}
        onViewProfile={onViewMovementProfileV2Profile}
        onViewReport={onViewMovementProfileV2Report}
        onViewCurrentPlan={onViewCurrentPlan}
        onBeginExtraCheckUp={onBeginAdditionalCheckUp}
        onStartRetest={onStartRetest}
        activeBlock={activeBlock}
        blocks={blocks}
        reports={reports}
        completions={completions}
        today={today}
        ladderCards={ladderCards}
      />
    </Screen>
  );
}

interface ProgressEmptyStateStepCopy {
  index: string;
  title: string;
  body: string;
  state: 'current' | 'upcoming';
}

interface ProgressEmptyStateCopy {
  kicker: string;
  metaLabel: string;
  title: string;
  body: string;
  stepsAccessibilityLabel: string;
  steps: readonly ProgressEmptyStateStepCopy[];
  actionLabel: string;
  actionAccessibilityLabel: string;
  note: string;
}

const PROGRESS_EMPTY_STATE_COPY: ProgressEmptyStateCopy = {
  kicker: 'Set your starting point',
  metaLabel: '~10 min',
  title: 'Start with your check-up',
  body: 'A short guided check-up gives Hale what it needs to build your first plan.',
  stepsAccessibilityLabel: 'Plan preparation steps',
  steps: [
    {
      index: '1',
      title: 'Check-up',
      body: 'Hale checks strength, balance, and mobility at home.',
      state: 'current',
    },
    {
      index: '2',
      title: 'Preparation',
      body: 'Hale uses the result to shape your first plan.',
      state: 'upcoming',
    },
    {
      index: '3',
      title: 'First week',
      body: 'Three calm sessions appear here when your plan is ready.',
      state: 'upcoming',
    },
  ],
  actionLabel: 'Start check-up',
  actionAccessibilityLabel: 'Start check-up',
  note: 'Your camera view stays private. Hale never shows a live camera view.',
};

function ProgressEmptyState({ onBeginCheckUp }: { onBeginCheckUp: () => void }) {
  return <ProgressStructuredState copy={PROGRESS_EMPTY_STATE_COPY} onPress={onBeginCheckUp} />;
}

function ProgressStructuredState({ copy, onPress }: { copy: ProgressEmptyStateCopy; onPress: () => void }) {
  const responsive = useResponsiveLayout();
  return (
    <View style={styles.emptyProgressWrap}>
      <View style={[styles.emptyProgressCard, responsive.isCompactPhone && styles.compactCardPadding]}>
        <View style={styles.emptyProgressHeader}>
          <Text style={styles.emptyProgressKicker}>{copy.kicker}</Text>
          <View style={styles.emptyProgressMetaPill}>
            <Text style={styles.emptyProgressMetaText}>{copy.metaLabel}</Text>
          </View>
        </View>

        <Text style={styles.emptyProgressTitle}>{copy.title}</Text>
        <Text style={styles.emptyProgressBody}>{copy.body}</Text>

        <View style={[styles.emptyProgressSteps, responsive.isCompactPhone && styles.compactCardPadding]} accessibilityLabel={copy.stepsAccessibilityLabel}>
          {copy.steps.map((step, index) => (
            <ProgressEmptyStep
              key={step.index}
              index={step.index}
              title={step.title}
              body={step.body}
              state={step.state}
              last={index === copy.steps.length - 1}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.emptyProgressButton,
            responsive.isCompactPhone && styles.compactCardPadding,
            pressed && styles.pressed,
          ]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={copy.actionAccessibilityLabel}
        >
          <Text style={styles.emptyProgressButtonText}>{copy.actionLabel}</Text>
          <Text style={styles.emptyProgressButtonArrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.emptyProgressNote}>
        <Text style={styles.emptyProgressNoteText}>{copy.note}</Text>
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
  onBeginExtraCheckUp,
  onStartRetest,
  activeBlock,
  blocks,
  reports,
  completions,
  today,
  ladderCards,
}: {
  viewModel: MovementProfileV2ProgressViewModel | null;
  unavailable: boolean;
  onStartCheckUp: () => void;
  onContinue: () => void;
  onViewProfile?: (sourceCheckUpId: string) => void;
  onViewReport?: (reportId: string) => void;
  onViewCurrentPlan?: () => void;
  onBeginExtraCheckUp: () => void;
  onStartRetest: () => void;
  activeBlock?: MovementBlock | null;
  blocks?: readonly MovementBlock[] | null;
  reports?: readonly MovementBlockReport[] | null;
  completions?: readonly TrainingSessionCompletion[] | null;
  today: string;
  ladderCards: ReturnType<typeof getLadderProgressCards>;
}) {
  if (!viewModel || unavailable) {
    const recoveryViewModel = viewModel && viewModel.status !== 'ready' ? viewModel : null;
    const primary = recoveryViewModel?.actions[0];
    return (
      <MovementProfileV2RecoveryCard
        title={recoveryViewModel?.recovery.title ?? 'Movement Profile needs attention'}
        body={
          recoveryViewModel?.recovery.body ??
          'Your saved Movement Profile data is still on this phone, but Hale cannot safely show it here yet.'
        }
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

  const nextCheckUp = buildProgressNextCheckUpCard({
    hasReadyProfile: true,
    activeBlock,
    reports,
    completions,
    today,
  });
  const planSummary = buildProgressPlanSummaryCard({
    activeBlock,
    blocks,
    reports,
    completions,
    today,
  });

  return (
    <>
      <MovementProfileV2HeroSection hero={viewModel.hero} />
      <MovementProfileV2ProfileCard
        viewModel={viewModel}
        onViewProfile={onViewProfile}
      />
      {nextCheckUp ? (
        <MovementProfileV2NextCheckUpCard
          card={nextCheckUp}
          onStartRetest={onStartRetest}
        />
      ) : null}
      {planSummary ? (
        <MovementProfileV2PlanSummaryCard
          card={planSummary}
          onViewCurrentPlan={onViewCurrentPlan}
        />
      ) : null}
      {ladderCards.length > 0 ? <TrainingProgressCard cards={ladderCards} /> : null}
      <MovementProfileV2ExtraCheckUpCard onPress={onBeginExtraCheckUp} />
      {viewModel.officialHistory.length >= 2 ? (
        <MovementProfileV2OfficialHistoryCard
          history={viewModel.officialHistory}
          onViewProfile={onViewProfile}
        />
      ) : null}
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
          <Text style={styles.sectionIntro}>Your latest Movement Check-Up results.</Text>
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
        <Text style={styles.profileRowMetric} numberOfLines={2}>{card.metric}</Text>
      </View>
      <View style={styles.profileStatusPill}>
        <Text style={styles.profileStatusText} numberOfLines={2}>{progressSummaryStatusLabel(card)}</Text>
      </View>
    </View>
  );
}

function MovementProfileV2NextCheckUpCard({
  card,
  onStartRetest,
}: {
  card: ProgressNextCheckUpCardCopy;
  onStartRetest: () => void;
}) {
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>{card.title}</Text>
      <View style={styles.nextCheckUpPanel}>
        <IconBadge domain="calendar" size={38} iconSize={23} />
        <View style={styles.nextCheckUpCopy}>
          <Text style={styles.nextCheckUpTitle}>{card.lead}</Text>
          <Text style={styles.nextCheckUpBody}>{card.body}</Text>
        </View>
      </View>
      {card.actionLabel ? (
        <ProgressActionRow
          title={card.actionLabel}
          body="Opens camera setup for your Movement Check-Up."
          onPress={onStartRetest}
          accessibilityLabel={`${card.actionLabel}. ${card.lead} ${card.body}`}
        />
      ) : null}
    </Card>
  );
}

function MovementProfileV2PlanSummaryCard({
  card,
  onViewCurrentPlan,
}: {
  card: ProgressPlanSummaryCardCopy;
  onViewCurrentPlan?: () => void;
}) {
  const summaryIcon = planSummaryIcon(card.meta);
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>{card.title}</Text>
      <View style={styles.planSummaryPanel}>
        <IconBadge domain={summaryIcon} size={38} iconSize={23} />
        <View style={styles.planSummaryCopy}>
          <Text style={styles.planSummaryTitle}>Plan progress</Text>
          <Text style={styles.planSummaryBody}>{card.meta}</Text>
        </View>
      </View>
      <ProgressActionRow
        title={card.actionLabel}
        body="Opens your saved plan without starting a session."
        onPress={onViewCurrentPlan}
        accessibilityLabel={card.accessibilityLabel}
      />
    </Card>
  );
}

function MovementProfileV2ExtraCheckUpCard({ onPress }: { onPress: () => void }) {
  return (
    <Card style={styles.progressCard}>
      <RecordRow
        title="Extra check-up"
        meta="Try a quick check-in or a full optional check-up. This won't change your plan."
        onPress={onPress}
        accessibilityLabel="Extra check-up. Try a quick check-in or a full optional check-up. This will not change your plan."
        showDivider={false}
      />
    </Card>
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
  activeBlock?: MovementBlock | null;
  blocks: readonly MovementBlock[];
  reports: readonly MovementBlockReport[];
  completions: readonly TrainingSessionCompletion[];
  ladderProgressById?: Record<string, LadderProgress>;
  today: string;
  onBeginFirstCheckUp: () => void;
  onBeginAdditionalCheckUp: () => void;
  onStartRetest: () => void;
  progressDataAuthority?: ProgressDataAuthority;
  movementProfileV2Progress?: MovementProfileV2ProgressViewModel | null;
  onStartMovementProfileV2CheckUp?: () => void;
  onViewMovementProfileV2Profile?: (sourceCheckUpId: string) => void;
  onViewMovementProfileV2Report?: (reportId: string) => void;
  onViewCurrentPlan?: () => void;
  onOpenSettings: () => void;
}










const DEV_DAY_MS = 24 * 60 * 60 * 1000;










function domainIconForMovementProfileV2(domain: MovementProfileV2Domain): Domain {
  if (domain === 'strength_power') return 'strength';
  return domain;
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
      <Text style={styles.sectionIntro}>Hale adjusts these movements based on your completed sessions.</Text>
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
      <InlineStatusPill label={progressPracticeStatusLabel(card.status)} compact />
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

function planSummaryIcon(meta: string): Domain | 'calendar' {
  if (meta.startsWith('Strength / Power')) return 'strength';
  if (meta.startsWith('Balance')) return 'balance';
  if (meta.startsWith('Mobility')) return 'mobility';
  return 'calendar';
}

function displayMetric(metric: string): string {
  return metric.replace(/ -> /g, ' → ');
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
    borderRadius: 20,
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
    maxWidth: 134,
    minHeight: 34,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: 17,
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
  planSummaryPanel: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.bgElevated,
  },
  planSummaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  planSummaryTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  planSummaryBody: {
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
