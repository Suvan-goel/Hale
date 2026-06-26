import type { PremiumConstellationVolumePreset } from './poseAvatarTypes';

export interface PremiumConstellationVolumeConfig {
  maxDots: number;
  dotScale: number;
  connectionMaxLines: number;
  counts: {
    torso: number;
    neck: number;
    head: number;
    upperArm: number;
    forearm: number;
    hand: number;
    thigh: number;
    shin: number;
    foot: number;
  };
  coreOpacity: number;
  softOpacity: number;
  limbOpacity: number;
  extremityOpacity: number;
}

export const PREMIUM_CONSTELLATION_VOLUME_PRESETS: Record<
  PremiumConstellationVolumePreset,
  PremiumConstellationVolumeConfig
> = {
  constellationVolume180: {
    maxDots: 180,
    dotScale: 2.35,
    connectionMaxLines: 0,
    counts: {
      torso: 50,
      neck: 6,
      head: 18,
      upperArm: 8,
      forearm: 7,
      hand: 4,
      thigh: 16,
      shin: 12,
      foot: 6,
    },
    coreOpacity: 0.9,
    softOpacity: 0.38,
    limbOpacity: 0.76,
    extremityOpacity: 0.52,
  },
  constellationVolume300: {
    maxDots: 300,
    dotScale: 2.25,
    connectionMaxLines: 0,
    counts: {
      torso: 84,
      neck: 8,
      head: 28,
      upperArm: 14,
      forearm: 12,
      hand: 7,
      thigh: 26,
      shin: 21,
      foot: 10,
    },
    coreOpacity: 0.86,
    softOpacity: 0.34,
    limbOpacity: 0.72,
    extremityOpacity: 0.5,
  },
  constellationVolume450: {
    maxDots: 450,
    dotScale: 2.05,
    connectionMaxLines: 0,
    counts: {
      torso: 130,
      neck: 12,
      head: 40,
      upperArm: 20,
      forearm: 18,
      hand: 10,
      thigh: 38,
      shin: 31,
      foot: 17,
    },
    coreOpacity: 0.8,
    softOpacity: 0.3,
    limbOpacity: 0.66,
    extremityOpacity: 0.46,
  },
};

export function resolvePremiumConstellationVolumeConfig(
  preset: PremiumConstellationVolumePreset | undefined
): PremiumConstellationVolumeConfig {
  return PREMIUM_CONSTELLATION_VOLUME_PRESETS[preset ?? 'constellationVolume300'];
}
