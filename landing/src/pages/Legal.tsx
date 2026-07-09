import { CONTACT_EMAIL } from "../config";

/**
 * Formal draft copy for the ads test. Still owner-reviewed before public spend:
 * it intentionally avoids naming an unconfirmed legal entity or processor list.
 */

const PRIVACY = [
  {
    h: "Who we are",
    p: `This Privacy Policy explains how Elegant ("we", "us" and "our") handles information collected through this waitlist website. For privacy questions or requests, contact ${CONTACT_EMAIL}.`,
  },
  {
    h: "What we collect",
    p: "When you join the waitlist, we collect your email address, the date and time of submission, and campaign attribution fields that may be present in the page URL, such as UTM parameters or a Facebook click identifier.",
  },
  {
    h: "What this website does not collect",
    p: "This website does not create an account, collect payment details, request health records, or access your camera or microphone. Camera and microphone privacy statements on the marketing page describe the planned app experience, not anything collected by this waitlist page.",
  },
  {
    h: "How we use information",
    p: "We use your email address to send Elegant early-access, beta and launch updates. We use campaign attribution information to understand which ads and channels are working and to improve the landing page. We do not sell your personal information.",
  },
  {
    h: "Cookies and analytics",
    p: "We ask for consent before loading the Meta Pixel or setting advertising measurement cookies. If you accept, Meta may receive information such as your browser, device, page visit and conversion event so we can measure ads. If you decline, the pixel is not loaded and the site continues to work.",
  },
  {
    h: "Service providers",
    p: "We may use trusted service providers to host the website, store waitlist submissions, send emails and measure advertising performance. They may process information only as needed to provide those services to us.",
  },
  {
    h: "Retention",
    p: "We keep waitlist information while Elegant is in beta and for a reasonable period afterward so we can manage early-access invitations, launch updates, suppression requests and basic campaign records. You can ask us to delete your information at any time.",
  },
  {
    h: "Your rights",
    p: `Depending on where you live, you may have rights to access, correct, delete, object to or restrict use of your personal information. You can also unsubscribe from marketing emails at any time. To make a request, email ${CONTACT_EMAIL}.`,
  },
  {
    h: "Changes",
    p: "We may update this policy as the product, website, service providers or legal requirements change. The date on this page shows when the policy was last updated.",
  },
];

const TERMS = [
  {
    h: "About these terms",
    p: "These Terms of Use apply to this Elegant waitlist website. By using the website or joining the waitlist, you agree to these terms. If you do not agree, do not submit the form.",
  },
  {
    h: "The waitlist",
    p: "Joining the waitlist is free. It is not a purchase, a reservation, or a contract for a future product. Early-access invitations may be sent in waves, and we do not guarantee availability, launch timing, eligibility, pricing or feature access.",
  },
  {
    h: "Product status",
    p: "Elegant is pre-launch and may change before release. Any descriptions, images, examples, beta details or planned features on this website are provided for information and may be modified, delayed or discontinued.",
  },
  {
    h: "Not medical advice",
    p: "Elegant is intended as a general fitness and wellbeing product. It is not medical advice, medical care, a diagnosis, treatment, prevention, or a medical device. Speak with a qualified health professional before starting a new exercise programme, especially if you have pain, dizziness, a medical condition, or concerns about safe movement.",
  },
  {
    h: "No guarantees",
    p: "We aim to provide accurate, useful information, but this website is provided as is and as available. We do not promise that the website will always be available, error-free, secure, or that any future product will produce a particular result.",
  },
  {
    h: "Intellectual property",
    p: "The Elegant name, page design, copy, images, graphics, product concepts and other website content belong to us or our licensors. You may view the website for personal, non-commercial use, but you may not copy, reuse, scrape, modify or redistribute its content without permission.",
  },
  {
    h: "Acceptable use",
    p: "You agree not to misuse the website, interfere with its operation, attempt to access systems without permission, submit false or abusive information, or use the website in a way that violates applicable law.",
  },
  {
    h: "Limitation of liability",
    p: "To the fullest extent permitted by law, we are not liable for indirect, incidental, special, consequential or punitive damages arising from your use of this website or reliance on information on it.",
  },
  {
    h: "Changes to these terms",
    p: "We may update these terms as the website or product changes. The date on this page shows when the terms were last updated.",
  },
  {
    h: "Contact",
    p: `Questions about these terms can be sent to ${CONTACT_EMAIL}.`,
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
