export const analyticsEvents = {
  landingPageView: 'landing_page_view',
  heroPrimaryCtaClick: 'hero_primary_cta_click',
  heroSecondaryCtaClick: 'hero_secondary_cta_click',
  appStoreClick: 'app_store_click',
  googlePlayClick: 'google_play_click',
  betaSignupStarted: 'beta_signup_started',
  betaSignupSubmitted: 'beta_signup_submitted',
  betaSignupFailed: 'beta_signup_failed',
  pricingCtaClick: 'pricing_cta_click',
  finalCtaClick: 'final_cta_click',
  faqOpened: 'faq_opened',
  scrollDepth50: 'scroll_depth_50',
  scrollDepth90: 'scroll_depth_90',
} as const;

export type AnalyticsEventName = (typeof analyticsEvents)[keyof typeof analyticsEvents];
export type AnalyticsMetadata = Record<string, string | number | boolean | undefined>;

const forbiddenKeys = ['email', 'first_name', 'firstName', 'name', 'full_name'];

export function sanitizeAnalyticsMetadata(metadata: AnalyticsMetadata): AnalyticsMetadata {
  const safe: AnalyticsMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (forbiddenKeys.includes(key)) continue;
    if (typeof value === 'string') safe[key] = value.slice(0, 180);
    else if (typeof value === 'number' || typeof value === 'boolean') safe[key] = value;
  }
  return safe;
}
