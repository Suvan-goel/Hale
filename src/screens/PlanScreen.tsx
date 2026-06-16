import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  EmptyState,
  Eyebrow,
  Screen,
  SecondaryButton,
  SectionHeader,
  SettingsIconButton,
  StatusBadge,
} from '../components/ui';
import type { ActiveBlockSummary, WeekSessionStatus } from '../haleFlow';
import { colors, radius, spacing, type } from '../theme';

type Shortcut = 'schedule' | 'intensity';

export function PlanScreen({
  activeBlockSummary,
  weekSessionStatuses,
  onCreateBlock,
  onStartSession,
  onOpenSettings,
}: {
  activeBlockSummary?: ActiveBlockSummary;
  weekSessionStatuses: readonly WeekSessionStatus[];
  onCreateBlock: () => void;
  onStartSession: () => void;
  onOpenSettings: () => void;
}) {
  const [shortcut, setShortcut] = React.useState<Shortcut | null>(null);
  const focus = activeBlockSummary?.focusTitle ?? 'Your next 4-week block';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Eyebrow>Plan</Eyebrow>
          <Text style={styles.title}>Your 4-Week Block</Text>
          <Text style={styles.subtitle}>{focus}</Text>
        </View>
        <SettingsIconButton onPress={onOpenSettings} />
      </View>

      {!activeBlockSummary ? (
        <EmptyState
          title="Create your first 4-week block"
          body="Hale turns your Movement Check-Up into a simple plan for strength, balance, and mobility."
          actionLabel="Create 4-Week Block"
          onAction={onCreateBlock}
        />
      ) : (
        <>
          <Card>
            <View style={styles.statusHead}>
              <View style={styles.headerCopy}>
                <Text style={styles.cardTitle}>Week {activeBlockSummary.weekNumber} of {activeBlockSummary.totalWeeks}</Text>
                <Text style={styles.cardBody}>
                  {activeBlockSummary.sessionsCompleteThisWeek} of {activeBlockSummary.sessionsTargetThisWeek} sessions complete
                </Text>
              </View>
              <StatusBadge label="Active block" tone="gold" />
            </View>
          </Card>

          <Card>
            <SectionHeader title="This week's sessions" />
            {weekSessionStatuses.map((session, index) => (
              <SessionCard
                key={session.id}
                title={session.title}
                body={session.focus}
                index={index}
                status={session.status}
                onPress={session.status === 'next' ? onStartSession : undefined}
              />
            ))}
          </Card>

          <Card>
            <SectionHeader title="Re-test" />
            <Text style={styles.retestValue}>
              {activeBlockSummary.retestInDays !== undefined
                ? `Re-test in ${activeBlockSummary.retestInDays} days`
                : 'Re-test after this block'}
            </Text>
            <Text style={styles.cardBody}>
              Your next Movement Check-Up refreshes the block and shows what changed.
            </Text>
          </Card>

          <Card>
            <SectionHeader title="Adjust this block" />
            <View style={styles.shortcuts}>
              <ShortcutButton title="Equipment" onPress={onOpenSettings} />
              <ShortcutButton title="Schedule" onPress={() => setShortcut('schedule')} />
              <ShortcutButton title="Intensity" onPress={() => setShortcut('intensity')} />
            </View>
            {shortcut ? (
              <Text style={styles.note}>
                {shortcut === 'schedule'
                  ? 'Schedule preferences will guide future session planning.'
                  : 'Intensity preferences will keep sessions matched to how today feels.'}
              </Text>
            ) : null}
          </Card>
        </>
      )}
    </Screen>
  );
}

function SessionCard({
  title,
  body,
  index,
  status,
  onPress,
}: {
  title: string;
  body: string;
  index: number;
  status: WeekSessionStatus['status'];
  onPress?: () => void;
}) {
  const complete = status === 'complete';
  const content = (
    <>
      <View style={[styles.sessionMark, complete && styles.sessionMarkComplete]}>
        <Text style={[styles.sessionMarkText, complete && styles.sessionMarkTextComplete]}>
          {String.fromCharCode(65 + index)}
        </Text>
      </View>
      <View style={styles.sessionCopy}>
        <Text style={styles.sessionTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>
      </View>
      <StatusBadge label={statusLabel(status)} tone={status === 'next' ? 'gold' : complete ? 'good' : 'neutral'} />
    </>
  );

  if (!onPress) return <View style={styles.sessionRow}>{content}</View>;
  return (
    <Pressable
      style={({ pressed }) => [styles.sessionRow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${body}`}
    >
      {content}
    </Pressable>
  );
}

function ShortcutButton({ title, onPress }: { title: string; onPress: () => void }) {
  return <SecondaryButton title={title} onPress={onPress} style={styles.shortcut} />;
}

function statusLabel(status: WeekSessionStatus['status']): string {
  if (status === 'complete') return 'Done';
  if (status === 'next') return 'Next';
  return 'Later';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: { flex: 1 },
  title: { ...type.display, marginTop: spacing.sm },
  subtitle: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm },
  statusHead: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { ...type.h2 },
  cardBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: 2 },
  sessionRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  sessionMark: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSage,
  },
  sessionMarkComplete: { backgroundColor: colors.accent },
  sessionMarkText: { ...type.h3, color: colors.accentDeep },
  sessionMarkTextComplete: { color: colors.onAccent },
  sessionCopy: { flex: 1 },
  sessionTitle: { ...type.h3 },
  retestValue: { ...type.h1, color: colors.accentDeep },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  shortcut: { minWidth: 104, flexGrow: 1, shadowOpacity: 0 },
  note: { ...type.caption, color: colors.sageDeep, marginTop: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
