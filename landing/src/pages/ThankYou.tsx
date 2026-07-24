import { CONTACT_EMAIL } from "../config";

/**
 * Post-submit page, served at /thanks so conversions have a real URL. The
 * Pixel `Lead` event is fired by App at the moment of successful submit, not
 * here - a direct visit to /thanks records nothing.
 */
export function ThankYou({ email }: { email: string }) {
  return (
    <main className="bg-bone">
      <div className="mx-auto max-w-xl px-5 py-20 md:py-28">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4.5 12.5l5 5 10-11"
                stroke="#f3efe7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="mt-6 font-display text-[2.4rem] leading-[1.08] md:text-[3rem]">
            You're on the list.
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-ink/70">
            {email ? (
              <>
                We'll email <span className="font-semibold text-ink">{email}</span> when early
                access opens.
              </>
            ) : (
              <>We'll email you when early access opens.</>
            )}
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-line bg-paper p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine/70">
            What happens next
          </p>
          <h2 className="mt-3 font-display text-[1.4rem] leading-snug">
            Early access opens in waves.
          </h2>
          <p className="mt-2 leading-relaxed text-ink/65">
            We will use your email only for Pearl early-access and launch updates. No spam, no
            public profile, and no account has been created.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink/55">
            Questions? Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-pine underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
