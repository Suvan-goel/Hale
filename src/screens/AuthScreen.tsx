import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AccountAuthCard } from '../components/AccountAuthCard';
import { AppBackground } from '../components/AppBackground';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui';
import { useSystemInsets } from '../components/SystemInsetsProvider';
import { colors, fonts, spacing } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

import { BRAND } from '../brand';
const AUTH_HERO_IMAGE = require('../../assets/images/pearl-auth-hero-generated.png');
const AUTH_CARD_OVERLAP = spacing.huge + spacing.xxxl + spacing.sm;

export function AuthScreen({
  onContinueWithoutAccount,
}: {
  onContinueWithoutAccount?: () => void;
} = {}) {
  const responsive = useResponsiveLayout();
  const systemInsets = useSystemInsets();
  const isCompactPhone = responsive.isCompactPhone;

  return (
    <View style={styles.container}>
      <AppBackground />
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: responsive.maxContentWidth,
            paddingBottom: spacing.xxxl + systemInsets.bottom,
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.hero, isCompactPhone && styles.heroCompact]}>
          <Image
            source={AUTH_HERO_IMAGE}
            style={[styles.heroImage, isCompactPhone && styles.heroImageCompact]}
            resizeMode="cover"
          />
          <View pointerEvents="none" style={styles.heroScrim} />
          <View
            style={[
              styles.heroContent,
              isCompactPhone && styles.heroContentCompact,
              { paddingHorizontal: responsive.horizontalPadding },
            ]}
          >
            <PageHeader title="Sign in" brandMarkSize={isCompactPhone ? 30 : 34} />
            <View style={[styles.heroCopy, isCompactPhone && styles.heroCopyCompact]}>
              <Text style={[styles.title, isCompactPhone && styles.titleCompact]}>Strength for this chapter</Text>
              <View style={[styles.titleRule, isCompactPhone && styles.titleRuleCompact]} />
              <Text style={[styles.subtitle, isCompactPhone && styles.subtitleCompact]}>
                {BRAND.appName} pairs private Strength and Balance check-ups with a voice-guided home programme for the menopause years.
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
          {onContinueWithoutAccount ? (
            <Button
              title="Continue without an account"
              variant="ghost"
              onPress={onContinueWithoutAccount}
              style={styles.continueWithoutAccount}
            />
          ) : null}
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
  heroScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.imageScrim,
  },
  heroContent: {
    flex: 1,
    paddingTop: spacing.xxxl + spacing.sm,
    paddingBottom: AUTH_CARD_OVERLAP + spacing.xxl,
  },
  heroContentCompact: {
    paddingTop: spacing.xxxl + spacing.xs,
    paddingBottom: AUTH_CARD_OVERLAP + spacing.xl,
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
    marginTop: -AUTH_CARD_OVERLAP,
  },
  authWrapCompact: {
    marginTop: -AUTH_CARD_OVERLAP,
  },
  continueWithoutAccount: {
    marginTop: spacing.md,
  },
});
