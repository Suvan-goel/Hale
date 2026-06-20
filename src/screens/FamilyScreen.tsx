/**
 * Family tab — local mock data only. The design is supportive and private in
 * tone: no rankings, no streaks, no pressure.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Screen, ScreenHeader, StatusBadge } from '../components/ui';
import { FAMILY_MEMBERS, FamilyMember, MemberStatus, STATUS_LABEL } from '../family/fixture';
import { colors, radius, spacing, type } from '../theme';

const STATUS_TONE: Record<MemberStatus, 'good' | 'attention' | 'neutral'> = {
  'on-track': 'good',
  'retest-due': 'attention',
  resting: 'neutral',
};

export function FamilyScreen() {
  return (
    <Screen>
      <ScreenHeader
        title="Family"
        subtitle="A gentle preview of shared progress for the people you care about."
      />

      <Card style={styles.overview}>
        <Text style={styles.overviewTitle}>Support circle</Text>
        <Text style={styles.overviewBody}>
          This prototype uses sample data on this device only. Real sharing will be opt-in and private.
        </Text>
      </Card>

      <View style={styles.list}>
        {FAMILY_MEMBERS.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </View>
    </Screen>
  );
}

function MemberCard({ member }: { member: FamilyMember }) {
  const initial = member.name.slice(0, 1).toUpperCase();
  return (
    <Card style={styles.card}>
      <View style={styles.memberHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.relation}>{member.relation}</Text>
        </View>
        <StatusBadge label={STATUS_LABEL[member.status]} tone={STATUS_TONE[member.status]} />
      </View>

      <View style={styles.statRow}>
        <Stat label="Sample estimate" value={member.movementAge === null ? '—' : `${member.movementAge}`} />
        <Stat label="Sessions / wk" value={`${member.weeklySessions}`} />
        <Stat label="Active" value={member.lastActive} />
      </View>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overview: { backgroundColor: colors.bgElevated },
  overviewTitle: { ...type.cardTitle },
  overviewBody: { ...type.cardBody, marginTop: spacing.sm },
  list: { gap: spacing.lg },
  card: { gap: spacing.lg },
  memberHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...type.h2, color: colors.accentDeep },
  identity: { flex: 1 },
  name: { ...type.cardRowTitle },
  relation: { ...type.caption, marginTop: 2 },
  statRow: {
    flexDirection: 'row',
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    gap: spacing.lg,
  },
  stat: { flex: 1 },
  statValue: { ...type.cardRowTitle, fontVariant: ['tabular-nums'] },
  statLabel: { ...type.cardCaption, marginTop: 2 },
});
