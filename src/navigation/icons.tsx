/**
 * Clean navigation icons — compact rounded SVG glyphs kept crisp at bottom-tab
 * sizes and intentionally closer to professional system icons than illustration.
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
      <Rect x={5} y={5.5} width={14} height={13.5} rx={3} {...s} />
      <Path d="M5.2 9.7 H18.8" {...s} />
      <Path d="M8.6 4.2 V7" {...s} />
      <Path d="M15.4 4.2 V7" {...s} />
      <Circle cx={12} cy={14.2} r={1.45} fill={color} stroke="none" />
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

export function CalendarIcon(props: IconProps) {
  return <TodayIcon {...props} />;
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
      <Path d="M9.2 14.8 L11.1 10.7 L14.8 9.2 L12.9 13.3 Z" {...s} />
      <Circle cx={12} cy={12} r={0.9} fill={color} stroke="none" />
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
