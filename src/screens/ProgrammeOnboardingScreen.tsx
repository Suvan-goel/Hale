/**
 * Programme v2 onboarding — ONE config-driven screen for the whole flow
 * (THE app onboarding since promotion, 2026-07-08).
 *
 * Seven user-visible screens preserve every answer that changes safety,
 * starting placement, check-up access, or meaningful context. Related answer
 * fields share a screen; the flow machine still owns their conservative
 * defaults and conditional Gentle Start branch.
 *
 * Promotion integration Phase 2: restyled to the app's design language —
 * ScreenHeader with eyebrow/progress, rail-accented option cards
 * (LifeGoalSelector pattern), surface panels with hairline borders, the
 * welcome hero, and screen-wise back via the flow machine's undo.
 */

import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { BRAND } from '../brand';
import { BackArrowButton } from '../components/BackArrowButton';
import { OptionCard } from '../components/OptionCard';
import { GhostButton, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import {
  currentOnboardingStep,
  gentleStartFromAnswers,
  onboardingScreenForStep,
  onboardingMessageContent,
  onboardingQuestionContent,
  type JointFlag,
  type OnboardingQuestionStepId,
  type OnboardingStepId,
  type ProgrammeOnboardingFlowState,
} from '../programme';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const WELCOME_HERO_IMAGE = require('../../assets/images/pearl-welcome-hero-v3.png');

export function ProgrammeOnboardingScreen({
  flowState,
  onSelectOption,
  onSelectMany,
  onSkipQuestion,
  onAcknowledge,
  onComplete,
  onBack,
  onSignIn,
}: {
  flowState: ProgrammeOnboardingFlowState;
  /** Single-select answer tap (value from the content layer's options). */
  onSelectOption: (step: OnboardingQuestionStepId, value: string) => void;
  /** Multi-select answer (the grouped Movement Comfort screen). */
  onSelectMany: (step: OnboardingQuestionStepId, values: readonly string[]) => void;
  onSkipQuestion: (step: OnboardingQuestionStepId) => void;
  onAcknowledge: (step: OnboardingStepId) => void;
  /** The final screen records check-up timing and the immediate route together. */
  onComplete: (input: {
    assessmentChoice: 'now' | 'after_first_workout' | 'skip';
    action: 'start_first_session' | 'schedule';
  }) => void;
  /** Screen-wise back (flow-machine undo). Hidden on Welcome. */
  onBack?: () => void;
  /** Optional returning-user path; guest-first Continue remains primary. */
  onSignIn?: () => void;
}) {
  const responsive = useResponsiveLayout();
  const step = currentOnboardingStep(flowState);
  if (step === 'complete') return null;

  const screen = onboardingScreenForStep(step);
  const answers = flowState.answers;

  const showBack = screen !== 'welcome' && !!onBack;
  const backRow = showBack ? (
    <View style={styles.backRow}>
      <BackArrowButton accessibilityLabel="Back to the previous screen" onPress={onBack} />
    </View>
  ) : null;

  if (screen === 'welcome' || screen === 'heart_advisory') {
    const messageStep: Extract<OnboardingStepId, 'welcome' | 'b1_advisory'> =
      screen === 'welcome' ? 'welcome' : 'b1_advisory';
    const message = onboardingMessageContent(messageStep);
    const isWelcome = messageStep === 'welcome';
    const [subtitle, ...panelLines] = message.body;
    return (
      <Screen contentStyle={styles.screen}>
        {backRow}
        <ScreenHeader eyebrow={message.eyebrow} title={message.title} subtitle={subtitle} />
        {isWelcome ? (
          <View style={styles.heroImageCard}>
            <Image
              source={WELCOME_HERO_IMAGE}
              style={styles.heroImage}
              resizeMode="contain"
              accessible={false}
              accessibilityIgnoresInvertColors
            />
          </View>
        ) : null}
        {panelLines.length > 0 || message.facts ? (
          <View style={[styles.panel, responsive.isCompactPhone && styles.compactCardPadding]}>
            {panelLines.map((line) => (
              <Text key={line} style={styles.panelBody}>
                {line}
              </Text>
            ))}
            {message.facts ? (
              <View style={styles.factsRow}>
                {message.facts.map((fact) => (
                  <View key={fact.detail} style={styles.fact}>
                    <Text
                      style={styles.factValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.82}
                    >
                      {fact.value}
                    </Text>
                    <Text style={styles.factDetail}>{fact.detail}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={styles.actions}>
          <PrimaryButton
            title={message.continueLabel}
            onPress={() => onAcknowledge(messageStep)}
          />
          {isWelcome && onSignIn ? (
            <GhostButton
              title={`Already have a ${BRAND.appName} profile? Sign in`}
              onPress={onSignIn}
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  if (screen === 'about_you') {
    return (
      <Screen contentStyle={styles.screen}>
        {backRow}
        <ScreenHeader
          eyebrow="About you"
          title="A little about you"
          subtitle="These answers set your starting levels and keep your experience relevant to you."
        />
        <QuestionGroup
          step="a1_life_goal"
          selected={answers.lifeGoal}
          onSelect={onSelectOption}
          onSkip={onSkipQuestion}
        />
        <QuestionGroup
          step="a2_menopause_journey"
          selected={answers.menopauseStage}
          onSelect={onSelectOption}
          onSkip={onSkipQuestion}
        />
        <QuestionGroup
          step="a3_activity"
          selected={answers.activityLevel}
          onSelect={onSelectOption}
          onSkip={onSkipQuestion}
        />
      </Screen>
    );
  }

  if (screen === 'health_consent' || screen === 'heart_safety') {
    const questionStep: Extract<OnboardingQuestionStepId, 'consent_health' | 'b1_heart'> =
      screen === 'health_consent' ? 'consent_health' : 'b1_heart';
    return (
      <SingleQuestion
        step={questionStep}
        selected={questionStep === 'consent_health' ? answers.consent : answers.b1Heart}
        backRow={backRow}
        onSelect={onSelectOption}
        onSkip={onSkipQuestion}
      />
    );
  }

  if (screen === 'movement_comfort') {
    const joints = answers.b3Joints;
    const toggleJoint = (value: string) => {
      if (value === 'none') {
        onSelectMany('b3_joints', []);
        return;
      }
      const current = joints ?? [];
      const joint = value as JointFlag;
      onSelectMany(
        'b3_joints',
        current.includes(joint)
          ? current.filter((item) => item !== joint)
          : [...current, joint]
      );
    };
    return (
      <Screen contentStyle={styles.screen}>
        {backRow}
        <ScreenHeader
          eyebrow="Health check"
          title="What should feel gentler?"
          subtitle="These answers change starting levels, impact, and support. You can still stop or skip any move."
        />
        <QuestionGroup
          step="b3_joints"
          selectedMany={joints ?? []}
          explicitEmpty={joints !== null && joints.length === 0}
          onSelectMany={toggleJoint}
        />
        <QuestionGroup
          step="b4_pelvic"
          selected={answers.b4Pelvic}
          onSelect={onSelectOption}
          onSkip={onSkipQuestion}
        />
        <QuestionGroup
          step="b5_balance"
          selected={answers.b5Balance}
          onSelect={onSelectOption}
          onSkip={onSkipQuestion}
        />
      </Screen>
    );
  }

  if (screen === 'setup') {
    return (
      <Screen contentStyle={styles.screen}>
        {backRow}
        <ScreenHeader
          eyebrow="Your setup"
          title="Your workout space"
          subtitle="We only use a step when the setup is stable, and we can leave stomping out."
        />
        <QuestionGroup
          step="c1_stairs"
          selected={answers.c1Stairs}
          onSelect={onSelectOption}
          onSkip={onSkipQuestion}
        />
        <QuestionGroup
          step="c2_quiet"
          selected={answers.c2Quiet}
          onSelect={onSelectOption}
          onSkip={onSkipQuestion}
        />
      </Screen>
    );
  }

  const gentleStart = gentleStartFromAnswers(answers);
  const checkUpAvailable = answers.consent === 'agree' && !gentleStart;
  const finishTitle = gentleStart
    ? 'Your gentle start is ready'
    : answers.consent === 'decline'
      ? 'Your private starter plan is ready'
      : 'How would you like to begin?';
  const finishSubtitle = gentleStart
    ? 'Your first sessions begin at the easiest levels. The Movement Check-Up stays off while Gentle Start is active.'
    : answers.consent === 'decline'
      ? 'We will not use health answers. Your sessions start conservatively, without a Movement Check-Up.'
      : 'Choose the start that feels right. You can stop or change your mind at any time.';

  return (
    <Screen contentStyle={styles.screen}>
      {backRow}
      <ScreenHeader eyebrow="Your start" title={finishTitle} subtitle={finishSubtitle} />
      <View style={[styles.panel, responsive.isCompactPhone && styles.compactCardPadding]}>
        <Text style={styles.panelBody}>
          Three sessions are planned each week, and two is enough. Your first session is about 15 minutes and voice-guided.
        </Text>
        {checkUpAvailable ? (
          <Text style={styles.panelBody}>
            The private check-up measures Strength and Balance, then offers Everyday Clarity. It is processed on this phone and never shows your video.
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {checkUpAvailable ? (
          <>
            <PrimaryButton
              title="Check my movement, then start"
              onPress={() =>
                onComplete({ assessmentChoice: 'now', action: 'start_first_session' })
              }
            />
            <SecondaryButton
              title="Start with one gentle session"
              onPress={() =>
                onComplete({
                  assessmentChoice: 'after_first_workout',
                  action: 'start_first_session',
                })
              }
            />
          </>
        ) : (
          <PrimaryButton
            title="Start my first session"
            onPress={() =>
              onComplete({ assessmentChoice: 'skip', action: 'start_first_session' })
            }
          />
        )}
        <GhostButton
          title="Go to Home for now"
          onPress={() =>
            onComplete({
              assessmentChoice: checkUpAvailable ? 'after_first_workout' : 'skip',
              action: 'schedule',
            })
          }
        />
      </View>
    </Screen>
  );
}

function SingleQuestion({
  step,
  selected,
  backRow,
  onSelect,
  onSkip,
}: {
  step: Extract<OnboardingQuestionStepId, 'consent_health' | 'b1_heart'>;
  selected: string | null;
  backRow: React.ReactNode;
  onSelect: (step: OnboardingQuestionStepId, value: string) => void;
  onSkip: (step: OnboardingQuestionStepId) => void;
}) {
  const responsive = useResponsiveLayout();
  const question = onboardingQuestionContent(step);
  return (
    <Screen contentStyle={styles.screen}>
      {backRow}
      <ScreenHeader
        eyebrow={question.eyebrow}
        title={question.question}
        subtitle={question.whyWeAsk}
      />
      {question.note ? (
        <View style={[styles.notePanel, responsive.isCompactPhone && styles.compactCardPadding]}>
          <Text style={styles.noteText}>{question.note}</Text>
        </View>
      ) : null}
      <View style={styles.options}>
        {question.options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            microcopy={option.microcopy}
            selected={selected === option.value}
            onPress={() => onSelect(step, option.value)}
          />
        ))}
        {question.skippable ? (
          <OptionCard
            label={question.skipLabel ?? 'Skip'}
            selected={selected === 'skipped'}
            onPress={() => onSkip(step)}
          />
        ) : null}
      </View>
    </Screen>
  );
}

function QuestionGroup({
  step,
  selected,
  selectedMany,
  explicitEmpty = false,
  onSelect,
  onSelectMany,
  onSkip,
}: {
  step: OnboardingQuestionStepId;
  selected?: string | null;
  selectedMany?: readonly string[];
  explicitEmpty?: boolean;
  onSelect?: (step: OnboardingQuestionStepId, value: string) => void;
  onSelectMany?: (value: string) => void;
  onSkip?: (step: OnboardingQuestionStepId) => void;
}) {
  const responsive = useResponsiveLayout();
  const question = onboardingQuestionContent(step);
  return (
    <View style={[styles.questionGroup, responsive.isCompactPhone && styles.compactCardPadding]}>
      <View style={styles.questionGroupHeader}>
        <Text style={styles.questionGroupTitle}>{question.question}</Text>
        <Text style={styles.questionGroupWhy}>{question.whyWeAsk}</Text>
        {question.note ? <Text style={styles.questionGroupNote}>{question.note}</Text> : null}
      </View>
      <View style={styles.options}>
        {question.options.map((option) => {
          const selectedOption = question.multiSelect
            ? option.value === question.noneValue
              ? explicitEmpty
              : selectedMany?.includes(option.value) === true
            : selected === option.value;
          return (
            <OptionCard
              key={option.value}
              label={option.label}
              microcopy={option.microcopy}
              selected={selectedOption}
              onPress={() =>
                question.multiSelect
                  ? onSelectMany?.(option.value)
                  : onSelect?.(step, option.value)
              }
            />
          );
        })}
        {question.skippable ? (
          <OptionCard
            label={question.skipLabel ?? 'Skip'}
            selected={selected === 'skipped'}
            onPress={() => onSkip?.(step)}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.pageTop,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  panel: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.soft,
  },
  panelBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  factsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  fact: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  factValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  factDetail: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  notePanel: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  noteText: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  questionGroup: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.soft,
  },
  questionGroupHeader: {
    gap: spacing.sm,
  },
  questionGroupTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 21,
    lineHeight: 27,
    color: colors.textPrimary,
  },
  questionGroupWhy: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  questionGroupNote: {
    ...type.cardCaption,
    color: colors.textSecondary,
    paddingTop: spacing.xs,
  },
  options: {
    gap: spacing.md,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  actions: {
    gap: spacing.md,
  },
});
