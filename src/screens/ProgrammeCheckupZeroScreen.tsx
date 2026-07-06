/**
 * Check-up #0 host (Option 1 build, acceptance criteria in
 * docs/pre-promotion-checklist.md): brief guided gentle warm-up → the
 * two-protocol battery (one-leg balance both sides, then the 30-second chair
 * rise — max effort LAST), run by the real unified check-up machinery with a
 * batterySequence derived from the pinned CHECKUP_ZERO_PROTOCOL_SEQUENCE.
 *
 * WARM-UP PLACEMENT (stated choice, per the ruling's allowance): HOST-LEVEL,
 * before the coordinator starts. It is a non-measurement stage by
 * construction — no camera, no evidence, no scores, skippable without
 * consequence — and the coordinator's machine stays purely for measurement.
 *
 * Measurement semantics are untouched: results exist only as the CheckUp the
 * unified screen emits; the caller feeds it through assessmentInputsFromCheckUp
 * into applyAssessmentPlacement. Abandonment is penalty-free: onCancel emits
 * nothing, applies nothing, burns no once-only surface.
 */

import * as React from 'react';
import { View } from 'react-native';

import { Button, Screen, Typography } from '../components/ui';
import { checkupZeroBatterySequence } from '../programme';
import { createMovementProfileV2InternalFlow } from '../movementProfileV2/internalCheckupFlow';
import type { CheckUp } from '../checkup';
import { colors, spacing } from '../theme';
import { MovementProfileV2UnifiedCheckUpScreen } from './MovementProfileV2UnifiedCheckUpScreen';

const WARM_UP_SECONDS = 45;

export function ProgrammeCheckupZeroScreen({
  onComplete,
  onCancel,
  voiceId,
}: {
  onComplete: (checkUp: CheckUp) => void;
  onCancel: () => void;
  voiceId?: string;
}) {
  const [phase, setPhase] = React.useState<'intro' | 'warmup' | 'battery'>('intro');
  const [warmupRemaining, setWarmupRemaining] = React.useState(WARM_UP_SECONDS);
  const startedAtRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (phase !== 'warmup') return;
    const interval = setInterval(() => {
      setWarmupRemaining((remaining) => {
        if (remaining <= 1) {
          clearInterval(interval);
          setPhase('battery');
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === 'intro') {
    return (
      <Screen>
        <View style={{ flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: 'center' }}>
          <Typography variant="h1">Two minutes of moving</Typography>
          <Typography variant="body" style={{ color: colors.textSecondary }}>
            A gentle warm-up, a balance hold on each leg, then thirty seconds of chair stands. That’s
            the whole thing.
          </Typography>
          <Typography variant="body" style={{ color: colors.textSecondary }}>
            No one sees this but you — it’s processed on your phone and never leaves it.
          </Typography>
          <Button title="Start with the warm-up" onPress={() => setPhase('warmup')} />
          <Button title="Not now" variant="ghost" onPress={onCancel} />
        </View>
      </Screen>
    );
  }

  if (phase === 'warmup') {
    return (
      <Screen>
        <View style={{ flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: 'center' }}>
          <Typography variant="h2">Easy does it</Typography>
          <Typography variant="body" style={{ color: colors.textSecondary }}>
            March gently on the spot and roll your shoulders. Add a few easy arm reaches when you
            feel like it.
          </Typography>
          <Typography variant="h1">{warmupRemaining}s</Typography>
          <Button title="I’m warm — let’s go" variant="secondary" onPress={() => setPhase('battery')} />
          <Button title="Stop for now" variant="ghost" onPress={onCancel} />
        </View>
      </Screen>
    );
  }

  if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
  return (
    <MovementProfileV2UnifiedCheckUpScreen
      startedAt={startedAtRef.current}
      sourceType="manual_extra_v2"
      initialFlow={{
        ...createMovementProfileV2InternalFlow({
          startedAt: startedAtRef.current,
          batterySequence: checkupZeroBatterySequence(),
        }),
        sourceType: 'manual_extra_v2',
      }}
      voiceId={voiceId}
      onComplete={({ checkUp }) => onComplete(checkUp)}
      onCancel={onCancel}
    />
  );
}
