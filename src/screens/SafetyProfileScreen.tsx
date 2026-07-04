import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AgeBand,
  ActivityLevel,
  CapabilityConfirmationStatus,
  LOCAL_USER_ID,
  MovementSafetyProfile,
  SingleLegBalanceCapabilityStatus,
} from '../adherence';
import { BackArrowButton } from '../components/BackArrowButton';
import { DateOfBirthPickerModal } from '../components/DateOfBirthPickerModal';
import { PrimaryButton, Screen, ScreenHeader } from '../components/ui';
import {
  STARTING_PACE_OPTIONS,
  ageFromDateOfBirth,
  ageBandForAge,
  dateOfBirthInputLabel,
  movementCapabilitiesFromSafetyProfile,
  normalizeDateOfBirth,
  onboardingActivityLevel,
  safetyProfileWithMovementCapabilities,
  type ProfileReferenceSex,
  type UserProfile,
} from '../profile';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const PAIN_OPTIONS = ['Knee', 'Hip', 'Back', 'Shoulder', 'Ankle', 'Neck', 'None'] as const;

type SafetyProfileSaveOptions = { stayOnScreen?: boolean };
type SafetyProfileReferenceDetails = {
  dateOfBirth: string;
  exactAge: number;
  ageBand: AgeBand | null;
  referenceSex: ProfileReferenceSex;
};

type SafetyProfileDraft = {
  dateOfBirth: string | null;
  exactAge: number | null;
  referenceSex: ProfileReferenceSex | null;
  activityLevel: ActivityLevel;
  painArea: string;
  floorTransferStatus: CapabilityConfirmationStatus;
  stepUpStatus: CapabilityConfirmationStatus;
  singleLegStatus: SingleLegBalanceCapabilityStatus;
};

export function SafetyProfileScreen({
  profile,
  onSave,
  showContinueAction = true,
  showStartingDetails = true,
  progress,
  onCancel,
}: {
  profile: UserProfile;
  onSave: (
    safetyProfile: MovementSafetyProfile,
    referenceDetails: SafetyProfileReferenceDetails,
    options?: SafetyProfileSaveOptions
  ) => void;
  showContinueAction?: boolean;
  /**
   * Starting pace and comfort/pain are deferred out of the onboarding funnel
   * (they default sensibly and are editable in Settings). Shown in review mode.
   */
  showStartingDetails?: boolean;
  progress?: { step: number; total: number };
  onCancel: () => void;
}) {
  const initial = profile.safetyProfile;
  const initialCapabilities = React.useMemo(() => movementCapabilitiesFromSafetyProfile(initial), [initial]);
  const [dateOfBirthText, setDateOfBirthText] = React.useState(
    dateOfBirthInputLabel(profile.dateOfBirth)
  );
  const [datePickerVisible, setDatePickerVisible] = React.useState(false);
  const [referenceSex, setReferenceSex] = React.useState<ProfileReferenceSex | null>(profile.referenceSex);
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel>(
    onboardingActivityLevel(initial?.activityLevel)
  );
  const [painArea, setPainArea] = React.useState<string>(normalizePainArea(initial?.painNotes));
  const [floorTransferStatus, setFloorTransferStatus] = React.useState(initialCapabilities.floorTransfer.status);
  const [stepUpStatus, setStepUpStatus] = React.useState(initialCapabilities.stepUpEnvironment.status);
  const [singleLegStatus, setSingleLegStatus] = React.useState(initialCapabilities.singleLegBalance.status);
  const dateOfBirth = normalizeDateOfBirth(dateOfBirthText);
  const exactAge = ageFromDateOfBirth(dateOfBirth);
  const canSaveReferenceDetails = dateOfBirth !== null && exactAge !== null && referenceSex !== null;
  const movementAnswersComplete =
    floorTransferStatus !== 'not_confirmed' &&
    stepUpStatus !== 'not_confirmed' &&
    singleLegStatus !== 'not_confirmed';

  const currentDraft = (): SafetyProfileDraft => ({
    dateOfBirth,
    exactAge,
    referenceSex,
    activityLevel,
    painArea,
    floorTransferStatus,
    stepUpStatus,
    singleLegStatus,
  });

  const buildSafetyProfile = (draft: SafetyProfileDraft): MovementSafetyProfile => {
    const nowIso = new Date().toISOString();
    const ageBand = draft.exactAge !== null ? ageBandForAge(draft.exactAge) : null;
    const draftHasSafeStep = draft.stepUpStatus === 'confirmed';
    const baseProfile: MovementSafetyProfile = {
      id: initial?.id ?? `safety-profile-${nowIso.replace(/[:.]/g, '-')}`,
      userId: initial?.userId ?? LOCAL_USER_ID,
      age: draft.exactAge ?? undefined,
      ageBand: ageBand ?? undefined,
      activityLevel: draft.activityLevel,
      hasCurrentPain: draft.painArea !== 'None',
      painNotes: draft.painArea !== 'None' ? draft.painArea.toLowerCase() : undefined,
      hasRecentInjury: initial?.hasRecentInjury,
      injuryNotes: initial?.injuryNotes,
      feelsSafeStandingFromChair: true,
      feelsSafeBalancing: draft.singleLegStatus === 'confirmed_with_support',
      availableEquipment: initial?.availableEquipment.length ? initial.availableEquipment : ['chair', 'wall'],
      movementCapabilities: initial?.movementCapabilities,
      preferredWorkoutDays: initial?.preferredWorkoutDays ?? ['Mon', 'Wed', 'Fri'],
      createdAt: initial?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };
    return safetyProfileWithMovementCapabilities(
      baseProfile,
      {
        schemaVersion: 1,
        floorTransfer: { status: draft.floorTransferStatus },
        stepUpEnvironment: {
          status: draft.stepUpStatus,
          lowStableStep: draftHasSafeStep,
          fixedSupport: draftHasSafeStep,
          clearDryArea: draftHasSafeStep,
          phoneOutOfPath: draftHasSafeStep,
        },
        singleLegBalance: { status: draft.singleLegStatus },
      },
      {
        updatedAt: nowIso,
      }
    );
  };

  const saveDraft = (draft: SafetyProfileDraft, options?: SafetyProfileSaveOptions) => {
    if (draft.dateOfBirth === null || draft.exactAge === null || draft.referenceSex === null) return;
    onSave(
      buildSafetyProfile(draft),
      {
        dateOfBirth: draft.dateOfBirth,
        exactAge: draft.exactAge,
        ageBand: ageBandForAge(draft.exactAge),
        referenceSex: draft.referenceSex,
      },
      options
    );
  };

  const save = () => saveDraft(currentDraft());

  const saveIfReviewing = (overrides: Partial<SafetyProfileDraft>) => {
    if (showContinueAction) return;
    saveDraft({ ...currentDraft(), ...overrides }, { stayOnScreen: true });
  };

  const updateDateOfBirth = (nextDateOfBirth: string) => {
    const nextAge = ageFromDateOfBirth(nextDateOfBirth);
    setDatePickerVisible(false);
    setDateOfBirthText(dateOfBirthInputLabel(nextDateOfBirth));
    if (nextDateOfBirth !== null && nextAge !== null) {
      saveIfReviewing({ dateOfBirth: nextDateOfBirth, exactAge: nextAge });
    }
  };

  const selectReferenceSex = (next: ProfileReferenceSex) => {
    setReferenceSex(next);
    saveIfReviewing({ referenceSex: next });
  };

  const selectActivityLevel = (next: ActivityLevel) => {
    setActivityLevel(next);
    saveIfReviewing({ activityLevel: next });
  };

  const selectPainArea = (next: string) => {
    setPainArea(next);
    saveIfReviewing({ painArea: next });
  };

  const selectFloorTransferStatus = (next: CapabilityConfirmationStatus) => {
    setFloorTransferStatus(next);
    saveIfReviewing({ floorTransferStatus: next });
  };

  const selectStepUpStatus = (next: CapabilityConfirmationStatus) => {
    setStepUpStatus(next);
    saveIfReviewing({ stepUpStatus: next });
  };

  const selectSingleLegStatus = (next: SingleLegBalanceCapabilityStatus) => {
    setSingleLegStatus(next);
    saveIfReviewing({ singleLegStatus: next });
  };

  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <ScreenHeader
        progress={progress}
        eyebrow="Safety setup"
        title="Help Hale choose a safe start"
        subtitle="A few quick answers help Hale avoid movements that do not feel right for you today."
      />

      <ChoiceSection title="About you" meta="Required">
        <View style={styles.referenceStack}>
          <Text style={styles.gentle}>
            Hale uses your date of birth and sex to compare your results with people like you.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
            onPress={() => setDatePickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Select date of birth"
          >
            <Text style={[styles.dateButtonValue, !dateOfBirthText && styles.dateButtonPlaceholder]} numberOfLines={1}>
              {dateOfBirthText || 'Select date of birth'}
            </Text>
            <Text style={styles.dateButtonAction}>{dateOfBirthText ? 'Change' : 'Select'}</Text>
          </Pressable>
          {exactAge !== null ? (
            <Text style={styles.gentle}>Age {exactAge} today</Text>
          ) : null}
          <View style={styles.grid}>
            <Choice
              label="Female"
              selected={referenceSex === 'female'}
              onPress={() => selectReferenceSex('female')}
              accessibilityLabel="Use female reference group"
            />
            <Choice
              label="Male"
              selected={referenceSex === 'male'}
              onPress={() => selectReferenceSex('male')}
              accessibilityLabel="Use male reference group"
            />
          </View>
        </View>
      </ChoiceSection>

      {showStartingDetails ? (
        <ChoiceSection title="How should Hale start your workouts?" meta="Workout effort">
          <View style={styles.grid}>
            {STARTING_PACE_OPTIONS.map((option) => (
              <Choice
                key={option.value}
                label={option.label}
                selected={activityLevel === option.value}
                onPress={() => selectActivityLevel(option.value)}
              />
            ))}
          </View>
          <Text style={styles.gentle}>
            You can change this later in Settings. Your check-up, pain notes, and safety setup still decide which movements Hale uses.
          </Text>
        </ChoiceSection>
      ) : null}

      {showStartingDetails ? (
        <ChoiceSection title="Any area that often feels uncomfortable?" meta="Optional">
          <View style={styles.grid}>
            {PAIN_OPTIONS.map((option) => (
              <Choice
                key={option}
                label={option}
                selected={painArea === option}
                onPress={() => selectPainArea(option)}
              />
            ))}
          </View>
          <Text style={styles.gentle}>
            Hale may choose easier options around this area. You can still stop or use support at any time.
          </Text>
        </ChoiceSection>
      ) : null}

      <ChoiceSection title="Movements to include">
        <Text style={styles.gentle}>
          Hale uses alternatives for any exercise that does not work for you.
        </Text>
        <YesNoQuestion
          title="Floor exercises"
          description="Can you get down to the floor and back up on your own?"
          noLabel="Not yet"
          yesSelected={floorTransferStatus === 'confirmed'}
          noSelected={floorTransferStatus === 'avoid_for_now'}
          yesAccessibilityLabel="Yes, floor exercises can be included"
          noAccessibilityLabel="Not yet, use standing alternatives"
          onYes={() => selectFloorTransferStatus('confirmed')}
          onNo={() => selectFloorTransferStatus('avoid_for_now')}
        />
        <YesNoQuestion
          title="Step exercises"
          description="Do you have a steady low step or bottom stair, with something fixed to hold nearby?"
          yesSelected={stepUpStatus === 'confirmed'}
          noSelected={stepUpStatus === 'avoid_for_now'}
          onYes={() => selectStepUpStatus('confirmed')}
          onNo={() => selectStepUpStatus('avoid_for_now')}
        />
        <YesNoQuestion
          title="Single-leg balance"
          description="Are you comfortable lifting one foot off the floor with a counter or chair within reach?"
          yesSelected={singleLegStatus === 'confirmed_with_support'}
          noSelected={singleLegStatus === 'supported_balance_only'}
          onYes={() => selectSingleLegStatus('confirmed_with_support')}
          onNo={() => selectSingleLegStatus('supported_balance_only')}
        />
      </ChoiceSection>

      {showContinueAction ? (
        <View style={styles.actions}>
          <PrimaryButton
            title="Continue"
            onPress={save}
            disabled={!canSaveReferenceDetails || !movementAnswersComplete}
          />
        </View>
      ) : null}
      <DateOfBirthPickerModal
        visible={datePickerVisible}
        value={dateOfBirth}
        title="Date of birth"
        maximumAge={120}
        onCancel={() => setDatePickerVisible(false)}
        onConfirm={updateDateOfBirth}
      />
    </Screen>
  );
}

function ChoiceSection({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  const responsive = useResponsiveLayout();
  return (
    <View style={[styles.sectionCard, responsive.isCompactPhone && styles.compactCardPadding]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {meta ? (
          <View style={styles.sectionMetaPill}>
            <Text style={styles.sectionMetaText}>{meta}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function YesNoQuestion({
  title,
  description,
  yesSelected,
  noSelected,
  noLabel = 'No',
  yesAccessibilityLabel,
  noAccessibilityLabel,
  onYes,
  onNo,
}: {
  title: string;
  description: string;
  yesSelected: boolean;
  noSelected: boolean;
  noLabel?: string;
  yesAccessibilityLabel?: string;
  noAccessibilityLabel?: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <View style={styles.subsection}>
      <View style={styles.questionCopy}>
        <Text style={styles.subsectionTitle}>{title}</Text>
        <Text style={styles.questionDescription}>{description}</Text>
      </View>
      <View style={styles.grid}>
        <Choice
          label="Yes"
          selected={yesSelected}
          onPress={onYes}
          accessibilityLabel={yesAccessibilityLabel ?? `Yes, include ${title.toLowerCase()}`}
        />
        <Choice
          label={noLabel}
          selected={noSelected}
          onPress={onNo}
          accessibilityLabel={noAccessibilityLabel ?? `No, skip ${title.toLowerCase()}`}
        />
      </View>
    </View>
  );
}

function Choice({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const responsive = useResponsiveLayout();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.choice,
        responsive.isCompactPhone && styles.compactCardPadding,
        selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label.replace(/\s+/g, ' ')}
    >
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
      <View style={[styles.choiceMark, selected && styles.choiceMarkSelected]}>
        {selected ? <View style={styles.choiceMarkInner} /> : null}
      </View>
    </Pressable>
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
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
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
  referenceStack: {
    gap: spacing.md,
  },
  dateButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  dateButtonValue: {
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
    fontVariant: ['tabular-nums'],
  },
  dateButtonPlaceholder: {
    color: colors.textTertiary,
  },
  dateButtonAction: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  subsection: {
    gap: spacing.md,
  },
  questionCopy: {
    gap: spacing.xs,
  },
  subsectionTitle: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  questionDescription: {
    ...type.caption,
    color: colors.textSecondary,
    lineHeight: 21,
  },
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
  gentle: { ...type.bodySmall, color: colors.textSecondary },
  actions: { gap: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
