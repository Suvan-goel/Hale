import { CONTACT_EMAIL } from "../config";

/**
 * Formal website/app draft. It still requires owner/legal review before public
 * release, including the final controller identity and jurisdiction wording.
 */

const PRIVACY = [
  {
    h: "Who we are",
    p: `This Privacy Policy explains how Pearl ("we", "us" and "our") handles information collected through the Pearl website and optional mobile-app accounts. For privacy questions or requests, contact ${CONTACT_EMAIL}.`,
  },
  {
    h: "What we collect",
    p: "When you join the waitlist, we collect your email address, submission time, and campaign attribution fields that may be present in the page URL. If you create an optional app account, we store your email and private non-health profile: name, date of birth, reference group, selected movement-goal category, trainer voice, and published-comparison preference.",
  },
  {
    h: "What stays on your device",
    p: "Pearl does not upload menopause or symptom context, safety answers, programme state, workouts, check-ups, Everyday Clarity, camera video, pose landmarks, or voice commands. Camera video is not shown or saved. The website does not access your camera or app data.",
  },
  {
    h: "How we use information",
    p: "We use waitlist email addresses for early-access, beta and launch updates. We use optional account information to authenticate you and make your non-health profile available when you sign in on your devices. Campaign attribution helps us understand which channels are working. We do not sell your personal information.",
  },
  {
    h: "Cookies and analytics",
    p: "We ask for consent before loading the Meta Pixel or setting advertising measurement cookies. If you accept, Meta may receive information such as your browser, device, page visit and conversion event so we can measure ads. If you decline, the pixel is not loaded and the site continues to work.",
  },
  {
    h: "Service providers",
    p: "We use trusted providers to host the website, store waitlist submissions, send emails and measure advertising performance. Optional app accounts and private online profiles are processed through Supabase. Providers may process information only as needed to provide their services to us.",
  },
  {
    h: "Retention",
    p: "We keep waitlist information while Pearl is in beta and for a reasonable period afterward so we can manage invitations, launch updates, suppression requests and basic campaign records. Account information is kept while the account is active and removed when you use Delete online account in the app, subject to limited records we must retain by law.",
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
    p: "These Terms of Use apply to this Pearl waitlist website. By using the website or joining the waitlist, you agree to these terms. If you do not agree, do not submit the form.",
  },
  {
    h: "The waitlist",
    p: "Joining the waitlist is free. It is not a purchase, a reservation, or a contract for a future product. Early-access invitations may be sent in waves, and we do not guarantee availability, launch timing, eligibility, pricing or feature access.",
  },
  {
    h: "Optional app accounts",
    p: "Pearl can be used without an account. If you create one, you are responsible for keeping your sign-in details secure and for information submitted through your account. You may sign out, clear a device copy, or permanently delete the online account from Settings.",
  },
  {
    h: "Product status",
    p: "Pearl is pre-launch and may change before release. Any descriptions, images, examples, beta details or planned features on this website are provided for information and may be modified, delayed or discontinued.",
  },
  {
    h: "Not medical advice",
    p: "Pearl is intended as a fitness and wellbeing product for women navigating perimenopause and early postmenopause. It is not medical advice, medical care, a diagnosis, treatment, prevention, or a medical device. Speak with a qualified health professional before starting a new exercise programme, especially if you have pain, dizziness, a medical condition, or concerns about safe movement.",
  },
  {
    h: "No guarantees",
    p: "We aim to provide accurate, useful information, but this website is provided as is and as available. We do not promise that the website will always be available, error-free, secure, or that any future product will produce a particular result.",
  },
  {
    h: "Intellectual property",
    p: "The Pearl name, page design, copy, images, graphics, product concepts and other website content belong to us or our licensors. You may view the website for personal, non-commercial use, but you may not copy, reuse, scrape, modify or redistribute its content without permission.",
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

const DELETE_ACCOUNT = [
  {
    h: "Delete in the app",
    p: "Open Pearl, go to Settings, choose Online profile, then choose Delete online account. Confirming permanently deletes the Supabase account and private online profile and clears that account's Pearl data from the device.",
  },
  {
    h: "If you cannot sign in",
    p: `Email ${CONTACT_EMAIL} from the address used for the account and ask for account deletion. We may need to verify that you control the account before deleting it. Never send a password, access token, health answer, check-up, or camera data.`,
  },
  {
    h: "What is deleted",
    p: "Deletion covers the account identity and private online profile held through Supabase. Pearl's health context, programme, workouts, check-ups, Everyday Clarity, camera data, and landmarks are not stored in the online profile; device copies can be cleared separately in Settings.",
  },
];

export function Legal({ kind, onHome }: { kind: "privacy" | "terms" | "delete-account"; onHome: () => void }) {
  const sections = kind === "privacy" ? PRIVACY : kind === "terms" ? TERMS : DELETE_ACCOUNT;
  const title = kind === "privacy" ? "Privacy policy" : kind === "terms" ? "Terms of use" : "Delete your Pearl account";
  return (
    <main className="bg-bone">
      <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <button
          onClick={onHome}
          className="text-sm font-medium text-pine underline underline-offset-4 hover:text-ink"
        >
          ← Back to Pearl
        </button>
        <h1 className="mt-8 font-display text-[2.2rem] leading-tight md:text-[2.8rem]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-ink/50">Last updated 12 July 2026</p>
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
