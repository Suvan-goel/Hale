import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { Card } from '../components/ui';
import {
  movementProfileV2DomainDetail,
  type MovementProfileV2Domain,
  type MovementProfileV2ResultsViewModel,
} from '../movementProfileV2/viewModel';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

/**
 * One domain of a Movement Profile in detail (metric, rows, note). Reached from
 * the unified results screen — both fresh results and saved history use the
 * same detail view.
 */
export function MovementProfileV2DomainDetailScreen({
  viewModel,
  domain,
  onBack,
}: {
  viewModel: MovementProfileV2ResultsViewModel;
  domain: MovementProfileV2Domain;
  onBack: () => void;
}) {
  const detail = movementProfileV2DomainDetail(viewModel, domain);
  if (!detail) {
    onBack();
    return null;
  }

  return (
    <View style={styles.root}>
      <BackArrowButton accessibilityLabel="Back to Movement Profile" onPress={onBack} />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <HeaderLogo />
          <Text style={styles.title}>{detail.title}</Text>
        </View>
        <Text style={styles.subtitle}>{detail.body}</Text>
      </View>

      <Card style={styles.detailCard}>
        <Text style={styles.metric}>{detail.metric}</Text>
        <Text style={styles.status}>{detail.status}</Text>
        <View style={styles.rowStack}>
          {detail.rows.map((row, index) => (
            <View key={row.label} style={[styles.infoRow, index > 0 && styles.rowDivider]}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>{detail.note}</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...type.pageTitle,
    flexShrink: 1,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
  },
  detailCard: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  metric: {
    ...type.metricMedium,
    color: colors.accentDeep,
  },
  status: {
    ...type.body,
    color: colors.textSecondary,
  },
  rowStack: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderHairline,
  },
  infoRow: {
    minHeight: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  infoValue: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'right',
  },
  note: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderHairline,
  },
});
