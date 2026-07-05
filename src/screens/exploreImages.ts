import type { ImageSourcePropType } from 'react-native';

export const INSIGHT_IMAGES: Record<string, ImageSourcePropType> = {
  // Reuses the strength-balance art until the menopause article gets its own.
  'insight-menopause-muscle': require('../../assets/images/explore-insight-strength-balance.png'),
  'insight-strength-balance-aging': require('../../assets/images/explore-insight-strength-balance.png'),
  'insight-sleep-recovery-rhythm': require('../../assets/images/explore-insight-sleep.png'),
  'insight-protein-meal-rhythm': require('../../assets/images/explore-insight-protein.png'),
  'insight-walking-breaks': require('../../assets/images/explore-insight-walking.png'),
};

export const PRACTICE_IMAGES: Record<string, ImageSourcePropType> = {
  hero: require('../../assets/images/explore-practice-hero.png'),
  'preset-mobility-reset': require('../../assets/images/explore-practice-mobility-reset.png'),
  'preset-gentle-restart': require('../../assets/images/explore-practice-gentle-restart.png'),
  'preset-steady-balance': require('../../assets/images/explore-practice-steady-balance.png'),
  'preset-no-equipment-strength': require('../../assets/images/explore-practice-no-equipment-strength.png'),
  'preset-band-upper-back': require('../../assets/images/explore-practice-band-upper-back.png'),
  'preset-stairs-confidence': require('../../assets/images/explore-practice-stairs-confidence.png'),
  'preset-quick-full-body': require('../../assets/images/explore-practice-quick-full-body.png'),
};

export function articleImageFor(articleId: string): ImageSourcePropType | undefined {
  return INSIGHT_IMAGES[articleId];
}
