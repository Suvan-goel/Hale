import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { AvailableEquipment } from '../adherence';
import { Card, ListRow, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import type { EquipmentProfile } from '../training';
import { colors, spacing } from '../theme';

export type OnboardingEquipmentId =
  | 'chair'
  | 'wall'
  | 'stairs'
  | 'resistance_band'
  | 'mini_band'
  | 'load'
  | 'phone_stand';

const EQUIPMENT_OPTIONS: readonly { id: OnboardingEquipmentId; label: string }[] = [
  { id: 'chair', label: 'Stable chair' },
  { id: 'wall', label: 'Wall or counter support' },
  { id: 'stairs', label: 'Bottom stair' },
  { id: 'resistance_band', label: 'Resistance band' },
  { id: 'mini_band', label: 'Mini band' },
  { id: 'load', label: 'Backpack or light weight' },
  { id: 'phone_stand', label: 'Phone stand' },
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
      <ScreenHeader
        eyebrow="Step 4 of 10"
        title="What do you have at home?"
        subtitle="No problem if you don't have equipment. Hale will adapt your sessions."
      />

      <Card style={styles.card}>
        <View style={styles.grid}>
          {EQUIPMENT_OPTIONS.map((option) => (
            <Choice
              key={option.id}
              label={option.label}
              selected={selected.includes(option.id)}
              onPress={() => setSelected((prev) => toggle(prev, option.id))}
            />
          ))}
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Continue" onPress={save} />
        <SecondaryButton title="Back" onPress={onBack} />
      </View>
    </Screen>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <ListRow
      title={label}
      variant="inset"
      style={[styles.choice, selected && styles.choiceSelected]}
      onPress={onPress}
      accessibilityLabel={label}
      selected={selected}
      trailing={<View style={[styles.choiceMark, selected && styles.choiceMarkSelected]} />}
    />
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
  if (selected.includes('mini_band')) out.push('mini_band');
  if (selected.includes('load')) out.push('backpack');
  return out.length > 0 ? out : ['none'];
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 58,
  },
  choiceSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
  choiceMark: {
    width: 12,
    height: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.surface,
  },
  choiceMarkSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  actions: { gap: spacing.md },
});
