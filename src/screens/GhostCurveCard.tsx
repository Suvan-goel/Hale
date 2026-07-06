import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

import type { GhostCurveViewModel } from '../haleFlow';
import { Card } from '../components/ui';
import { colors, fonts, spacing, type } from '../theme';

/**
 * Ghost curve (REPOSITION_TDD §2.4): her strength trajectory against a
 * typical-decline SHADED BAND — never a false-precision line. One entity
 * (her check-ups), one axis (% of her own baseline), baseline-relative only.
 * The band is recessive; her readings are the emphasis. Conservative decline
 * anchor, cited in-app. No legend-by-color-alone: the band is a filled region,
 * her data a line+dots, and both are named in the inline key.
 */

const WIDTH = 320;
const HEIGHT = 168;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 12;

export function GhostCurveCard({ viewModel }: { viewModel: GhostCurveViewModel }) {
  if (viewModel.status !== 'ready') return null;

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxMonths = Math.max(...viewModel.points.map((point) => point.monthsElapsed), 1);

  // One axis: percent-of-baseline. Fix the visible range so the band and her
  // line share a stable, honest frame (baseline 100 near the top).
  const yMin = Math.min(
    88,
    ...viewModel.band.map((b) => b.lowPercent),
    ...viewModel.points.map((p) => p.percentOfBaseline)
  );
  const yMax = Math.max(
    104,
    ...viewModel.points.map((p) => p.percentOfBaseline)
  );

  const x = (months: number) => PAD_LEFT + (months / maxMonths) * plotW;
  const y = (percent: number) => PAD_TOP + (1 - (percent - yMin) / (yMax - yMin)) * plotH;

  const bandPolygon = [
    ...viewModel.band.map((b) => `${x(b.monthsElapsed)},${y(b.highPercent)}`),
    ...[...viewModel.band].reverse().map((b) => `${x(b.monthsElapsed)},${y(b.lowPercent)}`),
  ].join(' ');

  const herLine = viewModel.points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.monthsElapsed)} ${y(point.percentOfBaseline)}`)
    .join(' ');

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{viewModel.title}</Text>
      <Text style={styles.body}>{viewModel.body}</Text>

      <View style={styles.key}>
        <View style={styles.keyItem}>
          <View style={styles.keyBand} />
          <Text style={styles.keyText}>Typical without training</Text>
        </View>
        <View style={styles.keyItem}>
          <View style={styles.keyLine} />
          <Text style={styles.keyText}>Your check-ups</Text>
        </View>
      </View>

      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {/* Recessive typical-decline region — a band, not a line. Low-opacity
            wash of the accent hue; her solid line reads as the emphasis. */}
        <Polygon points={bandPolygon} fill={colors.accent} fillOpacity={0.12} />
        {/* Her trajectory: the emphasis. Thin 2px line + markers. */}
        <Path d={herLine} stroke={colors.accent} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {viewModel.points.map((point) => (
          <Circle
            key={point.atIso}
            cx={x(point.monthsElapsed)}
            cy={y(point.percentOfBaseline)}
            r={4.5}
            fill={colors.accent}
            stroke={colors.surface}
            strokeWidth={2}
          />
        ))}
      </Svg>

      <Text style={styles.attribution}>{viewModel.attribution}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  title: {
    ...type.cardTitle,
  },
  body: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  key: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  keyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  keyBand: {
    width: 18,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.accent,
    opacity: 0.12,
  },
  keyLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accent,
  },
  keyText: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  attribution: {
    ...type.caption,
    color: colors.textTertiary,
  },
});
