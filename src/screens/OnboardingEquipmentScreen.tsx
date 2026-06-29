import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AvailableEquipment } from '../adherence';
import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader } from '../components/ui';
import type { EquipmentProfile } from '../training';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const HOME_SETUP_HERO_IMAGE = require('../../assets/images/hale-home-setup-hero-v3.png');
const REQUIRED_SETUP_TITLE = 'Required setup';
const REQUIRED_SETUP_MESSAGE =
  'Choose a sturdy chair and a wall or counter before you continue. Hale needs both for the first check-up.';

export type OnboardingEquipmentId =
  | 'chair'
  | 'wall'
  | 'stairs'
  | 'resistance_band'
  | 'door_anchor'
  | 'mini_band'
  | 'load'
  | 'floor_space';

const CHECKUP_OPTIONS: readonly { id: OnboardingEquipmentId; label: string; note: string }[] = [
  { id: 'chair', label: 'Sturdy chair', note: 'Choose this if you have a firm chair that will not slide.' },
  { id: 'wall', label: 'Wall or counter', note: 'Choose this if you can stand near something solid for support.' },
];

const TRAINING_OPTIONS: readonly { id: OnboardingEquipmentId; label: string; note: string }[] = [
  { id: 'stairs', label: 'Bottom stair', note: 'Adds step exercises if your stair feels steady.' },
  { id: 'resistance_band', label: 'Resistance band', note: 'Adds more upper-body exercises.' },
  { id: 'door_anchor', label: 'Door anchor', note: 'Only choose this if you use one to hold a band in a door.' },
  { id: 'mini_band', label: 'Mini band', note: 'Adds some hip and balance exercises.' },
  { id: 'load', label: 'Backpack or light weight', note: 'Adds everyday carrying practice.' },
  { id: 'floor_space', label: 'Clear floor space', note: 'Adds floor exercises if getting down and up feels OK.' },
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
  const responsive = useResponsiveLayout();
  const [selected, setSelected] = React.useState<OnboardingEquipmentId[]>(
    selectedEquipment.length > 0
      ? selectedEquipment.filter((item): item is OnboardingEquipmentId => isEquipmentId(item))
      : ['chair', 'wall']
  );
  const [showRequiredSetupMessage, setShowRequiredSetupMessage] = React.useState(false);
  const hasRequiredSetup = selected.includes('chair') && selected.includes('wall');

  const save = () => {
    if (!hasRequiredSetup) {
      setShowRequiredSetupMessage(true);
      return;
    }
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
        title="What can you use at home?"
        subtitle="Choose the items you have now. Hale will only include exercises that fit your setup."
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

      <EquipmentSection
        title="Needed to start"
        meta="Check-up"
        description="These help Hale guide your first movement check-up safely."
      >
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
        {showRequiredSetupMessage && !hasRequiredSetup ? (
          <View style={[styles.requiredNotice, responsive.isCompactPhone && styles.compactCardPadding]}>
            <View style={styles.requiredNoticeCopy}>
              <Text style={styles.requiredNoticeTitle}>{REQUIRED_SETUP_TITLE}</Text>
              <Text style={styles.requiredNoticeText}>{REQUIRED_SETUP_MESSAGE}</Text>
            </View>
          </View>
        ) : null}
      </EquipmentSection>

      <EquipmentSection
        title="Adds more exercise options"
        meta="Optional"
        description="Skip anything you do not have. Hale can still build a plan."
      >
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

      <View style={[styles.reassuranceCard, responsive.isCompactPhone && styles.compactCardPadding]}>
        <View style={styles.reassuranceMark}>
          <Text style={styles.reassuranceMarkText}>H</Text>
        </View>
        <View style={styles.reassuranceCopy}>
          <Text style={styles.reassuranceTitle}>You can start simply</Text>
          <Text style={styles.reassuranceBody}>
            A chair and wall or counter are enough to begin. For the camera, a shelf, table, or stack of books works well.
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
  description,
  children,
}: {
  title: string;
  meta: string;
  description: string;
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
      <Text style={styles.sectionDescription}>{description}</Text>
      {children}
    </View>
  );
}

function Choice({ label, note, selected, onPress }: { label: string; note: string; selected: boolean; onPress: () => void }) {
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
      accessibilityLabel={`${label}. ${note}`}
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
  sectionDescription: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  optionList: { gap: spacing.sm },
  requiredNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  requiredNoticeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  requiredNoticeTitle: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    lineHeight: 16,
  },
  requiredNoticeText: {
    ...type.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
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
