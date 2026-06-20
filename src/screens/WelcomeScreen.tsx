import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, ListRow, PrimaryButton, Screen, SecondaryButton, Typography } from '../components/ui';
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
      <View style={styles.brandPanel}>
        <Typography variant="h2" color={colors.accent}>Hale</Typography>
        <Typography variant="bodySmall" color={colors.textSecondary}>Longevity is built daily.</Typography>
      </View>

      <View style={styles.heroCopy}>
        <Typography variant="label" color={colors.accentDeep}>Movement health</Typography>
        <Typography variant="display">Stay strong, steady, and mobile.</Typography>
        <Typography variant="body" color={colors.textSecondary}>
          Hale gives you a phone-camera Movement Check-Up and a personalised 4-week plan to help you support your movement over time.
        </Typography>
      </View>

      <Card style={styles.card}>
        <ValueRow n="1" title="Estimate your movement" body="Check strength, balance, and mobility with a guided camera session." />
        <ValueRow n="2" title="Train what matters" body="Follow a calm 4-week block built around your priority area." />
        <ValueRow n="3" title="Re-test monthly" body="Repeat your Movement Check-Up to add another data point." />
      </Card>

      <Card style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title}>Private by design</Text>
        </View>
        <Text style={styles.body}>
          You appear as a clean skeleton outline while Hale estimates movement. The camera is a measuring instrument, not a mirror.
        </Text>
      </Card>

      {showHow ? (
        <Card style={styles.card}>
          <Step n="1" title="Check up" body="Estimate strength, balance, and mobility." />
          <Step n="2" title="Train" body="Follow a 4-week block built around what will help most." />
          <Step n="3" title="Re-test" body="Repeat the Movement Check-Up at the end of the block." />
          <Step n="4" title="Review progress" body="Use the report to choose the next suggested focus." />
        </Card>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton title="Get started" onPress={onStart} />
        <SecondaryButton title={showHow ? 'Hide how it works' : 'How it works'} onPress={() => setShowHow((v) => !v)} />
        {showDashboardLink ? <SecondaryButton title="Go to dashboard" onPress={onDone} /> : null}
      </View>
    </Screen>
  );
}

function ValueRow({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <ListRow
      title={title}
      subtitle={body}
      leading={
        <View style={styles.valueMark}>
          <Text style={styles.valueMarkText}>{n}</Text>
        </View>
      }
    />
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
  brandPanel: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  heroCopy: { gap: spacing.md },
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...type.cardTitle },
  body: { ...type.cardBody },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64 },
  stepMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardSubtle,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  stepMarkText: { ...type.h3, color: colors.accentDeep },
  stepCopy: { flex: 1 },
  stepTitle: { ...type.cardRowTitle },
  stepBody: { ...type.cardCaption, marginTop: 2 },
  valueMark: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  valueMarkText: { ...type.caption, color: colors.accentDeep, fontFamily: type.button.fontFamily },
  actions: { gap: spacing.md },
});
