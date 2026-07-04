/**
 * Hale design system — the single source of truth for colour, type, spacing,
 * radii and depth. Screens and shared components reference these tokens rather
 * than hardcoding repeated visual values.
 *
 * The aesthetic: clean premium longevity. Light warm canvas, soft ivory
 * surfaces, inky green action colour, and quiet stone dividers. The
 * product should feel calm, trustworthy, readable, and daily-use friendly for
 * adults 50+, never clinical, toy-like, or fitness-gimmicky.
 *
 * Single light theme. `bgBase` is mirrored in the native camera view, app.json,
 * and the skeleton preview script, so keep those values in sync when it changes.
 */

import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';

/* ----------------------------------------------------------------------------
 * Colour — crisp premium palette
 * ------------------------------------------------------------------------- */

export const palette = {
  appBackground: '#F9F5EF',
  cardSurface: '#FFFDF9',
  elevatedSurface: '#FFFDF9',
  ink: '#111412',
  secondaryText: '#68706A',
  tertiaryText: '#8A908A',
  brandGreen: '#414C34',
  brandGreenPressed: '#414C34',
  emeraldAccent: '#414C34',
  softGreenFill: 'transparent',
  verySoftGreenFill: 'transparent',
  border: '#E4E0D6',
  strongBorder: '#D8D3C8',
  warmPremiumAccent: '#A98243',
  softGoldFill: '#F4EFE4',
  softShadow: 'rgba(17,20,18,0.05)',
} as const;

export const colors = {
  // Premium warm-stone + inky-green palette.
  background: palette.appBackground,
  backgroundAlt: palette.elevatedSurface,
  surface: palette.cardSurface,
  surfaceWarm: palette.elevatedSurface,
  card: palette.cardSurface,
  cardSubtle: palette.elevatedSurface,
  elevatedCard: palette.elevatedSurface,
  primaryText: palette.ink,
  secondaryText: palette.secondaryText,
  mutedText: palette.tertiaryText,
  accent: palette.brandGreen,
  accentHover: palette.brandGreenPressed,
  accentDark: palette.brandGreenPressed,
  accentSoft: palette.softGreenFill,
  accentBorder: palette.strongBorder,
  border: palette.border,
  borderSubtle: palette.border,
  subtleBorder: palette.border,
  inputBorder: palette.strongBorder,
  buttonText: palette.cardSurface,
  warningClay: palette.warmPremiumAccent,
  success: palette.emeraldAccent,

  // Descriptive legacy names retained for existing call sites.
  warmMineralCream: palette.appBackground,
  warmStone: palette.border,
  softIvory: palette.appBackground,
  porcelain: palette.cardSurface,
  oliveSage: palette.brandGreen,
  oliveSageDark: palette.brandGreenPressed,
  sageMist: palette.softGreenFill,
  restorativeGreen: palette.brandGreen,
  textPrimary: palette.ink,
  textSecondary: palette.secondaryText,
  textMuted: palette.tertiaryText,
  textOnDark: palette.cardSurface,
  warmBorder: palette.border,
  amberClay: palette.warmPremiumAccent,
  appBackground: palette.appBackground,
  cardBackground: palette.cardSurface,

  // Compatibility aliases used across the current app.
  bgBase: palette.appBackground,
  bgSurface: palette.cardSurface,
  bgElevated: palette.elevatedSurface,
  bgMaterial: palette.elevatedSurface,
  bgSage: palette.verySoftGreenFill,
  bgGold: palette.softGoldFill,
  borderHairline: palette.border,
  divider: palette.border,
  textTertiary: palette.tertiaryText,
  accentDeep: palette.brandGreenPressed,
  sage: palette.strongBorder,
  sageDeep: palette.brandGreen,
  accentGold: palette.warmPremiumAccent,
  goldBorder: palette.strongBorder,
  positive: palette.emeraldAccent,
  caution: palette.warmPremiumAccent,
  cautionSoft: palette.softGoldFill,
  cautionBorder: palette.strongBorder,
  error: '#B85C50',
  debugOverlay: 'rgba(17,20,18,0.86)',
  shadowSoft: palette.softShadow,
  onAccent: palette.cardSurface,
} as const;

export const imageOverlayControl = {
  background: 'rgba(255,253,249,0.25)',
  border: 'rgba(255,253,249,0.28)',
  text: colors.onAccent,
} as const;

export const todayHomeColors = {
  background: '#F9F5EF',
  card: '#FFFDF9',
  cardAlt: '#FFFDF9',
  iconFill: 'transparent',
  ringTrack: '#ECE7DA',
  border: '#E5DED2',
  shadow: 'rgba(17,20,18,0.04)',
  primaryText: '#142019',
  headingGreen: '#414C34',
  secondaryText: '#62685F',
  mutedText: '#7B8178',
  primary: '#414C34',
  hero: '#414C34',
  heroDeep: '#414C34',
  tabActive: '#414C34',
  warmWhite: '#FFFDF9',
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
  display: { fontFamily: fonts.sansMedium, fontSize: 36, lineHeight: 43, letterSpacing: 0, color: colors.textPrimary },
  h1: { fontFamily: fonts.sansMedium, fontSize: 30, lineHeight: 36, letterSpacing: 0, color: colors.textPrimary },
  h2: { fontFamily: fonts.sansMedium, fontSize: 22, lineHeight: 29, letterSpacing: 0, color: colors.textPrimary },
  h3: { fontFamily: fonts.sansMedium, fontSize: 18, lineHeight: 25, letterSpacing: 0, color: colors.textPrimary },

  body: { fontFamily: fonts.sansRegular, fontSize: 17, lineHeight: 27, letterSpacing: 0, color: colors.textPrimary },
  bodySmall: { fontFamily: fonts.sansRegular, fontSize: 15, lineHeight: 23, letterSpacing: 0, color: colors.textPrimary },
  caption: { fontFamily: fonts.sansRegular, fontSize: 14, lineHeight: 20, letterSpacing: 0, color: colors.textSecondary },
  pageTitle: { fontFamily: fonts.serifRegular, fontSize: 28, lineHeight: 34, letterSpacing: 0, color: colors.textPrimary },
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
  pageTop: 40,
  pageHorizontal: 18,
  pageMaxWidth: 430,
  huge: 56,
} as const;

/* ----------------------------------------------------------------------------
 * Shape & depth
 * ------------------------------------------------------------------------- */

export const radius = {
  input: 14,
  button: 999,
  card: 16,
  panel: 20,
  xl: 22,
  modal: 28,
  pill: 999,
  sm: 8,
} as const;

/** Minimum comfortable tap target for the 50+ audience. */
export const minTapTarget = 48;

export const shadow = {
  card: {
    // Soft but perceptible lift so a card reads as a distinct surface against
    // the near-identical warm background (bgBase #F9F5EF vs card #FFFDF9).
    // Kept quiet to preserve the calm aesthetic; a real downward offset does
    // the work a 0-offset near-zero shadow could not.
    boxShadow: '0 1px 2px rgba(17,20,18,0.05), 0 4px 14px rgba(17,20,18,0.05)',
    shadowColor: 'rgba(17,20,18,1)',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  } satisfies ViewStyle,
  soft: {
    shadowColor: 'rgba(17,20,18,1)',
    shadowOpacity: 0.025,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  } satisfies ViewStyle,
  lifted: {
    shadowColor: 'rgba(17,20,18,1)',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  } satisfies ViewStyle,
} as const;

/* ----------------------------------------------------------------------------
 * Component recipes — shared visual variants for Stage 1 UI primitives
 * ------------------------------------------------------------------------- */

export const componentStyles = {
  card: {
    base: {
      paddingHorizontal: 18,
      paddingVertical: 18,
      borderRadius: radius.card,
      backgroundColor: colors.card,
      ...shadow.card,
    } satisfies ViewStyle,
    elevated: {
      paddingHorizontal: 18,
      paddingVertical: 18,
      borderRadius: radius.card,
      backgroundColor: colors.elevatedCard,
      ...shadow.card,
    } satisfies ViewStyle,
    flat: {
      paddingHorizontal: 18,
      paddingVertical: 18,
      borderRadius: radius.card,
      backgroundColor: colors.card,
      ...shadow.card,
    } satisfies ViewStyle,
    feature: {
      paddingHorizontal: 18,
      paddingVertical: 18,
      borderRadius: radius.panel,
      backgroundColor: colors.accent,
      ...shadow.card,
    } satisfies ViewStyle,
  },
  button: {
    base: {
      minHeight: 56,
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
      minHeight: 56,
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
  chip: {
    base: {
      // Comfortable tap target for the 50+ audience (was 38, below minTapTarget).
      minHeight: 46,
      borderRadius: 12,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderHairline,
    } satisfies ViewStyle,
    selected: {
      // A real fill (matches the onboarding Choice control) so the selected
      // state does not rely on a near-identical border + text-colour shift.
      backgroundColor: colors.bgGold,
      borderColor: colors.accentBorder,
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
  background: colors.bgBase,
  figureTop: palette.brandGreen,
  figureBottom: palette.brandGreenPressed,
  bright: colors.textPrimary,
  dim: colors.textTertiary,
} as const;

export const motion = {
  durationMs: 250,
} as const;

export const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
