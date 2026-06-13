/**
 * Results screen: three domain ages with one-sentence interpretations, the
 * weakest-domain focus callout, per-test detail rows, and (once ≥2 check-ups
 * exist) trend bars — rise velocity and one-leg balance especially.
 *
 * Wellness-side language only (product law 4): "typical of age X–Y", never a
 * diagnosis. Domain ages lead; there is no composite score.
 */

import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CheckUp } from '../checkup/types';
import { StoredCheckUp, computeTrends, MetricTrend } from '../history';
import { CheckUpScore, DOMAIN_LABEL, DomainResult, scoreCheckUp } from '../scoring';

export function ResultsScreen({
  checkUp,
  history,
  onDone,
}: {
  checkUp: CheckUp;
  history: StoredCheckUp[];
  onDone: () => void;
}) {
  const score: CheckUpScore = React.useMemo(() => scoreCheckUp(checkUp), [checkUp]);
  const trends = React.useMemo(() => computeTrends(history).filter((t) => t.points.length >= 2), [history]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Your Movement Check-Up</Text>
        <Text style={styles.subtitle}>How your body is moving today</Text>

        {score.weakestDomain ? (
          <View style={styles.focus}>
            <Text style={styles.focusLabel}>Where to focus</Text>
            <Text style={styles.focusValue}>{DOMAIN_LABEL[score.weakestDomain]}</Text>
            <Text style={styles.focusBody}>
              This area looks like the best place to put your training next.
            </Text>
          </View>
        ) : null}

        {score.domains.map((d) => (
          <DomainCard key={d.domain} domain={d} isFocus={d.domain === score.weakestDomain} />
        ))}

        {trends.length > 0 ? (
          <View style={styles.trends}>
            <Text style={styles.sectionTitle}>Your trend</Text>
            <Text style={styles.subtitle}>Across {history.length} check-ups</Text>
            {trends.map((t) => (
              <TrendRow key={t.key} trend={t} />
            ))}
          </View>
        ) : (
          <Text style={styles.trendHint}>
            Come back for another check-up to start seeing your trends over time.
          </Text>
        )}

        <Pressable style={styles.button} onPress={onDone}>
          <Text style={styles.buttonText}>Done</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function DomainCard({ domain, isFocus }: { domain: DomainResult; isFocus: boolean }) {
  return (
    <View style={[styles.card, isFocus && styles.cardFocus]}>
      <View style={styles.cardHead}>
        <Text style={styles.cardLabel}>{domain.label}</Text>
        {isFocus ? <Text style={styles.badge}>Focus</Text> : null}
      </View>
      {domain.measured ? (
        <Text style={styles.age}>
          Typical of age {domain.ageLow}–{domain.ageHigh}
          {domain.estimated ? ' (estimate)' : ''}
        </Text>
      ) : (
        <Text style={styles.ageMuted}>Not measured this time</Text>
      )}
      <Text style={styles.interp}>{domain.interpretation}</Text>
      <View style={styles.rows}>
        {domain.rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={[styles.rowValue, !r.measured && styles.rowValueMuted]}>{r.display}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TrendRow({ trend }: { trend: MetricTrend }) {
  const values = trend.points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const delta = trend.delta ?? 0;
  const improved = trend.betterIsHigher ? delta > 0 : delta < 0;
  const flat = Math.abs(delta) < 1e-9;
  const arrow = flat ? '→' : improved ? '▲' : '▼';
  const color = flat ? '#9DB8A4' : improved ? '#7FC8A0' : '#D8A657';
  const sign = delta > 0 ? '+' : '';

  return (
    <View style={styles.trendRow}>
      <View style={styles.trendHeader}>
        <Text style={styles.trendLabel}>{trend.label}</Text>
        <Text style={[styles.trendDelta, { color }]}>
          {arrow} {sign}
          {formatDelta(delta)} {trend.unit}
        </Text>
      </View>
      <View style={styles.spark}>
        {trend.points.map((p, i) => (
          <View
            key={i}
            style={[
              styles.sparkBar,
              {
                height: 6 + ((p.value - min) / span) * 32,
                backgroundColor: i === trend.points.length - 1 ? color : '#2C4233',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function formatDelta(delta: number): string {
  const abs = Math.abs(delta);
  return abs >= 10 ? abs.toFixed(0) : abs.toFixed(2);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 20, paddingTop: 64, paddingBottom: 48 },
  title: { color: '#E8F4EA', fontSize: 26, fontWeight: '400' },
  subtitle: { color: '#6F8A77', fontSize: 14, marginTop: 2 },
  sectionTitle: { color: '#E8F4EA', fontSize: 20, fontWeight: '400' },
  focus: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#13251A',
    borderWidth: 1,
    borderColor: '#2C4233',
  },
  focusLabel: { color: '#7FC8A0', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  focusValue: { color: '#E8F4EA', fontSize: 22, fontWeight: '500', marginTop: 4 },
  focusBody: { color: '#9DB8A4', fontSize: 15, lineHeight: 21, marginTop: 6 },
  card: { marginTop: 16, padding: 16, borderRadius: 14, backgroundColor: '#0E1A12' },
  cardFocus: { borderWidth: 1, borderColor: '#2C4233' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: '#E8F4EA', fontSize: 18, fontWeight: '500' },
  badge: {
    color: '#0E1A12',
    backgroundColor: '#7FC8A0',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  age: { color: '#CFE6D5', fontSize: 16, marginTop: 8 },
  ageMuted: { color: '#6F8A77', fontSize: 16, marginTop: 8, fontStyle: 'italic' },
  interp: { color: '#9DB8A4', fontSize: 15, lineHeight: 21, marginTop: 6 },
  rows: { marginTop: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1C2A20',
  },
  rowLabel: { color: '#9DB8A4', fontSize: 14 },
  rowValue: { color: '#E8F4EA', fontSize: 14, fontVariant: ['tabular-nums'] },
  rowValueMuted: { color: '#5A6F61' },
  trends: { marginTop: 28 },
  trendHint: { color: '#6F8A77', fontSize: 14, lineHeight: 20, marginTop: 28 },
  trendRow: { marginTop: 16 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  trendLabel: { color: '#CFE6D5', fontSize: 15 },
  trendDelta: { fontSize: 14, fontVariant: ['tabular-nums'] },
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 8, height: 40 },
  sparkBar: { flex: 1, borderRadius: 3 },
  button: {
    marginTop: 36,
    backgroundColor: '#1A2B1E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#E8F4EA', fontSize: 17, fontWeight: '500' },
});
