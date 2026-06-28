import Image from 'next/image';
import { Activity, ArrowDown, ArrowRight, Check, CheckCircle2, LineChart, Radar, ShieldCheck } from 'lucide-react';

import { BetaSignupForm } from './BetaSignupForm';
import { FAQ } from './FAQ';
import { StoreButtons } from './StoreButtons';
import { brandAssets } from '@/config/brand';
import type { HeroFocus } from '@/content/landing';
import {
  betaReassurance,
  betaTransparency,
  betaValueList,
  checkupActivities,
  credibilityPoints,
  differencePoints,
  exampleResult,
  faqs,
  firstMonthPlan,
  heroFocusCopy,
  heroProofPoints,
  howItWorks,
  measurementDomains,
  problemPoints,
  reframePrinciples,
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

const pageGuideLinks = [
  { href: '#how-it-works', label: 'How Hale works' },
  { href: '#measures', label: 'What it checks' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#beta-access', label: 'Beta access' },
] as const;

const domainIcons = [Activity, Radar, LineChart] as const;

export function LandingPage({ focus, pricing, storeLinks, betaSignupEnabled }: LandingPageProps) {
  return (
    <main id="top">
      <HeroSection focus={focus} pricing={pricing} storeLinks={storeLinks} />
      <PageGuide />
      <ProblemSection />
      <ReframeSection />
      <MethodSection />
      <CheckupProofSection />
      <MeasurementSection />
      <FirstMonthSection />
      <CredibilitySection />
      <TrustSection />
      <DifferenceSection />
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
        alt="A calm home setting for a Hale movement routine."
        fill
        className="hero__image"
        sizes="100vw"
        priority
      />
      <div className="hero__overlay" />
      <div className="hero__inner">
        <div className="hero__copy">
          <p className="eyebrow">For adults 45+ who want to stay capable</p>
          <h1 id="hero-title">Hale</h1>
          <p className="hero__promise">A movement check-up and home plan for staying strong, steady and independent.</p>
          <p className="hero__body">{heroFocusCopy[focus]}</p>
          <div className="hero__actions">
            <StoreButtons links={storeLinks} ctaLocation="hero" fallbackLabel="Join the Hale beta" />
            <a className="button button--secondary" href="#how-it-works">
              See how it works
              <ArrowDown aria-hidden="true" size={18} />
            </a>
          </div>
          <p className="hero__beta">
            Hale is currently in beta. Join now to try the check-up and home plan early.
          </p>
          {pricing.kind === 'configured' ? (
            <p className="hero__price">
              Beta: <strong>{pricing.betaFormatted}</strong> <span>{pricing.billingDescription}</span>
            </p>
          ) : null}
          <ul className="hero__proof" aria-label="Hale highlights">
            {heroProofPoints.map((point) => (
              <li key={point}>
                <CheckCircle2 aria-hidden="true" size={18} />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="hero__visual" aria-label="Hale app preview">
          <AppScreenshotPhone
            src={brandAssets.screenshots.plan}
            alt="Hale Plan screen showing a four-week training block and weekly sessions."
            label="Your home plan"
            priority
          />
          <div className="hero__visual-note">
            <span>Measure first</span>
            <strong>Train what needs attention</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function PageGuide() {
  return (
    <nav className="page-guide" aria-label="What this page covers">
      <span>On this page</span>
      {pageGuideLinks.map((link) => (
        <a key={link.href} href={link.href}>
          {link.label}
          <ArrowRight aria-hidden="true" size={15} />
        </a>
      ))}
    </nav>
  );
}

function ProblemSection() {
  return (
    <section className="section empathy-section" aria-labelledby="familiar-title">
      <div className="section-heading">
        <p className="eyebrow">Does this sound familiar?</p>
        <h2 id="familiar-title">The changes are often quiet at first.</h2>
        <p>
          Many people do not wake up feeling old. They notice small moments: a chair feels lower, a walk feels longer, or balance takes more thought than it used to.
        </p>
      </div>
      <div className="empathy-grid">
        <ul className="empathy-list">
          {problemPoints.map((point) => (
            <li key={point}>
              <Check aria-hidden="true" size={18} />
              {point}
            </li>
          ))}
        </ul>
        <aside className="empathy-note">
          <p>
            These moments are not a character flaw. They are signals worth understanding, especially if you want to keep doing the ordinary things that make life feel like yours.
          </p>
        </aside>
      </div>
    </section>
  );
}

function ReframeSection() {
  return (
    <section className="section reframe-section" aria-labelledby="reframe-title">
      <div>
        <p className="eyebrow">A clearer starting point</p>
        <h2 id="reframe-title">You should not have to guess what to work on.</h2>
        <p className="section-lead">
          Most people either ignore the changes or start random exercises. Hale starts somewhere calmer: a short Movement Check-Up that helps you understand strength, balance and mobility before choosing a plan.
        </p>
      </div>
      <div className="principle-list">
        {reframePrinciples.map((principle) => (
          <article className="principle-item" key={principle.title}>
            <h3>{principle.title}</h3>
            <p>{principle.body}</p>
          </article>
        ))}
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
          The app guides you through one simple loop: measure how you move, train what needs attention, then check again next month.
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

function CheckupProofSection() {
  return (
    <section className="section proof-section" aria-labelledby="proof-title">
      <div className="proof-section__copy">
        <p className="eyebrow">What you will actually do</p>
        <h2 id="proof-title">Simple movements, guided step by step.</h2>
        <p className="section-lead">
          You do not need to learn a workout before you begin. Hale talks you through familiar movements and turns the check-up into clear next steps.
        </p>
        <div className="activity-list">
          {checkupActivities.map((activity) => (
            <article className="activity-item" key={activity.title}>
              <CheckCircle2 aria-hidden="true" size={20} />
              <div>
                <h3>{activity.title}</h3>
                <p>{activity.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <ExampleResultPanel />
    </section>
  );
}

function ExampleResultPanel() {
  return (
    <aside className="example-result-card" aria-label="Example Hale result">
      <div className="example-result-card__header">
        <span>{exampleResult.eyebrow}</span>
        <strong>{exampleResult.title}</strong>
      </div>
      <p className="example-result-card__body">{exampleResult.body}</p>
      <div className="example-result-card__domains">
        {exampleResult.domains.map((domain) => (
          <article key={domain.label}>
            <div>
              <span>{domain.label}</span>
              <strong>{domain.value}</strong>
            </div>
            <p>{domain.body}</p>
          </article>
        ))}
      </div>
      <div className="example-result-card__plan">
        <span>{exampleResult.plan.label}</span>
        <strong>{exampleResult.plan.title}</strong>
        <p>{exampleResult.plan.body}</p>
      </div>
    </aside>
  );
}

function MeasurementSection() {
  return (
    <section id="measures" className="section section--soft measurement-section" aria-labelledby="measures-title">
      <div className="section-heading">
        <p className="eyebrow">What Hale checks</p>
        <h2 id="measures-title">The abilities that keep daily life feeling easier.</h2>
        <p>Hale focuses on strength, balance and mobility because they show up in ordinary moments: stairs, chairs, curbs, reaching and bending.</p>
      </div>
      <div className="domain-grid">
        {measurementDomains.map((domain, index) => {
          const Icon = domainIcons[index] ?? Activity;
          return (
            <article className="domain-card" key={domain.title}>
              <span className="domain-card__icon">
                <Icon aria-hidden="true" size={22} />
              </span>
              <h3>{domain.title}</h3>
              <p>{domain.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CredibilitySection() {
  return (
    <section className="section credibility-section" aria-labelledby="credibility-title">
      <div className="section-heading section-heading--center">
        <p className="eyebrow">Measured, not guessed</p>
        <h2 id="credibility-title">A practical method, explained in plain language.</h2>
        <p>
          Hale is built to help with general fitness and wellbeing. It uses simple movement checks, monthly re-checks and calm explanations so results feel useful rather than clinical.
        </p>
      </div>
      <div className="credibility-grid">
        {credibilityPoints.map((point) => (
          <article className="credibility-card" key={point.title}>
            <ShieldCheck aria-hidden="true" size={22} />
            <h3>{point.title}</h3>
            <p>{point.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FirstMonthSection() {
  return (
    <section className="section section--feature month-section" aria-labelledby="month-title">
      <div className="month-section__copy">
        <p className="eyebrow">Your first month</p>
        <h2 id="month-title">A plan you can actually fit into your week.</h2>
        <p className="section-lead">
          Hale is built for routine, not all-or-nothing effort. Sessions are short, voice-guided and chosen from your check-up results.
        </p>
        <ol className="month-timeline">
          {firstMonthPlan.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </li>
          ))}
        </ol>
        <ul className="check-list">
          {trainingMessages.map((message) => (
            <li key={message}>
              <Check aria-hidden="true" size={18} />
              {message}
            </li>
          ))}
        </ul>
      </div>
      <div className="month-section__visual">
        <Image
          src={brandAssets.firstBlock}
          alt="A tidy home setup with Hale training cards and everyday exercise equipment."
          width={1672}
          height={941}
          sizes="(max-width: 900px) 100vw, 45vw"
        />
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section id="privacy" className="section trust-section" aria-labelledby="trust-title">
      <div className="trust-section__image">
        <Image
          src={brandAssets.cameraSetup}
          alt="A phone set up in a calm home space for a movement check-up."
          width={1672}
          height={941}
          sizes="(max-width: 900px) 100vw, 45vw"
        />
      </div>
      <div className="trust-section__copy">
        <p className="eyebrow">Private, calm and built for home</p>
        <h2 id="trust-title">Camera guidance without the mirror.</h2>
        <p className="section-lead">
          Hale uses the camera as a measuring tool during guided sessions. You see a clean skeleton, not self-view video.
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
          Hale is for general fitness and wellbeing. It is not medical advice, treatment or a medical device.
        </p>
      </div>
    </section>
  );
}

function DifferenceSection() {
  return (
    <section className="section difference-section" aria-labelledby="difference-title">
      <div className="section-heading section-heading--center">
        <p className="eyebrow">Why Hale feels different</p>
        <h2 id="difference-title">Built around measurement, not motivation tricks.</h2>
        <p>
          Hale is made for people who want a respectful, practical way to keep moving well without turning fitness into another source of pressure.
        </p>
      </div>
      <div className="difference-grid">
        {differencePoints.map((point) => (
          <article className="difference-card" key={point.title}>
            <h3>{point.title}</h3>
            <p>{point.body}</p>
          </article>
        ))}
      </div>
      <div className="trust-strip">
        {trustStrip.map((item) => (
          <article key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.body}</span>
          </article>
        ))}
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
        <h2 id="beta-title">Start with a clearer view of how your body is doing.</h2>
        <p className="section-lead">
          Beta members get early access to the core check-up and home plan, can share feedback and receive a substantial discount compared with the regular launch price.
        </p>
        <ul className="check-list">
          {betaTransparency.map((item) => (
            <li key={item}>
              <Check aria-hidden="true" size={18} />
              {item}
            </li>
          ))}
        </ul>
        <div className="beta-reassurance">
          <h3>What beta signup means</h3>
          <ul className="check-list">
            {betaReassurance.map((item) => (
              <li key={item}>
                <Check aria-hidden="true" size={18} />
                {item}
              </li>
            ))}
          </ul>
        </div>
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

function AppScreenshotPhone({
  src,
  alt,
  label,
  priority = false,
}: {
  src: string;
  alt: string;
  label: string;
  priority?: boolean;
}) {
  return (
    <figure className="app-screenshot-phone">
      <div className="app-screenshot-phone__frame">
        <Image
          src={src}
          alt={alt}
          width={720}
          height={1600}
          sizes="(max-width: 780px) 68vw, 280px"
          priority={priority}
          unoptimized
        />
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="section faq-section" aria-labelledby="faq-title">
      <div className="section-heading section-heading--center">
        <p className="eyebrow">Questions people ask first</p>
        <h2 id="faq-title">Clear answers before you try Hale.</h2>
      </div>
      <FAQ items={faqs} />
    </section>
  );
}
