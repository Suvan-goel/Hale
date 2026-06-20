/**
 * Outline tab icons — single-line, rounded, consistent stroke, echoing the
 * elegance of the logo (Step 6 of the design system). Drawn with react-native-svg
 * (already a dependency); stroke takes a theme colour, fill stays none.
 */

import * as React from 'react';
import { Image } from 'react-native';
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

const settingsCogIcon = require('../../assets/icons/settings-cog.png');

export function HomeIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Path d="M4 11.5 L12 5 L20 11.5 V19.5 H4 Z" {...s} />
      <Path d="M9.5 19.5 V14 H14.5 V19.5" {...s} />
    </Frame>
  );
}

export function TodayIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Rect x={5} y={5.5} width={14} height={14} rx={2.4} {...s} />
      <Path d="M5 9 H19" {...s} />
      <Path d="M8 4 V7" {...s} />
      <Path d="M16 4 V7" {...s} />
      <Path d="M8.4 12.5 H9.8" {...s} />
      <Path d="M11.3 12.5 H12.7" {...s} />
      <Path d="M14.2 12.5 H15.6" {...s} />
      <Path d="M8.4 15.8 H9.8" {...s} />
      <Path d="M11.3 15.8 H12.7" {...s} />
    </Frame>
  );
}

export function PlanIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Rect x={6} y={5.2} width={12} height={15} rx={2.2} {...s} />
      <Path d="M9.3 5.2 C9.4 3.9, 10.4 3.2, 12 3.2 C13.6 3.2, 14.6 3.9, 14.7 5.2" {...s} />
      <Path d="M9 9.2 H15" {...s} />
      <Path d="M9 12.4 H15" {...s} />
      <Path d="M9 15.6 H13.4" {...s} />
    </Frame>
  );
}

export function ProgressIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Path d="M5 19 V12" {...s} />
      <Path d="M10 19 V7" {...s} />
      <Path d="M15 19 V10" {...s} />
      <Path d="M20 19 V4.5" {...s} />
      <Path d="M4 19 H21" {...s} />
    </Frame>
  );
}

export function CalendarIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  return <TodayIcon size={size} color={color} strokeWidth={strokeWidth} />;
}

export function BellIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Path d="M7.4 10.7 C7.4 7.5, 9.2 5.6, 12 5.6 C14.8 5.6, 16.6 7.5, 16.6 10.7 V14.3 L18.4 17 H5.6 L7.4 14.3 Z" {...s} />
      <Path d="M10.1 18.5 C10.5 19.5, 11.1 20, 12 20 C12.9 20, 13.5 19.5, 13.9 18.5" {...s} />
      <Path d="M12 3.8 V5.3" {...s} />
    </Frame>
  );
}

export function ExploreIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Circle cx={12} cy={12} r={7.4} {...s} />
      <Path d="M9.6 14.4 L11.1 10.8 L14.4 9.6 L12.9 13.2 Z" {...s} />
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

export function ProfileIcon({ size, color, strokeWidth = 1.8 }: IconProps) {
  const s = common(color, strokeWidth);
  return (
    <Frame size={size}>
      <Circle cx={12} cy={8.4} r={3.4} {...s} />
      <Path d="M5.6 19.4 C5.6 15.5, 8.5 13.7, 12 13.7 C15.5 13.7, 18.4 15.5, 18.4 19.4" {...s} />
    </Frame>
  );
}

export function SettingsIcon({ size = 26, color }: IconProps) {
  return (
    <Image
      source={settingsCogIcon}
      style={{ width: size, height: size, tintColor: color }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
