/**
 * Home / landing screen — the calm entry point to a Movement Check-Up.
 *
 * Product laws on display: evidence and routine, not gamification (law 5) —
 * no streaks, badges, or scores here. If a previous check-up exists we surface
 * its date and a way back into those results (the longitudinal payload), which
 * also doubles as visible proof that history survived a restart.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StoredCheckUp } from '../history';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function HomeScreen({
  lastCheckUp,
  checkUpCount,
  onBegin,
  onViewLast,
}: {
  lastCheckUp: StoredCheckUp | null;
  checkUpCount: number;
  onBegin: () => void;
  onViewLast: () => void;
}) {
  const lastDate = lastCheckUp ? formatDate(lastCheckUp.checkUp.startedAt) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Movement Check-Up</Text>
        <Text style={styles.tagline}>
          A few guided movements measure how your body is moving — strength, balance, and
          mobility — using only the camera.
        </Text>
      </View>

      <View style={styles.body}>
        {lastDate ? (
          <Pressable style={styles.lastCard} onPress={onViewLast}>
            <Text style={styles.lastLabel}>Last check-up</Text>
            <Text style={styles.lastDate}>{lastDate}</Text>
            <Text style={styles.lastLink}>
              See your results{checkUpCount >= 2 ? ' and trends' : ''} →
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.firstHint}>
            Find a quiet space with a chair and room to stand. The whole thing takes about ten
            minutes, and it talks you through every step.
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={onBegin}>
          <Text style={styles.buttonText}>Begin Check-Up</Text>
        </Pressable>
        <Text style={styles.footnote}>
          Prop your phone up where it can see you, then step back — you won&apos;t need to touch
          the screen again.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 28, paddingVertical: 64, justifyContent: 'space-between' },
  header: { marginTop: 24 },
  brand: { color: '#E8F4EA', fontSize: 30, fontWeight: '300' },
  tagline: { color: '#9DB8A4', fontSize: 16, lineHeight: 24, marginTop: 14 },
  body: { flex: 1, justifyContent: 'center' },
  lastCard: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#0E1A12',
    borderWidth: 1,
    borderColor: '#2C4233',
  },
  lastLabel: { color: '#6F8A77', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  lastDate: { color: '#E8F4EA', fontSize: 20, fontWeight: '400', marginTop: 4 },
  lastLink: { color: '#7FC8A0', fontSize: 15, marginTop: 12 },
  firstHint: { color: '#6F8A77', fontSize: 15, lineHeight: 22 },
  footer: {},
  button: {
    backgroundColor: '#1A2B1E',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C4233',
  },
  buttonText: { color: '#E8F4EA', fontSize: 18, fontWeight: '500' },
  footnote: { color: '#5A6F61', fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: 'center' },
});
