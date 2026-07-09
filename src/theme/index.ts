/**
 * Pearl design system — the single source of truth for colour, type, spacing,
 * radii and depth. Screens and shared components reference these tokens rather
 * than hardcoding repeated visual values.
 *
 * The aesthetic: quiet, modern longevity. A charcoal canvas, layered graphite
 * surfaces, warm pearl actions, and restrained blush details create a calm,
 * premium interface that remains readable and daily-use friendly for adults
 * 50+, never clinical, toy-like, or fitness-gimmicky.
 *
 * Single warm-dark theme with a deeper focus canvas for active sessions.
 * `bgBase` is mirrored in app.json; `focusCanvas` is mirrored in the native
 * camera view and skeleton preview. Keep each pair in sync when it changes.
 */

import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';

/* ----------------------------------------------------------------------------
 * Colour — crisp premium palette
 * ------------------------------------------------------------------------- */

export const palette = {
  appBackground: '#111316',
  appBackgroundWarm: '#292524',
  appBackgroundMid: '#1A1A1D',
  cardSurface: '#1D1F22',
  elevatedSurface: '#24262A',
  warmSurface: '#252326',
  focusCanvas: '#101114',
  focusSurface: '#181A1D',
  focusElevated: '#202226',
  ink: '#F1E8E4',
  secondaryText: '#C4BAB6',
  tertiaryText: '#97908D',
  pearl: '#EADAD4',
  pearlPressed: '#DECBC4',
  blush: '#D0A296',
  softBlushFill: 'rgba(234,218,212,0.10)',
  verySoftBlushFill: 'rgba(234,218,212,0.055)',
  border: 'rgba(241,232,228,0.075)',
  strongBorder: 'rgba(241,232,228,0.15)',
  warmPremiumAccent: '#C3A17C',
  softGoldFill: 'rgba(195,161,124,0.12)',
  restorativeSage: '#9BAB94',
  softShadow: 'rgba(0,0,0,0.24)',
} as const;

export const colors = {
  // Premium charcoal + pearl palette.
  background: palette.appBackground,
  backgroundAlt: palette.elevatedSurface,
  surface: palette.cardSurface,
  surfaceWarm: palette.warmSurface,
  card: palette.cardSurface,
  cardSubtle: palette.elevatedSurface,
  elevatedCard: palette.elevatedSurface,
  primaryText: palette.ink,
  secondaryText: palette.secondaryText,
  mutedText: palette.tertiaryText,
  accent: palette.pearl,
  accentHover: palette.pearlPressed,
  accentDark: palette.blush,
  accentSoft: palette.softBlushFill,
  accentBorder: palette.strongBorder,
  border: palette.border,
  borderSubtle: palette.border,
  subtleBorder: palette.border,
  inputBorder: palette.strongBorder,
  buttonText: palette.focusCanvas,
  warningClay: palette.warmPremiumAccent,
  success: palette.restorativeSage,

  // Descriptive legacy names retained for existing call sites.
  warmMineralCream: palette.appBackground,
  warmStone: palette.border,
  softIvory: palette.ink,
  porcelain: palette.pearl,
  oliveSage: palette.restorativeSage,
  oliveSageDark: palette.restorativeSage,
  sageMist: palette.softBlushFill,
  restorativeGreen: palette.restorativeSage,
  textPrimary: palette.ink,
  textSecondary: palette.secondaryText,
  textMuted: palette.tertiaryText,
  textOnDark: palette.ink,
  warmBorder: palette.border,
  amberClay: palette.warmPremiumAccent,
  appBackground: palette.appBackground,
  cardBackground: palette.cardSurface,

  // Compatibility aliases used across the current app.
  bgBase: palette.appBackground,
  bgGradientStart: palette.appBackground,
  bgGradientWarm: palette.appBackgroundWarm,
  bgGradientMid: palette.appBackgroundMid,
  bgGradientEnd: palette.appBackground,
  bgSurface: palette.cardSurface,
  bgElevated: palette.elevatedSurface,
  bgMaterial: palette.elevatedSurface,
  focusCanvas: palette.focusCanvas,
  focusSurface: palette.focusSurface,
  focusElevated: palette.focusElevated,
  bgSage: palette.verySoftBlushFill,
  bgGold: palette.softGoldFill,
  borderHairline: palette.border,
  divider: palette.border,
  textTertiary: palette.tertiaryText,
  accentDeep: palette.blush,
  sage: palette.strongBorder,
  sageDeep: palette.restorativeSage,
  accentGold: palette.warmPremiumAccent,
  goldBorder: palette.strongBorder,
  positive: palette.restorativeSage,
  caution: palette.warmPremiumAccent,
  cautionSoft: palette.softGoldFill,
  cautionBorder: palette.strongBorder,
  error: '#D48686',
  debugOverlay: 'rgba(8,9,11,0.92)',
  imageScrim: 'rgba(8,9,11,0.58)',
  overlaySurface: 'rgba(17,19,22,0.96)',
  modalBackdrop: 'rgba(0,0,0,0.76)',
  shadowSoft: palette.softShadow,
  onAccent: palette.focusCanvas,
} as const;

export const imageOverlayControl = {
  background: 'rgba(15,17,20,0.68)',
  border: 'rgba(241,232,228,0.20)',
  text: colors.textPrimary,
} as const;

export const todayHomeColors = {
  background: palette.appBackground,
  card: palette.cardSurface,
  cardAlt: palette.elevatedSurface,
  iconFill: palette.verySoftBlushFill,
  ringTrack: palette.strongBorder,
  border: palette.border,
  shadow: palette.softShadow,
  primaryText: palette.ink,
  headingGreen: palette.blush,
  secondaryText: palette.secondaryText,
  mutedText: palette.tertiaryText,
  primary: palette.pearl,
  hero: palette.cardSurface,
  heroDeep: palette.appBackground,
  tabActive: palette.blush,
  warmWhite: palette.ink,
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
  pageTop: 32,
  pageHorizontal: 16,
  pageMaxWidth: 430,
  huge: 56,
} as const;

/* ----------------------------------------------------------------------------
 * Shape & depth
 * ------------------------------------------------------------------------- */

export const radius = {
  input: 8,
  button: 8,
  card: 8,
  panel: 8,
  xl: 8,
  modal: 8,
  pill: 999,
  sm: 8,
} as const;

/** Minimum comfortable tap target for the 50+ audience. */
export const minTapTarget = 48;

export const shadow = {
  card: {
    boxShadow: '0 1px 0 rgba(255,255,255,0.018), 0 7px 20px rgba(0,0,0,0.22)',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
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
  listRow: {
    base: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    } satisfies ViewStyle,
    inset: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.input,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    } satisfies ViewStyle,
  },
  progress: {
    track: {
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSage,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderHairline,
      overflow: 'hidden',
    } satisfies ViewStyle,
    fill: {
      height: '100%',
      borderRadius: radius.pill,
      backgroundColor: colors.positive,
    } satisfies ViewStyle,
  },
} as const;

/* ----------------------------------------------------------------------------
 * Skeleton figure palette — camera video is never shown
 * ------------------------------------------------------------------------- */

export const skeleton = {
  background: colors.focusCanvas,
  figureTop: palette.pearl,
  figureBottom: palette.blush,
  bright: colors.textPrimary,
  dim: colors.textTertiary,
} as const;

export const motion = {
  durationMs: 250,
} as const;

export const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
