/**
 * Settings screen: compact local profile hub, plan preferences, safety setup,
 * equipment, account actions, privacy, and help.
 */

import * as React from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { ActivityLevel, AvailableEquipment } from '../adherence';
import { getLifeGoalDisplayText, normalizeLifeGoalDisplayText } from '../adherence';
import { VoiceChannel } from '../audio/voicePlayer';
import { AccountAuthCard } from '../components/AccountAuthCard';
import { BackArrowButton } from '../components/BackArrowButton';
import { DateOfBirthPickerModal } from '../components/DateOfBirthPickerModal';
import { HeaderLogo } from '../components/HeaderLogo';
import { Screen, ToggleRow } from '../components/ui';
import { controlledBetaEquipmentPositioning } from '../haleFlow';
import {
  AppSettings,
  MENOPAUSE_STAGE_OPTIONS,
  STARTING_PACE_OPTIONS,
  ageFromDateOfBirth,
  ageBandForAge,
  dateOfBirthInputLabel,
  normalizeDateOfBirth,
  normalizeDateOfBirthInput,
  startingEffortLabel,
  type MenopauseStage,
  type ProfileReferenceSex,
  UserProfile,
  VOICE_OPTIONS,
  getVoice,
} from '../profile';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

import { BRAND } from '../brand';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const VOICE_PREVIEW_CUE = 'voice-preview' as const;

type ProfileSection =
  | 'details'
  | 'safety'
  | 'plan'
  | 'voice'
  | 'equipment'
  | 'account'
  | 'privacy';

type VoiceCatalogOption = (typeof VOICE_OPTIONS)[number];

const SECTION_COPY: Record<ProfileSection, { title: string; subtitle: string }> = {
  details: {
    title: 'Your profile',
    subtitle: 'Update your name, reference details, and movement goal.',
  },
  safety: {
    title: 'Camera setup',
    subtitle: 'Review privacy and phone placement.',
  },
  plan: {
    title: 'Workout days & effort',
    subtitle: 'Choose your workout days and starting effort.',
  },
  voice: {
    title: 'Trainer voice',
    subtitle: 'Choose the voice for check-ups and workouts.',
  },
  equipment: {
    title: 'Equipment',
    subtitle: 'Choose what you have at home.',
  },
  account: {
    title: 'Account & data',
    subtitle: `Manage sign-in and your ${BRAND.appName} data.`,
  },
  privacy: {
    title: 'Privacy & data',
    subtitle: `See what ${BRAND.appName} shows and saves.`,
  },
};

type SettingsScreenProps = {
  profile: UserProfile;
  settings: AppSettings;
  preferredDays: readonly string[];
  startingEffort: ActivityLevel;
  onProfileChange: (next: UserProfile) => void;
  onSettingsChange: (next: AppSettings) => void;
  onToggleAvailableEquipment: (item: AvailableEquipment) => void;
  onPreferredDaysChange: (days: string[]) => void;
  onStartingEffortChange: (startingEffort: ActivityLevel) => void;
  onOpenLifeGoal: () => void;
  onOpenSafetyProfile: () => void;
  onOpenCameraSetup: () => void;
  /** Pain-recurrence swapped-out movements (visible + reversible, §9). */
  painExclusions?: readonly { ladderId: string; title: string }[];
  onReinstateExercise?: (ladderId: string) => void;
  onReplayOnboardingForDev?: () => void;
  onBack?: () => void;
};

export function SettingsScreen(props: SettingsScreenProps) {
  return <SettingsScreenContent {...props} />;
}

function SettingsScreenContent({
  profile,
  settings,
  preferredDays,
  startingEffort,
  onProfileChange,
  onSettingsChange,
  onToggleAvailableEquipment,
  onPreferredDaysChange,
  onStartingEffortChange,
  onOpenLifeGoal,
  onOpenSafetyProfile,
  onOpenCameraSetup,
  painExclusions = [],
  onReinstateExercise,
  onReplayOnboardingForDev,
  onBack,
}: SettingsScreenProps) {
  const responsive = useResponsiveLayout();
  const [openSection, setOpenSection] = React.useState<ProfileSection | null>(null);
  const [name, setName] = React.useState(profile.name);
  const [dateOfBirthText, setDateOfBirthText] = React.useState(
    dateOfBirthInputLabel(profile.dateOfBirth)
  );
  const [datePickerVisible, setDatePickerVisible] = React.useState(false);
  const [referenceSex, setReferenceSex] = React.useState<ProfileReferenceSex | null>(profile.referenceSex);
  const [menopauseStage, setMenopauseStage] = React.useState<MenopauseStage | null>(profile.menopauseStage);
  const voicePreviewRef = React.useRef<VoiceChannel | null>(null);
  const available = profile.safetyProfile?.availableEquipment ?? ['chair', 'wall'];
  const displayName = profile.name.trim() || 'Your details';
  const goalText = profile.lifeGoal
    ? getLifeGoalDisplayText(profile.lifeGoal)
    : normalizeLifeGoalDisplayText(profile.goal) || 'Set a movement goal';
  const profileGoalText = goalContinuationText(goalText);
  const effortLabel = startingEffortLabel(startingEffort);
  const planSummary = `${preferredDaysSummary(preferredDays)} · ${effortLabel}`;
  const selectedVoiceLabel = getVoice(settings.voiceId).label;
  const showInternalDeveloperSettings = !!onReplayOnboardingForDev;
  const showDeveloperSettings = showInternalDeveloperSettings;

  React.useEffect(() => setName(profile.name), [profile.name]);
  React.useEffect(() => {
    setDateOfBirthText(dateOfBirthInputLabel(profile.dateOfBirth));
  }, [profile.dateOfBirth]);
  React.useEffect(() => setReferenceSex(profile.referenceSex), [profile.referenceSex]);
  React.useEffect(() => setMenopauseStage(profile.menopauseStage), [profile.menopauseStage]);
  React.useEffect(() => () => voicePreviewRef.current?.stop(), []);
  React.useEffect(() => {
    if (Platform.OS !== 'android' || openSection === null) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpenSection(null);
      return true;
    });
    return () => subscription.remove();
  }, [openSection]);

  const openProfileSection = (section: ProfileSection) => setOpenSection(section);
  const previewVoice = React.useCallback((voiceId: string) => {
    voicePreviewRef.current?.stop();
    const channel = new VoiceChannel(voiceId);
    voicePreviewRef.current = channel;
    channel.speak([VOICE_PREVIEW_CUE], 100);
  }, []);

  const commitName = () => onProfileChange({ ...profile, name: name.trim() });
  const commitReferenceDetails = (
    birthDateText: string = dateOfBirthText,
    nextReferenceSex: ProfileReferenceSex | null = referenceSex,
    nextMenopauseStage: MenopauseStage | null = menopauseStage
  ) => {
    const dateOfBirth = normalizeDateOfBirth(birthDateText) ?? normalizeDateOfBirthInput(birthDateText);
    const exactAge = ageFromDateOfBirth(dateOfBirth);
    if (dateOfBirth === null || exactAge === null) return;
    const ageBand = ageBandForAge(exactAge);
    const now = new Date().toISOString();
    onProfileChange({
      ...profile,
      dateOfBirth,
      exactAge,
      referenceSex: nextReferenceSex,
      // The stage question only applies to the female reference group.
      menopauseStage: nextReferenceSex === 'female' ? nextMenopauseStage : null,
      age: exactAge,
      ageBand,
      safetyProfile: profile.safetyProfile
        ? {
            ...profile.safetyProfile,
            age: exactAge,
            ageBand: ageBand ?? undefined,
            updatedAt: now,
          }
        : profile.safetyProfile,
        });
  };
  const updateDateOfBirth = (dateOfBirth: string) => {
    setDatePickerVisible(false);
    setDateOfBirthText(dateOfBirthInputLabel(dateOfBirth));
    commitReferenceDetails(dateOfBirth);
  };
  const updateReferenceSex = (next: ProfileReferenceSex) => {
    setReferenceSex(next);
    commitReferenceDetails(dateOfBirthText, next);
  };
  const updateMenopauseStage = (next: MenopauseStage) => {
    setMenopauseStage(next);
    commitReferenceDetails(dateOfBirthText, referenceSex, next);
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
          <PersonalDetailsCard
            name={name}
            onNameChange={setName}
            onNameBlur={commitName}
            dateOfBirthText={dateOfBirthText}
            onOpenDateOfBirthPicker={() => setDatePickerVisible(true)}
            referenceSex={referenceSex}
            onReferenceSexChange={updateReferenceSex}
            menopauseStage={menopauseStage}
            onMenopauseStageChange={updateMenopauseStage}
            movementGoal={goalText}
            onOpenLifeGoal={onOpenLifeGoal}
          />
        </>
      );
    }

    if (openSection === 'safety') {
      return (
        <>
          <DetailOverview
            title="Private camera use"
            body={`${BRAND.appName} checks your position without showing your video.`}
          />

          <SafetyReadinessCard onOpenCameraSetup={onOpenCameraSetup} />
        </>
      );
    }

    if (openSection === 'plan') {
      return (
        <>
          <DetailOverview
            title={planSummary}
            body={`${BRAND.appName} uses these preferences for future workouts, then adjusts for safety and comfort.`}
            meta="Used for future workouts"
          />

          <PreferenceCard
            title="Training days"
            subtitle="Pick the days that fit your week."
            meta={trainingDayMeta(preferredDays)}
          >
            <DayPreferencePicker selectedDays={preferredDays} onToggleDay={toggleDay} />
          </PreferenceCard>

          <PreferenceCard
            title="Workout effort"
            subtitle="Choose how hard workouts should feel at the start."
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
            title="Basic setup"
            body={`${BRAND.appName} starts with a chair and nearby support, then adds optional items you turn on.`}
            meta={controlledBetaEquipmentPositioning.shortLabel}
          />

          <DetailCard
            title="Optional items"
            body={`Turn on only items you have and feel safe using. ${BRAND.appName} will adapt when something is off.`}
          >
            <View style={styles.toggleStack}>
              <ToggleRow
                label="Bottom stair"
                description="Use only if it is low, stable, and near support."
                value={available.includes('stairs')}
                onValueChange={() => onToggleAvailableEquipment('stairs')}
              />
              <ToggleRow
                label="Resistance band"
                description="Used for some upper-body pulling exercises."
                value={available.includes('resistance_band')}
                onValueChange={() => onToggleAvailableEquipment('resistance_band')}
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
                value={available.includes('mini_band')}
                onValueChange={() => onToggleAvailableEquipment('mini_band')}
              />
              <ToggleRow
                label="Backpack or light weight"
                description="Used only for gentle added load."
                value={available.includes('backpack')}
                onValueChange={() => onToggleAvailableEquipment('backpack')}
              />
              <ToggleRow
                label="Floor space for mat exercises"
                description="Enough clear space to lie down safely."
                value={available.includes('floor_space')}
                onValueChange={() => onToggleAvailableEquipment('floor_space')}
              />
            </View>
          </DetailCard>

          {painExclusions.length > 0 && onReinstateExercise ? (
            <DetailCard
              title="Swapped-out movements"
              body="These were swapped out of your plan after they hurt in two recent sessions. If one keeps bothering you, it's worth mentioning to your doctor. Bring a movement back whenever you're ready."
            >
              <View style={styles.toggleStack}>
                {painExclusions.map((exclusion) => (
                  <ToggleRow
                    key={exclusion.ladderId}
                    label={exclusion.title}
                    description="Off for now. Turn on to bring it back into your plan."
                    value={false}
                    onValueChange={() => onReinstateExercise(exclusion.ladderId)}
                  />
                ))}
              </View>
            </DetailCard>
          ) : null}

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
            title="Private by default"
            body={`${BRAND.appName} uses the camera to measure movement. You never see a live video, and ${BRAND.appName} does not save it.`}
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
      <>
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
              <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>{copy.title}</Text>
            </View>
            <Text style={styles.detailSubtitle}>{copy.subtitle}</Text>
          </View>
          {renderSectionContent()}
        </Screen>
        <DateOfBirthPickerModal
          visible={datePickerVisible}
          value={normalizeDateOfBirth(dateOfBirthText) ?? profile.dateOfBirth}
          title="Date of birth"
          maximumAge={120}
          onCancel={() => setDatePickerVisible(false)}
          onConfirm={updateDateOfBirth}
        />
      </>
    );
  }

  return (
    <Screen contentStyle={styles.screenContent}>
      {onBack ? <BackArrowButton accessibilityLabel="Back" onPress={onBack} /> : null}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <HeaderLogo />
          <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>Settings</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.profileCard,
          responsive.isCompactPhone && styles.compactCardPadding,
          pressed && styles.pressed,
        ]}
        onPress={() => openProfileSection('details')}
        accessibilityRole="button"
        accessibilityLabel="Edit personal details"
      >
        <View style={styles.avatar}>
          <ProfileDetailsGlyph />
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.profileGoalBlock}>
            <Text style={styles.profileGoalPrompt}>In the future, I want to be able to</Text>
            <Text style={styles.profileGoalText} numberOfLines={2}>
              {profileGoalText}
            </Text>
          </View>
        </View>
      </Pressable>

      <SettingsSection title="Workouts">
        <ProfileMenuRow
          title={SECTION_COPY.plan.title}
          icon="sliders"
          onPress={() => openProfileSection('plan')}
          showDivider
        />
        <ProfileMenuRow
          title={SECTION_COPY.equipment.title}
          icon="dumbbell"
          onPress={() => openProfileSection('equipment')}
          showDivider
        />
        <ProfileMenuRow
          title="Safety profile"
          subtitle="Support, comfort, and pain details."
          icon="shield"
          onPress={onOpenSafetyProfile}
          showDivider
        />
        <ProfileMenuRow
          title={SECTION_COPY.voice.title}
          subtitle={selectedVoiceLabel}
          icon="volume"
          onPress={() => openProfileSection('voice')}
        />
      </SettingsSection>

      <SettingsSection title="Camera & privacy">
        <ProfileMenuRow
          title={SECTION_COPY.safety.title}
          icon="camera"
          onPress={() => openProfileSection('safety')}
          showDivider
        />
        <ProfileMenuRow
          title={SECTION_COPY.privacy.title}
          icon="lock"
          onPress={() => openProfileSection('privacy')}
        />
      </SettingsSection>

      <SettingsSection title="Account & data">
        <ProfileMenuRow
          title={SECTION_COPY.account.title}
          icon="account"
          onPress={() => openProfileSection('account')}
        />
      </SettingsSection>

      {showDeveloperSettings ? (
        <SettingsSection title="Developer">
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
  const responsive = useResponsiveLayout();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuRow,
        responsive.isCompactPhone && styles.compactCardPadding,
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
      <Text style={styles.chevron}>{'›'}</Text>
    </Pressable>
  );
}

function DetailOverview({
  icon,
  title,
  body,
  meta,
}: {
  icon?: MenuIconName;
  title: string;
  body?: string;
  meta?: string;
}) {
  const responsive = useResponsiveLayout();
  return (
    <View style={[styles.detailOverview, responsive.isCompactPhone && styles.compactCardPadding]}>
      {icon ? (
        <View style={styles.detailOverviewIcon}>
          <MenuIcon name={icon} />
        </View>
      ) : null}
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
  const responsive = useResponsiveLayout();
  return (
    <View style={[styles.detailCard, responsive.isCompactPhone && styles.compactCardPadding]}>
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
  const responsive = useResponsiveLayout();
  return (
    <View style={[styles.voiceSelectorCard, responsive.isCompactPhone && styles.compactCardPadding]}>
      <View style={styles.voiceSelectorHeader}>
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
  const responsive = useResponsiveLayout();
  const disabled = !voice.available;
  const rowLabel = `${voice.label}${selected ? ', selected' : ''}`;

  return (
    <View
      style={[
        styles.voiceOptionRow,
        responsive.isCompactPhone && styles.compactCardPadding,
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
        </View>
        <SelectionIndicator selected={selected} />
      </Pressable>
    </View>
  );
}

function SafetyReadinessCard({ onOpenCameraSetup }: { onOpenCameraSetup: () => void }) {
  const responsive = useResponsiveLayout();
  return (
    <View style={[styles.safetyCard, responsive.isCompactPhone && styles.compactCardPadding]}>
      <View style={styles.safetyCardHeader}>
        <View style={styles.safetyCardTitleGroup}>
          <Text style={styles.safetyCardTitle}>Phone placement</Text>
          <Text style={styles.safetyCardBody}>
            Place your phone on a steady stand, shelf, or stack of books so it will not slide.
          </Text>
        </View>
      </View>

      <View style={styles.safetyActionList}>
        <SafetyActionRow
          icon="camera"
          title="See camera setup tips"
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
  body?: string;
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
        {body ? <Text style={styles.safetyActionBody}>{body}</Text> : null}
      </View>
      <Text style={styles.safetyActionChevron}>{'›'}</Text>
    </Pressable>
  );
}

function PersonalDetailsCard({
  name,
  onNameChange,
  onNameBlur,
  dateOfBirthText,
  onOpenDateOfBirthPicker,
  referenceSex,
  onReferenceSexChange,
  menopauseStage,
  onMenopauseStageChange,
  movementGoal,
  onOpenLifeGoal,
}: {
  name: string;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  dateOfBirthText: string;
  onOpenDateOfBirthPicker: () => void;
  referenceSex: ProfileReferenceSex | null;
  onReferenceSexChange: (value: ProfileReferenceSex) => void;
  menopauseStage: MenopauseStage | null;
  onMenopauseStageChange: (value: MenopauseStage) => void;
  movementGoal: string;
  onOpenLifeGoal: () => void;
}) {
  const responsive = useResponsiveLayout();
  const dateOfBirth = normalizeDateOfBirth(dateOfBirthText);
  const exactAge = ageFromDateOfBirth(dateOfBirth);
  return (
    <View style={[styles.personalCard, responsive.isCompactPhone && styles.compactCardPadding]}>
      <View style={styles.personalCardIntro}>
        <Text style={styles.personalCardTitle}>Details</Text>
        <Text style={styles.personalCardDescription}>
          {BRAND.appName} uses these details to personalize your plan and explain your results.
        </Text>
      </View>

      <View style={styles.personalFieldGroup}>
        <View style={[styles.personalIdentityPanel, responsive.isCompactPhone && styles.compactCardPadding]}>
          <View style={styles.personalIdentityRow}>
            <View style={styles.personalNameField}>
              <Text style={styles.personalFieldLabel}>Name</Text>
              <TextInput
                style={styles.personalFieldInput}
                value={name}
                onChangeText={onNameChange}
                onBlur={onNameBlur}
                placeholder="Enter your name"
                placeholderTextColor={colors.textTertiary}
                returnKeyType="done"
                autoCapitalize="words"
                autoCorrect={false}
                accessibilityLabel="Name"
              />
            </View>
          </View>
        </View>

        <View style={[styles.personalAgeRangePanel, responsive.isCompactPhone && styles.compactCardPadding]}>
          <View style={styles.personalAgeRangeHeader}>
            <Text style={styles.personalFieldLabel}>Reference details</Text>
            <Text style={styles.personalAgeRangeValue}>
              {exactAge !== null && referenceSex ? `${exactAge} · ${referenceSexSummary(referenceSex)}` : 'Required'}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.personalDateButton, pressed && styles.pressed]}
            onPress={onOpenDateOfBirthPicker}
            accessibilityRole="button"
            accessibilityLabel="Select date of birth"
          >
            <Text
              style={[
                styles.personalFieldInput,
                !dateOfBirthText && styles.personalFieldPlaceholder,
              ]}
              numberOfLines={1}
            >
              {dateOfBirthText || 'Select date of birth'}
            </Text>
            <Text style={styles.personalDateButtonAction}>{dateOfBirthText ? 'Change' : 'Select'}</Text>
          </Pressable>
          <View style={styles.personalAgeOptionGrid}>
            {(['female', 'male'] as const).map((option) => {
              const selected = referenceSex === option;
              return (
                <Pressable
                  key={option}
                  style={({ pressed }) => [
                    styles.personalAgeOption,
                    styles.personalAgeOptionWide,
                    selected && styles.personalAgeOptionSelected,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => onReferenceSexChange(option)}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${option} reference group`}
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[styles.personalAgeOptionText, selected && styles.personalAgeOptionTextSelected]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.88}
                  >
                    {referenceSexSummary(option)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {referenceSex === 'female' ? (
            <>
              <Text style={styles.personalFieldLabel}>Menopause stage</Text>
              <View style={styles.personalAgeOptionGrid}>
                {MENOPAUSE_STAGE_OPTIONS.map((option) => {
                  const selected = menopauseStage === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={({ pressed }) => [
                        styles.personalAgeOption,
                        styles.personalAgeOptionWide,
                        selected && styles.personalAgeOptionSelected,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => onMenopauseStageChange(option.value)}
                      accessibilityRole="button"
                      accessibilityLabel={option.label}
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
              <Text style={styles.personalFieldHint}>
                Shapes {BRAND.appName}'s guidance — never how your results are measured.
              </Text>
            </>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.personalGoalPanel,
            responsive.isCompactPhone && styles.compactCardPadding,
            pressed && styles.pressed,
          ]}
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
                <Text style={styles.personalGoalChevron}>{'›'}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function referenceSexSummary(referenceSex: ProfileReferenceSex): string {
  return referenceSex === 'female' ? 'Female' : 'Male';
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
      title={`What ${BRAND.appName} saves`}
      body={`${BRAND.appName} saves only what it needs for your plan and results.`}
    >
      <View style={styles.privacyLedger}>
        <PrivacyLedgerRow
          icon="sliders"
          label="Check-up and workout results"
          body="Saved so you can track progress."
          value="Saved"
          first
        />
        <PrivacyLedgerRow
          icon="account"
          label="Profile information"
          body="Name, age, reference group, and movement goal."
          value="Saved"
        />
        <PrivacyLedgerRow
          icon="shield"
          label="Safety preferences"
          body="Support, comfort, equipment, and camera setup."
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
  const responsive = useResponsiveLayout();
  return (
    <View style={[styles.preferenceCard, responsive.isCompactPhone && styles.compactCardPadding]}>
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
  const responsive = useResponsiveLayout();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.sessionFeelOption,
        responsive.isCompactPhone && styles.compactCardPadding,
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

function goalContinuationText(goal: string): string {
  const trimmed = goal.trim();
  const withoutPrompt = trimmed
    .replace(/^in\s+the\s+future,\s+i\s+want\s+to\s+be\s+able\s+to\s+/i, '')
    .replace(/^i\s+want\s+to\s+be\s+able\s+to\s+/i, '')
    .replace(/^my\s+goal\s+is\s+to\s+/i, '')
    .replace(/^i\s+want\s+to\s+/i, '')
    .replace(/^to\s+/i, '');
  if (!withoutPrompt) return trimmed;
  return withoutPrompt.charAt(0).toLocaleLowerCase() + withoutPrompt.slice(1);
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
    gap: 7,
  },
  profileName: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.primaryText,
  },
  profileGoalBlock: {
    gap: 2,
  },
  profileGoalPrompt: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  profileGoalText: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textSecondary,
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
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
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
    ...type.cardTitle,
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
    // Comfortable tap target for the 50+ audience (matches minTapTarget).
    width: 48,
    height: 48,
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
    alignItems: 'center',
    justifyContent: 'center',
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
  personalCardIntro: {
    gap: spacing.xs,
  },
  personalCardTitle: {
    ...type.cardTitle,
    color: colors.primaryText,
  },
  personalCardDescription: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  personalFieldGroup: {
    gap: spacing.md,
  },
  personalIdentityPanel: {
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  personalIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  personalNameField: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  personalAgeRangePanel: {
    gap: spacing.sm,
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
  personalFieldHint: {
    ...type.caption,
    color: colors.textSecondary,
  },
  personalFieldInput: {
    fontFamily: fonts.serifRegular,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0,
    minHeight: 26,
    padding: 0,
    paddingVertical: 0,
    includeFontPadding: false,
    marginTop: 1,
    color: colors.primaryText,
    backgroundColor: 'transparent',
  },
  personalDateButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
  },
  personalFieldPlaceholder: {
    color: colors.textTertiary,
  },
  personalDateButtonAction: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  personalAgeOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    marginTop: spacing.md,
  },
  personalAgeOption: {
    minHeight: 48,
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
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
    color: colors.primaryText,
  },
  personalGoalChevron: {
    ...type.h2,
    color: colors.textSecondary,
    lineHeight: 27,
    flexShrink: 0,
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
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 92,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  privacyLedgerPillText: {
    ...type.caption,
    lineHeight: 17,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    textAlign: 'right',
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
