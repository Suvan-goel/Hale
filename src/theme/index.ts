/**
 * Hale design system — the single source of truth for colour, type, spacing,
 * radii and depth. Screens and shared components reference these tokens rather
 * than hardcoding repeated visual values.
 *
 * The aesthetic: premium longevity wellness. Warm ivory canvas, raised cream
 * cards, deep forest-green action colour, soft sage support tones, and restrained
 * champagne-gold detail. The product should feel calm, trustworthy, readable,
 * and daily-use friendly for adults 50+, never clinical or fitness-gimmicky.
 *
 * Single light theme. `bgBase` is mirrored in the native camera view, app.json,
 * and the skeleton preview script, so keep those values in sync when it changes.
 */

import { Platform, TextStyle, ViewStyle } from 'react-native';

/* ----------------------------------------------------------------------------
 * Colour — warm longevity palette
 * ------------------------------------------------------------------------- */

export const colors = {
  // Backgrounds: a warm canvas with slightly lifted cream surfaces.
  bgBase: '#F7F2EA',
  bgSurface: '#FFFDF8',
  bgElevated: '#FBF7F0',
  bgMaterial: '#EFE4D2',
  bgSage: '#E5EEDB',
  bgGold: '#F2E8CF',
  borderHairline: '#E8DDCA',
  divider: '#EDE3D2',

  // Text: green-black ink and warm, readable secondary tones.
  textPrimary: '#102A24',
  textSecondary: '#59645D',
  textTertiary: '#8A8276',

  // Brand and semantic accents.
  accent: '#123D32',
  accentDeep: '#0D2F27',
  accentSoft: '#DDEAD2',
  sage: '#7FA37A',
  sageDeep: '#4F765A',
  accentGold: '#B99A55',
  goldBorder: '#E7D5A5',
  positive: '#2F7D4F',
  caution: '#B07A2D',
  cautionSoft: '#F4E2D2',
  cautionBorder: '#E7CDB7',
  error: '#A35A50',
  debugOverlay: 'rgba(16,42,36,0.86)',
  onAccent: '#FFFDF8',
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
  display: { fontFamily: fonts.serifMedium, fontSize: 32, lineHeight: 39, letterSpacing: 0, color: colors.textPrimary },
  h1: { fontFamily: fonts.serifMedium, fontSize: 27, lineHeight: 34, letterSpacing: 0, color: colors.textPrimary },
  h2: { fontFamily: fonts.serifMedium, fontSize: 21, lineHeight: 28, letterSpacing: 0, color: colors.textPrimary },
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
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 56,
} as const;

/* ----------------------------------------------------------------------------
 * Shape & depth
 * ------------------------------------------------------------------------- */

export const radius = {
  input: 14,
  card: 18,
  panel: 24,
  pill: 999,
  sm: 10,
} as const;

/** Minimum comfortable tap target for the 50+ audience. */
export const minTapTarget = 48;

export const shadow = {
  soft: {
    shadowColor: 'rgba(48,36,22,1)',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  } satisfies ViewStyle,
  lifted: {
    shadowColor: 'rgba(48,36,22,1)',
    shadowOpacity: 0.09,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  } satisfies ViewStyle,
} as const;

/* ----------------------------------------------------------------------------
 * Skeleton figure palette — camera video is never shown
 * ------------------------------------------------------------------------- */

export const skeleton = {
  background: colors.bgBase,
  figureTop: '#31584A',
  figureBottom: '#102A24',
  bright: colors.textPrimary,
  dim: '#B7B19F',
} as const;

export const motion = {
  durationMs: 250,
} as const;

export const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
