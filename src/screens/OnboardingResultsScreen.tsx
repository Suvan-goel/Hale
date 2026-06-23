import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CheckUp } from '../checkup';
import type { MovementAssessment, MovementBlock } from '../adherence';
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { getAssessmentResultState } from '../haleFlow/assessmentResultState';
import {
  bandLabel,
  onboardingDomainSummaries,
  onboardingFocusCopy,
  onboardingFocusDomain,
  plannedOnboardingFocusDomain,
} from '../onboarding/results';
import { selectFocusFromScore, type CheckUpScore, type ScoreFocusSelection, type VersionedCheckUpScoreSnapshot } from '../scoring';
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
  plannedBlock,
  onContinue,
  onRetake,
  onDone,
}: {
  checkUp: CheckUp;
  assessment?: MovementAssessment | null;
  score?: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  plannedBlock?: MovementBlock | null;
  onContinue: () => void;
  onRetake: () => void;
  onDone: () => void;
}) {
  const resultState = React.useMemo(() => getAssessmentResultState({ score: score ?? null, scoreSnapshot, assessment }), [assessment, score, scoreSnapshot]);
  const focusSelection = React.useMemo(
    () => scoreSnapshot?.focusSelection ?? selectFocusFromScore(score, { activeFocusDomain: score?.weakestDomain }),
    [score, scoreSnapshot]
  );
  const closelyMatched = focusSelection?.kind === 'exact_tie' || focusSelection?.kind === 'near_tie';
  const focus = resultState.canCreateBlock
    ? plannedOnboardingFocusDomain({ score: score ?? null, plannedBlock })
    : null;
  const focusDiffersFromScore =
    !!focus && !!score && !!plannedBlock && focus !== onboardingFocusDomain(score);
  const summaries = score ? onboardingDomainSummaries(score) : [];
  return (
    <Screen>
      <View style={styles.header}>
        <ScreenHeader
          eyebrow="Check-up complete"
          title="Your starting point"
          subtitle={
            resultState.canCreateBlock
              ? 'Hale found one clear place to begin your first plan.'
              : 'Hale needs a clearer result before building your plan.'
          }
        />
      </View>

      {focus ? (
        <View style={styles.focusCard}>
          <View style={styles.focusTopRow}>
            <Text style={styles.eyebrow}>First focus</Text>
          </View>
          <Text style={styles.focusTitle}>
            {onboardingFocusCopy(focus)}
          </Text>
          <View style={styles.focusRule} />
          <Text style={styles.focusBody}>
            {closelyMatched && focusDiffersFromScore
              ? 'A few areas were close, so Hale chose the focus that best supports your goal.'
              : closelyMatched
              ? 'A few areas were close, so Hale chose one place to start.'
              : 'Your first plan will start here and still include the other areas.'}
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
              status={focus && domain.key === focus ? 'First focus' : closelyMatched && domainIsTied(domain.key, focusSelection) ? 'Close result' : 'Checked'}
              featured={!!focus && domain.key === focus}
            />
          ))}
        </View>
      ) : null}

      {resultState.canCreateBlock ? (
        <View style={styles.nextCard}>
          <View style={styles.noteHead}>
            <Text style={styles.nextTitle}>What happens next</Text>
          </View>
          <View style={styles.nextRule} />
          <Text style={styles.nextBody}>
            Three guided sessions each week. In 4 weeks, you'll repeat the check-up and compare what changed.
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {resultState.canCreateBlock ? (
          <>
            <PrimaryButton title="See my plan" onPress={onContinue} />
            <SecondaryButton title="Retake check-up" onPress={onRetake} />
          </>
        ) : resultState.canRetake ? (
          <PrimaryButton title="Retake check-up" onPress={onRetake} />
        ) : (
          <PrimaryButton title="Done" onPress={onDone} />
        )}
      </View>
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
  actions: {
    gap: spacing.md,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
  },
  eyebrow: {
    ...type.label,
    color: colors.textSecondary,
    flexShrink: 1,
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
  nextRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderHairline,
  },
  nextBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
});
