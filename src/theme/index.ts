/**
 * Hale design system — the single source of truth for colour, type, spacing,
 * radii and depth. Screens and shared components reference these tokens rather
 * than hardcoding repeated visual values.
 *
 * The aesthetic: premium longevity wellness. Warm ivory canvas, restrained
 * cream cards, deep olive-sage action colour, and quiet clay detail. The
 * product should feel calm, trustworthy, readable, and daily-use friendly for
 * adults 50+, never clinical, toy-like, or fitness-gimmicky.
 *
 * Single light theme. `bgBase` is mirrored in the native camera view, app.json,
 * and the skeleton preview script, so keep those values in sync when it changes.
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';

/* ----------------------------------------------------------------------------
 * Colour — warm longevity palette
 * ------------------------------------------------------------------------- */

export const colors = {
  // Refined premium palette.
  background: '#F6F0E7',
  surface: '#FFFDF7',
  card: '#FBF7EF',
  elevatedCard: '#FFFFFF',
  primaryText: '#20261F',
  secondaryText: '#706A60',
  mutedText: '#8A8377',
  accent: '#4F5A45',
  accentDark: '#30382D',
  accentSoft: '#DDE3D4',
  border: '#E7DDCB',
  subtleBorder: '#EFE6D8',
  buttonText: '#F8F3EA',
  warningClay: '#B9824A',

  // Descriptive legacy names retained for existing call sites.
  warmMineralCream: '#EAE0D1',
  warmStone: '#D8CCB7',
  softIvory: '#F6F0E7',
  porcelain: '#FBF7EF',
  oliveSage: '#4F5A45',
  oliveSageDark: '#30382D',
  sageMist: '#DDE3D4',
  restorativeGreen: '#5F6D52',
  textPrimary: '#20261F',
  textSecondary: '#706A60',
  textMuted: '#8A8377',
  textOnDark: '#F8F3EA',
  warmBorder: '#E7DDCB',
  amberClay: '#B9824A',
  appBackground: '#F6F0E7',
  cardBackground: '#FBF7EF',

  // Compatibility aliases used across the current app.
  bgBase: '#F6F0E7',
  bgSurface: '#FBF7EF',
  bgElevated: '#FFFFFF',
  bgMaterial: '#EAE0D1',
  bgSage: '#DDE3D4',
  bgGold: '#F0E3CB',
  borderHairline: '#E7DDCB',
  divider: '#EFE6D8',
  textTertiary: '#8A8377',
  accentDeep: '#30382D',
  sage: '#5F6D52',
  sageDeep: '#4F5A45',
  accentGold: '#B9824A',
  goldBorder: '#D9BE91',
  positive: '#4F5A45',
  caution: '#B9824A',
  cautionSoft: '#F4E5D3',
  cautionBorder: '#E2C29F',
  error: '#A35A50',
  debugOverlay: 'rgba(32,38,31,0.86)',
  onAccent: '#F8F3EA',
} as const;

/* ----------------------------------------------------------------------------
 * Typography — elegant serif headings (Fraunces) + readable sans (Inter)
 * ------------------------------------------------------------------------- */

export const fonts = {
  serifRegular: 'Fraunces_400Regular',
  serifMedium: 'Fraunces_500Medium',
  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
} as const;

export const type = {
  display: { fontFamily: fonts.serifMedium, fontSize: 32, lineHeight: 38, letterSpacing: 0, color: colors.textPrimary },
  h1: { fontFamily: fonts.serifMedium, fontSize: 28, lineHeight: 34, letterSpacing: 0, color: colors.textPrimary },
  h2: { fontFamily: fonts.serifMedium, fontSize: 21, lineHeight: 28, letterSpacing: 0, color: colors.textPrimary },
  h3: { fontFamily: fonts.sansMedium, fontSize: 18, lineHeight: 25, letterSpacing: 0, color: colors.textPrimary },

  body: { fontFamily: fonts.sansRegular, fontSize: 16, lineHeight: 25, letterSpacing: 0, color: colors.textPrimary },
  bodySmall: { fontFamily: fonts.sansRegular, fontSize: 15, lineHeight: 23, letterSpacing: 0, color: colors.textPrimary },
  caption: { fontFamily: fonts.sansRegular, fontSize: 14, lineHeight: 20, letterSpacing: 0, color: colors.textSecondary },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
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
  input: 16,
  button: 20,
  card: 22,
  panel: 24,
  xl: 26,
  pill: 999,
  sm: 10,
} as const;

/** Minimum comfortable tap target for the 50+ audience. */
export const minTapTarget = 48;

export const shadow = {
  soft: {
    shadowColor: 'rgba(72,58,38,1)',
    shadowOpacity: 0.028,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  } satisfies ViewStyle,
  lifted: {
    shadowColor: 'rgba(72,58,38,1)',
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  } satisfies ViewStyle,
} as const;

/* ----------------------------------------------------------------------------
 * Skeleton figure palette — camera video is never shown
 * ------------------------------------------------------------------------- */

export const skeleton = {
  background: colors.bgBase,
  figureTop: '#4F5A45',
  figureBottom: '#30382D',
  bright: colors.textPrimary,
  dim: '#B7AF9E',
} as const;

export const motion = {
  durationMs: 250,
} as const;

export const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
