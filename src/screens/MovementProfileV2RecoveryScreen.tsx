import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { VoiceChannel } from '../audio/voicePlayer';
import type { VoiceCueKey } from '../audio/cues';
import { voicePriority } from '../audio/cues';
import { PrimaryButton, Screen, SecondaryButton } from '../components/ui';
import {
  movementProfileV2RecoveryCopy,
  type MovementProfileV2RecoveryState,
} from '../movementProfileV2/recovery';
import { DEFAULT_VOICE_ID } from '../profile/voices';
import { colors, spacing, type } from '../theme';

export function MovementProfileV2RecoveryScreen({
  state,
  voiceRecovery,
  onFinishDetails,
  onOpenProfile,
  onRetake,
  onStartFresh,
  onUseSaved,
  onCancel,
}: {
  state: MovementProfileV2RecoveryState;
  voiceRecovery?: {
    recoveryId: string;
    voiceId?: string;
    cueKeys?: readonly VoiceCueKey[];
    lossCueAlreadyEmitted?: boolean;
  };
  onFinishDetails: () => void;
  onOpenProfile: () => void;
  onRetake: () => void;
  onStartFresh: () => void;
  onUseSaved: () => void;
  onCancel: () => void;
}) {
  const copy = movementProfileV2RecoveryCopy(state.kind);
  const voiceRef = React.useRef<VoiceChannel | null>(null);
  const voiceIdRef = React.useRef<string | null>(null);
  const spokenRecoveryIdsRef = React.useRef(new Set<string>());
  const recoveryId = voiceRecovery?.recoveryId ?? null;
  const recoveryVoiceId = voiceRecovery?.voiceId ?? DEFAULT_VOICE_ID;
  const recoveryCueKeys = voiceRecovery?.cueKeys ?? null;
  const recoveryCueSignature = voiceRecovery?.cueKeys?.join('|') ?? null;
  const recoveryLossCueAlreadyEmitted = voiceRecovery?.lossCueAlreadyEmitted === true;
  const primaryAction = actionFor(copy.primaryAction, {
    onFinishDetails,
    onOpenProfile,
    onRetake,
    onStartFresh,
    onUseSaved,
  });
  const secondaryAction = secondaryActionFor(copy.secondaryLabel, {
    onOpenProfile,
    onRetake,
    onCancel,
  });

  React.useEffect(() => {
    if (!recoveryId) return undefined;
    if (voiceRef.current === null || voiceIdRef.current !== recoveryVoiceId) {
      voiceRef.current?.cancelActive('voice_changed');
      voiceRef.current = new VoiceChannel(recoveryVoiceId);
      voiceIdRef.current = recoveryVoiceId;
    }
    const scopeId = `mpv2:recovery-screen:${recoveryId}`;
    if (spokenRecoveryIdsRef.current.has(recoveryId)) return undefined;
    spokenRecoveryIdsRef.current.add(recoveryId);
    const cues = recoveryCueKeys ?? recoveryScreenCues(recoveryLossCueAlreadyEmitted);
    if (cues.length === 0) return undefined;
    const priority = Math.max(...cues.map(voicePriority), 0);
    voiceRef.current.speakTracked(cues, {
      priority,
      required: true,
      scopeId,
    });
    return () => {
      voiceRef.current?.cancelScope(scopeId, 'screen_unmounted');
    };
  }, [recoveryCueSignature, recoveryId, recoveryLossCueAlreadyEmitted, recoveryVoiceId]);

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Internal Movement Profile V2</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton title={copy.primaryLabel} onPress={primaryAction} />
        {copy.secondaryLabel && secondaryAction ? (
          <SecondaryButton title={copy.secondaryLabel} onPress={secondaryAction} />
        ) : null}
        {!copy.secondaryLabel ? <SecondaryButton title="Cancel" onPress={onCancel} /> : null}
      </View>
    </Screen>
  );
}

function recoveryScreenCues(lossCueAlreadyEmitted: boolean): readonly VoiceCueKey[] {
  return lossCueAlreadyEmitted
    ? ['retry-v21', 'tracking-recovered-v21']
    : ['tracking-loss-v21', 'retry-v21', 'tracking-recovered-v21'];
}

function actionFor(
  action: ReturnType<typeof movementProfileV2RecoveryCopy>['primaryAction'],
  handlers: {
    onFinishDetails: () => void;
    onOpenProfile: () => void;
    onRetake: () => void;
    onStartFresh: () => void;
    onUseSaved: () => void;
  }
): () => void {
  switch (action) {
    case 'finish_details':
      return handlers.onFinishDetails;
    case 'open_profile':
      return handlers.onOpenProfile;
    case 'retake':
      return handlers.onRetake;
    case 'start_fresh':
      return handlers.onStartFresh;
    case 'use_saved':
      return handlers.onUseSaved;
  }
}

function secondaryActionFor(
  label: string | undefined,
  handlers: {
    onOpenProfile: () => void;
    onRetake: () => void;
    onCancel: () => void;
  }
): (() => void) | null {
  if (!label) return null;
  if (label === 'Open profile') return handlers.onOpenProfile;
  if (label === 'Retake') return handlers.onRetake;
  if (label === 'Cancel') return handlers.onCancel;
  return null;
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'center',
  },
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...type.cardCaption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  title: {
    ...type.pageTitle,
    color: colors.textPrimary,
  },
  body: {
    ...type.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
  },
});
