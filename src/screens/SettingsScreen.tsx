/**
 * Settings screen: four MVP sections — details, workout and voice, safety and
 * camera, privacy and data. Accounts, fake scheduling, and no-effect equipment
 * controls remain out of the product surface.
 */

import * as React from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { ActivityLevel } from '../adherence';
import { VoiceChannel } from '../audio/voicePlayer';
import { BackArrowButton } from '../components/BackArrowButton';
import { DateOfBirthPickerModal } from '../components/DateOfBirthPickerModal';
import { HeaderLogo } from '../components/HeaderLogo';
import { Button, Screen, ToggleRow } from '../components/ui';
import {
  AppSettings,
  MENOPAUSE_STAGE_OPTIONS,
  STARTING_PACE_OPTIONS,
  SYMPTOM_PICTURE_TOGGLE_OPTIONS,
  ageFromDateOfBirth,
  ageBandForAge,
  dateOfBirthInputLabel,
  isSymptomToggleSelected,
  normalizeDateOfBirth,
  normalizeDateOfBirthInput,
  toggleSymptomPicture,
  startingEffortLabel,
  type MenopauseStage,
  type MenopauseSymptomPicture,
  type ProfileReferenceSex,
  UserProfile,
  VOICE_OPTIONS,
  getVoice,
} from '../profile';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

import { BRAND } from '../brand';
const VOICE_PREVIEW_CUE = 'voice-preview' as const;

type ProfileSection =
  | 'details'
  | 'safety'
  | 'workout'
  | 'privacy';

type VoiceCatalogOption = (typeof VOICE_OPTIONS)[number];

const SECTION_COPY: Record<ProfileSection, { title: string; subtitle: string }> = {
  details: {
    title: 'Your profile',
    subtitle: 'Update your name and reference details.',
  },
  safety: {
    title: 'Safety & camera',
    subtitle: 'Review movement support and private camera setup.',
  },
  workout: {
    title: 'Workout & voice',
    subtitle: 'Choose your starting effort and trainer voice.',
  },
  privacy: {
    title: 'Privacy & data',
    subtitle: `See what ${BRAND.appName} shows and saves.`,
  },
};

export interface SettingsSafetyPreferences {
  balanceSupportDefault: boolean;
  lowImpact: boolean;
  quietMode: boolean;
  hasStairs: boolean | null;
  consentHealthData: boolean;
}

type SettingsScreenProps = {
  profile: UserProfile;
  settings: AppSettings;
  startingEffort: ActivityLevel;
  safetyPreferences: SettingsSafetyPreferences;
  onProfileChange: (next: UserProfile) => void;
  onSettingsChange: (next: AppSettings) => void;
  onStartingEffortChange: (startingEffort: ActivityLevel) => void;
  onSafetyPreferencesChange: (next: SettingsSafetyPreferences) => void;
  onOpenCameraSetup: () => void;
  onClearDeviceData: () => Promise<void>;
  onDataCleared: () => void;
  onBack?: () => void;
  /** DEV-only (gated on `__DEV__` by the caller): seed a mock multi-session,
   * multi-check-up journey so the screens can be viewed populated. */
  onFillSampleData?: () => void;
  /** DEV-only: clear check-up history and reset the programme to a fresh,
   * still-onboarded state. */
  onResetSampleData?: () => void;
};

export function SettingsScreen(props: SettingsScreenProps) {
  return <SettingsScreenContent {...props} />;
}

function SettingsScreenContent({
  profile,
  settings,
  startingEffort,
  safetyPreferences,
  onProfileChange,
  onSettingsChange,
  onStartingEffortChange,
  onSafetyPreferencesChange,
  onOpenCameraSetup,
  onClearDeviceData,
  onDataCleared,
  onBack,
  onFillSampleData,
  onResetSampleData,
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
  const [symptomPicture, setSymptomPicture] = React.useState<MenopauseSymptomPicture | null>(
    profile.symptomPicture
  );
  const voicePreviewRef = React.useRef<VoiceChannel | null>(null);
  const displayName = profile.name.trim() || 'Your details';
  const effortLabel = startingEffortLabel(startingEffort);
  const selectedVoiceLabel = getVoice(settings.voiceId).label;
  const profileSummary = profileReferenceSummary(profile);

  React.useEffect(() => setName(profile.name), [profile.name]);
  React.useEffect(() => {
    setDateOfBirthText(dateOfBirthInputLabel(profile.dateOfBirth));
  }, [profile.dateOfBirth]);
  React.useEffect(() => setReferenceSex(profile.referenceSex), [profile.referenceSex]);
  React.useEffect(() => setMenopauseStage(profile.menopauseStage), [profile.menopauseStage]);
  React.useEffect(() => setSymptomPicture(profile.symptomPicture), [profile.symptomPicture]);
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
    nextMenopauseStage: MenopauseStage | null = menopauseStage,
    nextSymptomPicture: MenopauseSymptomPicture | null = symptomPicture
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
      // The stage and symptom questions only apply to the female reference group.
      menopauseStage: nextReferenceSex === 'female' ? nextMenopauseStage : null,
      symptomPicture: nextReferenceSex === 'female' ? nextSymptomPicture : null,
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
  const updateSymptomPicture = (next: MenopauseSymptomPicture | null) => {
    setSymptomPicture(next);
    commitReferenceDetails(dateOfBirthText, referenceSex, menopauseStage, next);
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
            symptomPicture={symptomPicture}
            onSymptomPictureChange={updateSymptomPicture}
          />
        </>
      );
    }

    if (openSection === 'safety') {
      return (
        <>
          <DetailOverview
            title="Safe support, private camera"
            body="Review movement support choices and how to place your phone securely. Camera video is never shown or saved."
            meta={safetyPreferences.consentHealthData ? 'Health answers used on this device' : 'Health answers are off'}
          />

          <SafetyPreferencesCard
            value={safetyPreferences}
            onChange={onSafetyPreferencesChange}
          />

          <SafetyReadinessCard onOpenCameraSetup={onOpenCameraSetup} />
        </>
      );
    }

    if (openSection === 'workout') {
      return (
        <>
          <DetailOverview
            title={`${effortLabel} · ${selectedVoiceLabel}`}
            body="Starting effort shapes programme placement. Your trainer voice guides both workouts and check-ups."
            meta="Workout preferences"
          />

          <PreferenceCard
            title="Starting effort"
            subtitle="Used when your programme sets or refreshes starting levels."
            meta={effortLabel}
          >
            <SessionFeelPicker selected={startingEffort} onSelect={onStartingEffortChange} />
          </PreferenceCard>

          <VoiceSelectorCard
            selectedVoiceId={settings.voiceId}
            onSelectVoice={(voiceId) => onSettingsChange({ ...settings, voiceId })}
            onPreviewVoice={previewVoice}
          />
        </>
      );
    }

    if (openSection === 'privacy') {
      return (
        <>
          <DetailOverview
            title="Private by default"
            body={`${BRAND.appName} uses the camera to measure movement. You never see a live video, and ${BRAND.appName} does not save it.`}
          />

          <PrivacyStorageCard />

          <ClearDeviceDataCard
            onClearDeviceData={onClearDeviceData}
            onDataCleared={onDataCleared}
          />

          {/* Population-comparison switch (reposition slice 5, condition 3):
              the results screen is the front door; this is where the switch
              can always be found. Default off — her own trend leads. */}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Results</Text>
            <ToggleRow
              label="Compare with published values"
              description="Show results next to published values for your age and sex, where a result supports it. Off by default — your own trend leads."
              value={settings.comparisonOptIn}
              onValueChange={(value) => onSettingsChange({ ...settings, comparisonOptIn: value })}
            />
          </View>
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
          <Text style={styles.profileSummary} numberOfLines={2}>{profileSummary}</Text>
        </View>
      </Pressable>

      <SettingsSection title="Workout">
        <ProfileMenuRow
          title={SECTION_COPY.workout.title}
          subtitle={`${effortLabel} · ${selectedVoiceLabel}`}
          icon="sliders"
          onPress={() => openProfileSection('workout')}
        />
      </SettingsSection>

      <SettingsSection title="Safety">
        <ProfileMenuRow
          title={SECTION_COPY.safety.title}
          subtitle="Movement support and private camera setup."
          icon="shield"
          onPress={() => openProfileSection('safety')}
        />
      </SettingsSection>

      <SettingsSection title="Privacy">
        <ProfileMenuRow
          title={SECTION_COPY.privacy.title}
          subtitle="Local storage, comparisons, and delete data."
          icon="lock"
          onPress={() => openProfileSection('privacy')}
        />
      </SettingsSection>

      {__DEV__ && onFillSampleData ? (
        <SettingsSection title="Developer">
          <ProfileMenuRow
            title="Fill with sample data"
            subtitle="Seed months of sessions and check-ups to preview every screen."
            icon="sliders"
            onPress={onFillSampleData}
            showDivider={!!onResetSampleData}
          />
          {onResetSampleData ? (
            <ProfileMenuRow
              title="Reset to fresh"
              subtitle="Clear check-ups and reset the programme to a clean start."
              icon="bell"
              onPress={onResetSampleData}
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

function SafetyPreferencesCard({
  value,
  onChange,
}: {
  value: SettingsSafetyPreferences;
  onChange: (next: SettingsSafetyPreferences) => void;
}) {
  return (
    <DetailCard
      title="Movement support"
      body="These choices change upcoming sessions immediately. You can still stop or skip any movement."
    >
      <View style={styles.safetyPreferenceStack}>
        <ConservativeSafetyRow
          label="Keep support nearby for balance"
          description="Uses supported balance variations by default. Once enabled, this protection stays on."
          enabled={value.balanceSupportDefault}
          onEnable={() => onChange({ ...value, balanceSupportDefault: true })}
        />
        <ToggleRow
          label="Keep sessions low impact"
          description="Leaves out the stomping finisher and uses the low-impact route."
          value={value.lowImpact}
          onValueChange={(lowImpact) => onChange({ ...value, lowImpact })}
        />
        <ToggleRow
          label="Avoid stomping sounds"
          description="Keeps the quiet finisher route on."
          value={value.quietMode}
          onValueChange={(quietMode) => onChange({ ...value, quietMode })}
        />
        <ToggleRow
          label="Use my low, stable step"
          description="Only enable this when fixed support is nearby."
          value={value.hasStairs === true}
          onValueChange={(hasStairs) => onChange({ ...value, hasStairs })}
        />
      </View>
    </DetailCard>
  );
}

function ConservativeSafetyRow({
  label,
  description,
  enabled,
  onEnable,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onEnable: () => void;
}) {
  return (
    <View style={styles.conservativeSafetyRow}>
      <View style={styles.conservativeSafetyCopy}>
        <Text style={styles.conservativeSafetyLabel}>{label}</Text>
        <Text style={styles.conservativeSafetyDescription}>{description}</Text>
      </View>
      {enabled ? (
        <Text style={styles.conservativeSafetyStatus}>On</Text>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.conservativeSafetyButton, pressed && styles.pressed]}
          onPress={onEnable}
          accessibilityRole="button"
          accessibilityLabel={`Turn on ${label}`}
        >
          <Text style={styles.conservativeSafetyButtonText}>Turn on</Text>
        </Pressable>
      )}
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
          body="Use a steady stand, shelf, or stack of books."
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
  symptomPicture,
  onSymptomPictureChange,
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
  symptomPicture: MenopauseSymptomPicture | null;
  onSymptomPictureChange: (value: MenopauseSymptomPicture | null) => void;
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
              <Text style={styles.personalFieldLabel}>Symptom picture (optional)</Text>
              <View style={styles.personalAgeOptionGrid}>
                {SYMPTOM_PICTURE_TOGGLE_OPTIONS.map((option) => {
                  const selected = isSymptomToggleSelected(symptomPicture, option.value);
                  return (
                    <Pressable
                      key={option.value}
                      style={({ pressed }) => [
                        styles.personalAgeOption,
                        styles.personalAgeOptionWide,
                        selected && styles.personalAgeOptionSelected,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => onSymptomPictureChange(toggleSymptomPicture(symptomPicture, option.value))}
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
                Saved as optional context in your profile. It does not change your results or workouts yet.
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function referenceSexSummary(referenceSex: ProfileReferenceSex): string {
  return referenceSex === 'female' ? 'Female' : 'Male';
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
          body="Support, comfort, and camera setup."
          value="Saved"
        />
        <PrivacyLedgerRow
          icon="shield"
          label="Microphone — session and safety words"
          body="Listens for a few words during workouts and converts them on your phone into short commands. Nothing you say is saved or uploaded."
          value="Never saved"
        />
      </View>
    </DetailCard>
  );
}

function ClearDeviceDataCard({
  onClearDeviceData,
  onDataCleared,
}: {
  onClearDeviceData: () => Promise<void>;
  onDataCleared: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [cleared, setCleared] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const clearDeviceData = async () => {
    if (clearing) return;
    setClearing(true);
    setError(null);
    try {
      await onClearDeviceData();
      setCleared(true);
      setConfirming(false);
    } catch {
      setError(
        `${BRAND.appName} could not clear all data. Some items may already have been removed. Please try again.`
      );
    } finally {
      setClearing(false);
    }
  };

  if (cleared) {
    return (
      <DetailCard
        title="Data cleared"
        body={`${BRAND.appName} removed your profile, check-ups, workout progress, and settings from this device.`}
      >
        <Button title="Start again" onPress={onDataCleared} />
      </DetailCard>
    );
  }

  return (
    <DetailCard
      title={confirming ? 'Clear all data from this device?' : 'Data on this device'}
      body={
        confirming
          ? 'This permanently removes your profile, check-ups, workout progress, and settings from this device. It cannot be undone.'
          : `Your ${BRAND.appName} profile, check-ups, workout progress, and settings are stored on this device.`
      }
    >
      {error ? (
        <Text style={styles.clearDataError} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {confirming ? (
        <View style={styles.clearDataActions}>
          <Button
            title={clearing ? 'Clearing data...' : 'Clear all data'}
            variant="danger"
            disabled={clearing}
            accessibilityLabel={`Permanently clear all ${BRAND.appName} data from this device`}
            onPress={() => void clearDeviceData()}
          />
          <Button
            title="Keep my data"
            variant="secondary"
            disabled={clearing}
            onPress={() => {
              setConfirming(false);
              setError(null);
            }}
          />
        </View>
      ) : (
        <Button
          title="Clear data on this device"
          variant="danger"
          onPress={() => {
            setConfirming(true);
            setError(null);
          }}
        />
      )}
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

function profileReferenceSummary(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.exactAge !== null && profile.exactAge !== undefined) {
    parts.push(`Age ${profile.exactAge}`);
  }
  if (profile.referenceSex) parts.push(`${referenceSexSummary(profile.referenceSex)} reference`);
  return parts.length > 0 ? parts.join(' · ') : 'Review your profile details';
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
    minHeight: 116,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.card,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
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
  profileSummary: {
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
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
    textTransform: 'uppercase',
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
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
  safetyPreferenceStack: {
    gap: spacing.md,
  },
  conservativeSafetyRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  conservativeSafetyCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  conservativeSafetyLabel: {
    ...type.bodySmall,
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
  },
  conservativeSafetyDescription: {
    ...type.caption,
    color: colors.textSecondary,
  },
  conservativeSafetyStatus: {
    ...type.cardBody,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  conservativeSafetyButton: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentBorder,
  },
  conservativeSafetyButtonText: {
    ...type.cardBody,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  voiceSelectorCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
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
  preferenceCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
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
  clearDataActions: {
    gap: spacing.sm,
  },
  clearDataError: {
    ...type.caption,
    color: colors.error,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
