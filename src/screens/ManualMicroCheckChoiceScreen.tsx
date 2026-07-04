import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { MovementDomain } from '../adherence';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { Screen } from '../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

const DOMAIN_OPTIONS: readonly {
  domain: MovementDomain;
  title: string;
  body: string;
}[] = [
  {
    domain: 'strength_power',
    title: 'Strength',
    body: 'A short chair-rise check-in for power.',
  },
  {
    domain: 'balance',
    title: 'Balance',
    body: 'A short steadiness check-in.',
  },
  {
    domain: 'mobility',
    title: 'Mobility',
    body: 'A short range-of-motion check-in.',
  },
];

export function ManualMicroCheckDomainScreen({
  onSelectDomain,
  onBack,
}: {
  onSelectDomain: (domain: MovementDomain) => void;
  onBack: () => void;
}) {
  const responsive = useResponsiveLayout();
  return (
    <Screen contentStyle={styles.screen}>
      <BackArrowButton accessibilityLabel="Back" onPress={onBack} />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Quick micro check-up</Text>
        <View style={styles.titleRow}>
          <HeaderLogo />
          <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>
            Choose an area
          </Text>
        </View>
        <Text style={styles.subtitle}>This optional check-in is for your reference. It will not change your plan.</Text>
      </View>

      <View style={styles.optionStack}>
        {DOMAIN_OPTIONS.map((option) => (
          <Pressable
            key={option.domain}
            style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
            onPress={() => onSelectDomain(option.domain)}
            accessibilityRole="button"
            accessibilityLabel={`${option.title}. ${option.body}`}
          >
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionBody}>{option.body}</Text>
            </View>
            <View style={styles.optionArrow}>
              <Svg width={7} height={13} viewBox="0 0 7 13" accessibilityElementsHidden>
                <Path
                  d="M1 1.5L5.5 6.5L1 11.5"
                  fill="none"
                  stroke={colors.accentDeep}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.xl,
  },
  header: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  eyebrow: {
    ...type.label,
    color: colors.accentDeep,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  title: {
    ...type.pageTitle,
    flexShrink: 1,
  },
  subtitle: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  optionStack: {
    gap: spacing.md,
  },
  optionRow: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.card,
    boxShadow: '0 12px 30px rgba(17,20,18,0.038)',
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  optionTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  optionBody: {
    ...type.cardBody,
    fontSize: 15,
    lineHeight: 22,
  },
  optionArrow: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    backgroundColor: colors.surface,
    boxShadow: '0 6px 16px rgba(17,20,18,0.045)',
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.992 }],
  },
});
