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
import { PrimaryButton, Screen, ScreenHeader } from '../components/ui';
import {
  AGE_RANGE_OPTIONS,
  STARTING_PACE_OPTIONS,
  ageBandForAge,
  movementCapabilitiesFromSafetyProfile,
  onboardingActivityLevel,
  representativeAgeForAgeBand,
  safetyProfileWithMovementCapabilities,
  type UserProfile,
} from '../profile';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const PAIN_OPTIONS = ['Knee', 'Hip', 'Back', 'Shoulder', 'Ankle', 'Neck', 'None'] as const;

type SafetyProfileSaveOptions = { stayOnScreen?: boolean };

type SafetyProfileDraft = {
  ageBand: AgeBand | null;
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
  onCancel,
}: {
  profile: UserProfile;
  onSave: (
    safetyProfile: MovementSafetyProfile,
    ageBand: AgeBand | null,
    options?: SafetyProfileSaveOptions
  ) => void;
  showContinueAction?: boolean;
  onCancel: () => void;
}) {
  const initial = profile.safetyProfile;
  const initialCapabilities = React.useMemo(() => movementCapabilitiesFromSafetyProfile(initial), [initial]);
  const initialAgeBand =
    initial?.ageBand ??
    profile.ageBand ??
    ageBandForAge(initial?.age ?? profile.age);
  const [ageBand, setAgeBand] = React.useState<AgeBand | null>(initialAgeBand);
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel>(
    onboardingActivityLevel(initial?.activityLevel)
  );
  const [painArea, setPainArea] = React.useState<string>(normalizePainArea(initial?.painNotes));
  const [floorTransferStatus, setFloorTransferStatus] = React.useState(initialCapabilities.floorTransfer.status);
  const [stepUpStatus, setStepUpStatus] = React.useState(initialCapabilities.stepUpEnvironment.status);
  const [singleLegStatus, setSingleLegStatus] = React.useState(initialCapabilities.singleLegBalance.status);
  const hasSafeStep = stepUpStatus === 'confirmed';

  const currentDraft = (): SafetyProfileDraft => ({
    ageBand,
    activityLevel,
    painArea,
    floorTransferStatus,
    stepUpStatus,
    singleLegStatus,
  });

  const buildSafetyProfile = (draft: SafetyProfileDraft): MovementSafetyProfile => {
    const nowIso = new Date().toISOString();
    const representativeAge = representativeAgeForAgeBand(draft.ageBand);
    const draftHasSafeStep = draft.stepUpStatus === 'confirmed';
    const baseProfile: MovementSafetyProfile = {
      id: initial?.id ?? `safety-profile-${nowIso.replace(/[:.]/g, '-')}`,
      userId: initial?.userId ?? LOCAL_USER_ID,
      age: representativeAge ?? undefined,
      ageBand: draft.ageBand ?? undefined,
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
    onSave(buildSafetyProfile(draft), draft.ageBand, options);
  };

  const save = () => saveDraft(currentDraft());

  const saveIfReviewing = (overrides: Partial<SafetyProfileDraft>) => {
    if (showContinueAction) return;
    saveDraft({ ...currentDraft(), ...overrides }, { stayOnScreen: true });
  };

  const selectAgeBand = (next: AgeBand | null) => {
    setAgeBand(next);
    saveIfReviewing({ ageBand: next });
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
        eyebrow="Safety setup"
        title="Help Hale choose a safe start"
        subtitle="A few quick answers help Hale avoid movements that do not feel right for you today."
      />

      <ChoiceSection title="Age range" meta="Optional">
        <View style={styles.grid}>
          {AGE_RANGE_OPTIONS.map((option) => (
            <Choice
              key={option.label}
              label={option.label}
              selected={ageBand === option.value}
              onPress={() => selectAgeBand(option.value)}
            />
          ))}
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
        <Text style={styles.gentle}>Choose No if you are unsure. Hale will use another safe option.</Text>
        <YesNoQuestion
          title="Floor exercises"
          description="Can Hale include movements where you get down to the floor and stand back up?"
          yesSelected={floorTransferStatus === 'confirmed'}
          onYes={() => selectFloorTransferStatus('confirmed')}
          onNo={() => selectFloorTransferStatus('avoid_for_now')}
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
          <PrimaryButton title="Continue" onPress={save} />
        </View>
      ) : null}
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
    paddingHorizontal: 16,
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
