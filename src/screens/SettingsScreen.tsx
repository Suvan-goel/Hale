/**
 * Settings tab: compact local profile hub, plan preferences, safety setup,
 * equipment, account actions, privacy, and help.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { AvailableEquipment, SupportConnection } from '../adherence';
import { getLifeGoalDisplayText } from '../adherence';
import { AccountAuthCard } from '../components/AccountAuthCard';
import { Screen, SecondaryButton, ToggleRow } from '../components/ui';
import { AppSettings, getVoice, UserProfile, VOICE_OPTIONS } from '../profile';
import { EquipmentProfile, TrainingIntensityPreference } from '../training';
import { colors, fonts, minTapTarget, radius, shadow, spacing, type } from '../theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const INTENSITY_OPTIONS: readonly { id: TrainingIntensityPreference; label: string; body: string }[] = [
  { id: 'gentle', label: 'Gentle', body: 'A calmer start' },
  { id: 'standard', label: 'Standard', body: 'Balanced work' },
  { id: 'more_challenge', label: 'More challenge', body: 'A stronger ask' },
];

type ProfileSection = 'details' | 'safety' | 'plan' | 'voice' | 'equipment' | 'privacy' | 'help';

const SECTION_COPY: Record<ProfileSection, { title: string; subtitle: string }> = {
  details: {
    title: 'Personal Details',
    subtitle: 'Update the basics Hale uses to personalize your plan.',
  },
  safety: {
    title: 'Camera & Safety',
    subtitle: 'Review camera setup and safety details before movement sessions.',
  },
  plan: {
    title: 'Plan Preferences',
    subtitle: 'Choose the days and session feel that fit your routine.',
  },
  voice: {
    title: 'Trainer Voice',
    subtitle: 'Pick the bundled guide voice for check-ups and sessions.',
  },
  equipment: {
    title: 'Equipment Setup',
    subtitle: 'Tell Hale what simple home setup is available.',
  },
  privacy: {
    title: 'Privacy',
    subtitle: 'See what Hale stores and how camera privacy works.',
  },
  help: {
    title: 'Help',
    subtitle: 'Jump back to setup guidance when you need it.',
  },
};

type SettingsScreenProps = {
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
};

export function SettingsScreen(props: SettingsScreenProps) {
  return <SettingsScreenContent {...props} />;
}

function SettingsScreenContent({
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
}: SettingsScreenProps) {
  const [openSection, setOpenSection] = React.useState<ProfileSection | null>(null);
  const [name, setName] = React.useState(profile.name);
  const [goal, setGoal] = React.useState(profile.goal);
  const [ageText, setAgeText] = React.useState(profile.age === null ? '' : String(profile.age));
  const available = profile.safetyProfile?.availableEquipment ?? ['chair', 'wall'];
  const displayName = profile.name.trim() || 'Your details';
  const goalText =
    profile.goal.trim() || (profile.lifeGoal ? getLifeGoalDisplayText(profile.lifeGoal) : 'Set a movement goal');
  const currentVoice = getVoice(settings.voiceId);

  React.useEffect(() => setName(profile.name), [profile.name]);
  React.useEffect(() => setGoal(profile.goal), [profile.goal]);
  React.useEffect(() => setAgeText(profile.age === null ? '' : String(profile.age)), [profile.age]);

  const openProfileSection = (section: ProfileSection) => setOpenSection(section);

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

  const renderSectionContent = () => {
    if (openSection === 'details') {
      return (
        <DetailPanel>
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
        </DetailPanel>
      );
    }

    if (openSection === 'safety') {
      return (
        <DetailPanel>
          <InfoRow label="Camera view" value="Skeleton only" />
          <InfoRow label="Safety profile" value={profile.safetyProfile ? 'Saved' : 'Not set'} />
          <InfoRow label="Phone stand" value={settings.phoneStandAvailable ? 'Available' : 'Not set'} />
          <Text style={styles.panelCopy}>
            Hale checks framing before movement sessions and keeps normal sessions away from self-view video.
          </Text>
          <View style={styles.buttonRow}>
            <SecondaryButton title="Edit safety profile" onPress={onOpenSafetyProfile} style={styles.rowButton} />
            <SecondaryButton title="Open camera setup" onPress={onOpenCameraSetup} style={styles.rowButton} />
          </View>
        </DetailPanel>
      );
    }

    if (openSection === 'plan') {
      return (
        <DetailPanel>
          <Text style={styles.panelCopy}>
            These preferences shape future sessions. Your current 4-week map stays in Plan.
          </Text>
          <Text style={styles.panelTitle}>Preferred days</Text>
          <View style={styles.dayGrid}>
            {DAYS.map((day) => (
              <Segment key={day} label={day} selected={preferredDays.includes(day)} onPress={() => toggleDay(day)} compact />
            ))}
          </View>
          <Text style={[styles.panelTitle, styles.panelGap]}>Session feel</Text>
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
        </DetailPanel>
      );
    }

    if (openSection === 'voice') {
      return (
        <DetailPanel>
          <Text style={styles.panelTitle}>Current voice: {currentVoice.label}</Text>
          <View style={styles.segmentStack}>
            {VOICE_OPTIONS.map((voice) => (
              <Segment
                key={voice.id}
                label={voice.label}
                body={voice.available ? voice.description : `${voice.description} - coming soon`}
                selected={voice.id === settings.voiceId}
                onPress={() => voice.available && onSettingsChange({ ...settings, voiceId: voice.id })}
              />
            ))}
          </View>
        </DetailPanel>
      );
    }

    if (openSection === 'equipment') {
      return (
        <DetailPanel>
          <Text style={styles.panelCopy}>
            Hale always keeps a zero-equipment path. Optional items simply unlock substitutions.
          </Text>
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
          <ToggleRow label="Bottom stair" value={equipment.stair} onValueChange={() => onToggleEquipment('stair')} />
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
        </DetailPanel>
      );
    }

    if (openSection === 'privacy') {
      return (
        <DetailPanel>
          <InfoRow label="Account" value="Managed below" />
          <InfoRow label="Movement data" value="Progress syncs to your account" />
          <InfoRow label="Camera" value="Skeleton view only, never a mirror" />
          <InfoRow
            label="Support circle"
            value={supportConnection ? 'Local contact saved' : 'Private'}
          />
          <Text style={styles.panelCopy}>
            Hale stores movement estimates and preferences. Normal sessions do not show self-view video.
          </Text>
        </DetailPanel>
      );
    }

    return (
      <DetailPanel>
        <Text style={styles.helpCopy}>
          Revisit camera setup any time. Explore holds reference guides and optional practice; Today remains the place to start the next step.
        </Text>
        <SecondaryButton title="Open camera setup" onPress={onOpenCameraSetup} style={styles.fullButton} />
      </DetailPanel>
    );
  };

  if (openSection) {
    const copy = SECTION_COPY[openSection];

    return (
      <Screen contentStyle={styles.screenContent}>
        <View style={styles.detailHeaderRow}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={() => setOpenSection(null)}
            accessibilityRole="button"
            accessibilityLabel="Back to settings"
          >
            <BackChevronIcon />
          </Pressable>
          <View style={styles.detailHeaderCopy}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.detailSubtitle}>{copy.subtitle}</Text>
          </View>
        </View>
        {renderSectionContent()}
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Settings</Text>
        <Pressable
          style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
          onPress={() => openProfileSection('help')}
          accessibilityRole="button"
          accessibilityLabel="Open settings help"
        >
          <HeaderHelpIcon />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
        onPress={() => openProfileSection('details')}
        accessibilityRole="button"
        accessibilityLabel="Edit personal details"
      >
        <View style={styles.avatar}>
          <MovementMark />
        </View>
        <View style={styles.profileCopy}>
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
            <View style={styles.signedPill}>
              <Text style={styles.signedPillText}>Local</Text>
            </View>
          </View>
          <Text style={styles.profileAge}>{profile.age === null ? 'Age not set' : `Age ${profile.age}`}</Text>
          <View style={styles.goalRow}>
            <LeafIcon />
            <Text style={styles.goalText} numberOfLines={1}>{goalText}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.menuCard}>
        <ProfileMenuRow
          title="Camera & Safety"
          icon="shield"
          onPress={() => openProfileSection('safety')}
          showDivider
        />
        <ProfileMenuRow
          title="Plan Preferences"
          icon="sliders"
          onPress={() => openProfileSection('plan')}
          showDivider
        />
        <ProfileMenuRow
          title="Trainer Voice"
          icon="volume"
          onPress={() => openProfileSection('voice')}
          showDivider
        />
        <ProfileMenuRow
          title="Equipment Setup"
          icon="dumbbell"
          onPress={() => openProfileSection('equipment')}
          showDivider
        />
        <ProfileMenuRow
          title="Privacy"
          icon="lock"
          onPress={() => openProfileSection('privacy')}
          showDivider
        />
        <ProfileMenuRow
          title="Help"
          icon="help"
          onPress={() => openProfileSection('help')}
        />
      </View>

      <AccountAuthCard context="settings" />
    </Screen>
  );
}

function ProfileMenuRow({
  title,
  icon,
  onPress,
  showDivider,
}: {
  title: string;
  icon: MenuIconName;
  onPress: () => void;
  showDivider?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuRow,
        showDivider && styles.menuDivider,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <MenuIcon name={icon} />
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
  );
}

function DetailPanel({ children }: { children: React.ReactNode }) {
  return <View style={styles.detailPanel}>{children}</View>;
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

function MovementMark() {
  return (
    <Svg width={58} height={58} viewBox="0 0 64 64" fill="none">
      <Path
        d="M34 9 C32 18, 23 20, 23 29 C23 34, 28 37, 33 39"
        stroke={colors.accentDeep}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Path
        d="M38 16 C35 23, 32 27, 25 31 C18 35, 17 43, 12 49"
        stroke={colors.accentDeep}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Path
        d="M29 28 C37 32, 41 38, 42 48"
        stroke={colors.accentDeep}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Circle cx={30} cy={18} r={3.1} fill={colors.accentDeep} />
    </Svg>
  );
}

function LeafIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 4 C10 5, 5.5 10, 6.5 17 C12 17, 17 12, 19 4 Z"
        stroke={colors.accentDeep}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 18 C9.5 14, 12.5 11.5, 16 9.5" stroke={colors.accentDeep} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function HeaderHelpIcon() {
  return (
    <Svg width={27} height={27} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.4} stroke={colors.accentDeep} strokeWidth={1.7} />
      <Path
        d="M9.8 9.5 C10.1 8.1, 11 7.4, 12.3 7.4 C13.8 7.4, 14.8 8.3, 14.8 9.6 C14.8 11.7, 12 11.8, 12 14"
        stroke={colors.accentDeep}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 17 H12.1" stroke={colors.accentDeep} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function BackChevronIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5.5 L8.5 12 L15 18.5"
        stroke={colors.accentDeep}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type MenuIconName = 'shield' | 'sliders' | 'volume' | 'dumbbell' | 'lock' | 'help';

function MenuIcon({ name }: { name: MenuIconName }) {
  const stroke = colors.accentDeep;
  const common = {
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <View style={styles.menuIcon}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        {name === 'shield' ? (
          <>
            <Path d="M12 3.5 L18.5 6 V11.2 C18.5 15.8 15.7 18.8 12 20.5 C8.3 18.8 5.5 15.8 5.5 11.2 V6 Z" {...common} />
            <Path d="M9.2 12 L11.1 13.9 L15 9.8" {...common} />
          </>
        ) : null}
        {name === 'sliders' ? (
          <>
            <Path d="M4 7 H20" {...common} />
            <Path d="M4 12 H20" {...common} />
            <Path d="M4 17 H20" {...common} />
            <Circle cx={9} cy={7} r={1.8} {...common} />
            <Circle cx={15} cy={12} r={1.8} {...common} />
            <Circle cx={8} cy={17} r={1.8} {...common} />
          </>
        ) : null}
        {name === 'volume' ? (
          <>
            <Path d="M4.5 10 V14 H8 L12 17 V7 L8 10 Z" {...common} />
            <Path d="M15 9 C16 10, 16.5 11, 16.5 12 C16.5 13, 16 14, 15 15" {...common} />
            <Path d="M17.5 6.8 C19 8.3, 20 10, 20 12 C20 14, 19 15.7, 17.5 17.2" {...common} />
          </>
        ) : null}
        {name === 'dumbbell' ? (
          <>
            <Path d="M8 12 H16" {...common} />
            <Path d="M5.2 8.5 V15.5" {...common} />
            <Path d="M7.4 9.8 V14.2" {...common} />
            <Path d="M16.6 9.8 V14.2" {...common} />
            <Path d="M18.8 8.5 V15.5" {...common} />
          </>
        ) : null}
        {name === 'lock' ? (
          <>
            <Rect x={6.5} y={10} width={11} height={9} rx={2} {...common} />
            <Path d="M9 10 V7.8 C9 5.8, 10.2 4.7, 12 4.7 C13.8 4.7, 15 5.8, 15 7.8 V10" {...common} />
            <Path d="M12 13.5 V15.7" {...common} />
          </>
        ) : null}
        {name === 'help' ? (
          <>
            <Circle cx={12} cy={12} r={8.4} {...common} />
            <Path d="M9.8 9.5 C10.1 8.1, 11 7.4, 12.3 7.4 C13.8 7.4, 14.8 8.3, 14.8 9.6 C14.8 11.7, 12 11.8, 12 14" {...common} />
            <Path d="M12 17 H12.1" {...common} />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    maxWidth: spacing.pageMaxWidth,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageTop,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  headerRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...type.pageTitle },
  headerIconButton: {
    width: minTapTarget,
    height: minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  backButton: {
    width: minTapTarget,
    height: minTapTarget,
    marginLeft: -spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 3,
  },
  detailSubtitle: {
    ...type.pageSubtitle,
    marginTop: spacing.xs,
  },
  profileCard: {
    minHeight: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEEDE2',
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileName: {
    ...type.cardRowTitle,
    flex: 1,
    color: colors.primaryText,
  },
  signedPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  signedPillText: {
    ...type.caption,
    lineHeight: 16,
    color: colors.accentDeep,
  },
  profileAge: {
    ...type.cardBody,
    marginTop: 3,
    color: colors.primaryText,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  goalText: {
    ...type.caption,
    flex: 1,
    color: colors.primaryText,
  },
  menuCard: {
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  menuRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgSurface,
  },
  menuDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  menuIcon: {
    width: 38,
    alignItems: 'center',
  },
  menuTitle: {
    ...type.cardRowTitle,
    flex: 1,
    color: colors.primaryText,
  },
  chevron: {
    ...type.h2,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  detailPanel: {
    padding: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  field: { marginTop: spacing.lg },
  fieldLabel: { ...type.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    ...type.body,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
  },
  inputMultiline: { minHeight: 92, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  rowButton: { flexGrow: 1, flexBasis: '45%', shadowOpacity: 0 },
  fullButton: { marginTop: spacing.lg, shadowOpacity: 0 },
  panelTitle: {
    ...type.cardRowTitle,
    fontFamily: fonts.sansMedium,
    color: colors.primaryText,
  },
  panelCopy: {
    ...type.cardBody,
    marginBottom: spacing.md,
  },
  panelGap: {
    marginTop: spacing.lg,
  },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  daySegment: {
    minWidth: 48,
    minHeight: 42,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  segmentStack: { gap: spacing.sm, marginTop: spacing.sm },
  segment: {
    minHeight: 62,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  segmentSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  segmentTitle: { ...type.bodySmall },
  segmentTitleSelected: { color: colors.accentDeep },
  segmentBody: { ...type.caption, marginTop: 2 },
  segmentBodySelected: { color: colors.sageDeep },
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
  helpCopy: {
    ...type.caption,
    color: colors.textSecondary,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
