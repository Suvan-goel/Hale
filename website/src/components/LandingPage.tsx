import Image from 'next/image';
import { ArrowDown, Check, ShieldCheck } from 'lucide-react';

import { BetaSignupForm } from './BetaSignupForm';
import { FAQ } from './FAQ';
import { StoreButtons } from './StoreButtons';
import { brandAssets } from '@/config/brand';
import type { HeroFocus } from '@/content/landing';
import {
  betaTransparency,
  betaValueList,
  faqs,
  heroFocusCopy,
  howItWorks,
  measurementDomains,
  trainingMessages,
  trustDetails,
} from '@/content/landing';
import type { PricingPresentation } from '@/lib/pricing';
import type { StoreLink } from '@/lib/store-links';

interface LandingPageProps {
  focus: HeroFocus;
  pricing: PricingPresentation;
  storeLinks: readonly StoreLink[];
  betaSignupEnabled: boolean;
}

export function LandingPage({ focus, pricing, storeLinks, betaSignupEnabled }: LandingPageProps) {
  return (
    <main id="top">
      <HeroSection focus={focus} pricing={pricing} storeLinks={storeLinks} />
      <MethodSection />
      <AppScreensSection />
      <MeasurementSection />
      <TrainingSection />
      <TrustSection />
      <BetaAccessSection pricing={pricing} storeLinks={storeLinks} betaSignupEnabled={betaSignupEnabled} />
      <FAQSection />
    </main>
  );
}

function HeroSection({
  focus,
  pricing,
  storeLinks,
}: {
  focus: HeroFocus;
  pricing: PricingPresentation;
  storeLinks: readonly StoreLink[];
}) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <Image
        src={brandAssets.hero}
        alt="A person standing in a bright home doorway during a calm movement routine."
        fill
        className="hero__image"
        sizes="100vw"
        priority
      />
      <div className="hero__overlay" />
      <div className="hero__inner">
        <div className="hero__copy">
          <p className="eyebrow">A movement check-up at home</p>
          <h1 id="hero-title">See how your body is doing, then train what needs attention.</h1>
          <p className="hero__body">{heroFocusCopy[focus]}</p>
          <p className="hero__beta">
            Hale is in beta. Join now to try the check-up and home plan early.
          </p>
          {pricing.kind === 'configured' ? (
            <p className="hero__price">
              Beta: <strong>{pricing.betaFormatted}</strong> <span>{pricing.billingDescription}</span>
            </p>
          ) : null}
          <div className="hero__actions">
            <StoreButtons links={storeLinks} ctaLocation="hero" fallbackLabel="Get beta access" />
            <a className="button button--secondary" href="#how-it-works">
              How it works
              <ArrowDown aria-hidden="true" size={18} />
            </a>
          </div>
        </div>
        <AppScreenshotPhone
          src={brandAssets.screenshots.plan}
          alt="Hale Plan screen showing a four-week training block and weekly sessions."
          label="Plan"
          className="hero-screenshot"
          priority
        />
      </div>
    </section>
  );
}

function MethodSection() {
  return (
    <section id="how-it-works" className="section method-section" aria-labelledby="how-title">
      <div className="section-heading section-heading--center">
        <p className="eyebrow">How Hale works</p>
        <h2 id="how-title">Check. Train. Re-check.</h2>
        <p>
          Start with a short Movement Check-Up. Hale turns the results into a home plan, then updates your plan after the next check-up.
        </p>
      </div>
      <div className="steps">
        {howItWorks.map((step, index) => (
          <article className="step-card" key={step.title}>
            <span className="step-card__number">{String(index + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AppScreensSection() {
  return (
    <section className="section app-screens-section" aria-labelledby="screens-title">
      <div className="section-heading section-heading--center">
        <p className="eyebrow">Inside the app</p>
        <h2 id="screens-title">Know what to do today.</h2>
        <p>Your plan, next session and progress stay in one place, without a complicated dashboard.</p>
      </div>
      <div className="app-screenshot-grid">
        <AppScreenshotPhone
          src={brandAssets.screenshots.progress}
          alt="Hale Progress screen showing the current training area and next check-up timing."
          label="Progress"
        />
        <AppScreenshotPhone
          src={brandAssets.screenshots.explore}
          alt="Hale Explore screen showing evidence-led articles and movement guides."
          label="Explore"
        />
      </div>
    </section>
  );
}

function AppScreenshotPhone({
  src,
  alt,
  label,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  label: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={`app-screenshot-phone ${className ?? ''}`}>
      <div className="app-screenshot-phone__frame">
        <Image
          src={src}
          alt={alt}
          width={720}
          height={1600}
          sizes="(max-width: 780px) 74vw, 330px"
          priority={priority}
          unoptimized
        />
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function MeasurementSection() {
  return (
    <section id="measures" className="section section--soft" aria-labelledby="measures-title">
      <div className="section-heading">
        <p className="eyebrow">What Hale checks</p>
        <h2 id="measures-title">The abilities that make everyday movement easier.</h2>
        <p>Hale looks at strength, balance and mobility because they affect stairs, walks, chairs, reaching and feeling steady.</p>
      </div>
      <div className="domain-grid">
        {measurementDomains.map((domain) => (
          <article className="domain-card" key={domain.title}>
            <div className="domain-card__mark" aria-hidden="true" />
            <h3>{domain.title}</h3>
            <p>{domain.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrainingSection() {
  return (
    <section className="section section--feature">
      <div className="feature-image">
        <Image
          src={brandAssets.firstBlock}
          alt="A tidy home setup with Hale training cards and everyday exercise equipment."
          width={1672}
          height={941}
          sizes="(max-width: 900px) 100vw, 45vw"
        />
      </div>
      <div>
        <p className="eyebrow">Home training</p>
        <h2>Short sessions, chosen for you.</h2>
        <p className="section-lead">
          Hale uses your check-up to choose where to start. Sessions are voice-guided, so you can prop up the phone and move without touching the screen.
        </p>
        <ul className="check-list">
          {trainingMessages.map((message) => (
            <li key={message}>
              <Check aria-hidden="true" size={18} />
              {message}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BetaAccessSection({
  pricing,
  storeLinks,
  betaSignupEnabled,
}: {
  pricing: PricingPresentation;
  storeLinks: readonly StoreLink[];
  betaSignupEnabled: boolean;
}) {
  return (
    <section id="beta-access" className="section beta-section" aria-labelledby="beta-title">
      <div className="beta-section__copy">
        <p className="eyebrow">Try Hale in beta</p>
        <h2 id="beta-title">Help shape a product built for real homes.</h2>
        <p className="section-lead">
          Beta members get early access, can share feedback and receive a substantial discount compared with the regular launch price.
        </p>
        <ul className="check-list">
          {betaTransparency.map((item) => (
            <li key={item}>
              <Check aria-hidden="true" size={18} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <aside className="pricing-card" aria-label="Hale beta offer">
        <div className="pricing-card__header">
          <span>Beta offer</span>
          <strong>Early access</strong>
        </div>
        {pricing.kind === 'configured' ? (
          <div className="price-stack">
            <p>
              <span className="price-stack__beta">{pricing.betaFormatted}</span>
              <span className="price-stack__billing">{pricing.billingDescription}</span>
            </p>
            <p className="price-stack__regular">
              Regular launch price <s>{pricing.regularFormatted}</s>
            </p>
            <p className="price-stack__saving">
              Save {pricing.savingAmountFormatted}
              {pricing.savingPercent > 0 ? ` (${pricing.savingPercent}%)` : ''}
            </p>
          </div>
        ) : (
          <p className="price-stack__unconfigured">
            Beta pricing is not shown yet. Members will see the beta offer before payment is collected.
          </p>
        )}
        <ul className="value-list">
          {betaValueList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <StoreButtons links={storeLinks} ctaLocation="pricing" fallbackLabel="Join the Hale beta" />
        {betaSignupEnabled ? <BetaSignupForm ctaLocation="pricing" /> : null}
      </aside>
    </section>
  );
}

function TrustSection() {
  return (
    <section id="privacy" className="section section--feature trust-section" aria-labelledby="trust-title">
      <div>
        <p className="eyebrow">Privacy and safety</p>
        <h2 id="trust-title">Camera guidance without a mirror.</h2>
        <p className="section-lead">
          The camera is used only during guided sessions to measure movement. Hale keeps the experience calm, private and wellness-focused.
        </p>
        <div className="trust-grid">
          {trustDetails.map((detail) => (
            <article key={detail}>
              <ShieldCheck aria-hidden="true" size={20} />
              <p>{detail}</p>
            </article>
          ))}
        </div>
        <p className="disclaimer">
          Hale is for general fitness and wellbeing. It is not medical advice, a diagnosis, a treatment or a medical device.
        </p>
      </div>
      <div className="feature-image trust-section__image">
        <Image
          src={brandAssets.cameraSetup}
          alt="A phone set up in a calm home space for a movement check-up."
          width={1672}
          height={941}
          sizes="(max-width: 900px) 100vw, 45vw"
        />
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div className="section-heading section-heading--center">
        <p className="eyebrow">FAQ</p>
        <h2 id="faq-title">Common questions.</h2>
      </div>
      <FAQ items={faqs.slice(0, 4)} />
    </section>
  );
}
