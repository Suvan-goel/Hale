import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AvailableEquipment } from '../adherence';
import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader } from '../components/ui';
import { controlledBetaEquipmentPositioning } from '../haleFlow';
import type { EquipmentProfile } from '../training';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const HOME_SETUP_HERO_IMAGE = require('../../assets/images/hale-home-setup-hero-v3.png');

export type OnboardingEquipmentId =
  | 'chair'
  | 'wall'
  | 'stairs'
  | 'resistance_band'
  | 'door_anchor'
  | 'mini_band'
  | 'load'
  | 'floor_space'
  | 'phone_stand';

const CHECKUP_OPTIONS: readonly { id: OnboardingEquipmentId; label: string; note: string }[] = [
  { id: 'chair', label: 'Stable chair', note: 'Used for chair stands and seated setup.' },
  { id: 'wall', label: 'Wall or counter support', note: 'Helpful for balance comfort.' },
  { id: 'phone_stand', label: 'Phone stand', note: 'A shelf, mug, or stack of books works too.' },
];

const TRAINING_OPTIONS: readonly { id: OnboardingEquipmentId; label: string; note: string }[] = [
  { id: 'stairs', label: 'Bottom stair', note: 'Adds simple step options later.' },
  { id: 'resistance_band', label: 'Resistance band', note: 'Recommended for fuller upper-body training.' },
  { id: 'door_anchor', label: 'Door anchor for band rows', note: 'Only needed for some band rows.' },
  { id: 'mini_band', label: 'Mini band', note: 'Adds hip and balance variations.' },
  { id: 'load', label: 'Backpack or light weight', note: 'Adds everyday carrying practice.' },
  { id: 'floor_space', label: 'Floor space for mat exercises', note: 'Adds floor-based options when comfortable.' },
];

const EQUIPMENT_OPTIONS: readonly { id: OnboardingEquipmentId; label: string; note: string }[] = [
  ...CHECKUP_OPTIONS,
  ...TRAINING_OPTIONS,
];

export function OnboardingEquipmentScreen({
  selectedEquipment,
  onSave,
  onBack,
}: {
  selectedEquipment: readonly string[];
  onSave: (input: {
    selectedEquipment: string[];
    availableEquipment: AvailableEquipment[];
    equipment: EquipmentProfile;
  }) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = React.useState<OnboardingEquipmentId[]>(
    selectedEquipment.length > 0
      ? selectedEquipment.filter((item): item is OnboardingEquipmentId => isEquipmentId(item))
      : ['chair', 'wall']
  );

  const save = () => {
    onSave({
      selectedEquipment: selected,
      availableEquipment: toAvailableEquipment(selected),
      equipment: {
        stair: selected.includes('stairs'),
        band: selected.includes('resistance_band'),
        miniBand: selected.includes('mini_band'),
        load: selected.includes('load'),
      },
    });
  };

  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back" onPress={onBack} />
      <ScreenHeader
        eyebrow="Home setup"
        title="What do you have nearby?"
        subtitle={controlledBetaEquipmentPositioning.startingSetup}
      />

      <View style={styles.heroImageCard}>
        <Image
          source={HOME_SETUP_HERO_IMAGE}
          style={styles.heroImage}
          resizeMode="contain"
          accessible={false}
          accessibilityIgnoresInvertColors
        />
      </View>

      <EquipmentSection title="For the check-up" meta="Start here">
        <View style={styles.optionList}>
          {CHECKUP_OPTIONS.map((option) => (
            <Choice
              key={option.id}
              label={option.label}
              note={option.note}
              selected={selected.includes(option.id)}
              onPress={() => setSelected((prev) => toggle(prev, option.id))}
            />
          ))}
        </View>
      </EquipmentSection>

      <EquipmentSection title="Optional training items" meta="Add if available">
        <View style={styles.optionList}>
          {TRAINING_OPTIONS.map((option) => (
            <Choice
              key={option.id}
              label={option.label}
              note={option.note}
              selected={selected.includes(option.id)}
              onPress={() => setSelected((prev) => toggle(prev, option.id))}
            />
          ))}
        </View>
      </EquipmentSection>

      <View style={styles.reassuranceCard}>
        <View style={styles.reassuranceMark}>
          <Text style={styles.reassuranceMarkText}>H</Text>
        </View>
        <View style={styles.reassuranceCopy}>
          <Text style={styles.reassuranceTitle}>{controlledBetaEquipmentPositioning.shortLabel}</Text>
          <Text style={styles.reassuranceBody}>
            {controlledBetaEquipmentPositioning.noEquipmentClarification}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Continue" onPress={save} />
      </View>
    </Screen>
  );
}

function EquipmentSection({
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

function Choice({ label, note, selected, onPress }: { label: string; note: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <View style={[styles.choiceRail, selected && styles.choiceRailSelected]} />
      <View style={styles.choiceCopy}>
        <Text style={[styles.choiceTitle, selected && styles.choiceTitleSelected]}>{label}</Text>
        <Text style={styles.choiceNote}>{note}</Text>
      </View>
      <View style={[styles.choiceMark, selected && styles.choiceMarkSelected]}>
        {selected ? <View style={styles.choiceMarkInner} /> : null}
      </View>
    </Pressable>
  );
}

function toggle<T>(items: readonly T[], value: T): T[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function isEquipmentId(value: string): value is OnboardingEquipmentId {
  return EQUIPMENT_OPTIONS.some((option) => option.id === value);
}

function toAvailableEquipment(selected: readonly OnboardingEquipmentId[]): AvailableEquipment[] {
  const out: AvailableEquipment[] = [];
  if (selected.includes('chair')) out.push('chair');
  if (selected.includes('wall')) out.push('wall');
  if (selected.includes('stairs')) out.push('stairs');
  if (selected.includes('resistance_band')) out.push('resistance_band');
  if (selected.includes('door_anchor')) out.push('door_anchor');
  if (selected.includes('mini_band')) out.push('mini_band');
  if (selected.includes('load')) out.push('backpack');
  if (selected.includes('floor_space')) out.push('floor_space');
  return out.length > 0 ? out : ['none'];
}

const styles = StyleSheet.create({
  heroImageCard: {
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgMaterial,
    ...shadow.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
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
  optionList: { gap: spacing.sm },
  choice: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  choiceSelected: {
    backgroundColor: colors.bgGold,
  },
  choiceRail: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
  },
  choiceRailSelected: {
    backgroundColor: colors.accentDeep,
  },
  choiceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  choiceTitle: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  choiceTitleSelected: {
    color: colors.accentDeep,
  },
  choiceNote: {
    ...type.caption,
    color: colors.textSecondary,
  },
  choiceMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.bgSurface,
  },
  reassuranceCard: {
    minHeight: 128,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  reassuranceMark: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgGold,
  },
  reassuranceMarkText: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 26,
    color: colors.accentDeep,
  },
  reassuranceCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  reassuranceTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  reassuranceBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  actions: { gap: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
