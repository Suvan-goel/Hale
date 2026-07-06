import { ScoreDial } from "./ScoreDial";

/**
 * Code-built phone mockup of the app's results screen — the hero visual.
 * Example data; the story it tells: overall 68, strength is the weak area.
 */

function CategoryBar({ name, value, focus }: { name: string; value: number; focus?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
          {name}
          {focus && (
            <span className="rounded-full bg-[#f0e4cd] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#77572a]">
              Focus area
            </span>
          )}
        </span>
        <span className="text-[13px] font-semibold tabular-nums text-ink">{value}</span>
      </div>
      <div className={`mt-1.5 h-1.5 w-full rounded-full ${focus ? "bg-[#eadfc9]" : "bg-[#dde3da]"}`}>
        <div
          className={`h-full rounded-full ${focus ? "bg-brass" : "bg-pine"}`}
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
            stroke="rgba(243,239,231,0.08)"
            strokeWidth="0.8"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="66.6 100"
          />
        </g>
      </svg>
      <div className="relative rounded-[44px] border-[9px] border-[#0d1310] bg-paper shadow-[0_44px_90px_-28px_rgba(5,10,8,0.75)]">
        <div className="absolute left-1/2 top-2.5 h-[17px] w-[84px] -translate-x-1/2 rounded-full bg-[#0d1310]" />
        <div className="px-5 pb-5 pt-11">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/45">
            Strength profile
          </p>
          <div className="mt-0.5 flex items-baseline justify-between">
            <h3 className="text-[17px] font-semibold text-ink">June check-up</h3>
            <span className="text-[11px] font-medium text-ink/45">Test 3</span>
          </div>
          <div className="mt-3 flex justify-center">
            <ScoreDial value={68} label="Overall score" size={164} delta="+7 since May" />
          </div>
          <div className="mt-4 space-y-3.5 border-t border-line pt-4">
            <CategoryBar name="Strength" value={61} focus />
            <CategoryBar name="Balance" value={74} />
            <CategoryBar name="Mobility" value={69} />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-bone px-4 py-3">
            <span className="text-[11px] font-medium text-ink/60">Next check-up</span>
            <span className="text-[11px] font-semibold text-ink">4 weeks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
