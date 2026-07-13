/**
 * Pearl design system — the single source of truth for colour, type, spacing,
 * radii and depth. Screens and shared components reference these tokens rather
 * than hardcoding repeated visual values.
 *
 * The aesthetic: quiet editorial wellness. A warm ivory canvas, near-black
 * typography, burgundy actions, and restrained champagne details create a
 * premium interface that remains readable and daily-use friendly.
 *
 * Warm-light everyday theme with a deeper focus canvas for active sessions.
 * `bgBase` is mirrored in app.json; `focusCanvas` is mirrored in the native
 * camera view. Keep the pair in sync when it changes.
 */

import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

/* ----------------------------------------------------------------------------
 * Colour — crisp premium palette
 * ------------------------------------------------------------------------- */

export const palette = {
  appBackground: '#FAF8F7',
  cardSurface: '#FFFDFC',
  elevatedSurface: '#F2ECE9',
  focusCanvas: '#FAF8F7',
  focusSurface: '#FFFDFC',
  focusElevated: '#F2ECE9',
  ink: '#171714',
  secondaryText: '#5F5A56',
  tertiaryText: '#8A817B',
  pearl: '#7C405D',
  pearlPressed: '#69364F',
  blush: '#8E3158',
  softBlushFill: 'rgba(142,49,88,0.10)',
  border: 'rgba(48,39,33,0.14)',
  strongBorder: 'rgba(142,49,88,0.34)',
  warmPremiumAccent: '#9B7B4D',
  softGoldFill: 'rgba(155,123,77,0.11)',
  restorativeSage: '#68735E',
  softShadow: 'rgba(56,39,28,0.14)',
} as const;

export const colors = {
  // Warm ivory editorial palette.
  background: palette.appBackground,
  surface: palette.cardSurface,
  card: palette.cardSurface,
  elevatedCard: palette.elevatedSurface,
  primaryText: palette.ink,
  accent: palette.pearl,
  accentHover: palette.pearlPressed,
  accentDark: palette.blush,
  accentSoft: palette.softBlushFill,
  accentBorder: palette.strongBorder,
  border: palette.border,
  borderSubtle: palette.border,
  inputBorder: palette.strongBorder,
  buttonText: '#FFFFFF',
  warningClay: palette.warmPremiumAccent,

  textPrimary: palette.ink,
  textSecondary: palette.secondaryText,
  textMuted: palette.tertiaryText,

  // Compatibility aliases used across the current app.
  bgBase: palette.appBackground,
  bgSurface: palette.cardSurface,
  bgElevated: palette.elevatedSurface,
  bgMaterial: palette.elevatedSurface,
  focusCanvas: palette.focusCanvas,
  focusSurface: palette.focusSurface,
  focusElevated: palette.focusElevated,
  bgGold: palette.softGoldFill,
  borderHairline: palette.border,
  divider: palette.border,
  textTertiary: palette.tertiaryText,
  accentDeep: palette.blush,
  sageDeep: palette.restorativeSage,
  accentGold: palette.warmPremiumAccent,
  goldBorder: palette.strongBorder,
  positive: palette.restorativeSage,
  caution: palette.warmPremiumAccent,
  cautionSoft: palette.softGoldFill,
  cautionBorder: palette.strongBorder,
  error: '#A44747',
  imageScrim: 'rgba(8,9,11,0.58)',
  overlaySurface: 'rgba(250,248,247,0.98)',
  navigationDivider: 'rgba(48,39,33,0.14)',
  modalBackdrop: 'rgba(0,0,0,0.76)',
  shadowSoft: palette.softShadow,
  onAccent: '#FFFFFF',
} as const;

/** Fixed colours required when rendering third-party identity marks. */
export const externalBrandColors = {
  googleBlue: '#4285F4',
  googleGreen: '#34A853',
  googleYellow: '#FBBC05',
  googleRed: '#EA4335',
} as const;

/* ----------------------------------------------------------------------------
 * Typography — modern sans-led hierarchy with restrained serif available
 * ------------------------------------------------------------------------- */

export const fonts = {
  serifRegular: 'Fraunces_400Regular',
  serifMedium: 'Fraunces_500Medium',
  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
} as const;

export const type = {
  display: { fontFamily: fonts.serifRegular, fontSize: 36, lineHeight: 43, letterSpacing: 0, color: colors.textPrimary },
  h1: { fontFamily: fonts.serifRegular, fontSize: 30, lineHeight: 36, letterSpacing: 0, color: colors.textPrimary },
  h2: { fontFamily: fonts.sansMedium, fontSize: 22, lineHeight: 29, letterSpacing: 0, color: colors.textPrimary },
  h3: { fontFamily: fonts.sansMedium, fontSize: 18, lineHeight: 25, letterSpacing: 0, color: colors.textPrimary },

  body: { fontFamily: fonts.sansRegular, fontSize: 17, lineHeight: 27, letterSpacing: 0, color: colors.textPrimary },
  bodySmall: { fontFamily: fonts.sansRegular, fontSize: 15, lineHeight: 23, letterSpacing: 0, color: colors.textPrimary },
  caption: { fontFamily: fonts.sansRegular, fontSize: 14, lineHeight: 20, letterSpacing: 0, color: colors.textSecondary },
  pageTitle: { fontFamily: fonts.serifRegular, fontSize: 30, lineHeight: 36, letterSpacing: 0, color: colors.textPrimary },
  pageSubtitle: { fontFamily: fonts.sansRegular, fontSize: 14, lineHeight: 20, letterSpacing: 0, color: colors.textSecondary },
  cardTitle: { fontFamily: fonts.serifMedium, fontSize: 18, lineHeight: 24, letterSpacing: 0, color: colors.textPrimary },
  cardBody: { fontFamily: fonts.sansRegular, fontSize: 14, lineHeight: 20, letterSpacing: 0, color: colors.textSecondary },
  cardCaption: { fontFamily: fonts.sansRegular, fontSize: 12, lineHeight: 16, letterSpacing: 0, color: colors.textSecondary },
  cardRowTitle: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 19, letterSpacing: 0, color: colors.textPrimary },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },

  button: { fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 20, letterSpacing: 0, color: colors.onAccent },

  metric: { fontFamily: fonts.sansRegular, fontSize: 82, lineHeight: 92, letterSpacing: 0, fontVariant: ['tabular-nums'], color: colors.textPrimary },
  metricMedium: { fontFamily: fonts.sansRegular, fontSize: 48, lineHeight: 56, letterSpacing: 0, fontVariant: ['tabular-nums'], color: colors.textPrimary },
  metricSmall: { fontFamily: fonts.sansRegular, fontSize: 28, lineHeight: 36, letterSpacing: 0, fontVariant: ['tabular-nums'], color: colors.textSecondary },
} satisfies Record<string, TextStyle>;

/* ----------------------------------------------------------------------------
 * Spacing — roomy, comfortable rhythm
 * ------------------------------------------------------------------------- */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  pageTop: 24,
  pageHorizontal: 16,
  pageMaxWidth: 430,
  huge: 56,
} as const;

/* ----------------------------------------------------------------------------
 * Shape & depth
 * ------------------------------------------------------------------------- */

export const radius = {
  input: 12,
  button: 16,
  card: 12,
  panel: 16,
  xl: 18,
  modal: 20,
  pill: 999,
  sm: 10,
} as const;

/** Minimum comfortable tap target for the 50+ audience. */
export const minTapTarget = 48;

export const shadow = {
  card: {
    boxShadow: '0 0 0 rgba(0,0,0,0)',
    shadowColor: '#000000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  } satisfies ViewStyle,
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  } satisfies ViewStyle,
  lifted: {
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  } satisfies ViewStyle,
} as const;

/* ----------------------------------------------------------------------------
 * Component recipes — shared visual variants for Stage 1 UI primitives
 * ------------------------------------------------------------------------- */

export const componentStyles = {
  card: {
    base: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: radius.card,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderHairline,
      ...shadow.card,
    } satisfies ViewStyle,
    elevated: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: radius.card,
      backgroundColor: colors.elevatedCard,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderHairline,
      ...shadow.card,
    } satisfies ViewStyle,
    flat: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: radius.card,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderHairline,
    } satisfies ViewStyle,
    feature: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: radius.panel,
      backgroundColor: colors.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accentBorder,
      ...shadow.card,
    } satisfies ViewStyle,
  },
  button: {
    base: {
      minHeight: 52,
      borderRadius: radius.button,
      paddingHorizontal: 20,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    } satisfies ViewStyle,
    primary: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    } satisfies ViewStyle,
    secondary: {
      backgroundColor: colors.surface,
      borderColor: colors.borderHairline,
    } satisfies ViewStyle,
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      paddingHorizontal: spacing.lg,
      minHeight: 44,
    } satisfies ViewStyle,
    danger: {
      backgroundColor: colors.cautionSoft,
      borderColor: colors.cautionBorder,
    } satisfies ViewStyle,
  },
  input: {
    field: {
      gap: spacing.xs,
    } satisfies ViewStyle,
    base: {
      minHeight: 52,
      borderRadius: radius.input,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    } satisfies ViewStyle,
    multiline: {
      minHeight: 92,
      textAlignVertical: 'top',
    } satisfies TextStyle,
    error: {
      borderColor: colors.error,
    } satisfies ViewStyle,
  },
} as const;
