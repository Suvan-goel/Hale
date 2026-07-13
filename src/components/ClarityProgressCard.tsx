import { StyleSheet, View } from 'react-native';

import type {
  ClaritySeries,
  ClarityTrendViewModel,
} from '../pearlFlow/clarityTrend';
import { colors, fonts, spacing } from '../theme';
import { PearlText } from './ui';

interface ClarityProgressSeriesPresentation {
  id: ClaritySeries['id'];
  label: string;
  relationText: string;
  comparisonText?: string;
  basisText?: string;
  latestCheckInDate?: string;
  checkInCount: number;
  supportCopy?: string;
}

export interface ClarityProgressCardPresentation {
  series: readonly ClarityProgressSeriesPresentation[];
  covariateContext?: string;
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
    const latestEntry = item.trend.entries[item.trend.entries.length - 1];

    return [
      {
        id: item.id,
        label: item.label,
        relationText: clarityRelationText(item),
        ...(item.id === 'subjective' && item.trend.status === 'ready'
          ? { comparisonText: 'Compared with your previous programme check-ins.' }
          : {}),
        ...(item.id === 'subjective'
          ? {
              basisText:
                'Based on five questions about word-finding, concentration, mental fatigue, and everyday lapses.',
            }
          : {}),
        ...(latestEntry ? { latestCheckInDate: formatCheckInDate(latestEntry.atIso) } : {}),
        checkInCount: item.trend.checkInCount,
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
    <View style={styles.card}>
      <PearlText variant="cardCaption" style={styles.eyebrow}>EVERYDAY CLARITY</PearlText>

      <View style={styles.seriesList}>
        {presentation.series.map((series, index) => (
          <ClaritySeriesBlock
            key={series.id}
            series={series}
            showDivider={index > 0}
            showLabel={presentation.series.length > 1 || series.label !== 'Everyday Clarity'}
          />
        ))}
      </View>

      {presentation.covariateContext ? (
        <ContextNote label="Latest check-up" body={presentation.covariateContext} />
      ) : null}
    </View>
  );
}

function ClaritySeriesBlock({
  series,
  showDivider,
  showLabel,
}: {
  series: ClarityProgressSeriesPresentation;
  showDivider: boolean;
  showLabel: boolean;
}) {
  const accessibilityLabel = [
    series.label,
    series.relationText,
    series.comparisonText,
    series.basisText,
    series.latestCheckInDate ? `Latest check-in ${series.latestCheckInDate}` : undefined,
    `${series.checkInCount} ${series.checkInCount === 1 ? 'check-in' : 'check-ins'}`,
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
      {showLabel ? <PearlText variant="cardRowTitle">{series.label}</PearlText> : null}
      <PearlText variant="cardBody" style={styles.relationText}>
        {displayRelation(series.relationText)}
      </PearlText>

      {series.comparisonText ? (
        <PearlText variant="cardCaption" style={styles.explanationText}>
          {series.comparisonText}
        </PearlText>
      ) : null}

      {series.basisText ? (
        <PearlText variant="cardCaption" style={styles.explanationText}>
          {series.basisText}
        </PearlText>
      ) : null}

      <View style={styles.metaRow}>
        {series.latestCheckInDate ? (
          <PearlText variant="cardCaption" style={styles.metaText}>
            Latest check-in · {series.latestCheckInDate}
          </PearlText>
        ) : null}
        <PearlText variant="cardCaption" style={styles.metaText}>
          {series.checkInCount} {series.checkInCount === 1 ? 'check-in' : 'check-ins'} recorded
        </PearlText>
      </View>

      {series.supportCopy ? (
        <PearlText variant="cardCaption" style={styles.supportCopy}>
          {series.supportCopy}
        </PearlText>
      ) : null}
    </View>
  );
}

function displayRelation(relation: string): string {
  return relation.replace(/\s+at this check-up\.?$/i, '').replace(/\.$/, '');
}

function clarityRelationText(series: ClaritySeries): string {
  if (series.trend.status === 'no_data') return '';
  if (series.trend.status === 'building') return series.trend.body;
  if (series.id !== 'subjective') return series.trend.headline;
  if (series.trend.latestRelation === 'above') return 'You reported clearer thinking than usual';
  if (series.trend.latestRelation === 'below') return 'You reported cloudier thinking than usual';
  return 'You reported your usual level of clarity';
}

function formatCheckInDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Saved';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date);
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
    gap: spacing.md,
    borderTopColor: colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  eyebrow: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
  },
  seriesList: {
    gap: 0,
  },
  series: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  seriesDivider: {
    borderTopColor: colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
  },
  relationText: {
    color: colors.textPrimary,
    fontFamily: fonts.serifRegular,
    fontSize: 22,
    letterSpacing: -0.25,
    lineHeight: 28,
  },
  explanationText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.lg,
    rowGap: spacing.xs,
    marginTop: spacing.sm,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  supportCopy: {
    color: colors.textSecondary,
  },
  contextNote: {
    borderTopColor: colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.lg,
  },
  noteLabel: {
    color: colors.accentDark,
  },
  noteBody: {
    color: colors.textSecondary,
  },
});
