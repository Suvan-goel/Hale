import Image from 'next/image';
import { ArrowDown, Check, ShieldCheck, Sparkles } from 'lucide-react';

import { BetaSignupForm } from './BetaSignupForm';
import { FAQ } from './FAQ';
import { HeroPhoneMockup, ProductTour } from './ProductMockups';
import { StoreButtons } from './StoreButtons';
import { brandAssets } from '@/config/brand';
import type { HeroFocus } from '@/content/landing';
import {
  betaTransparency,
  betaValueList,
  faqs,
  heroFocusCopy,
  heroProofPoints,
  howItWorks,
  measurementDomains,
  outcomeExamples,
  problemPoints,
  progressLoop,
  trainingMessages,
  trustDetails,
  trustStrip,
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
      <BetaAnnouncement />
      <HeroSection focus={focus} pricing={pricing} storeLinks={storeLinks} />
      <TrustStrip />
      <ProblemSection />
      <HowItWorksSection />
      <MeasurementSection />
      <TrainingSection />
      <ProgressSection />
      <OutcomesSection />
      <ProductScreenshotsSection />
      <BetaAccessSection pricing={pricing} storeLinks={storeLinks} betaSignupEnabled={betaSignupEnabled} />
      <TrustSection />
      <FAQSection />
      <FinalCTA storeLinks={storeLinks} />
    </main>
  );
}

function BetaAnnouncement() {
  return (
    <a className="announcement" href="#beta-access">
      <strong>Beta testing now open.</strong>
      <span>Join now for early access and a substantial discount from the regular launch price.</span>
    </a>
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
    <section className="hero section" aria-labelledby="hero-title">
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
          <p className="eyebrow">The Movement Check-Up for staying capable</p>
          <h1 id="hero-title">Stay stronger, steadier and more mobile as you age.</h1>
          <p className="hero__body">{heroFocusCopy[focus]}</p>
          <p className="hero__beta">
            Hale is currently in beta testing. Beta members receive a substantial discount compared with the regular launch price.
          </p>
          {pricing.kind === 'configured' ? (
            <p className="hero__price">
              Beta: <strong>{pricing.betaFormatted}</strong> <span>{pricing.billingDescription}</span>
            </p>
          ) : null}
          <div className="hero__actions">
            <StoreButtons links={storeLinks} ctaLocation="hero" fallbackLabel="Get beta access" />
            <a className="button button--secondary" href="#how-it-works">
              See how Hale works
              <ArrowDown aria-hidden="true" size={18} />
            </a>
          </div>
          <ul className="hero__proof" aria-label="Hale quick details">
            {heroProofPoints.map((point) => (
              <li key={point}>
                <Check aria-hidden="true" size={17} />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <HeroPhoneMockup />
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="quick-strip" aria-label="Hale quick value">
      {trustStrip.map((item) => (
        <article key={item.title}>
          <strong>{item.title}</strong>
          <span>{item.body}</span>
        </article>
      ))}
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="section section--two-col">
      <div>
        <p className="eyebrow">Designed for real life</p>
        <h2>You may still feel healthy, but everyday movement can gradually start to feel different.</h2>
      </div>
      <div>
        <ul className="check-list check-list--cards">
          {problemPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p className="section-lead">
          Hale gives you a simple way to understand what to work on and a realistic plan for improving it.
        </p>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section" aria-labelledby="how-title">
      <div className="section-heading">
        <p className="eyebrow">How Hale works</p>
        <h2 id="how-title">A monthly measurement ritual, then a plan you can actually follow.</h2>
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

function MeasurementSection() {
  return (
    <section id="measures" className="section section--soft" aria-labelledby="measures-title">
      <div className="section-heading">
        <p className="eyebrow">What Hale measures</p>
        <h2 id="measures-title">Strength, balance and mobility, translated into practical next steps.</h2>
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
        <h2>Not another generic workout app.</h2>
        <p className="section-lead">
          Hale starts with measurement, then organises your training into manageable four-week blocks focused on practical capability.
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

function ProgressSection() {
  return (
    <section className="section section--two-col">
      <div>
        <p className="eyebrow">Progress and re-testing</p>
        <h2>Progress you can actually see.</h2>
        <p className="section-lead">
          Hale is built around repeatable check-ups, not one-off motivation. You establish a starting point, train, then re-test to guide the next block.
        </p>
      </div>
      <ol className="timeline-list">
        {progressLoop.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}

function OutcomesSection() {
  return (
    <section className="section section--soft section--two-col">
      <div>
        <p className="eyebrow">Real-life outcomes</p>
        <h2>Hale is designed to help you keep doing the things that make life yours.</h2>
      </div>
      <div className="outcome-grid">
        {outcomeExamples.map((item) => (
          <article key={item}>
            <Sparkles aria-hidden="true" size={18} />
            <span>{item}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductScreenshotsSection() {
  return (
    <section className="section" aria-labelledby="tour-title">
      <div className="section-heading">
        <p className="eyebrow">Product tour</p>
        <h2 id="tour-title">The Hale flow follows the app rhythm: Today, Plan, Progress, Explore.</h2>
        <p>
          These product UI examples use Hale&apos;s current app structure and copy. They are not ratings, testimonials or fabricated outcomes.
        </p>
      </div>
      <ProductTour />
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
        <h2 id="beta-title">Join Hale during beta and pay less than the regular launch price.</h2>
        <p className="section-lead">
          Hale is currently in active beta testing. Beta members receive early access, help shape the product, and get a substantial discount compared with the regular price.
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
    <section className="section trust-section" aria-labelledby="trust-title">
      <div className="section-heading">
        <p className="eyebrow">Trust and transparency</p>
        <h2 id="trust-title">Measurement-led, safety-conscious and honest about beta.</h2>
      </div>
      <div className="trust-grid">
        {trustDetails.map((detail) => (
          <article key={detail}>
            <ShieldCheck aria-hidden="true" size={22} />
            <p>{detail}</p>
          </article>
        ))}
      </div>
      <p className="disclaimer">
        Hale is a general fitness and wellbeing product, not medical advice, a diagnosis, a treatment, or a medical device. Stop if you feel pain, dizziness or unsafe, and follow appropriate professional guidance.
      </p>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div className="section-heading">
        <p className="eyebrow">FAQ</p>
        <h2 id="faq-title">Questions people ask before joining the beta.</h2>
      </div>
      <FAQ items={faqs} />
    </section>
  );
}

function FinalCTA({ storeLinks }: { storeLinks: readonly StoreLink[] }) {
  return (
    <section className="section final-cta" aria-labelledby="final-title">
      <p className="eyebrow">Start with a baseline</p>
      <h2 id="final-title">Start building a body that keeps up with your life.</h2>
      <p>
        Join the Hale beta, complete your first Movement Check-Up, and receive a plan built around your strength, balance and mobility.
      </p>
      <p className="final-cta__beta">Beta members receive a substantial discount compared with the regular launch price.</p>
      <StoreButtons links={storeLinks} ctaLocation="final" fallbackLabel="Get beta access" />
    </section>
  );
}
