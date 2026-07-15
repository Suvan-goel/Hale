/**
 * Settings screen: profile, workout/voice, safety/camera, optional online
 * profile, and privacy/data. Fake scheduling and no-effect equipment controls
 * remain out of the product surface.
 */

import * as React from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  LIFE_GOAL_PRESETS,
  createLifeGoal,
  getLifeGoalDisplayText,
} from '../adherence/goalDomainMapping';
import type { ActivityLevel, LifeGoal, LifeGoalCategory } from '../adherence/types';
import { VoiceChannel } from '../audio/voicePlayer';
import { AccountAuthCard } from '../components/AccountAuthCard';
import { isOnlineProfilesEnabled } from '../config/onlineProfiles';
import { DateOfBirthPickerModal } from '../components/DateOfBirthPickerModal';
import { PageHeader } from '../components/PageHeader';
import { Button, Screen, ToggleRow } from '../components/ui';
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
  type MenopauseSymptomPicture,
  type ProfileReferenceSex,
  UserProfile,
  VOICE_OPTIONS,
  getVoice,
} from '../profile';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';
import type { JointFlag } from '../programme';
import type {
  OnlineProfileConflictResolution,
  OnlineProfileSyncState,
} from '../services/backend';
import {
  confirmGentleStartSafetyStep,
  removeHealthAnswers,
  saveHealthAnswers,
  type SettingsSafetyPreferences,
} from '../settings/healthAnswerPreferences';

import { BRAND } from '../brand';
const VOICE_PREVIEW_CUE = 'voice-preview' as const;

type ProfileSection =
  | 'details'
  | 'safety'
  | 'health'
  | 'gentle-start'
  | 'workout'
  | 'account'
  | 'privacy';

type VoiceCatalogOption = (typeof VOICE_OPTIONS)[number];

const SECTION_COPY: Record<ProfileSection, { title: string; subtitle: string }> = {
  details: {
    title: 'Your profile',
    subtitle: 'Update your name, goal, and reference details.',
  },
  safety: {
    title: 'Safety & camera',
    subtitle: 'Review movement support and private camera setup.',
  },
  health: {
    title: 'Health answers',
    subtitle: 'Review the local answers that shape safer starting choices.',
  },
  'gentle-start': {
    title: 'Gentle Start',
    subtitle: 'Review the safety step that keeps your Movement Check-Up unavailable.',
  },
  workout: {
    title: 'Sessions & voice',
    subtitle: 'Choose your starting effort and trainer voice.',
  },
  account: {
    title: 'Online profile',
    subtitle: 'Sign in, sync your profile, or manage your account.',
  },
  privacy: {
    title: 'Privacy & data',
    subtitle: `See what ${BRAND.appName} shows and saves.`,
  },
};

export type { SettingsSafetyPreferences } from '../settings/healthAnswerPreferences';

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
  cameraPermission: 'checking' | 'granted' | 'undetermined' | 'denied';
  onRequestCameraPermission: () => void;
  onClearDeviceData: () => Promise<void>;
  onDataCleared: () => void;
  onlineProfileSyncState: OnlineProfileSyncState;
  onRetryOnlineProfileSync: () => void;
  onResolveOnlineProfileConflict: (
    resolution: Exclude<OnlineProfileConflictResolution, 'automatic'>
  ) => void;
  /** Opens a specific Settings editor when another surface has one required fix. */
  initialSection?: ProfileSection;
  onBack?: () => void;
  /** DEV-only (gated on `__DEV__` by the caller): seed a mock multi-session,
   * multi-check-up journey so the screens can be viewed populated. */
  onFillSampleData?: () => void;
  /** DEV-only: clear check-up history and reset the programme to a fresh,
   * still-onboarded state. */
  onResetSampleData?: () => void;
  /** DEV-only: preview onboarding again without changing saved programme data. */
  onReplayOnboarding?: () => void;
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
  cameraPermission,
  onRequestCameraPermission,
  onClearDeviceData,
  onDataCleared,
  onlineProfileSyncState,
  onRetryOnlineProfileSync,
  onResolveOnlineProfileConflict,
  initialSection,
  onBack,
  onFillSampleData,
  onResetSampleData,
  onReplayOnboarding,
}: SettingsScreenProps) {
  const [openSection, setOpenSection] = React.useState<ProfileSection | null>(
    initialSection ?? null
  );
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
  const showOnlineProfile =
    isOnlineProfilesEnabled() || onlineProfileSyncState.status !== 'signed_out';

  React.useEffect(() => setName(profile.name), [profile.name]);
  React.useEffect(() => {
    setDateOfBirthText(dateOfBirthInputLabel(profile.dateOfBirth));
  }, [profile.dateOfBirth]);
  React.useEffect(() => setReferenceSex(profile.referenceSex), [profile.referenceSex]);
  React.useEffect(() => setMenopauseStage(profile.menopauseStage), [profile.menopauseStage]);
  React.useEffect(() => setSymptomPicture(profile.symptomPicture), [profile.symptomPicture]);
  React.useEffect(() => () => voicePreviewRef.current?.stop(), []);
  const closeSection = React.useCallback(() => {
    if (openSection === 'health' || openSection === 'gentle-start') {
      setOpenSection('safety');
      return;
    }
    setOpenSection(null);
  }, [openSection]);

  React.useEffect(() => {
    if (Platform.OS !== 'android' || openSection === null) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSection();
      return true;
    });
    return () => subscription.remove();
  }, [closeSection, openSection]);

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
  const removeSymptomPicture = () => {
    setSymptomPicture(null);
    onProfileChange({ ...profile, symptomPicture: null });
  };
  const updateLifeGoal = (category: LifeGoalCategory) => {
    const nowIso = new Date().toISOString();
    const lifeGoal = profile.lifeGoal
      ? { ...profile.lifeGoal, category, updatedAt: nowIso }
      : createLifeGoal({ category, nowIso });
    onProfileChange({ ...profile, lifeGoal });
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
            onRemoveSymptomPicture={removeSymptomPicture}
            lifeGoal={profile.lifeGoal}
            onLifeGoalChange={updateLifeGoal}
          />
        </>
      );
    }

    if (openSection === 'safety') {
      return (
        <>
          <HealthAnswersCard
            value={safetyPreferences}
            onReview={() => setOpenSection('health')}
            onReviewGentleStart={() => setOpenSection('gentle-start')}
          />

          <SafetyPreferencesCard
            value={safetyPreferences}
            onChange={onSafetyPreferencesChange}
          />

          <SafetyReadinessCard
            cameraPermission={cameraPermission}
            onOpenCameraSetup={onOpenCameraSetup}
            onRequestCameraPermission={onRequestCameraPermission}
          />
        </>
      );
    }

    if (openSection === 'health') {
      return (
        <HealthAnswersEditor
          value={safetyPreferences}
          onChange={onSafetyPreferencesChange}
          onDone={() => setOpenSection('safety')}
        />
      );
    }

    if (openSection === 'gentle-start') {
      return (
        <GentleStartReview
          onConfirm={() => {
            onSafetyPreferencesChange(confirmGentleStartSafetyStep(safetyPreferences));
            setOpenSection('safety');
          }}
        />
      );
    }

    if (openSection === 'workout') {
      return (
        <>
          <PreferenceCard
            title="Starting effort"
            subtitle="Used when your programme sets or refreshes starting levels."
            meta={effortLabel}
          >
            <SessionFeelPicker selected={startingEffort} onSelect={onStartingEffortChange} />
          </PreferenceCard>

          <VoiceSelectorCard
            selectedVoiceId={getVoice(settings.voiceId).id}
            onSelectVoice={(voiceId) => onSettingsChange({ ...settings, voiceId })}
            onPreviewVoice={previewVoice}
          />
        </>
      );
    }

    if (openSection === 'account') {
      return (
        <AccountAuthCard
          context="settings"
          onlineProfileSyncState={onlineProfileSyncState}
          onRetryOnlineProfileSync={onRetryOnlineProfileSync}
          onResolveOnlineProfileConflict={onResolveOnlineProfileConflict}
        />
      );
    }

    if (openSection === 'privacy') {
      return (
        <>
          <PrivacyPromiseCard syncState={onlineProfileSyncState} />

          <PrivacyStorageCard
            consentHealthData={safetyPreferences.consentHealthData}
            hasMenopauseContext={menopauseStage !== null}
            hasSymptomInformation={symptomPicture !== null}
            syncState={onlineProfileSyncState}
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

          <ClearDeviceDataCard
            onClearDeviceData={onClearDeviceData}
            onDataCleared={onDataCleared}
            syncState={onlineProfileSyncState}
            disabled={onlineProfileSyncState.status === 'syncing'}
          />

          <AppVersionFooter />
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
          <View style={styles.detailNavigation}>
            <PageHeader
              title={copy.title}
              onBack={closeSection}
              backAccessibilityLabel="Back to settings"
            />
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
      <PageHeader title="Settings" onBack={onBack} backAccessibilityLabel="Back" />

      <Pressable
        style={({ pressed }) => [
          styles.profileCard,
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
        <View style={styles.profileEditAction}>
          <Text style={styles.profileEditText}>Edit</Text>
          <ForwardChevron color={colors.accentDeep} />
        </View>
      </Pressable>

      <SettingsSection title="Preferences">
        <ProfileMenuRow
          title={SECTION_COPY.workout.title}
          subtitle={`Starting effort: ${effortLabel} · Voice: ${selectedVoiceLabel}`}
          icon="sliders"
          onPress={() => openProfileSection('workout')}
        />
        <ProfileMenuRow
          title={SECTION_COPY.safety.title}
          subtitle={`${safetyPreferences.consentHealthData ? 'Health answers on' : 'Health answers off'} · ${safetyPreferences.quietMode ? 'Quiet sessions on' : 'Standard sound'}`}
          icon="shield"
          onPress={() => openProfileSection('safety')}
        />
      </SettingsSection>

      <SettingsSection title="Account & data">
        {showOnlineProfile ? (
          <ProfileMenuRow
            title={SECTION_COPY.account.title}
            subtitle={onlineProfileSummary(onlineProfileSyncState)}
            icon="account"
            onPress={() => openProfileSection('account')}
          />
        ) : null}
        <ProfileMenuRow
          title={SECTION_COPY.privacy.title}
          subtitle="Local storage, comparisons, and delete data."
          icon="lock"
          onPress={() => openProfileSection('privacy')}
        />
      </SettingsSection>

      {__DEV__ && (onFillSampleData || onResetSampleData || onReplayOnboarding) ? (
        <SettingsSection title="Developer">
          {onReplayOnboarding ? (
            <ProfileMenuRow
              title="Replay onboarding"
              subtitle="Return to Welcome; any starting check-up is a dry run and saves nothing."
              icon="account"
              onPress={onReplayOnboarding}
            />
          ) : null}
          {onFillSampleData ? (
            <ProfileMenuRow
              title="Fill with sample data"
              subtitle="Seed months of sessions and check-ups to preview every screen."
              icon="sliders"
              onPress={onFillSampleData}
            />
          ) : null}
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

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.settingsSection}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionLabel}>{title}</Text>
      </View>
      <View style={styles.menuCard}>{children}</View>
    </View>
  );
}

function ProfileMenuRow({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon: MenuIconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuRow,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.menuGlyphColumn}>
        <MenuIcon name={icon} color={colors.accentDeep} />
      </View>
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.rowChevron}>
        <ForwardChevron />
      </View>
    </Pressable>
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
        <Text style={styles.detailCardTitle}>Trainer voice</Text>
        <Text style={styles.voiceSelectorBody}>
          {`Clara is ${BRAND.appName}'s trainer voice. Tap the speaker to hear a preview.`}
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

const HEALTH_JOINT_OPTIONS: readonly { value: JointFlag; label: string }[] = [
  { value: 'knee', label: 'Knees' },
  { value: 'hip', label: 'Hips' },
  { value: 'shoulder', label: 'Shoulders' },
  { value: 'wrist', label: 'Wrists' },
  { value: 'low_back', label: 'Lower back' },
];

function HealthAnswersCard({
  value,
  onReview,
  onReviewGentleStart,
}: {
  value: SettingsSafetyPreferences;
  onReview: () => void;
  onReviewGentleStart: () => void;
}) {
  const gentleStartPending = value.gentleStartActive && !value.gpConfirmed;
  return (
    <DetailCard
      title="Health and safety answers"
      body={
        value.consentHealthData
          ? `Used only on this device to choose conservative starting levels, support, and quieter variations.`
          : `Health answers are off. The private Movement Check-Up remains unavailable, and a new programme cannot begin without an accepted starting result.`
      }
    >
      <View style={styles.healthAnswerActions}>
        <View style={styles.healthAnswerStatusRow}>
          <Text style={styles.healthAnswerStatusLabel}>Health answers</Text>
          <Text style={styles.healthAnswerStatusValue}>
            {value.consentHealthData ? 'Used on this device' : 'Off'}
          </Text>
        </View>
        <Button
          title={value.consentHealthData ? 'Review or remove health answers' : 'Review health questions'}
          variant="secondary"
          onPress={onReview}
        />
        {gentleStartPending ? (
          <View style={styles.gentleStartNotice}>
            <Text style={styles.gentleStartNoticeTitle}>Gentle Start is active</Text>
            <Text style={styles.gentleStartNoticeBody}>
              Workouts remain available at the gentlest start. Complete the recommended safety step before enabling the Movement Check-Up.
            </Text>
            <Button title="Review Gentle Start" variant="secondary" onPress={onReviewGentleStart} />
          </View>
        ) : null}
      </View>
    </DetailCard>
  );
}

function HealthAnswersEditor({
  value,
  onChange,
  onDone,
}: {
  value: SettingsSafetyPreferences;
  onChange: (next: SettingsSafetyPreferences) => void;
  onDone: () => void;
}) {
  const [stage, setStage] = React.useState<'consent' | 'answers'>(
    value.consentHealthData ? 'answers' : 'consent'
  );
  const [heartAnswer, setHeartAnswer] = React.useState<'yes' | 'no' | 'prefer_not_to_say'>(
    value.heartSafetyAnswer ?? (value.gentleStartActive ? 'prefer_not_to_say' : 'no')
  );
  const [jointFlags, setJointFlags] = React.useState<readonly JointFlag[]>(value.jointFlags);
  const [pelvicSupport, setPelvicSupport] = React.useState(value.lowImpact);
  const [balanceSupport, setBalanceSupport] = React.useState(value.balanceSupportDefault);
  const [confirmingRemoval, setConfirmingRemoval] = React.useState(false);

  const toggleJoint = (joint: JointFlag) => {
    setJointFlags((current) =>
      current.includes(joint) ? current.filter((item) => item !== joint) : [...current, joint]
    );
  };

  const saveAnswers = () => {
    onChange(
      saveHealthAnswers(value, {
        heartAnswer,
        jointFlags,
        pelvicSupport,
        balanceSupport,
      })
    );
    onDone();
  };

  const removeAnswers = () => {
    onChange(removeHealthAnswers(value));
    onDone();
  };

  if (stage === 'consent') {
    return (
      <DetailCard
        title="Use health answers on this device?"
        body="These answers stay on this phone. They tailor starting levels and support; they are never uploaded, sold, or shared."
      >
        <View style={styles.healthAnswerActions}>
          <Button title="Yes, review the questions" onPress={() => setStage('answers')} />
          <Button title="Keep health answers off" variant="secondary" onPress={onDone} />
        </View>
      </DetailCard>
    );
  }

  return (
    <>
      <DetailCard
        title="Heart and dizziness"
        body="Have you been told that you have a heart condition — or do you get chest pain or serious dizziness when active?"
      >
        <SettingsChoiceGrid
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' },
          ]}
          selected={heartAnswer}
          onSelect={(next) => setHeartAnswer(next as typeof heartAnswer)}
        />
        {heartAnswer !== 'no' ? (
          <Text style={styles.personalFieldHint}>
            This keeps Gentle Start active until the recommended safety step is complete.
          </Text>
        ) : null}
      </DetailCard>

      <DetailCard
        title="Areas that need a gentler start"
        body="Select any areas that regularly hurt or feel unreliable. These choices start related movements more conservatively."
      >
        <View style={styles.personalAgeOptionGrid}>
          {HEALTH_JOINT_OPTIONS.map((option) => {
            const selected = jointFlags.includes(option.value);
            return (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.personalAgeOption,
                  styles.personalAgeOptionWide,
                  selected && styles.personalAgeOptionSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => toggleJoint(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
              >
                <Text style={[styles.personalAgeOptionText, selected && styles.personalAgeOptionTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </DetailCard>

      <DetailCard
        title="Support and comfort"
        body="These choices change future sessions immediately."
      >
        <ToggleRow
          label="Use pelvic-floor-friendly guidance"
          description="Leaves out the stomping finisher and enables the related low-impact guidance."
          value={pelvicSupport}
          onValueChange={setPelvicSupport}
        />
        {value.balanceSupportRequired ? (
          <LockedSafetyRow
            label="Use supported balance variations"
            description="Your latest check-up requires this protection."
            status="Required"
          />
        ) : (
          <ToggleRow
            label="Use supported balance variations"
            description="Keep sturdy support nearby and use supported versions by default."
            value={balanceSupport}
            onValueChange={setBalanceSupport}
          />
        )}
      </DetailCard>

      <View style={styles.healthEditorActions}>
        <Button title="Save health answers" onPress={saveAnswers} />
        {value.consentHealthData ? (
          confirmingRemoval ? (
            <DetailCard
              title="Remove health answers?"
              body="This clears the health-derived answers on this device and turns off the Movement Check-Up. A new programme cannot begin without these answers; an active programme keeps conservative choices."
            >
              <View style={styles.healthAnswerActions}>
                <Button title="Remove health answers" variant="danger" onPress={removeAnswers} />
                <Button title="Keep my answers" variant="secondary" onPress={() => setConfirmingRemoval(false)} />
              </View>
            </DetailCard>
          ) : (
            <Button
              title="Stop using and remove health answers"
              variant="danger"
              onPress={() => setConfirmingRemoval(true)}
            />
          )
        ) : null}
      </View>
    </>
  );
}

function SettingsChoiceGrid({
  options,
  selected,
  onSelect,
}: {
  options: readonly { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.personalAgeOptionGrid}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.personalAgeOption,
              styles.personalAgeOptionWide,
              isSelected && styles.personalAgeOptionSelected,
              pressed && styles.pressed,
            ]}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
          >
            <Text style={[styles.personalAgeOptionText, isSelected && styles.personalAgeOptionTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function GentleStartReview({ onConfirm }: { onConfirm: () => void }) {
  const [confirming, setConfirming] = React.useState(false);
  return (
    <DetailCard
      title={confirming ? 'Confirm the safety step' : 'Gentle Start is active'}
      body={
        confirming
          ? 'Only confirm if a qualified health professional has said that a Movement Check-Up is appropriate for you. The app cannot make that decision.'
          : 'Your workouts remain available at their gentlest starting levels. The Movement Check-Up stays unavailable until the safety step recommended during onboarding is complete.'
      }
    >
      <View style={styles.healthAnswerActions}>
        {confirming ? (
          <>
            <Button title="Confirm and enable check-ups" onPress={onConfirm} />
            <Button title="Not yet" variant="secondary" onPress={() => setConfirming(false)} />
          </>
        ) : (
          <Button title="I’ve completed the safety step" onPress={() => setConfirming(true)} />
        )}
      </View>
    </DetailCard>
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
        {value.balanceSupportRequired ? (
          <LockedSafetyRow
            label="Keep support nearby for balance"
            description="Your latest check-up requires supported balance variations. A future check-up can review this protection."
            status="Required"
          />
        ) : (
          <ToggleRow
            label="Keep support nearby for balance"
            description={
              value.balanceSupportPreference === null
                ? `${BRAND.appName} is using a temporary supported start until a check-up or your choice resolves it.`
                : 'Use supported balance variations by default. You can change this choice at any time.'
            }
            value={value.balanceSupportDefault}
            onValueChange={(balanceSupportDefault) =>
              onChange({
                ...value,
                balanceSupportDefault,
                balanceSupportPreference: balanceSupportDefault,
              })
            }
          />
        )}
        <ToggleRow
          label="Avoid stomping sounds"
          description="Leaves out the stomping finisher and keeps sessions quieter."
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

function LockedSafetyRow({
  label,
  description,
  status,
}: {
  label: string;
  description: string;
  status: string;
}) {
  return (
    <View style={styles.conservativeSafetyRow}>
      <View style={styles.conservativeSafetyCopy}>
        <Text style={styles.conservativeSafetyLabel}>{label}</Text>
        <Text style={styles.conservativeSafetyDescription}>{description}</Text>
      </View>
      <Text style={styles.conservativeSafetyStatus}>{status}</Text>
    </View>
  );
}

function SafetyReadinessCard({
  cameraPermission,
  onOpenCameraSetup,
  onRequestCameraPermission,
}: {
  cameraPermission: SettingsScreenProps['cameraPermission'];
  onOpenCameraSetup: () => void;
  onRequestCameraPermission: () => void;
}) {
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
        {cameraPermission === 'denied' || cameraPermission === 'undetermined' ? (
          <SafetyActionRow
            icon="lock"
            title={cameraPermission === 'denied' ? 'Review camera access' : 'Allow camera access'}
            body="Camera access is needed only for a private Movement Check-Up. Video is never shown or saved."
            onPress={onRequestCameraPermission}
          />
        ) : null}
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
  onRemoveSymptomPicture,
  lifeGoal,
  onLifeGoalChange,
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
  onRemoveSymptomPicture: () => void;
  lifeGoal: LifeGoal | null;
  onLifeGoalChange: (category: LifeGoalCategory) => void;
}) {
  const responsive = useResponsiveLayout();
  const dateOfBirth = normalizeDateOfBirth(dateOfBirthText);
  const exactAge = ageFromDateOfBirth(dateOfBirth);
  const [goalPickerOpen, setGoalPickerOpen] = React.useState(false);
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
            <Text style={styles.personalFieldLabel}>What I want to stay strong for</Text>
            <Text style={styles.personalAgeRangeValue}>{lifeGoal ? 'Selected' : 'Not set'}</Text>
          </View>
          <Text style={styles.currentGoalText}>
            {lifeGoal ? getLifeGoalDisplayText(lifeGoal) : 'Choose a goal when you are ready.'}
          </Text>
          <Text style={styles.personalFieldHint}>
            This can shape future plan emphasis and messaging. It never changes a measured result or rewrites an earlier check-up.
          </Text>
          <Button
            title={goalPickerOpen ? 'Hide goal choices' : lifeGoal ? 'Change goal' : 'Choose a goal'}
            variant="secondary"
            onPress={() => setGoalPickerOpen((open) => !open)}
          />
          {goalPickerOpen ? (
            <View style={styles.lifeGoalList}>
              {LIFE_GOAL_PRESETS.map((option, index) => {
                const selected = lifeGoal?.category === option.category;
                return (
                  <Pressable
                    key={option.category}
                    style={({ pressed }) => [
                      styles.sessionFeelOption,
                      index > 0 && styles.sessionFeelDivider,
                      selected && styles.sessionFeelOptionSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => {
                      onLifeGoalChange(option.category);
                      setGoalPickerOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                  >
                    <View style={styles.sessionFeelCopy}>
                      <Text style={[styles.sessionFeelTitle, selected && styles.sessionFeelTitleSelected]}>
                        {option.label}
                      </Text>
                      <Text style={styles.sessionFeelBody}>{option.hint}</Text>
                    </View>
                    <SelectionIndicator selected={selected} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}
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
          <Text style={styles.personalFieldHint}>
            These details select published reference tables; they do not change what the camera measures. Changes apply to future check-ups, while saved results keep the reference recorded at the time.
          </Text>
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
              {symptomPicture !== null ? (
                <View style={styles.savedSymptomPanel}>
                  <Text style={styles.personalFieldLabel}>Saved symptom information</Text>
                  <Text style={styles.personalFieldHint}>
                    This optional information is not currently used by your results or workouts. You can remove it now.
                  </Text>
                  <Button title="Remove symptom information" variant="secondary" onPress={onRemoveSymptomPicture} />
                </View>
              ) : null}
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

function PrivacyPromiseCard({ syncState }: { syncState: OnlineProfileSyncState }) {
  const body = syncState.status === 'signed_out'
    ? 'Your profile, health choices, programme, workouts, check-ups, Everyday Clarity, and camera data stay on this device.'
    : syncState.status === 'synced'
      ? 'Your private non-health profile is saved to Supabase. Health choices, programme, workouts, check-ups, Everyday Clarity, and camera data stay on this device.'
      : 'Your Supabase account stores your sign-in identity and may hold your last successfully synced non-health profile. Current profile changes remain safe on this device until sync completes. Health and programme data are never uploaded.';
  return (
    <DetailCard
      title="Private by default"
      body={`${BRAND.appName} uses the camera to measure movement. You never see a live video, and ${BRAND.appName} does not save it.`}
    >
      <Text style={styles.privacyPromiseText}>
        {body}
      </Text>
    </DetailCard>
  );
}

function PrivacyStorageCard({
  consentHealthData,
  hasMenopauseContext,
  hasSymptomInformation,
  syncState,
}: {
  consentHealthData: boolean;
  hasMenopauseContext: boolean;
  hasSymptomInformation: boolean;
  syncState: OnlineProfileSyncState;
}) {
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
          value="On device"
          first
        />
        {syncState.status !== 'signed_out' ? (
          <PrivacyLedgerRow
            icon="account"
            label="Account identity"
            body="Your email and sign-in provider are stored by Supabase Auth."
            value="Supabase"
          />
        ) : null}
        <PrivacyLedgerRow
          icon="account"
          label="Profile information"
          body="Name, date of birth, reference group, selected movement-goal category, trainer voice, and comparison preference."
          value={onlineProfileStorageLabel(syncState)}
        />
        {hasMenopauseContext ? (
          <PrivacyLedgerRow
            icon="shield"
            label="Menopause context"
            body="Used only for local wording and context. It is never uploaded."
            value="On device"
          />
        ) : null}
        <PrivacyLedgerRow
          icon="shield"
          label="Health answers"
          body="Used only to choose conservative starting levels, support, and low-impact guidance."
          value={consentHealthData ? 'On device' : 'Off'}
        />
        {hasSymptomInformation ? (
          <PrivacyLedgerRow
            icon="account"
            label="Optional symptom information"
            body="Saved profile context that is not currently used by results or workouts. It can be removed in Your profile."
            value="On device"
          />
        ) : null}
        <PrivacyLedgerRow
          icon="shield"
          label="Safety preferences"
          body="Support, comfort, quiet-session, and stable-step choices."
          value="On device"
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

function AppVersionFooter() {
  const version = Constants.expoConfig?.version ?? '0.1.0';
  return (
    <Text style={styles.appVersion} accessibilityLabel={`${BRAND.appName} version ${version}`}>
      {BRAND.appName} {version}
    </Text>
  );
}

function ClearDeviceDataCard({
  onClearDeviceData,
  onDataCleared,
  syncState,
  disabled,
}: {
  onClearDeviceData: () => Promise<void>;
  onDataCleared: () => void;
  syncState: OnlineProfileSyncState;
  disabled: boolean;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [cleared, setCleared] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const hasOnlineAccount = syncState.status !== 'signed_out';
  const profileConfirmedOnline = syncState.status === 'synced';

  const clearDeviceData = async () => {
    if (clearing || disabled) return;
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
        body={
          hasOnlineAccount
            ? `${BRAND.appName} removed the device copy of your profile, check-ups, workout progress, and settings. Your online profile remains, and you were signed out.`
            : `${BRAND.appName} removed your profile, check-ups, workout progress, and settings from this device.`
        }
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
          ? hasOnlineAccount
            ? 'This permanently removes the device copy of your profile, check-ups, workout progress, and settings, then signs you out. Your online profile remains available. Device deletion cannot be undone.'
            : 'This permanently removes your profile, check-ups, workout progress, and settings from this device. It cannot be undone.'
          : disabled
            ? 'Wait for your online profile to finish saving before clearing this device.'
            : profileConfirmedOnline
            ? `Your programme, check-ups, workout progress, and health choices are stored on this device. Your non-health profile is also saved online.`
            : hasOnlineAccount
              ? `Your programme, check-ups, workout progress, and health choices are stored on this device. Your Supabase account may hold your last successfully saved non-health profile.`
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
            disabled={clearing || disabled}
            accessibilityLabel={`Permanently clear all ${BRAND.appName} data from this device`}
            onPress={() => void clearDeviceData()}
          />
          <Button
            title="Keep my data"
            variant="secondary"
            disabled={clearing || disabled}
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
          disabled={disabled}
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
  if (profile.lifeGoal) parts.push(getLifeGoalDisplayText(profile.lifeGoal));
  return parts.length > 0 ? parts.join(' · ') : 'Review your profile details';
}

function onlineProfileSummary(state: OnlineProfileSyncState): string {
  switch (state.status) {
    case 'signed_out':
      return 'Optional sign-in · Profile stays on this device';
    case 'disabled':
      return 'Signed in · Online profile saving is paused';
    case 'syncing':
      return 'Signed in · Saving profile';
    case 'synced':
      return 'Signed in · Profile saved online';
    case 'conflict':
      return 'Signed in · Choose which profile to keep';
    case 'failed':
      return 'Signed in · Online save needs attention';
  }
}

function onlineProfileStorageLabel(state: OnlineProfileSyncState): string {
  switch (state.status) {
    case 'signed_out':
      return 'On device';
    case 'disabled':
      return 'Sync paused';
    case 'synced':
      return 'Device + Supabase';
    case 'syncing':
      return 'Saving';
    case 'conflict':
      return 'Choose copy';
    case 'failed':
      return 'Needs retry';
  }
}

function ProfileDetailsGlyph() {
  return (
    <Svg width={30} height={30} viewBox="0 0 64 64" fill="none">
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

function ForwardChevron({ color = colors.textSecondary }: { color?: string }) {
  return (
    <Svg width={8} height={14} viewBox="0 0 8 14" accessibilityElementsHidden>
      <Path
        d="M1.25 1.5L6 7L1.25 12.5"
        fill="none"
        stroke={color}
        strokeWidth={1.7}
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

function MenuIcon({ name, color = colors.textSecondary }: { name: MenuIconName; color?: string }) {
  const stroke = color;
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
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  detailNavigation: {
    gap: spacing.md,
  },
  detailSubtitle: {
    ...type.pageSubtitle,
    marginTop: 1,
  },
  profileCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  profileName: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.primaryText,
  },
  profileSummary: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  profileEditAction: {
    minWidth: 54,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  profileEditText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.accentDeep,
  },
  menuCard: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  settingsSection: {
    gap: 0,
  },
  sectionHeading: {
    minHeight: 42,
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    ...type.cardCaption,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 1.5,
    color: colors.primaryText,
    textTransform: 'uppercase',
  },
  menuRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  menuIcon: {
    width: 24,
    alignItems: 'center',
  },
  menuGlyphColumn: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  menuCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  menuTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.primaryText,
  },
  menuSubtitle: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  rowChevron: {
    width: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  detailCard: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
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
  voiceSelectorCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
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
    borderRadius: radius.panel,
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
    borderRadius: radius.panel,
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
  currentGoalText: {
    ...type.bodySmall,
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
  },
  lifeGoalList: {
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.bgSurface,
    marginTop: spacing.xs,
  },
  savedSymptomPanel: {
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  personalFieldInput: {
    fontFamily: fonts.sansRegular,
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
  personalAgeOptionSelected: {
    borderColor: colors.accentDeep,
    backgroundColor: colors.accentDeep,
  },
  personalAgeOptionText: {
    fontFamily: fonts.serifRegular,
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
    borderRadius: radius.panel,
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
  privacyPromiseText: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  appVersion: {
    ...type.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  healthAnswerActions: {
    gap: spacing.sm,
  },
  healthAnswerStatusRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  healthAnswerStatusLabel: {
    ...type.bodySmall,
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
  },
  healthAnswerStatusValue: {
    ...type.caption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    textAlign: 'right',
  },
  gentleStartNotice: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  gentleStartNoticeTitle: {
    ...type.bodySmall,
    color: colors.primaryText,
    fontFamily: fonts.sansMedium,
  },
  gentleStartNoticeBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  healthEditorActions: {
    gap: spacing.md,
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
