import { useEffect, useState } from "react";
import { Landing } from "./pages/Landing";
import { ThankYou } from "./pages/ThankYou";
import { Legal } from "./pages/Legal";
import { ConsentBanner } from "./components/ConsentBanner";
import { StickyCta } from "./components/StickyCta";
import { captureUtm, getUtm } from "./lib/utm";
import { submitLead } from "./lib/leads";
import { loadPixel, trackLead } from "./lib/pixel";
import { CONTACT_EMAIL } from "./config";

type Route = "home" | "privacy" | "terms";
type Consent = "pending" | "accepted" | "declined";

const CONSENT_KEY = "elegant:consent";

function routeFromPath(path: string): Route {
  if (path.startsWith("/privacy")) return "privacy";
  if (path.startsWith("/terms")) return "terms";
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

function Footer({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <footer className="bg-ink text-bone">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <span className="font-display text-xl font-medium tracking-tight">
            Elegant<span className="text-brass">.</span>
          </span>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-bone/70">
            <button onClick={() => onNavigate("privacy")} className="hover:text-bone">
              Privacy
            </button>
            <button onClick={() => onNavigate("terms")} className="hover:text-bone">
              Terms
            </button>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-bone">
              {CONTACT_EMAIL}
            </a>
          </nav>
        </div>
        <p className="mt-8 max-w-2xl text-xs leading-relaxed text-bone/45">
          Elegant measures functional strength, balance and mobility. It is not medical advice and
          does not diagnose, treat or prevent any condition. Consult a qualified professional
          before starting a new exercise programme.
        </p>
        <p className="mt-3 text-xs text-bone/45">© 2026 Elegant</p>
      </div>
    </footer>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname));
  const [consent, setConsent] = useState<Consent>(readStoredConsent);
  const [lead, setLead] = useState<{ email: string } | null>(null);

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
      // Storage unavailable — the choice just won't persist across visits.
    }
    setConsent(choice);
  }

  function scrollToForm() {
    document.getElementById("waitlist")?.scrollIntoView();
    // Focus after the (CSS-smooth) scroll settles; preventScroll keeps them in sync.
    window.setTimeout(() => {
      document.getElementById("email-input")?.focus({ preventScroll: true });
    }, 650);
  }

  async function handleJoin(email: string) {
    await submitLead({
      kind: "lead",
      email,
      submittedAt: new Date().toISOString(),
      utm: getUtm(),
    });
    trackLead(); // no-op unless the visitor accepted the pixel
    setLead({ email });
    window.scrollTo(0, 0);
  }

  return (
    <>
      {route === "home" ? (
        lead ? (
          <ThankYou email={lead.email} />
        ) : (
          <Landing onJoin={handleJoin} onScrollToForm={scrollToForm} />
        )
      ) : (
        <Legal kind={route} onHome={() => navigate("home")} />
      )}
      <Footer onNavigate={navigate} />
      {route === "home" && !lead && (
        <StickyCta hidden={consent === "pending"} onClick={scrollToForm} />
      )}
      {consent === "pending" && <ConsentBanner onChoice={chooseConsent} />}
    </>
  );
}
