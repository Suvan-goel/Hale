import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge } from '../components/ui';
import { colors, spacing, type } from '../theme';

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
      <ScreenHeader
        eyebrow="Step 5 of 10"
        title="How Hale uses your camera"
        subtitle="The camera is the sensor for your Movement Check-Up."
      />

      <Card style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title}>Movement Check-Up</Text>
          <StatusBadge label={permissionGranted ? 'Camera ready' : 'Permission needed'} tone={permissionGranted ? 'good' : 'gold'} />
        </View>
        <Text style={styles.body}>
          Hale uses your camera to measure simple movements like standing from a chair, balance holds, and shoulder reach.
        </Text>
        <Text style={styles.body}>We use this to track timing, range, and progress.</Text>
        <Text style={styles.body}>You see a clean skeleton, never a self-view camera mirror.</Text>
        <Text style={styles.body}>Movement recordings stay behind a developer toggle and are off for normal sessions.</Text>
      </Card>

      <View style={styles.actions}>
        {permissionGranted ? (
          <PrimaryButton title="Continue" onPress={onContinue} />
        ) : (
          <PrimaryButton title="Allow camera" onPress={onRequestPermission} />
        )}
        {!permissionGranted ? <SecondaryButton title="Continue after setup" onPress={onContinue} /> : null}
        <SecondaryButton title="Back" onPress={onBack} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...type.h2 },
  body: { ...type.bodySmall, color: colors.textSecondary },
  actions: { gap: spacing.md },
});
