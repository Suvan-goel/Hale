import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  Card,
  EmptyState,
  Screen,
  StatusBadge,
} from '../components/ui';
import { daysUntil, type MovementBlock, type MovementBlockReport, type TrainingSessionCompletion } from '../adherence';
import {
  getDomainProgressCards,
  getLatestCheckUpSummary,
  getRetestDueSummary,
} from '../haleFlow';
import type { StoredCheckUp } from '../history';
import type { Domain } from '../scoring';
import type { LadderProgress } from '../training';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const DOMAIN_LABEL: Record<Domain, string> = {
  strength: 'Strength / Power',
  balance: 'Balance',
  mobility: 'Mobility',
};

export function ProgressScreen({
  history,
  activeBlock,
  today,
  onBeginCheckUp,
  onStartRetest,
  onViewLatest,
}: ProgressScreenProps) {
  const latest = getLatestCheckUpSummary(history);
  const domainCards = getDomainProgressCards(history);
  const retest = getRetestDueSummary({ activeBlock, today, hasBaseline: history.length > 0 });

  return (
    <Screen contentStyle={styles.screenContent}>
      <Text style={styles.title}>Movement Progress</Text>

      {!latest ? (
        <EmptyState
          title="Complete your first Movement Check-Up to see your baseline."
          body="Hale will use it to build your 4-week block and start tracking progress."
          actionLabel="Start Movement Check-Up"
          onAction={onBeginCheckUp}
        />
      ) : (
        <>
          <Card style={styles.progressCard}>
            <Text style={styles.latestTitle}>Latest movement check-up</Text>
            <Text style={styles.latestDate}>{latest.dateLabel}</Text>
            <Text style={styles.latestFocus}>{latest.focusTitle}</Text>

            <View style={styles.bandGrid}>
              {(['strength', 'balance', 'mobility'] as Domain[]).map((domain) => (
                <Pressable
                  key={domain}
                  style={({ pressed }) => [styles.bandCard, pressed && styles.pressed]}
                  onPress={onViewLatest}
                  accessibilityRole="button"
                  accessibilityLabel={`${DOMAIN_LABEL[domain]}: ${bandLabel(latest.bands[domain])}`}
                >
                  <IconBadge domain={domain} size={58} iconSize={34} />
                  <Text style={styles.bandLabel}>{DOMAIN_LABEL[domain]}</Text>
                  <Text style={styles.bandValue}>{bandLabel(latest.bands[domain])}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card style={styles.progressCard}>
            <Text style={styles.sectionTitle}>Domain progress</Text>
            <View style={styles.domainList}>
              {domainCards.map((card, index) => (
                <DomainProgressRow key={card.domain} card={card} showDivider={index > 0} />
              ))}
            </View>
          </Card>

          <RetestCard
            title={retest.title}
            body={retestLine({ activeBlock, today, fallback: retest.body, due: retest.due })}
            onPress={retest.due && retest.ctaLabel ? onStartRetest : undefined}
          />
        </>
      )}
    </Screen>
  );
}

interface ProgressScreenProps {
  history: readonly StoredCheckUp[];
  activeBlock?: MovementBlock | null;
  blocks: readonly MovementBlock[];
  reports: readonly MovementBlockReport[];
  completions: readonly TrainingSessionCompletion[];
  ladderProgressById?: Record<string, LadderProgress>;
  today: string;
  onBeginCheckUp: () => void;
  onStartRetest: () => void;
  onViewLatest: () => void;
  onViewReport: (blockId: string) => void;
  onOpenSettings: () => void;
}

function DomainProgressRow({
  card,
  showDivider,
}: {
  card: ReturnType<typeof getDomainProgressCards>[number];
  showDivider: boolean;
}) {
  return (
    <View style={[styles.domainRow, showDivider && styles.domainRowDivider]}>
      <IconBadge domain={card.domain} size={44} iconSize={27} />
      <View style={styles.domainText}>
        <Text style={styles.domainTitle}>{card.title}</Text>
        <Text style={styles.metricLine}>{displayMetric(card.metric)}</Text>
      </View>
      <StatusBadge label={trendLabel(card.trend)} tone={card.trend === 'improved' ? 'good' : 'neutral'} />
    </View>
  );
}

function RetestCard({
  title,
  body,
  onPress,
}: {
  title: string;
  body: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <IconBadge domain="calendar" size={44} iconSize={26} />
      <View style={styles.retestText}>
        <Text style={styles.retestTitle}>{title}</Text>
        <Text style={styles.retestBody}>{body}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </>
  );

  if (!onPress) {
    return <Card style={[styles.progressCard, styles.retestCard]}>{content}</Card>;
  }

  return (
    <Card style={[styles.progressCard, styles.retestCardInteractive]}>
      <Pressable
        style={({ pressed }) => [styles.retestPressable, pressed && styles.pressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${body}`}
      >
        {content}
      </Pressable>
    </Card>
  );
}

function IconBadge({
  domain,
  size,
  iconSize,
}: {
  domain: Domain | 'calendar';
  size: number;
  iconSize: number;
}) {
  return (
    <View style={[styles.iconBadge, { width: size, height: size, borderRadius: size / 2 }]}>
      <ProgressPictogram name={domain} size={iconSize} color={colors.accent} />
    </View>
  );
}

function ProgressPictogram({
  name,
  size,
  color,
}: {
  name: Domain | 'calendar';
  size: number;
  color: string;
}) {
  const s = iconStroke(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'strength' ? (
        <>
          <Path d="M5 8.5 V15.5" {...s} />
          <Path d="M8 6.8 V17.2" {...s} />
          <Path d="M16 6.8 V17.2" {...s} />
          <Path d="M19 8.5 V15.5" {...s} />
          <Path d="M8 12 H16" {...s} />
          <Path d="M3 10 V14" {...s} />
          <Path d="M21 10 V14" {...s} />
        </>
      ) : name === 'balance' ? (
        <>
          <Path d="M12 4 V19" {...s} />
          <Path d="M7 7 H17" {...s} />
          <Path d="M5 19 H19" {...s} />
          <Path d="M7 7 L4.5 13.5 H9.5 L7 7 Z" {...s} />
          <Path d="M17 7 L14.5 13.5 H19.5 L17 7 Z" {...s} />
          <Path d="M4.8 13.5 C5.4 15.1 8.6 15.1 9.2 13.5" {...s} />
          <Path d="M14.8 13.5 C15.4 15.1 18.6 15.1 19.2 13.5" {...s} />
        </>
      ) : name === 'mobility' ? (
        <>
          <Circle cx={12} cy={5.4} r={1.6} {...s} />
          <Path d="M12 8.6 V13.2" {...s} />
          <Path d="M12 10.2 L7.8 12.6" {...s} />
          <Path d="M12 10.2 L16.4 13" {...s} />
          <Path d="M12 13.2 L8.7 19.2" {...s} />
          <Path d="M12 13.2 L16.4 19.2" {...s} />
        </>
      ) : (
        <>
          <Rect x={5.2} y={5.8} width={13.6} height={13.2} rx={2.2} {...s} />
          <Path d="M5.2 9.8 H18.8" {...s} />
          <Path d="M8.5 4.2 V7.1" {...s} />
          <Path d="M15.5 4.2 V7.1" {...s} />
          <Path d="M8.8 13.3 H10.2" {...s} />
          <Path d="M12.9 13.3 H15.1" {...s} />
          <Path d="M8.8 16.2 H10.2" {...s} />
        </>
      )}
    </Svg>
  );
}

function iconStroke(color: string) {
  return {
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };
}

function bandLabel(band: 'starting_point' | 'building' | 'strong' | 'pending'): string {
  if (band === 'strong') return 'Strong';
  if (band === 'building') return 'Building';
  if (band === 'starting_point') return 'Starting point';
  return 'Starting point';
}

function displayMetric(metric: string): string {
  return metric.replace(/ -> /g, ' → ');
}

function trendLabel(trend: string): string {
  if (trend === 'improved') return 'Building';
  if (trend === 'held_steady') return 'Held steady';
  if (trend === 'lower') return 'Adjusted';
  return 'Starting point';
}

function retestLine({
  activeBlock,
  today,
  fallback,
  due,
}: {
  activeBlock?: MovementBlock | null;
  today: string;
  fallback: string;
  due: boolean;
}): string {
  if (!activeBlock || due) return fallback;
  return `${formatShortDate(activeBlock.retestDate)} · ${relativeRetestLabel(daysUntil(activeBlock.retestDate, today))}`;
}

function relativeRetestLabel(days: number): string {
  if (days <= 0) return 'Due now';
  if (days === 1) return 'Tomorrow';
  if (days >= 14) {
    const weeks = Math.ceil(days / 7);
    return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  return `In ${days} days`;
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Next check-up';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  screenContent: {
    gap: spacing.lg,
    paddingTop: spacing.huge,
  },
  title: {
    fontFamily: fonts.serifRegular,
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: 0,
    color: colors.sageDeep,
  },
  progressCard: {
    padding: spacing.lg + spacing.xs,
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderHairline,
    ...shadow.soft,
    shadowOpacity: 0.035,
  },
  latestTitle: { ...type.h3 },
  latestDate: { ...type.bodySmall, color: colors.sageDeep, marginTop: spacing.sm },
  latestFocus: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  bandGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  bandCard: {
    flex: 1,
    minHeight: 120,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sageMist,
  },
  bandLabel: {
    ...type.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  bandValue: {
    ...type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  sectionTitle: { ...type.h3 },
  domainList: { marginTop: spacing.md },
  domainRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  domainRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  domainText: { flex: 1, minWidth: 0 },
  domainTitle: { ...type.bodySmall, fontFamily: fonts.sansMedium },
  metricLine: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
  retestCard: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  retestCardInteractive: {
    padding: 0,
    overflow: 'hidden',
  },
  retestPressable: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg + spacing.xs,
  },
  retestText: { flex: 1, minWidth: 0 },
  retestTitle: { ...type.h3 },
  retestBody: { ...type.bodySmall, color: colors.sageDeep, marginTop: spacing.xs },
  chevron: { ...type.h2, color: colors.textSecondary },
  pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
});
