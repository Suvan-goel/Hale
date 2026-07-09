import * as React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  Card,
  Screen,
} from '../components/ui';
import { HeaderLogo } from '../components/HeaderLogo';
import {
  type MovementProfileV2ProgressChange,
  type MovementProfileV2ProgressChangeDomain,
  type MovementProfileV2ProgressViewModel,
} from '../pearlFlow';
import { type MovementProfileV2Domain } from '../movementProfileV2/viewModel';
import type { ProgrammeLevelRow } from '../programme';
import { type Domain } from '../scoring';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';
import { SettingsIcon } from '../navigation/icons';

import { BRAND } from '../brand';
const PROGRESS_HERO_IMAGE = require('../../assets/images/progress-hero-botanical.png');

export function ProgressScreen({
  onBeginFirstCheckUp,
  onBeginAdditionalCheckUp,
  onStartMovementProfileV2CheckUp,
  movementProfileV2Progress,
  onViewMovementProfileV2Profile,
  programmeLevels,
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
        onStartCheckUp={onStartMovementProfileV2CheckUp ?? onBeginFirstCheckUp}
        onContinue={onBeginFirstCheckUp}
        onViewProfile={onViewMovementProfileV2Profile}
        onBeginExtraCheckUp={onBeginAdditionalCheckUp}
      />

      {/* Reported training levels sit BELOW the measured check-up content and
          under their own heading — the ladder moves session to session and is
          the reported counterpart to the monthly camera reading, never a
          measurement (moved off Home 2026-07-08 so Home stays action-first). */}
      <ProgrammeTrainingLevelsCard levels={programmeLevels ?? []} />
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
  onStartCheckUp,
  onContinue,
  onViewProfile,
  onBeginExtraCheckUp,
}: {
  viewModel: MovementProfileV2ProgressViewModel | null;
  onStartCheckUp: () => void;
  onContinue: () => void;
  onViewProfile?: (sourceCheckUpId: string) => void;
  onBeginExtraCheckUp: () => void;
}) {
  if (!viewModel) {
    return (
      <MovementProfileV2RecoveryCard
        title="Strength Profile needs attention"
        body={`Your saved Strength Profile data is still on this phone, but ${BRAND.appName} cannot safely show it here yet.`}
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
      <MovementProfileCard viewModel={viewModel} onViewProfile={onViewProfile} />
      {viewModel.change ? <MovementProfileV2ChangeCard change={viewModel.change} /> : null}
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

// One "Movement Profile" card: the botanical banner names the focus, and the
// body carries the date, the three domain readings, and the read-only results
// link (restored 2026-07-08 with the per-check-up results page).
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
        {onViewProfile ? (
          <ProgressActionRow
            title="See full results"
            body="Your complete check-up breakdown."
            onPress={() => onViewProfile(hero.profileId)}
            accessibilityLabel={`See full results. Your complete breakdown from ${hero.dateLabel}.`}
          />
        ) : null}
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

function MovementProfileV2ExtraCheckUpCard({ onPress }: { onPress: () => void }) {
  return (
    <Card style={styles.progressCard}>
      <RecordRow
        title="Extra check-up"
        meta="Repeat your movement check whenever you like."
        onPress={onPress}
        accessibilityLabel="Extra check-up. Repeat your movement check whenever you like."
        showDivider={false}
      />
    </Card>
  );
}

// Reported training ladder — one row per movement pattern. Lives on Progress
// (moved off Home 2026-07-08) so Home stays action-first. Framed as reported
// progression, deliberately distinct from the measured check-up card above:
// the movement name leads and the step reads as a quiet "Level N of M"
// caption rather than a scoreboard, keeping clear of the no-gamification law.
function ProgrammeTrainingLevelsCard({ levels }: { levels: readonly ProgrammeLevelRow[] }) {
  if (levels.length === 0) return null;
  return (
    <Card style={styles.progressCard}>
      <Text style={styles.sectionTitle}>Your training levels</Text>
      <Text style={styles.sectionIntro}>Levels rise as you train. They track your sessions, not your check-up.</Text>
      <View style={styles.trainingLevelRows}>
        {levels.map((row, index) => (
          <View
            key={row.pattern}
            style={[styles.trainingLevelRow, index > 0 && styles.rowDivider]}
            accessibilityLabel={`${row.patternTitle}: ${row.levelDisplayName}. Level ${row.currentLevel} of ${row.maxLevel}.`}
          >
            <View style={styles.trainingLevelText}>
              <Text style={styles.trainingLevelPattern} numberOfLines={1}>{row.patternTitle}</Text>
              <Text style={styles.trainingLevelName} numberOfLines={1}>{row.levelDisplayName}</Text>
            </View>
            <Text style={styles.trainingLevelStep} numberOfLines={1}>
              Level {row.currentLevel} of {row.maxLevel}
            </Text>
          </View>
        ))}
      </View>
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
            onPress={onViewProfile ? () => onViewProfile(entry.id) : undefined}
          />
        ))}
      </View>
    </Card>
  );
}

// Rows open the saved read-only results page (restored 2026-07-08); without a
// handler they degrade to informational rows rather than no-op pressables.
function MovementProfileV2HistoryRow({
  entry,
  latest,
  showDivider,
  onPress,
}: {
  entry: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['officialHistory'][number];
  latest: boolean;
  showDivider: boolean;
  onPress?: () => void;
}) {
  const body = (
    <>
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
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );
  if (!onPress) {
    return (
      <View
        style={[styles.historyRow, showDivider && styles.rowDivider]}
        accessibilityLabel={`${entry.dateLabel}. ${entry.sourceLabel}. ${entry.focusTitle}.`}
      >
        {body}
      </View>
    );
  }
  return (
    <Pressable
      style={({ pressed }) => [styles.historyRow, showDivider && styles.rowDivider, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${entry.dateLabel}. ${entry.sourceLabel}. ${entry.focusTitle}. Opens the saved read-only results page.`}
    >
      {body}
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
  onBeginFirstCheckUp: () => void;
  onBeginAdditionalCheckUp: () => void;
  onStartMovementProfileV2CheckUp?: () => void;
  movementProfileV2Progress?: MovementProfileV2ProgressViewModel | null;
  /** Opens the saved read-only results page (restored 2026-07-08). */
  onViewMovementProfileV2Profile?: (sourceCheckUpId: string) => void;
  /** Per-pattern reported training ladder (moved off Home 2026-07-08). */
  programmeLevels?: readonly ProgrammeLevelRow[];
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
  profileStatusText: {
    color: colors.sageDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    textAlign: 'center',
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
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  trainingLevelRows: {
    marginTop: 14,
  },
  trainingLevelRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  trainingLevelText: {
    flex: 1,
    minWidth: 0,
  },
  trainingLevelPattern: {
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 0,
  },
  trainingLevelName: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: 2,
  },
  trainingLevelStep: {
    flexShrink: 0,
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
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
  chevron: { ...type.h2, color: colors.textSecondary },
  pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
});
