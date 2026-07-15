import { ScoreDial } from "./ScoreDial";

/**
 * Code-built phone mockup of the app's results screen — the hero visual.
 * Example data; Strength and Balance guide the plan, while optional Everyday
 * Clarity is presented separately rather than folded into a composite score.
 */

function CategoryBar({ name, value, focus }: { name: string; value: number; focus?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
          {name}
          {focus && (
            <span className="rounded-full bg-[rgba(142,49,88,0.10)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-blush">
              Focus area
            </span>
          )}
        </span>
        <span className="text-[13px] font-semibold tabular-nums text-ink">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-elevated">
        <div
          className={`h-full rounded-full ${focus ? "bg-pine" : "bg-sage"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      {/* Echo of the dial arc behind the phone */}
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
      <div className="relative rounded-[44px] border-[9px] border-[#211D1F] bg-paper shadow-[0_34px_74px_-28px_rgba(56,39,28,0.38)]">
        <div className="absolute left-1/2 top-2.5 h-[17px] w-[84px] -translate-x-1/2 rounded-full bg-[#211D1F]" />
        <div className="px-5 pb-5 pt-11">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/45">
            Strength + Balance
          </p>
          <div className="mt-0.5 flex items-baseline justify-between">
            <h3 className="text-[17px] font-semibold text-ink">Week 8 check-up</h3>
            <span className="text-[11px] font-medium text-ink/45">3 of 4</span>
          </div>
          <div className="mt-3 -mb-4 flex justify-center">
            <ScoreDial value={68} label="Strength focus" size={164} delta="+7 since May" />
          </div>
          <div className="mt-4 space-y-3.5 border-t border-line pt-4">
            <CategoryBar name="Strength" value={68} focus />
            <CategoryBar name="Balance" value={74} />
          </div>
          <div className="mt-4 rounded-2xl border border-line bg-elevated px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium text-ink/60">Everyday Clarity</span>
              <span className="text-[11px] font-semibold text-ink">Check-in saved</span>
            </div>
            <p className="mt-1 text-[9px] leading-relaxed text-ink/45">Tracked separately from your plan</p>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-elevated px-4 py-3">
            <span className="text-[11px] font-medium text-ink/60">Next check-up</span>
            <span className="text-[11px] font-semibold text-ink">4 weeks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
