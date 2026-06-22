import * as React from 'react';
import { useWindowDimensions } from 'react-native';

import { spacing } from './index';

const COMPACT_WIDTH = 380;
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
  pageTop: number;
  pageBottom: number;
  screenGap: number;
  isCompactWidth: boolean;
  isShortHeight: boolean;
  isCompactPhone: boolean;
  progressHeroHeight: number;
  planHeroHeight: number;
};

export function getResponsiveLayout(windowWidth: number, windowHeight: number): ResponsiveLayout {
  const isCompactWidth = windowWidth < COMPACT_WIDTH;
  const isShortHeight = windowHeight < SHORT_HEIGHT;
  const isCompactPhone = isCompactWidth || isShortHeight;
  const horizontalPadding = isCompactWidth ? spacing.lg : spacing.pageHorizontal;
  const maxContentWidth = spacing.pageMaxWidth;
  const containerWidth = Math.min(windowWidth, maxContentWidth);
  const contentWidth = Math.max(0, containerWidth - horizontalPadding * 2);

  return {
    windowWidth,
    windowHeight,
    maxContentWidth,
    contentWidth,
    horizontalPadding,
    cardPadding: isCompactWidth ? spacing.lg : 18,
    pageTop: spacing.pageTop,
    pageBottom: spacing.xxxl,
    screenGap: isCompactPhone ? spacing.lg : spacing.xl,
    isCompactWidth,
    isShortHeight,
    isCompactPhone,
    progressHeroHeight: clamp(Math.round(contentWidth * (isCompactPhone ? 1.08 : 0.98)), 372, isCompactPhone ? 390 : 396),
    planHeroHeight: clamp(Math.round(contentWidth / 1.32), 258, isCompactPhone ? 292 : 322),
  };
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  return React.useMemo(() => getResponsiveLayout(width, height), [height, width]);
}
