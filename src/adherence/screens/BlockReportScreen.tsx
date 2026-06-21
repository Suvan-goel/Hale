import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../../components/BackArrowButton';
import { Screen, ScreenHeader } from '../../components/ui';
import { CheckUpScore, DOMAIN_LABEL, selectFocusFromScore, type Domain, type ScoreFocusSelection } from '../../scoring';
import { colors, fonts, radius, spacing, type } from '../../theme';
import { blockProgress } from '../adherenceState';
import { movementDomainFromScoreDomainOrNull } from '../blockService';
import { domainLabel, getLifeGoalDisplayText } from '../goalDomainMapping';
import type { IdentityMilestone, LifeGoal, MovementBlock, MovementBlockReport, MovementDomain, TrainingSessionCompletion } from '../types';

export function BlockReportScreen({
  block,
  lifeGoal,
  completions,
  previousScore,
  latestScore,
  milestone,
  report,
  nextBlockReady,
  onDone,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completions: readonly TrainingSessionCompletion[];
  previousScore?: CheckUpScore | null;
  latestScore?: CheckUpScore | null;
  report?: MovementBlockReport | null;
  milestone?: IdentityMilestone | null;
  nextBlockReady?: boolean;
  onStartNextBlock: () => void;
  onDone: () => void;
}) {
  const progress = blockProgress(block, completions);
  const comparisonUnavailable = report ? (report.comparison?.status ?? 'legacy_unversioned') !== 'compatible' : false;
  const domainChanges = (['strength', 'balance', 'mobility'] as Domain[]).map((domain) =>
    comparisonUnavailable ? unavailableDomainChange(domain) : domainChange(domain, previousScore, latestScore)
  );
  const main = comparisonUnavailable ? comparisonUnavailableCopy() : mainChange(domainChanges);
  const latestFocusSelection = latestScore
    ? selectFocusFromScore(latestScore, { activeFocusDomain: latestScore.weakestDomain })
    : null;
  const nextFocus = latestFocusSelection
    ? DOMAIN_LABEL[latestFocusSelection.focusDomain]
    : latestScore
      ? domainLabel(movementDomainFromScoreDomainOrNull(latestScore.weakestDomain) ?? block.focusDomain)
      : domainLabel(block.focusDomain);
  const closelyMatched = latestFocusSelection?.kind === 'exact_tie' || latestFocusSelection?.kind === 'near_tie';
  const sessionProgressPercent =
    progress.totalSessions > 0
      ? Math.min(100, Math.max(0, (progress.completedSessions / progress.totalSessions) * 100))
      : 0;

  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back from 4-week report" onPress={onDone} />
      <ScreenHeader
        title="Your 4-week report"
        subtitle={nextBlockReady ? 'Your next 4-week block is ready.' : 'A calm look at your latest re-test and what comes next.'}
      />

      <View style={styles.reportSheet}>
        <View style={styles.sheetHead}>
          <View style={styles.sheetHeadCopy}>
            <Text style={styles.sheetEyebrow}>4-week block</Text>
            <Text style={styles.sheetTitle}>{domainLabel(block.focusDomain)} training</Text>
          </View>
          <View style={styles.sheetStamp}>
            <Text style={styles.sheetStampText}>{nextBlockReady ? 'Ready' : 'Saved'}</Text>
          </View>
        </View>

        <View style={styles.sheetDivider} />

        <View style={styles.trainingSummary}>
          <View style={styles.sessionSummary}>
            <Text style={styles.sessionValue}>
              {progress.completedSessions}
              <Text style={styles.sessionValueMuted}> of {progress.totalSessions}</Text>
            </Text>
            <Text style={styles.sessionLabel}>sessions completed</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${sessionProgressPercent}%` }]} />
          </View>

          <View style={styles.trainingStats}>
            <TrainingStat label="Focus" value={domainLabel(block.focusDomain)} />
            <View style={styles.statDivider} />
            <TrainingStat label="Micro-checks" value={`${progress.microChecksCompleted}`} />
          </View>
        </View>

        <View style={styles.sheetDivider} />

        <ReportSection
          eyebrow="Comparison"
          title="What changed"
          body={comparisonUnavailable ? 'Your latest re-test is saved for future trend comparisons.' : 'Latest re-test compared with your previous check-up.'}
        >
          <View style={styles.changeList}>
            {domainChanges.map((change, index) => (
              <ChangeRow key={change.domain} change={change} showDivider={index > 0} />
            ))}
          </View>
        </ReportSection>

        <View style={styles.sheetDivider} />

        <ReportSection eyebrow="Re-test" title={comparisonUnavailable ? 'Re-test complete' : 'Latest re-test'} body={main} />

        <View style={styles.sheetDivider} />

        <ReportSection
          eyebrow={nextBlockReady ? 'Ready' : 'Next'}
          title="Suggested next focus"
          body={nextFocusCopy({ nextFocus, nextBlockReady, focusSelection: latestFocusSelection, closelyMatched })}
        />

        <View style={styles.sheetDivider} />

        <ReportSection
          eyebrow="Everyday movement"
          title="Why this matters"
          body={
            milestone
              ? `${milestone.title}. ${milestone.body}`
              : lifeGoal
                ? `This supports progress toward ${getLifeGoalDisplayText(lifeGoal).toLowerCase()}.`
                : 'This keeps Hale focused on supporting everyday movement.'
          }
        />
      </View>
    </Screen>
  );
}

type DomainChangeSummary = ReturnType<typeof domainChange>;

function unavailableDomainChange(
  domain: Domain
): { domain: Domain; label: string; value: string; direction: 'recorded_lower' | 'similar' | 'recorded_higher' | 'unknown' } {
  const label = domain === 'strength' ? 'Strength / Power change' : domain === 'balance' ? 'Balance change' : 'Mobility change';
  return { domain, label, value: 'Comparison unavailable', direction: 'unknown' };
}

function comparisonUnavailableCopy(): string {
  return "Your latest result has been saved. Hale's scoring method has changed since your earlier Check-Up, so a direct comparison isn't available.";
}

function nextFocusCopy({
  nextFocus,
  nextBlockReady,
  focusSelection,
  closelyMatched,
}: {
  nextFocus: string;
  nextBlockReady?: boolean;
  focusSelection: ScoreFocusSelection | null;
  closelyMatched: boolean;
}): string {
  const prefix = closelyMatched && focusSelection
    ? `Your latest domains were closely matched (${focusSelection.tiedDomains.map((domain) => DOMAIN_LABEL[domain]).join(' + ')}). `
    : '';
  return nextBlockReady
    ? `${prefix}Your next 4-week block is ready with ${nextFocus.toLowerCase()} as the suggested focus.`
    : `${prefix}Your next 4-week block can use ${nextFocus.toLowerCase()} as the suggested focus.`;
}

function TrainingStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.trainingStat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ChangeRow({ change, showDivider }: { change: DomainChangeSummary; showDivider: boolean }) {
  return (
    <View style={[styles.changeRow, showDivider && styles.rowDivider]}>
      <Text style={styles.changeTitle}>{changeTitle(change.domain)}</Text>
      <View style={styles.changeStatus}>
        <Text style={styles.changeStatusText} numberOfLines={2}>
          {change.value}
        </Text>
      </View>
    </View>
  );
}

function ReportSection({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.reportSection}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
      {children}
    </View>
  );
}

function domainChange(
  domain: Domain,
  previousScore?: CheckUpScore | null,
  latestScore?: CheckUpScore | null
): { domain: Domain; label: string; value: string; direction: 'recorded_lower' | 'similar' | 'recorded_higher' | 'unknown' } {
  const label = domain === 'strength' ? 'Strength / Power change' : domain === 'balance' ? 'Balance change' : 'Mobility change';
  const before = previousScore?.domains.find((item) => item.domain === domain);
  const after = latestScore?.domains.find((item) => item.domain === domain);
  if (!before?.measured || !after?.measured) return { domain, label, value: 'Re-test saved', direction: 'unknown' };
  const beforeMid = (before.ageLow + before.ageHigh) / 2;
  const afterMid = (after.ageLow + after.ageHigh) / 2;
  if (!Number.isFinite(beforeMid) || !Number.isFinite(afterMid)) return { domain, label, value: 'Re-test saved', direction: 'unknown' };
  if (afterMid < beforeMid) return { domain, label, value: 'Changed', direction: 'recorded_lower' };
  if (afterMid === beforeMid) return { domain, label, value: 'Similar result', direction: 'similar' };
  return { domain, label, value: 'New data point', direction: 'recorded_higher' };
}

function mainChange(changes: readonly ReturnType<typeof domainChange>[]): string {
  const lower = changes.find((change) => change.direction === 'recorded_lower');
  if (lower) return `${shortDomain(lower.domain)} changed in the latest re-test.`;
  const similar = changes.find((change) => change.direction === 'similar');
  if (similar) return `${shortDomain(similar.domain)} was similar in the latest re-test.`;
  const higher = changes.find((change) => change.direction === 'recorded_higher');
  if (higher) return `${shortDomain(higher.domain)} added a new data point for the next block.`;
  return 'Your re-test is saved. Hale will use it as another data point for the next block.';
}

function shortDomain(domain: Domain): string {
  return domainLabel(movementDomainForScoreDomain(domain));
}

function changeTitle(domain: Domain): string {
  if (domain === 'strength') return 'Strength / Power';
  if (domain === 'balance') return 'Balance';
  return 'Mobility';
}

function movementDomainForScoreDomain(domain: Domain): MovementDomain {
  return domain === 'strength' ? 'strength_power' : domain;
}

const styles = StyleSheet.create({
  reportSheet: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 16px 40px rgba(17,20,18,0.042)',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  sheetHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  sheetEyebrow: {
    ...type.label,
    color: colors.accentDeep,
  },
  sheetTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  sheetStamp: {
    minHeight: 32,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  sheetStampText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  trainingSummary: {
    gap: spacing.md,
  },
  sessionSummary: {
    gap: 2,
  },
  sessionValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 48,
    lineHeight: 55,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  sessionValueMuted: {
    fontFamily: fonts.serifMedium,
    fontSize: 29,
    lineHeight: 36,
    letterSpacing: 0,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  sessionLabel: {
    ...type.label,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accentDeep,
  },
  trainingStats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  trainingStat: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  statLabel: {
    ...type.label,
    color: colors.textTertiary,
  },
  statValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  reportSection: {
    gap: spacing.sm,
  },
  sectionEyebrow: {
    ...type.label,
    color: colors.textTertiary,
  },
  sectionTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  sectionBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  changeList: {
    marginTop: spacing.sm,
  },
  changeRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  changeTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  changeStatus: {
    maxWidth: 142,
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  changeStatusText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
    color: colors.accentDeep,
    textAlign: 'right',
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
});
