import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { NoticeCard, Screen } from '../components/ui';
import { ClarityProgressCard } from '../components/ClarityProgressCard';
import { PageHeader } from '../components/PageHeader';
import {
  type MovementProfileV2ProgressChangeDomain,
  type MovementProfileV2ProgressChangeReadiness,
  type MovementProfileV2ProgressDomainSummary,
  type MovementProfileV2ProgressViewModel,
} from '../pearlFlow/movementProfileV2ProgressViewModel';
import { type MovementProfileV2Domain } from '../movementProfileV2/viewModel';
import type { OfficialCheckUpBlockedReason } from '../programme';
import type { ClarityTrendViewModel } from '../pearlFlow/clarityTrend';
import { colors, fonts, radius, spacing, type } from '../theme';

import { BRAND } from '../brand';

export function ProgressScreen({
  onStartCheckUp,
  movementProfileV2Progress,
  onViewMovementProfileV2Profile,
  clarityTrend,
  checkUpBlockedReason,
  onOpenSettings,
}: ProgressScreenProps) {
  const progress = movementProfileV2Progress ?? null;
  const checkUpHistory =
    progress?.status === 'ready' && progress.officialHistory.length >= 1
      ? progress.officialHistory
      : null;

  return (
    <Screen contentStyle={styles.screenContent}>
      <PageHeader title="Progress" onOpenSettings={onOpenSettings} />

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
    <View style={styles.emptyProgress}>
      <View style={styles.emptyProgressHero}>
        <Text style={styles.emptyProgressEyebrow}>YOUR RESULTS</Text>
        <Text style={styles.emptyProgressTitle}>Your results will begin here</Text>
        <Text style={styles.emptyProgressBody}>
          Complete your first Movement Check-Up to set your Strength and Balance baseline. You’ll
          compare the same check-up at weeks 4, 8 and 12.
        </Text>
      </View>
    </View>
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
      <NoticeCard
        title="Check-up results need attention"
        body={`Your saved check-up data is still on this phone, but ${BRAND.appName} cannot safely show it here yet.`}
      />
    );
  }

  if (viewModel.status !== 'ready') {
    if (viewModel.status === 'no_profile') {
      if (onStartCheckUp) return <ProgressEmptyState />;
      const blocked = blockedCheckUpCopy(checkUpBlockedReason);
      return <NoticeCard title={blocked.title} body={blocked.body} />;
    }
    const primary = viewModel.actions[0];
    return (
      <NoticeCard
        title={viewModel.recovery.title}
        body={viewModel.recovery.body}
        actionLabel={primary?.label}
        onPress={primary?.id === 'start_movement_checkup' ? onStartCheckUp : undefined}
      />
    );
  }

  return <MovementProfileCard viewModel={viewModel} />;
}

// The reference-led Progress experience: both measured domains stacked in one
// scroll — no hidden tabs — each with its verdict headline first and the
// evidence (chart + current level) grouped beneath it.
function MovementProfileCard({
  viewModel,
}: {
  viewModel: Extract<MovementProfileV2ProgressViewModel, { status: 'ready' }>;
}) {
  const { hero } = viewModel;
  const availableDomains = hero.domains.filter(
    (domain) => domain.domain === 'strength_power' || domain.domain === 'balance'
  );
  if (availableDomains.length === 0) return null;
  const readiness = viewModel.change ? null : viewModel.changeReadiness;

  return (
    <View style={styles.domainStack}>
      {availableDomains.map((summary) => (
        <DomainSection
          key={summary.domain}
          summary={summary}
          change={viewModel.change?.domains.find((domain) => domain.domain === summary.domain)}
          readiness={readiness}
          dateLabel={hero.dateLabel}
        />
      ))}
    </View>
  );
}

function DomainSection({
  summary,
  change,
  readiness,
  dateLabel,
}: {
  summary: MovementProfileV2ProgressDomainSummary;
  change?: MovementProfileV2ProgressChangeDomain;
  readiness: MovementProfileV2ProgressChangeReadiness | null;
  dateLabel: string;
}) {
  const domain = summary.domain;
  const hasChart = (change?.series.length ?? 0) > 1;
  const deltaText = change
    ? progressDelta(change)
    : readiness && readiness.status !== 'ready'
      ? readiness.body
      : 'Your first comparable result is saved.';

  return (
    <View style={styles.domainSection}>
      {/* The movement name is the heading's caption — it balances the rule
          and saves a whole text layer above the chart. */}
      <View style={styles.domainHeading}>
        <Text style={styles.eyebrow}>
          {progressDomainTitle(domain, summary.title).toUpperCase()}
        </Text>
        <View style={styles.headingRule} />
        <Text style={styles.domainHeadingCaption} numberOfLines={1}>
          {movementTitle(domain)}
        </Text>
      </View>

      <View style={styles.verdictBlock}>
        <Text style={styles.verdict}>{progressHeroTitle(domain, change)}</Text>
        <Text style={styles.delta}>{deltaText}</Text>
      </View>

      {/* Evidence sits directly on the page background like every section on
          Home and Plan — Pearl's tab pages are flat editorial surfaces, and
          the only filled container on Progress is the Clarity card. */}
      <View style={styles.evidence}>
        {hasChart && change ? (
          <>
            <ProgressChart domain={domain} change={change} />
            <View style={styles.evidenceDivider} />
          </>
        ) : null}
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Current level</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>{currentMetricValue(summary.metric)}</Text>
            <Text style={styles.statUnit}>{currentMetricUnit(domain)}</Text>
          </View>
          <Text style={styles.statMeta}>{`Latest check-up · ${dateLabel}`}</Text>
        </View>
        {change?.supportCopy ? (
          <Text style={styles.changeSupport}>{change.supportCopy}</Text>
        ) : null}
      </View>
    </View>
  );
}

/* ----------------------------------------------------------------------------
 * Chart — personal trend with directly labelled endpoints. No y-axis to read:
 * the start and latest values sit on the chart itself as native Text, so they
 * respect the system font-size setting (SVG text does not).
 * ------------------------------------------------------------------------- */

const CHART_W = 360;
const CHART_H = 150;
// Inset keeps the 9px latest-point ring inside the viewBox on both edges.
const PLOT_LEFT = 12;
const PLOT_RIGHT = 348;
const PLOT_TOP = 34;
const PLOT_BOTTOM = 132;
const PLOT_MID_Y = (PLOT_TOP + PLOT_BOTTOM) / 2;

function ProgressChart({
  domain,
  change,
}: {
  domain: MovementProfileV2Domain;
  change: MovementProfileV2ProgressChangeDomain;
}) {
  const series = change.series;
  if (series.length < 2) return null;

  const values = series.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = rawMax - rawMin;
  const pad = spread > 0 ? spread * 0.45 : Math.max(1, rawMax * 0.15);
  const min = rawMin - pad;
  const max = rawMax + pad;
  const points = values.map((value, index) => ({
    x: PLOT_LEFT + (index / (values.length - 1)) * (PLOT_RIGHT - PLOT_LEFT),
    y: PLOT_BOTTOM - ((value - min) / (max - min)) * (PLOT_BOTTOM - PLOT_TOP),
  }));
  const first = points[0];
  const last = points[points.length - 1];
  const linePath = straightChartPath(points);
  const areaPath = `${linePath} L ${last.x} ${PLOT_BOTTOM} L ${first.x} ${PLOT_BOTTOM} Z`;
  const includeDay =
    new Set(series.map((point) => monthKey(point.atIso))).size < series.length;
  const chartUnit = domain === 'balance' ? 'Seconds' : 'Rises';
  const accessibilityLabel =
    `${movementTitle(domain)}, ${chartUnit}. ` +
    `${progressDomainTitle(domain, domain)} changed from ${values[0]} to ${values[values.length - 1]} ` +
    `across ${series.length} comparable check-ups.`;

  return (
    <View style={styles.chartSection}>
      <View style={styles.chartPlot} accessible accessibilityLabel={accessibilityLabel}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`} fill="none">
          <Path
            d={`M ${PLOT_LEFT} ${PLOT_BOTTOM} H ${PLOT_RIGHT}`}
            stroke={colors.borderHairline}
            strokeWidth={1}
          />
          <Path d={areaPath} fill={colors.accentSoft} />
          <Path
            d={linePath}
            stroke={colors.accentDeep}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((point, index) => {
            const latest = index === points.length - 1;
            return latest ? (
              <React.Fragment key={`${point.x}-${point.y}`}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={9}
                  fill={colors.background}
                  stroke={colors.accentDeep}
                  strokeWidth={1.8}
                />
                <Circle cx={point.x} cy={point.y} r={4.6} fill={colors.accentDeep} />
              </React.Fragment>
            ) : (
              <Circle
                key={`${point.x}-${point.y}`}
                cx={point.x}
                cy={point.y}
                r={5.6}
                fill={colors.accentDeep}
              />
            );
          })}
        </Svg>
        <ChartPointLabel point={first} text={formatAxisValue(values[0])} anchor="start" />
        <ChartPointLabel
          point={last}
          text={formatAxisValue(values[values.length - 1])}
          anchor="end"
          emphasis
        />
      </View>
      <View style={styles.chartMonthRow}>
        {series.map((point, index) => (
          <ChartMonthLabel
            key={point.atIso}
            xPct={(points[index].x / CHART_W) * 100}
            anchor={index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle'}
            text={formatChartDate(point.atIso, includeDay)}
          />
        ))}
      </View>
    </View>
  );
}

function ChartPointLabel({
  point,
  text,
  anchor,
  emphasis = false,
}: {
  point: { x: number; y: number };
  text: string;
  anchor: 'start' | 'end';
  emphasis?: boolean;
}) {
  const xPct = (point.x / CHART_W) * 100;
  const yPct = (point.y / CHART_H) * 100;
  const horizontal =
    anchor === 'start' ? { left: `${xPct}%` as const } : { right: `${100 - xPct}%` as const };
  // Points in the lower half take their label above the dot, and vice versa,
  // so labels never collide with the line for either trend direction.
  const vertical =
    point.y >= PLOT_MID_Y
      ? { bottom: `${100 - yPct}%` as const, marginBottom: spacing.md }
      : { top: `${yPct}%` as const, marginTop: spacing.md };
  return (
    <View pointerEvents="none" style={[styles.chartPointLabel, horizontal, vertical]}>
      <Text style={[styles.chartPointLabelText, emphasis && styles.chartPointLabelTextEmphasis]}>
        {text}
      </Text>
    </View>
  );
}

function ChartMonthLabel({
  xPct,
  anchor,
  text,
}: {
  xPct: number;
  anchor: 'start' | 'middle' | 'end';
  text: string;
}) {
  const positioning =
    anchor === 'start'
      ? { left: `${xPct}%` as const }
      : anchor === 'end'
        ? { right: `${100 - xPct}%` as const }
        : {
            left: `${xPct}%` as const,
            width: 84,
            marginLeft: -42,
            alignItems: 'center' as const,
          };
  return (
    <View style={[styles.chartMonthLabel, positioning]}>
      <Text style={styles.chartMonthText}>{text}</Text>
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
  if (!match) return `${change.caption} since ${since}`;
  // The up headline already names the month ("Stronger than in April"), so
  // the delta stays bare; the down headline doesn't, so its delta carries it.
  return change.direction === 'up'
    ? `${sign}${match[1]} ${match[2]}`
    : `${sign}${match[1]} ${match[2]} since your ${since} check-up`;
}

function currentMetricValue(metric: string): string {
  return metric.match(/[\d.]+/)?.[0] ?? metric;
}

function currentMetricUnit(domain: MovementProfileV2Domain): string {
  return domain === 'balance' ? 'sec best hold' : 'rises in 30 sec';
}

function movementTitle(domain: MovementProfileV2Domain): string {
  return domain === 'balance' ? 'One-leg balance' : '30-second chair stand';
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
  if (Number.isNaN(date.getTime())) return 'Check-up';
  return new Intl.DateTimeFormat('en-GB', includeDay
    ? { day: 'numeric', month: 'short' }
    : { month: 'short' }).format(date);
}

// Details and history share one disclosure so the main Progress story has a
// single quiet exit instead of competing links and archive controls. The label
// stays fixed while the chevron rotates: a moving label is disorienting.
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
    <View style={styles.historyCard}>
      <Pressable
        style={({ pressed }) => [styles.historyDisclosure, pressed && styles.pressed]}
        onPress={() => setExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Hide' : 'See'} check-up details and history. ${countLabel}.`}
        accessibilityHint={expanded ? 'Collapses your saved check-ups' : 'Expands your saved check-ups'}
      >
        <Text style={styles.historyDisclosureLabel}>Check-up details and history</Text>
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

interface ProgressScreenProps {
  onStartCheckUp?: () => void;
  movementProfileV2Progress?: MovementProfileV2ProgressViewModel | null;
  /** Opens the saved read-only results page (restored 2026-07-08). */
  onViewMovementProfileV2Profile?: (sourceCheckUpId: string) => void;
  clarityTrend?: ClarityTrendViewModel | null;
  checkUpBlockedReason?: OfficialCheckUpBlockedReason;
  onOpenSettings: () => void;
}

/** One reason-specific explanation per blocked check-up route, shared with the
 * root's blocked moment so she is always told the actual cause. */
export function blockedCheckUpCopy(reason?: OfficialCheckUpBlockedReason): {
  title: string;
  body: string;
} {
  if (reason === 'health_data_consent_required') {
    return {
      title: 'Your Movement Check-Up is off',
      body: `Health information saving is off on this device, so ${BRAND.appName} will not open or save a camera check-up. You can review this in Settings.`,
    };
  }
  if (reason === 'gentle_start_safety_gate') {
    return {
      title: 'Gentle Start is active',
      body: 'You can keep training with easier sessions. The Movement Check-Up stays unavailable while this safety setting is active.',
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

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    gap: spacing.xxl,
  },
  domainStack: {
    // Generous separation so each domain reads as its own story.
    gap: spacing.huge,
  },
  domainSection: {
    gap: spacing.lg,
  },
  domainHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.3,
  },
  headingRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  domainHeadingCaption: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
  verdictBlock: {
    gap: spacing.sm,
  },
  verdict: {
    color: colors.textPrimary,
    fontFamily: fonts.serifRegular,
    fontSize: 30,
    lineHeight: 37,
    letterSpacing: -0.3,
  },
  delta: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 350,
  },
  evidence: {
    gap: spacing.lg,
  },
  evidenceDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  chartSection: {
    gap: spacing.sm,
  },
  chartPlot: {
    aspectRatio: CHART_W / CHART_H,
    width: '100%',
  },
  chartPointLabel: {
    position: 'absolute',
  },
  chartPointLabelText: {
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 17,
    fontVariant: ['tabular-nums'],
  },
  chartPointLabelTextEmphasis: {
    color: colors.accentDeep,
    fontSize: 15,
    lineHeight: 19,
  },
  chartMonthRow: {
    height: 18,
  },
  chartMonthLabel: {
    position: 'absolute',
    top: 0,
  },
  chartMonthText: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  stat: {
    gap: spacing.xs,
  },
  statLabel: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  statValue: {
    color: colors.textPrimary,
    fontFamily: fonts.sansRegular,
    fontSize: 34,
    lineHeight: 40,
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 21,
  },
  statMeta: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  changeSupport: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  emptyProgress: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyProgressHero: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyProgressEyebrow: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  emptyProgressTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.serifRegular,
    fontSize: 37,
    lineHeight: 43,
    letterSpacing: -0.45,
    maxWidth: 380,
    textAlign: 'center',
  },
  emptyProgressBody: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0,
    maxWidth: 370,
    textAlign: 'center',
  },
  historyCard: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  historyDisclosure: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  historyDisclosureLabel: {
    ...type.cardBody,
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  historyDisclosureValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyDisclosureValue: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  historyDisclosureChevron: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 22,
    lineHeight: 26,
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
    minHeight: 72,
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
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
});
