import { useEffect, useState } from "react";

/**
 * Mobile-only bottom CTA bar. Appears after the hero scrolls out, hides while
 * the real form is on screen so it never covers it.
 */
export function StickyCta({ hidden, onClick }: { hidden: boolean; onClick: () => void }) {
  const [pastHero, setPastHero] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const hero = document.getElementById("hero");
    const form = document.getElementById("waitlist");
    const observers: IntersectionObserver[] = [];
    if (hero) {
      const io = new IntersectionObserver(([entry]) =>
        setPastHero(!entry.isIntersecting && entry.boundingClientRect.bottom < 0),
      );
      io.observe(hero);
      observers.push(io);
    }
    if (form) {
      const io = new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting), {
        threshold: 0.1,
      });
      io.observe(form);
      observers.push(io);
    }
    return () => observers.forEach((io) => io.disconnect());
  }, []);

  const show = pastHero && !formVisible && !hidden;

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "pointer-events-none translate-y-[120%]"
      }`}
    >
      <button
        onClick={onClick}
        tabIndex={show ? 0 : -1}
        className="h-13 w-full rounded-2xl bg-pine text-[15px] font-semibold text-white shadow-[0_12px_36px_rgba(124,64,93,0.28)]"
      >
        Join the waitlist
      </button>
    </div>
  );
}
