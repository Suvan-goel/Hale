/**
 * Settings screen: compact local profile hub, plan preferences, safety setup,
 * equipment, account actions, privacy, and help.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { AvailableEquipment, SupportConnection } from '../adherence';
import { getLifeGoalDisplayText, sharingLevelLabel } from '../adherence';
import { AccountAuthCard } from '../components/AccountAuthCard';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { Screen, ToggleRow } from '../components/ui';
import { AppSettings, getVoice, UserProfile, VOICE_OPTIONS } from '../profile';
import { EquipmentProfile, TrainingIntensityPreference } from '../training';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const INTENSITY_OPTIONS: readonly { id: TrainingIntensityPreference; label: string; body: string }[] = [
  { id: 'gentle', label: 'Gentle', body: 'A calmer start' },
  { id: 'standard', label: 'Standard', body: 'Balanced work' },
  { id: 'more_challenge', label: 'More challenge', body: 'A stronger ask' },
];

type ProfileSection =
  | 'details'
  | 'safety'
  | 'plan'
  | 'voice'
  | 'equipment'
  | 'reminders'
  | 'account'
  | 'privacy'
  | 'help';

type VoiceCatalogOption = (typeof VOICE_OPTIONS)[number];

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
  reminders: {
    title: 'Workout Reminders',
    subtitle: 'Store a gentle reminder preference for future sessions.',
  },
  account: {
    title: 'Account & Data',
    subtitle: 'Manage sign-in, export, sign-out, and account deletion.',
  },
  privacy: {
    title: 'Privacy & Sharing',
    subtitle: 'See what Hale stores and how sharing works in this version.',
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
  onReplayOnboardingForDev?: () => void;
  onBack?: () => void;
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
  onReplayOnboardingForDev,
  onBack,
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
  const planSummary = `${preferredDaysSummary(preferredDays)} · ${intensityLabel(preferredIntensity)}`;
  const setupSummary = equipmentSummary({ available, equipment, phoneStandAvailable: settings.phoneStandAvailable });
  const safetySummary = `${profile.safetyProfile ? 'Safety profile saved' : 'Safety profile not set'} · Skeleton only`;
  const supportSharingLabel = supportConnection
    ? sharingLevelLabel(supportConnection.sharingLevel)
    : sharingLevelLabel(settings.supportSharingLevel);
  const sharingSummary = `Support circle: ${supportSharingLabel}`;
  const showDeveloperSettings = __DEV__;

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
        <>
          <DetailOverview
            icon="account"
            title={displayName}
            body="These basics keep greetings, goals, and plan language personal."
            meta={profile.age === null ? 'Age not set' : `Age ${profile.age}`}
          />

          <PersonalDetailsCard
            name={name}
            onNameChange={setName}
            onNameBlur={commitName}
            ageText={ageText}
            onAgeChange={setAgeText}
            onAgeBlur={commitAge}
            goal={goal}
            onGoalChange={setGoal}
            onGoalBlur={commitGoal}
          />

          <DetailCard
            title="Connected setup"
            body="These setup areas shape how Hale prepares future sessions."
          >
            <View style={styles.setupActionStack}>
              <SetupActionTile
                icon="sliders"
                title="Life goal"
                body="Tune the outcome Hale builds your plan around."
                onPress={onOpenLifeGoal}
              />
              <SetupActionTile
                icon="shield"
                title="Safety profile"
                body="Review comfort, room setup, and support needs."
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
            icon="shield"
            title={profile.safetyProfile ? 'Ready for guided movement' : 'Finish safety setup'}
            body="Hale checks framing before movement sessions and keeps camera sessions skeleton-only."
            meta={profile.safetyProfile ? 'Safety profile saved' : 'Safety profile needed'}
          />

          <SafetyReadinessCard
            safetyProfileSaved={!!profile.safetyProfile}
            phoneStandAvailable={settings.phoneStandAvailable}
          />

          <SafetyActionsCard
            onOpenSafetyProfile={onOpenSafetyProfile}
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
            body="These preferences guide future sessions without changing your current 4-week map."
            meta="Current block stays in Plan"
          />

          <PreferenceCard
            title="Training days"
            subtitle="The days that usually fit best."
            meta={trainingDayMeta(preferredDays)}
          >
            <DayPreferencePicker selectedDays={preferredDays} onToggleDay={toggleDay} />
          </PreferenceCard>

          <PreferenceCard
            title="Session feel"
            subtitle="The default pace for future sessions."
            meta={intensityLabel(preferredIntensity)}
          >
            <SessionFeelPicker selected={preferredIntensity} onSelect={onIntensityChange} />
          </PreferenceCard>
        </>
      );
    }

    if (openSection === 'voice') {
      return (
        <>
          <VoiceCurrentCard voice={currentVoice} />
          <VoiceSelectorCard
            selectedVoiceId={settings.voiceId}
            onSelectVoice={(voiceId) => onSettingsChange({ ...settings, voiceId })}
          />
        </>
      );
    }

    if (openSection === 'equipment') {
      return (
        <>
          <DetailOverview
            icon="dumbbell"
            title={setupSummary}
            body="Hale always keeps a zero-equipment route. Optional items only unlock substitutions."
            meta="Simple home setup"
          />

          <DetailCard title="Essentials" body="Useful for the first check-up and most beginner sessions.">
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

          <DetailCard title="Optional substitutions" body="Mark anything available at home so Hale can vary sessions.">
            <View style={styles.toggleStack}>
              <ToggleRow label="Bottom stair" value={equipment.stair} onValueChange={() => onToggleEquipment('stair')} />
              <ToggleRow label="Resistance band" value={equipment.band} onValueChange={() => onToggleEquipment('band')} />
              <ToggleRow
                label="Door anchor for band rows"
                value={available.includes('door_anchor')}
                onValueChange={() => onToggleAvailableEquipment('door_anchor')}
              />
              <ToggleRow label="Mini band" value={!!equipment.miniBand} onValueChange={() => onToggleEquipment('miniBand')} />
              <ToggleRow
                label="Backpack or light weight"
                value={!!equipment.load}
                onValueChange={() => onToggleEquipment('load')}
              />
              <ToggleRow
                label="Floor space for mat exercises"
                value={available.includes('floor_space')}
                onValueChange={() => onToggleAvailableEquipment('floor_space')}
              />
            </View>
          </DetailCard>

          <DetailCard title="Camera setup" body="A phone stand helps keep monthly check-ups consistent.">
            <ToggleRow
              label="Phone stand"
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
            title={settings.remindersEnabled ? 'Reminder preference on' : 'Reminders off'}
            body="Hale can store whether you want gentle workout prompts, but phone notifications are not scheduled yet."
            meta="Preference only"
          />

          <DetailCard title="Workout reminders" body="Keep this preference ready for future reminder scheduling.">
            <ToggleRow
              label="Workout reminders"
              description="No phone notification is scheduled yet."
              value={settings.remindersEnabled}
              onValueChange={(v) => onSettingsChange({ ...settings, remindersEnabled: v })}
            />
            <InfoRow label="Notification status" value="Not scheduled" />
          </DetailCard>
        </>
      );
    }

    if (openSection === 'account') {
      return (
        <>
          <DetailOverview
            icon="account"
            title="Account and data"
            body="Manage sign-in, data export, sign-out, and deletion from one place."
            meta="Local data first"
          />
          <AccountAuthCard context="settings" />
        </>
      );
    }

    if (openSection === 'privacy') {
      return (
        <>
          <DetailOverview
            icon="lock"
            title="Private by default"
            body="Normal sessions render a skeleton view only, never a self-view camera mirror."
            meta={sharingSummary}
          />

          <PrivacyStorageCard supportSharingLabel={supportSharingLabel} />
          <PrivacySharingCard supportSharingLabel={supportSharingLabel} />
        </>
      );
    }

    return (
      <>
        <DetailOverview
          icon="help"
          title="Setup help"
          body="Revisit camera setup any time, then return to Today when you are ready for the next step."
          meta="Quick support"
        />

        <DetailCard title="Setup shortcuts" body="Two fast ways to clear setup blockers before your next guided session.">
          <View style={styles.helpShortcutList}>
            <HelpShortcutRow
              icon="camera"
              title="Camera setup"
              body="Recheck framing, distance, and phone placement."
              onPress={onOpenCameraSetup}
              first
            />
            <HelpShortcutRow
              icon="shield"
              title="Safety profile"
              body="Review comfort notes, supports, and home setup."
              onPress={onOpenSafetyProfile}
            />
          </View>
        </DetailCard>
      </>
    );
  };

  if (openSection) {
    const copy = SECTION_COPY[openSection];

    return (
      <Screen contentStyle={styles.screenContent}>
        <View style={styles.detailBackRow}>
          <BackArrowButton accessibilityLabel="Back to settings" onPress={() => setOpenSection(null)} />
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
          <ProfilePicturePlaceholder />
        </View>
        <View style={styles.profileCopy}>
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
          </View>
          <Text style={styles.profileAge}>{profile.age === null ? 'Age not set' : `Age ${profile.age}`}</Text>
          <View style={styles.goalRow}>
            <LeafIcon />
            <Text style={styles.goalText} numberOfLines={1}>{goalText}</Text>
          </View>
        </View>
      </Pressable>

      <SettingsSection title="Session setup">
        <ProfileMenuRow
          title="Plan Preferences"
          subtitle={planSummary}
          icon="sliders"
          onPress={() => openProfileSection('plan')}
          showDivider
        />
        <ProfileMenuRow
          title="Equipment Setup"
          subtitle={setupSummary}
          icon="dumbbell"
          onPress={() => openProfileSection('equipment')}
          showDivider
        />
        <ProfileMenuRow
          title="Trainer Voice"
          subtitle={currentVoice.label}
          icon="volume"
          onPress={() => openProfileSection('voice')}
          showDivider
        />
        <ProfileMenuRow
          title="Workout Reminders"
          subtitle={settings.remindersEnabled ? 'Preference on · no phone notification scheduled' : 'Off for now'}
          icon="bell"
          onPress={() => openProfileSection('reminders')}
        />
      </SettingsSection>

      <SettingsSection title="Camera & safety">
        <ProfileMenuRow
          title="Camera & Safety"
          subtitle={safetySummary}
          icon="shield"
          onPress={() => openProfileSection('safety')}
        />
      </SettingsSection>

      <SettingsSection title="Account & data">
        <ProfileMenuRow
          title="Account & Data"
          subtitle="Sign in, export, sign out, or delete data"
          icon="account"
          onPress={() => openProfileSection('account')}
          showDivider
        />
        <ProfileMenuRow
          title="Privacy & Sharing"
          subtitle={sharingSummary}
          icon="lock"
          onPress={() => openProfileSection('privacy')}
        />
      </SettingsSection>

      <SettingsSection title="Support">
        <ProfileMenuRow
          title="Help"
          subtitle="Camera setup and getting unstuck"
          icon="help"
          onPress={() => openProfileSection('help')}
        />
      </SettingsSection>

      {showDeveloperSettings ? (
        <SettingsSection title="Developer">
          <View style={[styles.menuRow, styles.menuDivider]}>
            <MenuIcon name="sliders" />
            <View style={styles.menuCopy}>
              <Text style={styles.menuTitle}>Use mock app data</Text>
              <Text style={styles.menuSubtitle}>Preview Hale after a check-up and a few completed sessions.</Text>
            </View>
            <Switch
              value={settings.devMockDataEnabled}
              onValueChange={(enabled) => onSettingsChange({ ...settings, devMockDataEnabled: enabled })}
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

function VoiceCurrentCard({ voice }: { voice: VoiceCatalogOption }) {
  return (
    <View style={styles.voiceCurrentCard}>
      <View style={styles.voiceCurrentTop}>
        <View style={styles.voiceCurrentIcon}>
          <MenuIcon name="volume" />
        </View>
        <View style={styles.voiceCurrentCopy}>
          <Text style={styles.voiceEyebrow}>Current guide voice</Text>
          <Text style={styles.voiceCurrentTitle}>{voice.label}</Text>
          <Text style={styles.voiceCurrentBody}>Check-ups, rests, and session cues use this bundled voice.</Text>
        </View>
      </View>
      <View style={styles.voiceSummaryGrid}>
        <View style={styles.voiceSummaryTile}>
          <Text style={styles.voiceSummaryLabel}>Tone</Text>
          <Text style={styles.voiceSummaryValue}>{voice.description}</Text>
        </View>
        <View style={styles.voiceSummaryTile}>
          <Text style={styles.voiceSummaryLabel}>Session audio</Text>
          <Text style={styles.voiceSummaryValue}>Bundled</Text>
        </View>
      </View>
    </View>
  );
}

function VoiceSelectorCard({
  selectedVoiceId,
  onSelectVoice,
}: {
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
}) {
  return (
    <View style={styles.voiceSelectorCard}>
      <View style={styles.voiceSelectorHeader}>
        <Text style={styles.voiceSelectorTitle}>Choose your guide</Text>
        <Text style={styles.voiceSelectorBody}>Switching updates future check-ups and sessions.</Text>
      </View>
      <View style={styles.voiceOptionList}>
        {VOICE_OPTIONS.map((voice, index) => (
          <VoiceOptionRow
            key={voice.id}
            voice={voice}
            selected={voice.id === selectedVoiceId}
            showDivider={index > 0}
            onSelect={() => voice.available && onSelectVoice(voice.id)}
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
}: {
  voice: VoiceCatalogOption;
  selected: boolean;
  showDivider: boolean;
  onSelect: () => void;
}) {
  const disabled = !voice.available;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.voiceOptionRow,
        showDivider && styles.voiceOptionDivider,
        selected && styles.voiceOptionRowSelected,
        disabled && styles.voiceOptionRowDisabled,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onSelect}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${voice.label}${selected ? ', selected' : ''}`}
    >
      <View style={styles.voiceOptionIcon}>
        <MenuIcon name="volume" />
      </View>
      <View style={styles.voiceOptionCopy}>
        <Text style={[styles.voiceOptionTitle, selected && styles.voiceOptionTitleSelected]}>{voice.label}</Text>
        <Text style={styles.voiceOptionBody}>
          {voice.available ? voice.description : `${voice.description} - coming soon`}
        </Text>
      </View>
      <SelectionIndicator selected={selected} />
    </Pressable>
  );
}

function SafetyReadinessCard({
  safetyProfileSaved,
  phoneStandAvailable,
}: {
  safetyProfileSaved: boolean;
  phoneStandAvailable: boolean;
}) {
  const readyCount = 1 + (safetyProfileSaved ? 1 : 0) + (phoneStandAvailable ? 1 : 0);
  return (
    <View style={styles.safetyCard}>
      <View style={styles.safetyCardHeader}>
        <View style={styles.safetyCardTitleGroup}>
          <Text style={styles.safetyCardTitle}>Readiness</Text>
          <Text style={styles.safetyCardBody}>The setup Hale checks before a check-up or guided session.</Text>
        </View>
        <View style={styles.safetyScorePill}>
          <Text style={styles.safetyScoreText}>{readyCount}/3 ready</Text>
        </View>
      </View>

      <View style={styles.safetyStatusList}>
        <SafetyStatusRow
          label="Camera view"
          body="Movement sessions show a clean skeleton, never self-view video."
          value="Skeleton only"
          tone="ready"
          first
        />
        <SafetyStatusRow
          label="Safety profile"
          body={safetyProfileSaved ? 'Comfort and support details are saved.' : 'Add comfort and support details before sessions.'}
          value={safetyProfileSaved ? 'Saved' : 'Review'}
          tone={safetyProfileSaved ? 'ready' : 'attention'}
        />
        <SafetyStatusRow
          label="Phone stand"
          body={phoneStandAvailable ? 'Marked available for repeatable framing.' : 'Mark this when you have a stable phone setup.'}
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
  onOpenSafetyProfile,
  onOpenCameraSetup,
}: {
  onOpenSafetyProfile: () => void;
  onOpenCameraSetup: () => void;
}) {
  return (
    <View style={styles.safetyCard}>
      <View style={styles.safetyCardHeader}>
        <View style={styles.safetyCardTitleGroup}>
          <Text style={styles.safetyCardTitle}>Setup actions</Text>
          <Text style={styles.safetyCardBody}>Use these when your room, camera angle, or support setup changes.</Text>
        </View>
      </View>

      <View style={styles.safetyActionList}>
        <SafetyActionRow
          icon="shield"
          title="Edit safety profile"
          body="Update support needs, comfort notes, and movement setup."
          onPress={onOpenSafetyProfile}
          first
        />
        <SafetyActionRow
          icon="sliders"
          title="Open camera setup"
          body="Recheck framing, distance, and phone placement."
          onPress={onOpenCameraSetup}
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
      style={({ pressed }) => [styles.safetyActionRow, !first && styles.safetyActionDivider, pressed && styles.pressed]}
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
  ageText,
  onAgeChange,
  onAgeBlur,
  goal,
  onGoalChange,
  onGoalBlur,
}: {
  name: string;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  ageText: string;
  onAgeChange: (value: string) => void;
  onAgeBlur: () => void;
  goal: string;
  onGoalChange: (value: string) => void;
  onGoalBlur: () => void;
}) {
  return (
    <View style={styles.personalCard}>
      <View style={styles.personalCardHeader}>
        <View style={styles.personalCardHeaderCopy}>
          <Text style={styles.personalCardTitle}>Your details</Text>
          <Text style={styles.personalCardBody}>Edit the personal information Hale uses in greetings and plan copy.</Text>
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
          <View style={styles.personalFieldDivider} />
          <View style={styles.personalAgeField}>
            <Text style={styles.personalFieldLabel}>Age</Text>
            <TextInput
              style={styles.personalFieldInput}
              value={ageText}
              onChangeText={onAgeChange}
              onBlur={onAgeBlur}
              placeholder="Age"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              returnKeyType="done"
              accessibilityLabel="Age"
            />
          </View>
        </View>

        <View style={styles.personalGoalPanel}>
          <View style={styles.personalGoalLabelRow}>
            <LeafIcon />
            <Text style={styles.personalFieldLabel}>Movement goal</Text>
          </View>
          <TextInput
            style={[styles.personalFieldInput, styles.personalGoalInput]}
            value={goal}
            onChangeText={onGoalChange}
            onBlur={onGoalBlur}
            placeholder="e.g. Stay steady on stairs"
            placeholderTextColor={colors.textTertiary}
            multiline
            accessibilityLabel="Your goal"
          />
        </View>
      </View>
    </View>
  );
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

function HelpShortcutRow({
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
        styles.helpShortcutRow,
        !first && styles.helpShortcutDivider,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.helpShortcutIcon}>
        <MenuIcon name={icon} />
      </View>
      <View style={styles.helpShortcutCopy}>
        <Text style={styles.helpShortcutTitle}>{title}</Text>
        <Text style={styles.helpShortcutBody}>{body}</Text>
      </View>
      <Text style={styles.helpShortcutChevron}>{'>'}</Text>
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

function PrivacyStorageCard({ supportSharingLabel }: { supportSharingLabel: string }) {
  return (
    <DetailCard title="What Hale stores" body="A compact view of the privacy-sensitive pieces in this version.">
      <View style={styles.privacyLedger}>
        <PrivacyLedgerRow
          icon="camera"
          label="Camera"
          body="Normal sessions render a clean skeleton, never a self-view mirror."
          value="Skeleton only"
          first
        />
        <PrivacyLedgerRow
          icon="sliders"
          label="Movement data"
          body="Estimates and preferences stay local first; signed-in sync keeps history available."
          value="Local first"
        />
        <PrivacyLedgerRow
          icon="shield"
          label="Support circle"
          body="Family-style sharing follows the level you choose."
          value={supportSharingLabel}
        />
        <PrivacyLedgerRow
          icon="account"
          label="Account actions"
          body="Export, sign-out, and deletion live in Account & Data."
          value="Managed"
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

function PrivacySharingCard({ supportSharingLabel }: { supportSharingLabel: string }) {
  return (
    <DetailCard
      title="Sharing"
      body="Support sharing is opt-in. Hale stores movement estimates and preferences so your plan can adapt over time."
    >
      <View style={styles.privacySharingHeader}>
        <View style={styles.privacySharingMark}>
          <LeafIcon />
        </View>
        <View style={styles.privacySharingCopy}>
          <Text style={styles.privacySharingLabel}>Current support visibility</Text>
          <Text style={styles.privacySharingBody}>Nothing becomes visible to a support circle unless this setting allows it.</Text>
        </View>
        <View style={styles.privacySharingPill}>
          <Text style={styles.privacySharingPillText} numberOfLines={2}>
            {supportSharingLabel}
          </Text>
        </View>
      </View>

      <View style={styles.privacyPromiseList}>
        <PrivacyPromiseRow
          icon="lock"
          title="Opt-in only"
          body="Support updates stay off until you choose a sharing level."
          first
        />
        <PrivacyPromiseRow
          icon="shield"
          title="No public profile"
          body="Hale does not create clinical labels, social feeds, or public profiles."
        />
      </View>
    </DetailCard>
  );
}

function PrivacyPromiseRow({
  icon,
  title,
  body,
  first,
}: {
  icon: MenuIconName;
  title: string;
  body: string;
  first?: boolean;
}) {
  return (
    <View style={[styles.privacyPromiseRow, !first && styles.privacyPromiseDivider]}>
      <View style={styles.privacyPromiseIcon}>
        <MenuIcon name={icon} />
      </View>
      <View style={styles.privacyPromiseCopy}>
        <Text style={styles.privacyPromiseTitle}>{title}</Text>
        <Text style={styles.privacyPromiseBody}>{body}</Text>
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
          <Text style={styles.preferenceMetaText} numberOfLines={1}>{meta}</Text>
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
        <DayPreferenceChip key={day} day={day} selected={selectedDays.includes(day)} onPress={() => onToggleDay(day)} />
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
      style={({ pressed }) => [styles.dayChip, selected && styles.dayChipSelected, pressed && styles.pressed]}
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
  selected: TrainingIntensityPreference;
  onSelect: (preference: TrainingIntensityPreference) => void;
}) {
  return (
    <View style={styles.sessionFeelList}>
      {INTENSITY_OPTIONS.map((option, index) => (
        <SessionFeelOption
          key={option.id}
          option={option}
          selected={selected === option.id}
          showDivider={index > 0}
          onPress={() => onSelect(option.id)}
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
  option: (typeof INTENSITY_OPTIONS)[number];
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
        <Text style={[styles.sessionFeelTitle, selected && styles.sessionFeelTitleSelected]}>{option.label}</Text>
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

function intensityLabel(preference: TrainingIntensityPreference): string {
  return INTENSITY_OPTIONS.find((option) => option.id === preference)?.label ?? 'Standard';
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

  const base = essentials.length > 0 ? essentials.join(', ') : 'Zero-equipment path';
  if (optionalCount === 0) return base;
  return `${base} + ${optionalCount} optional`;
}

function ProfilePicturePlaceholder() {
  return (
    <Svg width={38} height={38} viewBox="0 0 64 64" fill="none">
      <Path
        d="M17 24 H23.5 L27.5 18.8 H36.5 L40.5 24 H47 C50 24 52 26 52 29 V44.5 C52 47.5 50 49.5 47 49.5 H17 C14 49.5 12 47.5 12 44.5 V29 C12 26 14 24 17 24 Z"
        stroke={colors.accentDeep}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={32}
        cy={37}
        r={8}
        stroke={colors.accentDeep}
        strokeWidth={3.2}
        fill="none"
      />
      <Path
        d="M43.5 29.5 H44"
        stroke={colors.accentDeep}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
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

type MenuIconName = 'shield' | 'sliders' | 'camera' | 'volume' | 'dumbbell' | 'bell' | 'account' | 'lock' | 'help';

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
        {name === 'camera' ? (
          <>
            <Path d="M6.5 8.5 H9 L10.5 6.7 H13.5 L15 8.5 H17.5 C18.7 8.5 19.5 9.3 19.5 10.5 V16.5 C19.5 17.7 18.7 18.5 17.5 18.5 H6.5 C5.3 18.5 4.5 17.7 4.5 16.5 V10.5 C4.5 9.3 5.3 8.5 6.5 8.5 Z" {...common} />
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
            <Path d="M9 10 V7.8 C9 5.8, 10.2 4.7, 12 4.7 C13.8 4.7, 15 5.8, 15 7.8 V10" {...common} />
            <Path d="M12 13.5 V15.7" {...common} />
          </>
        ) : null}
        {name === 'bell' ? (
          <>
            <Path d="M7.5 17 H16.5" {...common} />
            <Path d="M9 17 V10.8 C9 8.7, 10.3 7.3, 12 7.3 C13.7 7.3, 15 8.7, 15 10.8 V17" {...common} />
            <Path d="M10.5 19 C10.8 19.7, 11.3 20.1, 12 20.1 C12.7 20.1, 13.2 19.7, 13.5 19" {...common} />
            <Path d="M12 5.2 V4.2" {...common} />
          </>
        ) : null}
        {name === 'account' ? (
          <>
            <Circle cx={12} cy={8.5} r={3.1} {...common} />
            <Path d="M5.8 19 C6.7 15.8, 8.9 14.1, 12 14.1 C15.1 14.1, 17.3 15.8, 18.2 19" {...common} />
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
  voiceCurrentCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  voiceCurrentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  voiceCurrentIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.panel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.bgGold,
  },
  voiceCurrentCopy: {
    flex: 1,
    minWidth: 0,
  },
  voiceEyebrow: {
    ...type.caption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  voiceCurrentTitle: {
    ...type.cardTitle,
    marginTop: spacing.xs,
    color: colors.primaryText,
  },
  voiceCurrentBody: {
    ...type.cardBody,
    marginTop: 2,
    color: colors.textSecondary,
  },
  voiceSummaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  voiceSummaryTile: {
    flex: 1,
    minHeight: 72,
    justifyContent: 'center',
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  voiceSummaryLabel: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  voiceSummaryValue: {
    ...type.bodySmall,
    marginTop: 2,
    color: colors.primaryText,
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
  voiceOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
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
    gap: spacing.sm,
  },
  personalIdentityPanel: {
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius.input,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  personalNameField: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  personalAgeField: {
    width: 104,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  personalFieldDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
    backgroundColor: colors.divider,
  },
  personalFieldLabel: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  personalFieldInput: {
    ...type.body,
    minHeight: 36,
    padding: 0,
    marginTop: spacing.xs,
    color: colors.primaryText,
    backgroundColor: 'transparent',
  },
  personalGoalPanel: {
    minHeight: 116,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  personalGoalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  personalGoalInput: {
    minHeight: 62,
    textAlignVertical: 'top',
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
  helpShortcutList: {
    marginTop: -spacing.xs,
  },
  helpShortcutRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  helpShortcutDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  helpShortcutIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  helpShortcutCopy: {
    flex: 1,
    minWidth: 0,
  },
  helpShortcutTitle: {
    ...type.bodySmall,
    fontFamily: fonts.sansMedium,
    color: colors.primaryText,
  },
  helpShortcutBody: {
    ...type.caption,
    marginTop: 2,
    color: colors.textSecondary,
  },
  helpShortcutChevron: {
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
  infoValue: { ...type.bodySmall, color: colors.accentDeep, textAlign: 'right', flex: 1 },
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
  privacySharingHeader: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  privacySharingMark: {
    width: 46,
    height: 46,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.bgGold,
  },
  privacySharingCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  privacySharingLabel: {
    ...type.bodySmall,
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
  },
  privacySharingBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  privacySharingPill: {
    width: 112,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.bgSurface,
  },
  privacySharingPillText: {
    ...type.caption,
    lineHeight: 17,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    textAlign: 'center',
  },
  privacyPromiseList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  privacyPromiseRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  privacyPromiseDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  privacyPromiseIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  privacyPromiseCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  privacyPromiseTitle: {
    ...type.bodySmall,
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
  },
  privacyPromiseBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
