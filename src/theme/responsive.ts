import * as React from 'react';
import { type TextStyle, useWindowDimensions } from 'react-native';

import { spacing } from './index';

const COMPACT_WIDTH = 375;
const SHORT_HEIGHT = 760;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type ResponsiveLayout = {
  windowWidth: number;
  windowHeight: number;
  maxContentWidth: number;
  contentWidth: number;
  horizontalPadding: number;
  cardPadding: number;
  cardPaddingVertical: number;
  pageTop: number;
  pageBottom: number;
  screenGap: number;
  isCompactWidth: boolean;
  isShortHeight: boolean;
  isCompactPhone: boolean;
  todayHeroHeight: number;
  progressHeroHeight: number;
  planHeroHeight: number;
  exploreHeroHeight: number;
};

export const compactTypography = {
  display: { fontSize: 34, lineHeight: 40 },
  h1: { fontSize: 28, lineHeight: 34 },
  h2: { fontSize: 21, lineHeight: 28 },
  pageTitle: { fontSize: 26, lineHeight: 32 },
  cardTitle: { fontSize: 17, lineHeight: 23 },
  metric: { fontSize: 76, lineHeight: 86 },
  metricMedium: { fontSize: 44, lineHeight: 52 },
  metricSmall: { fontSize: 26, lineHeight: 34 },
} satisfies Partial<Record<string, TextStyle>>;

export function getResponsiveLayout(windowWidth: number, windowHeight: number): ResponsiveLayout {
  const isCompactWidth = windowWidth < COMPACT_WIDTH;
  const isShortHeight = windowHeight < SHORT_HEIGHT;
  const isCompactPhone = isCompactWidth || isShortHeight;
  const horizontalPadding = isCompactWidth ? 14 : spacing.pageHorizontal;
  const maxContentWidth = spacing.pageMaxWidth;
  const containerWidth = Math.min(windowWidth, maxContentWidth);
  const contentWidth = Math.max(0, containerWidth - horizontalPadding * 2);

  return {
    windowWidth,
    windowHeight,
    maxContentWidth,
    contentWidth,
    horizontalPadding,
    cardPadding: isCompactPhone ? 14 : 18,
    cardPaddingVertical: isCompactPhone ? 16 : 18,
    pageTop: spacing.pageTop,
    pageBottom: spacing.xxxl,
    screenGap: isCompactPhone ? spacing.lg : spacing.xl,
    isCompactWidth,
    isShortHeight,
    isCompactPhone,
    todayHeroHeight: clamp(Math.round(contentWidth / 1.3), isCompactPhone ? 236 : 252, isCompactPhone ? 266 : 286),
    progressHeroHeight: clamp(Math.round(contentWidth * (isCompactPhone ? 0.92 : 0.9)), isCompactPhone ? 312 : 330, isCompactPhone ? 348 : 364),
    planHeroHeight: clamp(Math.round(contentWidth / 1.3), isCompactPhone ? 236 : 252, isCompactPhone ? 266 : 286),
    exploreHeroHeight: clamp(Math.round(contentWidth / 1.3), isCompactPhone ? 236 : 252, isCompactPhone ? 266 : 286),
  };
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  return React.useMemo(() => getResponsiveLayout(width, height), [height, width]);
}
