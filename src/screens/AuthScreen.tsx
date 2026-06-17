import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AccountAuthCard } from '../components/AccountAuthCard';
import { colors, spacing, type } from '../theme';

export function AuthScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>Hale</Text>
          <Text style={styles.title}>Your movement age, measured month by month.</Text>
          <Text style={styles.subtitle}>
            Sign in to save your setup and keep your Hale progress connected to your account.
          </Text>
        </View>
        <AccountAuthCard context="required" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.huge,
  },
  hero: {
    marginBottom: spacing.xl,
  },
  brand: {
    ...type.label,
    color: colors.accentGold,
    marginBottom: spacing.md,
  },
  title: {
    ...type.h1,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
