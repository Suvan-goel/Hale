import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  PrimaryButton,
  Screen,
  SectionHeader,
  SettingsIconButton,
  StatusBadge,
} from '../components/ui';
import type { EquipmentProfile } from '../training';
import { colors, radius, spacing, type } from '../theme';

const EXTRA_SESSIONS = [
  '10-Minute Mobility Reset',
  'Gentle Restart Session',
  'Steady Balance Practice',
  'No-Equipment Strength',
  'Band Upper-Back',
  'Stairs Confidence',
  'Quick Full-Body Hale Session',
] as const;

const LADDERS = [
  'Sit-to-Stand',
  'Squat',
  'Step-Up',
  'Heel & Toe Raises',
  'Push',
  'Pull / Upper Back',
  'Balance',
  'Lateral Stability',
  'Hinge & Glutes',
  'Shoulder Reach & Press',
  'Mobility',
] as const;

const LEARN = [
  'Why chair-rise strength matters',
  'Why balance improves with practice',
  'How to set up your camera',
  'How to choose a resistance band',
  'What to do if a movement feels uncomfortable',
  'Why re-testing monthly matters',
] as const;

export function ExploreScreen({
  equipment,
  onOpenSettings,
}: {
  equipment: EquipmentProfile;
  onOpenSettings: () => void;
}) {
  const [selected, setSelected] = React.useState<string | null>(null);
  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>
            Extra practice and learning live here. Today remains the place to press Start.
          </Text>
        </View>
        <SettingsIconButton onPress={onOpenSettings} />
      </View>

      <Card>
        <SectionHeader title="Extra Sessions" />
        <Text style={styles.sectionBody}>Optional support for days when you want a clean slate or a focused reset.</Text>
        <View style={styles.grid}>
          {EXTRA_SESSIONS.map((title) => (
            <ExploreCard
              key={title}
              title={title}
              body={extraSessionBody(title)}
              selected={selected === title}
              onPress={() => setSelected(title)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Movement Ladders" />
        <Text style={styles.sectionBody}>See how exercises progress from supported starts to stronger variations.</Text>
        <View style={styles.grid}>
          {LADDERS.map((title) => (
            <ExploreCard
              key={title}
              title={title}
              body="Simple progressions for your 4-week block"
              selected={selected === title}
              onPress={() => setSelected(title)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader title="Learn" />
        <View style={styles.list}>
          {LEARN.map((title) => (
            <ExploreCard
              key={title}
              title={title}
              body="Short read"
              selected={selected === title}
              onPress={() => setSelected(title)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.equipmentHead}>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Equipment setup</Text>
            <Text style={styles.sectionBody}>
              Hale can use {equipmentSummary(equipment)} today, and keeps chair, wall, floor, and cushion options available.
            </Text>
          </View>
          <StatusBadge label="On device" tone="gold" />
        </View>
        <View style={styles.actionWrap}>
          <PrimaryButton title="Open equipment settings" onPress={onOpenSettings} />
        </View>
      </Card>

      {selected ? <Text style={styles.note}>{selected} is selected for preview.</Text> : null}
    </Screen>
  );
}

function ExploreCard({
  title,
  body,
  selected,
  onPress,
}: {
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.exploreCard, selected && styles.exploreCardSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
    >
      <Text style={styles.exploreTitle}>{title}</Text>
      <Text style={styles.exploreBody}>{body}</Text>
    </Pressable>
  );
}

function extraSessionBody(title: string): string {
  if (title.includes('No-Equipment')) return 'Uses zero-equipment substitutions';
  if (title.includes('Band')) return 'Uses a resistance band when available';
  if (title.includes('Stairs')) return 'Uses a bottom stair when available';
  return 'Optional support outside the main block';
}

function equipmentSummary(equipment: EquipmentProfile): string {
  const items = [
    equipment.stair ? 'a bottom stair' : null,
    equipment.band ? 'a resistance band' : null,
    equipment.miniBand ? 'a mini band' : null,
    equipment.load ? 'a backpack or light load' : null,
  ].filter(Boolean);
  if (items.length === 0) return 'zero-equipment choices';
  if (items.length === 1) return items[0] ?? 'zero-equipment choices';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: { flex: 1 },
  title: { ...type.display },
  subtitle: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm },
  sectionBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  list: { gap: spacing.md, marginTop: spacing.lg },
  exploreCard: {
    minHeight: 96,
    minWidth: 136,
    flexGrow: 1,
    flexBasis: '45%',
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    justifyContent: 'center',
  },
  exploreCardSelected: { backgroundColor: colors.bgSage, borderColor: colors.sage },
  exploreTitle: { ...type.h3 },
  exploreBody: { ...type.caption, marginTop: spacing.xs },
  equipmentHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { ...type.h2 },
  actionWrap: { marginTop: spacing.lg },
  note: { ...type.caption, color: colors.sageDeep, textAlign: 'center' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
