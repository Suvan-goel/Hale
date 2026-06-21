import * as React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AccountAuthCard } from '../components/AccountAuthCard';
import { HeaderLogo } from '../components/HeaderLogo';
import { colors, fonts, spacing } from '../theme';

const AUTH_HERO_IMAGE = require('../../assets/images/hale-auth-hero-generated.png');

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
          <Image source={AUTH_HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroContent}>
            <View style={styles.brandRow}>
              <HeaderLogo />
              <Text style={styles.wordmark}>Hale</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>Track your movement age over time</Text>
              <View style={styles.titleRule} />
              <Text style={styles.subtitle}>
                Save each check-up, training block, and monthly retest so Hale can show what is improving and what needs attention next.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.authWrap}>
          <AccountAuthCard context="required" />
        </View>
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
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    minHeight: 474,
    overflow: 'hidden',
    backgroundColor: colors.bgBase,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.xxxl + spacing.sm,
    paddingBottom: spacing.xl,
  },
  brandRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  wordmark: {
    color: colors.accentDeep,
    fontFamily: fonts.serifMedium,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: 0,
  },
  heroCopy: {
    width: '66%',
    marginTop: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.serifMedium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 0,
  },
  titleRule: {
    width: 44,
    height: 2,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.accentGold,
  },
  subtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  authWrap: {
    paddingHorizontal: spacing.pageHorizontal,
    marginTop: -(spacing.huge + spacing.sm),
  },
});
