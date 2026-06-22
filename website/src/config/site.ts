export type PlatformPreference = 'iphone' | 'android' | 'either';

export interface PublicSiteConfig {
  siteUrl: string;
  iosUrl: string;
  androidUrl: string;
  betaPrice: string;
  regularPrice: string;
  currency: string;
  billingDescription: string;
  supportEmail: string;
  betaSignupEnabled: boolean;
  analytics: {
    gaMeasurementId: string;
    googleAdsId: string;
    googleAdsSignupLabel: string;
    googleAdsIosClickLabel: string;
    googleAdsAndroidClickLabel: string;
  };
}

function envString(value: string | undefined): string {
  return value?.trim() ?? '';
}

function envBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  return !['0', 'false', 'off', 'no'].includes(value.trim().toLowerCase());
}

export function getPublicSiteConfig(env: NodeJS.ProcessEnv = process.env): PublicSiteConfig {
  return {
    siteUrl: envString(env.NEXT_PUBLIC_SITE_URL) || 'http://localhost:3000',
    iosUrl: envString(env.NEXT_PUBLIC_HALE_IOS_URL),
    androidUrl: envString(env.NEXT_PUBLIC_HALE_ANDROID_URL),
    betaPrice: envString(env.NEXT_PUBLIC_HALE_BETA_PRICE),
    regularPrice: envString(env.NEXT_PUBLIC_HALE_REGULAR_PRICE),
    currency: envString(env.NEXT_PUBLIC_HALE_CURRENCY) || 'GBP',
    billingDescription: envString(env.NEXT_PUBLIC_HALE_BILLING_DESCRIPTION),
    supportEmail: envString(env.NEXT_PUBLIC_HALE_SUPPORT_EMAIL),
    betaSignupEnabled: envBoolean(env.NEXT_PUBLIC_HALE_BETA_SIGNUP_ENABLED, true),
    analytics: {
      gaMeasurementId: envString(env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
      googleAdsId: envString(env.NEXT_PUBLIC_GOOGLE_ADS_ID),
      googleAdsSignupLabel: envString(env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL),
      googleAdsIosClickLabel: envString(env.NEXT_PUBLIC_GOOGLE_ADS_IOS_CLICK_LABEL),
      googleAdsAndroidClickLabel: envString(env.NEXT_PUBLIC_GOOGLE_ADS_ANDROID_CLICK_LABEL),
    },
  };
}

export const navigationLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#measures', label: 'What it checks' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#beta-access', label: 'Beta access' },
] as const;
