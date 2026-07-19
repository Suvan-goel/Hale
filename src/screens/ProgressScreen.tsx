import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NoticeCard, PrimaryButton, Screen } from '../components/ui';
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

// The fixed MVP journey: baseline, week 4, week 8, week 12 (CLAUDE.md). The
// count of completed measurements gives Progress a sense of place across the
// whole 12 weeks, so the first month never reads as an empty tab.
const CHECKUP_TOTAL = 4;

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

// The empty state now carries a direct Start action (see the 2026-07-18
// decision reversing "Home owns the action"): the same goAssessment handler
// Home uses, so there is no second code path — just a second, closer door.
function ProgressEmptyState({ onStartCheckUp }: { onStartCheckUp?: () => void }) {
  return (
    <View style={styles.emptyProgress}>
      <ProgressJourneyCue completed={0} total={CHECKUP_TOTAL} />
      <View style={styles.emptyProgressHero}>
        <Text style={styles.emptyProgressEyebrow}>YOUR RESULTS</Text>
        <Text style={styles.emptyProgressTitle}>Your results will begin here</Text>
        <Text style={styles.emptyProgressBody}>
          Complete your first Movement Check-Up to set your Strength and Balance baseline. You’ll
          compare the same check-up at weeks 4, 8 and 12.
        </Text>
      </View>
      {onStartCheckUp ? (
        <PrimaryButton
          title="Start Movement Check-Up"
          onPress={onStartCheckUp}
          style={styles.emptyProgressAction}
        />
      ) : null}
    </View>
  );
}

// The 12-week measurement cadence as a quiet 4-segment track, matching Plan's
// phase track so the two journey surfaces read as one system. It reports how
// many comparable check-ups exist — measurement status, never programme
// structure (Plan still owns that).
function ProgressJourneyCue({
  completed,
  total,
  nextStep,
}: {
  completed: number;
  total: number;
  nextStep?: string;
}) {
  const safeCompleted = Math.max(0, Math.min(completed, total));
  return (
    <View
      style={styles.journeyCue}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Movement Check-Ups. ${safeCompleted} of ${total} complete.${
        nextStep ? ` ${nextStep}` : ''
      }`}
    >
      <View style={styles.journeyCueHeader}>
        <Text style={styles.eyebrow}>MOVEMENT CHECK-UPS</Text>
        <Text style={styles.journeyCueCount}>{safeCompleted} of {total}</Text>
      </View>
      <View style={styles.journeyTrack}>
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[styles.journeySegment, index < safeCompleted && styles.journeySegmentComplete]}
          />
        ))}
      </View>
      {nextStep ? <Text style={styles.journeyNextStep}>{nextStep}</Text> : null}
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
      if (onStartCheckUp) return <ProgressEmptyState onStartCheckUp={onStartCheckUp} />;
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

// The reference-led Progress experience: a journey cue for place across the 12
// weeks, then both measured domains stacked in one scroll — no hidden tabs —
// each with its verdict headline first and the evidence grouped beneath it.
// The "what's next" sentence for a not-yet-comparable check-up lives ONCE on
// the cue, never repeated under each domain.
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
  const readiness: MovementProfileV2ProgressChangeReadiness | null = viewModel.change
    ? null
    : viewModel.changeReadiness;
  const completed = Math.min(CHECKUP_TOTAL, viewModel.officialHistory.length);
  const nextStep =
    readiness && readiness.status !== 'ready' ? readiness.body : undefined;

  return (
    <View style={styles.profile}>
      <ProgressJourneyCue completed={completed} total={CHECKUP_TOTAL} nextStep={nextStep} />
      <View style={styles.domainStack}>
        {availableDomains.map((summary) => (
          <DomainSection
            key={summary.domain}
            summary={summary}
            change={viewModel.change?.domains.find((domain) => domain.domain === summary.domain)}
            dateLabel={hero.dateLabel}
          />
        ))}
      </View>
    </View>
  );
}

function DomainSection({
  summary,
  change,
  dateLabel,
}: {
  summary: MovementProfileV2ProgressDomainSummary;
  change?: MovementProfileV2ProgressChangeDomain;
  dateLabel: string;
}) {
  const domain = summary.domain;
  const hasTrend = (change?.series.length ?? 0) > 1;

  return (
    <View style={styles.domainSection}>
      {/* The movement name is the heading's caption — it balances the rule
          and saves a whole text layer above the evidence. */}
      <View style={styles.domainHeading}>
        <Text style={styles.eyebrow}>
          {progressDomainTitle(domain, summary.title).toUpperCase()}
        </Text>
        <View style={styles.headingRule} />
        <Text style={styles.domainHeadingCaption} numberOfLines={1}>
          {movementTitle(domain)}
        </Text>
      </View>

      {/* One dominant type moment per domain: the serif verdict. The delta is
          its quiet subordinate line, and the numbers themselves live in the
          trend below — no second competing big number. */}
      <View style={styles.verdictBlock}>
        <Text style={styles.verdict}>{progressHeroTitle(domain, change)}</Text>
        {change ? <Text style={styles.delta}>{changeDeltaLine(change)}</Text> : null}
      </View>

      {/* Evidence sits directly on the page background like every section on
          Home and Plan — Pearl's tab pages are flat editorial surfaces. */}
      {hasTrend && change ? (
        <DomainTrend domain={domain} change={change} />
      ) : (
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Current level</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>{currentMetricValue(summary.metric)}</Text>
            <Text style={styles.statUnit}>{currentMetricUnit(domain)}</Text>
          </View>
          <Text style={styles.statMeta}>{`Latest check-up · ${dateLabel}`}</Text>
        </View>
      )}
      {change?.supportCopy ? (
        <Text style={styles.changeSupport}>{change.supportCopy}</Text>
      ) : null}
    </View>
  );
}

/* ----------------------------------------------------------------------------
 * Trend — a before→after dot timeline, not a value-encoded line. Across the 12
 * weeks there are only ever 2–4 comparable measurements; a filled line chart
 * with an auto-fit y-scale drew a slope that did not match the real change. The
 * magnitude now lives entirely in the numbers ("18 → 21", "+3 rises"), and the
 * dots are an evenly spaced timeline connected by a neutral hairline. All
 * labels are native Text so they respect the system font-size setting (SVG
 * text does not).
 * ------------------------------------------------------------------------- */

function DomainTrend({
  domain,
  change,
}: {
  domain: MovementProfileV2Domain;
  change: MovementProfileV2ProgressChangeDomain;
}) {
  const series = change.series;
  if (series.length < 2) return null;

  const values = series.map((point) => point.value);
  const includeDay =
    new Set(series.map((point) => monthKey(point.atIso))).size < series.length;
  const chartUnit = domain === 'balance' ? 'Seconds' : 'Rises';
  const accessibilityLabel =
    `${movementTitle(domain)}, ${chartUnit}. ` +
    `${progressDomainTitle(domain, domain)} changed from ${values[0]} to ${values[values.length - 1]} ` +
    `across ${series.length} comparable check-ups.`;
  // Dots are centered in equal columns, so the first sits half a column from
  // the left edge and the last half a column from the right. One baseline
  // spanning exactly between them (behind the opaque dots) reads as a single
  // continuous line with no per-column seams, whatever the values' text size.
  const edgeInset: `${number}%` = `${50 / series.length}%`;

  return (
    <View style={styles.trend} accessible accessibilityLabel={accessibilityLabel}>
      <View style={styles.trendValuesRow}>
        {series.map((point, index) => (
          <Text
            key={point.atIso}
            style={[
              styles.trendValue,
              index === series.length - 1 && styles.trendValueLatest,
            ]}
            numberOfLines={1}
          >
            {formatAxisValue(point.value)}
          </Text>
        ))}
      </View>
      <View style={styles.trendDotsRow}>
        <View style={[styles.trendBaseline, { left: edgeInset, right: edgeInset }]} />
        {series.map((point, index) => (
          <View key={point.atIso} style={styles.trendDotCell}>
            {index === series.length - 1 ? (
              <View style={styles.trendDotLatestRing}>
                <View style={styles.trendDotLatestCore} />
              </View>
            ) : (
              <View style={styles.trendDot} />
            )}
          </View>
        ))}
      </View>
      <View style={styles.trendDatesRow}>
        {series.map((point) => (
          <Text key={point.atIso} style={styles.trendDate} numberOfLines={1}>
            {formatChartDate(point.atIso, includeDay)}
          </Text>
        ))}
      </View>
    </View>
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

// The plain-language change line, derived directly from the view model's
// caption and direction (no fragile capture-group reparse). The up headline
// already names the month ("Stronger than in April"), so its delta stays bare;
// the down headline doesn't, so its delta carries the "since" context.
function changeDeltaLine(change: MovementProfileV2ProgressChangeDomain): string {
  const since = sinceMonth(change);
  if (change.direction === 'steady') return `Holding steady since ${since}`;
  const sign = change.direction === 'up' ? '+' : '−';
  const magnitude = change.caption.replace(/^(Up|Down)\s+/i, '');
  return change.direction === 'up'
    ? `${sign}${magnitude}`
    : `${sign}${magnitude} since your ${since} check-up`;
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
        style={({ pressed }) => [styles.historyDisclosure, pressed && styles.disclosurePressed]}
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
    gap: spacing.xxxl,
  },
  profile: {
    gap: spacing.xxxl,
  },
  domainStack: {
    // Generous separation so each domain reads as its own story.
    gap: spacing.huge,
  },
  domainSection: {
    // Roomy internal rhythm so the heading, verdict, and trend each read as
    // their own beat rather than one dense block.
    gap: spacing.xxl,
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
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.3,
  },
  delta: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 350,
  },
  // Journey cue — the 12-week measurement cadence, matching Plan's phase track.
  // Stretches full width so its segment track fills the row even inside the
  // centered empty state (which otherwise shrinks children to content width).
  journeyCue: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  journeyCueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  journeyCueCount: {
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  journeyTrack: { flexDirection: 'row', gap: spacing.xs },
  journeySegment: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
  },
  journeySegmentComplete: { backgroundColor: colors.accentGold },
  journeyNextStep: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    maxWidth: 380,
  },
  // Trend — before→after dot timeline (native views + Text, no SVG). Three
  // aligned rows (values, dots, dates): keeping the numbers off the dots' row
  // means their text size can never shift a dot out of line.
  trend: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  trendValuesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  trendDatesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trendValue: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 22,
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
  },
  trendValueLatest: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 26,
    lineHeight: 30,
  },
  trendDotsRow: {
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // One neutral baseline behind the dots — a timeline, never a value-encoded
  // slope. It spans first-dot centre to last-dot centre (left/right insets set
  // inline from the point count); the opaque dots sit on top of it.
  trendBaseline: {
    position: 'absolute',
    top: 8.25,
    height: 1.5,
    backgroundColor: colors.border,
  },
  trendDotCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: colors.accentDeep,
  },
  trendDotLatestRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.8,
    borderColor: colors.accentDeep,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendDotLatestCore: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.accentDeep,
  },
  trendDate: {
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
    gap: spacing.xxl,
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
  emptyProgressAction: {
    alignSelf: 'stretch',
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
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
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
  // The app-wide disclosure treatment (shared with the Clarity card's basis
  // toggle): dark label left, bare accent chevron right, no filled well —
  // affordance comes from the pressed background, not resting chrome.
  historyDisclosureChevron: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 20,
    lineHeight: 24,
    transform: [{ rotate: '0deg' }],
  },
  historyDisclosureChevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  disclosurePressed: {
    backgroundColor: colors.bgElevated,
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
