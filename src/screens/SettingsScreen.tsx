/**
 * Settings screen: compact local profile hub, plan preferences, safety setup,
 * equipment, account actions, privacy, and help.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { ActivityLevel, AgeBand, AvailableEquipment } from '../adherence';
import { getLifeGoalDisplayText } from '../adherence';
import { VoiceChannel } from '../audio/voicePlayer';
import { AccountAuthCard } from '../components/AccountAuthCard';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { Screen, ToggleRow } from '../components/ui';
import { controlledBetaEquipmentPositioning } from '../haleFlow';
import {
  AGE_RANGE_OPTIONS,
  AppSettings,
  STARTING_PACE_OPTIONS,
  ageBandForAge,
  ageDisplayLabel,
  getVoice,
  representativeAgeForAgeBand,
  startingEffortLabel,
  UserProfile,
  VOICE_OPTIONS,
} from '../profile';
import { EquipmentProfile } from '../training';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const VOICE_PREVIEW_CUE = 'framing-ready' as const;

type ProfileSection =
  | 'details'
  | 'safety'
  | 'plan'
  | 'voice'
  | 'equipment'
  | 'reminders'
  | 'account'
  | 'privacy';

type VoiceCatalogOption = (typeof VOICE_OPTIONS)[number];

const SECTION_COPY: Record<ProfileSection, { title: string; subtitle: string }> = {
  details: {
    title: 'Your Details',
    subtitle: 'Update your name, age range, and movement goal.',
  },
  safety: {
    title: 'Camera setup',
    subtitle: 'Review camera privacy and where to place your phone.',
  },
  plan: {
    title: 'Workout Days & Effort',
    subtitle: 'Choose which days work best and how hard workouts should feel.',
  },
  voice: {
    title: 'Trainer Voice',
    subtitle: 'Choose the voice for check-ups and workouts.',
  },
  equipment: {
    title: 'Equipment',
    subtitle: 'Choose what Hale can use safely at home.',
  },
  reminders: {
    title: 'Workout Reminders',
    subtitle: 'Choose whether Hale should remind you about workouts when reminders are ready.',
  },
  account: {
    title: 'Account & Data',
    subtitle: 'Manage sign-in and your Hale data.',
  },
  privacy: {
    title: 'Privacy & Data',
    subtitle: 'See what Hale shows, saves, and does not save.',
  },
};

type SettingsScreenProps = {
  profile: UserProfile;
  settings: AppSettings;
  equipment: EquipmentProfile;
  preferredDays: readonly string[];
  startingEffort: ActivityLevel;
  onProfileChange: (next: UserProfile) => void;
  onSettingsChange: (next: AppSettings) => void;
  onToggleEquipment: (key: keyof EquipmentProfile) => void;
  onToggleAvailableEquipment: (item: AvailableEquipment) => void;
  onPreferredDaysChange: (days: string[]) => void;
  onStartingEffortChange: (startingEffort: ActivityLevel) => void;
  onOpenLifeGoal: () => void;
  onOpenSafetyProfile: () => void;
  onOpenCameraSetup: () => void;
  onReplayOnboardingForDev?: () => void;
  onOpenPoseBenchmarkForDiagnostics?: () => void;
  onBack?: () => void;
};

export function SettingsScreen(props: SettingsScreenProps) {
  return <SettingsScreenContent {...props} />;
}

function SettingsScreenContent({
  profile,
  settings,
  equipment,
  preferredDays,
  startingEffort,
  onProfileChange,
  onSettingsChange,
  onToggleEquipment,
  onToggleAvailableEquipment,
  onPreferredDaysChange,
  onStartingEffortChange,
  onOpenLifeGoal,
  onOpenSafetyProfile,
  onOpenCameraSetup,
  onReplayOnboardingForDev,
  onOpenPoseBenchmarkForDiagnostics,
  onBack,
}: SettingsScreenProps) {
  const [openSection, setOpenSection] = React.useState<ProfileSection | null>(null);
  const [name, setName] = React.useState(profile.name);
  const profileAgeBand = profile.ageBand ?? ageBandForAge(profile.age);
  const [selectedAgeBand, setSelectedAgeBand] = React.useState<AgeBand | null>(profileAgeBand);
  const voicePreviewRef = React.useRef<VoiceChannel | null>(null);
  const available = profile.safetyProfile?.availableEquipment ?? ['chair', 'wall'];
  const displayName = profile.name.trim() || 'Your details';
  const profileAgeLabel = ageDisplayLabel(null, selectedAgeBand);
  const goalText =
    profile.goal.trim() ||
    (profile.lifeGoal ? getLifeGoalDisplayText(profile.lifeGoal) : 'Set a movement goal');
  const currentVoice = getVoice(settings.voiceId);
  const effortLabel = startingEffortLabel(startingEffort);
  const planSummary = `${preferredDaysSummary(preferredDays)} · ${effortLabel}`;
  const setupSummary = equipmentSummary({
    available,
    equipment,
    phoneStandAvailable: settings.phoneStandAvailable,
  });
  const cameraSummary = `${settings.phoneStandAvailable ? 'Phone stand available' : 'Phone stand not set'} · Camera privacy`;
  const showDeveloperSettings = __DEV__ || !!onOpenPoseBenchmarkForDiagnostics;

  React.useEffect(() => setName(profile.name), [profile.name]);
  React.useEffect(() => setSelectedAgeBand(profileAgeBand), [profileAgeBand]);
  React.useEffect(() => () => voicePreviewRef.current?.stop(), []);

  const openProfileSection = (section: ProfileSection) => setOpenSection(section);
  const previewVoice = React.useCallback((voiceId: string) => {
    voicePreviewRef.current?.stop();
    const channel = new VoiceChannel(voiceId);
    voicePreviewRef.current = channel;
    channel.speak([VOICE_PREVIEW_CUE], 100);
  }, []);

  const commitName = () => onProfileChange({ ...profile, name: name.trim() });
  const commitAgeBand = (ageBand: AgeBand | null) => {
    const representativeAge = representativeAgeForAgeBand(ageBand);
    const now = new Date().toISOString();
    setSelectedAgeBand(ageBand);
    onProfileChange({
      ...profile,
      age: null,
      ageBand,
      safetyProfile: profile.safetyProfile
        ? {
            ...profile.safetyProfile,
            age: representativeAge ?? undefined,
            ageBand: ageBand ?? undefined,
            updatedAt: now,
          }
        : profile.safetyProfile,
    });
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
        <>
          <DetailOverview
            icon="account"
            title={displayName}
            body="Name is used for greetings. Age range and goal help Hale use plain, personal wording."
            meta={profileAgeLabel}
          />

          <PersonalDetailsCard
            name={name}
            onNameChange={setName}
            onNameBlur={commitName}
            ageBand={selectedAgeBand}
            onAgeBandChange={commitAgeBand}
            movementGoal={goalText}
            onOpenLifeGoal={onOpenLifeGoal}
          />

          <DetailCard
            title="Safety setup"
            body="Update this if your pain, balance confidence, equipment, or home setup has changed."
          >
            <View style={styles.setupActionStack}>
              <SetupActionTile
                icon="shield"
                title="Safety profile"
                body="Change the support and comfort details Hale uses before sessions."
                onPress={onOpenSafetyProfile}
              />
            </View>
          </DetailCard>
        </>
      );
    }

    if (openSection === 'safety') {
      return (
        <>
          <DetailOverview
            icon="camera"
            title="Camera ready"
            body="Hale checks that your whole body is in view before a check-up or guided session starts."
            meta="Private camera use"
          />

          <SafetyReadinessCard
            phoneStandAvailable={settings.phoneStandAvailable}
          />

          <SafetyActionsCard
            onOpenCameraSetup={onOpenCameraSetup}
          />
        </>
      );
    }

    if (openSection === 'plan') {
      return (
        <>
          <DetailOverview
            icon="sliders"
            title={planSummary}
            body="These choices guide future workouts. Hale still uses your safety setup and pain notes before choosing movements."
            meta="Used for future workouts"
          />

          <PreferenceCard
            title="Training days"
            subtitle="Choose the days that usually work best for you."
            meta={trainingDayMeta(preferredDays)}
          >
            <DayPreferencePicker selectedDays={preferredDays} onToggleDay={toggleDay} />
          </PreferenceCard>

          <PreferenceCard
            title="Workout effort"
            subtitle="Choose how hard future workouts should feel at the start. Hale may still make a session easier if your safety setup or pain notes call for it."
            meta={effortLabel}
          >
            <SessionFeelPicker selected={startingEffort} onSelect={onStartingEffortChange} />
          </PreferenceCard>
        </>
      );
    }

    if (openSection === 'voice') {
      return (
        <VoiceSelectorCard
          selectedVoiceId={settings.voiceId}
          onSelectVoice={(voiceId) => onSettingsChange({ ...settings, voiceId })}
          onPreviewVoice={previewVoice}
        />
      );
    }

    if (openSection === 'equipment') {
      return (
        <>
          <DetailOverview
            icon="dumbbell"
            title={setupSummary}
            body="Hale uses this list to choose exercises that fit your home. Start with a sturdy chair and a wall or counter. Optional items are only used when you turn them on."
            meta={controlledBetaEquipmentPositioning.shortLabel}
          />

          <DetailCard
            title="Basic setup"
            body="Keep these on if you have them. Hale uses a chair and nearby support for many check-ups and beginner workouts."
          >
            <View style={styles.toggleStack}>
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
            </View>
          </DetailCard>

          <DetailCard
            title="Optional items"
            body="Turn on only the items you have and feel safe using. Hale will choose other movements when something is off."
          >
            <View style={styles.toggleStack}>
              <ToggleRow
                label="Bottom stair"
                description="Use only if it is low, stable, and near support."
                value={equipment.stair}
                onValueChange={() => onToggleEquipment('stair')}
              />
              <ToggleRow
                label="Resistance band"
                description="Used for some upper-body pulling exercises."
                value={equipment.band}
                onValueChange={() => onToggleEquipment('band')}
              />
              <ToggleRow
                label="Door anchor for band rows"
                description="Only turn this on if you have a proper band door anchor."
                value={available.includes('door_anchor')}
                onValueChange={() => onToggleAvailableEquipment('door_anchor')}
              />
              <ToggleRow
                label="Mini band"
                description="Used for some hip and side-step exercises."
                value={!!equipment.miniBand}
                onValueChange={() => onToggleEquipment('miniBand')}
              />
              <ToggleRow
                label="Backpack or light weight"
                description="Used only for gentle added load."
                value={!!equipment.load}
                onValueChange={() => onToggleEquipment('load')}
              />
              <ToggleRow
                label="Floor space for mat exercises"
                description="Enough clear space to lie down safely."
                value={available.includes('floor_space')}
                onValueChange={() => onToggleAvailableEquipment('floor_space')}
              />
            </View>
          </DetailCard>

          <DetailCard
            title="Camera setup"
            body="A steady phone position makes check-ups easier to repeat. A shelf or stack of books is fine if the phone will not slide."
          >
            <ToggleRow
              label="Stable phone stand or shelf"
              value={settings.phoneStandAvailable}
              onValueChange={(v) => onSettingsChange({ ...settings, phoneStandAvailable: v })}
            />
          </DetailCard>
        </>
      );
    }

    if (openSection === 'reminders') {
      return (
        <>
          <DetailOverview
            icon="bell"
            title="Phone reminders are not available yet"
            body="You can still save your choice for later. Hale will not send workout notifications right now."
            meta="No notifications today"
          />

          <DetailCard
            title="Your reminder choice"
            body="Turn this on if you would like Hale to use workout reminders when they are added."
          >
            <ToggleRow
              label="Use workout reminders when available"
              description="This only saves your choice. It will not send a notification today."
              value={settings.remindersEnabled}
              onValueChange={(v) => onSettingsChange({ ...settings, remindersEnabled: v })}
            />
            <InfoRow label="Today" value="No notifications will be sent" />
          </DetailCard>
        </>
      );
    }

    if (openSection === 'account') {
      return <AccountAuthCard context="settings" />;
    }

    if (openSection === 'privacy') {
      return (
        <>
          <DetailOverview
            icon="lock"
            title="Private by default"
            body="During check-ups and workouts, Hale uses the camera to measure movement. You do not see a video of yourself, and Hale does not save your video."
            meta="Video not saved"
          />

          <PrivacyStorageCard />
        </>
      );
    }

    return null;
  };

  if (openSection) {
    const copy = SECTION_COPY[openSection];

    return (
      <Screen contentStyle={styles.screenContent}>
        <View style={styles.detailBackRow}>
          <BackArrowButton
            accessibilityLabel="Back to settings"
            onPress={() => setOpenSection(null)}
          />
        </View>
        <View style={styles.detailHeader}>
          <View style={styles.titleGroup}>
            <HeaderLogo />
            <Text style={styles.title}>{copy.title}</Text>
          </View>
          <Text style={styles.detailSubtitle}>{copy.subtitle}</Text>
        </View>
        {renderSectionContent()}
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screenContent}>
      {onBack ? <BackArrowButton accessibilityLabel="Back" onPress={onBack} /> : null}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <HeaderLogo />
          <Text style={styles.title}>Settings</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
        onPress={() => openProfileSection('details')}
        accessibilityRole="button"
        accessibilityLabel="Edit personal details"
      >
        <View style={styles.avatar}>
          <ProfileDetailsGlyph />
        </View>
        <View style={styles.profileCopy}>
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <Text style={styles.profileAge}>
            {profileAgeLabel}
          </Text>
          <View style={styles.goalBlock}>
            <Text style={styles.goalLabel}>Movement goal</Text>
            <Text style={styles.goalText} numberOfLines={2}>
              {goalText}
            </Text>
          </View>
        </View>
      </Pressable>

      <SettingsSection title="Workouts">
        <ProfileMenuRow
          title="Schedule & Effort"
          subtitle={`${preferredDaysSummary(preferredDays)} · ${effortLabel} effort`}
          icon="sliders"
          onPress={() => openProfileSection('plan')}
          showDivider
        />
        <ProfileMenuRow
          title="Equipment"
          subtitle={setupSummary}
          icon="dumbbell"
          onPress={() => openProfileSection('equipment')}
          showDivider
        />
        <ProfileMenuRow
          title="Trainer Voice"
          subtitle={`${currentVoice.label} guides check-ups and workouts`}
          icon="volume"
          onPress={() => openProfileSection('voice')}
          showDivider
        />
        <ProfileMenuRow
          title="Workout Reminders"
          subtitle={
            settings.remindersEnabled
              ? 'On for later · no notifications today'
              : 'Off · no notifications today'
          }
          icon="bell"
          onPress={() => openProfileSection('reminders')}
        />
      </SettingsSection>

      <SettingsSection title="Camera & privacy">
        <ProfileMenuRow
          title="Camera setup"
          subtitle={cameraSummary}
          icon="camera"
          onPress={() => openProfileSection('safety')}
          showDivider
        />
        <ProfileMenuRow
          title="Privacy & Data"
          subtitle="Video not saved · results saved"
          icon="lock"
          onPress={() => openProfileSection('privacy')}
        />
      </SettingsSection>

      <SettingsSection title="Account & data">
        <ProfileMenuRow
          title="Account & Data"
          subtitle="Sign in, export, or manage your data"
          icon="account"
          onPress={() => openProfileSection('account')}
        />
      </SettingsSection>

      {showDeveloperSettings ? (
        <SettingsSection title="Developer">
          <View style={[styles.menuRow, styles.menuDivider]}>
            <MenuIcon name="sliders" />
            <View style={styles.menuCopy}>
              <Text style={styles.menuTitle}>Use mock app data</Text>
              <Text style={styles.menuSubtitle}>
                Preview Hale after a check-up and a few completed sessions.
              </Text>
            </View>
            <Switch
              value={settings.devMockDataEnabled}
              onValueChange={(enabled) =>
                onSettingsChange({ ...settings, devMockDataEnabled: enabled })
              }
              trackColor={{ false: colors.borderHairline, true: colors.sage }}
              thumbColor={settings.devMockDataEnabled ? colors.accent : colors.bgSurface}
              ios_backgroundColor={colors.borderHairline}
              accessibilityLabel="Use mock app data"
            />
          </View>
          {onReplayOnboardingForDev ? (
            <ProfileMenuRow
              title="Replay onboarding"
              subtitle="Open the first-run flow without clearing app data."
              icon="sliders"
              onPress={onReplayOnboardingForDev}
            />
          ) : null}
          {onOpenPoseBenchmarkForDiagnostics ? (
            <ProfileMenuRow
              title="Pose overlay benchmark"
              subtitle="Run renderer latency modes on this device."
              icon="sliders"
              onPress={onOpenPoseBenchmarkForDiagnostics}
            />
          ) : null}
        </SettingsSection>
      ) : null}
    </Screen>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.menuCard}>{children}</View>
    </View>
  );
}

function ProfileMenuRow({
  title,
  subtitle,
  icon,
  onPress,
  showDivider,
}: {
  title: string;
  subtitle?: string;
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
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
  );
}

function DetailOverview({
  icon,
  title,
  body,
  meta,
}: {
  icon: MenuIconName;
  title: string;
  body?: string;
  meta?: string;
}) {
  return (
    <View style={styles.detailOverview}>
      <View style={styles.detailOverviewIcon}>
        <MenuIcon name={icon} />
      </View>
      <View style={styles.detailOverviewCopy}>
        <Text style={styles.detailOverviewTitle}>{title}</Text>
        {body ? <Text style={styles.detailOverviewBody}>{body}</Text> : null}
        {meta ? <Text style={styles.detailOverviewMeta}>{meta}</Text> : null}
      </View>
    </View>
  );
}

function DetailCard({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailCardTitle}>{title}</Text>
      {body ? <Text style={styles.detailCardBody}>{body}</Text> : null}
      <View style={styles.detailCardContent}>{children}</View>
    </View>
  );
}

function VoiceSelectorCard({
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
}: {
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  onPreviewVoice: (voiceId: string) => void;
}) {
  return (
    <View style={styles.voiceSelectorCard}>
      <View style={styles.voiceSelectorHeader}>
        <Text style={styles.voiceSelectorTitle}>Voice</Text>
        <Text style={styles.voiceSelectorBody}>
          Tap a voice to use it next time.
        </Text>
      </View>
      <View style={styles.voiceOptionList}>
        {VOICE_OPTIONS.map((voice, index) => (
          <VoiceOptionRow
            key={voice.id}
            voice={voice}
            selected={voice.id === selectedVoiceId}
            showDivider={index > 0}
            onSelect={() => voice.available && onSelectVoice(voice.id)}
            onPreview={() => voice.available && onPreviewVoice(voice.id)}
          />
        ))}
      </View>
    </View>
  );
}

function VoiceOptionRow({
  voice,
  selected,
  showDivider,
  onSelect,
  onPreview,
}: {
  voice: VoiceCatalogOption;
  selected: boolean;
  showDivider: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const disabled = !voice.available;
  const rowLabel = `${voice.label}${selected ? ', selected' : ''}`;

  return (
    <View
      style={[
        styles.voiceOptionRow,
        showDivider && styles.voiceOptionDivider,
        selected && styles.voiceOptionRowSelected,
        disabled && styles.voiceOptionRowDisabled,
      ]}
    >
      <Pressable
        style={({ pressed }) => [styles.voicePreviewButton, pressed && !disabled && styles.pressed]}
        onPress={onPreview}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Preview ${voice.label}`}
      >
        <MenuIcon name="volume" />
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.voiceOptionSelectArea, pressed && !disabled && styles.pressed]}
        onPress={onSelect}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        accessibilityLabel={rowLabel}
      >
        <View style={styles.voiceOptionCopy}>
          <Text style={[styles.voiceOptionTitle, selected && styles.voiceOptionTitleSelected]}>
            {voice.label}
          </Text>
          <Text style={styles.voiceOptionBody}>
            {voice.available ? voice.description : `${voice.description} - coming soon`}
          </Text>
        </View>
        <SelectionIndicator selected={selected} />
      </Pressable>
    </View>
  );
}

function SafetyReadinessCard({ phoneStandAvailable }: { phoneStandAvailable: boolean }) {
  const readyCount = 1 + (phoneStandAvailable ? 1 : 0);
  return (
    <View style={styles.safetyCard}>
      <View style={styles.safetyCardHeader}>
        <View style={styles.safetyCardTitleGroup}>
          <Text style={styles.safetyCardTitle}>What Hale uses for camera setup</Text>
          <Text style={styles.safetyCardBody}>
            These help Hale see your movement clearly and keep each setup repeatable.
          </Text>
        </View>
        <View style={styles.safetyScorePill}>
          <Text style={styles.safetyScoreText}>{readyCount}/2 ready</Text>
        </View>
      </View>

      <View style={styles.safetyStatusList}>
        <SafetyStatusRow
          label="Camera privacy"
          body="Hale measures movement without showing your video."
          value="Private"
          tone="ready"
          first
        />
        <SafetyStatusRow
          label="Phone stand"
          body={
            phoneStandAvailable
              ? 'Your phone stand helps keep placement steady.'
              : 'Use a stand, shelf, or stack of books if the phone will not slide.'
          }
          value={phoneStandAvailable ? 'Available' : 'Not set'}
          tone={phoneStandAvailable ? 'ready' : 'neutral'}
        />
      </View>
    </View>
  );
}

function SafetyStatusRow({
  label,
  body,
  value,
  tone,
  first,
}: {
  label: string;
  body: string;
  value: string;
  tone: 'ready' | 'attention' | 'neutral';
  first?: boolean;
}) {
  return (
    <View style={[styles.safetyStatusRow, !first && styles.safetyStatusDivider]}>
      <View style={styles.safetyStatusCopy}>
        <Text style={styles.safetyStatusLabel}>{label}</Text>
        <Text style={styles.safetyStatusBody}>{body}</Text>
      </View>
      <View
        style={[
          styles.safetyStatusPill,
          tone === 'attention' && styles.safetyStatusPillAttention,
          tone === 'neutral' && styles.safetyStatusPillNeutral,
        ]}
      >
        <Text
          style={[
            styles.safetyStatusPillText,
            tone === 'attention' && styles.safetyStatusPillTextAttention,
            tone === 'neutral' && styles.safetyStatusPillTextNeutral,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function SafetyActionsCard({
  onOpenCameraSetup,
}: {
  onOpenCameraSetup: () => void;
}) {
  return (
    <View style={styles.safetyCard}>
      <View style={styles.safetyCardHeader}>
        <View style={styles.safetyCardTitleGroup}>
          <Text style={styles.safetyCardTitle}>Make changes</Text>
          <Text style={styles.safetyCardBody}>
            Use this if you want to review where to place your phone.
          </Text>
        </View>
      </View>

      <View style={styles.safetyActionList}>
        <SafetyActionRow
          icon="camera"
          title="Open camera setup"
          body="Practice where to place the phone and where to stand."
          onPress={onOpenCameraSetup}
          first
        />
      </View>
    </View>
  );
}

function SafetyActionRow({
  icon,
  title,
  body,
  onPress,
  first,
}: {
  icon: MenuIconName;
  title: string;
  body: string;
  onPress: () => void;
  first?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.safetyActionRow,
        !first && styles.safetyActionDivider,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.safetyActionIcon}>
        <MenuIcon name={icon} />
      </View>
      <View style={styles.safetyActionCopy}>
        <Text style={styles.safetyActionTitle}>{title}</Text>
        <Text style={styles.safetyActionBody}>{body}</Text>
      </View>
      <Text style={styles.safetyActionChevron}>{'>'}</Text>
    </Pressable>
  );
}

function PersonalDetailsCard({
  name,
  onNameChange,
  onNameBlur,
  ageBand,
  onAgeBandChange,
  movementGoal,
  onOpenLifeGoal,
}: {
  name: string;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  ageBand: AgeBand | null;
  onAgeBandChange: (value: AgeBand | null) => void;
  movementGoal: string;
  onOpenLifeGoal: () => void;
}) {
  return (
    <View style={styles.personalCard}>
      <View style={styles.personalCardHeader}>
        <View style={styles.personalCardHeaderCopy}>
          <Text style={styles.personalCardTitle}>Your details</Text>
          <Text style={styles.personalCardBody}>
            Hale uses these details to personalize your plan and explain your results. You only need to choose an age range.
          </Text>
        </View>
        <View style={styles.personalCardIcon}>
          <MenuIcon name="account" />
        </View>
      </View>

      <View style={styles.personalFieldGroup}>
        <View style={styles.personalIdentityPanel}>
          <View style={styles.personalNameField}>
            <Text style={styles.personalFieldLabel}>Name</Text>
            <TextInput
              style={styles.personalFieldInput}
              value={name}
              onChangeText={onNameChange}
              onBlur={onNameBlur}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
              accessibilityLabel="Name"
            />
          </View>
        </View>

        <View style={styles.personalAgeRangePanel}>
          <View style={styles.personalAgeRangeHeader}>
            <Text style={styles.personalFieldLabel}>Age range</Text>
            <Text style={styles.personalAgeRangeValue}>{personalAgeRangeSummary(ageBand)}</Text>
          </View>
          <View style={styles.personalAgeOptionGrid}>
            {AGE_RANGE_OPTIONS.map((option) => {
              const selected = ageBand === option.value;
              const wideOption = option.label === 'Prefer not to say' || option.label === 'Under 45';
              return (
                <Pressable
                  key={option.label}
                  style={({ pressed }) => [
                    styles.personalAgeOption,
                    wideOption ? styles.personalAgeOptionWide : styles.personalAgeOptionCompact,
                    selected && styles.personalAgeOptionSelected,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => onAgeBandChange(option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Age range ${option.label}`}
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[styles.personalAgeOptionText, selected && styles.personalAgeOptionTextSelected]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.88}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.personalGoalPanel, pressed && styles.pressed]}
          onPress={onOpenLifeGoal}
          accessibilityRole="button"
          accessibilityLabel={`Change movement goal. Current goal: ${movementGoal}`}
        >
          <View style={styles.personalGoalRow}>
            <View style={styles.personalGoalCopy}>
              <Text style={styles.personalFieldLabel}>Movement goal</Text>
              <View style={styles.personalGoalValueRow}>
                <Text style={styles.personalGoalValue} numberOfLines={2}>
                  {movementGoal}
                </Text>
                <Text style={styles.personalGoalChevron}>{'>'}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function personalAgeRangeSummary(ageBand: AgeBand | null): string {
  const label = ageDisplayLabel(null, ageBand);
  if (label === 'Age not set') return 'Not set';
  if (label === 'Age under 45') return 'Under 45';
  return label.replace(/^Age\s/, '');
}

function SetupActionTile({
  icon,
  title,
  body,
  onPress,
}: {
  icon: MenuIconName;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.setupActionTile, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.setupActionIcon}>
        <MenuIcon name={icon} />
      </View>
      <View style={styles.setupActionCopy}>
        <Text style={styles.setupActionTitle}>{title}</Text>
        <Text style={styles.setupActionBody}>{body}</Text>
      </View>
      <Text style={styles.setupActionChevron}>{'>'}</Text>
    </Pressable>
  );
}

function InfoRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <View style={[styles.infoRow, first && styles.infoRowFirst]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PrivacyStorageCard() {
  return (
    <DetailCard
      title="What Hale saves"
      body="Hale saves the information it needs to keep your plan and results up to date."
    >
      <View style={styles.privacyLedger}>
        <PrivacyLedgerRow
          icon="camera"
          label="Camera video"
          body="Not shown and not saved."
          value="Not saved"
          first
        />
        <PrivacyLedgerRow
          icon="sliders"
          label="Check-up and workout results"
          body="Saved so you can compare your progress over time."
          value="Saved"
        />
        <PrivacyLedgerRow
          icon="account"
          label="Settings"
          body="Saved so Hale remembers your workout days, effort, equipment, and voice."
          value="Saved"
        />
      </View>
    </DetailCard>
  );
}

function PrivacyLedgerRow({
  icon,
  label,
  body,
  value,
  first,
}: {
  icon: MenuIconName;
  label: string;
  body: string;
  value: string;
  first?: boolean;
}) {
  return (
    <View style={[styles.privacyLedgerRow, !first && styles.privacyLedgerDivider]}>
      <View style={styles.privacyLedgerIcon}>
        <MenuIcon name={icon} />
      </View>
      <View style={styles.privacyLedgerCopy}>
        <Text style={styles.privacyLedgerLabel}>{label}</Text>
        <Text style={styles.privacyLedgerBody}>{body}</Text>
      </View>
      <View style={styles.privacyLedgerPill}>
        <Text style={styles.privacyLedgerPillText} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function PreferenceCard({
  title,
  subtitle,
  meta,
  children,
}: {
  title: string;
  subtitle: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.preferenceCard}>
      <View style={styles.preferenceHeader}>
        <View style={styles.preferenceHeaderCopy}>
          <Text style={styles.preferenceTitle}>{title}</Text>
          <Text style={styles.preferenceSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.preferenceMetaPill}>
          <Text style={styles.preferenceMetaText} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function DayPreferencePicker({
  selectedDays,
  onToggleDay,
}: {
  selectedDays: readonly string[];
  onToggleDay: (day: string) => void;
}) {
  return (
    <View style={styles.dayPickerRow}>
      {DAYS.map((day) => (
        <DayPreferenceChip
          key={day}
          day={day}
          selected={selectedDays.includes(day)}
          onPress={() => onToggleDay(day)}
        />
      ))}
    </View>
  );
}

function DayPreferenceChip({
  day,
  selected,
  onPress,
}: {
  day: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.dayChip,
        selected && styles.dayChipSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${day}${selected ? ', selected' : ''}`}
      hitSlop={{ top: 4, bottom: 4 }}
    >
      <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{day}</Text>
    </Pressable>
  );
}

function SessionFeelPicker({
  selected,
  onSelect,
}: {
  selected: ActivityLevel;
  onSelect: (preference: ActivityLevel) => void;
}) {
  return (
    <View style={styles.sessionFeelList}>
      {STARTING_PACE_OPTIONS.map((option, index) => (
        <SessionFeelOption
          key={option.value}
          option={option}
          selected={selected === option.value}
          showDivider={index > 0}
          onPress={() => onSelect(option.value)}
        />
      ))}
    </View>
  );
}

function SessionFeelOption({
  option,
  selected,
  showDivider,
  onPress,
}: {
  option: (typeof STARTING_PACE_OPTIONS)[number];
  selected: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.sessionFeelOption,
        showDivider && styles.sessionFeelDivider,
        selected && styles.sessionFeelOptionSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
    >
      <View style={styles.sessionFeelCopy}>
        <Text style={[styles.sessionFeelTitle, selected && styles.sessionFeelTitleSelected]}>
          {option.label}
        </Text>
        <Text style={styles.sessionFeelBody}>{option.body}</Text>
      </View>
      <SelectionIndicator selected={selected} />
    </Pressable>
  );
}

function SelectionIndicator({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.selectionIndicator, selected && styles.selectionIndicatorSelected]}>
      {selected ? (
        <Svg width={13} height={10} viewBox="0 0 13 10" fill="none">
          <Path
            d="M1.5 5.2 L4.8 8.2 L11.5 1.4"
            stroke={colors.accentDeep}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}

function preferredDaysSummary(days: readonly string[]): string {
  if (days.length === 0) return 'No preferred days';
  if (days.length >= 6) return 'Most days';
  return days.join(', ');
}

function trainingDayMeta(days: readonly string[]): string {
  if (days.length === 0) return 'None set';
  if (days.length === 1) return '1 day';
  return `${days.length} days`;
}

function equipmentSummary({
  available,
  equipment,
  phoneStandAvailable,
}: {
  available: readonly AvailableEquipment[];
  equipment: EquipmentProfile;
  phoneStandAvailable: boolean;
}): string {
  const essentials: string[] = [];
  if (available.includes('chair')) essentials.push('Chair');
  if (available.includes('wall')) essentials.push('wall support');

  const optionalCount = [
    equipment.stair,
    equipment.band,
    equipment.miniBand,
    equipment.load,
    available.includes('door_anchor'),
    available.includes('floor_space'),
    phoneStandAvailable,
  ].filter(Boolean).length;

  const base = essentials.length > 0 ? essentials.join(', ') : controlledBetaEquipmentPositioning.shortLabel;
  if (optionalCount === 0) return base;
  return `${base} + ${optionalCount} optional`;
}

function ProfileDetailsGlyph() {
  return (
    <Svg width={38} height={38} viewBox="0 0 64 64" fill="none">
      <Path
        d="M20 48 C22.4 39.6, 27.2 35.5, 32 35.5 C36.8 35.5, 41.6 39.6, 44 48"
        stroke={colors.accentDeep}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={32} cy={23} r={8} stroke={colors.accentDeep} strokeWidth={3.2} fill="none" />
      <Path
        d="M41 19.5 L47.5 13 C49.2 11.3, 52 14.1, 50.3 15.8 L43.8 22.3 L39.8 23.5 Z"
        stroke={colors.accentDeep}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type MenuIconName =
  | 'shield'
  | 'sliders'
  | 'camera'
  | 'volume'
  | 'dumbbell'
  | 'bell'
  | 'account'
  | 'lock';

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
            <Path
              d="M12 3.5 L18.5 6 V11.2 C18.5 15.8 15.7 18.8 12 20.5 C8.3 18.8 5.5 15.8 5.5 11.2 V6 Z"
              {...common}
            />
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
        {name === 'camera' ? (
          <>
            <Path
              d="M6.5 8.5 H9 L10.5 6.7 H13.5 L15 8.5 H17.5 C18.7 8.5 19.5 9.3 19.5 10.5 V16.5 C19.5 17.7 18.7 18.5 17.5 18.5 H6.5 C5.3 18.5 4.5 17.7 4.5 16.5 V10.5 C4.5 9.3 5.3 8.5 6.5 8.5 Z"
              {...common}
            />
            <Circle cx={12} cy={13.5} r={2.8} {...common} />
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
            <Path
              d="M9 10 V7.8 C9 5.8, 10.2 4.7, 12 4.7 C13.8 4.7, 15 5.8, 15 7.8 V10"
              {...common}
            />
            <Path d="M12 13.5 V15.7" {...common} />
          </>
        ) : null}
        {name === 'bell' ? (
          <>
            <Path d="M7.5 17 H16.5" {...common} />
            <Path
              d="M9 17 V10.8 C9 8.7, 10.3 7.3, 12 7.3 C13.7 7.3, 15 8.7, 15 10.8 V17"
              {...common}
            />
            <Path
              d="M10.5 19 C10.8 19.7, 11.3 20.1, 12 20.1 C12.7 20.1, 13.2 19.7, 13.5 19"
              {...common}
            />
            <Path d="M12 5.2 V4.2" {...common} />
          </>
        ) : null}
        {name === 'account' ? (
          <>
            <Circle cx={12} cy={8.5} r={3.1} {...common} />
            <Path
              d="M5.8 19 C6.7 15.8, 8.9 14.1, 12 14.1 C15.1 14.1, 17.3 15.8, 18.2 19"
              {...common}
            />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  headerRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...type.pageTitle, flexShrink: 1 },
  detailBackRow: {
    alignItems: 'flex-start',
  },
  detailHeader: {
    gap: spacing.xs,
  },
  detailSubtitle: {
    ...type.pageSubtitle,
    paddingLeft: 30 + spacing.sm,
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
    backgroundColor: colors.bgBase,
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
  profileAge: {
    ...type.cardBody,
    marginTop: 3,
    color: colors.primaryText,
  },
  goalBlock: {
    gap: 1,
    marginTop: spacing.sm,
  },
  goalLabel: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
  },
  goalText: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.primaryText,
  },
  menuCard: {
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  settingsSection: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    paddingHorizontal: spacing.xs,
  },
  menuRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
  menuCopy: {
    flex: 1,
    minWidth: 0,
  },
  menuTitle: {
    ...type.cardRowTitle,
    color: colors.primaryText,
  },
  menuSubtitle: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    ...type.h2,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  devOnboardingButton: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.bgGold,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  devOnboardingIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  devOnboardingCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  devOnboardingTitle: {
    ...type.bodySmall,
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
  },
  devOnboardingBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  devOnboardingChevron: {
    ...type.h2,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  detailOverview: {
    minHeight: 128,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  detailOverviewIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.panel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  detailOverviewCopy: {
    flex: 1,
    minWidth: 0,
  },
  detailOverviewTitle: {
    ...type.h3,
    color: colors.primaryText,
  },
  detailOverviewBody: {
    ...type.cardBody,
    marginTop: spacing.xs,
  },
  detailOverviewMeta: {
    ...type.caption,
    marginTop: spacing.sm,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  detailCard: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  detailCardTitle: {
    ...type.cardTitle,
    color: colors.primaryText,
  },
  detailCardBody: {
    ...type.cardBody,
    marginTop: spacing.xs,
  },
  detailCardContent: {
    marginTop: spacing.lg,
  },
  voiceSelectorCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  voiceSelectorHeader: {
    gap: spacing.xs,
  },
  voiceSelectorTitle: {
    ...type.cardTitle,
    color: colors.primaryText,
  },
  voiceSelectorBody: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  voiceOptionList: {
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.bgSurface,
  },
  voiceOptionRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
  },
  voiceOptionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  voiceOptionRowSelected: {
    backgroundColor: colors.background,
  },
  voiceOptionRowDisabled: {
    opacity: 0.52,
  },
  voicePreviewButton: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  voiceOptionSelectArea: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  voiceOptionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  voiceOptionTitle: {
    ...type.bodySmall,
    color: colors.primaryText,
  },
  voiceOptionTitleSelected: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  voiceOptionBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  safetyCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  safetyCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  safetyCardTitleGroup: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  safetyCardTitle: {
    ...type.cardTitle,
    color: colors.primaryText,
  },
  safetyCardBody: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  safetyScorePill: {
    minHeight: 32,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  safetyScoreText: {
    ...type.caption,
    lineHeight: 18,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  safetyStatusList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  safetyStatusRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  safetyStatusDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  safetyStatusCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  safetyStatusLabel: {
    ...type.bodySmall,
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
  },
  safetyStatusBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  safetyStatusPill: {
    minWidth: 92,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  safetyStatusPillAttention: {
    backgroundColor: colors.cautionSoft,
    borderColor: colors.cautionBorder,
  },
  safetyStatusPillNeutral: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
  },
  safetyStatusPillText: {
    ...type.caption,
    lineHeight: 17,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  safetyStatusPillTextAttention: {
    color: colors.caution,
  },
  safetyStatusPillTextNeutral: {
    color: colors.textSecondary,
  },
  safetyActionList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  safetyActionRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  safetyActionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  safetyActionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  safetyActionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  safetyActionTitle: {
    ...type.bodySmall,
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
  },
  safetyActionBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  safetyActionChevron: {
    ...type.h2,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  personalCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  personalCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  personalCardHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  personalCardTitle: {
    ...type.cardTitle,
    color: colors.primaryText,
  },
  personalCardBody: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  personalCardIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  personalFieldGroup: {
    gap: spacing.md,
  },
  personalIdentityPanel: {
    minHeight: 88,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  personalNameField: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  personalAgeRangePanel: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: 'transparent',
  },
  personalAgeRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  personalAgeRangeValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.accentDeep,
    textAlign: 'right',
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },
  personalFieldLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.sageDeep,
    textTransform: 'uppercase',
  },
  personalFieldInput: {
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
    minHeight: 36,
    padding: 0,
    marginTop: spacing.sm,
    color: colors.primaryText,
    backgroundColor: 'transparent',
  },
  personalAgeOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    marginTop: spacing.md,
  },
  personalAgeOption: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  personalAgeOptionWide: {
    flexBasis: '48.5%',
  },
  personalAgeOptionCompact: {
    flexBasis: '23.5%',
    paddingHorizontal: spacing.xs,
  },
  personalAgeOptionSelected: {
    borderColor: colors.accentDeep,
    backgroundColor: colors.accentDeep,
  },
  personalAgeOptionText: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textSecondary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  personalAgeOptionTextSelected: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
  },
  personalGoalPanel: {
    minHeight: 104,
    borderRadius: radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  personalGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalGoalCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  personalGoalValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  personalGoalValue: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.serifMedium,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: 0,
    color: colors.primaryText,
  },
  personalGoalChevron: {
    ...type.h2,
    color: colors.textSecondary,
    lineHeight: 27,
    flexShrink: 0,
  },
  setupActionStack: {
    gap: spacing.sm,
  },
  setupActionTile: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setupActionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  setupActionCopy: {
    flex: 1,
    minWidth: 0,
  },
  setupActionTitle: {
    ...type.bodySmall,
    fontFamily: fonts.sansMedium,
    color: colors.primaryText,
  },
  setupActionBody: {
    ...type.caption,
    marginTop: 2,
    color: colors.textSecondary,
  },
  setupActionChevron: {
    ...type.h2,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  preferenceCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  preferenceHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  preferenceTitle: {
    ...type.cardTitle,
    color: colors.primaryText,
  },
  preferenceSubtitle: {
    ...type.cardBody,
    marginTop: spacing.xs,
  },
  preferenceMetaPill: {
    minHeight: 32,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceMetaText: {
    ...type.caption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    lineHeight: 18,
  },
  dayPickerRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.subtleBorder,
    backgroundColor: colors.bgSurface,
  },
  dayChipSelected: {
    borderColor: colors.accent,
  },
  dayChipText: {
    ...type.cardRowTitle,
    color: colors.primaryText,
  },
  dayChipTextSelected: {
    color: colors.accentDeep,
  },
  sessionFeelList: {
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.bgSurface,
  },
  sessionFeelOption: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
  },
  sessionFeelDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  sessionFeelOptionSelected: {
    backgroundColor: colors.bgSurface,
  },
  sessionFeelCopy: {
    flex: 1,
    minWidth: 0,
  },
  sessionFeelTitle: {
    ...type.bodySmall,
    color: colors.primaryText,
  },
  sessionFeelTitleSelected: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  sessionFeelBody: {
    ...type.caption,
    marginTop: 2,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicatorSelected: {
    borderColor: colors.accent,
  },
  toggleStack: { gap: spacing.md },
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
  infoRowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  infoLabel: { ...type.bodySmall, color: colors.textSecondary, flex: 1 },
  infoValue: {
    ...type.bodySmall,
    color: colors.accentDeep,
    textAlign: 'right',
    flex: 1,
  },
  privacyLedger: {
    marginTop: -spacing.xs,
  },
  privacyLedgerRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  privacyLedgerDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  privacyLedgerIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  privacyLedgerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  privacyLedgerLabel: {
    ...type.bodySmall,
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
  },
  privacyLedgerBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  privacyLedgerPill: {
    width: 104,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  privacyLedgerPillText: {
    ...type.caption,
    lineHeight: 17,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    textAlign: 'center',
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
