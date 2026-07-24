import { useState } from "react";

import homeScreen from "../assets/landing/app-home.png";
import planScreen from "../assets/landing/app-plan.png";
import progressScreen from "../assets/landing/app-progress.png";

const APP_SCREENS = [
  {
    id: "home",
    label: "Home",
    src: homeScreen,
    alt: "The real Pearl Home screen showing a balance-focused session from a sample journey.",
  },
  {
    id: "plan",
    label: "Plan",
    src: planScreen,
    alt: "The real Pearl Plan screen showing the completed Foundations, Build and Progress phases from a sample journey.",
  },
  {
    id: "progress",
    label: "Progress",
    src: progressScreen,
    alt: "The real Pearl Progress screen showing four comparable Strength and Balance check-ups from a sample journey.",
  },
] as const;

type AppScreenId = (typeof APP_SCREENS)[number]["id"];

/**
 * Real captures from the current Pearl iOS app, populated through the app's
 * developer-only sample journey. The web page adds only the device frame and
 * screen picker; none of the app UI shown here is recreated in HTML.
 */
export function PhoneMockup() {
  const [activeId, setActiveId] = useState<AppScreenId>("progress");
  const activeScreen = APP_SCREENS.find((screen) => screen.id === activeId) ?? APP_SCREENS[2];

  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="absolute -left-16 -top-14 h-[420px] w-[420px] max-w-none"
      >
        <g transform="rotate(150 50 50)">
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="rgba(124,64,93,0.10)"
            strokeWidth="0.8"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="66.6 100"
          />
        </g>
      </svg>

      <div className="relative overflow-hidden rounded-[44px] border-[9px] border-[#211D1F] bg-paper shadow-[0_34px_74px_-28px_rgba(56,39,28,0.38)]">
        <img
          key={activeScreen.id}
          src={activeScreen.src}
          alt={activeScreen.alt}
          className="block aspect-[440/956] w-full object-contain"
          loading="lazy"
        />
      </div>

      <div
        className="relative mt-5 flex items-center justify-center gap-2"
        role="group"
        aria-label="Choose a Pearl app screen"
      >
        {APP_SCREENS.map((screen) => {
          const selected = screen.id === activeScreen.id;
          return (
            <button
              key={screen.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setActiveId(screen.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? "border-pine bg-pine text-white"
                  : "border-pine/20 bg-paper/80 text-ink/65 hover:border-pine/45 hover:text-ink"
              }`}
            >
              {screen.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
