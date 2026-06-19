/**
 * Reader for a single Learn article. Roomy line lengths and calm serif
 * hierarchy for comfortable reading.
 */

import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Article } from '../learn/articles';
import { colors, radius, spacing, type } from '../theme';

export function ArticleScreen({ article, onBack }: { article: Article; onBack: () => void }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back to Discover"
      >
        <Text style={styles.backText}>‹ Discover</Text>
      </Pressable>
      <Text style={styles.eyebrow}>
        {article.category} · {article.readingMinutes} min read
      </Text>
      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.excerpt}>{article.excerpt}</Text>
      <View style={styles.rule} />
      {article.body.map((para, i) => (
        <Text key={i} style={styles.para}>
          {para}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  container: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge,
    paddingBottom: spacing.huge,
  },
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  backPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  backText: { ...type.bodySmall, color: colors.accentDeep },
  eyebrow: { ...type.label, marginTop: spacing.xl, color: colors.sageDeep },
  title: { ...type.display, marginTop: spacing.sm },
  excerpt: { ...type.body, color: colors.textSecondary, marginTop: spacing.lg },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginTop: spacing.xxl },
  para: { ...type.body, marginTop: spacing.xl },
});
