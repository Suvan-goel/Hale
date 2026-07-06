/**
 * Programme v2 session runner (flag-gated dev shell) — a deliberately minimal
 * tap-driven walk through a generated plan: overview → prep → each exercise
 * (log or skip) → finisher → effort check-in.
 *
 * Data honesty (C10/N5): "Log" confirms the plan's prescribed rep target as
 * REPORTED, adjustable with the stepper — nothing here is measured. The
 * activation event fires via onStart at the moment she begins (conformance
 * Q4: started, not merely generated); voice guidance arrives when the
 * bundled audio for programme exercises is generated (founder-owned step).
 *
 * Copy here is placeholder pending the brand-voice pass; the effort question
 * uses the existing RPE 1–5 modality (C9).
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Screen, Typography } from '../components/ui';
import type {
  ProgrammeSessionPlan,
  ProgrammeSessionResults,
  SessionRpe,
} from '../programme';
import { programmeDisplayName } from '../programme';
import { colors, radius, spacing } from '../theme';

const RPE_OPTIONS: readonly { value: SessionRpe; label: string }[] = [
  { value: 1, label: 'Easy — I had lots more in me' },
  { value: 2, label: 'Fairly easy' },
  { value: 3, label: 'Worked, with a few left in the tank' },
  { value: 4, label: 'Hard, but a couple left' },
  { value: 5, label: 'Nothing left' },
];

type RunnerPhase = 'overview' | 'prep' | 'main' | 'finisher' | 'effort';

export function ProgrammeSessionScreen({
  plan,
  onStart,
  onFinish,
}: {
  plan: ProgrammeSessionPlan;
  /** Fired exactly once, when she actually begins (the activation moment). */
  onStart: () => void;
  onFinish: (results: ProgrammeSessionResults, rpe: SessionRpe | null) => void;
}) {
  const [phase, setPhase] = React.useState<RunnerPhase>('overview');
  const [exerciseIndex, setExerciseIndex] = React.useState(0);
  const [adjust, setAdjust] = React.useState(0);
  const [prepCompleted, setPrepCompleted] = React.useState(false);
  const [finisherCompleted, setFinisherCompleted] = React.useState(false);
  const outcomesRef = React.useRef<ProgrammeSessionResults['outcomes'][number][]>([]);

  const finish = (rpe: SessionRpe | null) => {
    onFinish(
      {
        outcomes: outcomesRef.current,
        prepCompleted,
        finisherCompleted,
        completedAtIso: new Date().toISOString(),
      },
      rpe
    );
  };

  if (phase === 'overview') {
    return (
      <Screen>
        <View style={styles.container}>
          <Typography variant="h1">Your session</Typography>
          <Typography variant="body" style={styles.muted}>
            About {Math.round(plan.estimatedMinutes)} minutes. Warm-up, {plan.main.length} movements,
            power finisher.
          </Typography>
          {plan.main.map((exercise) => (
            <View key={exercise.exerciseId} style={styles.row}>
              <Text style={styles.rowTitle}>{exercise.displayName}</Text>
              <Text style={styles.rowMeta}>
                {exercise.sets} × {exercise.repTargetPerSet}
                {exercise.scheme.kind === 'seconds' || exercise.scheme.kind === 'seconds_per_side'
                  ? ' s'
                  : ''}
              </Text>
            </View>
          ))}
          <View style={styles.footer}>
            <Button
              title="Begin"
              onPress={() => {
                onStart();
                setPhase('prep');
              }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  if (phase === 'prep') {
    return (
      <Screen>
        <View style={styles.container}>
          <Typography variant="h2">Warm-up</Typography>
          {plan.prep.drillIds.map((id) => (
            <View key={id} style={styles.row}>
              <Text style={styles.rowTitle}>{programmeDisplayName(id)}</Text>
            </View>
          ))}
          <Typography variant="body" style={styles.muted}>
            Soft knees, easy pace — about {plan.prep.minutes} minutes.
          </Typography>
          <View style={styles.footer}>
            <Button
              title="Warm-up done"
              onPress={() => {
                setPrepCompleted(true);
                setPhase('main');
              }}
            />
            <Button title="Skip warm-up" variant="ghost" onPress={() => setPhase('main')} />
          </View>
        </View>
      </Screen>
    );
  }

  if (phase === 'main') {
    const exercise = plan.main[exerciseIndex];
    const reported = Math.max(0, exercise.repTargetPerSet + adjust);
    const unit =
      exercise.scheme.kind === 'seconds' || exercise.scheme.kind === 'seconds_per_side'
        ? 'seconds'
        : exercise.scheme.kind === 'reps_per_side'
          ? 'each side'
          : 'reps';
    const advance = (logged: boolean) => {
      if (logged) {
        outcomesRef.current.push({
          pattern: exercise.pattern,
          levelPerformed: exercise.level,
          sets: Array.from({ length: exercise.sets }, () => ({ achieved: reported })),
          effort: null, // filled from the session RPE by the caller (C9)
          painFlag: false,
          performedAtIso: new Date().toISOString(),
        });
      }
      setAdjust(0);
      if (exerciseIndex + 1 < plan.main.length) {
        setExerciseIndex(exerciseIndex + 1);
      } else {
        setPhase('finisher');
      }
    };

    return (
      <Screen>
        <View style={styles.container}>
          <Typography variant="caption" style={styles.muted}>
            {exerciseIndex + 1} of {plan.main.length}
          </Typography>
          <Typography variant="h2">{exercise.displayName}</Typography>
          <Typography variant="body" style={styles.muted}>
            {exercise.sets} sets. Aim for about {reported} {unit}, stopping with a couple left in the
            tank.
          </Typography>
          {exercise.useSupportVariant ? (
            <Typography variant="body" style={styles.muted}>
              Keep fingertips on a wall or chair for support.
            </Typography>
          ) : null}
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepperButton} onPress={() => setAdjust(adjust - 1)}>
              <Text style={styles.stepperText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{reported}</Text>
            <Pressable style={styles.stepperButton} onPress={() => setAdjust(adjust + 1)}>
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
          <View style={styles.footer}>
            <Button title="Done — log it" onPress={() => advance(true)} />
            <Button title="Skip this one" variant="ghost" onPress={() => advance(false)} />
          </View>
        </View>
      </Screen>
    );
  }

  if (phase === 'finisher') {
    return (
      <Screen>
        <View style={styles.container}>
          <Typography variant="h2">Power finisher</Typography>
          {plan.finisher.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowTitle}>{item.displayName}</Text>
              {item.contacts ? <Text style={styles.rowMeta}>{item.contacts} contacts</Text> : null}
            </View>
          ))}
          <View style={styles.footer}>
            <Button
              title="Finisher done"
              onPress={() => {
                setFinisherCompleted(true);
                setPhase('effort');
              }}
            />
            <Button title="Skip finisher" variant="ghost" onPress={() => setPhase('effort')} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Typography variant="h2">How did that feel?</Typography>
        <Typography variant="body" style={styles.muted}>
          Could you have done more?
        </Typography>
        <View style={styles.options}>
          {RPE_OPTIONS.map((option) => (
            <Pressable key={option.value} style={styles.option} onPress={() => finish(option.value)}>
              <Text style={styles.rowTitle}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.footer}>
          <Button title="Skip" variant="ghost" onPress={() => finish(null)} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  footer: { marginTop: 'auto', gap: spacing.sm },
  muted: { color: colors.textSecondary },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  rowTitle: { color: colors.textPrimary, fontSize: 16 },
  rowMeta: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.xs },
  options: { gap: spacing.sm },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stepperText: { fontSize: 24, color: colors.textPrimary },
  stepperValue: { fontSize: 28, color: colors.textPrimary, fontWeight: '600' },
});
