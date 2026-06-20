import * as React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { MovementSafetyProfile } from '../adherence';
import { Screen } from '../components/ui';
import {
  getEquipmentSetupSummary,
  getExploreLibrary,
  getExtraSessionCards,
  getHealthInsightCards,
  getMovementLadderCards,
  type ExploreLibrarySection,
  type ExtraSessionCard,
  type HealthInsightCard,
  type LearnCard,
  type MovementLadderCard,
} from '../haleFlow';
import type { AppSettings } from '../profile';
import type { EquipmentProfile, LadderProgress } from '../training';
import { colors, fonts, radius, shadow, spacing, todayHomeColors, type } from '../theme';
import { SettingsIcon } from '../navigation/icons';

type PictogramName = 'walk' | 'sprout' | 'chair' | 'squat' | 'book' | 'scale' | 'camera' | 'clock';
type ExploreTab = 'insights' | 'learn' | 'practice' | 'library';

const EXPLORE_TABS: readonly { key: ExploreTab; label: string }[] = [
  { key: 'insights', label: 'Insights' },
  { key: 'learn', label: 'Learn' },
  { key: 'practice', label: 'Practice' },
  { key: 'library', label: 'Library' },
];

const EXPLORE_TAB_DESCRIPTIONS: Record<ExploreTab, string> = {
  insights: 'General health and longevity reading from qualified professional perspectives.',
  learn: 'Hale guides for check-ups, camera setup, and using your plan with confidence.',
  practice: 'Optional short sessions for days when the main plan is done or you want lighter movement.',
  library: "Browse Hale's movement progressions without changing today's plan.",
};

const FEATURED_SESSION_IDS = ['preset-mobility-reset', 'preset-gentle-restart'] as const;

const LADDER_ICONS: Record<string, PictogramName> = {
  'sit-to-stand': 'chair',
  squat: 'squat',
  balance: 'scale',
  push: 'sprout',
  'pull-upper-back': 'book',
  'mobility-flexibility': 'walk',
};

const INSIGHT_IMAGES: Record<string, ImageSourcePropType> = {
  'insight-strength-balance-aging': require('../../assets/images/explore-insight-strength-balance.png'),
  'insight-sleep-recovery-rhythm': require('../../assets/images/explore-insight-sleep.png'),
  'insight-protein-meal-rhythm': require('../../assets/images/explore-insight-protein.png'),
  'insight-walking-breaks': require('../../assets/images/explore-insight-walking.png'),
};

const LEARN_IMAGES: Record<string, ImageSourcePropType> = {
  'movement-checkup-guide': require('../../assets/images/explore-learn-checkup-guide.png'),
  'camera-setup': require('../../assets/images/explore-learn-camera-setup.png'),
  'monthly-retest': require('../../assets/images/explore-learn-monthly-retest.png'),
  'chair-rise-strength': require('../../assets/images/explore-learn-chair-rise.png'),
  'balance-practice': require('../../assets/images/explore-learn-balance-practice.png'),
  'mobility-basics': require('../../assets/images/explore-learn-mobility-basics.png'),
  'movement-discomfort': require('../../assets/images/explore-learn-movement-discomfort.png'),
  'resistance-band': require('../../assets/images/explore-learn-resistance-band.png'),
};

const FEATURED_SESSION_COPY: Record<string, { title?: string; body: string; icon: PictogramName }> = {
  'preset-mobility-reset': {
    title: '10-minute Mobility Reset',
    body: 'Loosen tight areas and keep the day moving.',
    icon: 'walk',
  },
  'preset-gentle-restart': {
    body: 'A calm way back in when you want an easier session.',
    icon: 'sprout',
  },
};

export function ExploreScreen({
  equipment,
  safetyProfile,
  settings,
  ladderProgressById,
  onStartExtraSession,
  onOpenLadder,
  onOpenLearn,
  onOpenSettings,
}: {
  equipment: EquipmentProfile;
  safetyProfile?: MovementSafetyProfile | null;
  settings: AppSettings;
  ladderProgressById: Record<string, LadderProgress>;
  onStartExtraSession: (presetId: string) => void;
  onOpenLadder: (ladderId: string) => void;
  onOpenLearn: (articleId: string) => void;
  onOpenSettings: () => void;
}) {
  const [activeTab, setActiveTab] = React.useState<ExploreTab>('insights');
  const library = React.useMemo(() => getExploreLibrary(), []);
  const insights = React.useMemo(() => getHealthInsightCards(), []);
  const extraSessions = React.useMemo(
    () => getExtraSessionCards({ equipment, safetyProfile, ladderProgressById }),
    [equipment, ladderProgressById, safetyProfile]
  );
  const ladders = React.useMemo(
    () => getMovementLadderCards({ ladderProgressById }),
    [ladderProgressById]
  );
  const setupSummary = React.useMemo(
    () => getEquipmentSetupSummary({ equipment, safetyProfile, settings }),
    [equipment, safetyProfile, settings]
  );
  const featuredSessions = React.useMemo(
    () =>
      FEATURED_SESSION_IDS.map((id) => extraSessions.find((session) => session.id === id)).filter(
        (session): session is ExtraSessionCard => Boolean(session)
      ),
    [extraSessions]
  );

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Explore</Text>
        <Pressable
          style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <SettingsIcon size={25} color={colors.accentDeep} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View style={styles.tabIntro}>
        <ExploreTabBar activeTab={activeTab} onChange={setActiveTab} />
        <Text style={styles.tabDescription}>{EXPLORE_TAB_DESCRIPTIONS[activeTab]}</Text>
      </View>

      {activeTab === 'insights' ? (
        <InsightsTab articles={insights} onOpen={onOpenLearn} />
      ) : activeTab === 'learn' ? (
        <LearnTab
          library={library}
          setupSummary={setupSummary}
          onOpenLearn={onOpenLearn}
          onOpenSettings={onOpenSettings}
        />
      ) : activeTab === 'practice' ? (
        <PracticeTab featuredSessions={featuredSessions} onStartExtraSession={onStartExtraSession} />
      ) : (
        <LibraryTab ladders={ladders} onOpenLadder={onOpenLadder} />
      )}
    </Screen>
  );
}

function ExploreTabBar({
  activeTab,
  onChange,
}: {
  activeTab: ExploreTab;
  onChange: (tab: ExploreTab) => void;
}) {
  return (
    <View style={styles.tabBar} accessibilityRole="tablist">
      {EXPLORE_TABS.map((tab) => {
        const selected = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [styles.tabButton, selected && styles.tabButtonSelected, pressed && styles.pressed]}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${tab.label} tab`}
          >
            <Text style={[styles.tabButtonText, selected && styles.tabButtonTextSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function InsightsTab({
  articles,
  onOpen,
}: {
  articles: readonly HealthInsightCard[];
  onOpen: (articleId: string) => void;
}) {
  const [featured, ...feed] = articles;
  return (
    <View style={styles.tabContent}>
      {featured ? <FeaturedInsightCard article={featured} onOpen={() => onOpen(featured.id)} /> : null}
      <View style={styles.section}>
        <SectionCopy title="Articles for you" />
        <View style={[styles.listPanel, styles.articleListPanel]}>
          {feed.map((article, index) => (
            <InsightRow
              key={article.id}
              article={article}
              showDivider={index < feed.length - 1}
              onOpen={() => onOpen(article.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function LearnTab({
  library,
  setupSummary,
  onOpenLearn,
  onOpenSettings,
}: {
  library: ReturnType<typeof getExploreLibrary>;
  setupSummary: ReturnType<typeof getEquipmentSetupSummary>;
  onOpenLearn: (articleId: string) => void;
  onOpenSettings: () => void;
}) {
  return (
    <View style={styles.tabContent}>
      <FeaturedGuideCard article={library.featured} onOpen={() => onOpenLearn(library.featured.id)} />
      <SetupSummaryCard
        availableLabel={setupSummary.availableLabel}
        missingOptionalLabel={setupSummary.missingOptionalLabel}
        phoneStandLabel={setupSummary.phoneStandLabel}
        onOpenSettings={onOpenSettings}
      />
      {library.sections.map((section) => (
        <GuideSection
          key={section.id}
          section={section}
          onOpen={onOpenLearn}
        />
      ))}
    </View>
  );
}

function PracticeTab({
  featuredSessions,
  onStartExtraSession,
}: {
  featuredSessions: readonly ExtraSessionCard[];
  onStartExtraSession: (presetId: string) => void;
}) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.practiceIntroCard}>
        <IconWell name="sprout" />
        <View style={styles.practiceIntroCopy}>
          <Text style={styles.practiceIntroTitle}>Extra sessions are optional</Text>
          <Text style={styles.practiceIntroBody}>Today remains your main plan. Use these when you want a gentle add-on.</Text>
        </View>
      </View>

      {featuredSessions.length > 0 ? (
        <View style={styles.section}>
          <SectionCopy
            title="Recommended extras"
            body="Short sessions for days when the main plan is done or you want lighter movement."
          />
          <View style={styles.listPanel}>
            {featuredSessions.map((session, index) => (
              <OptionalSessionRow
                key={session.id}
                session={session}
                iconName={FEATURED_SESSION_COPY[session.id]?.icon ?? 'walk'}
                title={FEATURED_SESSION_COPY[session.id]?.title ?? session.title}
                body={FEATURED_SESSION_COPY[session.id]?.body ?? session.body}
                showDivider={index < featuredSessions.length - 1}
                onStart={() => onStartExtraSession(session.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function LibraryTab({
  ladders,
  onOpenLadder,
}: {
  ladders: readonly MovementLadderCard[];
  onOpenLadder: (ladderId: string) => void;
}) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <SectionCopy
          title="Exercise ladders"
          body="Browse the V1 movement progressions without changing today's plan."
        />
        <View style={styles.listPanel}>
          {ladders.map((ladder, index) => (
            <LadderRow
              key={ladder.id}
              ladder={ladder}
              iconName={LADDER_ICONS[ladder.id] ?? 'walk'}
              showDivider={index < ladders.length - 1}
              onOpen={() => onOpenLadder(ladder.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function FeaturedInsightCard({ article, onOpen }: { article: HealthInsightCard; onOpen: () => void }) {
  return (
    <View style={styles.featuredPostSection}>
      <Text style={styles.featuredPostLabel}>Featured Post</Text>
      <Pressable
        style={({ pressed }) => [styles.featuredPostCard, pressed && styles.pressed]}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Read ${article.title}`}
      >
        <ImageBackground
          source={INSIGHT_IMAGES[article.id]}
          style={styles.featuredPostImage}
          imageStyle={styles.featuredPostImageRadius}
          resizeMode="cover"
        >
          <View style={styles.featuredPostScrim} />
          <View style={styles.featuredPostContent}>
            <Text style={styles.featuredPostMeta}>{article.categoryLabel} · {article.readTimeLabel}</Text>
            <Text style={styles.featuredPostTitle}>{article.title}</Text>
            <Text style={styles.featuredPostBody}>{article.body}</Text>
            <View style={styles.featuredPostButton}>
              <Text style={styles.featuredPostButtonText}>Read Post</Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </View>
  );
}

function InsightRow({
  article,
  showDivider,
  onOpen,
}: {
  article: HealthInsightCard;
  showDivider: boolean;
  onOpen: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.listRow, styles.articleRow, showDivider && styles.listRowDivider, pressed && styles.pressed]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={article.title}
    >
      <Image source={INSIGHT_IMAGES[article.id]} style={styles.articleThumb} resizeMode="cover" />
      <View style={styles.listCopy}>
        <Text style={styles.rowTitle}>{article.title}</Text>
        <Text style={styles.rowSubtitle}>{article.categoryLabel} · {article.readTimeLabel}</Text>
      </View>
      <ChevronIcon />
    </Pressable>
  );
}

function FeaturedGuideCard({ article, onOpen }: { article: LearnCard; onOpen: () => void }) {
  return (
    <View style={styles.featuredGuideSection}>
      <Text style={styles.featuredPostLabel}>Start here</Text>
      <Pressable
        style={({ pressed }) => [styles.featuredGuideCard, pressed && styles.pressed]}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Read ${article.title}`}
      >
        <ImageBackground
          source={LEARN_IMAGES[article.id]}
          style={styles.featuredGuideImage}
          imageStyle={styles.featuredGuideImageRadius}
          resizeMode="cover"
        >
          <View style={styles.featuredGuideScrim} />
          <View style={styles.featuredGuideContent}>
            <Text style={styles.featuredPostMeta}>Hale guide · {article.readTimeLabel}</Text>
            <Text style={styles.featuredPostTitle}>{article.title}</Text>
            <Text style={styles.featuredPostBody}>{article.body}</Text>
            <View style={styles.featuredPostButton}>
              <Text style={styles.featuredPostButtonText}>Read guide</Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </View>
  );
}

function GuideSection({
  section,
  onOpen,
  footer,
}: {
  section: ExploreLibrarySection;
  onOpen: (articleId: string) => void;
  footer?: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <SectionCopy title={section.title} body={section.body} />
      <View style={[styles.listPanel, styles.guideListPanel]}>
        {section.articles.map((article, index) => (
          <GuideRow
            key={article.id}
            article={article}
            showDivider={index < section.articles.length - 1}
            onOpen={() => onOpen(article.id)}
          />
        ))}
      </View>
      {footer}
    </View>
  );
}

function SectionCopy({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.sectionCopy}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {body ? <Text style={styles.sectionBody}>{body}</Text> : null}
    </View>
  );
}

function GuideRow({
  article,
  showDivider,
  onOpen,
}: {
  article: LearnCard;
  showDivider: boolean;
  onOpen: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.guideRow, showDivider && styles.listRowDivider, pressed && styles.pressed]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={article.title}
    >
      <Image source={LEARN_IMAGES[article.id]} style={styles.guideThumb} resizeMode="cover" />
      <View style={styles.listCopy}>
        <Text style={styles.rowTitle}>{article.title}</Text>
        <View style={styles.guideMetaRow}>
          <Text style={styles.guideMetaText}>{article.readTimeLabel}</Text>
        </View>
      </View>
      <ChevronIcon />
    </Pressable>
  );
}

function SetupSummaryCard({
  availableLabel,
  missingOptionalLabel,
  phoneStandLabel,
  onOpenSettings,
}: {
  availableLabel: string;
  missingOptionalLabel: string;
  phoneStandLabel: string;
  onOpenSettings: () => void;
}) {
  const essentialsSetup = setupEssentialsSummary(availableLabel);
  const optionalSetup = setupOptionalSummary(missingOptionalLabel);
  const phoneStandSetup = setupPhoneStandSummary(phoneStandLabel);

  return (
    <View style={styles.setupCard}>
      <View style={styles.setupTopRow}>
        <View style={styles.setupCopy}>
          <Text style={styles.setupTitle}>Ready at home</Text>
          <Text style={styles.setupBody}>Your home setup helps Hale keep sessions simple and adaptable.</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Edit setup in Settings"
        >
          <Text style={styles.settingsButtonText}>Edit</Text>
        </Pressable>
      </View>
      <View style={styles.setupList}>
        <SetupFact
          label="Essentials"
          value={essentialsSetup.value}
          status={essentialsSetup.status}
          tone={essentialsSetup.tone}
          showDivider
        />
        <SetupFact
          label="Optional gear"
          value={optionalSetup.value}
          status={optionalSetup.status}
          tone={optionalSetup.tone}
          showDivider
        />
        <SetupFact label="Phone stand" value={phoneStandSetup.value} status={phoneStandSetup.status} tone={phoneStandSetup.tone} />
      </View>
    </View>
  );
}

function SetupFact({
  label,
  value,
  status,
  tone,
  showDivider,
}: {
  label: string;
  value: string;
  status: string;
  tone: 'ready' | 'neutral';
  showDivider?: boolean;
}) {
  return (
    <View style={[styles.setupFact, showDivider && styles.setupFactDivider]}>
      <View style={styles.setupFactCopy}>
        <Text style={styles.setupFactLabel}>{label}</Text>
        <Text style={styles.setupFactValue}>{value}</Text>
      </View>
      <View style={[styles.setupStatusPill, tone === 'ready' ? styles.setupStatusPillReady : styles.setupStatusPillNeutral]}>
        <Text style={styles.setupStatusText}>{status}</Text>
      </View>
    </View>
  );
}

function setupEssentialsSummary(availableLabel: string): { value: string; status: string; tone: 'ready' | 'neutral' } {
  const lower = availableLabel.toLowerCase();
  const hasChair = lower.includes('chair');
  const hasSupport = lower.includes('wall') || lower.includes('counter');
  if (hasChair && hasSupport) return { value: 'Chair + support marked', status: 'Ready', tone: 'ready' };
  if (hasChair) return { value: 'Chair marked', status: 'Partial', tone: 'neutral' };
  if (hasSupport) return { value: 'Support marked', status: 'Partial', tone: 'neutral' };
  return { value: 'No essentials marked', status: 'Review', tone: 'neutral' };
}

function setupOptionalSummary(missingOptionalLabel: string): { value: string; status: string; tone: 'ready' | 'neutral' } {
  if (missingOptionalLabel.toLowerCase().includes('all optional items')) {
    return { value: 'Extra items are marked available', status: 'Ready', tone: 'ready' };
  }
  return { value: 'Extra items can be added later', status: 'Optional', tone: 'neutral' };
}

function setupPhoneStandSummary(phoneStandLabel: string): { value: string; status: string; tone: 'ready' | 'neutral' } {
  if (phoneStandLabel.toLowerCase().includes('not marked')) {
    return { value: 'Not marked in Profile', status: 'Not set', tone: 'neutral' };
  }
  return { value: 'Marked available', status: 'Ready', tone: 'ready' };
}

function LadderRow({
  ladder,
  iconName,
  showDivider,
  onOpen,
}: {
  ladder: MovementLadderCard;
  iconName: PictogramName;
  showDivider: boolean;
  onOpen: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.listRow, showDivider && styles.listRowDivider, pressed && styles.pressed]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${ladder.title} ladder`}
    >
      <IconWell name={iconName} compact />
      <View style={styles.listCopy}>
        <Text style={styles.rowTitle}>{ladder.title}</Text>
        <Text style={styles.rowSubtitle}>Current: {ladder.currentLevelName}</Text>
        <Text style={styles.rowMeta}>
          {ladder.domainLabel} - {ladder.measurementLabel}
        </Text>
      </View>
      <ChevronIcon />
    </Pressable>
  );
}

function OptionalSessionRow({
  session,
  iconName,
  title,
  body,
  showDivider,
  onStart,
}: {
  session: ExtraSessionCard;
  iconName: PictogramName;
  title: string;
  body: string;
  showDivider: boolean;
  onStart: () => void;
}) {
  return (
    <View style={[styles.sessionRow, showDivider && styles.listRowDivider, session.disabled && styles.disabledRow]}>
      <IconWell name={iconName} compact />
      <View style={styles.listCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{body}</Text>
        <Text style={styles.rowMeta}>
          {durationLabel(session.durationLabel)} - {session.focusLabel} - {session.equipmentLabel}
        </Text>
      </View>
      {session.disabled ? (
        <Text style={styles.disabledText}>{session.disabledReason}</Text>
      ) : (
        <SmallStartButton onPress={onStart} accessibilityLabel={`Start ${title}`} />
      )}
    </View>
  );
}

function SmallStartButton({
  accessibilityLabel,
  onPress,
}: {
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.startButtonText}>Start</Text>
    </Pressable>
  );
}

function IconWell({ name, compact = false }: { name: PictogramName; compact?: boolean }) {
  return (
    <View style={[styles.iconWell, compact && styles.iconWellCompact]}>
      <Pictogram name={name} size={compact ? 28 : 34} />
    </View>
  );
}

function TimePill({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <View style={[styles.timePill, compact && styles.timePillCompact]}>
      <Pictogram name="clock" size={compact ? 14 : 16} />
      <Text style={styles.timePillText}>{label}</Text>
    </View>
  );
}

function Pictogram({ name, size }: { name: PictogramName; size: number }) {
  const common = {
    stroke: todayHomeColors.headingGreen,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  if (name === 'sprout') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 19 V11" {...common} />
        <Path d="M12 11 C8.6 8, 6 8.2, 4.6 10.1 C7.1 10.5, 9.3 12.1, 12 15" {...common} />
        <Path d="M12 11 C15.6 6.8, 18.2 6.4, 20 8 C17.5 8.8, 15.2 10.9, 12 15" {...common} />
      </Svg>
    );
  }

  if (name === 'chair') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M8 4 V20" {...common} />
        <Path d="M16 4 V20" {...common} />
        <Path d="M7 11 H17" {...common} />
        <Path d="M6 14 H18" {...common} />
        <Path d="M8 20 H6.5" {...common} />
        <Path d="M16 20 H17.5" {...common} />
      </Svg>
    );
  }

  if (name === 'squat') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12.2} cy={5.2} r={2.1} {...common} />
        <Path d="M11.5 8 L9.2 11.8 L12.4 14.1 L16.4 14.1" {...common} />
        <Path d="M9.2 11.8 L6.7 15.1 L10.1 17.1" {...common} />
        <Path d="M12.4 14.1 L10.7 19.2" {...common} />
        <Path d="M15.8 18 H20" {...common} />
      </Svg>
    );
  }

  if (name === 'book') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 7 C10.1 5.8, 6.9 5.8, 5 6.6 V18.2 C6.9 17.4, 10.1 17.4, 12 18.7" {...common} />
        <Path d="M12 7 C13.9 5.8, 17.1 5.8, 19 6.6 V18.2 C17.1 17.4, 13.9 17.4, 12 18.7" {...common} />
        <Path d="M12 7 V18.7" {...common} />
      </Svg>
    );
  }

  if (name === 'scale') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 5 V19" {...common} />
        <Path d="M6 8 H18" {...common} />
        <Path d="M8 8 L5 14 H11 Z" {...common} />
        <Path d="M16 8 L13 14 H19 Z" {...common} />
        <Path d="M9 19 H15" {...common} />
      </Svg>
    );
  }

  if (name === 'camera') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x={4} y={7.5} width={16} height={11} rx={2.2} {...common} />
        <Path d="M8.2 7.5 L9.4 5.6 H14.6 L15.8 7.5" {...common} />
        <Circle cx={12} cy={13} r={3} {...common} />
        <Path d="M17.4 10.2 H17.5" {...common} />
      </Svg>
    );
  }

  if (name === 'clock') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={8} {...common} />
        <Path d="M12 7.6 V12 L15.2 14" {...common} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={5.1} r={2} {...common} />
      <Path d="M12 7.5 V12.5" {...common} />
      <Path d="M9 10.2 L12 8.6 L15.3 10.2" {...common} />
      <Path d="M12 12.5 L9.2 18.8" {...common} />
      <Path d="M12.2 12.6 L16.8 16.4" {...common} />
      <Path d="M7.8 20 H11" {...common} />
      <Path d="M15.7 18.1 H19" {...common} />
    </Svg>
  );
}

function ChevronIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M9.5 5.5 L15.5 12 L9.5 18.5"
        stroke={colors.textSecondary}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function durationLabel(label: string): string {
  return label.replace(/^About\s+/, '');
}

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: spacing.pageTop,
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: 30,
    gap: 22,
    backgroundColor: todayHomeColors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  title: { ...type.pageTitle },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  tabButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabButtonSelected: {
    backgroundColor: colors.accent,
  },
  tabButtonText: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  tabButtonTextSelected: {
    color: colors.onAccent,
  },
  tabIntro: {
    gap: 10,
  },
  tabDescription: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  tabContent: {
    gap: 26,
  },
  featuredPostSection: {
    gap: 12,
  },
  featuredPostLabel: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  featuredPostCard: {
    minHeight: 292,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.accent,
    ...shadow.card,
  },
  featuredPostImage: {
    flex: 1,
    minHeight: 292,
    justifyContent: 'flex-end',
  },
  featuredPostImageRadius: {
    borderRadius: radius.card,
  },
  featuredPostScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(17, 20, 18, 0.34)',
  },
  featuredPostContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    maxWidth: '82%',
  },
  featuredPostMeta: {
    color: colors.onAccent,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0,
    opacity: 0.92,
  },
  featuredPostTitle: {
    color: colors.onAccent,
    fontFamily: fonts.serifMedium,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 0,
    marginTop: 9,
  },
  featuredPostBody: {
    color: colors.onAccent,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: 9,
    opacity: 0.95,
  },
  featuredPostButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 18,
    backgroundColor: colors.bgElevated,
  },
  featuredPostButtonText: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  featuredGuideSection: {
    gap: 12,
  },
  featuredGuideCard: {
    minHeight: 276,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.accent,
    ...shadow.card,
  },
  featuredGuideImage: {
    flex: 1,
    minHeight: 276,
    justifyContent: 'flex-end',
  },
  featuredGuideImageRadius: {
    borderRadius: radius.card,
  },
  featuredGuideScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(11, 43, 33, 0.32)',
  },
  featuredGuideContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    maxWidth: '84%',
  },
  section: {
    gap: 13,
  },
  sectionCopy: {
    gap: 5,
  },
  sectionTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  sectionBody: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  listPanel: {
    borderRadius: radius.card,
    backgroundColor: todayHomeColors.card,
    paddingHorizontal: 16,
    ...shadow.card,
  },
  articleListPanel: {
    paddingLeft: 10,
  },
  guideListPanel: {
    paddingLeft: 10,
  },
  listRow: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  articleRow: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  guideRow: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  sessionRow: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  listRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: todayHomeColors.border,
  },
  listCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
  },
  rowSubtitle: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    marginTop: 3,
  },
  rowMeta: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    marginTop: 4,
  },
  articleThumb: {
    width: 100,
    height: 80,
    borderRadius: 13,
    backgroundColor: todayHomeColors.iconFill,
  },
  guideThumb: {
    width: 100,
    height: 80,
    borderRadius: 13,
    backgroundColor: todayHomeColors.iconFill,
  },
  guideMetaRow: {
    alignSelf: 'flex-start',
    minHeight: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 9,
    marginTop: 10,
    backgroundColor: todayHomeColors.iconFill,
  },
  guideMetaText: {
    color: todayHomeColors.headingGreen,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  iconWell: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: todayHomeColors.iconFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWellCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  timePill: {
    alignSelf: 'flex-start',
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    backgroundColor: todayHomeColors.iconFill,
  },
  timePillCompact: {
    minHeight: 32,
    paddingHorizontal: 10,
  },
  timePillText: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 0,
  },
  setupCard: {
    borderRadius: radius.card,
    backgroundColor: todayHomeColors.card,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 15,
    ...shadow.card,
  },
  setupTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  setupCopy: {
    flex: 1,
    minWidth: 0,
  },
  setupTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
  },
  setupBody: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    marginTop: 3,
  },
  setupList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: todayHomeColors.border,
  },
  setupFact: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  setupFactDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: todayHomeColors.border,
  },
  setupFactCopy: {
    flex: 1,
    minWidth: 0,
  },
  setupFactLabel: {
    ...type.caption,
    color: colors.textSecondary,
  },
  setupFactValue: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  setupStatusPill: {
    minHeight: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  setupStatusPillReady: {
    backgroundColor: todayHomeColors.iconFill,
  },
  setupStatusPillNeutral: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: todayHomeColors.border,
  },
  setupStatusText: {
    color: todayHomeColors.headingGreen,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  settingsButton: {
    minHeight: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: todayHomeColors.border,
    backgroundColor: todayHomeColors.iconFill,
  },
  settingsButtonText: {
    color: todayHomeColors.headingGreen,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  practiceIntroCard: {
    minHeight: 116,
    borderRadius: radius.card,
    backgroundColor: todayHomeColors.card,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    ...shadow.card,
  },
  practiceIntroCopy: {
    flex: 1,
    minWidth: 0,
  },
  practiceIntroTitle: {
    color: todayHomeColors.primaryText,
    fontFamily: fonts.serifMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  practiceIntroBody: {
    color: todayHomeColors.secondaryText,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    marginTop: 5,
  },
  startButton: {
    minHeight: 42,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: todayHomeColors.primary,
  },
  startButtonText: {
    color: todayHomeColors.warmWhite,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  disabledRow: {
    opacity: 0.7,
  },
  disabledText: {
    ...type.caption,
    color: colors.textSecondary,
    maxWidth: 82,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
