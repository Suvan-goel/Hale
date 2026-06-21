import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { Card, ListRow, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge, Typography } from '../components/ui';
import { colors, radius, spacing, type } from '../theme';

export function CameraSetupScreen({
  permissionGranted,
  onRequestPermission,
  onBegin,
  onDevSkipCheckUp,
  onCancel,
}: {
  permissionGranted: boolean;
  onRequestPermission: () => void;
  onBegin: () => void;
  onDevSkipCheckUp?: () => void;
  onCancel: () => void;
}) {
  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <ScreenHeader
        eyebrow="Step 6 of 10"
        title="Set up your space"
        subtitle="A calm setup makes your Movement Check-Up easier to follow."
      />

      <Card style={styles.card}>
        <View style={styles.head}>
          <Typography variant="h2">Before you begin</Typography>
          <StatusBadge label={permissionGranted ? 'Camera ready' : 'Permission needed'} tone={permissionGranted ? 'good' : 'gold'} />
        </View>
        <SetupItem n="1" text="Set your phone side-on when asked." />
        <SetupItem n="2" text="Make sure your full body is visible." />
        <SetupItem n="3" text="Use a stable chair." />
        <SetupItem n="4" text="Keep support nearby for balance." />
        <SetupItem n="5" text="Move slowly and comfortably." />
        <SetupItem n="6" text="Use good lighting." />
      </Card>

      <Card style={styles.card}>
        <Typography variant="h2">Privacy</Typography>
        <Typography variant="bodySmall" color={colors.textSecondary}>
          Video is never shown. Hale renders a clean skeleton and stores only movement results unless developer recording is explicitly enabled.
        </Typography>
      </Card>

      <View style={styles.actions}>
        {permissionGranted ? (
          <PrimaryButton title="I'm set up" onPress={onBegin} />
        ) : (
          <PrimaryButton title="Allow camera" onPress={onRequestPermission} />
        )}
        {!permissionGranted ? <SecondaryButton title="Continue with setup anyway" onPress={onBegin} /> : null}
        {onDevSkipCheckUp ? <SecondaryButton title="dev: skip Movement Check-Up" onPress={onDevSkipCheckUp} /> : null}
      </View>
    </Screen>
  );
}

function SetupItem({ n, text }: { n: string; text: string }) {
  return (
    <ListRow
      title={text}
      leading={
        <View style={styles.mark}>
          <Text style={styles.markText}>{n}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
  mark: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  markText: { ...type.caption, color: colors.accentDeep },
  actions: { gap: spacing.md },
});
