import * as React from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen } from '../components/ui';
import { getLearnDetail } from '../haleFlow';
import type { MovementSafetyProfile } from '../adherence';
import type { EquipmentProfile, LadderProgress, PersistedGeneratedSessionSummary } from '../training';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import { articleImageFor } from './exploreImages';


export function LearnDetailScreen({
  articleId,
  onCameraSetup,
  onEquipment,
  onDone,
}: {
  articleId: string;
  onCameraSetup: () => void;
  onEquipment: () => void;
  onDone: () => void;
}) {
  const detail = React.useMemo(() => getLearnDetail(articleId), [articleId]);
  if (!detail) {
    return (
      <MissingDetailScreen
        title="Learn"
        subtitle="This guide is not available."
        onBack={onDone}
      />
    );
  }

  const primary =
    detail.id === 'camera-setup'
      ? { title: 'Open camera setup', onPress: onCameraSetup }
      : detail.id === 'resistance-band'
        ? { title: 'Open equipment settings', onPress: onEquipment }
        : null;

  const eyebrow = detail.categoryLabel ? `${detail.categoryLabel} · ${detail.readTimeLabel}` : detail.readTimeLabel;

  return (
    <Screen contentStyle={styles.articleScreen}>
      <DetailBackButton onPress={onDone} />
      <ArticleHero
        eyebrow={eyebrow}
        title={detail.title}
        subtitle={detail.body}
        imageSource={articleImageFor(detail.id)}
      />

      {detail.authorName ? (
        <View style={styles.bylineBlock}>
          <Text style={styles.bylineTitle}>Professional perspective</Text>
          <Text style={styles.bylineBody}>
            {detail.authorName}
            {detail.authorCredential ? ` · ${detail.authorCredential}` : ''}
          </Text>
          {detail.reviewedLabel ? <Text style={styles.bylineCaption}>{detail.reviewedLabel}</Text> : null}
        </View>
      ) : null}

      <View style={styles.articleBody}>
        {detail.sections.map((section) => (
          <ArticleSection key={section.title} title={section.title} body={section.body} />
        ))}
      </View>

      {primary ? <PrimaryButton title={primary.title} onPress={primary.onPress} style={styles.primaryAction} /> : null}
    </Screen>
  );
}

function MissingDetailScreen({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <Screen contentStyle={styles.articleScreen}>
      <DetailBackButton onPress={onBack} />
      <View style={styles.articleHeader}>
        <Text style={styles.articleTitle}>{title}</Text>
        <Text style={styles.articleSubtitle}>{subtitle}</Text>
      </View>
    </Screen>
  );
}

function DetailBackButton({ onPress }: { onPress: () => void }) {
  return <BackArrowButton accessibilityLabel="Back to Explore" onPress={onPress} style={styles.detailBackButton} />;
}

function ArticleHero({
  eyebrow,
  title,
  subtitle,
  imageSource,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageSource?: ImageSourcePropType;
}) {
  const responsive = useResponsiveLayout();
  const heroHeight = Math.round(Math.max(190, Math.min(260, responsive.contentWidth / 1.45)));

  return (
    <View style={styles.articleHeader}>
      <Text style={styles.articleEyebrow}>{eyebrow}</Text>
      <Text style={styles.articleTitle}>{title}</Text>
      <Text style={styles.articleSubtitle}>{subtitle}</Text>
      {imageSource ? (
        <View style={[styles.heroImageFrame, { height: heroHeight }]}>
          <Image source={imageSource} style={styles.heroImage} resizeMode="cover" />
        </View>
      ) : null}
    </View>
  );
}

function ArticleSection({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.articleSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {body ? <Text style={styles.articleParagraph}>{body}</Text> : null}
      {children}
    </View>
  );
}







const styles = StyleSheet.create({
  articleScreen: {
    gap: spacing.lg,
    paddingBottom: spacing.huge,
  },
  detailBackButton: {
    marginBottom: spacing.xs,
  },
  articleHeader: {
    gap: spacing.md,
  },
  articleEyebrow: {
    ...type.label,
    color: colors.textSecondary,
  },
  articleTitle: {
    fontFamily: fonts.serifRegular,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  articleSubtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  heroImageFrame: {
    width: '100%',
    borderRadius: radius.panel,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    marginTop: spacing.sm,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  bylineBlock: {
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  bylineTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  bylineBody: {
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  bylineCaption: {
    ...type.caption,
    color: colors.textSecondary,
  },
  articleBody: {
    gap: spacing.xl,
  },
  ladderBody: {
    gap: spacing.lg,
  },
  articleSection: {
    gap: spacing.md,
    paddingTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderHairline,
  },
  sectionTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  articleParagraph: {
    fontFamily: fonts.sansRegular,
    fontSize: 17,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  currentPanel: {
    gap: spacing.lg,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow.card,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  currentPanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  currentPanelTitleGroup: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  ladderEyebrow: {
    ...type.label,
    color: colors.textSecondary,
  },
  currentLevelName: {
    fontFamily: fonts.sansMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  currentLevelMeta: {
    ...type.caption,
    color: colors.textSecondary,
  },
  currentTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  infoPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  infoPillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  currentInstructionBlock: {
    gap: spacing.xs,
  },
  blockLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  currentInstruction: {
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 25,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  ladderSection: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  ladderSectionHeader: {
    gap: 3,
  },
  ladderSectionTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  ladderSectionBody: {
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 25,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  ladderSectionCaption: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  checklistCard: {
    gap: spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow.soft,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checklistBullet: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.accent,
    marginTop: 8,
  },
  checklistText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  versionList: {
    borderRadius: radius.card,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    ...shadow.soft,
  },
  versionRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 13,
  },
  versionRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderHairline,
  },
  versionRowCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  versionLabel: {
    ...type.caption,
    color: colors.textSecondary,
  },
  versionTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  versionMeta: {
    ...type.caption,
    color: colors.textSecondary,
  },
  primaryAction: {
    marginTop: spacing.sm,
  },
});
