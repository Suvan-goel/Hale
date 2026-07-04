import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, Screen, ScreenHeader } from '../../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme';
import type { PainArea, TrackingQuality, ValidTimeSessionSummaryCard } from '../../training';
import { getLifeGoalDisplayText } from '../adherenceCopy';
import { movementBlockDomainFocus } from '../blockFocus';
import type { LifeGoal, MovementBlock, TrainingSessionCompletion } from '../types';

export interface SessionFeedbackInput {
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  painArea?: PainArea;
  completed?: boolean;
  trackingQuality?: TrackingQuality;
}

const EFFORT_OPTIONS: readonly { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: 'Very easy' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Just right' },
  { value: 4, label: 'Challenging' },
  { value: 5, label: 'Too hard' },
];

const PAIN_AREAS: readonly { value: PainArea; label: string }[] = [
  { value: 'knee', label: 'Knee' },
  { value: 'hip', label: 'Hip' },
  { value: 'back', label: 'Back' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'ankle', label: 'Ankle' },
  { value: 'neck', label: 'Neck' },
  { value: 'other', label: 'Other' },
];

export function SessionCompletionScreen({
  block,
  lifeGoal,
  completion,
  validTimeSummaries = [],
  onFeedback,
  onDone,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completion?: TrainingSessionCompletion | null;
  validTimeSummaries?: readonly ValidTimeSessionSummaryCard[];
  onFeedback?: (feedback: SessionFeedbackInput) => void;
  onDone: () => void;
}) {
  const credited = completion?.mainPlanCredit === true && completion.focusStimulusEvidence?.mainPlanCredit === true;
  const restarted = completion?.sessionType === 'restart';
  const completionCopy = sessionCompletionCopy({
    block,
    lifeGoal,
    completion,
    credited,
    restarted,
    progressionEvidencePolicy: completion?.progressionEvidencePolicy,
  });
  const [effort, setEffort] = React.useState<1 | 2 | 3 | 4 | 5 | undefined>(completion?.perceivedEffort);
  const [painReported, setPainReported] = React.useState<boolean | undefined>(completion?.painReported);
  const [painArea, setPainArea] = React.useState<PainArea | undefined>();
  const submitFeedback = () => {
    onFeedback?.(buildSessionFeedback({ effort, painReported, painArea }));
  };
  const finish = () => {
    submitFeedback();
    onDone();
  };
  return (
    <Screen contentStyle={styles.screenContent}>
      <ScreenHeader
        eyebrow={completionCopy.eyebrow}
        title={completionCopy.title}
        subtitle={completionCopy.subtitle}
      />

      <View style={styles.completionSheet}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetEyebrow}>{completionCopy.cardEyebrow}</Text>
          <Text style={styles.sheetTitle}>{completionCopy.cardTitle}</Text>
          <Text style={styles.sheetBody}>{completionCopy.body}</Text>
        </View>

        {validTimeSummaries.length > 0 ? (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <SectionHeading eyebrow="Recorded" title="What Hale recorded" />
              <View style={styles.summaryList}>
                {validTimeSummaries.map((summary, index) => (
                  <View
                    key={summary.exerciseId}
                    style={[styles.summaryBlock, index > 0 && styles.summaryDivider]}
                  >
                    <Text style={styles.summaryTitle}>{summary.title}</Text>
                    {summary.lines.map((line) => (
                      <Text key={line} style={styles.summaryLine}>{line}</Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.divider} />
        <View style={styles.section}>
          <SectionHeading eyebrow="Feedback" title="How hard did it feel?" />
          <View style={styles.effortGrid}>
            <View style={styles.effortRow}>
              {EFFORT_OPTIONS.slice(0, 3).map((option) => (
                <EffortChoice
                  key={option.value}
                  option={option}
                  selected={effort === option.value}
                  onPress={() => setEffort(option.value)}
                />
              ))}
            </View>
            <View style={styles.effortRow}>
              {EFFORT_OPTIONS.slice(3).map((option) => (
                <EffortChoice
                  key={option.value}
                  option={option}
                  selected={effort === option.value}
                  onPress={() => setEffort(option.value)}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.divider} />
        <View style={styles.section}>
          <SectionHeading eyebrow="Comfort" title="Any pain or discomfort?" />
          <View style={styles.choiceSegment}>
            <Choice label="No" selected={painReported === false} onPress={() => { setPainReported(false); setPainArea(undefined); }} />
            <Choice label="Yes" selected={painReported === true} onPress={() => setPainReported(true)} />
          </View>
          {painReported ? (
            <View style={styles.painAreas}>
              {PAIN_AREAS.map((area) => (
                <Choice
                  key={area.value}
                  label={area.label}
                  selected={painArea === area.value}
                  onPress={() => setPainArea((value) => (value === area.value ? undefined : area.value))}
                  compact
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Back to Home" onPress={finish} />
      </View>
    </Screen>
  );
}

export function sessionCompletionCopy({
  block,
  lifeGoal,
  completion,
  credited,
  restarted,
  progressionEvidencePolicy,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completion?: TrainingSessionCompletion | null;
  credited: boolean;
  restarted: boolean;
  progressionEvidencePolicy?: TrainingSessionCompletion['progressionEvidencePolicy'];
}) {
  if (credited) {
    const adjusted = progressionEvidencePolicy === 'hold_only';
    return {
      eyebrow: restarted ? 'Restart saved' : 'Session saved',
      title: restarted ? "You're back." : 'Nice work.',
      subtitle: restarted ? "Today's shorter session was saved to your plan." : savedToPlanSubtitle(lifeGoal),
      cardEyebrow: 'Saved',
      cardTitle: restarted ? 'Your plan is moving again.' : 'Your plan moved forward.',
      body: adjusted
        ? 'Hale will keep the next session at this level so it stays comfortable.'
        : "Hale will use today's effort and comfort feedback to choose your next session.",
    };
  }

  const focusEvidence = completion?.focusStimulusEvidence;
  const completedCount = completion?.workEvidence?.completedExerciseCount ?? 0;
  if (focusEvidence && completedCount > 0) {
    const kind = nonCreditWorkKind(focusEvidence.exclusionReason);
    const blockFocusDomain = movementBlockDomainFocus(block);
    const focus = blockFocusDomain ? focusLabel(blockFocusDomain).toLowerCase() : 'balanced';
    const body =
      focusEvidence.exclusionReason === 'missing_stimulus_metadata'
        ? 'Hale saved the session, but could not confirm it was part of your current plan.'
        : `Hale moves the ${focus} plan forward after a planned main exercise is completed.`;
    return {
      eyebrow: 'Session saved',
      title: `${kind} saved.`,
      subtitle: 'This session was saved, but it did not move your main plan forward.',
      cardEyebrow: 'Plan unchanged',
      cardTitle: 'Your main plan is unchanged.',
      body,
    };
  }

  return {
    eyebrow: 'Session ended',
    title: 'No plan credit added.',
    subtitle: 'Nothing was saved to your main plan today.',
    cardEyebrow: 'Try again when ready',
    cardTitle: 'Nothing to fix.',
    body: 'You can start another session when you are ready. Keep support nearby and move comfortably.',
  };
}

function savedToPlanSubtitle(lifeGoal?: LifeGoal | null): string {
  if (!lifeGoal) return 'Today counted toward your 4-week plan.';
  const goal = getLifeGoalDisplayText(lifeGoal);
  return `Today counted toward your goal to ${lowercaseFirst(goal)}.`;
}

function lowercaseFirst(value: string): string {
  return value.length > 0 ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
}

function nonCreditWorkKind(reason: string): string {
  if (reason === 'fallback_only') return 'Fallback work';
  if (reason === 'supporting_and_fallback_only') return 'Supporting work';
  if (reason === 'cross_domain_only') return 'Cross-domain work';
  return 'Supporting work';
}

function focusLabel(domain: MovementBlock['focusDomain']): string {
  if (domain === 'strength_power') return 'Strength';
  if (domain === 'balance') return 'Balance';
  return 'Mobility';
}

export function buildSessionFeedback({
  effort,
  painReported,
  painArea,
  trackingQuality = 'good',
}: {
  effort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  painArea?: PainArea;
  trackingQuality?: TrackingQuality;
}): SessionFeedbackInput {
  return {
    perceivedEffort: effort,
    painReported: painReported ?? false,
    painArea: painReported ? painArea : undefined,
    completed: true,
    trackingQuality,
  };
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function EffortChoice({
  option,
  selected,
  onPress,
}: {
  option: { value: 1 | 2 | 3 | 4 | 5; label: string };
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.effort,
        selected && styles.effortSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${option.value} ${option.label}`}
    >
      <Text style={[styles.effortText, selected && styles.effortTextSelected]}>{option.value}</Text>
      <Text
        style={[styles.effortLabel, selected && styles.effortTextSelected]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

function Choice({
  label,
  selected,
  onPress,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.choice,
        compact && styles.choiceCompact,
        selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: spacing.lg,
  },
  completionSheet: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.panel,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.card,
  },
  sheetHead: {
    gap: spacing.xs,
  },
  sheetEyebrow: {
    ...type.label,
    color: colors.accentDeep,
  },
  sheetTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  sheetBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeading: {
    gap: 2,
  },
  sectionEyebrow: {
    ...type.label,
    color: colors.textTertiary,
  },
  sectionTitle: {
    ...type.cardTitle,
  },
  summaryList: {
    gap: spacing.md,
  },
  summaryBlock: {
    gap: spacing.xs,
  },
  summaryDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  summaryTitle: {
    ...type.bodySmall,
    fontFamily: fonts.sansMedium,
    color: colors.textPrimary,
  },
  summaryLine: {
    ...type.cardBody,
  },
  effortGrid: {
    gap: spacing.sm,
  },
  effortRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  effort: {
    flex: 1,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    backgroundColor: colors.bgBase,
  },
  effortSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  effortText: {
    fontFamily: fonts.sansMedium,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
  },
  effortLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  effortTextSelected: { color: colors.onAccent },
  choiceSegment: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: radius.button,
    backgroundColor: colors.bgBase,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  painAreas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  choice: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    backgroundColor: colors.bgSurface,
  },
  choiceCompact: {
    flexGrow: 1,
    flexBasis: 92,
    minHeight: 42,
  },
  choiceSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: {
    ...type.bodySmall,
    fontFamily: fonts.sansMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  choiceTextSelected: { color: colors.onAccent },
  actions: {
    gap: spacing.md,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
