import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type {
  MovementBlockFocus,
  MovementDomain,
  MovementProfileV2BlockReport,
  MovementProfileV2ComparisonUnit,
  MovementProfileV2RetestComparisonDomain,
} from '../adherence';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { Card, PrimaryButton, Screen } from '../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

export function MovementProfileV2BlockReportScreen({
  report,
  onViewNextPlan,
  onDone,
}: {
  report: MovementProfileV2BlockReport;
  onViewNextPlan: () => void;
  onDone: () => void;
}) {
  const responsive = useResponsiveLayout();
  const comparisonRows = React.useMemo(() => comparisonRowsForReport(report), [report]);
  return (
    <Screen contentStyle={styles.screenContent}>
      <BackArrowButton accessibilityLabel="Back" onPress={onDone} />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <HeaderLogo size={30} />
          <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>
            {report.displayCopy.headline}
          </Text>
        </View>
        <Text style={styles.subtitle}>{report.displayCopy.body}</Text>
      </View>

      <Card style={styles.summaryCard}>
        <Text style={styles.kicker}>Block summary</Text>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.sessionsCompleted}</Text>
            <Text style={styles.statLabel}>planned sessions completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{report.scheduleSummary.trainingWeeks}</Text>
            <Text style={styles.statLabel}>training weeks</Text>
          </View>
        </View>
        <View style={styles.rule} />
        <Text style={styles.focusLine}>Completed focus: {focusLabel(report.priorSuggestedFocus)}</Text>
        <Text style={styles.focusLine}>Latest focus: {focusLabel(report.currentSuggestedFocus)}</Text>
      </Card>

      <Card style={styles.comparisonCard}>
        <Text style={styles.sectionTitle}>Previous and current</Text>
        <Text style={styles.sectionBody}>Hale shows raw values as previous and current results only.</Text>
        <View style={styles.comparisonRows}>
          {comparisonRows.map((row, index) => (
            <View
              key={row.id}
              style={[
                styles.comparisonRow,
                index === comparisonRows.length - 1 && styles.comparisonRowLast,
              ]}
            >
              <Text style={styles.comparisonTitle}>{row.title}</Text>
              {row.previous || row.current ? (
                <View style={styles.valueStack}>
                  {row.previous ? <Text style={styles.valueText}>{row.previous}</Text> : null}
                  {row.current ? <Text style={styles.valueText}>{row.current}</Text> : null}
                </View>
              ) : null}
              {row.note ? <Text style={styles.note}>{row.note}</Text> : null}
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.nextCard}>
        <Text style={styles.sectionTitle}>{report.displayCopy.nextPlanTitle}</Text>
        <Text style={styles.sectionBody}>{report.displayCopy.nextPlanBody}</Text>
      </Card>

      <PrimaryButton title={report.displayCopy.nextPlanCta} onPress={onViewNextPlan} />
    </Screen>
  );
}

function comparisonRowsForReport(report: MovementProfileV2BlockReport): Array<{
  id: MovementDomain;
  title: string;
  previous?: string;
  current?: string;
  note?: string;
}> {
  return [
    row('strength_power', report.comparison.domains.strength_power),
    row('balance', report.comparison.domains.balance),
    row('mobility', report.comparison.domains.mobility),
  ];
}

function row(id: MovementDomain, domain: MovementProfileV2RetestComparisonDomain) {
  return {
    id,
    title: domain.metricLabel,
    ...('previousValue' in domain && typeof domain.previousValue === 'number'
      ? { previous: `Previous: ${formatValue(domain.previousValue, domain.unit)}` }
      : {}),
    ...('currentValue' in domain && typeof domain.currentValue === 'number'
      ? { current: `Current: ${formatValue(domain.currentValue, domain.unit)}` }
      : {}),
    ...(domain.status === 'shown_separately' || domain.status === 'unavailable'
      ? { note: domain.note }
      : {}),
  };
}

function formatValue(value: number, unit: MovementProfileV2ComparisonUnit): string {
  const rounded = unit === 'reps' ? value : Math.round(value);
  if (unit === 'degrees') return `${rounded}°`;
  if (unit === 'seconds') return `${rounded} sec`;
  return `${rounded} reps`;
}

function focusLabel(focus: MovementBlockFocus): string {
  if (focus.kind === 'balanced') return 'Balanced';
  return domainLabel(focus.domain);
}

function domainLabel(domain: MovementDomain): string {
  if (domain === 'balance') return 'Balance';
  if (domain === 'mobility') return 'Mobility';
  return 'Strength / Power';
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 20,
  },
  header: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  title: {
    ...type.pageTitle,
    flexShrink: 1,
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    ...type.pageSubtitle,
    maxWidth: 360,
  },
  summaryCard: {
    gap: spacing.md,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  kicker: {
    ...type.label,
    color: colors.accentDeep,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  statLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  focusLine: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  comparisonCard: {
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  comparisonRows: {
    marginTop: spacing.sm,
  },
  comparisonRow: {
    gap: spacing.xs,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  comparisonRowLast: {
    borderBottomWidth: 0,
  },
  comparisonTitle: {
    ...type.cardBody,
    fontFamily: fonts.sansMedium,
    color: colors.textPrimary,
  },
  valueStack: {
    gap: 2,
  },
  valueText: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  note: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  nextCard: {
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  sectionTitle: {
    ...type.cardTitle,
    fontSize: 22,
    lineHeight: 28,
  },
  sectionBody: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
});
