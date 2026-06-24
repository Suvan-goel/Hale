import * as React from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, StatusBadge } from '../components/ui';
import {
  getLearnDetail,
  getMovementLadderDetail,
  type LadderLevelView,
  type MovementLadderDetail,
} from '../haleFlow';
import type { MovementSafetyProfile } from '../adherence';
import type { EquipmentProfile, LadderProgress, PersistedGeneratedSessionSummary } from '../training';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import { articleImageFor, ladderImageFor } from './exploreImages';

export function LadderDetailScreen({
  ladderId,
  ladderProgressById,
  equipment,
  safetyProfile,
  activeBlockId,
  generatedSessionSummaries,
  onPractice,
  onDone,
}: {
  ladderId: string;
  ladderProgressById: Record<string, LadderProgress>;
  equipment?: EquipmentProfile | null;
  safetyProfile?: MovementSafetyProfile | null;
  activeBlockId?: string | null;
  generatedSessionSummaries?: readonly PersistedGeneratedSessionSummary[] | null;
  onPractice: () => void;
  onDone: () => void;
}) {
  const detail = React.useMemo(
    () => getMovementLadderDetail(ladderId, ladderProgressById, {
      equipment,
      safetyProfile,
      activeBlockId,
      generatedSessionSummaries,
    }),
    [activeBlockId, equipment, generatedSessionSummaries, ladderId, ladderProgressById, safetyProfile]
  );

  if (!detail) {
    return (
      <MissingDetailScreen
        title="Movement group"
        subtitle="This ladder is not available in V1."
        onBack={onDone}
      />
    );
  }

  return (
    <Screen contentStyle={styles.articleScreen}>
      <DetailBackButton onPress={onDone} />
      <ArticleHero
        eyebrow={`${detail.domainLabel} · Movement group`}
        title={detail.title}
        subtitle={detail.body}
        imageSource={ladderImageFor(detail.id)}
      />

      <View style={styles.ladderBody}>
        <CurrentLevelPanel detail={detail} />
        <ChecklistSection title="Before you start" items={detail.beforeStartItems} />
        <LadderInfoSection title="What Hale watches" body={detail.watchText} />
        <OtherVersionsSection detail={detail} />
        <LadderInfoSection title="Why it helps" body={detail.whyItHelps} />
      </View>

      <PrimaryButton
        title={detail.showCurrentLevel ? 'Practice this movement' : 'Practice these movements'}
        onPress={onPractice}
        style={styles.primaryAction}
      />
    </Screen>
  );
}

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

function CurrentLevelPanel({ detail }: { detail: MovementLadderDetail }) {
  const responsive = useResponsiveLayout();
  const level = detail.currentLevel;
  if (!detail.showCurrentLevel) {
    return (
      <View style={[styles.currentPanel, responsive.isCompactPhone && styles.compactCardPadding]}>
        <View style={styles.currentPanelHeader}>
          <View style={styles.currentPanelTitleGroup}>
            <Text style={styles.ladderEyebrow}>Movement group</Text>
            <Text style={styles.currentLevelName}>{detail.currentLevelName}</Text>
            <Text style={styles.currentLevelMeta}>
              {detail.varietyLabel ?? 'These movements remain available for practice.'}
            </Text>
          </View>
          <StatusBadge label={detail.domainLabel} tone="gold" />
        </View>
        <View style={styles.currentTagRow}>
          <InfoPill label={detail.currentLevelLabel} />
          <InfoPill label={`${detail.levels.length} movements`} />
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.currentPanel, responsive.isCompactPhone && styles.compactCardPadding]}>
      <View style={styles.currentPanelHeader}>
        <View style={styles.currentPanelTitleGroup}>
          <Text style={styles.ladderEyebrow}>Your version</Text>
          <Text style={styles.currentLevelName}>{level.name}</Text>
          <Text style={styles.currentLevelMeta}>{level.levelLabel}</Text>
        </View>
        <StatusBadge label={detail.domainLabel} tone="gold" />
      </View>

      <View style={styles.currentTagRow}>
        <InfoPill label={level.equipmentLabel} />
        <InfoPill label={level.cameraLabel} />
        <InfoPill label={level.measurementLabel} />
      </View>

      <View style={styles.currentInstructionBlock}>
        <Text style={styles.blockLabel}>How to do it</Text>
        <Text style={styles.currentInstruction}>{level.instructions}</Text>
      </View>
    </View>
  );
}

function InfoPill({ label }: { label: string }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillText}>{label}</Text>
    </View>
  );
}

function LadderInfoSection({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.ladderSection}>
      <Text style={styles.ladderSectionTitle}>{title}</Text>
      <Text style={styles.ladderSectionBody}>{body}</Text>
    </View>
  );
}

function ChecklistSection({ title, items }: { title: string; items: readonly string[] }) {
  const responsive = useResponsiveLayout();
  if (items.length === 0) return null;
  return (
    <View style={styles.ladderSection}>
      <View style={styles.ladderSectionHeader}>
        <Text style={styles.ladderSectionTitle}>{title}</Text>
      </View>
      <View style={[styles.checklistCard, responsive.isCompactPhone && styles.compactCardPadding]}>
        {items.map((item) => (
          <View key={item} style={styles.checklistItem}>
            <View style={styles.checklistBullet} />
            <Text style={styles.checklistText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function OtherVersionsSection({ detail }: { detail: MovementLadderDetail }) {
  const responsive = useResponsiveLayout();
  const rows = detail.showCurrentLevel
    ? detail.levels.map((level) => ({
        label: level.isCurrent ? 'Your version' : level.levelLabel,
        level,
      }))
    : detail.levels.map((level) => ({ label: level.levelLabel, level }));

  if (rows.length <= 1) return null;

  return (
    <View style={styles.ladderSection}>
      <View style={styles.ladderSectionHeader}>
        <Text style={styles.ladderSectionTitle}>
          {detail.showCurrentLevel ? 'All versions' : detail.listTitle}
        </Text>
        <Text style={styles.ladderSectionCaption}>
          {detail.showCurrentLevel
            ? 'Hale can choose from these versions when your plan changes.'
            : 'Hale can use these when they fit your setup.'}
        </Text>
      </View>
      <View style={[styles.versionList, responsive.isCompactPhone && styles.compactCardPadding]}>
        {rows.map((row, index) => (
          <VersionRow
            key={`${row.label}-${row.level.id}`}
            label={row.label}
            level={row.level}
            showDivider={index > 0}
          />
        ))}
      </View>
    </View>
  );
}

function VersionRow({
  label,
  level,
  showDivider,
}: {
  label: string;
  level: LadderLevelView;
  showDivider: boolean;
}) {
  return (
    <View style={[styles.versionRow, showDivider && styles.versionRowDivider]}>
      <View style={styles.versionRowCopy}>
        <Text style={styles.versionLabel}>{label}</Text>
        <Text style={styles.versionTitle}>{level.name}</Text>
        <Text style={styles.versionMeta}>
          {level.levelLabel} · {level.equipmentLabel}
        </Text>
      </View>
      {level.isCurrent ? <StatusBadge label="Current" tone="good" /> : null}
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
