import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge } from '../components/ui';
import { colors, spacing, type } from '../theme';

export function CameraSetupScreen({
  permissionGranted,
  onRequestPermission,
  onBegin,
  onCancel,
}: {
  permissionGranted: boolean;
  onRequestPermission: () => void;
  onBegin: () => void;
  onCancel: () => void;
}) {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Camera setup"
        title="Prepare for your Movement Check-Up"
        subtitle="Prop your phone against a wall at about hip height. Step back until your whole body is visible."
      />

      <Card style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title}>What you need</Text>
          <StatusBadge label={permissionGranted ? 'Camera ready' : 'Permission needed'} tone={permissionGranted ? 'good' : 'gold'} />
        </View>
        <SetupItem n="1" text="A sturdy chair for sit-to-stand movements." />
        <SetupItem n="2" text="A wall, counter, or chair nearby for balance support." />
        <SetupItem n="3" text="Enough light for Hale to track your skeleton clearly." />
        <SetupItem n="4" text="Enough space to stand and move safely." />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Privacy</Text>
        <Text style={styles.body}>
          Video is never shown. Hale renders a clean skeleton and stores only movement results unless developer recording is explicitly enabled.
        </Text>
      </Card>

      <View style={styles.actions}>
        {permissionGranted ? (
          <PrimaryButton title="Begin check-up" onPress={onBegin} />
        ) : (
          <PrimaryButton title="Allow camera" onPress={onRequestPermission} />
        )}
        {!permissionGranted ? <SecondaryButton title="Continue with setup anyway" onPress={onBegin} /> : null}
        <SecondaryButton title="Back" onPress={onCancel} />
      </View>
    </Screen>
  );
}

function SetupItem({ n, text }: { n: string; text: string }) {
  return (
    <View style={styles.item}>
      <View style={styles.mark}>
        <Text style={styles.markText}>{n}</Text>
      </View>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...type.h2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  markText: { ...type.caption, color: colors.accentDeep },
  body: { ...type.bodySmall, color: colors.textSecondary, flex: 1 },
  actions: { gap: spacing.md },
});
