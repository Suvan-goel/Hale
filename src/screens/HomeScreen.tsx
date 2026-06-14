/**
 * Home / landing screen — the calm entry point. When no plan is active it leads
 * to a Movement Check-Up; once a block has been assigned it surfaces "This week"
 * (the next session, one tap to start) and, when the block is finished, a gentle
 * "time to re-test" prompt that closes the loop. A small equipment profile lets
 * the user say whether they have a step or a band (everything else is assumed),
 * which drives the substitutions in their sessions.
 *
 * Product laws on display: evidence and routine, not gamification (law 5) — no
 * streaks, badges, or scores; just the next sensible action.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StoredCheckUp } from '../history';
import { EquipmentProfile } from '../training';

export interface ActivePlan {
  week: number;
  sessionNumber: number;
  totalSessions: number;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function HomeScreen({
  lastCheckUp,
  checkUpCount,
  plan,
  retestDue,
  equipment,
  onBegin,
  onViewLast,
  onStartSession,
  onMicroCheck,
  onToggleEquipment,
}: {
  lastCheckUp: StoredCheckUp | null;
  checkUpCount: number;
  /** The next session of an active block, or null (no block / block finished). */
  plan: ActivePlan | null;
  retestDue: boolean;
  equipment: EquipmentProfile;
  onBegin: () => void;
  onViewLast: () => void;
  onStartSession: () => void;
  onMicroCheck: () => void;
  onToggleEquipment: (key: keyof EquipmentProfile) => void;
}) {
  const lastDate = lastCheckUp ? formatDate(lastCheckUp.checkUp.startedAt) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>{plan ? 'Your Training' : 'Movement Check-Up'}</Text>
        <Text style={styles.tagline}>
          {plan
            ? 'Voice-guided sessions targeting where your last check-up said to focus.'
            : 'A few guided movements measure how your body is moving — strength, balance, and mobility — using only the camera.'}
        </Text>
      </View>

      <View style={styles.body}>
        {retestDue ? (
          <View style={styles.retestCard}>
            <Text style={styles.focusLabel}>Block complete</Text>
            <Text style={styles.lastDate}>Time to re-test</Text>
            <Text style={styles.focusBody}>
              You finished your four-week block — a new check-up will show how far you&apos;ve come.
            </Text>
          </View>
        ) : plan ? (
          <Pressable style={styles.planCard} onPress={onStartSession}>
            <Text style={styles.focusLabel}>This week · Week {plan.week}</Text>
            <Text style={styles.lastDate}>
              Session {plan.sessionNumber} of {plan.totalSessions}
            </Text>
            <Text style={styles.lastLink}>Start today&apos;s session →</Text>
          </Pressable>
        ) : lastDate ? (
          <Pressable style={styles.lastCard} onPress={onViewLast}>
            <Text style={styles.lastLabel}>Last check-up</Text>
            <Text style={styles.lastDate}>{lastDate}</Text>
            <Text style={styles.lastLink}>See your results{checkUpCount >= 2 ? ' and trends' : ''} →</Text>
          </Pressable>
        ) : (
          <Text style={styles.firstHint}>
            Find a quiet space with a chair and room to stand. The whole thing takes about ten
            minutes, and it talks you through every step.
          </Text>
        )}

        {plan ? (
          <Pressable style={styles.secondaryRow} onPress={onMicroCheck}>
            <Text style={styles.secondaryText}>Quick 60-second check-in →</Text>
          </Pressable>
        ) : null}

        <View style={styles.equipRow}>
          <Text style={styles.equipLabel}>I have:</Text>
          <EquipToggle label="a step" on={equipment.stair} onPress={() => onToggleEquipment('stair')} />
          <EquipToggle label="a band" on={equipment.band} onPress={() => onToggleEquipment('band')} />
        </View>
      </View>

      <View style={styles.footer}>
        {plan && !retestDue ? (
          <>
            <Pressable style={styles.button} onPress={onStartSession}>
              <Text style={styles.buttonText}>Start Session</Text>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={onBegin}>
              <Text style={styles.ghostText}>New check-up instead</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.button} onPress={onBegin}>
            <Text style={styles.buttonText}>Begin Check-Up</Text>
          </Pressable>
        )}
        <Text style={styles.footnote}>
          Prop your phone up where it can see you, then step back — you won&apos;t need to touch
          the screen again.
        </Text>
      </View>
    </View>
  );
}

function EquipToggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.equipChip, on && styles.equipChipOn]} onPress={onPress}>
      <Text style={[styles.equipChipText, on && styles.equipChipTextOn]}>
        {on ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 28, paddingVertical: 64, justifyContent: 'space-between' },
  header: { marginTop: 24 },
  brand: { color: '#E8F4EA', fontSize: 30, fontWeight: '300' },
  tagline: { color: '#9DB8A4', fontSize: 16, lineHeight: 24, marginTop: 14 },
  body: { flex: 1, justifyContent: 'center' },
  lastCard: { padding: 18, borderRadius: 14, backgroundColor: '#0E1A12', borderWidth: 1, borderColor: '#2C4233' },
  planCard: { padding: 18, borderRadius: 14, backgroundColor: '#13251A', borderWidth: 1, borderColor: '#2C4233' },
  retestCard: { padding: 18, borderRadius: 14, backgroundColor: '#13251A', borderWidth: 1, borderColor: '#2C4233' },
  lastLabel: { color: '#6F8A77', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  focusLabel: { color: '#7FC8A0', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  lastDate: { color: '#E8F4EA', fontSize: 20, fontWeight: '400', marginTop: 4 },
  lastLink: { color: '#7FC8A0', fontSize: 15, marginTop: 12 },
  focusBody: { color: '#9DB8A4', fontSize: 15, lineHeight: 21, marginTop: 6 },
  firstHint: { color: '#6F8A77', fontSize: 15, lineHeight: 22 },
  secondaryRow: { marginTop: 16, alignItems: 'center' },
  secondaryText: { color: '#7FC8A0', fontSize: 14 },
  equipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, gap: 8 },
  equipLabel: { color: '#5A6F61', fontSize: 13 },
  equipChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#0E1A12', borderWidth: 1, borderColor: '#2C4233' },
  equipChipOn: { backgroundColor: '#1A2B1E', borderColor: '#7FC8A0' },
  equipChipText: { color: '#9DB8A4', fontSize: 13 },
  equipChipTextOn: { color: '#E8F4EA' },
  footer: {},
  button: { backgroundColor: '#1A2B1E', paddingVertical: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2C4233' },
  buttonText: { color: '#E8F4EA', fontSize: 18, fontWeight: '500' },
  ghostButton: { paddingVertical: 12, alignItems: 'center' },
  ghostText: { color: '#6F8A77', fontSize: 14 },
  footnote: { color: '#5A6F61', fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: 'center' },
});
