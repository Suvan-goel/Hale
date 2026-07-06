/**
 * Programme v2 onboarding — ONE config-driven screen for the whole flow
 * (flag-gated: mounts only under EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2).
 *
 * Renders whatever step the flow machine says is current, entirely from the
 * content layer: one question per screen, all tappable, no typing, every
 * screen shows its one-line "why we ask", Stage B shows progress dots, and
 * skippable questions carry an explicit skip affordance whose conservative
 * routing lives in the flow machine — never here. No copy in this file.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Screen, Typography } from '../components/ui';
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
import { colors, radius, spacing } from '../theme';

export function ProgrammeOnboardingScreen({
  flowState,
  onSelectOption,
  onSelectMany,
  onSkipQuestion,
  onAcknowledge,
  onComplete,
  onSecondaryAction,
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
}) {
  const step = currentOnboardingStep(flowState);
  const [multiSelection, setMultiSelection] = React.useState<readonly string[]>([]);
  const stepRef = React.useRef<OnboardingStepId | 'complete'>(step);
  if (stepRef.current !== step) {
    stepRef.current = step;
    if (multiSelection.length > 0) setMultiSelection([]);
  }

  if (step === 'complete') return null;

  if (!isOnboardingQuestionStep(step)) {
    const message = onboardingMessageContent(step);
    const isFinalCta = step === 'expectation_cta';
    return (
      <Screen>
        <View style={styles.container}>
          <Typography variant="h1">{message.title}</Typography>
          {message.body.map((line) => (
            <Typography key={line} variant="body" style={styles.bodyLine}>
              {line}
            </Typography>
          ))}
          <View style={styles.footer}>
            <Button
              title={message.continueLabel}
              onPress={() => (isFinalCta ? onComplete('start_first_session') : onAcknowledge(step))}
            />
            {isFinalCta && message.secondaryLabel ? (
              <Button
                title={message.secondaryLabel}
                variant="ghost"
                onPress={() => (onSecondaryAction ? onSecondaryAction() : onComplete('schedule'))}
              />
            ) : null}
          </View>
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
    <Screen>
      <View style={styles.container}>
        {question.stageBIndex ? (
          <View style={styles.dotsRow} accessibilityLabel={`Question ${question.stageBIndex} of ${STAGE_B_QUESTION_COUNT}`}>
            {Array.from({ length: STAGE_B_QUESTION_COUNT }, (_, i) => (
              <View
                key={i}
                style={[styles.dot, i < (question.stageBIndex ?? 0) ? styles.dotDone : null]}
              />
            ))}
          </View>
        ) : null}
        <Typography variant="h2">{question.question}</Typography>
        {question.note ? (
          <Typography variant="body" style={styles.note}>
            {question.note}
          </Typography>
        ) : null}
        <View style={styles.options}>
          {question.options.map((option) => {
            const selected = question.multiSelect && multiSelection.includes(option.value);
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={selected ? { selected } : undefined}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
                onPress={() =>
                  question.multiSelect ? toggleMulti(option.value) : onSelectOption(step, option.value)
                }
              >
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {option.microcopy ? <Text style={styles.optionMicrocopy}>{option.microcopy}</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.footer}>
          {question.multiSelect ? (
            <Button
              title="Continue"
              disabled={multiSelection.length === 0}
              onPress={() => onSelectMany(step, multiSelection)}
            />
          ) : null}
          {question.skippable ? (
            <Button
              title={question.skipLabel ?? 'Skip'}
              variant="ghost"
              onPress={() => onSkipQuestion(step)}
            />
          ) : null}
          <Typography variant="caption" style={styles.whyWeAsk}>
            {question.whyWeAsk}
          </Typography>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  bodyLine: {
    color: colors.textSecondary,
  },
  note: {
    color: colors.textSecondary,
  },
  options: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  optionLabelSelected: {
    fontWeight: '600',
  },
  optionMicrocopy: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: 'auto',
    gap: spacing.sm,
  },
  whyWeAsk: {
    color: colors.textTertiary,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotDone: {
    backgroundColor: colors.accent,
  },
});
