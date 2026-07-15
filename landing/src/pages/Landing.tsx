import { PhoneMockup } from "../components/PhoneMockup";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";
import { CONTACT_EMAIL } from "../config";
import heroImage from "../assets/landing/hero-home-checkup.jpg";
import progressCheckupImage from "../assets/landing/progress-checkup.jpg";
import strengthEngineImage from "../assets/landing/strength-engine.jpg";

function Eyebrow({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <p
      className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] ${
        dark ? "text-bone/50" : "text-pine/70"
      }`}
    >
      <span className={`h-px w-8 ${dark ? "bg-bone/30" : "bg-pine/40"}`} aria-hidden="true" />
      {children}
    </p>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const FEATURES = [
  {
    title: "Four comparable check-ups",
    body: "The same Strength and Balance protocol runs at baseline and after weeks 4, 8 and 12, so change is measured rather than guessed from attendance.",
    icon: (
      <path
        d="M4 12a8 8 0 1 1 2.3 5.6M4 12v-4m0 4h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    title: "Everyday Clarity stays separate",
    body: "An optional five-question check-in tracks how thinking felt against your own pattern. It never changes your training plan or becomes a combined body score.",
    icon: (
      <>
        <path
          d="M4 17.5h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="2.5 3"
          fill="none"
        />
        <path
          d="M4.5 12l4.5-4.5 4 3 6-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </>
    ),
  },
  {
    title: "No wearable required",
    body: "Your phone camera measures the four check-ups. Daily training is voice-paced and camera-free. Nothing to buy, charge or wear.",
    icon: (
      <>
        <rect
          x="7"
          y="3"
          width="10"
          height="18"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="12" cy="17.5" r="1" fill="currentColor" />
      </>
    ),
  },
  {
    title: "Private by design",
    body: "The MVP is local-first. Check-up measurements and your optional Clarity answers stay on your phone, and Pearl never shows or stores self-view video.",
    icon: (
      <path
        d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
];

const FAQS = [
  {
    q: "What does Everyday Clarity mean?",
    a: "Everyday Clarity is Pearl's optional five-question check-in about how clear, focused and mentally effortful the day felt. It is tracked against your own pattern, kept separate from Strength and Balance, and is not a diagnosis or an objective cognitive test.",
  },
  {
    q: "How long does the check-up take?",
    a: "About eight minutes. You complete the same guided warm-up, one-leg balance hold and 30-second chair stand at baseline and after weeks 4, 8 and 12. The optional Everyday Clarity check-in takes less than a minute.",
  },
  {
    q: "Do I need any equipment?",
    a: "No. The check-up needs your phone and a sturdy chair. Training uses your bodyweight and things already in your home — a chair, a wall, a bottom stair. Every exercise has a no-equipment version.",
  },
  {
    q: "What phone do I need?",
    a: "Any reasonably recent iPhone or Android phone. The camera it already has is the only check-up sensor involved — no wearable or extra hardware.",
  },
  {
    q: "Is my check-up data private?",
    a: "Yes. Pearl's MVP is local-first. Camera measurement runs on your phone, self-view video is never shown or stored, and your optional Clarity answers remain on-device. Your phone works like a tape measure, not a video call.",
  },
  {
    q: "I'm exhausted most days. Is this realistic?",
    a: "That's exactly who it's designed for. Sessions are short, done at home, and matched to your measured starting point — not a presenter's. The week-4, week-8 and week-12 check-ups make small changes visible.",
  },
  {
    q: "I've never done strength training. Is this for me?",
    a: "Yes — especially. Your plan is built from your own measured starting point, so sessions begin where you are, not where a video presenter is. Movements scale down as well as up.",
  },
  {
    q: "When does it launch?",
    a: "We're testing Pearl with a small early group now. The waitlist is invited in waves as places open — joining today puts you nearer the front of the queue.",
  },
  {
    q: "What will it cost?",
    a: "Final pricing isn't set. Waitlist members get early access first and founding-member pricing — our thank-you for being early.",
  },
];

export function Landing({
  onJoin,
  onScrollToForm,
}: {
  onJoin: (email: string) => Promise<void>;
  onScrollToForm: () => void;
}) {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section id="hero" className="relative overflow-hidden bg-bone text-ink">
        {/* Desktop: photographic backdrop; y-position keeps the subject's head clear of the crop */}
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="absolute inset-0 hidden h-full w-full object-cover object-[62%_18%] md:block"
        />
        <div
          className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(250,248,247,0.99)_0%,rgba(250,248,247,0.97)_42%,rgba(250,248,247,0.78)_62%,rgba(250,248,247,0.12)_100%)] md:block"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 hidden bg-[linear-gradient(180deg,rgba(250,248,247,0.18)_0%,rgba(250,248,247,0)_48%,rgba(250,248,247,0.72)_100%)] md:block"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-5 md:px-8">
          <header className="flex items-center justify-between py-6">
            <span className="font-display text-[22px] font-medium tracking-tight">
              Pearl<span className="text-pine">.</span>
            </span>
            <button
              onClick={onScrollToForm}
              className="rounded-2xl border border-pine/25 bg-paper/85 px-4 py-2 text-sm font-medium text-pine shadow-[0_4px_18px_rgba(56,39,28,0.08)] backdrop-blur-sm transition-colors hover:border-pine/55 hover:bg-paper"
            >
              Join the waitlist
            </button>
          </header>

          <div className="max-w-[590px] pb-12 pt-8 md:pb-28 md:pt-16">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine/75">
              12 weeks · Strength · Balance · Everyday Clarity
            </p>
            <h1 className="mt-4 font-display text-[2.4rem] leading-[1.06] md:text-[3.4rem]">
              Measure your strength.{" "}
              <em className="italic text-pine">Track your clarity.</em>
            </h1>
            <p className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-ink/75">
              Pearl is a private 12-week home strength programme for women in perimenopause and
              early postmenopause. Four camera check-ups measure Strength and Balance; an optional
              Everyday Clarity check-in tracks how thinking felt alongside them.
            </p>
            <div className="mt-7">
              <button
                onClick={onScrollToForm}
                className="h-13 rounded-2xl bg-pine px-8 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(124,64,93,0.18)] transition-colors hover:bg-[#69364F]"
              >
                Join the waitlist
              </button>
              <p className="mt-3 text-sm text-ink/60">
                Early access and founding-member pricing. No spam.
              </p>
            </div>
            <p className="mt-7 flex items-start gap-2 text-sm text-ink/65">
              <span className="mt-0.5 shrink-0">
                <LockIcon />
              </span>
              Check-up measurement happens on your phone — self-view video is never shown or stored.
            </p>
          </div>
        </div>
        {/* Mobile: the photo gets its own full-bleed strip below the copy instead of
            fighting the text as a background */}
        <div className="relative md:hidden" aria-hidden="true">
          <img src={heroImage} alt="" className="h-60 w-full object-cover object-[62%_16%]" />
          <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(250,248,247,1)_0%,rgba(250,248,247,0)_100%)]" />
        </div>
      </section>

      {/* ── The problem ───────────────────────────────────────────────── */}
      <section className="bg-bone">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-12 md:gap-8 md:px-8 md:py-28">
          <Reveal className="md:col-span-5">
            <Eyebrow>The problem</Eyebrow>
            <h2 className="mt-5 font-display text-[2rem] leading-[1.12] md:text-[2.6rem]">
              When your body and brain feel different, guessing is exhausting.
            </h2>
          </Reveal>
          <Reveal delay={120} className="md:col-span-6 md:col-start-7 md:pt-12">
            <ul className="space-y-4 font-display text-[1.3rem] italic leading-snug text-ink/80 md:text-[1.4rem]">
              {[
                "I feel weaker than I did last year.",
                "Mid-sentence, the word just… goes.",
                "I know strength training matters — I just don't know where to start.",
                "I've tried things. I have no idea if any of it worked.",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-4 h-px w-6 shrink-0 bg-brass" aria-hidden="true" />
                  &ldquo;{line}&rdquo;
                </li>
              ))}
            </ul>
            <div className="mt-9 space-y-5 text-[17px] leading-relaxed text-ink/80">
              <p>
                Perimenopause and menopause can make strength feel harder to keep and clarity
                harder to trust. Sleep, symptoms, stress and energy blur together. The stage of
                life where training matters most leaves the least room for trial and error.
              </p>
              <p>
                Most apps answer with videos, streaks and minutes — more effort in, no evidence
                out. And you can't work on what nobody will measure.
              </p>
            </div>
          </Reveal>
          <Reveal className="md:col-span-12 md:mt-8">
            <div className="mt-4 border-t border-line pt-12 text-center md:pt-16">
              <p className="mx-auto max-w-2xl font-display text-[1.5rem] leading-[1.3] md:text-[1.9rem]">
                You never needed another video library. You needed three answers:
              </p>
              <div className="mt-6 space-y-2 font-display text-[1.75rem] italic leading-[1.25] text-brass md:text-[2.3rem]">
                <p>Where do I stand?</p>
                <p>What should I work on?</p>
                <p>Is it working?</p>
              </div>
              <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-ink/70">
                Pearl answers those three. Nothing else.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-5 font-display text-[2rem] leading-[1.12] md:text-[2.6rem]">
              Test. Train. Re-test.
            </h2>
          </Reveal>
          <div className="mt-12 grid items-stretch gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
            <Reveal className="h-full">
              <figure className="flex h-full flex-col">
                <img
                  src={progressCheckupImage}
                  alt="A woman doing a controlled sit-to-stand at home while her phone is propped nearby for a Pearl check-up."
                  loading="lazy"
              className="aspect-[4/3] w-full rounded-2xl object-cover object-[58%_center] shadow-[0_24px_64px_-40px_rgba(56,39,28,0.42)] lg:aspect-auto lg:min-h-0 lg:flex-1"
                />
                <figcaption className="mt-3 text-sm leading-relaxed text-ink/60">
                  The phone works like a measuring instrument: propped up, hands-free, and private.
                </figcaption>
              </figure>
            </Reveal>
            <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  n: "01",
                  title: "Take your baseline check-up",
                  body: "Prop your phone against a wall and follow the voice through the fixed protocol: a short warm-up, one-leg balance and a 30-second chair stand. Add the optional Everyday Clarity check-in if you want to track how thinking felt.",
                },
                {
                  n: "02",
                  title: "See your baseline",
                  body: "Pearl uses Strength and Balance to choose a Strength focus, Balance focus or Balanced plan. Everyday Clarity is compared only with your own pattern and never changes the prescription.",
                },
                {
                  n: "03",
                  title: "Train for 12 weeks, then see the pattern",
                  body: "Follow three short voice-paced home sessions a week through Foundations, Build and Progress. Re-check after weeks 4, 8 and 12 with the same protocol so the comparison stays meaningful.",
                },
              ].map((step, i) => (
                <Reveal key={step.n} delay={i * 110}>
                  <div className="border-t-2 border-ink/15 pt-6">
                    <span className="font-display text-[2rem] italic leading-none text-brass">
                      {step.n}
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-ink/70">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal className="mt-16">
            <div className="rounded-2xl border border-line bg-bone px-6 py-9 text-center md:px-12 md:py-11">
              <p className="font-display text-[1.5rem] leading-snug md:text-[1.8rem]">
                The tests aren't ours. <em className="italic text-brass">The convenience is.</em>
              </p>
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-ink/70">
                Pearl's check-up uses a 30-second chair stand and timed one-leg balance — familiar
                functional tests with published reference values behind them. The same movements,
                order and setup repeat at every check-up. Your phone does not invent the
                measurements; it makes a consistent protocol easier to repeat at home.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Why strength training ─────────────────────────────────────── */}
      <section className="bg-bone">
        <div className="mx-auto grid max-w-6xl items-stretch gap-10 px-5 py-20 md:grid-cols-2 md:gap-14 md:px-8 md:py-28">
          <Reveal className="h-full">
            <img
              src={strengthEngineImage}
              alt="A woman doing a safe low step-up at home with one hand lightly on the rail."
              loading="lazy"
              className="aspect-[4/3] w-full rounded-2xl object-cover object-[46%_center] shadow-[0_24px_64px_-40px_rgba(56,39,28,0.42)] md:aspect-auto md:h-full"
            />
          </Reveal>
          <Reveal delay={120} className="md:py-2">
            <Eyebrow>Why strength is the engine</Eyebrow>
            <h2 className="mt-6 font-display text-[2rem] leading-[1.15] md:text-[2.6rem]">
              Muscle is the part you can train.
            </h2>
            <div className="mt-6 max-w-xl space-y-4 text-[17px] leading-relaxed text-ink/75">
              <p>
                Strength training is widely recommended during menopause for one plain reason:
                working muscle is how you keep it. Regular exercise can also support sleep and
                mood, two things many people notice alongside foggier days.
              </p>
              <p>
                Pearl does not promise to treat brain fog or prove what caused a foggy day. It
                helps you train consistently, start at an appropriate level, and observe your own
                Strength, Balance and Everyday Clarity patterns across 12 weeks.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── The differentiator ────────────────────────────────────────── */}
      <section className="overflow-hidden bg-elevated text-ink">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <Reveal className="max-w-2xl">
            <Eyebrow>Why Pearl</Eyebrow>
            <h2 className="mt-5 font-display text-[2rem] leading-[1.12] md:text-[2.6rem]">
              Built around proof, not streaks.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-ink/70">
              Fitness apps count what you did — sessions, streaks, minutes. Pearl pairs a
              structured 12-week plan with comparable check-ups at baseline and after weeks 4, 8
              and 12. Strength and Balance guide the plan; Everyday Clarity remains an optional,
              separate observation rather than a promise about cognition.
            </p>
          </Reveal>

          <div className="mt-14 grid items-center gap-12 md:grid-cols-2">
            <Reveal className="min-w-0">
              <div className="mx-auto max-w-[340px]">
                <PhoneMockup />
                <p className="mt-6 text-center text-xs tracking-wide text-ink/60">
                  Example check-up · illustrative data, not a diagnosis
                </p>
              </div>
            </Reveal>
            <div className="min-w-0 space-y-8">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 110}>
                  <div className="flex gap-4">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      className="mt-0.5 shrink-0 text-pine"
                      aria-hidden="true"
                    >
                      {f.icon}
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold">{f.title}</h3>
                      <p className="mt-1 leading-relaxed text-ink/70">{f.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal className="mt-16 text-center">
            <button
              onClick={onScrollToForm}
              className="h-13 rounded-2xl bg-pine px-8 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(124,64,93,0.16)] transition-colors hover:bg-[#69364F]"
            >
              Join the waitlist
            </button>
            <p className="mt-3 text-sm text-ink/60">
              Early access and founding-member pricing. No spam.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Founder note ──────────────────────────────────────────────── */}
      <section className="bg-bone">
        <div className="mx-auto max-w-2xl px-5 py-20 md:px-8 md:py-28">
          <Reveal>
            <Eyebrow>From the founder</Eyebrow>
            <h2 className="mt-5 font-display text-[2rem] leading-[1.12] md:text-[2.6rem]">
              Built for my mum.
            </h2>
            <div className="mt-7 space-y-5 text-[17px] leading-relaxed text-ink/80">
              <p>
                I've been obsessed with health and fitness for years. When I finally convinced my
                parents to take their own health seriously, the change in their quality of life
                was profound — and it left me wanting to help more women build strength with
                clear, private guidance.
              </p>
              <p>
                Then I started noticing changes in my mum. Anxiety, mood swings, forgetfulness —
                she didn't quite seem herself. It led to one of the most honest conversations
                we've ever had: about menopause, how much it asks of women, and how little clear
                help they're given.
              </p>
              <p>
                I'm a student at Imperial College London, and building software and AI systems is
                what I know how to do. So I built what I wished existed for her: a way to see
                clearly what's changing — strength, balance, clarity — and whether the work she
                puts in is paying her back.
              </p>
              <p>
                {CONTACT_EMAIL ? (
                  <>
                    Pearl is that answer. If it ever overpromises,{" "}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="underline underline-offset-4 hover:text-ink"
                    >
                      email me
                    </a>{" "}
                    and tell me.
                  </>
                ) : (
                  "Pearl is that answer. It should never need to overpromise."
                )}
              </p>
            </div>
            <p className="mt-8 font-display text-2xl italic">— Suvan</p>
            <p className="mt-1 text-sm text-ink/60">Founder, Pearl</p>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-paper">
        <div className="mx-auto max-w-2xl px-5 py-20 md:px-8 md:py-28">
          <Reveal>
            <Eyebrow>Questions</Eyebrow>
            <h2 className="mt-5 font-display text-[2rem] leading-[1.12] md:text-[2.6rem]">
              Asked and answered.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-10">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group border-b border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16px] font-semibold">
                    {faq.q}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      aria-hidden="true"
                      className="shrink-0 text-brass transition-transform duration-200 group-open:rotate-45"
                    >
                      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </summary>
                  <p className="pb-5 leading-relaxed text-ink/75">{faq.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Final CTA + form ──────────────────────────────────────────── */}
      <section id="waitlist" className="relative overflow-hidden bg-pine text-bone">
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="absolute -right-40 -top-56 h-[560px] w-[560px]"
        >
          <g transform="rotate(150 50 50)">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(243,239,231,0.07)"
              strokeWidth="1.4"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="66.6 100"
            />
          </g>
        </svg>
        <div className="relative mx-auto max-w-2xl px-5 py-20 text-center md:px-8 md:py-28">
          <Reveal>
            <h2 className="font-display text-[2.1rem] leading-[1.1] md:text-[2.8rem]">
              See Strength and Balance <em className="italic text-[#d8b071]">in numbers.</em>
            </h2>
            <p className="mt-4 text-[17px] text-bone/80">
              You've guessed long enough. Join the waitlist for early access.
            </p>
            <div className="mx-auto mt-9 max-w-md text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bone/60">
                After your baseline check-up, you'll know
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  "Your Strength and Balance starting point",
                  "Whether your plan starts Strength-focused, Balance-focused or Balanced",
                  "The baseline your week-4, week-8 and week-12 check-ups compare with",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[16px] text-bone/90">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[#d8b071]"
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M8 12.5l2.6 2.6L16 9.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-9">
              <WaitlistForm onSubmit={onJoin} />
            </div>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-bone/65">
              You're on the list the moment you join. Invites go out in waves — the earlier you
              join, the earlier your wave.
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
