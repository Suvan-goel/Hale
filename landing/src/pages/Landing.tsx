import { ScoreDial } from "../components/ScoreDial";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";
import heroImage from "../assets/landing/hero-home-checkup.jpg";
import monthlyCheckupImage from "../assets/landing/monthly-checkup.jpg";
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
    title: "Monthly re-tests",
    body: "Strength, balance, mobility and Clarity update month to month, so progress is measured rather than assumed from attendance.",
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
    title: "Clarity stays personal",
    body: "Short spoken checks track word-finding and attention load against your own normal — never an age chart, never anyone else's numbers.",
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
    body: "Your phone's camera and mic are the only sensors. Nothing to buy, charge or wear.",
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
    body: "All analysis happens on your phone. Camera footage and mic audio are processed on-device and never uploaded — they never leave your hands.",
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

const TREND = [
  { v: 54, l: "Check-up 1" },
  { v: 61, l: "Check-up 2" },
  { v: 66, l: "Check-up 3" },
];

const FAQS = [
  {
    q: "Can Elegant really measure brain fog?",
    a: "Not like a diagnosis or a lab test. Elegant tracks Clarity signals: how fluently words come, how thinking load affects balance, and how those signals change against your own baseline. It shows your pattern, not a cause or condition.",
  },
  {
    q: "How long does the check-up take?",
    a: "About ten minutes, once a month, guided by voice the whole way — a few minutes of movement, a few spoken minutes for the brain-fog check. You prop your phone against a wall, step back, and follow along.",
  },
  {
    q: "Do I need any equipment?",
    a: "No. The check-up needs your phone and a sturdy chair. Training uses your bodyweight and things already in your home — a chair, a wall, a bottom stair. Every exercise has a no-equipment version.",
  },
  {
    q: "Is my camera and mic data private?",
    a: "Yes. All analysis — movement and speech — runs on your phone. Footage and audio are never uploaded, never stored and never seen or heard by anyone. Your phone works like a tape measure, not a video call.",
  },
  {
    q: "I'm exhausted most days. Is this realistic?",
    a: "That's exactly who it's designed for. Sessions are short, done at home, and matched to your measured level — not a presenter's. And because progress is re-measured monthly, small consistent efforts show up as numbers you can see.",
  },
  {
    q: "I've never done strength training. Is this for me?",
    a: "Yes — especially. Your plan is built from your own measured starting point, so sessions begin where you are, not where a video presenter is. Movements scale down as well as up.",
  },
  {
    q: "When does it launch?",
    a: "We're testing Elegant with a small early group now. The waitlist is invited in waves as places open — joining today puts you nearer the front of the queue.",
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
      <section id="hero" className="relative overflow-hidden bg-ink text-bone">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,36,32,0.96)_0%,rgba(26,36,32,0.88)_42%,rgba(26,36,32,0.56)_70%,rgba(26,36,32,0.24)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,36,32,0.18)_0%,rgba(26,36,32,0.02)_44%,rgba(26,36,32,0.70)_100%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-5 md:px-8">
          <header className="flex items-center justify-between py-6">
            <span className="font-display text-[22px] font-medium tracking-tight">
              Elegant<span className="text-brass">.</span>
            </span>
            <button
              onClick={onScrollToForm}
              className="rounded-full border border-bone/25 px-4 py-2 text-sm font-medium text-bone transition-colors hover:border-bone/60"
            >
              Join the waitlist
            </button>
          </header>

          <div className="max-w-[590px] pb-12 pt-6 md:pb-14 md:pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bone/55">
              For perimenopause &amp; menopause
            </p>
            <h1 className="mt-4 font-display text-[2.4rem] leading-[1.06] md:text-[3.25rem]">
              Track strength. Track clarity.{" "}
              <em className="italic text-brass">Train what changes.</em>
            </h1>
            <p className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-bone/80">
              Elegant uses one short monthly phone check-up to track strength, balance, mobility
              and Clarity signals. Then it builds short strength-based sessions at home and
              re-tests you, so you can see what is changing.
            </p>
            <div className="mt-7">
              <button
                onClick={onScrollToForm}
                className="h-13 rounded-full bg-bone px-8 text-[15px] font-semibold text-ink transition-opacity hover:opacity-90"
              >
                Join the waitlist
              </button>
              <p className="mt-3 text-sm text-bone/60">
                Early access and founding-member pricing. No spam.
              </p>
            </div>
            <p className="mt-7 flex items-start gap-2 text-sm text-bone/60">
              <span className="mt-0.5 shrink-0">
                <LockIcon />
              </span>
              All analysis happens on your phone — video and audio never leave it.
            </p>
          </div>
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
                harder to trust. Sleep, symptoms, stress and energy all blur together. The stage of
                life where training matters most is often the stage with the least room for trial
                and error.
              </p>
              <p>
                Most apps answer with videos, streaks and minutes. Elegant starts with measurement:
                body numbers, a personal Clarity trend, and a strength plan aimed at the changes
                you can actually train.
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
                Elegant keeps the loop that simple.
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
          <div className="mt-12 grid items-start gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
            <Reveal>
              <figure>
                <img
                  src={monthlyCheckupImage}
                  alt="A woman doing a controlled sit-to-stand at home while her phone is propped nearby for a monthly check-up."
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-lg object-cover object-[58%_center] shadow-[0_26px_70px_-42px_rgba(26,36,32,0.75)]"
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
                  title: "Take a ten-minute check-up",
                  body: "Prop your phone against a wall and follow the voice. Sit-to-stands, balance holds and reach tests set your movement baseline; a few short spoken prompts set your Clarity baseline. No wearable, no gym.",
                },
                {
                  n: "02",
                  title: "See your baseline",
                  body: "Strength, balance and mobility are compared with women your age. Clarity is compared only with your own normal. The result shows where to focus first, without turning your symptoms into a diagnosis.",
                },
                {
                  n: "03",
                  title: "Build strength, then re-test",
                  body: "Follow short strength-based sessions built around your starting point. Strength is the engine: it helps preserve muscle and supports the sleep, mood and symptom patterns linked with clearer days. Then re-test and watch your numbers move.",
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
        </div>
      </section>

      {/* ── The differentiator ────────────────────────────────────────── */}
      <section className="bg-ink text-bone">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <Reveal className="max-w-2xl">
            <Eyebrow dark>Why Elegant</Eyebrow>
            <h2 className="mt-5 font-display text-[2rem] leading-[1.12] md:text-[2.6rem]">
              Built around proof, not streaks.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-bone/75">
              Fitness apps count what you did — sessions, streaks, minutes. Elegant measures what
              changed. Every month your movement scores and Clarity trend update, and your plan
              adjusts to what your body actually did. On the weeks motivation dips, a number that
              moved is worth more than a streak.
            </p>
          </Reveal>

          <div className="mt-14 grid items-center gap-12 md:grid-cols-2">
            <Reveal className="min-w-0">
              <div className="rounded-lg border border-bone/12 bg-[#212d27] p-5 sm:p-8">
                {/* Two sizes so the three dials never force the card past a 375px viewport */}
                <div className="hidden items-end justify-around gap-2 sm:flex">
                  {TREND.map((d, i) => (
                    <ScoreDial
                      key={d.l}
                      value={d.v}
                      label={d.l}
                      size={i === 2 ? 108 : 92}
                      tone="dark"
                      surface="#212d27"
                    />
                  ))}
                </div>
                <div className="flex items-end justify-around gap-1 sm:hidden">
                  {TREND.map((d, i) => (
                    <ScoreDial
                      key={d.l}
                      value={d.v}
                      label={d.l}
                      size={i === 2 ? 94 : 80}
                      tone="dark"
                      surface="#212d27"
                    />
                  ))}
                </div>
                <p className="mt-6 text-center text-xs tracking-wide text-bone/50">
                  Example monthly check-up trend · not a diagnosis
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
                      className="mt-0.5 shrink-0 text-brass"
                      aria-hidden="true"
                    >
                      {f.icon}
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold">{f.title}</h3>
                      <p className="mt-1 leading-relaxed text-bone/70">{f.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal className="mt-16 text-center">
            <button
              onClick={onScrollToForm}
              className="h-13 rounded-full bg-bone px-8 text-[15px] font-semibold text-ink transition-opacity hover:opacity-90"
            >
              Join the waitlist
            </button>
            <p className="mt-3 text-sm text-bone/60">
              Early access and founding-member pricing. No spam.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Why strength training ─────────────────────────────────────── */}
      <section className="bg-bone">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:gap-14 md:px-8 md:py-28">
          <Reveal>
            <img
              src={strengthEngineImage}
              alt="A woman doing a safe low step-up at home with one hand lightly on the rail."
              loading="lazy"
              className="aspect-[4/3] w-full rounded-lg object-cover object-[46%_center] shadow-[0_26px_70px_-42px_rgba(26,36,32,0.75)]"
            />
          </Reveal>
          <Reveal delay={120}>
            <Eyebrow>Why strength is the engine</Eyebrow>
            <h2 className="mt-6 font-display text-[1.9rem] leading-[1.2] md:text-[2.4rem]">
              Strength training is the core habit because muscle is one of the things you can train.
            </h2>
            <div className="mt-6 max-w-xl space-y-4 text-[17px] leading-relaxed text-ink/75">
              <p>
                Not because it is fashionable — because working muscle is how you keep it.
                Strength training is widely recommended during menopause, and regular exercise also
                supports the sleep, mood and symptom load that many people recognise in foggier
                days.
              </p>
              <p>
                Elegant does not promise to cure brain fog. It helps you train consistently, start
                at the right level, and track whether your own strength and Clarity patterns are
                shifting.
              </p>
            </div>
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
              See strength and clarity <em className="italic text-[#d8b071]">in numbers.</em>
            </h2>
            <p className="mt-4 text-[17px] text-bone/80">
              You've guessed long enough. Join the waitlist for early access.
            </p>
            <div className="mt-8">
              <WaitlistForm onSubmit={onJoin} />
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
