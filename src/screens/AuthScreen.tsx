import * as React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AccountAuthCard } from '../components/AccountAuthCard';
import { HeaderLogo } from '../components/HeaderLogo';
import { colors, fonts, spacing } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const AUTH_HERO_IMAGE = require('../../assets/images/hale-auth-hero-generated.png');

export function AuthScreen() {
  const responsive = useResponsiveLayout();
  const isCompactPhone = responsive.isCompactPhone;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { maxWidth: responsive.maxContentWidth }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.hero, isCompactPhone && styles.heroCompact]}>
          <Image
            source={AUTH_HERO_IMAGE}
            style={[styles.heroImage, isCompactPhone && styles.heroImageCompact]}
            resizeMode="cover"
          />
          <View
            style={[
              styles.heroContent,
              isCompactPhone && styles.heroContentCompact,
              { paddingHorizontal: responsive.horizontalPadding },
            ]}
          >
            <View style={styles.brandRow}>
              <HeaderLogo size={isCompactPhone ? 30 : 34} />
              <Text style={[styles.wordmark, isCompactPhone && styles.wordmarkCompact]}>Hale</Text>
            </View>
            <View style={[styles.heroCopy, isCompactPhone && styles.heroCopyCompact]}>
              <Text style={[styles.title, isCompactPhone && styles.titleCompact]}>Track your movement age over time</Text>
              <View style={[styles.titleRule, isCompactPhone && styles.titleRuleCompact]} />
              <Text style={[styles.subtitle, isCompactPhone && styles.subtitleCompact]}>
                Save each check-up, training block, and monthly retest so Hale can show what is improving and what needs attention next.
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.authWrap,
            isCompactPhone && styles.authWrapCompact,
            { paddingHorizontal: responsive.horizontalPadding },
          ]}
        >
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
  heroCompact: {
    minHeight: 480,
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
  heroImageCompact: {
    width: '104%',
    left: -6,
  },
  heroContent: {
    flex: 1,
    paddingTop: spacing.xxxl + spacing.sm,
    paddingBottom: spacing.xl,
  },
  heroContentCompact: {
    paddingTop: spacing.xxxl + spacing.xs,
    paddingBottom: spacing.lg,
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
  wordmarkCompact: {
    fontSize: 32,
    lineHeight: 38,
  },
  heroCopy: {
    width: '66%',
    marginTop: spacing.lg,
  },
  heroCopyCompact: {
    width: '64%',
    marginTop: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.serifMedium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 0,
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
  titleRule: {
    width: 44,
    height: 2,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.accentGold,
  },
  titleRuleCompact: {
    width: 40,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  subtitleCompact: {
    fontSize: 14,
    lineHeight: 21,
  },
  authWrap: {
    marginTop: -(spacing.huge + spacing.xxxl + spacing.sm),
  },
  authWrapCompact: {
    marginTop: -(spacing.huge + spacing.xxxl + spacing.sm),
  },
});
