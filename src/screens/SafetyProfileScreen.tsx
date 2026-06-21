import * as React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import {
  ActivityLevel,
  LOCAL_USER_ID,
  MovementSafetyProfile,
} from '../adherence';
import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader } from '../components/ui';
import { UserProfile } from '../profile';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const AGE_OPTIONS: readonly { label: string; value: number | null }[] = [
  { label: 'Prefer not to say', value: null },
  { label: 'Under 45', value: 44 },
  { label: '45-54', value: 50 },
  { label: '55-64', value: 60 },
  { label: '65-74', value: 70 },
  { label: '75+', value: 76 },
];

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
  const [age, setAge] = React.useState<number | null>(initialAge ?? null);
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel>(initial?.activityLevel ?? 'lightly_active');
  const [painArea, setPainArea] = React.useState<string>(normalizePainArea(initial?.painNotes));
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
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <ScreenHeader
        eyebrow="About you"
        title="Comfort and safety"
        subtitle="These details help Hale choose gentler starts and keep support close when it matters."
      />

      <ChoiceSection title="Age range" meta="Optional">
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
      </ChoiceSection>

      <ChoiceSection title="Current activity level" meta="Current">
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
      </ChoiceSection>

      <ChoiceSection title="Any area that often bothers you?" meta="Optional">
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
        <SupportPreference
          value={supportNearby}
          onValueChange={setSupportNearby}
        />
        <Text style={styles.gentle}>
          These choices do not block you. Move only in a comfortable range and use support whenever you want it.
        </Text>
      </ChoiceSection>

      <View style={styles.actions}>
        <PrimaryButton title="Continue" onPress={save} />
      </View>
    </Screen>
  );
}

function ChoiceSection({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionMetaPill}>
          <Text style={styles.sectionMetaText}>{meta}</Text>
        </View>
      </View>
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
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
      <View style={[styles.choiceMark, selected && styles.choiceMarkSelected]}>
        {selected ? <View style={styles.choiceMarkInner} /> : null}
      </View>
    </Pressable>
  );
}

function SupportPreference({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.supportPanel}>
      <View style={styles.supportCopy}>
        <Text style={styles.supportTitle}>Support nearby for balance</Text>
        <Text style={styles.supportBody}>Keep a counter, wall, or chair close for balance work.</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.borderHairline, true: colors.sage }}
        thumbColor={value ? colors.accent : colors.bgSurface}
        ios_backgroundColor={colors.borderHairline}
        accessibilityLabel="I prefer support nearby when balancing"
      />
    </View>
  );
}

function normalizePainArea(value: string | undefined): string {
  if (!value) return 'None';
  return PAIN_OPTIONS.find((option) => option.toLowerCase() === value.toLowerCase()) ?? 'None';
}

const styles = StyleSheet.create({
  sectionCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  sectionMetaPill: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  sectionMetaText: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    lineHeight: 16,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 142,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  choiceSelected: {
    backgroundColor: colors.bgGold,
  },
  choiceLabel: {
    ...type.bodySmall,
    flex: 1,
    minWidth: 0,
    color: colors.textPrimary,
  },
  choiceLabelSelected: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  choiceMark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceMarkSelected: {
    borderColor: colors.accentDeep,
    backgroundColor: colors.accentDeep,
  },
  choiceMarkInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgSurface,
  },
  supportPanel: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  supportCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  supportTitle: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  supportBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  gentle: { ...type.bodySmall, color: colors.textSecondary },
  actions: { gap: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
