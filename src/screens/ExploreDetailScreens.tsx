import * as React from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, StatusBadge } from '../components/ui';
import {
  getLearnDetail,
  getMovementLadderDetail,
  type LadderLevelView,
  type MovementLadderDetail,
  type TodaySessionAdjustment,
  type TodaySessionPreferences,
} from '../haleFlow';
import type { MovementSafetyProfile } from '../adherence';
import type { EquipmentProfile, LadderProgress, PersistedGeneratedSessionSummary } from '../training';
import type { PainArea } from '../training';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import { articleImageFor, ladderImageFor } from './exploreImages';
import { SessionStartMenu } from './TodayScreen';

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
  onPractice: (preferences?: TodaySessionPreferences | null) => void;
  onDone: () => void;
}) {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const detail = React.useMemo(
    () => getMovementLadderDetail(ladderId, ladderProgressById, {
      equipment,
      safetyProfile,
      activeBlockId,
      generatedSessionSummaries,
    }),
    [activeBlockId, equipment, generatedSessionSummaries, ladderId, ladderProgressById, safetyProfile]
  );
  const startPractice = React.useCallback(
    (adjustment?: TodaySessionAdjustment | null, painArea?: PainArea | null) => {
      setMenuVisible(false);
      onPractice({
        adjustment: adjustment ?? null,
        painArea: adjustment === 'something_hurts' ? painArea ?? null : null,
      });
    },
    [onPractice]
  );

  if (!detail) {
    return (
      <MissingDetailScreen
        title="Movement ladder"
        subtitle="This ladder is not available in V1."
        onBack={onDone}
      />
    );
  }

  return (
    <>
      <Screen contentStyle={styles.articleScreen}>
        <DetailBackButton onPress={onDone} />
        <ArticleHero
          eyebrow={`${detail.domainLabel} · ${detail.showCurrentLevel ? 'Movement ladder' : 'Movement group'}`}
          title={detail.title}
          subtitle={detail.body}
          imageSource={ladderImageFor(detail.id)}
        />

        <View style={styles.ladderBody}>
          <CurrentLevelPanel detail={detail} />
          <LadderInfoSection title="Why it matters" body={detail.whyItMatters} />
          <AdaptationSection
            easierLevel={detail.easierLevel}
            harderLevel={detail.harderLevel}
            hasMultipleLevels={detail.levels.length > 1}
            showEasierHarder={detail.showCurrentLevel}
            presentationMode={detail.presentationMode}
            varietyLabel={detail.varietyLabel}
          />
          <LadderLevelsSection detail={detail} />
        </View>

        <PrimaryButton
          title={detail.showCurrentLevel ? 'Practice This Ladder' : 'Practice These Movements'}
          onPress={() => setMenuVisible(true)}
          style={styles.primaryAction}
        />
      </Screen>
      <SessionStartMenu visible={menuVisible} onClose={() => setMenuVisible(false)} onStart={startPractice} />
    </>
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
  const level = detail.currentLevel;
  if (!detail.showCurrentLevel) {
    return (
      <View style={styles.currentPanel}>
        <View style={styles.currentPanelHeader}>
          <View style={styles.currentPanelTitleGroup}>
            <Text style={styles.ladderEyebrow}>{detail.currentLevelLabel}</Text>
            <Text style={styles.currentLevelName}>{detail.currentLevelName}</Text>
            <Text style={styles.currentLevelMeta}>
              {detail.varietyLabel ?? 'These movements remain available for practice.'}
            </Text>
          </View>
          <StatusBadge label={detail.domainLabel} tone="gold" />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.currentPanel}>
      <View style={styles.currentPanelHeader}>
        <View style={styles.currentPanelTitleGroup}>
          <Text style={styles.ladderEyebrow}>Current level</Text>
          <Text style={styles.currentLevelName}>{level.name}</Text>
          <Text style={styles.currentLevelMeta}>{level.levelLabel}</Text>
        </View>
        <StatusBadge label={detail.domainLabel} tone="gold" />
      </View>

      <View style={styles.currentFactGrid}>
        <CurrentFact label="Equipment" value={level.equipmentLabel} wide />
        <CurrentFact label="Camera" value={level.cameraLabel} />
        <CurrentFact label="Tracking" value={level.measurementLabel} />
      </View>

      <View style={styles.currentInstructionBlock}>
        <Text style={styles.blockLabel}>How to do it</Text>
        <Text style={styles.currentInstruction}>{level.instructions}</Text>
      </View>

      <LevelNotes level={level} />
    </View>
  );
}

function CurrentFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.currentFact, wide && styles.currentFactWide]}>
      <Text style={styles.currentFactLabel}>{label}</Text>
      <Text style={styles.currentFactValue}>{value}</Text>
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

function AdaptationSection({
  easierLevel,
  harderLevel,
  hasMultipleLevels,
  showEasierHarder,
  presentationMode,
  varietyLabel,
}: {
  easierLevel?: LadderLevelView;
  harderLevel?: LadderLevelView;
  hasMultipleLevels: boolean;
  showEasierHarder: boolean;
  presentationMode: MovementLadderDetail['presentationMode'];
  varietyLabel?: string;
}) {
  if (!showEasierHarder) {
    return (
      <View style={styles.ladderSection}>
        <View style={styles.ladderSectionHeader}>
          <Text style={styles.ladderSectionTitle}>How Hale uses it</Text>
          <Text style={styles.ladderSectionCaption}>
            {presentationMode === 'collection'
              ? varietyLabel ?? 'Hale varies these mobility movements across your block.'
              : 'Hale chooses available practice options without treating them as harder or easier ranks.'}
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.ladderSection}>
      <View style={styles.ladderSectionHeader}>
        <Text style={styles.ladderSectionTitle}>How Hale adapts it</Text>
        <Text style={styles.ladderSectionCaption}>
          Hale chooses from the ladder based on your setup and recent sessions.
        </Text>
      </View>
      <View style={styles.adaptationPanel}>
        {hasMultipleLevels ? (
          <>
            <AdaptationItem
              label="Easier"
              level={easierLevel}
              fallbackTitle="At the easiest option"
              fallbackBody="There is no gentler core level below this one."
            />
            <View style={styles.adaptationDivider} />
            <AdaptationItem
              label="Next"
              level={harderLevel}
              fallbackTitle="Top option for now"
              fallbackBody="There is no harder core level above this one."
            />
          </>
        ) : (
          <View style={styles.singleAdaptation}>
            <Text style={styles.adaptationFallbackTitle}>Single-level ladder</Text>
            <Text style={styles.adaptationFallbackBody}>
              Hale uses this movement when the required setup is available, or chooses another ladder when it is not.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function AdaptationItem({
  label,
  level,
  fallbackTitle,
  fallbackBody,
}: {
  label: string;
  level?: LadderLevelView;
  fallbackTitle: string;
  fallbackBody: string;
}) {
  return (
    <View style={styles.adaptationItem}>
      <Text style={styles.adaptationLabel}>{label}</Text>
      {level ? (
        <>
          <Text style={styles.adaptationName}>{level.name}</Text>
          <Text style={styles.adaptationMeta}>
            {level.levelLabel} · {level.equipmentLabel}
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.adaptationFallbackTitle}>{fallbackTitle}</Text>
          <Text style={styles.adaptationFallbackBody}>{fallbackBody}</Text>
        </>
      )}
    </View>
  );
}

function LadderLevelsSection({ detail }: { detail: MovementLadderDetail }) {
  const levels = detail.levels;
  return (
    <View style={styles.ladderSection}>
      <View style={styles.ladderSectionHeader}>
        <Text style={styles.ladderSectionTitle}>{detail.listTitle}</Text>
        <Text style={styles.ladderSectionCaption}>
          {detail.showCurrentLevel
            ? `${levels.length} options Hale can choose from`
            : `${levels.length} movements available for practice`}
        </Text>
      </View>
      <View style={styles.levelList}>
        {levels.map((level, index) => (
          <LevelArticleRow key={level.id} level={level} showDivider={index > 0} />
        ))}
      </View>
    </View>
  );
}

function LevelNotes({ level, compact = false }: { level: LadderLevelView; compact?: boolean }) {
  const notes = [
    level.setupNote ? { label: 'Set-up', body: level.setupNote } : null,
    level.safetyNote ? { label: 'Safety', body: level.safetyNote } : null,
    level.measurementNote ? { label: 'What Hale tracks', body: level.measurementNote } : null,
  ].filter((note): note is { label: string; body: string } => !!note);

  if (notes.length === 0) return null;
  return (
    <View style={[styles.levelNotes, compact && styles.levelNotesCompact]}>
      {notes.map((note) => (
        <View key={note.label} style={styles.levelNote}>
          <Text style={styles.levelNoteLabel}>{note.label}</Text>
          <Text style={styles.levelNoteBody}>{note.body}</Text>
        </View>
      ))}
    </View>
  );
}

function LevelArticleRow({
  level,
  showDivider,
}: {
  level: LadderLevelView;
  showDivider: boolean;
}) {
  return (
    <View style={[styles.levelRow, showDivider && styles.levelRowDivider]}>
      <View style={styles.levelRowCopy}>
        <Text style={styles.levelRowLabel}>{level.levelLabel}</Text>
        <Text style={styles.levelRowTitle}>{level.name}</Text>
        <Text style={styles.levelRowMeta}>
          {level.equipmentLabel} · {level.measurementLabel}
        </Text>
        <Text style={styles.levelRowCamera}>{level.cameraLabel}</Text>
        <Text style={styles.levelRowInstructions} numberOfLines={3}>{level.instructions}</Text>
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
  currentFactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  currentFact: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 62,
    justifyContent: 'center',
    gap: 3,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  currentFactWide: {
    flexBasis: '100%',
  },
  currentFactLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  currentFactValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 21,
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
  adaptationPanel: {
    gap: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow.soft,
  },
  adaptationItem: {
    gap: 3,
  },
  adaptationLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  adaptationName: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  adaptationMeta: {
    ...type.caption,
    color: colors.textSecondary,
  },
  adaptationFallbackTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  adaptationFallbackBody: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  adaptationDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderHairline,
  },
  singleAdaptation: {
    gap: spacing.xs,
  },
  levelNotes: {
    gap: spacing.sm,
  },
  levelNotesCompact: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  levelNote: {
    gap: 2,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  levelNoteLabel: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.textPrimary,
  },
  levelNoteBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  levelList: {
    borderRadius: radius.card,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    ...shadow.card,
  },
  levelRow: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: 14,
  },
  levelRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderHairline,
  },
  levelRowCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  levelRowLabel: {
    ...type.caption,
    color: colors.textSecondary,
  },
  levelRowTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  levelRowMeta: {
    ...type.caption,
    color: colors.textSecondary,
  },
  levelRowCamera: {
    ...type.caption,
    color: colors.textSecondary,
  },
  levelRowInstructions: {
    ...type.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  primaryAction: {
    marginTop: spacing.sm,
  },
});
