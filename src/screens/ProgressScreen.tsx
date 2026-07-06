import * as React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  Card,
  Screen,
  SecondaryButton,
} from '../components/ui';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import {
  type MovementBlock,
  type MovementBlockReport,
  type TrainingSessionCompletion,
} from '../adherence';
import {
  type ClarityEscalation,
  type ClarityTrendViewModel,
  type GhostCurveViewModel,
  type MovementProfileV2ProgressChange,
  type MovementProfileV2ProgressChangeDomain,
  type MovementProfileV2ProgressViewModel,
  type ProgressDataAuthority,
} from '../haleFlow';
import { GhostCurveCard } from './GhostCurveCard';
import { type MovementProfileV2Domain } from '../movementProfileV2/viewModel';
import { type Domain } from '../scoring';
import type { LadderProgress } from '../training';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';
import { SettingsIcon } from '../navigation/icons';
import {
  buildProgressNextCheckUpCard,
  type ProgressNextCheckUpCardCopy,
} from './progressProductPresentation';

import { BRAND } from '../brand';
const PROGRESS_HERO_IMAGE = require('../../assets/images/progress-hero-botanical.png');

export function ProgressScreen({
  activeBlock,
  reports,
  completions,
  today,
  onBeginFirstCheckUp,
  onBeginAdditionalCheckUp,
  onStartRetest,
  progressDataAuthority,
  movementProfileV2Progress,
  clarityTrend,
  ghostCurve,
  clarityEscalation,
  onShareClarityGpSummary,
  onStartMovementProfileV2CheckUp,
  onViewMovementProfileV2Profile,
  onOpenSettings,
}: ProgressScreenProps) {
  const responsive = useResponsiveLayout();

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
        onBeginExtraCheckUp={onBeginAdditionalCheckUp}
        onStartRetest={onStartRetest}
        activeBlock={activeBlock}
        reports={reports}
        completions={completions}
        today={today}
      />

      {ghostCurve && ghostCurve.status === 'ready' ? (
        <GhostCurveCard viewModel={ghostCurve} />
      ) : null}

      {clarityTrend && clarityTrend.status === 'ready' ? (
        <ClarityTrendCard
          trend={clarityTrend}
          escalation={clarityEscalation}
          onShareGpSummary={onShareClarityGpSummary}
        />
      ) : null}
    </Screen>
  );
}

/**
 * Clarity trend (flag-gated): one row per series, each baseline-relative —
 * relations and trajectory, never a raw score in isolation; a clouded month
 * always carries the drivers and the trainable path (worse never bare), and
 * her own covariates are named when a dip lines up with them. Series are
 * never fused into a single number (composite rule).
 */
function ClarityTrendCard({
  trend,
  escalation,
  onShareGpSummary,
}: {
  trend: Extract<ClarityTrendViewModel, { status: 'ready' }>;
  escalation?: ClarityEscalation | null;
  onShareGpSummary?: () => void;
}) {
  return (
    <Card style={styles.clarityCard}>
      <Text style={styles.clarityLabel}>Clarity</Text>
      <Text style={styles.clarityMeta}>Self-reported and measured tracking — against your own usual range.</Text>
      {trend.series.map((series) => (
        <View key={series.id} style={styles.claritySeries}>
          <Text style={styles.claritySeriesLabel}>{series.label}</Text>
          {series.trend.status === 'ready' ? (
            <Text style={styles.clarityHeadline}>{series.trend.headline}</Text>
          ) : series.trend.status === 'building' ? (
            <Text style={styles.clarityHeadline}>{series.trend.body}</Text>
          ) : null}
          {series.trend.status !== 'no_data'
            ? series.trend.entries.map((entry) => (
                <View key={entry.atIso} style={styles.clarityEntryRow}>
                  <Text style={styles.clarityEntryDate}>{entry.dateLabel}</Text>
                  <Text style={styles.clarityEntryRelation}>{entry.relationLabel}</Text>
                </View>
              ))
            : null}
          {series.trend.status === 'ready' && series.trend.supportCopy ? (
            <Text style={styles.claritySupport}>{series.trend.supportCopy}</Text>
          ) : null}
        </View>
      ))}
      {trend.covariateContext ? <Text style={styles.claritySupport}>{trend.covariateContext}</Text> : null}
      {escalation?.triggered && escalation.copy ? (
        // The ONLY escalation path (CLARITY_INSTRUMENTS_TDD §6.2): calm, one
        // suggestion, one exportable summary — never alarm.
        <View style={styles.clarityEscalation}>
          <Text style={styles.clarityHeadline}>{escalation.copy}</Text>
          {onShareGpSummary ? (
            <SecondaryButton title="Share the summary" onPress={onShareGpSummary} />
          ) : null}
        </View>
      ) : null}
      <Text style={styles.clarityNote}>{trend.fluctuationNote}</Text>
    </Card>
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
  body: `A short guided check-up gives ${BRAND.appName} what it needs to build your first plan.`,
  stepsAccessibilityLabel: 'Plan preparation steps',
  steps: [
    {
      index: '1',
      title: 'Check-up',
      body: `${BRAND.appName} checks strength, balance, and mobility at home.`,
      state: 'current',
    },
    {
      index: '2',
      title: 'Preparation',
      body: `${BRAND.appName} uses the result to shape your first plan.`,
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
  note: `Your camera view stays private. ${BRAND.appName} never shows a live camera view.`,
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
  onBeginExtraCheckUp,
  onStartRetest,
  activeBlock,
  reports,
  completions,
  today,
}: {
  viewModel: MovementProfileV2ProgressViewModel | null;
  unavailable: boolean;
  onStartCheckUp: () => void;
  onContinue: () => void;
  onViewProfile?: (sourceCheckUpId: string) => void;
  onBeginExtraCheckUp: () => void;
  onStartRetest: () => void;
  activeBlock?: MovementBlock | null;
  reports?: readonly MovementBlockReport[] | null;
  completions?: readonly TrainingSessionCompletion[] | null;
  today: string;
}) {
  if (!viewModel || unavailable) {
    const recoveryViewModel = viewModel && viewModel.status !== 'ready' ? viewModel : null;
    const primary = recoveryViewModel?.actions[0];
    return (
      <MovementProfileV2RecoveryCard
        title={recoveryViewModel?.recovery.title ?? 'Strength Profile needs attention'}
        body={
          recoveryViewModel?.recovery.body ??
          `Your saved Strength Profile data is still on this phone, but ${BRAND.appName} cannot safely show it here yet.`
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
  return (
    <>
      <MovementProfileCard viewModel={viewModel} onViewProfile={onViewProfile} />
      {viewModel.change ? <MovementProfileV2ChangeCard change={viewModel.change} /> : null}
      {nextCheckUp ? (
        <MovementProfileV2NextCheckUpCard card={nextCheckUp} onStartRetest={onStartRetest} />
      ) : null}
      {viewModel.officialHistory.length >= 2 ? (
        <MovementProfileV2HistoryCard history={viewModel.officialHistory} onViewProfile={onViewProfile} />
      ) : null}
      <MovementProfileV2ExtraCheckUpCard onPress={onBeginExtraCheckUp} />
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

// One "Movement Profile" card: the botanical banner names the focus, and the body
// carries the date, the three domain readings, and the read-only profile link.
// This merges the former hero + profile cards, which duplicated the date and focus.
function MovementProfileCard({
  viewModel,
  onViewProfile,
}: {
  viewModel: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>;
  onViewProfile?: (sourceCheckUpId: string) => void;
}) {
  const { hero } = viewModel;
  return (
    <View style={styles.profileCard}>
      <ImageBackground
        source={PROGRESS_HERO_IMAGE}
        style={styles.profileBanner}
        imageStyle={styles.profileBannerImage}
        resizeMode="cover"
      >
        <View style={styles.profileBannerScrim} />
        <View style={styles.profileBannerContent}>
          <Text style={styles.profileBannerEyebrow}>Where to focus</Text>
          <Text style={styles.profileBannerTitle} numberOfLines={2}>{hero.focusTitle}</Text>
        </View>
      </ImageBackground>
      <View style={styles.profileBody}>
        <Text style={styles.profileMeta}>Last check-up · {hero.dateLabel}</Text>
        <Text style={styles.profileFocusBody}>{hero.focusBody}</Text>
        <View style={styles.profileRows}>
          {hero.domains.map((card, index) => (
            <MovementProfileV2ProgressRow key={card.domain} card={card} showDivider={index > 0} />
          ))}
        </View>
        <ProgressActionRow
          title="See full results"
          body="Your complete check-up breakdown."
          onPress={() => onViewProfile?.(hero.profileId)}
          accessibilityLabel={`See full results. Your complete breakdown from ${hero.dateLabel}.`}
        />
      </View>
    </View>
  );
}

// "Am I improving?" — the reason a Progress tab exists. Only rendered when the
// view model has a comparable change across at least two check-ups.
function MovementProfileV2ChangeCard({ change }: { change: MovementProfileV2ProgressChange }) {
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>Your change over time</Text>
      <Text style={styles.sectionIntro}>{change.headline}</Text>
      <View style={styles.changeRows}>
        {change.domains.map((domain, index) => (
          <MovementProfileV2ChangeRow key={domain.domain} domain={domain} showDivider={index > 0} />
        ))}
      </View>
    </Card>
  );
}

function MovementProfileV2ChangeRow({
  domain,
  showDivider,
}: {
  domain: MovementProfileV2ProgressChangeDomain;
  showDivider: boolean;
}) {
  const tonePill =
    domain.direction === 'up'
      ? styles.changePillUp
      : domain.direction === 'down'
        ? styles.changePillDown
        : styles.changePillSteady;
  const toneText =
    domain.direction === 'up'
      ? styles.changePillTextUp
      : domain.direction === 'down'
        ? styles.changePillTextDown
        : styles.changePillTextSteady;
  return (
    <View style={[styles.changeRowBlock, showDivider && styles.rowDivider]}>
      <View style={styles.changeRow}>
        <IconBadge domain={domainIconForMovementProfileV2(domain.domain)} size={36} iconSize={22} />
        <View style={styles.changeRowText}>
          <Text style={styles.changeRowTitle} numberOfLines={1}>{domain.title}</Text>
          <Text style={styles.changeRowMetric} numberOfLines={1}>{domain.value}</Text>
        </View>
        <View style={[styles.changePill, tonePill]}>
          <Text style={[styles.changePillText, toneText]} numberOfLines={1}>{domain.caption}</Text>
        </View>
      </View>
      {domain.supportCopy ? (
        // Worse never bare: a lower reading always carries the trainable path.
        <Text style={styles.changeSupport}>{domain.supportCopy}</Text>
      ) : null}
    </View>
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
        <Text style={styles.profileStatusText} numberOfLines={2}>{card.interpretation}</Text>
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
      <View style={styles.nextCheckUpRow}>
        <IconBadge domain="calendar" size={36} iconSize={22} />
        <View style={styles.nextCheckUpText}>
          <Text style={styles.nextCheckUpLabel}>Next check-up</Text>
          <Text style={styles.nextCheckUpValue} numberOfLines={2}>{card.lead}</Text>
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

// A simple list of saved check-ups, newest first — a way back to any past result.
// The former "4-week block reports" subsection was dropped: it was cryptic
// ("Strength / Power to Balance") and not what this tab is for.
function MovementProfileV2HistoryCard({
  history,
  onViewProfile,
}: {
  history: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['officialHistory'];
  onViewProfile?: (sourceCheckUpId: string) => void;
}) {
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>History</Text>
      <Text style={styles.sectionIntro}>Your saved check-ups, newest first.</Text>
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
  /** Flag-gated Clarity trend (REPOSITION_TDD §5.4); null while the clarity
   * dimension is off scoring surfaces. */
  clarityTrend?: ClarityTrendViewModel | null;
  /** Ghost curve (REPOSITION_TDD §2.4); null until ≥4 monthly readings exist. */
  ghostCurve?: GhostCurveViewModel | null;
  /** The only escalation path (flag-gated with the Clarity trend). */
  clarityEscalation?: ClarityEscalation | null;
  onShareClarityGpSummary?: () => void;
  onStartMovementProfileV2CheckUp?: () => void;
  onViewMovementProfileV2Profile?: (sourceCheckUpId: string) => void;
  onViewMovementProfileV2Report?: (reportId: string) => void;
  onViewCurrentPlan?: () => void;
  onOpenSettings: () => void;
}














function domainIconForMovementProfileV2(domain: MovementProfileV2Domain): Domain {
  if (domain === 'strength_power') return 'strength';
  return domain;
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
  profileCard: {
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  profileBanner: {
    minHeight: 132,
    justifyContent: 'flex-end',
    backgroundColor: colors.accent,
  },
  profileBannerImage: {
    // Image bleeds to the card edges; the card's own overflow:hidden clips it.
  },
  profileBannerScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(17,20,18,0.30)',
  },
  profileBannerContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 4,
  },
  profileBannerEyebrow: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    opacity: 0.9,
  },
  profileBannerTitle: {
    color: colors.onAccent,
    fontFamily: fonts.serifMedium,
    fontSize: 29,
    lineHeight: 34,
    letterSpacing: 0,
  },
  profileBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  profileMeta: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  profileFocusBody: {
    ...type.cardBody,
    marginTop: spacing.xs,
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
  clarityCard: {
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  clarityLabel: {
    ...type.cardTitle,
  },
  clarityMeta: {
    ...type.caption,
    color: colors.textSecondary,
  },
  claritySeries: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  claritySeriesLabel: {
    ...type.cardRowTitle,
  },
  clarityHeadline: {
    ...type.cardBody,
    color: colors.textPrimary,
  },
  clarityEntryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  clarityEntryDate: {
    ...type.caption,
    color: colors.textSecondary,
  },
  clarityEntryRelation: {
    ...type.caption,
    color: colors.textPrimary,
  },
  claritySupport: {
    ...type.caption,
    color: colors.textSecondary,
  },
  clarityEscalation: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  clarityNote: {
    ...type.caption,
    color: colors.textTertiary,
  },
  changeRowBlock: {
    paddingVertical: spacing.md,
  },
  changeRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  changeSupport: {
    ...type.caption,
    color: colors.textSecondary,
    paddingTop: spacing.xs,
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
  changePill: {
    minHeight: 34,
    maxWidth: 148,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.bgElevated,
  },
  changePillUp: { borderColor: colors.positive },
  changePillDown: { borderColor: colors.caution },
  changePillSteady: { borderColor: colors.divider },
  changePillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    textAlign: 'center',
  },
  changePillTextUp: { color: colors.positive },
  changePillTextDown: { color: colors.caution },
  changePillTextSteady: { color: colors.textSecondary },
  nextCheckUpRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  nextCheckUpText: {
    flex: 1,
    minWidth: 0,
  },
  nextCheckUpLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  nextCheckUpValue: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    marginTop: 2,
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
