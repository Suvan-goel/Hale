/**
 * The signature element: a 240° score dial. Pearl burgundy carries the value;
 * the track is a lighter step of the same hue; the numeral wears the shared
 * neutral text tokens, never the data colour.
 */

const SWEEP = 240; // degrees
const R = 42; // viewBox units
const FRAC = SWEEP / 360;

interface ScoreDialProps {
  value: number; // 0–100
  label: string;
  /** Rendered size in px. */
  size?: number;
  tone?: "light" | "dark";
  /** Colour of the surface behind the dial — used as the tip dot's ring. */
  surface?: string;
  /** Optional small line under the label, e.g. "+7 since May". */
  delta?: string;
}

export function ScoreDial({
  value,
  label,
  size = 180,
  tone = "light",
  surface = "#fffdfc",
  delta,
}: ScoreDialProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const track = tone === "light" ? "rgba(142,49,88,0.12)" : "rgba(255,255,255,0.18)";
  const fill = "#7c405d";
  // Dash starts at 150° (bottom-left) and sweeps clockwise; gap centred at the bottom.
  const tipAngle = ((150 + SWEEP * (clamped / 100)) * Math.PI) / 180;
  const tipX = 50 + R * Math.cos(tipAngle);
  const tipY = 50 + R * Math.sin(tipAngle);
  const stroke = 7;

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clamped} out of 100${delta ? `, ${delta}` : ""}`}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <g transform="rotate(150 50 50)">
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={track}
            strokeWidth={stroke}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${FRAC * 100} 100`}
          />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={fill}
            strokeWidth={stroke}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${FRAC * clamped} 100`}
          />
        </g>
        {clamped > 0 && (
          <circle cx={tipX} cy={tipY} r={5.2} fill={fill} stroke={surface} strokeWidth={2} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span
          className={`font-body font-semibold leading-none ${tone === "light" ? "text-ink" : "text-bone"}`}
          style={{ fontSize: size * 0.27 }}
        >
          {clamped}
        </span>
        <span
          className={`mt-1.5 text-[10px] font-medium uppercase tracking-[0.16em] ${
            tone === "light" ? "text-ink/55" : "text-bone/55"
          }`}
        >
          {label}
        </span>
        {delta && (
          <span
            className={`mt-1 text-[11px] font-semibold ${tone === "light" ? "text-pine" : "text-bone/80"}`}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
