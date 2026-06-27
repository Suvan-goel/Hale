import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  AgeBand,
  ActivityLevel,
  CapabilityConfirmationStatus,
  LOCAL_USER_ID,
  MovementSafetyProfile,
  SingleLegBalanceCapabilityStatus,
} from '../adherence';
import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader } from '../components/ui';
import {
  STARTING_PACE_OPTIONS,
  ageBandForAge,
  movementCapabilitiesFromSafetyProfile,
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
  exactAge: number;
  ageBand: AgeBand | null;
  referenceSex: ProfileReferenceSex;
};

type SafetyProfileDraft = {
  exactAge: number | null;
  referenceSex: ProfileReferenceSex | null;
  activityLevel: ActivityLevel;
  painArea: string;
  floorTransferStatus: CapabilityConfirmationStatus;
  floorTransferAnswer: FloorTransferAnswer;
  stepUpStatus: CapabilityConfirmationStatus;
  singleLegStatus: SingleLegBalanceCapabilityStatus;
};

type FloorTransferAnswer = 'yes' | 'no' | 'not_sure' | 'unknown';

export function SafetyProfileScreen({
  profile,
  onSave,
  showContinueAction = true,
  onCancel,
}: {
  profile: UserProfile;
  onSave: (
    safetyProfile: MovementSafetyProfile,
    referenceDetails: SafetyProfileReferenceDetails,
    options?: SafetyProfileSaveOptions
  ) => void;
  showContinueAction?: boolean;
  onCancel: () => void;
}) {
  const initial = profile.safetyProfile;
  const initialCapabilities = React.useMemo(() => movementCapabilitiesFromSafetyProfile(initial), [initial]);
  const initialExactAge = profile.exactAge ?? profile.age ?? initial?.age ?? null;
  const [exactAgeText, setExactAgeText] = React.useState(
    typeof initialExactAge === 'number' && Number.isInteger(initialExactAge)
      ? String(initialExactAge)
      : ''
  );
  const [referenceSex, setReferenceSex] = React.useState<ProfileReferenceSex | null>(profile.referenceSex);
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel>(
    onboardingActivityLevel(initial?.activityLevel)
  );
  const [painArea, setPainArea] = React.useState<string>(normalizePainArea(initial?.painNotes));
  const [floorTransferStatus, setFloorTransferStatus] = React.useState(initialCapabilities.floorTransfer.status);
  const [floorTransferAnswer, setFloorTransferAnswer] = React.useState<FloorTransferAnswer>(
    floorTransferAnswerForStatus(initialCapabilities.floorTransfer.status)
  );
  const [stepUpStatus, setStepUpStatus] = React.useState(initialCapabilities.stepUpEnvironment.status);
  const [singleLegStatus, setSingleLegStatus] = React.useState(initialCapabilities.singleLegBalance.status);
  const hasSafeStep = stepUpStatus === 'confirmed';
  const exactAge = parseExactAge(exactAgeText);
  const exactAgeInvalid = exactAgeText.trim().length > 0 && exactAge === null;
  const canSaveReferenceDetails = exactAge !== null && referenceSex !== null;

  const currentDraft = (): SafetyProfileDraft => ({
    exactAge,
    referenceSex,
    activityLevel,
    painArea,
    floorTransferStatus,
    floorTransferAnswer,
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
    if (draft.exactAge === null || draft.referenceSex === null) return;
    onSave(
      buildSafetyProfile(draft),
      {
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

  const updateExactAgeText = (next: string) => {
    setExactAgeText(next);
    const nextAge = parseExactAge(next);
    if (nextAge !== null) saveIfReviewing({ exactAge: nextAge });
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

  const selectFloorTransferStatus = (next: CapabilityConfirmationStatus, answer: FloorTransferAnswer) => {
    setFloorTransferStatus(next);
    setFloorTransferAnswer(answer);
    saveIfReviewing({ floorTransferStatus: next, floorTransferAnswer: answer });
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
        eyebrow="Safety setup"
        title="Help Hale choose a safe start"
        subtitle="A few quick answers help Hale avoid movements that do not feel right for you today."
      />

      <ChoiceSection title="Age and reference group" meta="Required">
        <View style={styles.referenceStack}>
          <Text style={styles.gentle}>
            Hale uses your whole-year age and reference group only for published comparisons.
          </Text>
          <TextInput
            value={exactAgeText}
            onChangeText={updateExactAgeText}
            keyboardType="number-pad"
            placeholder="Exact age"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, exactAgeInvalid && styles.inputInvalid]}
            maxLength={3}
            accessibilityLabel="Exact age"
          />
          {exactAgeInvalid ? (
            <Text style={styles.errorText}>Enter an age from 18 to 100.</Text>
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

      <ChoiceSection title="Movements to include" meta="Safety">
        <Text style={styles.gentle}>Hale will use standing alternatives when a setup does not fit.</Text>
        <FloorTransferQuestion
          title="Floor exercises"
          selected={floorTransferAnswer}
          onYes={() => selectFloorTransferStatus('confirmed', 'yes')}
          onNo={() => selectFloorTransferStatus('avoid_for_now', 'no')}
          onNotSure={() => selectFloorTransferStatus('avoid_for_now', 'not_sure')}
        />
        <YesNoQuestion
          title="Step exercises"
          description="Can Hale include exercises using a low step or bottom stair? Choose Yes only if it is steady and you have something fixed nearby to hold."
          yesSelected={hasSafeStep}
          onYes={() => selectStepUpStatus('confirmed')}
          onNo={() => selectStepUpStatus('avoid_for_now')}
        />
        <YesNoQuestion
          title="Single-leg balance"
          description="Can Hale include balance exercises where one foot lifts off the floor? Choose Yes only if you can keep a hand near a counter, wall, or sturdy chair."
          yesSelected={singleLegStatus === 'confirmed_with_support'}
          onYes={() => selectSingleLegStatus('confirmed_with_support')}
          onNo={() => selectSingleLegStatus('supported_balance_only')}
        />
      </ChoiceSection>

      {showContinueAction ? (
        <View style={styles.actions}>
          <PrimaryButton title="Continue" onPress={save} disabled={!canSaveReferenceDetails} />
        </View>
      ) : null}
    </Screen>
  );
}

function floorTransferAnswerForStatus(status: CapabilityConfirmationStatus): FloorTransferAnswer {
  if (status === 'confirmed') return 'yes';
  if (status === 'avoid_for_now') return 'no';
  return 'not_sure';
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
  const responsive = useResponsiveLayout();
  return (
    <View style={[styles.sectionCard, responsive.isCompactPhone && styles.compactCardPadding]}>
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

function YesNoQuestion({
  title,
  description,
  yesSelected,
  onYes,
  onNo,
}: {
  title: string;
  description: string;
  yesSelected: boolean;
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
          accessibilityLabel={`Yes, include ${title.toLowerCase()}`}
        />
        <Choice
          label="No"
          selected={!yesSelected}
          onPress={onNo}
          accessibilityLabel={`No, skip ${title.toLowerCase()}`}
        />
      </View>
    </View>
  );
}

function FloorTransferQuestion({
  title,
  selected,
  onYes,
  onNo,
  onNotSure,
}: {
  title: string;
  selected: FloorTransferAnswer;
  onYes: () => void;
  onNo: () => void;
  onNotSure: () => void;
}) {
  return (
    <View style={styles.subsection}>
      <View style={styles.questionCopy}>
        <Text style={styles.subsectionTitle}>{title}</Text>
        <Text style={styles.questionDescription}>
          Can you safely get down to the floor and back up without assistance?
        </Text>
        <Text style={styles.questionDescription}>
          Choose "Not sure" if you would rather use standing alternatives for now.
        </Text>
      </View>
      <View style={styles.grid}>
        <Choice
          label="Yes"
          selected={selected === 'yes'}
          onPress={onYes}
          accessibilityLabel="Yes, floor exercises can be included"
        />
        <Choice
          label="No"
          selected={selected === 'no'}
          onPress={onNo}
          accessibilityLabel="No, use standing alternatives"
        />
        <Choice
          label="Not sure"
          selected={selected === 'not_sure' || selected === 'unknown'}
          onPress={onNotSure}
          accessibilityLabel="Not sure, use standing alternatives"
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

function parseExactAge(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 18 || parsed > 100) return null;
  return parsed;
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
  input: {
    minHeight: 52,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    backgroundColor: colors.background,
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
