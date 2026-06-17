import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ActivityLevel,
  LOCAL_USER_ID,
  MovementSafetyProfile,
} from '../adherence';
import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, ToggleRow } from '../components/ui';
import { UserProfile } from '../profile';
import { colors, radius, spacing, type } from '../theme';

const AGE_OPTIONS = [
  { label: 'Under 45', value: 44 },
  { label: '45-54', value: 50 },
  { label: '55-64', value: 60 },
  { label: '65-74', value: 70 },
  { label: '75+', value: 76 },
] as const;

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'very_inactive', label: 'Mostly inactive' },
  { value: 'lightly_active', label: 'Lightly active' },
  { value: 'moderately_active', label: 'Active most weeks' },
  { value: 'very_active', label: 'Very active' },
];

const PAIN_OPTIONS = ['Knee', 'Hip', 'Back', 'Shoulder', 'Ankle', 'Neck', 'None'] as const;

export function SafetyProfileScreen({
  profile,
  onSave,
  onCancel,
}: {
  profile: UserProfile;
  onSave: (safetyProfile: MovementSafetyProfile, age: number | null) => void;
  onCancel: () => void;
}) {
  const initial = profile.safetyProfile;
  const initialAge = initial?.age ?? profile.age;
  const [age, setAge] = React.useState<number | null>(initialAge ?? 60);
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel>(initial?.activityLevel ?? 'lightly_active');
  const [painArea, setPainArea] = React.useState<string>(initial?.painNotes ?? 'None');
  const [supportNearby, setSupportNearby] = React.useState(initial?.feelsSafeBalancing !== false);

  const save = () => {
    const nowIso = new Date().toISOString();
    onSave(
      {
        id: initial?.id ?? `safety-profile-${nowIso.replace(/[:.]/g, '-')}`,
        userId: initial?.userId ?? LOCAL_USER_ID,
        age: age ?? undefined,
        activityLevel,
        hasCurrentPain: painArea !== 'None',
        painNotes: painArea !== 'None' ? painArea.toLowerCase() : undefined,
        hasRecentInjury: initial?.hasRecentInjury,
        injuryNotes: initial?.injuryNotes,
        feelsSafeStandingFromChair: true,
        feelsSafeBalancing: supportNearby,
        availableEquipment: initial?.availableEquipment.length ? initial.availableEquipment : ['chair', 'wall'],
        preferredWorkoutDays: initial?.preferredWorkoutDays ?? ['Mon', 'Wed', 'Fri'],
        createdAt: initial?.createdAt ?? nowIso,
        updatedAt: nowIso,
      },
      age
    );
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Step 3 of 10"
        title="A few safety details"
        subtitle="Hale uses this to choose gentler starts and support when you need it."
      />

      <Card style={styles.card}>
        <Text style={styles.title}>Age range</Text>
        <View style={styles.grid}>
          {AGE_OPTIONS.map((option) => (
            <Choice
              key={option.label}
              label={option.label}
              selected={age === option.value}
              onPress={() => setAge(option.value)}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Current activity level</Text>
        <View style={styles.grid}>
          {ACTIVITY_OPTIONS.map((option) => (
            <Choice
              key={option.value}
              label={option.label}
              selected={activityLevel === option.value}
              onPress={() => setActivityLevel(option.value)}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Any area that often bothers you?</Text>
        <View style={styles.grid}>
          {PAIN_OPTIONS.map((option) => (
            <Choice
              key={option}
              label={option}
              selected={painArea === option}
              onPress={() => setPainArea(option)}
            />
          ))}
        </View>
        <ToggleRow
          label="I prefer support nearby when balancing"
          value={supportNearby}
          onValueChange={setSupportNearby}
        />
        <Text style={styles.gentle}>Hale is not medical care. Move only in a comfortable range.</Text>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Continue" onPress={save} />
        <SecondaryButton title="Back" onPress={onCancel} />
      </View>
    </Screen>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  title: { ...type.h2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  choiceSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  choiceText: { ...type.caption, color: colors.textSecondary },
  choiceTextSelected: { color: colors.accentDeep },
  gentle: { ...type.bodySmall, color: colors.textSecondary },
  actions: { gap: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
