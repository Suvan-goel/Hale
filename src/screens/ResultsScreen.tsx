/**
 * Results screen: beta home movement estimates first, then supporting measurements and trends.
 * Wellness-side language only: home estimates and repeatable patterns, never clinical claims.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { HeaderLogo } from '../components/HeaderLogo';
import { CheckUp } from '../checkup/types';
import { Card, HealthMetricRow, MaterialCard, PrimaryButton, Screen, SecondaryButton, StatusBadge } from '../components/ui';
import type { MovementAssessment } from '../adherence';
import { getAssessmentResultState } from '../haleFlow/assessmentResultState';
import { ExtraTrendPoint, MetricTrend, StoredCheckUp, computeTrends } from '../history';
import {
  CheckUpScore,
  DOMAIN_LABEL,
  DomainResult,
  selectFocusFromScore,
  type ScoreFocusSelection,
  type VersionedCheckUpScoreSnapshot,
} from '../scoring';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const DOMAIN_ICON: Record<string, string> = {
  strength: 'S',
  balance: 'B',
  mobility: 'M',
};

export function ResultsScreen({
  checkUp: _checkUp,
  history,
  onDone,
  onStartPlan,
  onRetake,
  extraTrendPoints = [],
  assessment,
  score,
  scoreSnapshot,
}: {
  checkUp: CheckUp;
  history: StoredCheckUp[];
  assessment?: MovementAssessment | null;
  score?: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  onDone: () => void;
  /** Build a training block from this check-up and begin it (present when there's a measured focus). */
  onStartPlan?: () => void;
  onRetake?: () => void;
  /** Weekly micro-check points to merge into the trend line. */
  extraTrendPoints?: ExtraTrendPoint[];
}) {
  const resultState = React.useMemo(() => getAssessmentResultState({ score: score ?? null, scoreSnapshot, assessment }), [assessment, score, scoreSnapshot]);
  const trends = React.useMemo(
    () => computeTrends(history, extraTrendPoints).filter((t) => t.points.length >= 2),
    [history, extraTrendPoints]
  );
  const measured = score?.domains.filter((d) => d.measured) ?? [];
  const focusSelection = React.useMemo(
    () => scoreSnapshot?.focusSelection ?? selectFocusFromScore(score, { activeFocusDomain: score?.weakestDomain }),
    [score, scoreSnapshot]
  );
  const focusDomain = focusSelection?.focusDomain ?? score?.weakestDomain ?? null;
  const focusLabel = focusDomain ? DOMAIN_LABEL[focusDomain] : null;
  const closelyMatched = focusSelection?.kind === 'exact_tie' || focusSelection?.kind === 'near_tie';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <HeaderLogo size={30} />
          <Text style={styles.title}>Your Movement Dashboard</Text>
        </View>
        <Text style={styles.subtitle}>
          Home movement estimates from today’s guided check-up. Small changes can reflect setup or day-to-day variation.
        </Text>
      </View>

      {resultState.canCreateBlock && focusLabel ? (
        <MaterialCard>
          <Text style={styles.focusLabel}>{closelyMatched ? 'Closely matched domains' : 'Suggested focus'}</Text>
          <Text style={styles.focusValue}>{closelyMatched ? tiedDomainLabels(focusSelection) : focusLabel}</Text>
          <Text style={styles.focusBody}>
            {closelyMatched
              ? `${focusLabel} is the suggested focus for this block because these home estimates were closely matched.`
              : 'This looks like a useful starting point for your next four-week training block.'}
          </Text>
        </MaterialCard>
      ) : (
        <MaterialCard>
          <Text style={styles.focusLabel}>Retake needed</Text>
          <Text style={styles.focusValue}>{resultState.recoveryTitle}</Text>
          <Text style={styles.focusBody}>
            {resultState.recoveryBody}
          </Text>
        </MaterialCard>
      )}

      <View style={styles.summaryGrid}>
        <SummaryTile label="Domains estimated" value={`${measured.length}/3`} />
        <SummaryTile label="Check-ups in history" value={`${history.length}`} />
      </View>

      {score ? (
        score.domains.map((d) => (
          <DomainCard
            key={d.domain}
            domain={d}
            isFocus={d.domain === focusDomain}
            isTied={closelyMatched && !!focusSelection?.tiedDomains.includes(d.domain)}
          />
        ))
      ) : (
        <Card>
          <Text style={styles.sectionTitle}>Stored result</Text>
          <Text style={styles.sectionSubtle}>
            This check-up was saved before Hale started storing versioned beta estimate snapshots, so its interpretation
            is unavailable.
          </Text>
        </Card>
      )}

      {trends.length > 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Trends</Text>
          <Text style={styles.sectionSubtle}>Small changes matter most when they repeat over time.</Text>
          {trends.map((t) => (
            <TrendRow key={t.key} trend={t} />
          ))}
        </Card>
      ) : (
        <Card>
          <Text style={styles.sectionTitle}>Trends</Text>
          <Text style={styles.sectionSubtle}>
            Come back for another check-up to start seeing your movement trends over time.
          </Text>
        </Card>
      )}

      <View style={styles.actions}>
        {onStartPlan && resultState.canCreateBlock ? (
          <>
            <PrimaryButton title="Create my 4-week block" onPress={onStartPlan} />
            <SecondaryButton title="Done" onPress={onDone} />
          </>
        ) : onRetake && resultState.canRetake ? (
          <>
            <PrimaryButton title="Retake Movement Check-Up" onPress={onRetake} />
            <SecondaryButton title="Done" onPress={onDone} />
          </>
        ) : (
          <PrimaryButton title="Done" onPress={onDone} />
        )}
      </View>
    </Screen>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function DomainCard({ domain, isFocus, isTied }: { domain: DomainResult; isFocus: boolean; isTied?: boolean }) {
  return (
    <Card style={isFocus ? styles.focusCard : undefined}>
      <View style={styles.domainHead}>
        <View style={styles.domainTitleRow}>
          <View style={styles.domainIcon}>
            <Text style={styles.domainIconText}>{DOMAIN_ICON[domain.domain]}</Text>
          </View>
          <Text style={styles.domainTitle}>{domain.label}</Text>
        </View>
        {isFocus ? <StatusBadge label="Suggested focus" tone="gold" /> : isTied ? <StatusBadge label="Closely matched" /> : null}
      </View>

      {domain.measured ? (
        <>
          <Text style={styles.age}>Home estimate: {domainBandLabel(domain)}</Text>
          <Text style={styles.estimateLabel}>{domainEstimateLabel(domain)}</Text>
        </>
      ) : (
        <Text style={styles.ageMuted}>Not estimated this time</Text>
      )}
      <Text style={styles.interp}>{domainInterpretation(domain)}</Text>
      <View style={styles.rows}>
        {domain.rows.map((r) => (
          <HealthMetricRow
            key={r.label}
            label={r.label}
            value={r.display}
            status={r.measured ? 'Estimated' : 'Not captured'}
          />
        ))}
      </View>
    </Card>
  );
}

function tiedDomainLabels(focusSelection: ScoreFocusSelection | null | undefined): string {
  if (!focusSelection) return '';
  return focusSelection.tiedDomains.map((domain) => DOMAIN_LABEL[domain]).join(' + ');
}

function domainBandLabel(domain: DomainResult): string {
  if (!domain.measured || !Number.isFinite(domain.ageLow) || !Number.isFinite(domain.ageHigh)) return 'Pending';
  const mid = (domain.ageLow + domain.ageHigh) / 2;
  if (mid <= 58) return 'Strong';
  if (mid <= 72) return 'Building';
  return 'Starting point';
}

function domainEstimateLabel(domain: DomainResult): string {
  if (!domain.measured || !Number.isFinite(domain.ageLow) || !Number.isFinite(domain.ageHigh)) return 'Home estimate pending';
  const low = Math.round(domain.ageLow);
  const high = Math.round(domain.ageHigh);
  if (domain.domain === 'strength') {
    return `Beta home estimate: age ${low}-${high}${domain.estimated ? ' (estimate)' : ''}`;
  }
  if (domain.domain === 'balance') return 'One-leg balance hold estimate';
  return 'Shoulder mobility estimate';
}

function domainInterpretation(domain: DomainResult): string {
  if (!domain.measured) return 'Your next Movement Check-Up can add another data point here.';
  if (domain.domain === 'strength') {
    return 'This beta estimate is based on chair-stand performance and is most useful when repeated over time.';
  }
  if (domain.domain === 'balance') {
    return 'This estimate is based on the balance hold captured today, not a safety assessment.';
  }
  return 'This estimate is based on the mobility movement captured today, not a formal range-of-motion assessment.';
}

function TrendRow({ trend }: { trend: MetricTrend }) {
  const values = trend.points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const delta = trend.delta ?? 0;
  const flat = Math.abs(delta) < 1e-9;
  const color = flat ? colors.textSecondary : colors.accentDeep;
  const latest = trend.points[trend.points.length - 1].value;
  const change = `${delta > 0 ? '+' : ''}${formatDelta(delta)} ${trend.unit}`;
  const points = buildPolyline(values, min, span);

  return (
    <View style={styles.trendRow}>
      <View style={styles.trendHeader}>
        <View>
          <Text style={styles.trendLabel}>{trend.label}</Text>
          <Text style={styles.trendMeta}>
            Latest {formatDelta(latest)} {trend.unit}
          </Text>
        </View>
        <View style={styles.trendDeltaWrap}>
          <Text style={[styles.trendDelta, { color }]}>{change}</Text>
          <Text style={styles.trendDeltaMeta}>{trendDeltaMeta(delta)}</Text>
        </View>
      </View>
      <Svg width={240} height={72} style={styles.chart}>
        <Polyline points="0,58 240,58" stroke={colors.divider} strokeWidth={1} fill="none" />
        <Polyline points="0,36 240,36" stroke={colors.divider} strokeWidth={1} fill="none" />
        <Polyline points={points} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {trend.points.map((p, i) => {
          const x = trend.points.length === 1 ? 120 : (i / (trend.points.length - 1)) * 224 + 8;
          const y = 58 - ((p.value - min) / span) * 44;
          return <Circle key={`${p.at}-${i}`} cx={x} cy={y} r={3.5} fill={i === trend.points.length - 1 ? color : colors.sage} />;
        })}
      </Svg>
    </View>
  );
}

function trendDeltaMeta(delta: number): string {
  if (Math.abs(delta) < 1e-9) return 'similar result';
  return delta > 0 ? 'recorded higher' : 'recorded lower';
}

function buildPolyline(values: number[], min: number, span: number): string {
  if (values.length === 1) return '8,58 232,58';
  return values
    .map((value, i) => {
      const x = (i / (values.length - 1)) * 224 + 8;
      const y = 58 - ((value - min) / span) * 44;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function formatDelta(value: number): string {
  const abs = Math.abs(value);
  return abs >= 10 ? value.toFixed(0) : value.toFixed(2);
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  title: { ...type.pageTitle, flexShrink: 1 },
  subtitle: { ...type.pageSubtitle },
  focusLabel: { ...type.label, color: colors.accentDeep },
  focusValue: { ...type.cardTitle, marginTop: spacing.sm },
  focusBody: { ...type.cardBody, marginTop: spacing.sm },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  summaryTile: {
    flex: 1,
    minWidth: 150,
    minHeight: 96,
    borderRadius: radius.card,
    padding: spacing.lg,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    ...shadow.card,
  },
  summaryValue: { ...type.cardTitle, fontVariant: ['tabular-nums'] },
  summaryLabel: { ...type.cardCaption, marginTop: spacing.xs },
  focusCard: { backgroundColor: colors.bgElevated },
  domainHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
  domainTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  domainIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainIconText: { ...type.label, color: colors.accentDeep },
  domainTitle: { ...type.cardTitle, flex: 1 },
  age: { ...type.cardRowTitle, color: colors.accentDeep, marginTop: spacing.lg },
  estimateLabel: { ...type.caption, color: colors.textSecondary, marginTop: spacing.xs },
  ageMuted: { ...type.cardBody, color: colors.textTertiary, marginTop: spacing.lg },
  interp: { ...type.cardBody, marginTop: spacing.sm },
  rows: { marginTop: spacing.lg },
  sectionTitle: { ...type.cardTitle },
  sectionSubtle: { ...type.cardBody, marginTop: spacing.sm },
  trendRow: {
    paddingTop: spacing.lg,
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md, flexWrap: 'wrap' },
  trendLabel: { ...type.cardRowTitle },
  trendMeta: { ...type.caption, color: colors.textTertiary, marginTop: 2 },
  trendDeltaWrap: { alignItems: 'flex-end' },
  trendDelta: { ...type.bodySmall, fontFamily: fonts.sansMedium, fontVariant: ['tabular-nums'] },
  trendDeltaMeta: { ...type.caption, color: colors.textTertiary, marginTop: 2 },
  chart: { marginTop: spacing.md, alignSelf: 'center' },
  actions: { gap: spacing.md },
});
