import { useEffect, useState } from "react";
import { Landing } from "./pages/Landing";
import { ThankYou } from "./pages/ThankYou";
import { Legal } from "./pages/Legal";
import { ConsentBanner } from "./components/ConsentBanner";
import { StickyCta } from "./components/StickyCta";
import { captureUtm, getUtm } from "./lib/utm";
import { submitLead } from "./lib/leads";
import { loadPixel, trackLead, isPixelLoaded } from "./lib/pixel";
import { CONTACT_EMAIL } from "./config";

type Route = "home" | "thanks" | "privacy" | "terms" | "delete-account";
type Consent = "pending" | "accepted" | "declined";

const CONSENT_KEY = "pearl:consent";
const LEAD_EMAIL_KEY = "pearl:lead-email";

function routeFromPath(path: string): Route {
  if (path.startsWith("/thanks")) return "thanks";
  if (path.startsWith("/privacy")) return "privacy";
  if (path.startsWith("/terms")) return "terms";
  if (path.startsWith("/delete-account")) return "delete-account";
  return "home";
}

function readStoredConsent(): Consent {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored === "accepted" || stored === "declined" ? stored : "pending";
  } catch {
    return "pending";
  }
}

function readLeadEmail(): string {
  try {
    return sessionStorage.getItem(LEAD_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function Footer({
  onNavigate,
  onCookiePreferences,
}: {
  onNavigate: (route: Route) => void;
  onCookiePreferences: () => void;
}) {
  return (
    <footer className="border-t border-line bg-elevated text-ink">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <span className="font-display text-xl font-medium tracking-tight">
            Pearl<span className="text-pine">.</span>
          </span>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-ink/65">
            <button onClick={() => onNavigate("privacy")} className="hover:text-pine">
              Privacy
            </button>
            <button onClick={() => onNavigate("terms")} className="hover:text-pine">
              Terms
            </button>
            <button onClick={() => onNavigate("delete-account")} className="hover:text-pine">
              Delete account
            </button>
            <button onClick={onCookiePreferences} className="hover:text-pine">
              Cookie preferences
            </button>
            {CONTACT_EMAIL ? (
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-pine hover:text-blush">
                {CONTACT_EMAIL}
              </a>
            ) : null}
          </nav>
        </div>
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-ink/65">
          Pearl measures functional strength and balance and can track optional Everyday Clarity
          check-ins. It is not medical advice and does not diagnose, treat or prevent any condition.
          Consult a qualified professional before starting a new exercise programme.
        </p>
        <p className="mt-3 text-xs text-ink/60">© 2026 Pearl</p>
      </div>
    </footer>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname));
  const [consent, setConsent] = useState<Consent>(readStoredConsent);

  useEffect(() => {
    captureUtm();
  }, []);

  useEffect(() => {
    if (consent === "accepted") loadPixel();
  }, [consent]);

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigate(next: Route) {
    window.history.pushState({}, "", next === "home" ? "/" : `/${next}`);
    setRoute(next);
    window.scrollTo(0, 0);
  }

  function chooseConsent(choice: "accepted" | "declined") {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // Storage unavailable - the choice just won't persist across visits.
    }
    setConsent(choice);
    // Declining after the pixel already loaded this page load: a reload is the
    // only way to actually unload it, and it honours the new choice on boot.
    if (choice === "declined" && isPixelLoaded()) window.location.reload();
  }

  function reopenConsent() {
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch {
      // Ignore: the banner below still reopens for this page load.
    }
    setConsent("pending");
  }

  function scrollToForm() {
    document.getElementById("waitlist")?.scrollIntoView();
    // Focus after the (CSS-smooth) scroll settles; preventScroll keeps them in sync.
    window.setTimeout(() => {
      document.getElementById("email-input")?.focus({ preventScroll: true });
    }, 650);
  }

  async function handleJoin(email: string, honeypot: string) {
    // A filled honeypot means a bot: show the normal success path but save
    // nothing and fire no conversion event.
    if (!honeypot) {
      await submitLead({
        kind: "lead",
        email,
        submittedAt: new Date().toISOString(),
        utm: getUtm(),
      });
      trackLead(); // no-op unless the visitor accepted the pixel
    }
    try {
      sessionStorage.setItem(LEAD_EMAIL_KEY, email);
    } catch {
      // Storage unavailable - the thank-you page just shows generic copy.
    }
    navigate("thanks");
  }

  return (
    <>
      {route === "home" ? (
        <Landing onJoin={handleJoin} onScrollToForm={scrollToForm} />
      ) : route === "thanks" ? (
        <ThankYou email={readLeadEmail()} />
      ) : (
        <Legal kind={route} onHome={() => navigate("home")} />
      )}
      <Footer onNavigate={navigate} onCookiePreferences={reopenConsent} />
      {route === "home" && <StickyCta hidden={consent === "pending"} onClick={scrollToForm} />}
      {consent === "pending" && (
        <ConsentBanner onChoice={chooseConsent} onPrivacy={() => navigate("privacy")} />
      )}
    </>
  );
}
