import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AgeBand } from '../adherence';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { PrimaryButton } from '../components/ui';
import {
  enteredMovementProfileV2ReferenceDetailsDraft,
  referenceProfileFromMovementProfileV2Draft,
  type MovementProfileV2ReferenceDetailsDraft,
} from '../movementProfileV2/referenceDetailsDraft';
import type {
  MovementProfileV2ReferenceProfile,
  ReferenceSexForPublishedComparisons,
} from '../reference/movementProfileV2';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

type ReferenceSex = ReferenceSexForPublishedComparisons;

const SEX_OPTIONS: readonly { label: string; value: ReferenceSex }[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
];

export function MovementProfileV2ReferenceDetailsScreen({
  initialDraft,
  entryMode = 'public',
  onSubmit,
  onBack,
}: {
  initialDraft?: MovementProfileV2ReferenceDetailsDraft | null;
  entryMode?: 'internal' | 'public';
  onSubmit: (profile: MovementProfileV2ReferenceProfile) => void;
  onBack: () => void;
}) {
  const initialExactAge =
    initialDraft &&
    (initialDraft.ageBasis === 'exact_age_at_test' || initialDraft.ageBasis === 'birth_year_month_derived')
      ? initialDraft.ageAtTest
      : undefined;
  const [exactAgeText, setExactAgeText] = React.useState(
    typeof initialExactAge === 'number' && Number.isFinite(initialExactAge)
      ? String(initialExactAge)
      : ''
  );
  const [referenceSex, setReferenceSex] = React.useState<ReferenceSex>(
    initialDraft?.referenceSex === 'female' ||
      initialDraft?.referenceSex === 'male'
      ? initialDraft.referenceSex
      : 'unknown'
  );

  const exactAge = parseAge(exactAgeText);
  const canContinue = exactAge !== null && (referenceSex === 'female' || referenceSex === 'male');

  const submit = () => {
    if (!canContinue) return;
    onSubmit(
      referenceProfileFromMovementProfileV2Draft(
        enteredMovementProfileV2ReferenceDetailsDraft({
          exactAge,
          ageBand: null,
          referenceSex,
          prefilled: !!initialDraft,
        })
      )
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <BackArrowButton
        accessibilityLabel={
          entryMode === 'internal' ? 'Back to Movement Profile' : 'Back to Movement Check-Up'
        }
        onPress={onBack}
      />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <HeaderLogo />
          <Text style={styles.title}>Published comparisons</Text>
        </View>
        <Text style={styles.subtitle}>
          Your raw results are already saved. Confirm these details so Hale can choose the closest
          published reference group.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How old are you today?</Text>
        <Text style={styles.cardBody}>
          Use whole years. Hale stores the exact age only for published comparisons.
        </Text>
        <TextInput
          value={exactAgeText}
          onChangeText={setExactAgeText}
          keyboardType="number-pad"
          placeholder="Exact age"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, exactAgeText.trim().length > 0 && exactAge === null && styles.inputInvalid]}
          maxLength={3}
          accessibilityLabel="Exact age"
        />
        {exactAgeText.trim().length > 0 && exactAge === null ? (
          <Text style={styles.errorText}>Enter an age from 18 to 100.</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>For published comparisons, which reference group should Hale use?</Text>
        <Text style={styles.cardBody}>
          This does not change your raw result or training access.
        </Text>
        <View style={styles.optionStack}>
          {SEX_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              label={option.label}
              selected={referenceSex === option.value}
              onPress={() => setReferenceSex(option.value)}
            />
          ))}
        </View>
      </View>

      <PrimaryButton title="Save Movement Profile" onPress={submit} disabled={!canContinue} />
    </ScrollView>
  );
}

function OptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.optionButton,
        selected && styles.optionButtonSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function parseAge(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 18 || parsed > 100) return null;
  return parsed;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...type.pageTitle,
    flexShrink: 1,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  cardTitle: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  cardBody: {
    ...type.body,
    color: colors.textSecondary,
  },
  input: {
    minHeight: 50,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    letterSpacing: 0,
  },
  inputInvalid: {
    borderColor: colors.warningClay,
  },
  errorText: {
    ...type.cardCaption,
    color: colors.warningClay,
  },
  optionStack: {
    gap: spacing.sm,
  },
  optionButton: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  optionButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  optionText: {
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  optionTextSelected: {
    color: colors.onAccent,
  },
  pressed: {
    opacity: 0.72,
  },
});
