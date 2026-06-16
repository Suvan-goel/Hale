import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge } from '../components/ui';
import { colors, spacing, type } from '../theme';

export function WelcomeScreen({
  onStart,
  onDone,
  showDashboardLink = true,
}: {
  onStart: () => void;
  onDone: () => void;
  showDashboardLink?: boolean;
}) {
  const [showHow, setShowHow] = React.useState(false);
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Hale"
        title="Stay stronger, steadier, and more mobile as you age."
        subtitle="Hale uses your phone camera to check your movement and create a simple 4-week plan."
      />

      <Card style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title}>Private by design</Text>
          <StatusBadge label="No video view" tone="gold" />
        </View>
        <Text style={styles.body}>
          You appear as a clean skeleton outline while Hale measures movement. The camera is a measuring instrument, not a mirror.
        </Text>
      </Card>

      {showHow ? (
        <Card style={styles.card}>
          <Step n="1" title="Check up" body="Measure strength, balance, and mobility." />
          <Step n="2" title="Train" body="Follow a 4-week block built around what will help most." />
          <Step n="3" title="Re-test" body="Repeat the Movement Check-Up at the end of the block." />
          <Step n="4" title="See progress" body="Use the report to choose the next focus." />
        </Card>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton title="Start Movement Check-Up" onPress={onStart} />
        <SecondaryButton title={showHow ? 'Hide how it works' : 'How it works'} onPress={() => setShowHow((v) => !v)} />
        {showDashboardLink ? <SecondaryButton title="Go to dashboard" onPress={onDone} /> : null}
      </View>
    </Screen>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepMark}>
        <Text style={styles.stepMarkText}>{n}</Text>
      </View>
      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...type.h2 },
  body: { ...type.bodySmall, color: colors.textSecondary },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64 },
  stepMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  stepMarkText: { ...type.h3, color: colors.accentDeep },
  stepCopy: { flex: 1 },
  stepTitle: { ...type.h3 },
  stepBody: { ...type.caption, marginTop: 2 },
  actions: { gap: spacing.md },
});
