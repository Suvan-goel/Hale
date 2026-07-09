import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type {
  ClaritySeries,
  ClarityTrendEntry,
  ClarityTrendViewModel,
} from '../pearlFlow/clarityTrend';
import { colors, radius, spacing } from '../theme';
import { Card, PearlText } from './ui';

interface ClarityProgressSeriesPresentation {
  id: ClaritySeries['id'];
  label: string;
  relationText: string;
  entries: readonly ClarityTrendEntry[];
  supportCopy?: string;
}

export interface ClarityProgressCardPresentation {
  series: readonly ClarityProgressSeriesPresentation[];
  covariateContext?: string;
  fluctuationNote: string;
  activityNote: string;
}

/**
 * Keeps rendering policy testable without mounting React Native. A Clarity
 * card only appears once there is at least one observed series. Counts and
 * underlying values are deliberately omitted from this presentation model.
 */
export function buildClarityProgressCardPresentation(
  viewModel: ClarityTrendViewModel
): ClarityProgressCardPresentation | null {
  if (viewModel.status === 'no_data') return null;

  const series = viewModel.series.flatMap((item): ClarityProgressSeriesPresentation[] => {
    if (item.trend.status === 'no_data') return [];

    return [
      {
        id: item.id,
        label: item.label,
        relationText:
          item.trend.status === 'building' ? item.trend.body : item.trend.headline,
        entries: item.trend.entries,
        ...(item.trend.status === 'ready' && item.trend.supportCopy
          ? { supportCopy: item.trend.supportCopy }
          : {}),
      },
    ];
  });

  if (series.length === 0) return null;

  return {
    series,
    ...(viewModel.covariateContext
      ? { covariateContext: viewModel.covariateContext }
      : {}),
    fluctuationNote: viewModel.fluctuationNote,
    activityNote: viewModel.activityNote,
  };
}

export function ClarityProgressCard({
  viewModel,
}: {
  viewModel: ClarityTrendViewModel;
}) {
  const presentation = buildClarityProgressCardPresentation(viewModel);
  if (!presentation) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <PearlText variant="cardTitle">Clarity over time</PearlText>
        <PearlText variant="cardBody">
          Personal signals from your monthly check-ups. Each is shown separately, never as one
          combined score.
        </PearlText>
      </View>

      <View style={styles.seriesList}>
        {presentation.series.map((series, index) => (
          <ClaritySeriesBlock key={series.id} series={series} showDivider={index > 0} />
        ))}
      </View>

      {presentation.covariateContext ? (
        <ContextNote label="This month" body={presentation.covariateContext} />
      ) : null}

      <View style={styles.notes}>
        <ContextNote label="Keep in mind" body={presentation.fluctuationNote} />
        <ContextNote label="Activity and clarity" body={presentation.activityNote} />
      </View>
    </Card>
  );
}

function ClaritySeriesBlock({
  series,
  showDivider,
}: {
  series: ClarityProgressSeriesPresentation;
  showDivider: boolean;
}) {
  const accessibilityLabel = [
    series.label,
    series.relationText,
    ...series.entries.flatMap((entry) => [entry.dateLabel, entry.relationLabel]),
    series.supportCopy,
  ]
    .filter((part): part is string => Boolean(part))
    .join('. ');

  return (
    <View
      style={[styles.series, showDivider && styles.seriesDivider]}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <PearlText variant="cardRowTitle">{series.label}</PearlText>
      <PearlText variant="cardBody" style={styles.relationText}>
        {series.relationText}
      </PearlText>

      <View style={styles.entryList}>
        {series.entries.map((entry) => (
          <View key={`${entry.atIso}-${entry.relationLabel}`} style={styles.entryRow}>
            <PearlText variant="cardCaption" style={styles.entryDate}>
              {entry.dateLabel}
            </PearlText>
            <PearlText variant="cardCaption" style={styles.entryRelation}>
              {entry.relationLabel}
            </PearlText>
          </View>
        ))}
      </View>

      {series.supportCopy ? (
        <PearlText variant="cardCaption" style={styles.supportCopy}>
          {series.supportCopy}
        </PearlText>
      ) : null}
    </View>
  );
}

function ContextNote({ label, body }: { label: string; body: string }) {
  return (
    <View style={styles.contextNote} accessible accessibilityLabel={`${label}. ${body}`}>
      <PearlText variant="cardCaption" style={styles.noteLabel}>
        {label}
      </PearlText>
      <PearlText variant="cardCaption" style={styles.noteBody}>
        {body}
      </PearlText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  seriesList: {
    gap: 0,
  },
  series: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  seriesDivider: {
    borderTopColor: colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
  },
  relationText: {
    color: colors.textPrimary,
  },
  entryList: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  entryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 36,
    gap: spacing.md,
  },
  entryDate: {
    color: colors.textMuted,
  },
  entryRelation: {
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  supportCopy: {
    color: colors.textSecondary,
  },
  notes: {
    gap: spacing.sm,
  },
  contextNote: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  noteLabel: {
    color: colors.accentDark,
  },
  noteBody: {
    color: colors.textSecondary,
  },
});
