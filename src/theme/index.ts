/**
 * Hale design system — the single source of truth for colour, type, spacing,
 * radii and depth. Screens and shared components reference these tokens rather
 * than hardcoding repeated visual values.
 *
 * The aesthetic: premium longevity wellness. Soft ivory canvas, rounded
 * porcelain cards, deep olive-sage action colour, warm sandstone surfaces, and
 * restrained amber-clay detail. The product should feel calm, trustworthy,
 * readable, and daily-use friendly for adults 50+, never clinical or
 * fitness-gimmicky.
 *
 * Single light theme. `bgBase` is mirrored in the native camera view, app.json,
 * and the skeleton preview script, so keep those values in sync when it changes.
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';

/* ----------------------------------------------------------------------------
 * Colour — warm longevity palette
 * ------------------------------------------------------------------------- */

export const colors = {
  // Requested brand palette.
  warmMineralCream: '#D8CEBA',
  warmStone: '#D6CAB4',
  softIvory: '#F4EFE6',
  porcelain: '#FBF7EF',
  oliveSage: '#4F5A45',
  oliveSageDark: '#252A22',
  sageMist: '#DDE3D4',
  restorativeGreen: '#6F7F5D',
  textPrimary: '#252A22',
  textSecondary: '#6F6A5F',
  textMuted: '#8C8678',
  textOnDark: '#F8F3EA',
  warmBorder: '#E5DCCB',
  subtleBorder: '#EEE6D8',
  amberClay: '#B9824A',
  appBackground: '#F4EFE6',
  cardBackground: '#FBF7EF',
  elevatedCard: '#FFFAF2',

  // Compatibility aliases used across the current app.
  bgBase: '#F4EFE6',
  bgSurface: '#FBF7EF',
  bgElevated: '#FFFAF2',
  bgMaterial: '#D8CEBA',
  bgSage: '#DDE3D4',
  bgGold: '#EEE0C4',
  borderHairline: '#E5DCCB',
  divider: '#EEE6D8',
  textTertiary: '#8C8678',
  accent: '#4F5A45',
  accentDeep: '#252A22',
  accentSoft: '#DDE3D4',
  sage: '#6F7F5D',
  sageDeep: '#4F5A45',
  accentGold: '#B9824A',
  goldBorder: '#DEC79C',
  positive: '#4F5A45',
  caution: '#B9824A',
  cautionSoft: '#F4E4D4',
  cautionBorder: '#E4C4A4',
  error: '#A35A50',
  debugOverlay: 'rgba(37,42,34,0.86)',
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
  display: { fontFamily: fonts.serifMedium, fontSize: 34, lineHeight: 40, letterSpacing: 0, color: colors.textPrimary },
  h1: { fontFamily: fonts.serifMedium, fontSize: 29, lineHeight: 35, letterSpacing: 0, color: colors.textPrimary },
  h2: { fontFamily: fonts.serifMedium, fontSize: 22, lineHeight: 29, letterSpacing: 0, color: colors.textPrimary },
  h3: { fontFamily: fonts.sansMedium, fontSize: 18, lineHeight: 25, letterSpacing: 0, color: colors.textPrimary },

  body: { fontFamily: fonts.sansRegular, fontSize: 17, lineHeight: 27, letterSpacing: 0, color: colors.textPrimary },
  bodySmall: { fontFamily: fonts.sansRegular, fontSize: 16, lineHeight: 24, letterSpacing: 0, color: colors.textPrimary },
  caption: { fontFamily: fonts.sansRegular, fontSize: 15, lineHeight: 22, letterSpacing: 0, color: colors.textSecondary },
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
  input: 18,
  card: 24,
  panel: 28,
  xl: 32,
  pill: 999,
  sm: 12,
} as const;

/** Minimum comfortable tap target for the 50+ audience. */
export const minTapTarget = 48;

export const shadow = {
  soft: {
    shadowColor: 'rgba(72,58,38,1)',
    shadowOpacity: 0.045,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  } satisfies ViewStyle,
  lifted: {
    shadowColor: 'rgba(72,58,38,1)',
    shadowOpacity: 0.075,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4,
  } satisfies ViewStyle,
} as const;

/* ----------------------------------------------------------------------------
 * Skeleton figure palette — camera video is never shown
 * ------------------------------------------------------------------------- */

export const skeleton = {
  background: colors.bgBase,
  figureTop: '#4F5A45',
  figureBottom: '#252A22',
  bright: colors.textPrimary,
  dim: '#B7AF9E',
} as const;

export const motion = {
  durationMs: 250,
} as const;

export const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
