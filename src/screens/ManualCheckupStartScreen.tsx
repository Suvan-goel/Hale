import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  CheckupType,
  MovementAssessment,
  MovementBlock,
  TrainingSessionCompletion,
} from '../adherence';
import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge } from '../components/ui';
import { getManualCheckupCopy, getManualCheckupOptions } from '../haleFlow';
import { colors, spacing, type } from '../theme';

export function ManualCheckupStartScreen({
  latestAssessment,
  activeBlock,
  completions,
  onSelectCheckup,
  onMicroCheck,
  onCancel,
}: {
  latestAssessment: MovementAssessment | null;
  activeBlock: MovementBlock | null;
  completions: readonly TrainingSessionCompletion[];
  onSelectCheckup: (type: CheckupType) => void;
  onMicroCheck: () => void;
  onCancel: () => void;
}) {
  const copy = getManualCheckupCopy();
  const options = getManualCheckupOptions({ latestAssessment, activeBlock, completions });
  return (
    <Screen>
      <ScreenHeader title={copy.title} subtitle={copy.body} />
      {options.map((option) => (
        <Card key={`${option.type}-${option.route}`} style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.title}>{option.title}</Text>
            {option.recommended ? <StatusBadge label="Recommended" tone="gold" /> : null}
          </View>
          <Text style={styles.body}>{option.body}</Text>
          <PrimaryButton
            title={option.title}
            onPress={() => {
              if (option.type === 'micro_check') {
                onMicroCheck();
                return;
              }
              onSelectCheckup(option.type);
            }}
          />
          {!option.isOfficialForProgress ? (
            <Text style={styles.note}>Saved separately from your official 4-week comparison.</Text>
          ) : null}
        </Card>
      ))}
      <SecondaryButton title="Back" onPress={onCancel} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
  title: { ...type.cardTitle },
  body: { ...type.cardBody },
  note: { ...type.caption, color: colors.sageDeep },
});
