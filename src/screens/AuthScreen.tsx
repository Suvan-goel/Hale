import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AccountAuthCard } from '../components/AccountAuthCard';
import { Typography } from '../components/ui';
import { colors, fonts, spacing, type } from '../theme';

export function AuthScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Typography variant="h3" color={colors.accent} style={styles.wordmark}>Hale</Typography>
          <Typography variant="display" style={styles.title}>Keep your movement progress connected.</Typography>
          <Typography variant="body" color={colors.textSecondary} style={styles.subtitle}>
            Save your Movement Check-Up results, training blocks, and monthly progress history.
          </Typography>
        </View>
        <AccountAuthCard context="required" />
      </ScrollView>
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
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge + spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },
  hero: {
    gap: spacing.md,
    maxWidth: 380,
  },
  wordmark: {
    fontFamily: fonts.sansMedium,
  },
  title: {
    ...type.display,
  },
  subtitle: {
    maxWidth: 360,
  },
});
