import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton, StatusBadge, ToggleRow } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme';
import {
  SUPPORT_ENCOURAGEMENTS,
  createSupportInvite,
  createSupportSummary,
  relationshipLabel,
  sharingLevelLabel,
  updateSupportConnection,
} from '../supportCircleService';
import type {
  IdentityMilestone,
  MovementBlock,
  SharingLevel,
  SupportConnection,
  SupportRelationshipType,
  TrainingSessionCompletion,
} from '../types';

const SHARING_LEVELS: SharingLevel[] = ['completion_only', 'progress_summary', 'detailed'];

export function SupportCircleScreen({
  connections,
  block,
  completions,
  latestMilestone,
  onSaveConnection,
  onRemoveConnection,
}: {
  connections: readonly SupportConnection[];
  block?: MovementBlock | null;
  completions: readonly TrainingSessionCompletion[];
  latestMilestone?: IdentityMilestone | null;
  onSaveConnection: (connection: SupportConnection) => void;
  onRemoveConnection: (id: string) => void;
}) {
  const activeConnection = connections.find((c) => c.status !== 'removed') ?? null;
  return (
    <Screen>
      <ScreenHeader
        title="Support Circle"
        subtitle="Invite one Hale Partner or keep this private. Your supporter only sees what you choose."
      />
      {activeConnection ? (
        <ExistingConnection
          connection={activeConnection}
          block={block}
          completions={completions}
          latestMilestone={latestMilestone}
          onSaveConnection={onSaveConnection}
          onRemoveConnection={onRemoveConnection}
        />
      ) : (
        <NewInvite onSaveConnection={onSaveConnection} />
      )}
    </Screen>
  );
}

function NewInvite({ onSaveConnection }: { onSaveConnection: (connection: SupportConnection) => void }) {
  const [relationshipType, setRelationshipType] = React.useState<SupportRelationshipType | null>(null);
  const [invite, setInvite] = React.useState('');
  const [sharingLevel, setSharingLevel] = React.useState<SharingLevel>('progress_summary');
  const [notifyOnMissedWeek, setNotifyOnMissedWeek] = React.useState(false);
  const [notifyOnMilestones, setNotifyOnMilestones] = React.useState(true);
  const relationship = relationshipType ?? 'friend';

  return (
    <>
      <Card style={styles.card}>
        <Text style={styles.title}>Would you like someone to support this block?</Text>
        <Choice
          label="Invite my spouse, friend, or training partner"
          selected={relationshipType === 'friend' || relationshipType === 'spouse_partner' || relationshipType === 'training_buddy'}
          onPress={() => setRelationshipType('friend')}
        />
        <Choice
          label="Invite my son or daughter"
          selected={relationshipType === 'adult_child'}
          onPress={() => setRelationshipType('adult_child')}
        />
        <Choice label="Keep this private for now" selected={relationshipType === null} onPress={() => setRelationshipType(null)} />
      </Card>

      {relationshipType ? (
        <Card style={styles.card}>
          <Text style={styles.title}>Invite details</Text>
          <Text style={styles.body}>Your supporter will only see what you choose. You can change this any time.</Text>
          <TextInput
            style={styles.input}
            value={invite}
            onChangeText={setInvite}
            placeholder="Email or phone (saved locally for now)"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Supporter email or phone"
          />
          <SharingPicker value={sharingLevel} onChange={setSharingLevel} />
          <ToggleRow
            label="Milestone notifications"
            description="Default on. Shares only the milestones your settings allow."
            value={notifyOnMilestones}
            onValueChange={setNotifyOnMilestones}
          />
          <ToggleRow
            label="Missed-week check-in"
            description="Default off. Only sends when you explicitly choose it."
            value={notifyOnMissedWeek}
            onValueChange={setNotifyOnMissedWeek}
          />
          <PrimaryButton
            title="Save Support Circle invite"
            onPress={() =>
              onSaveConnection(
                createSupportInvite({
                  relationshipType: relationship,
                  inviteEmailOrPhone: invite,
                  sharingLevel,
                  notifyOnMissedWeek,
                  notifyOnMilestones,
                })
              )
            }
          />
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text style={styles.title}>Private for now</Text>
          <Text style={styles.body}>Your block stays on this device. You can add a Hale Partner later.</Text>
        </Card>
      )}
    </>
  );
}

function ExistingConnection({
  connection,
  block,
  completions,
  latestMilestone,
  onSaveConnection,
  onRemoveConnection,
}: {
  connection: SupportConnection;
  block?: MovementBlock | null;
  completions: readonly TrainingSessionCompletion[];
  latestMilestone?: IdentityMilestone | null;
  onSaveConnection: (connection: SupportConnection) => void;
  onRemoveConnection: (id: string) => void;
}) {
  const summary = createSupportSummary({
    connection,
    block,
    completions,
    recentMilestoneTitle: latestMilestone?.title,
  });
  return (
    <>
      <Card style={styles.card}>
        <View style={styles.head}>
          <View style={styles.flex}>
            <Text style={styles.title}>{relationshipLabel(connection.relationshipType)}</Text>
            <Text style={styles.body}>
              {connection.inviteEmailOrPhone || 'Invite saved locally'} · {sharingLevelLabel(connection.sharingLevel)}
            </Text>
          </View>
          <StatusBadge label={connection.status === 'accepted' ? 'Active' : 'Pending'} tone="gold" />
        </View>
        <Text style={styles.body}>{summary.visible ? summary.headline : 'No progress is shared.'}</Text>
        {summary.detail ? <Text style={styles.body}>{summary.detail}</Text> : null}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Sharing</Text>
        <SharingPicker
          value={connection.sharingLevel}
          onChange={(sharingLevel) => onSaveConnection(updateSupportConnection(connection, { sharingLevel }))}
        />
        <ToggleRow
          label="Milestone notifications"
          value={connection.notifyOnMilestones}
          onValueChange={(notifyOnMilestones) => onSaveConnection(updateSupportConnection(connection, { notifyOnMilestones }))}
        />
        <ToggleRow
          label="Missed-week check-in"
          description="Only if you choose it."
          value={connection.notifyOnMissedWeek}
          onValueChange={(notifyOnMissedWeek) => onSaveConnection(updateSupportConnection(connection, { notifyOnMissedWeek }))}
        />
      </Card>

      {connection.relationshipType === 'training_buddy' ? (
        <Card style={styles.card}>
          <Text style={styles.title}>One-tap encouragement</Text>
          {SUPPORT_ENCOURAGEMENTS.map((line) => (
            <Text key={line} style={styles.encouragement}>
              {line}
            </Text>
          ))}
        </Card>
      ) : null}

      <SecondaryButton title="Remove supporter" onPress={() => onRemoveConnection(connection.id)} />
    </>
  );
}

function SharingPicker({ value, onChange }: { value: SharingLevel; onChange: (level: SharingLevel) => void }) {
  return (
    <View style={styles.sharingList}>
      {SHARING_LEVELS.map((level) => (
        <Choice key={level} label={sharingLevelLabel(level)} selected={level === value} onPress={() => onChange(level)} />
      ))}
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  title: { ...type.h2 },
  body: { ...type.bodySmall, color: colors.textSecondary },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  input: {
    ...type.body,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    borderRadius: radius.input,
  },
  sharingList: { gap: spacing.md },
  choice: {
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  choiceSelected: { backgroundColor: colors.bgSage, borderColor: colors.sage },
  choiceText: { ...type.bodySmall },
  choiceTextSelected: { color: colors.accentDeep },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  encouragement: { ...type.bodySmall, color: colors.accentDeep },
});
