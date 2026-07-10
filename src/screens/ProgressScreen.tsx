import * as React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  Card,
  Screen,
} from '../components/ui';
import { ClarityProgressCard } from '../components/ClarityProgressCard';
import { HeaderLogo } from '../components/HeaderLogo';
import {
  type MovementProfileV2ProgressChange,
  type MovementProfileV2ProgressChangeDomain,
  type MovementProfileV2ProgressViewModel,
} from '../pearlFlow';
import { type MovementProfileV2Domain } from '../movementProfileV2/viewModel';
import type { OfficialCheckUpBlockedReason } from '../programme';
import type { ClarityTrendViewModel } from '../pearlFlow/clarityTrend';
import { type Domain } from '../scoring';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';
import { SettingsIcon } from '../navigation/icons';

import { BRAND } from '../brand';
const PROGRESS_HERO_IMAGE = require('../../assets/images/progress-hero-botanical.png');

export function ProgressScreen({
  onBeginFirstCheckUp,
  onStartMovementProfileV2CheckUp,
  movementProfileV2Progress,
  onViewMovementProfileV2Profile,
  clarityTrend,
  checkUpBlockedReason,
  onOpenSettings,
}: ProgressScreenProps) {
  const responsive = useResponsiveLayout();
  const progress = movementProfileV2Progress ?? null;
  const checkUpHistory =
    progress?.status === 'ready' && progress.officialHistory.length >= 2
      ? progress.officialHistory
      : null;

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
        viewModel={progress}
        onStartCheckUp={onStartMovementProfileV2CheckUp ?? onBeginFirstCheckUp}
        onContinue={onBeginFirstCheckUp}
        onViewProfile={onViewMovementProfileV2Profile}
        checkUpBlockedReason={checkUpBlockedReason}
      />

      {clarityTrend ? <ClarityProgressCard viewModel={clarityTrend} /> : null}
      {checkUpHistory ? (
        <MovementProfileV2HistoryCard
          history={checkUpHistory}
          onViewProfile={onViewMovementProfileV2Profile}
        />
      ) : null}
    </Screen>
  );
}

function ProgressEmptyState() {
  return (
    <Card style={styles.emptyProgressCard}>
      <View style={styles.emptyProgressIcon}>
        <ProgressPictogram name="calendar" size={24} color={colors.accent} />
      </View>
      <View style={styles.emptyProgressCopy}>
        <Text style={styles.emptyProgressTitle}>Your progress will appear here</Text>
        <Text style={styles.emptyProgressBody}>
          After your first Movement Check-Up, you’ll see your Strength and Balance results here.
          Everyday Clarity will appear too if you choose to answer it.
        </Text>
        <Text style={styles.emptyProgressHint}>Start your check-up from Home when you’re ready.</Text>
      </View>
    </Card>
  );
}

function MovementProfileV2ProgressContent({
  viewModel,
  onStartCheckUp,
  onContinue,
  onViewProfile,
  checkUpBlockedReason,
}: {
  viewModel: MovementProfileV2ProgressViewModel | null;
  onStartCheckUp?: () => void;
  onContinue?: () => void;
  onViewProfile?: (sourceCheckUpId: string) => void;
  checkUpBlockedReason?: OfficialCheckUpBlockedReason;
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
      if (onStartCheckUp) return <ProgressEmptyState />;
      const blocked = blockedCheckUpCopy(checkUpBlockedReason);
      return <MovementProfileV2RecoveryCard title={blocked.title} body={blocked.body} />;
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
            : primary && onContinue
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

// Older check-ups stay available without making the default Progress page a
// long archive. The latest result already has a full-results link above.
function MovementProfileV2HistoryCard({
  history,
  onViewProfile,
}: {
  history: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['officialHistory'];
  onViewProfile?: (sourceCheckUpId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const earlierCheckUps = history.slice(1);
  const countLabel = `${earlierCheckUps.length} earlier ${earlierCheckUps.length === 1 ? 'check-up' : 'check-ups'}`;

  return (
    <Card style={styles.historyDisclosureCard}>
      <Pressable
        style={({ pressed }) => [styles.historyDisclosure, pressed && styles.pressed]}
        onPress={() => setExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Hide' : 'See'} check-up history. ${countLabel} saved on this device.`}
      >
        <View style={styles.latestResultsIconWell}>
          <ProgressPictogram name="calendar" size={20} color={colors.accent} />
        </View>
        <View style={styles.latestResultsCopy}>
          <Text style={styles.latestResultsTitle}>
            {expanded ? 'Hide check-up history' : 'See check-up history'}
          </Text>
          <Text style={styles.latestResultsBody}>{countLabel} saved on this device.</Text>
        </View>
        <Text style={[styles.historyDisclosureChevron, expanded && styles.historyDisclosureChevronOpen]}>›</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.historyList}>
          {earlierCheckUps.map((entry, index) => (
            <MovementProfileV2HistoryRow
              key={entry.id}
              entry={entry}
              showDivider={index > 0}
              onPress={onViewProfile ? () => onViewProfile(entry.id) : undefined}
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

// Rows open the saved read-only results page (restored 2026-07-08); without a
// handler they degrade to informational rows rather than no-op pressables.
function MovementProfileV2HistoryRow({
  entry,
  showDivider,
  onPress,
}: {
  entry: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['officialHistory'][number];
  showDivider: boolean;
  onPress?: () => void;
}) {
  const body = (
    <>
      <View style={styles.historyRowText}>
        <Text style={styles.historyRowTitle} numberOfLines={1}>{entry.dateLabel}</Text>
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
  onBeginFirstCheckUp?: () => void;
  onStartMovementProfileV2CheckUp?: () => void;
  movementProfileV2Progress?: MovementProfileV2ProgressViewModel | null;
  /** Opens the saved read-only results page (restored 2026-07-08). */
  onViewMovementProfileV2Profile?: (sourceCheckUpId: string) => void;
  clarityTrend?: ClarityTrendViewModel | null;
  checkUpBlockedReason?: OfficialCheckUpBlockedReason;
  onOpenSettings: () => void;
}

function blockedCheckUpCopy(reason?: OfficialCheckUpBlockedReason): {
  title: string;
  body: string;
} {
  if (reason === 'health_data_consent_required') {
    return {
      title: 'Movement Check-Up is off',
      body: `You chose not to save health information on this device, so ${BRAND.appName} will not open or store a camera check-up.`,
    };
  }
  if (reason === 'gentle_start_safety_gate') {
    return {
      title: 'Gentle Start is active',
      body: `${BRAND.appName} keeps the effort-based Movement Check-Up unavailable while your Gentle Start safety gate is active.`,
    };
  }
  if (reason === 'journey_completed') {
    return {
      title: 'Your 12-week check-ups are complete',
      body: 'Your baseline and monthly results remain saved here for review.',
    };
  }
  return {
    title: 'Your next check-up is not due yet',
    body: `${BRAND.appName} uses the same official check-up at each four-week checkpoint so your comparisons stay meaningful.`,
  };
}

function domainIconForMovementProfileV2(domain: MovementProfileV2Domain): Domain {
  if (domain === 'strength_power') return 'strength';
  return domain;
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  progressCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.card,
  },
  profileCard: {
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.card,
  },
  profileBanner: {
    minHeight: 132,
    justifyContent: 'flex-end',
    backgroundColor: colors.bgElevated,
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
    backgroundColor: colors.imageScrim,
  },
  profileBannerContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 4,
  },
  profileBannerEyebrow: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    opacity: 0.9,
  },
  profileBannerTitle: {
    color: colors.textPrimary,
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
  emptyProgressCard: {
    minHeight: 196,
    paddingHorizontal: 18,
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  emptyProgressIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  emptyProgressCopy: {
    flex: 1,
    minWidth: 0,
  },
  emptyProgressTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifMedium,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: 0,
  },
  emptyProgressBody: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    marginTop: spacing.sm,
  },
  emptyProgressHint: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: spacing.md,
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
  historyDisclosureCard: {
    paddingHorizontal: 18,
    paddingVertical: 0,
  },
  historyDisclosure: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  historyDisclosureChevron: {
    ...type.h2,
    color: colors.textSecondary,
    transform: [{ rotate: '0deg' }],
  },
  historyDisclosureChevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  historyList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
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
  chevron: { ...type.h2, color: colors.textSecondary },
  pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
});
