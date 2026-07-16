/**
 * Clean navigation icons — compact rounded SVG glyphs kept crisp at bottom-tab
 * sizes and intentionally closer to professional system icons than illustration.
 */

import * as React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color: string;
  strokeWidth?: number;
}

function Frame({ size = 26, children }: { size?: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

const common = (color: string, strokeWidth: number) => ({
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

export function HomeIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Path d="M4 11.5 L12 5 L20 11.5 V19.5 H4 Z" {...s} />
      <Path d="M9.5 19.5 V14 H14.5 V19.5" {...s} />
    </Frame>
  );
}

export function ProgressIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Path d="M5 18.2 H19.5" {...s} />
      <Path d="M6 15.9 L10.2 11.7 L13.6 13.7 L18.7 7.4" {...s} />
      <Path d="M16.2 7.4 H18.7 V9.9" {...s} />
      <Circle cx={10.2} cy={11.7} r={1.05} fill={color} stroke="none" />
      <Circle cx={13.6} cy={13.7} r={1.05} fill={color} stroke="none" />
    </Frame>
  );
}

export function PlanIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Rect x={5} y={4.5} width={14} height={15} rx={3} {...s} />
      <Path d="M8.2 9.2 L9.4 10.4 L11.4 7.9" {...s} />
      <Path d="M13.2 9.2 H16" {...s} />
      <Circle cx={9.4} cy={14.6} r={1.2} {...s} />
      <Path d="M13.2 14.6 H16" {...s} />
    </Frame>
  );
}

/**
 * Gear glyph for Settings. The hamburger MenuIcon read as "menu, contents
 * unknown" for low-tech-confidence users; a gear is the learned convention.
 */
export function SettingsIcon({ size, color, strokeWidth = 1.7 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Circle cx={12} cy={12} r={3.1} {...s} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        {...s}
      />
    </Frame>
  );
}

/** Three quiet horizontal strokes: the reference's menu treatment. */
export function MenuIcon({ size, color, strokeWidth = 1.7 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Path d="M5 7 H19" {...s} />
      <Path d="M5 12 H19" {...s} />
      <Path d="M5 17 H19" {...s} />
    </Frame>
  );
}
