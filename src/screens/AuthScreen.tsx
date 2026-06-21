import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AccountAuthCard } from '../components/AccountAuthCard';
import { HeaderLogo } from '../components/HeaderLogo';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

export function AuthScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <HeaderLogo size={34} />
            <Text style={styles.wordmark}>Hale</Text>
          </View>
          <Text style={styles.title}>Move well today. See what changes over time.</Text>
          <Text style={styles.subtitle}>
            Save your Movement Check-Up results, training blocks, and monthly progress history in one calm place.
          </Text>
        </View>

        <View style={styles.promisePanel}>
          <PromiseItem label="Skeleton-only" body="Camera sessions never show a mirror." />
          <View style={styles.promiseDivider} />
          <PromiseItem label="Monthly clarity" body="Check-ups and training history stay connected." />
        </View>

        <AccountAuthCard context="required" />
      </ScrollView>
    </View>
  );
}

function PromiseItem({ label, body }: { label: string; body: string }) {
  return (
    <View style={styles.promiseItem}>
      <Text style={styles.promiseLabel}>{label}</Text>
      <Text style={styles.promiseBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.md,
    maxWidth: 380,
  },
  brandRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wordmark: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 0,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.serifMedium,
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: 0,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
    maxWidth: 360,
  },
  promisePanel: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.panel,
    backgroundColor: colors.bgSurface,
    ...shadow.soft,
  },
  promiseItem: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  promiseLabel: {
    ...type.cardRowTitle,
    color: colors.accentDeep,
  },
  promiseBody: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  promiseDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
});
