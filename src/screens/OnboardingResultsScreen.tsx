import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CheckUp } from '../checkup';
import type { MovementAssessment } from '../adherence';
import { PrimaryButton, Screen, ScreenHeader } from '../components/ui';
import { getAssessmentResultState } from '../haleFlow/assessmentResultState';
import {
  bandLabel,
  onboardingDomainSummaries,
  onboardingFocusCopy,
  onboardingFocusDomain,
} from '../onboarding/results';
import { DOMAIN_LABEL, selectFocusFromScore, type CheckUpScore, type ScoreFocusSelection, type VersionedCheckUpScoreSnapshot } from '../scoring';
import { colors, fonts, radius, spacing, type } from '../theme';

const ICONS = {
  strength_power: 'S',
  balance_stability: 'B',
  mobility_flexibility: 'M',
} as const;

export function OnboardingResultsScreen({
  checkUp: _checkUp,
  assessment,
  score,
  scoreSnapshot,
  onContinue,
  onRetake,
}: {
  checkUp: CheckUp;
  assessment?: MovementAssessment | null;
  score?: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  onContinue: () => void;
  onRetake: () => void;
}) {
  const resultState = React.useMemo(() => getAssessmentResultState({ score: score ?? null, scoreSnapshot, assessment }), [assessment, score, scoreSnapshot]);
  const focusSelection = React.useMemo(
    () => scoreSnapshot?.focusSelection ?? selectFocusFromScore(score, { activeFocusDomain: score?.weakestDomain }),
    [score, scoreSnapshot]
  );
  const closelyMatched = focusSelection?.kind === 'exact_tie' || focusSelection?.kind === 'near_tie';
  const focus = resultState.canCreateBlock && score ? onboardingFocusDomain(score) : null;
  const summaries = score ? onboardingDomainSummaries(score) : [];
  return (
    <Screen>
      <View style={styles.header}>
        <ScreenHeader
          eyebrow="Movement Check-Up"
          title="Your starting picture"
          subtitle="Hale uses today’s home estimate, your goal, and your setup to prepare the first block."
        />
      </View>

      {focus ? (
        <View style={styles.focusCard}>
          <View style={styles.focusTopRow}>
            <Text style={styles.eyebrow}>{closelyMatched ? 'Closely matched starting point' : 'Suggested first focus'}</Text>
            <View style={styles.focusPill}>
              <Text style={styles.focusPillText}>Home estimate</Text>
            </View>
          </View>
          <Text style={styles.focusTitle}>
            {closelyMatched ? tiedDomainLabels(focusSelection) : onboardingFocusCopy(focus)}
          </Text>
          <View style={styles.focusRule} />
          <Text style={styles.focusBody}>
            {closelyMatched
              ? `${onboardingFocusCopy(focus)} is the suggested first focus because these home estimates were closely matched.`
              : 'This gives Hale a starting point for your first 4-week block. You can retake the check-up if anything felt off.'}
          </Text>
        </View>
      ) : (
        <View style={styles.focusCard}>
          <Text style={styles.eyebrow}>Retake needed</Text>
          <Text style={styles.focusTitle}>{resultState.recoveryTitle}</Text>
          <View style={styles.focusRule} />
          <Text style={styles.focusBody}>{resultState.recoveryBody}</Text>
        </View>
      )}

      {summaries.length > 0 ? (
        <View style={styles.domainStack}>
          {summaries.map((domain) => (
            <DomainSummaryCard
              key={domain.key}
              icon={ICONS[domain.key]}
              title={domain.title}
              band={bandLabel(domain.band)}
              status={focus && domain.key === focus ? 'Suggested focus' : closelyMatched && domainIsTied(domain.key, focusSelection) ? 'Closely matched' : 'Home estimate'}
              featured={!!focus && domain.key === focus}
            />
          ))}
        </View>
      ) : null}

      {resultState.canCreateBlock ? (
        <View style={styles.nextCard}>
          <View style={styles.noteHead}>
            <Text style={styles.nextTitle}>What happens next</Text>
            <View style={styles.nextPill}>
              <Text style={styles.nextPillText}>4-week block</Text>
            </View>
          </View>
          <View style={styles.nextRule} />
          <Text style={styles.nextBody}>
            Your first block is ready in the Plan tab. You will get three calm Hale Sessions each week, then repeat the check-up in 4 weeks.
          </Text>
        </View>
      ) : null}

      {resultState.canCreateBlock ? (
        <PrimaryButton title="View my first block" onPress={onContinue} />
      ) : resultState.canRetake ? (
        <PrimaryButton title="Retake Movement Check-Up" onPress={onRetake} />
      ) : (
        <PrimaryButton title="Done" onPress={onRetake} />
      )}
    </Screen>
  );
}

function DomainSummaryCard({
  icon,
  title,
  band,
  status,
  featured,
}: {
  icon: string;
  title: string;
  band: string;
  status: string;
  featured: boolean;
}) {
  return (
    <View style={[styles.domainCard, featured && styles.domainCardFeatured]}>
      <View style={[styles.domainMark, featured && styles.domainMarkFeatured]}>
        <Text style={[styles.domainMarkText, featured && styles.domainMarkTextFeatured]}>{icon}</Text>
      </View>
      <View style={styles.domainCopy}>
        <Text style={styles.domainTitle}>{title}</Text>
        <Text style={styles.domainStatus}>{status}</Text>
      </View>
      <View style={styles.domainBandWrap}>
        <Text style={styles.domainBand}>{band}</Text>
      </View>
    </View>
  );
}

function tiedDomainLabels(focusSelection: ScoreFocusSelection | null | undefined): string {
  if (!focusSelection) return '';
  return focusSelection.tiedDomains.map((domain) => DOMAIN_LABEL[domain]).join(' + ');
}

function domainIsTied(
  domain: 'strength_power' | 'balance_stability' | 'mobility_flexibility',
  focusSelection: ScoreFocusSelection | null | undefined
): boolean {
  if (!focusSelection) return false;
  if (domain === 'strength_power') return focusSelection.tiedDomains.includes('strength');
  if (domain === 'balance_stability') return focusSelection.tiedDomains.includes('balance');
  return focusSelection.tiedDomains.includes('mobility');
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  focusCard: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 12px 30px rgba(17,20,18,0.04)',
  },
  focusTopRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  eyebrow: {
    ...type.label,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  focusPill: {
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  focusPillText: {
    ...type.caption,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
  },
  focusTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  focusRule: {
    width: 48,
    height: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accentGold,
  },
  focusBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  domainStack: {
    gap: spacing.md,
  },
  domainCard: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 8px 22px rgba(17,20,18,0.026)',
  },
  domainCardFeatured: {
    borderColor: colors.goldBorder,
    backgroundColor: colors.bgGold,
  },
  domainMark: {
    width: 46,
    height: 46,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBase,
  },
  domainMarkFeatured: {
    backgroundColor: colors.surface,
  },
  domainMarkText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  domainMarkTextFeatured: {
    color: colors.accentDeep,
  },
  domainCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  domainTitle: {
    ...type.cardRowTitle,
    fontSize: 16,
    lineHeight: 21,
  },
  domainStatus: {
    ...type.caption,
    color: colors.textSecondary,
  },
  domainBandWrap: {
    maxWidth: 132,
    alignItems: 'flex-end',
  },
  domainBand: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.accentDeep,
    textAlign: 'right',
  },
  nextCard: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 10px 26px rgba(17,20,18,0.032)',
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  nextTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  nextPill: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  nextPillText: {
    ...type.bodySmall,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
  },
  nextRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderHairline,
  },
  nextBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
});
