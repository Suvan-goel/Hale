import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  ActivityLevel,
  AvailableEquipment,
  LOCAL_USER_ID,
  MovementSafetyProfile,
} from '../adherence';
import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge, ToggleRow } from '../components/ui';
import { UserProfile } from '../profile';
import { colors, radius, spacing, type } from '../theme';

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'very_inactive', label: 'Mostly seated' },
  { value: 'lightly_active', label: 'Lightly active' },
  { value: 'moderately_active', label: 'Moderately active' },
  { value: 'very_active', label: 'Very active' },
];

const EQUIPMENT_OPTIONS: { value: AvailableEquipment; label: string }[] = [
  { value: 'chair', label: 'Chair' },
  { value: 'wall', label: 'Wall' },
  { value: 'stairs', label: 'Bottom stair' },
  { value: 'resistance_band', label: 'Resistance band' },
  { value: 'backpack', label: 'Backpack' },
  { value: 'none', label: 'None beyond basics' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  const [ageText, setAgeText] = React.useState(String(initial?.age ?? profile.age ?? ''));
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel | undefined>(initial?.activityLevel);
  const [hasCurrentPain, setHasCurrentPain] = React.useState(!!initial?.hasCurrentPain);
  const [painNotes, setPainNotes] = React.useState(initial?.painNotes ?? '');
  const [hasRecentInjury, setHasRecentInjury] = React.useState(!!initial?.hasRecentInjury);
  const [injuryNotes, setInjuryNotes] = React.useState(initial?.injuryNotes ?? '');
  const [safeChair, setSafeChair] = React.useState(initial?.feelsSafeStandingFromChair ?? true);
  const [safeBalance, setSafeBalance] = React.useState(initial?.feelsSafeBalancing ?? true);
  const [equipment, setEquipment] = React.useState<AvailableEquipment[]>(
    initial?.availableEquipment.length ? initial.availableEquipment : ['chair', 'wall']
  );
  const [days, setDays] = React.useState<string[]>(initial?.preferredWorkoutDays ?? ['Mon', 'Wed', 'Fri']);

  const warning = !safeChair || !safeBalance || hasCurrentPain || hasRecentInjury;

  const save = () => {
    const parsed = parseInt(ageText, 10);
    const age = Number.isFinite(parsed) && parsed > 0 && parsed < 120 ? parsed : null;
    const nowIso = new Date().toISOString();
    onSave(
      {
        id: initial?.id ?? `safety-profile-${nowIso.replace(/[:.]/g, '-')}`,
        userId: initial?.userId ?? LOCAL_USER_ID,
        age: age ?? undefined,
        activityLevel,
        hasCurrentPain,
        painNotes: painNotes.trim() || undefined,
        hasRecentInjury,
        injuryNotes: injuryNotes.trim() || undefined,
        feelsSafeStandingFromChair: safeChair,
        feelsSafeBalancing: safeBalance,
        availableEquipment: equipment.length > 0 ? equipment : ['none'],
        preferredWorkoutDays: days,
        createdAt: initial?.createdAt ?? nowIso,
        updatedAt: nowIso,
      },
      age
    );
  };

  return (
    <Screen>
      <ScreenHeader
        title="Set your starting point"
        subtitle="Keep this short. Hale uses it to choose gentler starts, supports, and equipment substitutions."
      />

      <Card style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title}>Basics</Text>
          <StatusBadge label="On device" tone="gold" />
        </View>
        <Field label="Age">
          <TextInput
            style={styles.input}
            value={ageText}
            onChangeText={setAgeText}
            placeholder="Your age"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            accessibilityLabel="Age"
          />
        </Field>
        <Text style={styles.label}>Current activity</Text>
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
        <Text style={styles.title}>Comfort and support</Text>
        <ToggleRow label="I have current pain or discomfort" value={hasCurrentPain} onValueChange={setHasCurrentPain} />
        {hasCurrentPain ? (
          <TextInput
            style={[styles.input, styles.multiline]}
            value={painNotes}
            onChangeText={setPainNotes}
            placeholder="Optional notes"
            placeholderTextColor={colors.textTertiary}
            multiline
            accessibilityLabel="Pain notes"
          />
        ) : null}
        <ToggleRow label="I have had a recent injury concern" value={hasRecentInjury} onValueChange={setHasRecentInjury} />
        {hasRecentInjury ? (
          <TextInput
            style={[styles.input, styles.multiline]}
            value={injuryNotes}
            onChangeText={setInjuryNotes}
            placeholder="Optional notes"
            placeholderTextColor={colors.textTertiary}
            multiline
            accessibilityLabel="Injury notes"
          />
        ) : null}
        <ToggleRow
          label="I feel safe standing from a chair without help"
          value={safeChair}
          onValueChange={setSafeChair}
        />
        <ToggleRow
          label="I feel safe practising balance near support"
          value={safeBalance}
          onValueChange={setSafeBalance}
        />
        {warning ? (
          <Text style={styles.gentle}>
            Hale can still give you a gentler starting plan. Use support, stop if anything feels unsafe, and speak to a clinician before starting if you have pain, dizziness, recent injury, or health concerns.
          </Text>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Equipment and rhythm</Text>
        <Text style={styles.hint}>Every exercise has a zero-equipment option. These only unlock smoother substitutions.</Text>
        <View style={styles.grid}>
          {EQUIPMENT_OPTIONS.map((option) => (
            <Choice
              key={option.value}
              label={option.label}
              selected={equipment.includes(option.value)}
              onPress={() => setEquipment((prev) => toggleList(prev, option.value))}
            />
          ))}
        </View>
        <Text style={styles.label}>Preferred days</Text>
        <View style={styles.dayRow}>
          {DAYS.map((day) => (
            <Choice key={day} label={day} selected={days.includes(day)} onPress={() => setDays((prev) => toggleList(prev, day))} />
          ))}
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Continue" onPress={save} />
        <SecondaryButton title="Back" onPress={onCancel} />
      </View>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
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

function toggleList<T>(items: readonly T[], value: T): T[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...type.h2 },
  hint: { ...type.caption, color: colors.textSecondary },
  field: { gap: spacing.xs },
  label: { ...type.caption, color: colors.textSecondary },
  input: {
    ...type.body,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    borderRadius: radius.input,
  },
  multiline: { minHeight: 86, textAlignVertical: 'top' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  choiceSelected: { backgroundColor: colors.bgSage, borderColor: colors.sage },
  choiceText: { ...type.caption, color: colors.textSecondary },
  choiceTextSelected: { color: colors.accentDeep },
  gentle: { ...type.bodySmall, color: colors.textSecondary, paddingTop: spacing.sm },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  actions: { gap: spacing.md },
});
