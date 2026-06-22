export const brandTokens = {
  colors: {
    bgBase: '#F9F5EF',
    surface: '#FFFDF9',
    ink: '#111412',
    textSecondary: '#68706A',
    textTertiary: '#8A908A',
    accent: '#414C34',
    border: '#E4E0D6',
    borderStrong: '#D8D3C8',
    brass: '#A98243',
    softGold: '#F4EFE4',
    error: '#B85C50',
    shadow: 'rgba(17,20,18,0.05)',
  },
  fonts: {
    sans: 'Inter',
    serif: 'Fraunces',
  },
  radius: {
    input: 14,
    button: 15,
    card: 16,
    panel: 20,
    pill: 999,
  },
  spacing: {
    pageMax: 1160,
    contentMax: 720,
  },
} as const;

export const brandAssets = {
  logoMark: '/brand/hale-logo-mark.png',
  appIcon: '/brand/hale-app-icon.png',
  hero: '/brand/hale-welcome-hero.png',
  cameraSetup: '/brand/hale-camera-setup-hero.png',
  firstBlock: '/brand/hale-first-block-hero.png',
  progressHero: '/brand/hale-progress-hero.png',
  todaySession: '/brand/hale-todays-session-card.png',
  screenshots: {
    plan: '/app-screens/hale-plan.png',
    progress: '/app-screens/hale-progress.png',
    explore: '/app-screens/hale-explore.png',
  },
  ogImage: '/og/hale-og.png',
} as const;
