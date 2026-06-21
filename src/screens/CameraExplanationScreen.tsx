import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { Card, ListRow, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge, Typography } from '../components/ui';
import { spacing } from '../theme';

export function CameraExplanationScreen({
  permissionGranted,
  onRequestPermission,
  onContinue,
  onBack,
}: {
  permissionGranted: boolean;
  onRequestPermission: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back" onPress={onBack} />
      <ScreenHeader
        eyebrow="Step 5 of 10"
        title="How Hale uses your camera"
        subtitle="The camera is the sensor for your Movement Check-Up."
      />

      <Card style={styles.card}>
        <View style={styles.head}>
          <Typography variant="h2">Movement Check-Up</Typography>
          <StatusBadge label={permissionGranted ? 'Camera ready' : 'Permission needed'} tone={permissionGranted ? 'good' : 'gold'} />
        </View>
        <ListRow title="Measure movement" subtitle="Chair stands, balance holds, and shoulder reach become simple progress signals." />
        <ListRow title="See a skeleton" subtitle="You see a clean outline, never a self-view camera mirror." />
        <ListRow title="Stay private" subtitle="Recordings stay behind a developer toggle and are off for normal sessions." />
      </Card>

      <View style={styles.actions}>
        {permissionGranted ? (
          <PrimaryButton title="Continue" onPress={onContinue} />
        ) : (
          <PrimaryButton title="Allow camera" onPress={onRequestPermission} />
        )}
        {!permissionGranted ? <SecondaryButton title="Continue after setup" onPress={onContinue} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
  actions: { gap: spacing.md },
});
