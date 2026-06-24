import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { Card, PrimaryButton } from '../components/ui';
import {
  movementProfileV2DomainDetail,
  type MovementProfileV2Domain,
  type MovementProfileV2ResultsViewModel,
} from '../movementProfileV2/viewModel';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

export function MovementProfileV2ResultsScreen({
  viewModel,
  detailDomain,
  onOpenDomain,
  onBackToResults,
  onDone,
}: {
  viewModel: MovementProfileV2ResultsViewModel;
  detailDomain?: MovementProfileV2Domain | null;
  onOpenDomain: (domain: MovementProfileV2Domain) => void;
  onBackToResults: () => void;
  onDone: () => void;
}) {
  const detail = detailDomain ? movementProfileV2DomainDetail(viewModel, detailDomain) : null;

  if (detail) {
    return (
      <View style={styles.root}>
        <BackArrowButton accessibilityLabel="Back to Movement Profile" onPress={onBackToResults} />
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

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <HeaderLogo />
          <Text style={styles.title}>{viewModel.title}</Text>
        </View>
        <Text style={styles.dateLabel}>{viewModel.dateLabel}</Text>
        <Text style={styles.subtitle}>{viewModel.summary}</Text>
      </View>

      <Card style={styles.focusCard}>
        <Text style={styles.focusTitle}>{viewModel.focusTitle}</Text>
        <Text style={styles.focusBody}>{viewModel.focusBody}</Text>
      </Card>

      <View style={styles.domainStack}>
        {viewModel.domainCards.map((card, index) => (
          <DomainCard
            key={card.domain}
            card={card}
            showDivider={index > 0}
            onPress={() => onOpenDomain(card.domain)}
          />
        ))}
      </View>

      <Text style={styles.note}>
        Internal V2 output is saved for review only. The public Movement Check-Up and training
        plan still use the V1 profile.
      </Text>
      <PrimaryButton title="Done" onPress={onDone} />
    </View>
  );
}

function DomainCard({
  card,
  showDivider,
  onPress,
}: {
  card: MovementProfileV2ResultsViewModel['domainCards'][number];
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.domainRow,
        showDivider && styles.rowDivider,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${card.title}. ${card.metric}. ${card.status}.`}
    >
      <View style={styles.domainCopy}>
        <Text style={styles.domainTitle}>{card.title}</Text>
        <Text style={styles.domainMetric}>{card.metric}</Text>
        <Text style={styles.domainBody}>{card.body}</Text>
      </View>
      <View style={styles.domainPill}>
        <Text style={styles.domainPillText} numberOfLines={1}>{card.status}</Text>
      </View>
    </Pressable>
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
  dateLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
  },
  focusCard: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  focusTitle: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  focusBody: {
    ...type.body,
    color: colors.textSecondary,
  },
  domainStack: {
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  domainRow: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  domainCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  domainTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
  },
  domainMetric: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: 0,
  },
  domainBody: {
    color: colors.textSecondary,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0,
  },
  domainPill: {
    maxWidth: 136,
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  domainPillText: {
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0,
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
  pressed: {
    opacity: 0.72,
  },
});
