/**
 * On-screen pre-flight prompts. Stage 1 renders text; the same prompt keys
 * map to pre-generated voice lines in a later stage (audio-first product law
 * — runtime TTS is banned from the session path).
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, type } from '../theme';
import type { PreflightPrompt } from './preflight';

const PROMPT_TEXT: Record<PreflightPrompt, string> = {
  'step-into-frame': 'Step into view of the camera',
  'center-yourself': 'Move toward the middle of the frame',
  'step-back': 'Take a step back',
  'step-closer': 'Take a step closer',
  'hold-still': 'Hold still…',
  'turn-on-light': 'Please turn on the main light',
  ready: 'You’re framed',
};

interface Props {
  prompt: PreflightPrompt;
  /** 0..1 while sampling; renders a subtle progress hint on "hold still". */
  sampleProgress: number;
}

export function PreflightBanner({ prompt, sampleProgress }: Props) {
  const showProgress = prompt === 'hold-still' && sampleProgress > 0;
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text}>
        {PROMPT_TEXT[prompt]}
        {showProgress ? ` ${'·'.repeat(1 + Math.floor(sampleProgress * 5))}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.huge,
    left: spacing.xxl,
    right: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    ...shadow.soft,
  },
  text: {
    ...type.bodySmall,
    color: colors.accentDeep,
    textAlign: 'center',
  },
});
