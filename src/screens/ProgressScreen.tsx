import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  EmptyState,
  Eyebrow,
  HealthMetricRow,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionHeader,
  SettingsIconButton,
  StatusBadge,
} from '../components/ui';
import type { MovementBlock, MovementBlockReport, TrainingSessionCompletion } from '../adherence';
import {
  getBlockReportSummaries,
  getDomainProgressCards,
  getLadderProgressCards,
  getLatestCheckUpSummary,
  getRetestDueSummary,
  getRetestHistory,
} from '../haleFlow';
import type { StoredCheckUp } from '../history';
import type { Domain } from '../scoring';
import type { LadderProgress } from '../training';
import { colors, radius, spacing, type } from '../theme';

const DOMAIN_LABEL: Record<Domain, string> = {
  strength: 'Strength / Power',
  balance: 'Balance',
  mobility: 'Mobility',
};

export function ProgressScreen({
  history,
  activeBlock,
  blocks,
  reports,
  completions,
  ladderProgressById = {},
  today,
  onBeginCheckUp,
  onStartRetest,
  onViewLatest,
  onViewReport,
  onOpenSettings,
}: {
  history: readonly StoredCheckUp[];
  activeBlock?: MovementBlock | null;
  blocks: readonly MovementBlock[];
  reports: readonly MovementBlockReport[];
  completions: readonly TrainingSessionCompletion[];
  ladderProgressById?: Record<string, LadderProgress>;
  today: string;
  onBeginCheckUp: () => void;
  onStartRetest: () => void;
  onViewLatest: () => void;
  onViewReport: (blockId: string) => void;
  onOpenSettings: () => void;
}) {
  const latest = getLatestCheckUpSummary(history);
  const domainCards = getDomainProgressCards(history);
  const ladderCards = getLadderProgressCards(ladderProgressById);
  const blockReports = getBlockReportSummaries({ blocks, reports, completions });
  const retestHistory = getRetestHistory(history);
  const retest = getRetestDueSummary({ activeBlock, today, hasBaseline: history.length > 0 });
  const completedSessions = completions.filter((completion) =>
    completion.sessionType === 'starter' || completion.sessionType === 'standard' || completion.sessionType === 'restart'
  ).length;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Movement Progress</Text>
          <Text style={styles.subtitle}>See how your strength, balance, and mobility are changing over time.</Text>
        </View>
        <SettingsIconButton onPress={onOpenSettings} />
      </View>

      {!latest ? (
        <EmptyState
          title="Complete your first Movement Check-Up to see your baseline."
          body="Hale will use it to build your 4-week block and start tracking progress."
          actionLabel="Start Movement Check-Up"
          onAction={onBeginCheckUp}
        />
      ) : (
        <>
          <Card>
            <View style={styles.latestHead}>
              <View style={styles.headerCopy}>
                <Eyebrow>Latest Movement Check-Up</Eyebrow>
                <Text style={styles.cardTitle}>{latest.dateLabel}</Text>
                <Text style={styles.cardBody}>{latest.focusTitle}</Text>
              </View>
              <StatusBadge label="Saved" tone="good" />
            </View>
            <View style={styles.bandGrid}>
              {(['strength', 'balance', 'mobility'] as Domain[]).map((domain) => (
                <View key={domain} style={styles.bandCard}>
                  <Text style={styles.bandLabel}>{DOMAIN_LABEL[domain]}</Text>
                  <Text style={styles.bandValue}>{bandLabel(latest.bands[domain])}</Text>
                </View>
              ))}
            </View>
            <SecondaryButton title="View latest" onPress={onViewLatest} style={styles.viewLatestButton} />
          </Card>

          <View style={styles.metricGrid}>
            <SmallMetric label="Check-ups" value={`${history.length}`} detail={history.length > 1 ? 'comparison ready' : 'baseline saved'} />
            <SmallMetric label="Hale Sessions" value={`${completedSessions}`} detail="in your history" />
          </View>

          <Card>
            <SectionHeader title="Domain progress" />
            <View style={styles.domainList}>
              {domainCards.map((card) => (
                <View key={card.domain} style={styles.domainCard}>
                  <View style={styles.domainHead}>
                    <Text style={styles.domainTitle}>{card.title}</Text>
                    <StatusBadge label={trendLabel(card.trend)} tone={card.trend === 'improved' ? 'good' : 'neutral'} />
                  </View>
                  <Text style={styles.metricLine}>{card.metric}</Text>
                  <Text style={styles.cardBody}>{card.body}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <SectionHeader title="Movement ladder progress" />
            {ladderCards.length > 0 ? (
              ladderCards.map((card) => (
                <HealthMetricRow
                  key={card.ladderId}
                  label={card.title}
                  value={card.levelName}
                  status={card.status}
                />
              ))
            ) : (
              <Text style={styles.cardBody}>Complete a few Hale Sessions to see your movement ladder progress.</Text>
            )}
          </Card>

          <Card>
            <SectionHeader title="4-week block reports" />
            {blockReports.length > 0 ? (
              blockReports.map((report) => (
                <View key={report.blockId} style={styles.reportRow}>
                  <View style={styles.headerCopy}>
                    <Text style={styles.reportTitle}>{report.dateRange}</Text>
                    <Text style={styles.cardBody}>{report.focus} · {report.sessions}</Text>
                    <Text style={styles.reportChange}>{report.mainChange}</Text>
                  </View>
                  <SecondaryButton title="View report" onPress={() => onViewReport(report.blockId)} style={styles.reportButton} />
                </View>
              ))
            ) : (
              <Text style={styles.cardBody}>Your first 4-week report appears after a re-test.</Text>
            )}
          </Card>

          <Card>
            <SectionHeader title="Re-test history" />
            {retestHistory.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>{entry.dateLabel}</Text>
                <View style={styles.historyBands}>
                  {(['strength', 'balance', 'mobility'] as Domain[]).map((domain) => (
                    <View key={domain} style={styles.historyBand}>
                      <Text style={styles.historyBandText}>{DOMAIN_LABEL[domain]}: {bandLabel(entry.bands[domain])}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </Card>

          <Card>
            <SectionHeader title={retest.title} />
            <Text style={styles.cardBody}>{retest.body}</Text>
            {retest.due && retest.ctaLabel ? (
              <PrimaryButton title={retest.ctaLabel} onPress={onStartRetest} style={styles.retestButton} />
            ) : null}
          </Card>
        </>
      )}
    </Screen>
  );
}

function SmallMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.smallMetric}>
      <Text style={styles.smallMetricLabel}>{label}</Text>
      <Text style={styles.smallMetricValue}>{value}</Text>
      <Text style={styles.smallMetricDetail}>{detail}</Text>
    </View>
  );
}

function bandLabel(band: 'starting_point' | 'building' | 'strong' | 'pending'): string {
  if (band === 'strong') return 'Strong';
  if (band === 'building') return 'Building';
  if (band === 'starting_point') return 'Starting point';
  return 'Starting point';
}

function trendLabel(trend: string): string {
  if (trend === 'improved') return 'Building';
  if (trend === 'held_steady') return 'Held steady';
  if (trend === 'lower') return 'Adjusted';
  return 'Starting point';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { ...type.display },
  subtitle: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm },
  latestHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { ...type.h2, marginTop: spacing.sm },
  cardBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  bandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  bandCard: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 82,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.bgSage,
  },
  bandLabel: { ...type.caption, color: colors.sageDeep },
  bandValue: { ...type.h3, marginTop: spacing.xs },
  viewLatestButton: { marginTop: spacing.lg, shadowOpacity: 0 },
  metricGrid: { flexDirection: 'row', gap: spacing.md },
  smallMetric: {
    flex: 1,
    minHeight: 112,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  smallMetricLabel: { ...type.label },
  smallMetricValue: { ...type.metricSmall, color: colors.accentDeep, marginTop: spacing.sm },
  smallMetricDetail: { ...type.caption, marginTop: spacing.xs },
  domainList: { marginTop: spacing.md },
  domainCard: {
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  domainHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  domainTitle: { ...type.h3, flex: 1 },
  metricLine: { ...type.bodySmall, color: colors.accentDeep, marginTop: spacing.sm },
  reportRow: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  reportTitle: { ...type.h3 },
  reportChange: { ...type.caption, color: colors.sageDeep, marginTop: spacing.sm },
  reportButton: { minWidth: 112, shadowOpacity: 0 },
  historyRow: {
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  historyDate: { ...type.h3 },
  historyBands: { gap: spacing.xs, marginTop: spacing.sm },
  historyBand: { minHeight: 26, justifyContent: 'center' },
  historyBandText: { ...type.caption },
  retestButton: { marginTop: spacing.lg },
});
