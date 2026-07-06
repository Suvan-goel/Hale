import { PhoneMockup } from "../components/PhoneMockup";
import { ScoreDial } from "../components/ScoreDial";
import { Reveal } from "../components/Reveal";
import { WaitlistForm } from "../components/WaitlistForm";

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
    body: "Progress is measured against your own baseline, not assumed from attendance.",
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
    title: "No wearable required",
    body: "Your phone's camera is the only sensor. Nothing to buy, charge or wear.",
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
    body: "All analysis happens on your phone. Camera footage is processed on-device and never uploaded — it never leaves your hands.",
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
    q: "Do I need any equipment?",
    a: "No. The test needs your phone and a sturdy chair. Training uses your bodyweight and things already in your home — a chair, a wall, a bottom stair. Every exercise has a no-equipment version.",
  },
  {
    q: "How long does the test take?",
    a: "About five minutes, guided by voice the whole way. You prop your phone against a wall, step back, and follow along. You'll need enough space to take a few steps and light good enough to read by.",
  },
  {
    q: "Is my camera footage private?",
    a: "Yes. All movement analysis runs on your phone. Camera footage is never uploaded, never stored and never seen by anyone — the camera works like a tape measure, not a video call.",
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
      <section id="hero" className="overflow-hidden bg-ink text-bone">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
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

          <div className="grid items-center gap-14 pb-20 pt-10 md:grid-cols-[1.05fr_0.95fr] md:pb-28 md:pt-16">
            <div>
              <h1 className="font-display text-[2.65rem] leading-[1.04] tracking-[-0.01em] md:text-[4rem]">
                Strength through menopause.{" "}
                <em className="italic text-brass">Measured.</em>
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-bone/75">
                Elegant measures your strength, balance and mobility with just your phone camera —
                then builds a four-week plan on your results and re-tests you monthly, so you can
                see it working.
              </p>
              <div className="mt-8">
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
              <p className="mt-8 flex items-center gap-2 text-sm text-bone/60">
                <LockIcon />
                All analysis happens on your phone — video never leaves it.
              </p>
            </div>
            <Reveal delay={100}>
              <PhoneMockup />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── The problem ───────────────────────────────────────────────── */}
      <section className="cv-auto bg-bone">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-12 md:gap-8 md:px-8 md:py-28">
          <Reveal className="md:col-span-5">
            <Eyebrow>The problem</Eyebrow>
            <h2 className="mt-5 font-display text-[2rem] leading-[1.12] md:text-[2.6rem]">
              Muscle loss speeds up in midlife. Most apps just press play.
            </h2>
          </Reveal>
          <Reveal delay={120} className="space-y-5 text-[17px] leading-relaxed text-ink/75 md:col-span-6 md:col-start-7 md:pt-12">
            <p>
              Through perimenopause and after it, falling oestrogen makes muscle harder to keep and
              harder to build. It's one of the most consistent physical changes of midlife — and
              one of the least talked about.
            </p>
            <p>
              The standard answer is a video library. Follow along, feel busy, hope it's doing
              something. But hope isn't a measurement. If your strength is changing — in either
              direction — you deserve to see it in numbers.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="cv-auto bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-5 font-display text-[2rem] leading-[1.12] md:text-[2.6rem]">
              Test. Train. Re-test.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              {
                n: "01",
                title: "Take the five-minute test",
                body: "Prop your phone against a wall and follow the voice guidance — sit-to-stands, balance holds, reach tests. The camera does the measuring. No wearable, no equipment, no gym.",
              },
              {
                n: "02",
                title: "See exactly where you stand",
                body: "Get a clear score for strength, balance and mobility, benchmarked for your age — and see which one needs your attention first.",
              },
              {
                n: "03",
                title: "Train, then prove it",
                body: "Follow a four-week plan built around your weakest area — short sessions at home. Then re-test, and watch the numbers move.",
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
      </section>

      {/* ── The differentiator ────────────────────────────────────────── */}
      <section className="cv-auto bg-ink text-bone">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <Reveal className="max-w-2xl">
            <Eyebrow dark>Why Elegant</Eyebrow>
            <h2 className="mt-5 font-display text-[2rem] leading-[1.12] md:text-[2.6rem]">
              The only menopause fitness app that measures whether it's working.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-bone/70">
              Fitness apps count what you did — sessions, streaks, minutes. Elegant measures what
              it changed. Every month you re-take the test, your scores update, and your plan
              adjusts to what your body actually did.
            </p>
          </Reveal>

          <div className="mt-14 grid items-center gap-12 md:grid-cols-2">
            <Reveal>
              <div className="rounded-3xl border border-bone/12 bg-[#212d27] p-6 sm:p-8">
                <div className="flex items-end justify-around gap-2">
                  {[
                    { v: 54, l: "Check-up 1" },
                    { v: 61, l: "Check-up 2" },
                    { v: 66, l: "Check-up 3" },
                  ].map((d, i) => (
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
                <p className="mt-6 text-center text-xs tracking-wide text-bone/50">
                  Strength score across three monthly check-ups · example data
                </p>
              </div>
            </Reveal>
            <div className="space-y-8">
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
                      <p className="mt-1 leading-relaxed text-bone/65">{f.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why strength training ─────────────────────────────────────── */}
      <section className="cv-auto bg-bone">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8 md:py-28">
          <Reveal>
            <p className="flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-pine/70">
              <span className="h-px w-8 bg-pine/40" aria-hidden="true" />
              Why strength training
              <span className="h-px w-8 bg-pine/40" aria-hidden="true" />
            </p>
            <h2 className="mt-6 font-display text-[1.9rem] leading-[1.2] md:text-[2.4rem]">
              Resistance training is the widely recommended first-line response to muscle loss
              during menopause.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink/70">
              Not because it's fashionable — because working muscle is how you keep it. You don't
              need a gym or a rack of dumbbells. You need progressive challenge, a routine that
              fits your week, and a way to know it's working. That last part is what Elegant was
              built for.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="cv-auto bg-paper">
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
                  <p className="pb-5 leading-relaxed text-ink/70">{faq.a}</p>
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
              See your strength <em className="italic text-[#d8b071]">in numbers.</em>
            </h2>
            <p className="mt-4 text-[17px] text-bone/75">
              Join the waitlist for early access to Elegant.
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
