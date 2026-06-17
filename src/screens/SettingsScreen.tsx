/**
 * Settings tab: local profile, safety setup, equipment, preferences, reminders,
 * support-circle placeholder, privacy, and help. V1 remains local-only.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ActivityLevel, AvailableEquipment, SupportConnection } from '../adherence';
import {
  Card,
  Eyebrow,
  Screen,
  ScreenHeader,
  SecondaryButton,
  StatusBadge,
  ToggleRow,
} from '../components/ui';
import { AppSettings, UserProfile, VOICE_OPTIONS } from '../profile';
import { EquipmentProfile, TrainingIntensityPreference } from '../training';
import { colors, radius, spacing, type } from '../theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const INTENSITY_OPTIONS: readonly { id: TrainingIntensityPreference; label: string; body: string }[] = [
  { id: 'gentle', label: 'Gentle', body: 'A calmer start' },
  { id: 'standard', label: 'Standard', body: 'Balanced work' },
  { id: 'more_challenge', label: 'More challenge', body: 'A stronger ask' },
];

export function SettingsScreen({
  profile,
  settings,
  equipment,
  supportConnection,
  preferredDays,
  preferredIntensity,
  onProfileChange,
  onSettingsChange,
  onToggleEquipment,
  onToggleAvailableEquipment,
  onPreferredDaysChange,
  onIntensityChange,
  onOpenLifeGoal,
  onOpenSafetyProfile,
  onOpenCameraSetup,
}: {
  profile: UserProfile;
  settings: AppSettings;
  equipment: EquipmentProfile;
  supportConnection: SupportConnection | null;
  preferredDays: readonly string[];
  preferredIntensity: TrainingIntensityPreference;
  onProfileChange: (next: UserProfile) => void;
  onSettingsChange: (next: AppSettings) => void;
  onToggleEquipment: (key: keyof EquipmentProfile) => void;
  onToggleAvailableEquipment: (item: AvailableEquipment) => void;
  onPreferredDaysChange: (days: string[]) => void;
  onIntensityChange: (preferredIntensity: TrainingIntensityPreference) => void;
  onOpenLifeGoal: () => void;
  onOpenSafetyProfile: () => void;
  onOpenCameraSetup: () => void;
}) {
  const [name, setName] = React.useState(profile.name);
  const [goal, setGoal] = React.useState(profile.goal);
  const [ageText, setAgeText] = React.useState(profile.age === null ? '' : String(profile.age));
  const available = profile.safetyProfile?.availableEquipment ?? ['chair', 'wall'];

  React.useEffect(() => setName(profile.name), [profile.name]);
  React.useEffect(() => setGoal(profile.goal), [profile.goal]);
  React.useEffect(() => setAgeText(profile.age === null ? '' : String(profile.age)), [profile.age]);

  const commitName = () => onProfileChange({ ...profile, name: name.trim() });
  const commitGoal = () => onProfileChange({ ...profile, goal: goal.trim() });
  const commitAge = () => {
    const parsed = parseInt(ageText, 10);
    const age = Number.isFinite(parsed) && parsed > 0 && parsed < 120 ? parsed : null;
    onProfileChange({ ...profile, age });
    setAgeText(age === null ? '' : String(age));
  };
  const toggleDay = (day: string) => {
    const next = preferredDays.includes(day)
      ? preferredDays.filter((item) => item !== day)
      : [...preferredDays, day];
    onPreferredDaysChange(next);
  };

  return (
    <Screen>
      <ScreenHeader title="Profile" subtitle="Your local setup for Hale sessions and check-ups." />

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
        <View style={styles.buttonRow}>
          <SecondaryButton title="Edit life goal" onPress={onOpenLifeGoal} style={styles.rowButton} />
          <SecondaryButton title="Edit safety profile" onPress={onOpenSafetyProfile} style={styles.rowButton} />
        </View>
      </Card>

      <Card>
        <Eyebrow>Health and safety</Eyebrow>
        <Text style={styles.sectionHint}>{safetySummary(profile)}</Text>
        <InfoRow label="Activity" value={activityLabel(profile.safetyProfile?.activityLevel)} />
        <InfoRow label="Chair setup" value={profile.safetyProfile?.feelsSafeStandingFromChair === false ? 'Use extra support' : 'Ready'} />
        <InfoRow label="Balance setup" value={profile.safetyProfile?.feelsSafeBalancing === false ? 'Keep support close' : 'Ready'} />
      </Card>

      <Card>
        <Eyebrow>Plan preferences</Eyebrow>
        <Text style={styles.sectionHint}>These guide Today without turning Explore into a workout library.</Text>
        <Text style={styles.fieldLabel}>Preferred days</Text>
        <View style={styles.dayGrid}>
          {DAYS.map((day) => (
            <Segment
              key={day}
              label={day}
              selected={preferredDays.includes(day)}
              onPress={() => toggleDay(day)}
              compact
            />
          ))}
        </View>
        <Text style={[styles.fieldLabel, styles.segmentLabel]}>Session feel</Text>
        <View style={styles.segmentStack}>
          {INTENSITY_OPTIONS.map((option) => (
            <Segment
              key={option.id}
              label={option.label}
              body={option.body}
              selected={preferredIntensity === option.id}
              onPress={() => onIntensityChange(option.id)}
            />
          ))}
        </View>
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
                    {voice.available ? '' : ' - coming soon'}
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
        <Eyebrow>Equipment setup</Eyebrow>
        <Text style={styles.sectionHint}>This is the setup Hale uses when generating Today and optional sessions.</Text>
        <ToggleRow
          label="Stable chair"
          value={available.includes('chair')}
          onValueChange={() => onToggleAvailableEquipment('chair')}
        />
        <ToggleRow
          label="Wall or counter support"
          value={available.includes('wall')}
          onValueChange={() => onToggleAvailableEquipment('wall')}
        />
        <ToggleRow
          label="Bottom stair"
          value={equipment.stair}
          onValueChange={() => onToggleEquipment('stair')}
        />
        <ToggleRow label="Resistance band" value={equipment.band} onValueChange={() => onToggleEquipment('band')} />
        <ToggleRow label="Mini band" value={!!equipment.miniBand} onValueChange={() => onToggleEquipment('miniBand')} />
        <ToggleRow
          label="Backpack or light weight"
          value={!!equipment.load}
          onValueChange={() => onToggleEquipment('load')}
        />
        <ToggleRow
          label="Phone stand"
          value={settings.phoneStandAvailable}
          onValueChange={(v) => onSettingsChange({ ...settings, phoneStandAvailable: v })}
        />
        <SecondaryButton title="Camera setup tutorial" onPress={onOpenCameraSetup} style={styles.fullButton} />
      </Card>

      <Card>
        <View style={styles.sectionHead}>
          <Eyebrow>Support circle</Eyebrow>
          <StatusBadge label="Local preview" tone="gold" />
        </View>
        <Text style={styles.sectionHint}>
          {supportConnection
            ? `Saved contact: ${supportConnection.inviteEmailOrPhone ?? 'support person'}`
            : 'No support person is connected. Sharing is a local setting in V1.'}
        </Text>
        <View style={styles.segmentStack}>
          {[
            ['private', 'Private', 'Only on this device'],
            ['completion_only', 'Completion only', 'Share session completion later'],
            ['progress_summary', 'Progress summary', 'Share monthly progress later'],
          ].map(([id, label, body]) => (
            <Segment
              key={id}
              label={label}
              body={body}
              selected={settings.supportSharingLevel === id}
              onPress={() =>
                onSettingsChange({
                  ...settings,
                  supportSharingLevel: id as AppSettings['supportSharingLevel'],
                })
              }
            />
          ))}
        </View>
      </Card>

      <Card>
        <Eyebrow>Privacy</Eyebrow>
        <InfoRow label="Account" value="Not required" />
        <InfoRow label="Storage" value="Local to this device" />
        <InfoRow label="Camera" value="Skeleton view only" />
      </Card>

      <Card>
        <Eyebrow>Help</Eyebrow>
        <Text style={styles.sectionHint}>
          Revisit camera setup any time, or use Explore Learn for short guides on check-ups, bands, and monthly re-tests.
        </Text>
        <SecondaryButton title="Open camera setup" onPress={onOpenCameraSetup} style={styles.fullButton} />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Segment({
  label,
  body,
  selected,
  onPress,
  compact,
}: {
  label: string;
  body?: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        compact ? styles.daySegment : styles.segment,
        selected && styles.segmentSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.segmentTitle, selected && styles.segmentTitleSelected]}>{label}</Text>
      {body ? <Text style={[styles.segmentBody, selected && styles.segmentBodySelected]}>{body}</Text> : null}
    </Pressable>
  );
}

function safetySummary(profile: UserProfile): string {
  const safety = profile.safetyProfile;
  if (!safety) return 'Complete the safety profile so Hale can choose a comfortable starting point.';
  if (safety.hasCurrentPain && safety.painNotes) return `Current note: ${safety.painNotes}`;
  if (safety.hasRecentInjury && safety.injuryNotes) return `Recent note: ${safety.injuryNotes}`;
  return 'Hale uses this to keep starts calm and support close when needed.';
}

function activityLabel(value: ActivityLevel | undefined): string {
  if (value === 'very_inactive') return 'Very light lately';
  if (value === 'lightly_active') return 'Lightly active';
  if (value === 'moderately_active') return 'Moderately active';
  if (value === 'very_active') return 'Very active';
  return 'Not set';
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionHint: { ...type.caption, marginTop: spacing.sm },
  field: { marginTop: spacing.lg },
  fieldLabel: { ...type.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    ...type.body,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    borderRadius: radius.card,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  rowButton: { flexGrow: 1, flexBasis: '45%', shadowOpacity: 0 },
  fullButton: { marginTop: spacing.lg, shadowOpacity: 0 },
  infoRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  infoLabel: { ...type.bodySmall, color: colors.textSecondary, flex: 1 },
  infoValue: { ...type.bodySmall, color: colors.accentDeep, textAlign: 'right', flex: 1 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  daySegment: {
    minWidth: 48,
    minHeight: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  segmentLabel: { marginTop: spacing.lg },
  segmentStack: { gap: spacing.sm, marginTop: spacing.sm },
  segment: {
    minHeight: 64,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  segmentSelected: { backgroundColor: colors.sageMist, borderColor: colors.restorativeGreen },
  segmentTitle: { ...type.bodySmall },
  segmentTitleSelected: { color: colors.accentDeep },
  segmentBody: { ...type.caption, marginTop: 2 },
  segmentBodySelected: { color: colors.sageDeep },
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
  voiceRowSelected: { backgroundColor: colors.sageMist, paddingHorizontal: spacing.md },
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
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
