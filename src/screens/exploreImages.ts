import type { ImageSourcePropType } from 'react-native';

export const INSIGHT_IMAGES: Record<string, ImageSourcePropType> = {
  'insight-strength-balance-aging': require('../../assets/images/explore-insight-strength-balance.png'),
  'insight-sleep-recovery-rhythm': require('../../assets/images/explore-insight-sleep.png'),
  'insight-protein-meal-rhythm': require('../../assets/images/explore-insight-protein.png'),
  'insight-walking-breaks': require('../../assets/images/explore-insight-walking.png'),
};

export const LEARN_IMAGES: Record<string, ImageSourcePropType> = {
  'movement-checkup-guide': require('../../assets/images/explore-learn-checkup-guide.png'),
  'camera-setup': require('../../assets/images/explore-learn-camera-setup.png'),
  'monthly-retest': require('../../assets/images/explore-learn-monthly-retest.png'),
  'chair-rise-strength': require('../../assets/images/explore-learn-chair-rise.png'),
  'balance-practice': require('../../assets/images/explore-learn-balance-practice.png'),
  'mobility-basics': require('../../assets/images/explore-learn-mobility-basics.png'),
  'movement-discomfort': require('../../assets/images/explore-learn-movement-discomfort.png'),
  'resistance-band': require('../../assets/images/explore-learn-resistance-band.png'),
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

export const LIBRARY_IMAGES: Record<string, ImageSourcePropType> = {
  hero: require('../../assets/images/explore-library-hero.png'),
  'sit-to-stand': require('../../assets/images/explore-library-sit-to-stand.png'),
  squat: require('../../assets/images/explore-library-squat.png'),
  'step-up': require('../../assets/images/explore-library-step-up.png'),
  'heel-toe-raise': require('../../assets/images/explore-library-heel-toe-raise.png'),
  push: require('../../assets/images/explore-library-push.png'),
  'pull-upper-back': require('../../assets/images/explore-library-pull-upper-back.png'),
  'hinge-glutes': require('../../assets/images/explore-library-hinge-glutes.png'),
  'shoulder-reach-press': require('../../assets/images/explore-library-shoulder-reach-press.png'),
  balance: require('../../assets/images/explore-library-balance.png'),
  'lateral-stability': require('../../assets/images/explore-library-lateral-stability.png'),
  'mobility-flexibility': require('../../assets/images/explore-library-mobility-flexibility.png'),
};

export function articleImageFor(articleId: string): ImageSourcePropType | undefined {
  return INSIGHT_IMAGES[articleId] ?? LEARN_IMAGES[articleId];
}

export function ladderImageFor(ladderId: string): ImageSourcePropType {
  return LIBRARY_IMAGES[ladderId] ?? LIBRARY_IMAGES.hero;
}
