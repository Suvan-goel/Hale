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
          <p className="eyebrow">Hale Movement Check-Up</p>
          <h1 id="hero-title">Stay stronger, steadier and more mobile as you age.</h1>
          <p className="hero__body">{heroFocusCopy[focus]}</p>
          <p className="hero__beta">
            Hale is currently in beta testing. Beta members receive a substantial discount compared with regular launch pricing.
          </p>
          {pricing.kind === 'configured' ? (
            <p className="hero__price">
              Beta: <strong>{pricing.betaFormatted}</strong> <span>{pricing.billingDescription}</span>
            </p>
          ) : null}
          <div className="hero__actions">
            <StoreButtons links={storeLinks} ctaLocation="hero" fallbackLabel="Get beta access" />
            <a className="button button--secondary" href="#how-it-works">
              See how it works
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
        <h2 id="how-title">A calmer way to keep your body capable.</h2>
        <p>
          Hale turns a short camera check-up into a focused four-week training block, then uses the next check-up to guide what comes next.
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
        <h2 id="screens-title">Actual Hale screens, built around a monthly rhythm.</h2>
        <p>The experience stays simple: know what today asks of you, follow the current block, then re-test.</p>
      </div>
      <div className="app-screenshot-grid">
        <AppScreenshotPhone
          src={brandAssets.screenshots.progress}
          alt="Hale Progress screen showing the current movement focus and next check-up timing."
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
        <p className="eyebrow">What Hale measures</p>
        <h2 id="measures-title">The domains that shape everyday confidence.</h2>
        <p>Each check-up is designed around practical movement, not gym performance or medical diagnosis.</p>
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
        <p className="eyebrow">Personalised home training</p>
        <h2>One focused block at a time.</h2>
        <p className="section-lead">
          Hale starts with measurement, then keeps training precise: simple sessions, voice guidance and home-friendly progressions.
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
        <p className="eyebrow">Beta access and pricing</p>
        <h2 id="beta-title">Early access for people who want to stay ahead of ageing.</h2>
        <p className="section-lead">
          Join during beta to receive early access, shape the product and keep preferential pricing compared with the regular launch price.
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
            Beta members receive a substantial discount from the regular launch price. Final prices can be displayed here once configured.
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
        <p className="eyebrow">Privacy and trust</p>
        <h2 id="trust-title">Built around measurement, not surveillance.</h2>
        <p className="section-lead">
          The camera is used as a measuring instrument during guided sessions. The experience stays calm, private and wellness-focused.
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
          Hale is a general fitness and wellbeing product, not medical advice, a diagnosis, a treatment, or a medical device.
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
        <h2 id="faq-title">A few practical questions.</h2>
      </div>
      <FAQ items={faqs.slice(0, 4)} />
    </section>
  );
}
