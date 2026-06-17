/**
 * Learn tab — a bundled editorial library. Content stays local-only and
 * wellness-side; the presentation borrows from calm magazine-style longevity
 * products rather than social feeds.
 */

import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Pill, Screen, ScreenHeader, StatusBadge } from '../components/ui';
import { ARTICLES, Article, ArticleCategory, getArticle } from '../learn/articles';
import { colors, radius, shadow, spacing, type } from '../theme';
import { ArticleScreen } from './ArticleScreen';

type Filter = 'All' | ArticleCategory;

const FILTERS: Filter[] = ['All', 'Strength', 'Balance', 'Mobility', 'Everyday', 'Mindset'];

const CATEGORY_MARK: Record<ArticleCategory, string> = {
  Strength: 'ST',
  Balance: 'BA',
  Mobility: 'MO',
  Everyday: 'EV',
  Mindset: 'MI',
};

export function LearnScreen() {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<Filter>('All');
  const open = openId ? getArticle(openId) : undefined;
  const featured = ARTICLES[0];
  const articles = ARTICLES.filter((article) => filter === 'All' || article.category === filter);

  if (open) {
    return <ArticleScreen article={open} onBack={() => setOpenId(null)} />;
  }

  return (
    <Screen>
      <ScreenHeader title="Discover" subtitle="Short reads on movement, recovery, and healthy aging." />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map((item) => (
          <Pill key={item} label={item} selected={item === filter} onPress={() => setFilter(item)} />
        ))}
      </ScrollView>

      <FeaturedArticle article={featured} onPress={() => setOpenId(featured.id)} />

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>For Your Routine</Text>
        <StatusBadge label={`${articles.length} reads`} tone="gold" />
      </View>
      <View style={styles.list}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} onPress={() => setOpenId(article.id)} />
        ))}
      </View>
    </Screen>
  );
}

function FeaturedArticle({ article, onPress }: { article: Article; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.featured, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={article.title}
    >
      <View style={styles.featuredVisual}>
        <View style={styles.goldBand} />
        <View style={styles.leafOne} />
        <View style={styles.leafTwo} />
        <Text style={styles.featuredMark}>{CATEGORY_MARK[article.category]}</Text>
      </View>
      <View style={styles.featuredCopy}>
        <Text style={styles.cardEyebrow}>
          Featured · {article.readingMinutes} min
        </Text>
        <Text style={styles.featuredTitle}>{article.title}</Text>
        <Text style={styles.cardExcerpt}>{article.excerpt}</Text>
      </View>
    </Pressable>
  );
}

function ArticleCard({ article, onPress }: { article: Article; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.cardPress, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={article.title}
    >
      <Card style={styles.articleCard}>
        <View style={styles.articleTop}>
          <View style={styles.categoryDot}>
            <Text style={styles.categoryDotText}>{CATEGORY_MARK[article.category]}</Text>
          </View>
          <Text style={styles.cardEyebrow}>
            {article.category} · {article.readingMinutes} min
          </Text>
        </View>
        <Text style={styles.cardTitle}>{article.title}</Text>
        <Text style={styles.cardExcerpt}>{article.excerpt}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.sm, paddingRight: spacing.xxl },
  featured: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    ...shadow.lifted,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  featuredVisual: {
    height: 150,
    backgroundColor: colors.accent,
    justifyContent: 'flex-end',
    padding: spacing.xxl,
  },
  goldBand: {
    position: 'absolute',
    width: 138,
    height: 74,
    borderRadius: radius.card,
    right: spacing.xl,
    top: spacing.xl,
    backgroundColor: colors.bgGold,
    opacity: 0.92,
    transform: [{ rotate: '-8deg' }],
  },
  leafOne: {
    position: 'absolute',
    width: 126,
    height: 48,
    borderRadius: radius.pill,
    right: 34,
    bottom: 26,
    backgroundColor: colors.sage,
    transform: [{ rotate: '-18deg' }],
  },
  leafTwo: {
    position: 'absolute',
    width: 96,
    height: 36,
    borderRadius: radius.pill,
    right: 96,
    bottom: 54,
    backgroundColor: colors.accentGold,
    opacity: 0.9,
    transform: [{ rotate: '22deg' }],
  },
  featuredMark: { ...type.display, color: colors.onAccent },
  featuredCopy: { padding: spacing.xxl },
  featuredTitle: { ...type.h1, marginTop: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionTitle: { ...type.h2 },
  list: { gap: spacing.lg },
  cardPress: {},
  articleCard: { gap: spacing.sm },
  articleTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  categoryDot: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDotText: { ...type.label, color: colors.accentDeep },
  cardEyebrow: { ...type.label, color: colors.sageDeep },
  cardTitle: { ...type.h2 },
  cardExcerpt: { ...type.bodySmall, color: colors.textSecondary },
});
