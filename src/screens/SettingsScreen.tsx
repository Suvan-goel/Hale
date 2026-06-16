/**
 * Settings tab — local profile, trainer voice, reminder preference, and simple
 * equipment availability. No accounts, backend, or OS notifications in V1.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Eyebrow, Screen, ScreenHeader, StatusBadge, ToggleRow } from '../components/ui';
import { AppSettings, UserProfile, VOICE_OPTIONS } from '../profile';
import { EquipmentProfile } from '../training';
import { colors, radius, spacing, type } from '../theme';

export function SettingsScreen({
  profile,
  settings,
  equipment,
  onProfileChange,
  onSettingsChange,
  onToggleEquipment,
}: {
  profile: UserProfile;
  settings: AppSettings;
  equipment: EquipmentProfile;
  onProfileChange: (next: UserProfile) => void;
  onSettingsChange: (next: AppSettings) => void;
  onToggleEquipment: (key: keyof EquipmentProfile) => void;
}) {
  const [name, setName] = React.useState(profile.name);
  const [goal, setGoal] = React.useState(profile.goal);
  const [ageText, setAgeText] = React.useState(profile.age === null ? '' : String(profile.age));

  const commitName = () => onProfileChange({ ...profile, name: name.trim() });
  const commitGoal = () => onProfileChange({ ...profile, goal: goal.trim() });
  const commitAge = () => {
    const parsed = parseInt(ageText, 10);
    const age = Number.isFinite(parsed) && parsed > 0 && parsed < 120 ? parsed : null;
    onProfileChange({ ...profile, age });
    setAgeText(age === null ? '' : String(age));
  };

  return (
    <Screen>
      <ScreenHeader title="Profile" subtitle="Keep the app personal without creating an account." />

      <Card>
        <View style={styles.sectionHead}>
          <Eyebrow>Your details</Eyebrow>
          <StatusBadge label="On device" tone="gold" />
        </View>
        <Field label="Name">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            onBlur={commitName}
            placeholder="Your name"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
            accessibilityLabel="Name"
          />
        </Field>
        <Field label="Age">
          <TextInput
            style={styles.input}
            value={ageText}
            onChangeText={setAgeText}
            onBlur={commitAge}
            placeholder="Your age"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            returnKeyType="done"
            accessibilityLabel="Age"
          />
        </Field>
        <Field label="Your goal">
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={goal}
            onChangeText={setGoal}
            onBlur={commitGoal}
            placeholder="e.g. Stay steady on the stairs"
            placeholderTextColor={colors.textTertiary}
            multiline
            accessibilityLabel="Your goal"
          />
        </Field>
      </Card>

      <Card>
        <Eyebrow>Trainer voice</Eyebrow>
        <Text style={styles.sectionHint}>Bundled audio only. Nothing calls a voice service during a session.</Text>
        <View style={styles.voiceList}>
          {VOICE_OPTIONS.map((voice, index) => {
            const selected = voice.id === settings.voiceId;
            return (
              <Pressable
                key={voice.id}
                style={[
                  styles.voiceRow,
                  index > 0 && styles.rowDivider,
                  selected && styles.voiceRowSelected,
                  !voice.available && styles.voiceRowDisabled,
                ]}
                disabled={!voice.available}
                onPress={() => onSettingsChange({ ...settings, voiceId: voice.id })}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: !voice.available }}
                accessibilityLabel={voice.label}
              >
                <View style={styles.voiceAvatar}>
                  <Text style={styles.voiceAvatarText}>{voice.label.slice(0, 1)}</Text>
                </View>
                <View style={styles.voiceText}>
                  <Text style={styles.voiceLabel}>{voice.label}</Text>
                  <Text style={styles.voiceDesc}>
                    {voice.description}
                    {voice.available ? '' : ' · coming soon'}
                  </Text>
                </View>
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Eyebrow>Reminders</Eyebrow>
        <ToggleRow
          label="Remind me to train"
          description="Stored as a preference only for now; no OS notification is scheduled."
          value={settings.remindersEnabled}
          onValueChange={(v) => onSettingsChange({ ...settings, remindersEnabled: v })}
        />
      </Card>

      <Card>
        <Eyebrow>Equipment I have</Eyebrow>
        <Text style={styles.sectionHint}>A chair, wall, and floor are assumed. These unlock optional substitutions.</Text>
        <ToggleRow
          label="A step or bottom stair"
          value={equipment.stair}
          onValueChange={() => onToggleEquipment('stair')}
        />
        <ToggleRow label="A resistance band" value={equipment.band} onValueChange={() => onToggleEquipment('band')} />
        <ToggleRow label="A mini band" value={!!equipment.miniBand} onValueChange={() => onToggleEquipment('miniBand')} />
        <ToggleRow
          label="A backpack or light weights"
          value={!!equipment.load}
          onValueChange={() => onToggleEquipment('load')}
        />
      </Card>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionHint: { ...type.caption, marginTop: spacing.sm },
  field: { marginTop: spacing.lg },
  fieldLabel: { ...type.caption, color: colors.textSecondary, marginBottom: spacing.xs },
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
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  voiceList: { marginTop: spacing.lg },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    paddingVertical: spacing.md,
    borderRadius: radius.input,
  },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  voiceRowSelected: { backgroundColor: colors.bgSage, paddingHorizontal: spacing.md },
  voiceRowDisabled: { opacity: 0.55 },
  voiceAvatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceAvatarText: { ...type.h3, color: colors.accentDeep },
  voiceText: { flex: 1 },
  voiceLabel: { ...type.h3 },
  voiceDesc: { ...type.caption, marginTop: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.accent },
});
