import * as React from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';

import {
  type FluencyCategoryId,
  type FluencyResult,
} from '../checkup';
import { countValidFluencyWords } from '../checkup/fluencyCounting';
import { fluencyResultFromOutcome } from '../checkup/fluencyOutcome';
import { FLUENCY_CATEGORY_PROMPTS } from '../checkup/fluencyRotation';
import type { FluencyTranscriber } from '../voice/fluencyTranscriber';
import { Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { colors, spacing, type } from '../theme';

/**
 * The 60-second fluency task (FL2). Phone in hand, camera long gone. The
 * transcription window runs exactly once through the sanitized seam with the
 * pure counter — words die inside that call; this screen only ever sees the
 * outcome enum/count. "I'm done" ends the window early via the seam's stop();
 * backgrounding invalidates honestly; the countdown is display-only (the
 * window's clock is the engine's). No-stall: the window resolves by 60 s by
 * contract, and delivery is idempotent.
 */
export function FluencyTaskScreen({
  categoryId,
  transcriber,
  onDone,
}: {
  categoryId: FluencyCategoryId;
  transcriber: FluencyTranscriber;
  onDone: (result: FluencyResult) => void;
}) {
  const [secondsLeft, setSecondsLeft] = React.useState(60);
  const doneRef = React.useRef(false);
  const backgroundedRef = React.useRef(false);

  const deliver = React.useCallback(
    (result: FluencyResult) => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone(result);
    },
    [onDone]
  );

  React.useEffect(() => {
    let active = true;
    transcriber
      .countWords(60, countValidFluencyWords)
      .then((outcome) => {
        if (!active) return;
        deliver(
          fluencyResultFromOutcome({ outcome, categoryId, backgrounded: backgroundedRef.current })
        );
      })
      .catch(() => {
        // The sanitized seam never rejects; this is belt-and-braces.
        if (active) {
          deliver(
            fluencyResultFromOutcome({
              outcome: { ok: false, reason: 'recognition_failed' },
              categoryId,
              backgrounded: backgroundedRef.current,
            })
          );
        }
      });
    return () => {
      active = false;
    };
  }, [categoryId, deliver, transcriber]);

  React.useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && !doneRef.current) {
        backgroundedRef.current = true;
        transcriber.stop?.();
      }
    });
    return () => subscription.remove();
  }, [transcriber]);

  return (
    <Screen contentStyle={styles.content}>
      <ScreenHeader
        eyebrow="Word-finding"
        title={FLUENCY_CATEGORY_PROMPTS[categoryId]}
        subtitle="Out loud, at your own pace. Pauses to think are fine — keep going when the next one comes."
      />
      <View style={styles.timerBlock}>
        <Text style={styles.timer}>{secondsLeft}s</Text>
      </View>
      <SecondaryButton title="I'm done" onPress={() => transcriber.stop?.()} />
      <Text style={styles.gentle}>
        Counted on your phone; the words are never kept. Only the count is saved.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  timerBlock: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  timer: {
    ...type.display,
  },
  gentle: {
    ...type.caption,
    color: colors.textSecondary,
  },
});
