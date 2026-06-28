import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader } from '../components/ui';
import type { MicroCheckSummaryViewModel } from '../haleFlow';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

export function MicroCheckSummaryScreen({
  summary,
  onDone,
}: {
  summary: MicroCheckSummaryViewModel;
  onDone: () => void;
}) {
  const responsive = useResponsiveLayout();
  const badge = summaryBadge(summary);
  const compact = responsive.isCompactPhone;
  return (
    <Screen contentStyle={styles.screenContent}>
      <ScreenHeader eyebrow={summary.eyebrow} title={summary.title} subtitle={summary.subtitle} />

      <Card style={styles.summaryCard}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetEyebrow}>Recorded today</Text>
          <Text style={styles.sheetTitle}>{badge}</Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.metricSection}>
          <Text style={styles.metricLabel}>{summary.metricLabel}</Text>
          <View style={styles.metricLockup}>
            <Text
              style={[
                styles.metricValue,
                compact && styles.metricValueCompact,
                !summary.measuredAndSaved && styles.metricFallback,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.62}
            >
              {summary.metricValue}
            </Text>
            {summary.metricUnit ? <Text style={styles.metricUnit}>{summary.metricUnit}</Text> : null}
          </View>
          <Text style={styles.metricCaption}>{summary.metricCaption}</Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.comparisonSection}>
          <Text style={styles.sectionEyebrow}>{summary.comparisonEyebrow}</Text>
          <Text style={[styles.sectionTitle, compact && compactTypography.cardTitle]}>
            {summary.comparisonTitle}
          </Text>
          <Text style={styles.sectionBody}>{summary.comparisonBody}</Text>
          {summary.comparisonDetail ? (
            <View style={styles.detailStrip}>
              <Text style={styles.comparisonDetail}>{summary.comparisonDetail}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <View style={styles.noteBlock}>
        <Text style={styles.note}>{summary.footnote}</Text>
      </View>
      <PrimaryButton title="Back to Home" onPress={onDone} />
    </Screen>
  );
}

function summaryBadge(summary: MicroCheckSummaryViewModel): string {
  if (!summary.measuredAndSaved) {
    if (summary.comparisonKind === 'not_saved') return 'Result not saved';
    return 'No reliable reading';
  }
  if (summary.eyebrow.toLowerCase().startsWith('extra')) return 'Plan unchanged';
  return 'Quick trend updated';
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 20,
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
  sheetHeader: {
    gap: spacing.xs,
  },
  sheetTitle: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  metricSection: {
    gap: spacing.sm,
  },
  sheetEyebrow: {
    ...type.label,
    color: colors.textTertiary,
  },
  metricLabel: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  metricLockup: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: 0,
  },
  metricValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
    color: colors.accentDeep,
  },
  metricValueCompact: {
    fontSize: 48,
    lineHeight: 56,
  },
  metricFallback: {
    ...type.h2,
    color: colors.textPrimary,
  },
  metricUnit: {
    ...type.bodySmall,
    fontFamily: fonts.sansMedium,
    color: colors.textSecondary,
    paddingBottom: 10,
    maxWidth: 160,
  },
  metricCaption: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  comparisonSection: {
    gap: spacing.sm,
  },
  sectionEyebrow: {
    ...type.label,
    color: colors.accentDeep,
  },
  sectionTitle: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  sectionBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  detailStrip: {
    alignSelf: 'stretch',
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  comparisonDetail: {
    ...type.cardCaption,
    color: colors.textTertiary,
  },
  noteBlock: {
    paddingHorizontal: spacing.xs,
  },
  note: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
});
