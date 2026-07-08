/**
 * Programme v2 onboarding — ONE config-driven screen for the whole flow
 * (THE app onboarding since promotion, 2026-07-08).
 *
 * Renders whatever step the flow machine says is current, entirely from the
 * content layer: one question per screen, all tappable, no typing, every
 * screen shows its one-line "why we ask", Stage B shows progress via the
 * shared StepProgress header, and skippable questions carry an explicit skip
 * affordance whose conservative routing lives in the flow machine — never
 * here. No copy in this file.
 *
 * Promotion integration Phase 2: restyled to the app's design language —
 * ScreenHeader with eyebrow/progress, rail-accented option cards
 * (LifeGoalSelector pattern), surface panels with hairline borders, the
 * welcome hero, and step-wise back via the flow machine's undo. Single-select
 * questions stay one-tap-to-advance: the Stage B copy promises "four taps,
 * about 30 seconds", so no Continue button is added to single selects.
 */

import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { OptionCard } from '../components/OptionCard';
import { GhostButton, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import {
  STAGE_B_QUESTION_COUNT,
  currentOnboardingStep,
  isOnboardingQuestionStep,
  onboardingMessageContent,
  onboardingQuestionContent,
  type OnboardingQuestionStepId,
  type OnboardingStepId,
  type ProgrammeOnboardingFlowState,
} from '../programme';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const WELCOME_HERO_IMAGE = require('../../assets/images/hale-welcome-hero-v3.png');

export function ProgrammeOnboardingScreen({
  flowState,
  onSelectOption,
  onSelectMany,
  onSkipQuestion,
  onAcknowledge,
  onComplete,
  onSecondaryAction,
  onBack,
}: {
  flowState: ProgrammeOnboardingFlowState;
  /** Single-select answer tap (value from the content layer's options). */
  onSelectOption: (step: OnboardingQuestionStepId, value: string) => void;
  /** Multi-select continue (b3 joints, d1 days). */
  onSelectMany: (step: OnboardingQuestionStepId, values: readonly string[]) => void;
  onSkipQuestion: (step: OnboardingQuestionStepId) => void;
  onAcknowledge: (step: OnboardingStepId) => void;
  /** Fired when the machine reports 'complete' and the final CTA is tapped. */
  onComplete: (action: 'start_first_session' | 'schedule') => void;
  onSecondaryAction?: () => void;
  /** Step-wise back (flow-machine undo). Hidden on the first step. */
  onBack?: () => void;
}) {
  const responsive = useResponsiveLayout();
  const step = currentOnboardingStep(flowState);
  const [multiSelection, setMultiSelection] = React.useState<readonly string[]>([]);
  const stepRef = React.useRef<OnboardingStepId | 'complete'>(step);
  if (stepRef.current !== step) {
    stepRef.current = step;
    if (multiSelection.length > 0) setMultiSelection([]);
  }

  if (step === 'complete') return null;

  const showBack = step !== 'welcome' && !!onBack;
  const backRow = showBack ? (
    <View style={styles.backRow}>
      <BackArrowButton accessibilityLabel="Back to the previous question" onPress={onBack} />
    </View>
  ) : null;

  if (!isOnboardingQuestionStep(step)) {
    const message = onboardingMessageContent(step);
    const isWelcome = step === 'welcome';
    const isFinalCta = step === 'expectation_cta';
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
            onPress={() => (isFinalCta ? onComplete('start_first_session') : onAcknowledge(step))}
          />
          {isFinalCta && message.secondaryLabel ? (
            <SecondaryButton
              title={message.secondaryLabel}
              onPress={() => (onSecondaryAction ? onSecondaryAction() : onComplete('schedule'))}
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  const question = onboardingQuestionContent(step);
  const toggleMulti = (value: string) => {
    setMultiSelection((current) => {
      if (question.noneValue && value === question.noneValue) return [value];
      const withoutNone = current.filter((v) => v !== question.noneValue);
      return withoutNone.includes(value)
        ? withoutNone.filter((v) => v !== value)
        : [...withoutNone, value];
    });
  };

  return (
    <Screen contentStyle={styles.screen}>
      {backRow}
      <ScreenHeader
        progress={
          question.stageBIndex
            ? { step: question.stageBIndex, total: STAGE_B_QUESTION_COUNT }
            : undefined
        }
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
        {question.options.map((option) => {
          const selected = !!question.multiSelect && multiSelection.includes(option.value);
          return (
            <OptionCard
              key={option.value}
              label={option.label}
              microcopy={option.microcopy}
              selected={selected}
              onPress={() =>
                question.multiSelect ? toggleMulti(option.value) : onSelectOption(step, option.value)
              }
            />
          );
        })}
      </View>
      <View style={styles.actions}>
        {question.multiSelect ? (
          <PrimaryButton
            title="Continue"
            disabled={multiSelection.length === 0}
            onPress={() => onSelectMany(step, multiSelection)}
          />
        ) : null}
        {question.skippable ? (
          <GhostButton title={question.skipLabel ?? 'Skip'} onPress={() => onSkipQuestion(step)} />
        ) : null}
      </View>
    </Screen>
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
    boxShadow: '0 10px 26px rgba(17,20,18,0.032)',
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
    backgroundColor: colors.bgBase,
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
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
