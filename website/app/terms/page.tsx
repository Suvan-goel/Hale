import type { Metadata } from 'next';

import { getPublicSiteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Terms - Hale',
  description: 'Draft terms for Hale beta access.',
};

export default function TermsPage() {
  const config = getPublicSiteConfig();

  return (
    <main className="legal-page">
      <article className="legal-card">
        <p className="eyebrow">Draft beta terms</p>
        <h1>Terms</h1>
        <p>
          These draft terms describe the Hale beta landing page and should be reviewed before public launch. They do not replace app-store, payment, medical, or jurisdiction-specific legal terms.
        </p>
        <h2>Beta access</h2>
        <p>
          Hale is currently in beta testing. Features, availability, pricing and product details may change as the product improves.
        </p>
        <h2>Wellbeing product</h2>
        <p>
          Hale is a general fitness and wellbeing product. It is not medical advice, treatment, or a medical device. Stop if you feel pain, dizziness or unsafe.
        </p>
        <h2>Pricing</h2>
        <p>
          Beta members receive a substantial discount compared with the regular launch price. Exact payment terms should be shown wherever payment is collected.
        </p>
        <h2>Contact</h2>
        <p>
          {config.supportEmail ? (
            <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>
          ) : (
            'Use the beta signup form for launch contact until a support email is configured.'
          )}
        </p>
      </article>
    </main>
  );
}
