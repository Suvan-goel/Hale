import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { colors, radius, spacing, type } from '../theme';

export type ExerciseDemoFamily =
  | 'chair_squat'
  | 'hinge_bridge'
  | 'push'
  | 'pull'
  | 'core_carry'
  | 'balance'
  | 'prep_finisher';

export type ExerciseDemoSpec = Readonly<{
  family: ExerciseDemoFamily;
  cues: readonly [string, string, string];
}>;

const DEMO_SPECS: Readonly<Record<ExerciseDemoFamily, ExerciseDemoSpec>> = {
  chair_squat: {
    family: 'chair_squat',
    cues: [
      'Use the chair, step, or support named in your session.',
      'Stand tall, then bend through your hips and knees.',
      'Follow Pearl’s pace and use a comfortable range.',
    ],
  },
  hinge_bridge: {
    family: 'hinge_bridge',
    cues: [
      'Take the standing or floor position Pearl describes.',
      'Keep the movement centred at your hips.',
      'Move smoothly and keep breathing throughout.',
    ],
  },
  push: {
    family: 'push',
    cues: [
      'Place your hands on the steady surface Pearl names.',
      'Make one comfortable line through your body.',
      'Press away, then return at Pearl’s pace.',
    ],
  },
  pull: {
    family: 'pull',
    cues: [
      'Set up your band, backpack, or floor position as described.',
      'Draw your shoulders gently back as your arms move.',
      'Return smoothly and keep breathing.',
    ],
  },
  core_carry: {
    family: 'core_carry',
    cues: [
      'Take the floor or standing position Pearl describes.',
      'Make your middle gently firm before you move.',
      'Keep breathing as you reach, hold, or carry.',
    ],
  },
  balance: {
    family: 'balance',
    cues: [
      'Keep a wall or sturdy chair within fingertip reach.',
      'Set your feet in the position Pearl describes.',
      'Look ahead and breathe while you hold or reach.',
    ],
  },
  prep_finisher: {
    family: 'prep_finisher',
    cues: [
      'Stand near support if you would like it.',
      'Follow Pearl’s pace for this short movement.',
      'Use a comfortable range and keep breathing.',
    ],
  },
};

/**
 * Stable family mapping for workout demonstrations. It deliberately keys off
 * internal ids rather than display copy, so a wording change cannot silently
 * swap the guidance shown to a user.
 */
export function exerciseDemoFamily(exerciseId: string): ExerciseDemoFamily {
  const id = exerciseId.trim().toLowerCase().replace(/-/g, '_');

  if (/^(?:programme[._]prep|prep|finisher)(?:[._]|$)/.test(id)) return 'prep_finisher';
  if (/^balance(?:[._]|$)/.test(id)) return 'balance';
  if (
    /^(?:squat|sts)(?:[._]|$)/.test(id) ||
    id.includes('sit_to_stand') ||
    id.includes('split_squat') ||
    id === 'step_up'
  ) {
    return 'chair_squat';
  }
  if (/^hinge(?:[._]|$)/.test(id) || id.includes('hip_hinge') || id.includes('glute_bridge')) {
    return 'hinge_bridge';
  }
  if (/^push(?:[._]|$)/.test(id) || id.includes('push_up') || id.includes('press_up')) return 'push';
  if (/^pull(?:[._]|$)/.test(id) || id.includes('band_row') || id.includes('pull_apart')) return 'pull';
  if (/^core(?:[._]|$)/.test(id) || id.includes('carry')) return 'core_carry';

  return 'prep_finisher';
}

export function getExerciseDemoSpec(exerciseId: string): ExerciseDemoSpec {
  return DEMO_SPECS[exerciseDemoFamily(exerciseId)];
}

export function ExerciseDemoGraphic({
  exerciseId,
  displayName,
}: {
  exerciseId: string;
  displayName: string;
}) {
  const spec = getExerciseDemoSpec(exerciseId);
  const accessibilityLabel = `${displayName}. Instructional preview. ${spec.cues.join(' ')}`;

  return (
    <View style={styles.card} accessible accessibilityLabel={accessibilityLabel}>
      <View style={styles.visual} importantForAccessibility="no-hide-descendants">
        <MovementGraphic family={spec.family} />
      </View>

      <View style={styles.copy} importantForAccessibility="no-hide-descendants">
        <Text style={styles.eyebrow}>BEFORE YOU BEGIN</Text>
        <Text style={styles.title}>{displayName}</Text>
        <View style={styles.cueList}>
          {spec.cues.map((cue, index) => (
            <View key={cue} style={styles.cueRow}>
              <View style={styles.cueNumber}>
                <Text style={styles.cueNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.cueText}>{cue}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>This is a setup guide, not a form assessment.</Text>
      </View>
    </View>
  );
}

function MovementGraphic({ family }: { family: ExerciseDemoFamily }) {
  return (
    <Svg
      width="100%"
      height={148}
      viewBox="0 0 240 148"
      accessible={false}
      focusable={false}
    >
      <Rect x={0} y={0} width={240} height={148} rx={radius.card} fill={colors.focusSurface} />
      <Line x1={28} y1={124} x2={212} y2={124} stroke={colors.border} strokeWidth={2} />
      {family === 'chair_squat' ? <ChairSquatGraphic /> : null}
      {family === 'hinge_bridge' ? <HingeGraphic /> : null}
      {family === 'push' ? <PushGraphic /> : null}
      {family === 'pull' ? <PullGraphic /> : null}
      {family === 'core_carry' ? <CoreCarryGraphic /> : null}
      {family === 'balance' ? <BalanceGraphic /> : null}
      {family === 'prep_finisher' ? <PrepGraphic /> : null}
    </Svg>
  );
}

function ChairSquatGraphic() {
  return (
    <G>
      <Rect x={147} y={78} width={45} height={8} rx={4} fill={colors.accentDark} />
      <Line x1={154} y1={86} x2={154} y2={124} stroke={colors.accentDark} strokeWidth={7} />
      <Line x1={186} y1={86} x2={186} y2={124} stroke={colors.accentDark} strokeWidth={7} />
      <Circle cx={103} cy={35} r={12} fill={colors.accent} />
      <Path d="M103 50 L110 77 L143 82" stroke={colors.accent} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M142 83 L125 102 L126 123" stroke={colors.accent} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M108 58 L132 72" stroke={colors.accent} strokeWidth={8} strokeLinecap="round" fill="none" />
      <Path d="M67 91 L67 48 M60 57 L67 48 L74 57" stroke={colors.accentDark} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </G>
  );
}

function HingeGraphic() {
  return (
    <G>
      <Circle cx={150} cy={42} r={12} fill={colors.accent} />
      <Path d="M138 51 L101 73 L87 88" stroke={colors.accent} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M90 87 L78 122 M90 87 L112 122" stroke={colors.accent} strokeWidth={10} strokeLinecap="round" fill="none" />
      <Path d="M123 63 L133 91 L143 111" stroke={colors.accent} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M70 62 C83 47 103 42 121 47 M112 38 L121 47 L111 52" stroke={colors.accentDark} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </G>
  );
}

function PushGraphic() {
  return (
    <G>
      <Line x1={191} y1={24} x2={191} y2={124} stroke={colors.accentDark} strokeWidth={7} strokeLinecap="round" />
      <Circle cx={107} cy={43} r={12} fill={colors.accent} />
      <Path d="M112 56 L129 77 L150 111" stroke={colors.accent} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M128 68 L157 62 L186 66" stroke={colors.accent} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M150 110 L130 123 M150 110 L166 123" stroke={colors.accent} strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d="M161 43 L180 43 M172 35 L180 43 L172 51" stroke={colors.accentDark} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </G>
  );
}

function PullGraphic() {
  return (
    <G>
      <Circle cx={92} cy={39} r={12} fill={colors.accent} />
      <Path d="M92 53 L92 91" stroke={colors.accent} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Path d="M91 64 L123 70 L158 64" stroke={colors.accent} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M92 89 L72 123 M92 89 L111 123" stroke={colors.accent} strokeWidth={10} strokeLinecap="round" fill="none" />
      <Line x1={159} y1={42} x2={159} y2={88} stroke={colors.accentDark} strokeWidth={4} strokeLinecap="round" />
      <Path d="M151 96 L129 96 M137 88 L129 96 L137 104" stroke={colors.accentDark} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </G>
  );
}

function CoreCarryGraphic() {
  return (
    <G>
      <Circle cx={111} cy={30} r={12} fill={colors.accent} />
      <Path d="M111 44 L111 86" stroke={colors.accent} strokeWidth={13} strokeLinecap="round" fill="none" />
      <Path d="M111 55 L89 78 M111 55 L136 74" stroke={colors.accent} strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d="M111 84 L92 123 M111 84 L130 123" stroke={colors.accent} strokeWidth={10} strokeLinecap="round" fill="none" />
      <Circle cx={111} cy={69} r={15} fill="none" stroke={colors.accentDark} strokeWidth={4} />
      <Rect x={137} y={73} width={22} height={30} rx={4} fill={colors.accentDark} />
      <Path d="M142 73 C142 64 154 64 154 73" stroke={colors.accentDark} strokeWidth={4} fill="none" />
    </G>
  );
}

function BalanceGraphic() {
  return (
    <G>
      <Line x1={181} y1={38} x2={181} y2={124} stroke={colors.accentDark} strokeWidth={7} strokeLinecap="round" />
      <Circle cx={111} cy={31} r={12} fill={colors.accent} />
      <Path d="M111 45 L111 84" stroke={colors.accent} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Path d="M111 57 L83 76 M111 57 L158 64" stroke={colors.accent} strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d="M111 82 L103 123 M111 82 L139 98" stroke={colors.accent} strokeWidth={10} strokeLinecap="round" fill="none" />
      <Circle cx={111} cy={72} r={30} fill="none" stroke={colors.accentDark} strokeWidth={3} strokeDasharray="4 7" />
    </G>
  );
}

function PrepGraphic() {
  return (
    <G>
      <Circle cx={120} cy={30} r={12} fill={colors.accent} />
      <Path d="M120 44 L120 83" stroke={colors.accent} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Path d="M120 56 L88 72 M120 56 L152 72" stroke={colors.accent} strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d="M120 81 L93 102 L80 123 M120 81 L143 104 L163 111" stroke={colors.accent} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M62 56 C45 70 45 91 60 104 M178 56 C195 70 195 91 180 104" stroke={colors.accentDark} strokeWidth={4} strokeLinecap="round" fill="none" />
    </G>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.surface,
  },
  visual: {
    width: '100%',
  },
  copy: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  eyebrow: {
    ...type.label,
    color: colors.accentDark,
  },
  title: {
    ...type.cardTitle,
  },
  cueList: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  cueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  cueNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentBorder,
  },
  cueNumberText: {
    ...type.cardCaption,
    color: colors.textPrimary,
  },
  cueText: {
    ...type.cardBody,
    flex: 1,
    color: colors.textPrimary,
  },
  note: {
    ...type.cardCaption,
    color: colors.textMuted,
    paddingTop: spacing.xs,
  },
});
