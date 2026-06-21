import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const WELCOME_HERO_IMAGE = require('../../assets/images/hale-welcome-hero-v3.png');

export function WelcomeScreen({
  onStart,
  onDone,
  onBack,
  showDashboardLink = true,
}: {
  onStart: () => void;
  onDone: () => void;
  onBack?: () => void;
  showDashboardLink?: boolean;
}) {
  return (
    <Screen contentStyle={styles.screen}>
      {onBack ? (
        <View style={styles.backRow}>
          <BackArrowButton accessibilityLabel="Back to sign in" onPress={onBack} />
        </View>
      ) : null}

      <ScreenHeader
        eyebrow="First visit"
        title="Welcome to Hale"
        subtitle="Start with a private Movement Check-Up, then get a 4-week plan shaped around your goal, comfort, and home setup."
      />

      <View style={styles.heroImageCard}>
        <Image
          source={WELCOME_HERO_IMAGE}
          style={styles.heroImage}
          resizeMode="contain"
          accessible={false}
          accessibilityIgnoresInvertColors
        />
      </View>

      <View style={styles.summaryPanel}>
        <View style={styles.summaryTopRow}>
          <Text style={styles.summaryKicker}>Movement Check-Up</Text>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>Private</Text>
          </View>
        </View>
        <Text style={styles.summaryTitle}>A 10-minute baseline before your first plan.</Text>
        <Text style={styles.summaryBody}>
          Hale uses a clean skeleton view to shape a 4-week starting block.
        </Text>
        <View style={styles.summaryFacts}>
          <SummaryMetric value="10 min" detail="Time" />
          <SummaryMetric value="Skeleton" detail="View" />
          <SummaryMetric value="4 weeks" detail="Plan" />
        </View>
      </View>

      <View style={styles.timelineCard}>
        <SectionHeader title="Today’s protocol" note="Voice guided" />
        <TimelineStep
          index="01"
          title="Goal and comfort"
          body="Choose the everyday ability you care about and note anything that needs a gentler start."
        />
        <TimelineStep
          index="02"
          title="Home setup"
          body="Confirm your chair, support, lighting, and phone position before the camera opens."
        />
        <TimelineStep
          index="03"
          title="Movement Check-Up"
          body="Complete chair stands, balance, shoulder reach, and hinge reach with audio cues."
        />
        <TimelineStep
          index="04"
          title="First training block"
          body="Begin three calm sessions each week, with substitutions kept available."
          isLast
        />
      </View>

      <View style={styles.prepPanel}>
        <SectionHeader title="Before you begin" note="Simple setup" />
        <View style={styles.prepList}>
          <PrepItem icon="chair" label="Stable chair" body="Place a sturdy seat nearby for the check-up." />
          <View style={styles.prepRule} />
          <PrepItem icon="audio" label="Audio on" body="Hale will guide each step with calm voice cues." />
          <View style={styles.prepRule} />
          <PrepItem icon="light" label="Clear light" body="Use a bright open spot where your full body is visible." />
        </View>
      </View>

      <View style={styles.privacyPanel}>
        <View style={styles.privacyHeader}>
          <View style={styles.privacyHeaderCopy}>
            <Text style={styles.privacyKicker}>Privacy standard</Text>
            <Text style={styles.privacyTitle}>No mirror. No form judging.</Text>
          </View>
        </View>
        <Text style={styles.privacyIntro}>Hale keeps camera sessions calm, private, and measurement-led from the first check-up.</Text>
        <View style={styles.privacyPoints}>
          <PrivacyPoint
            index="01"
            title="Skeleton-only view"
            body="You appear as a clean outline, never a self-view video feed."
          />
          <PrivacyPoint
            index="02"
            title="Results, not critique"
            body="Feedback stays focused on measurements, progress, and next steps."
          />
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Get started" onPress={onStart} />
        {showDashboardLink ? <SecondaryButton title="Go to dashboard" onPress={onDone} /> : null}
      </View>
    </Screen>
  );
}

function SummaryMetric({ value, detail }: { value: string; detail: string }) {
  return (
    <View style={styles.summaryFact}>
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
        {value}
      </Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </View>
  );
}

function SectionHeader({ title, note }: { title: string; note: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionNote}>{note}</Text>
    </View>
  );
}

function TimelineStep({ index, title, body, isLast = false }: { index: string; title: string; body: string; isLast?: boolean }) {
  return (
    <View style={styles.timelineStep}>
      <View style={styles.timelineRail}>
        <Text style={styles.timelineIndex}>{index}</Text>
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={styles.timelineCopy}>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineBody}>{body}</Text>
      </View>
    </View>
  );
}

function PrepItem({
  icon,
  label,
  body,
}: {
  icon: 'chair' | 'audio' | 'light';
  label: string;
  body: string;
}) {
  return (
    <View style={styles.prepItem}>
      <View style={styles.prepIcon}>
        <PrepIcon name={icon} />
      </View>
      <View style={styles.prepCopy}>
        <Text style={styles.prepLabel}>{label}</Text>
        <Text style={styles.prepBody}>{body}</Text>
      </View>
    </View>
  );
}

function PrepIcon({ name }: { name: 'chair' | 'audio' | 'light' }) {
  const common = {
    stroke: colors.accentDeep,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {name === 'chair' ? (
        <>
          <Path d="M7 5.5 H14.5 C16.2 5.5 17.5 6.8 17.5 8.5 V12.5 H7 Z" {...common} />
          <Path d="M6.3 12.5 H18.6" {...common} />
          <Path d="M8 12.8 V19" {...common} />
          <Path d="M17 12.8 V19" {...common} />
          <Path d="M7 7.2 V12.4" {...common} />
        </>
      ) : null}
      {name === 'audio' ? (
        <>
          <Path d="M5.5 10 V14 H9 L13.5 18 V6 L9 10 Z" {...common} />
          <Path d="M16.4 9.2 C17.1 9.9 17.5 10.9 17.5 12 C17.5 13.1 17.1 14.1 16.4 14.8" {...common} />
          <Path d="M18.8 7 C20.1 8.4 20.8 10.1 20.8 12 C20.8 13.9 20.1 15.6 18.8 17" {...common} />
        </>
      ) : null}
      {name === 'light' ? (
        <>
          <Circle cx={12} cy={12} r={4.1} {...common} />
          <Path d="M12 3.8 V5.7" {...common} />
          <Path d="M12 18.3 V20.2" {...common} />
          <Path d="M3.8 12 H5.7" {...common} />
          <Path d="M18.3 12 H20.2" {...common} />
          <Path d="M6.2 6.2 L7.6 7.6" {...common} />
          <Path d="M16.4 16.4 L17.8 17.8" {...common} />
          <Path d="M17.8 6.2 L16.4 7.6" {...common} />
          <Path d="M7.6 16.4 L6.2 17.8" {...common} />
        </>
      ) : null}
    </Svg>
  );
}

function PrivacyPoint({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <View style={styles.privacyPoint}>
      <Text style={styles.privacyPointIndex}>{index}</Text>
      <View style={styles.privacyPointCopy}>
        <Text style={styles.privacyPointTitle}>{title}</Text>
        <Text style={styles.privacyPointBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  backRow: {
    alignItems: 'flex-start',
  },
  heroImageCard: {
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgMaterial,
    ...shadow.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  summaryPanel: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 10px 26px rgba(17,20,18,0.032)',
  },
  summaryTopRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryKicker: {
    ...type.label,
    color: colors.textSecondary,
  },
  summaryBadge: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  summaryBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  summaryTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  summaryBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  summaryFacts: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  summaryFact: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  summaryValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  summaryDetail: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  timelineCard: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.sm,
    backgroundColor: '#FFFDF9',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(216,211,200,0.82)',
    boxShadow: '0 10px 26px rgba(17,20,18,0.04)',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: 0,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  sectionNote: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
    paddingTop: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    gap: spacing.lg,
    minHeight: 74,
  },
  timelineRail: {
    width: 38,
    alignItems: 'center',
  },
  timelineIndex: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
  },
  timelineLine: {
    flex: 1,
    width: StyleSheet.hairlineWidth,
    minHeight: 34,
    backgroundColor: colors.borderHairline,
    marginTop: spacing.md,
  },
  timelineCopy: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  timelineTitle: {
    ...type.h3,
    fontSize: 17,
    lineHeight: 23,
  },
  timelineBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  prepPanel: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 12px 30px rgba(17,20,18,0.045)',
  },
  prepList: {
    gap: spacing.sm,
  },
  prepItem: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
    paddingVertical: spacing.sm,
  },
  prepRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: 56,
  },
  prepIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prepCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  prepLabel: {
    ...type.cardRowTitle,
    fontSize: 15,
    lineHeight: 20,
    color: colors.accentDeep,
  },
  prepBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  privacyPanel: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 12px 30px rgba(17,20,18,0.045)',
  },
  privacyHeader: {
    gap: spacing.xs,
  },
  privacyHeaderCopy: {
    minWidth: 0,
    gap: 3,
  },
  privacyKicker: {
    ...type.label,
    color: colors.accentDeep,
  },
  privacyTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  privacyIntro: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  privacyPoints: {
    gap: spacing.md,
  },
  privacyPoint: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  privacyPointIndex: {
    width: 34,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  privacyPointCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  privacyPointTitle: {
    ...type.cardRowTitle,
    color: colors.accentDeep,
  },
  privacyPointBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
