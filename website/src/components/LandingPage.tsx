import Image from 'next/image';
import { ArrowDown, ArrowRight, ShieldCheck } from 'lucide-react';

import { BetaSignupForm } from './BetaSignupForm';
import { FAQ } from './FAQ';
import { StoreButtons } from './StoreButtons';
import { brandAssets } from '@/config/brand';
import type { HeroFocus } from '@/content/landing';
import {
  betaLifetimeNote,
  betaReassurance,
  betaValueList,
  checkupActivities,
  credibilityPoints,
  exampleResult,
  faqs,
  finalCta,
  firstMonthPlan,
  founderNote,
  heroFocusCopy,
  howItWorks,
  measurementDomains,
  problemPoints,
  trainingMessages,
  trustDetails,
  trustStrip,
  valueCase,
} from '@/content/landing';
import { formatCurrency, type PricingPresentation } from '@/lib/pricing';
import type { StoreLink } from '@/lib/store-links';

interface LandingPageProps {
  focus: HeroFocus;
  pricing: PricingPresentation;
  storeLinks: readonly StoreLink[];
  betaSignupEnabled: boolean;
}

const workflowVisuals = [
  {
    image: brandAssets.workflow.setup,
    alt: 'A phone on a stand facing a chair and open movement space for a Hale Movement Check-Up.',
    screenshot: null,
    screenshotAlt: '',
  },
  {
    image: brandAssets.workflow.result,
    alt: 'A phone set on a warm home counter after a Hale Movement Check-Up.',
    screenshot: brandAssets.screenshots.progress,
    screenshotAlt: 'Hale app Progress screen.',
  },
  {
    image: brandAssets.workflow.training,
    alt: 'A Hale home training setup with a phone nearby and an adult doing a supported band movement.',
    screenshot: brandAssets.screenshots.plan,
    screenshotAlt: 'Hale app Plan screen.',
  },
] as const;

export function LandingPage({ focus, pricing, storeLinks, betaSignupEnabled }: LandingPageProps) {
  return (
    <main id="top">
      <HeroSection focus={focus} pricing={pricing} storeLinks={storeLinks} />
      <FactStrip />
      <ProblemSection />
      <HowItWorksSection />
      <CheckupSection />
      <MeasuresSection />
      <FirstMonthSection />
      <PrivacySection />
      <FounderNoteSection />
      <PricingSection pricing={pricing} storeLinks={storeLinks} betaSignupEnabled={betaSignupEnabled} />
      <FAQSection />
      <FinalCtaSection />
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
        className="hero__background"
        src={brandAssets.hero}
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
      />
      <div className="hero__inner">
        <p className="hero__chip">For adults 45+ who want to stay capable</p>
        <h1 id="hero-title">Hale</h1>
        <p className="hero__promise">A movement check-up and home plan for staying strong, steady and independent.</p>
        <p className="hero__body">{heroFocusCopy[focus]}</p>
        <div className="hero__actions">
          <StoreButtons links={storeLinks} ctaLocation="hero" fallbackLabel="Join the Hale beta" />
          <a className="button button--ghost" href="#how-it-works">
            See how it works
            <ArrowDown aria-hidden="true" size={17} />
          </a>
        </div>
        <p className="hero__meta">
          Hale is currently in beta.
          {pricing.kind === 'configured' ? (
            <>
              {' '}
              <strong>{pricing.betaFormatted}</strong> {pricing.billingDescription} — save {pricing.savingPercent}% for
              life.
            </>
          ) : null}
        </p>
      </div>
      <div className="hero__app-preview" aria-hidden="true">
        <Image
          src={brandAssets.screenshots.progress}
          alt=""
          width={720}
          height={1600}
          sizes="180px"
          priority
        />
      </div>
    </section>
  );
}

function FactStrip() {
  return (
    <section className="fact-strip" aria-label="Hale at a glance">
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
    <section className="section problem-section" aria-labelledby="problem-title">
      <div className="section-heading section-heading--center">
        <h2 id="problem-title">The changes are often quiet at first.</h2>
        <p>
          Many people do not wake up feeling old. They notice small moments: a chair feels lower, a walk feels longer,
          or balance takes more thought than it used to.
        </p>
      </div>
      <ul className="problem-list">
        {problemPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <div className="problem-section__visual">
        <Image
          src={brandAssets.dailyMovement}
          alt="An adult standing from a chair near stairs in a warm home."
          width={1672}
          height={941}
          sizes="(max-width: 900px) 100vw, 760px"
        />
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section method-section" aria-labelledby="how-title">
      <div className="section-heading section-heading--center">
        <h2 id="how-title">Check. Train. Re-check.</h2>
        <p>
          One simple loop: measure how you move, train what needs attention, then check again next month — so you are
          never guessing what to work on.
        </p>
      </div>
      <div className="steps">
        {howItWorks.map((step, index) => {
          const visual = workflowVisuals[index] ?? workflowVisuals[0];

          return (
            <article className="step-card" key={step.title}>
              <WorkflowStepMedia visual={visual} />
              <span className="step-card__number">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function WorkflowStepMedia({ visual }: { visual: (typeof workflowVisuals)[number] }) {
  return (
    <div className="step-card__media">
      <Image src={visual.image} alt={visual.alt} fill sizes="(max-width: 779px) 100vw, 340px" />
      {visual.screenshot ? (
        <div className="step-card__phone">
          <Image src={visual.screenshot} alt={visual.screenshotAlt} width={720} height={1600} sizes="96px" />
        </div>
      ) : null}
    </div>
  );
}

function CheckupSection() {
  return (
    <section className="section checkup-section" aria-labelledby="checkup-title">
      <div className="checkup-section__copy">
        <h2 id="checkup-title">Simple movements, guided step by step.</h2>
        <p className="section-lead">
          You do not need to learn a workout before you begin. Hale talks you through familiar movements and turns the
          check-up into clear next steps.
        </p>
        <div className="activity-list">
          {checkupActivities.map((activity) => (
            <article className="activity-item" key={activity.title}>
              <h3>{activity.title}</h3>
              <p>{activity.body}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="checkup-section__visual">
        <div className="checkup-section__image">
          <Image
            src={brandAssets.checkupBackground}
            alt="A phone on a stand beside a chair for a home movement check-up."
            width={1672}
            height={941}
            sizes="(max-width: 900px) 100vw, 45vw"
          />
        </div>
        <ExampleResultPanel />
      </div>
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

function MeasuresSection() {
  return (
    <section id="measures" className="section measures-section" aria-labelledby="measures-title">
      <div className="section-heading section-heading--center">
        <h2 id="measures-title">The abilities that keep daily life feeling easier.</h2>
        <p>
          Hale focuses on strength, balance and mobility because they show up in ordinary moments: stairs, chairs,
          curbs, reaching and bending.
        </p>
      </div>
      <div className="domain-grid">
        {measurementDomains.map((domain) => (
          <article className="domain-card" key={domain.title}>
            <h3>{domain.title}</h3>
            <p>{domain.body}</p>
          </article>
        ))}
      </div>
      <AppScreenshotShowcase />
      <div className="method-notes">
        {credibilityPoints.map((point) => (
          <article key={point.title}>
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
    <section className="section month-section" aria-labelledby="month-title">
      <div className="month-section__copy">
        <h2 id="month-title">A plan you can actually fit into your week.</h2>
        <p className="section-lead">
          Hale is built for routine, not all-or-nothing effort. Sessions are short, voice-guided and chosen from your
          check-up results.
        </p>
        <ol className="month-timeline">
          {firstMonthPlan.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </li>
          ))}
        </ol>
        <ul className="fine-list">
          {trainingMessages.map((message) => (
            <li key={message}>{message}</li>
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
        <div className="month-section__phone">
          <Image
            src={brandAssets.screenshots.plan}
            alt="Hale app Plan screen showing a weekly home training plan."
            width={720}
            height={1600}
            sizes="(max-width: 900px) 34vw, 180px"
          />
        </div>
      </div>
    </section>
  );
}

function PrivacySection() {
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
        <h2 id="trust-title">Camera guidance without the mirror.</h2>
        <p className="section-lead">
          Hale uses the camera as a measuring tool during guided sessions. You see a clean skeleton, not self-view
          video.
        </p>
        <ul className="trust-list">
          {trustDetails.map((detail) => (
            <li key={detail}>
              <ShieldCheck aria-hidden="true" size={19} />
              {detail}
            </li>
          ))}
        </ul>
        <p className="disclaimer">
          Hale is for general fitness and wellbeing. It is not medical advice, treatment or a medical device.
        </p>
      </div>
    </section>
  );
}

function AppScreenshotShowcase() {
  return (
    <div className="app-screenshot-showcase" aria-label="Hale app screenshots">
      <div className="app-screenshot-showcase__phone">
        <Image
          src={brandAssets.screenshots.plan}
          alt="Hale app Plan screen."
          width={720}
          height={1600}
          sizes="(max-width: 779px) 44vw, 220px"
        />
      </div>
      <div className="app-screenshot-showcase__phone">
        <Image
          src={brandAssets.screenshots.progress}
          alt="Hale app Progress screen."
          width={720}
          height={1600}
          sizes="(max-width: 779px) 44vw, 220px"
        />
      </div>
      <div className="app-screenshot-showcase__phone">
        <Image
          src={brandAssets.screenshots.explore}
          alt="Hale app Explore screen."
          width={720}
          height={1600}
          sizes="(max-width: 779px) 44vw, 220px"
        />
      </div>
    </div>
  );
}

function FounderNoteSection() {
  return (
    <section className="section founder-section" aria-labelledby="founder-title">
      <div className="founder-note">
        <p className="eyebrow">{founderNote.eyebrow}</p>
        <p id="founder-title" className="founder-note__quote">
          &ldquo;{founderNote.quote}&rdquo;
        </p>
        <p className="founder-note__attribution">{founderNote.attribution}</p>
      </div>
    </section>
  );
}

function PricingSection({
  pricing,
  storeLinks,
  betaSignupEnabled,
}: {
  pricing: PricingPresentation;
  storeLinks: readonly StoreLink[];
  betaSignupEnabled: boolean;
}) {
  const annualCost = pricing.kind === 'configured' ? formatCurrency(pricing.beta * 12, pricing.currency) : null;

  return (
    <section id="beta-access" className="section pricing-section" aria-labelledby="pricing-title">
      <div className="section-heading section-heading--center">
        <h2 id="pricing-title">{valueCase.title}</h2>
        <p>
          Beta members get early access to the core check-up and home plan, help shape what improves, and receive a
          substantial discount compared with the regular launch price — kept for life.
        </p>
      </div>
      <p className="pricing-quote">
        {annualCost
          ? `A full year of Hale costs ${annualCost} as a beta member — less than a single one-off physiotherapy or personal-training session, for a plan that keeps measuring and adjusting every week.`
          : valueCase.costComparison}
      </p>
      <aside className="pricing-card" aria-label="Hale beta offer">
        <div className="pricing-card__header">
          <span>Beta offer</span>
          <strong>Early access</strong>
        </div>
        {pricing.kind === 'configured' ? (
          <div className="price-stack">
            {pricing.savingPercent > 0 ? <span className="pricing-card__badge">Locked in for life</span> : null}
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
        {pricing.kind === 'configured' ? <p className="price-stack__lifetime">{betaLifetimeNote}</p> : null}
        <ul className="value-list">
          {betaValueList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <StoreButtons links={storeLinks} ctaLocation="pricing" fallbackLabel="Join the Hale beta" />
        {betaSignupEnabled ? <BetaSignupForm ctaLocation="pricing" /> : null}
      </aside>
      <ul className="pricing-footnotes">
        {betaReassurance.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="section faq-section" aria-labelledby="faq-title">
      <div className="section-heading section-heading--center">
        <h2 id="faq-title">Questions, answered plainly.</h2>
      </div>
      <FAQ items={faqs} />
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="section final-cta-section" aria-labelledby="final-title">
      <div className="final-cta">
        <h2 id="final-title">{finalCta.title}</h2>
        <p>{finalCta.body}</p>
        <a className="button button--inverse" href="#beta-access">
          Join the Hale beta
          <ArrowRight aria-hidden="true" size={18} />
        </a>
      </div>
    </section>
  );
}
