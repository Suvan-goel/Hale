import type { ImageSourcePropType } from 'react-native';

export const INSIGHT_IMAGES: Record<string, ImageSourcePropType> = {
  // Reuses the strength-balance art until the menopause article gets its own.
  'insight-menopause-muscle': require('../../assets/images/explore-insight-strength-balance.png'),
  'insight-strength-balance-aging': require('../../assets/images/explore-insight-strength-balance.png'),
  'insight-sleep-recovery-rhythm': require('../../assets/images/explore-insight-sleep.png'),
  'insight-protein-meal-rhythm': require('../../assets/images/explore-insight-protein.png'),
  'insight-walking-breaks': require('../../assets/images/explore-insight-walking.png'),
};

export function articleImageFor(articleId: string): ImageSourcePropType | undefined {
  return INSIGHT_IMAGES[articleId];
}
