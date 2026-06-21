/**
 * Reader for a single Learn article. Roomy line lengths and calm serif
 * hierarchy for comfortable reading.
 */

import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { Article } from '../learn/articles';
import { colors, spacing, type } from '../theme';

export function ArticleScreen({ article, onBack }: { article: Article; onBack: () => void }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <BackArrowButton accessibilityLabel="Back to Discover" onPress={onBack} />
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
    maxWidth: spacing.pageMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageTop,
    paddingBottom: spacing.huge,
  },
  eyebrow: { ...type.label, marginTop: spacing.xl, color: colors.sageDeep },
  title: { ...type.pageTitle, marginTop: spacing.sm },
  excerpt: { ...type.pageSubtitle, marginTop: spacing.lg },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginTop: spacing.xxl },
  para: { ...type.body, marginTop: spacing.xl },
});
