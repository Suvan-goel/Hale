/**
 * Programme v2 onboarding — ONE config-driven screen for the whole flow
 * (THE app onboarding since promotion, 2026-07-08).
 *
 * The normal path is four top-level stages: Welcome, one personal goal,
 * progressively disclosed Health & Privacy, and Start. The first required
 * health answer carries the on-device-use disclosure. The flow machine owns
 * the conservative defaults for everything deliberately deferred to Settings.
 *
 * Promotion integration Phase 2: restyled to the app's design language —
 * ScreenHeader with eyebrow/progress, rail-accented option cards
 * (LifeGoalSelector pattern), surface panels with hairline borders, the
 * welcome hero, and screen-wise back via the flow machine's undo.
 */

import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { BRAND } from '../brand';
import { OptionCard } from '../components/OptionCard';
import { GhostButton, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import {
  currentOnboardingStep,
  onboardingScreenForStep,
  onboardingMessageContent,
  onboardingQuestionContent,
  type JointFlag,
  type OnboardingQuestionStepId,
  type OnboardingStepId,
  type ProgrammeOnboardingFlowState,
} from '../programme';
import { colors, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const WELCOME_HERO_IMAGE = require('../../assets/images/pearl-welcome-hero-v3.png');

export function ProgrammeOnboardingScreen({
  flowState,
  onSelectOption,
  onSelectMany,
  onSkipQuestion,
  onAcknowledge,
  onComplete,
  onPreviewSession,
  onBack,
  onSignIn,
}: {
  flowState: ProgrammeOnboardingFlowState;
  onSelectOption: (step: OnboardingQuestionStepId, value: string) => void;
  onSelectMany: (step: 'b3_joints', values: readonly JointFlag[]) => void;
  onSkipQuestion: (step: Extract<OnboardingQuestionStepId, 'a1_life_goal' | 'b3_joints'>) => void;
  onAcknowledge: (step: OnboardingStepId) => void;
  /** The final screen records check-up timing and the immediate route together. */
  onComplete: (input: {
    assessmentChoice: 'now';
    action: 'start_first_session';
  }) => void;
  /** Opens a short voice-paced preview without completing onboarding or saving a workout. */
  onPreviewSession: () => void;
  /** Progressive-panel back (flow-machine undo). Hidden on Welcome. */
  onBack: () => void;
  /** Optional returning-user path; guest-first Continue remains primary. */
  onSignIn?: () => void;
}) {
  const responsive = useResponsiveLayout();
  const step = currentOnboardingStep(flowState);
  if (step === 'complete') return null;

  const screen = onboardingScreenForStep(step);
  const answers = flowState.answers;

  const headerBack = screen !== 'welcome' ? onBack : undefined;

  if (screen === 'welcome' || screen === 'heart_advisory') {
    const messageStep: Extract<OnboardingStepId, 'welcome' | 'b1_advisory'> =
      screen === 'welcome' ? 'welcome' : 'b1_advisory';
    const message = onboardingMessageContent(messageStep);
    const isWelcome = messageStep === 'welcome';
    const [subtitle, ...panelLines] = message.body;
    return (
      <Screen contentStyle={styles.screen}>
        <ScreenHeader
          eyebrow={message.eyebrow}
          title={message.title}
          subtitle={subtitle}
          prominentTitle
          onBack={headerBack}
          backAccessibilityLabel="Back to the previous screen"
        />
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
        {panelLines.length > 0 ? (
          <View style={[styles.panel, responsive.isCompactPhone && styles.compactCardPadding]}>
            {panelLines.map((line) => (
              <Text key={line} style={styles.panelBody}>
                {line}
              </Text>
            ))}
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

  if (screen === 'goal') {
    return (
      <SingleQuestion
        step="a1_life_goal"
        selected={answers.lifeGoal}
        onBack={headerBack}
        onSelect={onSelectOption}
        onSkip={onSkipQuestion}
      />
    );
  }

  if (screen === 'health_safety') {
    if (step === 'b3_joints') {
      return (
        <JointComfortQuestion
          onBack={headerBack}
          onSubmit={(values) => onSelectMany('b3_joints', values)}
          onSkip={() => onSkipQuestion('b3_joints')}
        />
      );
    }
    return (
      <SingleQuestion
        step="b1_heart"
        selected={answers.b1Heart}
        onBack={headerBack}
        onSelect={onSelectOption}
        onSkip={onSkipQuestion}
      />
    );
  }

  const finishTitle = 'Your starting check-up is next';
  const finishSubtitle = `Measure Strength and Balance before Week 1, so ${BRAND.appName} can choose the right focus and compare your results later.`;

  return (
    <Screen contentStyle={styles.screen}>
      <ScreenHeader
        eyebrow="Your start"
        title={finishTitle}
        subtitle={finishSubtitle}
        prominentTitle
        onBack={headerBack}
        backAccessibilityLabel="Back to the previous screen"
      />
      <View style={[styles.panel, responsive.isCompactPhone && styles.compactCardPadding]}>
        <Text style={styles.panelBody}>
          {BRAND.appName} plans three voice-guided sessions each week. Two is a successful week.
        </Text>
        <Text style={styles.panelBody}>
          The Movement Check-Up takes about eight minutes, measures Strength and Balance, then offers optional Everyday Clarity. Your 15-minute first session follows an accepted result. It is all processed on this phone and never shows your video.
        </Text>
        <Text style={styles.panelBody}>
          You’ll need a sturdy chair and a little clear space.
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          title="Do my starting check-up"
          onPress={() =>
            onComplete({ assessmentChoice: 'now', action: 'start_first_session' })
          }
        />
        <SecondaryButton
          title="See how a session works"
          onPress={onPreviewSession}
        />
      </View>
    </Screen>
  );
}

function SingleQuestion({
  step,
  selected,
  onBack,
  onSelect,
  onSkip,
}: {
  step: Extract<OnboardingQuestionStepId, 'a1_life_goal' | 'b1_heart'>;
  selected: string | null;
  onBack?: () => void;
  onSelect: (step: OnboardingQuestionStepId, value: string) => void;
  onSkip: (step: Extract<OnboardingQuestionStepId, 'a1_life_goal'>) => void;
}) {
  const responsive = useResponsiveLayout();
  const question = onboardingQuestionContent(step);
  return (
    <Screen contentStyle={styles.screen}>
      <ScreenHeader
        eyebrow={question.eyebrow}
        title={question.question}
        subtitle={question.whyWeAsk}
        prominentTitle
        onBack={onBack}
        backAccessibilityLabel="Back to the previous screen"
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
        {question.skippable && step === 'a1_life_goal' ? (
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

function JointComfortQuestion({
  onBack,
  onSubmit,
  onSkip,
}: {
  onBack?: () => void;
  onSubmit: (values: readonly JointFlag[]) => void;
  onSkip: () => void;
}) {
  const responsive = useResponsiveLayout();
  const question = onboardingQuestionContent('b3_joints');
  const [selected, setSelected] = React.useState<readonly JointFlag[]>([]);
  const jointOptions = question.options.filter(
    (option): option is { value: JointFlag; label: string; microcopy?: string } =>
      option.value !== question.noneValue
  );
  const toggle = (joint: JointFlag) => {
    setSelected((current) =>
      current.includes(joint)
        ? current.filter((item) => item !== joint)
        : [...current, joint]
    );
  };
  return (
    <Screen contentStyle={styles.screen}>
      <ScreenHeader
        eyebrow={question.eyebrow}
        title={question.question}
        subtitle={question.whyWeAsk}
        prominentTitle
        onBack={onBack}
        backAccessibilityLabel="Back to the previous question"
      />
      <View style={styles.options}>
        {jointOptions.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            selected={selected.includes(option.value)}
            onPress={() => toggle(option.value)}
          />
        ))}
      </View>
      <View style={styles.actions}>
        {selected.length > 0 ? (
          <PrimaryButton title="Continue" onPress={() => onSubmit(selected)} />
        ) : null}
        <SecondaryButton title="None of these" onPress={() => onSubmit([])} />
        <GhostButton title={question.skipLabel ?? 'Prefer not to say'} onPress={onSkip} />
      </View>
      {question.note ? (
        <View style={[styles.notePanel, responsive.isCompactPhone && styles.compactCardPadding]}>
          <Text style={styles.noteText}>{question.note}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.pageTop,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
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
  // App-wide flow panel recipe: card radius, hairline, no shadow.
  panel: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  panelBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  notePanel: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  // The on-device-use disclosure is the most trust-sensitive line in the
  // flow, for an audience 45–60: body-size type and primary colour, never
  // caption-grey (2026-07-14 onboarding review).
  noteText: {
    ...type.bodySmall,
    color: colors.textPrimary,
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
