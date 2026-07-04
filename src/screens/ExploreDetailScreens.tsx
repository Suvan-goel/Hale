import * as React from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { Screen } from '../components/ui';
import { getLearnDetail } from '../haleFlow';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import { articleImageFor } from './exploreImages';


export function LearnDetailScreen({
  articleId,
  onDone,
}: {
  articleId: string;
  onDone: () => void;
}) {
  const detail = React.useMemo(() => getLearnDetail(articleId), [articleId]);
  if (!detail) {
    return (
      <MissingDetailScreen
        title="Learn"
        subtitle="This article is not available."
        onBack={onDone}
      />
    );
  }

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

function ArticleSection({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.articleSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {body ? <Text style={styles.articleParagraph}>{body}</Text> : null}
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
});
