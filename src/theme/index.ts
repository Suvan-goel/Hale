/**
 * Hale design system — the single source of truth for colour, type, spacing,
 * radii and depth. Screens and shared components reference these tokens rather
 * than hardcoding repeated visual values.
 *
 * The aesthetic: clean premium health-tech. Warm neutral canvas, crisp white
 * surfaces, restrained deep-green action colour, and quiet dividers. The
 * product should feel calm, trustworthy, readable, and daily-use friendly for
 * adults 50+, never clinical, toy-like, or fitness-gimmicky.
 *
 * Single light theme. `bgBase` is mirrored in the native camera view, app.json,
 * and the skeleton preview script, so keep those values in sync when it changes.
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';

/* ----------------------------------------------------------------------------
 * Colour — crisp premium palette
 * ------------------------------------------------------------------------- */

export const colors = {
  // Refined premium palette.
  background: '#F7F5EF',
  backgroundAlt: '#F2F0EA',
  surface: '#FFFFFF',
  surfaceWarm: '#FCFAF5',
  card: '#FFFFFF',
  cardSubtle: '#F9F7F1',
  elevatedCard: '#FFFFFF',
  primaryText: '#161C18',
  secondaryText: '#5F635C',
  mutedText: '#8A8E86',
  accent: '#26382C',
  accentHover: '#1E2D23',
  accentDark: '#26382C',
  accentSoft: '#E5ECE4',
  accentBorder: '#B9C7B8',
  border: '#E4E1D8',
  borderSubtle: '#EDEAE2',
  subtleBorder: '#EDEAE2',
  inputBorder: '#DCD8CE',
  buttonText: '#F7F5EF',
  warningClay: '#9A6A3D',
  success: '#526B55',

  // Descriptive legacy names retained for existing call sites.
  warmMineralCream: '#F2F0EA',
  warmStone: '#E4E1D8',
  softIvory: '#F7F5EF',
  porcelain: '#FFFFFF',
  oliveSage: '#26382C',
  oliveSageDark: '#1E2D23',
  sageMist: '#E5ECE4',
  restorativeGreen: '#526B55',
  textPrimary: '#161C18',
  textSecondary: '#5F635C',
  textMuted: '#8A8E86',
  textOnDark: '#F7F5EF',
  warmBorder: '#E4E1D8',
  amberClay: '#9A6A3D',
  appBackground: '#F7F5EF',
  cardBackground: '#FFFFFF',

  // Compatibility aliases used across the current app.
  bgBase: '#F7F5EF',
  bgSurface: '#FFFFFF',
  bgElevated: '#FFFFFF',
  bgMaterial: '#F2F0EA',
  bgSage: '#E5ECE4',
  bgGold: '#F9F7F1',
  borderHairline: '#E4E1D8',
  divider: '#EDEAE2',
  textTertiary: '#8A8E86',
  accentDeep: '#26382C',
  sage: '#526B55',
  sageDeep: '#26382C',
  accentGold: '#7B704E',
  goldBorder: '#D8D1C0',
  positive: '#526B55',
  caution: '#9A6A3D',
  cautionSoft: '#F9F1E8',
  cautionBorder: '#E4D5C4',
  error: '#B85C50',
  debugOverlay: 'rgba(22,28,24,0.86)',
  onAccent: '#F7F5EF',
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
  huge: 56,
} as const;

/* ----------------------------------------------------------------------------
 * Shape & depth
 * ------------------------------------------------------------------------- */

export const radius = {
  input: 14,
  button: 15,
  card: 18,
  panel: 20,
  xl: 22,
  pill: 999,
  sm: 8,
} as const;

/** Minimum comfortable tap target for the 50+ audience. */
export const minTapTarget = 48;

export const shadow = {
  soft: {
    shadowColor: 'rgba(22,28,24,1)',
    shadowOpacity: 0.012,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
  } satisfies ViewStyle,
  lifted: {
    shadowColor: 'rgba(22,28,24,1)',
    shadowOpacity: 0.024,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  } satisfies ViewStyle,
} as const;

/* ----------------------------------------------------------------------------
 * Component recipes — shared visual variants for Stage 1 UI primitives
 * ------------------------------------------------------------------------- */

export const componentStyles = {
  card: {
    base: {
      padding: spacing.xl,
      borderRadius: radius.card,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderHairline,
    } satisfies ViewStyle,
    elevated: {
      padding: spacing.xl,
      borderRadius: radius.card,
      backgroundColor: colors.elevatedCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.soft,
    } satisfies ViewStyle,
    flat: {
      padding: spacing.xl,
      borderRadius: radius.card,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    } satisfies ViewStyle,
    feature: {
      padding: spacing.xl,
      borderRadius: radius.panel,
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: colors.accent,
      ...shadow.soft,
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
      minHeight: 38,
      borderRadius: 12,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderHairline,
    } satisfies ViewStyle,
    selected: {
      backgroundColor: colors.accentSoft,
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
      overflow: 'hidden',
    } satisfies ViewStyle,
    fill: {
      height: '100%',
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
    } satisfies ViewStyle,
  },
} as const;

/* ----------------------------------------------------------------------------
 * Skeleton figure palette — camera video is never shown
 * ------------------------------------------------------------------------- */

export const skeleton = {
  background: colors.bgBase,
  figureTop: '#526B55',
  figureBottom: '#1E2D23',
  bright: colors.textPrimary,
  dim: '#B7B2A8',
} as const;

export const motion = {
  durationMs: 250,
} as const;

export const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
