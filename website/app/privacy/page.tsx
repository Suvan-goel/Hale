import type { Metadata } from 'next';

import { getPublicSiteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Privacy - Hale',
  description: 'Draft privacy information for the Hale beta landing page.',
};

export default function PrivacyPage() {
  const config = getPublicSiteConfig();

  return (
    <main className="legal-page">
      <article className="legal-card">
        <p className="eyebrow">Draft privacy information</p>
        <h1>Privacy</h1>
        <p>
          This page describes the website beta signup flow as implemented. It should be reviewed before public launch and updated with the final Hale legal entity and contact details.
        </p>
        <h2>What this website collects</h2>
        <p>
          If you submit the beta form, Hale collects your email address, optional first name, platform preference, consent timestamp, source page, browser user agent and campaign attribution fields such as UTM parameters or Google click identifiers when present.
        </p>
        <h2>What this website does not collect</h2>
        <p>
          The beta signup form does not collect health information, camera data, Movement Check-Up results, payment information or account passwords.
        </p>
        <h2>Analytics</h2>
        <p>
          Non-essential analytics load only after you allow analytics in the privacy preferences prompt. Analytics events must not include email addresses or personal form data.
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
