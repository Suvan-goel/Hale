import { useState, type FormEvent } from "react";
import { CONTACT_EMAIL } from "../config";
import { submitLead } from "../lib/leads";
import { getUtm } from "../lib/utm";

/**
 * Post-submit state: confirmation, one optional micro-survey question, and
 * the founding-chat invite. The Pixel `Lead` event is fired by App at the
 * moment of successful submit.
 */
export function ThankYou({ email }: { email: string }) {
  const [answer, setAnswer] = useState("");
  const [surveyState, setSurveyState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function sendSurvey(e: FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    setSurveyState("sending");
    try {
      await submitLead({
        kind: "survey",
        email,
        answer: answer.trim(),
        submittedAt: new Date().toISOString(),
        utm: getUtm(),
      });
      setSurveyState("sent");
    } catch {
      setSurveyState("error");
    }
  }

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Founding member chat",
  )}&body=${encodeURIComponent(
    "Hi — I just joined the Elegant waitlist and I'd be up for a 20-minute chat.\n\nA couple of times that suit me:\n\n",
  )}`;

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
            We'll email <span className="font-semibold text-ink">{email}</span> when early access
            opens.
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-line bg-paper p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine/70">
            One question, while you're here
          </p>
          <h2 className="mt-3 font-display text-[1.4rem] leading-snug">
            What's your biggest frustration with staying strong right now?
          </h2>
          {surveyState === "sent" ? (
            <p className="mt-4 font-medium text-pine">Thank you — that genuinely helps.</p>
          ) : (
            <form onSubmit={sendSurvey} className="mt-4">
              <label htmlFor="survey-answer" className="sr-only">
                Your answer
              </label>
              <textarea
                id="survey-answer"
                rows={3}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Totally optional — a sentence is plenty."
                className="w-full rounded-2xl border border-line bg-bone px-4 py-3 text-[15px] leading-relaxed placeholder:text-ink/40"
              />
              {surveyState === "error" && (
                <p role="alert" className="mt-2 text-sm text-[#8a3b2e]">
                  That didn't send — please try again.
                </p>
              )}
              <button
                type="submit"
                disabled={surveyState === "sending" || !answer.trim()}
                className="mt-3 rounded-full bg-pine px-6 py-2.5 text-sm font-semibold text-bone transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {surveyState === "sending" ? "Sending…" : "Send answer"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 rounded-3xl bg-ink p-6 text-bone md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bone/50">
            Fancy shaping Elegant?
          </p>
          <h2 className="mt-3 font-display text-[1.4rem] leading-snug">
            A 20-minute chat for lifetime founding access.
          </h2>
          <p className="mt-3 leading-relaxed text-bone/70">
            We're holding short calls with a handful of early members to shape what we build.
            Join one and you'll get founding access for life.
          </p>
          <a
            href={mailto}
            className="mt-5 inline-block rounded-full bg-bone px-6 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
          >
            Book a 20-minute chat
          </a>
        </div>
      </div>
    </main>
  );
}
