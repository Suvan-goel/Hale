import { CONTACT_EMAIL } from "../config";

/**
 * Placeholder legal copy for the ads test — have it reviewed and replaced
 * before any real launch (see README).
 */

const PRIVACY = [
  {
    h: "What we collect",
    p: "When you join the waitlist we store your email address, the time you joined, the campaign tags on the link you arrived from (UTM parameters), and — only if you choose to answer it — your response to one optional survey question.",
  },
  {
    h: "How we use it",
    p: "We use your email to tell you about Elegant's early access and launch. We use campaign tags to understand which of our ads work. We don't sell your data, and we don't share it except with the service providers that store it for us.",
  },
  {
    h: "Cookies and analytics",
    p: "We ask before setting any measurement cookie. If you accept, we load the Meta Pixel to measure our advertising; if you decline, no pixel is loaded and the site works exactly the same.",
  },
  {
    h: "Your rights",
    p: `You can ask us to show you, correct, or delete anything we hold about you at any time — email ${CONTACT_EMAIL} and we'll act on it promptly.`,
  },
];

const TERMS = [
  {
    h: "The waitlist",
    p: "Joining the waitlist is free and isn't a purchase or a contract for the future product. Early-access invitations go out in waves and we can't guarantee timing. Founding-member pricing will be offered to waitlist members when paid plans open.",
  },
  {
    h: "Not medical advice",
    p: "Elegant measures functional strength, balance and mobility. It does not diagnose, treat, or prevent any medical condition, and nothing on this site is medical advice. Consult a qualified professional before starting a new exercise programme.",
  },
  {
    h: "This site",
    p: "The content on this page is provided as-is while Elegant is pre-launch, and may change. All content and branding are ours; please don't reuse them without permission.",
  },
  {
    h: "Contact",
    p: `Questions about these terms: ${CONTACT_EMAIL}.`,
  },
];

export function Legal({ kind, onHome }: { kind: "privacy" | "terms"; onHome: () => void }) {
  const sections = kind === "privacy" ? PRIVACY : TERMS;
  return (
    <main className="bg-bone">
      <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <button
          onClick={onHome}
          className="text-sm font-medium text-pine underline underline-offset-4 hover:text-ink"
        >
          ← Back to Elegant
        </button>
        <h1 className="mt-8 font-display text-[2.2rem] leading-tight md:text-[2.8rem]">
          {kind === "privacy" ? "Privacy policy" : "Terms of use"}
        </h1>
        <p className="mt-2 text-sm text-ink/50">Last updated 6 July 2026</p>
        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold">{s.h}</h2>
              <p className="mt-2 leading-relaxed text-ink/70">{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
