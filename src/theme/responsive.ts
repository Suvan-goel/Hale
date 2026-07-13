import * as React from 'react';
import { type TextStyle, useWindowDimensions } from 'react-native';

import { spacing } from './index';

const COMPACT_WIDTH = 375;
const SHORT_HEIGHT = 760;

export type ResponsiveLayout = {
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
  isCompactPhone: boolean;
};

export const compactTypography = {
  h2: { fontSize: 21, lineHeight: 28 },
  pageTitle: { fontSize: 26, lineHeight: 32 },
  cardTitle: { fontSize: 17, lineHeight: 23 },
} satisfies Partial<Record<string, TextStyle>>;

export function getResponsiveLayout(windowWidth: number, windowHeight: number): ResponsiveLayout {
  const isCompactWidth = windowWidth < COMPACT_WIDTH;
  const isShortHeight = windowHeight < SHORT_HEIGHT;
  const isCompactPhone = isCompactWidth || isShortHeight;
  const horizontalPadding = isCompactWidth ? 14 : spacing.pageHorizontal;
  const maxContentWidth = spacing.pageMaxWidth;
  const contentWidth = Math.max(0, Math.min(windowWidth, maxContentWidth) - horizontalPadding * 2);

  return {
    windowHeight,
    maxContentWidth,
    contentWidth,
    horizontalPadding,
    cardPadding: isCompactPhone ? 14 : 16,
    cardPaddingVertical: isCompactPhone ? 14 : 16,
    pageTop: spacing.pageTop,
    pageBottom: spacing.xxxl,
    screenGap: isCompactPhone ? spacing.md : spacing.lg,
    isCompactWidth,
    isCompactPhone,
  };
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  return React.useMemo(() => getResponsiveLayout(width, height), [height, width]);
}
