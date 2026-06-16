/**
 * Outline tab icons — single-line, rounded, consistent stroke, echoing the
 * elegance of the logo (Step 6 of the design system). Drawn with react-native-svg
 * (already a dependency); stroke takes a theme colour, fill stays none.
 */

import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

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

export function LearnIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Path
        d="M12 6.5 C10 5, 6.5 5, 4.5 5.8 V18 C6.5 17.2, 10 17.2, 12 18.7 C14 17.2, 17.5 17.2, 19.5 18 V5.8 C17.5 5, 14 5, 12 6.5 Z"
        {...s}
      />
      <Path d="M12 6.5 V18.7" {...s} />
    </Frame>
  );
}

export function FamilyIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Circle cx={9} cy={8.5} r={3} {...s} />
      <Path d="M3.5 19.5 C3.5 15.9, 6 14.2, 9 14.2 C12 14.2, 14.5 15.9, 14.5 19.5" {...s} />
      <Circle cx={17} cy={9.5} r={2.2} {...s} />
      <Path d="M15.5 14.6 C18.2 14.3, 20.5 15.8, 20.5 19.5" {...s} />
    </Frame>
  );
}

export function SettingsIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Path d="M4 7.5 H20" {...s} />
      <Path d="M4 12 H20" {...s} />
      <Path d="M4 16.5 H20" {...s} />
      <Circle cx={9} cy={7.5} r={2} {...s} fill="none" />
      <Circle cx={15} cy={12} r={2} {...s} />
      <Circle cx={8} cy={16.5} r={2} {...s} />
    </Frame>
  );
}
