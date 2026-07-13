import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import {
  Card,
  Screen,
} from '../components/ui';
import { ClarityProgressCard } from '../components/ClarityProgressCard';
import {
  type MovementProfileV2ProgressChangeDomain,
  type MovementProfileV2ProgressViewModel,
} from '../pearlFlow/movementProfileV2ProgressViewModel';
import { type MovementProfileV2Domain } from '../movementProfileV2/viewModel';
import type { OfficialCheckUpBlockedReason } from '../programme';
import type { ClarityTrendViewModel } from '../pearlFlow/clarityTrend';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import { MenuIcon } from '../navigation/icons';

import { BRAND } from '../brand';

export function ProgressScreen({
  onStartCheckUp,
  movementProfileV2Progress,
  onViewMovementProfileV2Profile,
  clarityTrend,
  checkUpBlockedReason,
  onOpenSettings,
}: ProgressScreenProps) {
  const responsive = useResponsiveLayout();
  const progress = movementProfileV2Progress ?? null;
  const checkUpHistory =
    progress?.status === 'ready' && progress.officialHistory.length >= 1
      ? progress.officialHistory
      : null;

  return (
    <Screen
      contentStyle={[
        styles.screenContent,
        { paddingHorizontal: responsive.isCompactWidth ? spacing.xl : spacing.xxl },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[styles.title, responsive.isCompactPhone && styles.compactTitle]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.9}
        >
          Your progress
        </Text>
        <Pressable
          style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <MenuIcon size={24} color={colors.textPrimary} strokeWidth={1.55} />
        </Pressable>
      </View>

      <MovementProfileV2ProgressContent
        viewModel={progress}
        onStartCheckUp={onStartCheckUp}
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
        <ProgressPictogram size={24} color={colors.accent} />
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
  checkUpBlockedReason,
}: {
  viewModel: MovementProfileV2ProgressViewModel | null;
  onStartCheckUp?: () => void;
  checkUpBlockedReason?: OfficialCheckUpBlockedReason;
}) {
  if (!viewModel) {
    return (
      <MovementProfileV2RecoveryCard
        title="Check-up results need attention"
        body={`Your saved check-up data is still on this phone, but ${BRAND.appName} cannot safely show it here yet.`}
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
        onPress={primary?.id === 'start_movement_checkup' ? onStartCheckUp : undefined}
      />
    );
  }

  return <MovementProfileCard viewModel={viewModel} />;
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

// The reference-led Progress experience: one physical domain at a time, with
// personal change as the hero and the latest check-up kept within easy reach.
function MovementProfileCard({
  viewModel,
}: {
  viewModel: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>;
}) {
  const { hero } = viewModel;
  const availableDomains = hero.domains.filter(
    (domain) => domain.domain === 'strength_power' || domain.domain === 'balance'
  );
  const [selectedDomain, setSelectedDomain] = React.useState<MovementProfileV2Domain>(
    availableDomains[0]?.domain ?? 'strength_power'
  );
  const current = availableDomains.find((domain) => domain.domain === selectedDomain)
    ?? availableDomains[0];
  const change = viewModel.change?.domains.find((domain) => domain.domain === current?.domain);
  const readiness = viewModel.change ? null : viewModel.changeReadiness;

  if (!current) return null;

  return (
    <View style={styles.profileCard}>
      <DomainTabs
        domains={availableDomains}
        selected={current.domain}
        onSelect={setSelectedDomain}
      />

      <View style={styles.progressHero}>
        <Text style={styles.eyebrow}>YOUR CHECK-UPS</Text>
        <Text style={styles.progressHeroTitle}>{progressHeroTitle(current.domain, change)}</Text>
        <Text style={styles.progressDelta}>
          {change
            ? progressDelta(change)
            : readiness && readiness.status !== 'ready'
              ? readiness.body
              : 'Your first comparable result is saved.'}
        </Text>
      </View>

      <ProgressChart domain={current.domain} change={change} currentMetric={current.metric} />

      <View style={styles.metricSummary}>
        <ProgressSummaryMetric
          label="Current level"
          value={currentMetricValue(current.metric)}
          unit={currentMetricUnit(current.domain)}
          supportingText={`Latest check-up · ${hero.dateLabel}`}
        />
      </View>

      {change?.supportCopy ? <Text style={styles.changeSupport}>{change.supportCopy}</Text> : null}
    </View>
  );
}

function DomainTabs({
  domains,
  selected,
  onSelect,
}: {
  domains: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['hero']['domains'];
  selected: MovementProfileV2Domain;
  onSelect: (domain: MovementProfileV2Domain) => void;
}) {
  return (
    <View style={styles.domainTabs} accessibilityRole="tablist">
      {domains.map((domain) => {
        const active = domain.domain === selected;
        const label = progressDomainTitle(domain.domain, domain.title);
        return (
          <Pressable
            key={domain.domain}
            style={({ pressed }) => [
              styles.domainTab,
              pressed && styles.pressed,
            ]}
            onPress={() => onSelect(domain.domain)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${label} progress`}
          >
            <Text style={[styles.domainTabText, active && styles.domainTabTextActive]}>
              {label}
            </Text>
            <View style={[styles.domainTabTrack, active && styles.domainTabTrackActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

function ProgressChart({
  domain,
  change,
  currentMetric,
}: {
  domain: MovementProfileV2Domain;
  change?: MovementProfileV2ProgressChangeDomain;
  currentMetric: string;
}) {
  const series = change?.series ?? [];
  const values = series.length > 0
    ? series.map((point) => point.value)
    : [Number(currentMetric.match(/[\d.]+/)?.[0] ?? 0)];
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = rawMax - rawMin;
  const padding = spread > 0 ? Math.max(1, spread * 0.38) : Math.max(1, rawMax * 0.12);
  const paddedMin = Math.max(0, rawMin - padding);
  const paddedMax = rawMax + padding;
  let tickStep = Math.max(1, Math.ceil((paddedMax - paddedMin) / 4));
  let min = Math.max(0, Math.floor(paddedMin / tickStep) * tickStep);
  if (min + tickStep * 4 < paddedMax && min + tickStep <= rawMin) {
    min += tickStep;
  }
  while (min + tickStep * 4 < paddedMax) {
    tickStep += 1;
    min = Math.max(0, Math.floor(paddedMin / tickStep) * tickStep);
  }
  const max = min + tickStep * 4;
  const plotLeft = 8;
  const plotRight = 304;
  const plotTop = 14;
  const plotBottom = 168;
  const chartPoints = values.map((value, index) => ({
    x: values.length === 1
      ? (plotLeft + plotRight) / 2
      : plotLeft + (index / (values.length - 1)) * (plotRight - plotLeft),
    y: plotBottom - ((value - min) / (max - min)) * (plotBottom - plotTop),
  }));
  const ticks = [max, min + tickStep * 2, min];
  const includeDay = series.length > 1 && new Set(series.map((point) => monthKey(point.atIso))).size < series.length;
  const accessibilityLabel = series.length > 1
    ? `${progressDomainTitle(domain, domain)} changed from ${series[0].value} to ${series[series.length - 1].value} across ${series.length} comparable check-ups.`
    : `${progressDomainTitle(domain, domain)} baseline saved at ${values[0]}.`;
  const chartTitle = domain === 'balance' ? 'One-leg balance' : '30-second chair stand';
  const chartUnit = domain === 'balance' ? 'Seconds' : 'Rises';

  return (
    <View style={styles.chartSection}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{chartTitle}</Text>
        <Text style={styles.chartUnit}>{chartUnit}</Text>
      </View>
      <View style={styles.chart} accessible accessibilityLabel={`${chartTitle}, ${chartUnit}. ${accessibilityLabel}`}>
        <Svg width="100%" height="100%" viewBox="0 0 360 214" fill="none">
        <Path
          d={`M ${plotLeft} ${plotBottom} H ${plotRight}`}
          stroke={colors.textTertiary}
          strokeWidth={1}
        />
        {chartPoints.length > 1 ? (
          <Path
            d={straightChartPath(chartPoints)}
            stroke={colors.accentDeep}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {chartPoints.map((point, index) => {
          const latest = index === chartPoints.length - 1;
          return latest ? (
            <React.Fragment key={`${point.x}-${point.y}`}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={7.5}
                fill={colors.background}
                stroke={colors.accentDeep}
                strokeWidth={1.5}
              />
              <Circle cx={point.x} cy={point.y} r={3.8} fill={colors.accentDeep} />
            </React.Fragment>
          ) : (
            <Circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r={4.8} fill={colors.accentDeep} />
          );
        })}
        {ticks.map((tick, index) => (
          <SvgText
            key={tick}
            x={351}
            y={plotTop + (index / 2) * (plotBottom - plotTop) + 4}
            fill={colors.textSecondary}
            fontFamily={fonts.sansRegular}
            fontSize={12}
            textAnchor="end"
          >
            {formatAxisValue(tick)}
          </SvgText>
        ))}
        {series.map((point, index) => (
          <SvgText
            key={point.atIso}
            x={chartPoints[index].x}
            y={199}
            fill={colors.textSecondary}
            fontFamily={fonts.sansMedium}
            fontSize={11.5}
            letterSpacing={0.7}
            textAnchor={index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle'}
          >
            {formatChartDate(point.atIso, includeDay)}
          </SvgText>
        ))}
        </Svg>
      </View>
    </View>
  );
}

function ProgressSummaryMetric({
  label,
  value,
  unit,
  supportingText,
  accent = false,
}: {
  label: string;
  value: string;
  unit: string;
  supportingText?: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.summaryMetric}>
      <View style={styles.summaryMetricRow}>
        <Text style={styles.summaryMetricLabel}>{label}</Text>
        <Text style={[styles.summaryMetricValue, accent && styles.summaryMetricValueAccent]}>
          {value} <Text style={styles.summaryMetricUnit}>{unit}</Text>
        </Text>
      </View>
      {supportingText ? (
        <Text style={styles.summaryMetricSupportingText}>{supportingText}</Text>
      ) : null}
    </View>
  );
}

function straightChartPath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.slice(1).reduce(
    (path, point) => `${path} L ${point.x} ${point.y}`,
    `M ${points[0].x} ${points[0].y}`
  );
}

function progressHeroTitle(
  domain: MovementProfileV2Domain,
  change?: MovementProfileV2ProgressChangeDomain
): string {
  if (!change) return 'Baseline saved';
  if (change.direction === 'up') {
    return `${domain === 'balance' ? 'Steadier' : 'Stronger'} than in ${sinceMonth(change)}`;
  }
  if (change.direction === 'down') return 'Lower this time';
  return 'Holding steady';
}

function progressDelta(change: MovementProfileV2ProgressChangeDomain): string {
  const since = sinceMonth(change);
  if (change.direction === 'steady') return `Holding steady since ${since}`;
  const sign = change.direction === 'up' ? '+' : '−';
  const match = change.caption.match(/(?:Up|Down)\s+([\d.]+)\s*(.*)/i);
  return match ? `${sign}${match[1]} ${match[2]} since ${since}` : `${change.caption} since ${since}`;
}

function currentMetricValue(metric: string): string {
  return metric.match(/[\d.]+/)?.[0] ?? metric;
}

function currentMetricUnit(domain: MovementProfileV2Domain): string {
  return domain === 'balance' ? 'sec best hold' : 'rises in 30 sec';
}

function sinceMonth(change: MovementProfileV2ProgressChangeDomain): string {
  const iso = change.series[0]?.atIso;
  if (!iso) return 'baseline';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? 'baseline'
    : new Intl.DateTimeFormat('en', { month: 'long' }).format(date);
}

function formatAxisValue(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function monthKey(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : `${date.getFullYear()}-${date.getMonth()}`;
}

function formatChartDate(iso: string, includeDay: boolean): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'CHECK-UP';
  return new Intl.DateTimeFormat('en', includeDay
    ? { month: 'short', day: 'numeric' }
    : { month: 'short' }).format(date).toUpperCase();
}

// Details and history share one disclosure so the main Progress story has a
// single quiet exit instead of competing links and archive controls.
function MovementProfileV2HistoryCard({
  history,
  onViewProfile,
}: {
  history: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>['officialHistory'];
  onViewProfile?: (sourceCheckUpId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const countLabel = `${history.length} ${history.length === 1 ? 'check-up' : 'check-ups'} saved on this device`;
  const shortCountLabel = `${history.length} saved`;

  return (
    <View style={styles.historyDisclosureCard}>
      <Pressable
        style={({ pressed }) => [styles.historyDisclosure, pressed && styles.pressed]}
        onPress={() => setExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Hide' : 'See'} check-up details and history. ${countLabel}.`}
        accessibilityHint={expanded ? 'Collapses your saved check-ups' : 'Expands your saved check-ups'}
      >
        <Text style={styles.historyDisclosureLabel}>
          {expanded ? 'Hide check-up history' : 'Check-up details and history'}
        </Text>
        <View style={styles.historyDisclosureValueGroup}>
          <Text style={styles.historyDisclosureValue}>{shortCountLabel}</Text>
          <Text style={[styles.historyDisclosureChevron, expanded && styles.historyDisclosureChevronOpen]}>›</Text>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.historyList}>
          {history.map((entry, index) => (
            <MovementProfileV2HistoryRow
              key={entry.id}
              entry={entry}
              showDivider={index > 0}
              onPress={onViewProfile ? () => onViewProfile(entry.id) : undefined}
            />
          ))}
        </View>
      ) : null}
    </View>
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
        <ProgressPictogram size={20} color={colors.accent} />
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
  onStartCheckUp?: () => void;
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
      body: `${BRAND.appName} keeps the private Movement Check-Up unavailable while your Gentle Start safety gate is active.`,
    };
  }
  if (reason === 'journey_completed') {
    return {
      title: 'Your 12-week check-ups are complete',
      body: 'Your baseline, week-4, week-8 and week-12 results remain saved here for review.',
    };
  }
  return {
    title: 'Your next check-up is not due yet',
    body: `${BRAND.appName} uses the same official check-up at each four-week checkpoint so your comparisons stay meaningful.`,
  };
}

function progressDomainTitle(domain: MovementProfileV2Domain, fallback: string): string {
  if (domain === 'strength_power') return 'Strength';
  if (domain === 'balance') return 'Balance';
  return fallback;
}

function ProgressPictogram({
  size,
  color,
}: {
  size: number;
  color: string;
}) {
  const s = iconStroke(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5.2} y={5.8} width={13.6} height={13.2} rx={2.2} {...s} />
      <Path d="M5.2 9.8 H18.8" {...s} />
      <Path d="M8.5 4.2 V7.1" {...s} />
      <Path d="M15.5 4.2 V7.1" {...s} />
      <Path d="M8.8 13.3 H10.2" {...s} />
      <Path d="M12.9 13.3 H15.1" {...s} />
      <Path d="M8.8 16.2 H10.2" {...s} />
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
    gap: spacing.xxl,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontFamily: fonts.serifRegular,
    fontSize: 40,
    letterSpacing: -0.8,
    lineHeight: 46,
  },
  compactTitle: { fontSize: 36, lineHeight: 42 },
  headerIconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  profileCard: {
    backgroundColor: 'transparent',
    gap: spacing.xxl,
  },
  domainTabs: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  domainTab: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  domainTabText: {
    ...type.cardCaption,
    color: colors.textTertiary,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  domainTabTextActive: {
    color: colors.accentDeep,
  },
  domainTabTrack: {
    width: '100%',
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
  },
  domainTabTrackActive: {
    backgroundColor: colors.accentDeep,
  },
  progressHero: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...type.cardCaption,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  progressHeroTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifRegular,
    fontSize: 34,
    letterSpacing: -0.4,
    lineHeight: 40,
  },
  progressDelta: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 350,
  },
  chartSection: {
    gap: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  chartTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  chartUnit: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  chart: {
    aspectRatio: 360 / 214,
    width: '100%',
  },
  metricSummary: {
    gap: spacing.xs,
  },
  summaryMetric: {
    minHeight: 52,
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  summaryMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  summaryMetricLabel: {
    ...type.cardBody,
    color: colors.textSecondary,
    flex: 1,
    minWidth: 0,
  },
  summaryMetricSupportingText: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryMetricValue: {
    color: colors.textPrimary,
    flexShrink: 0,
    fontFamily: fonts.sansMedium,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'right',
  },
  summaryMetricValueAccent: {
    color: colors.accentDeep,
  },
  summaryMetricUnit: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyProgressCard: {
    minHeight: 196,
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
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
  changeSupport: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    paddingTop: spacing.md,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  historyDisclosureCard: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderHairline,
    borderRadius: radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
  },
  historyDisclosure: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  historyDisclosureLabel: {
    ...type.cardBody,
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.sansMedium,
  },
  historyDisclosureValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyDisclosureValue: {
    ...type.cardBody,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  historyDisclosureChevron: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 24,
    lineHeight: 28,
    transform: [{ rotate: '0deg' }],
  },
  historyDisclosureChevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  historyList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingHorizontal: spacing.lg,
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
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  chevron: { ...type.h2, color: colors.textSecondary },
  pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
});
