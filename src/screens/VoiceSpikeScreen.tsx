/**
 * DEV-ONLY voice-KWS spike harness — the instrument for the frozen criteria in
 * docs/specs/VOICE_KWS_SPIKE_GO_NO_GO.md. Not reachable in production: App.tsx
 * mounts it only when __DEV__ && EXPO_PUBLIC_VOICE_SPIKE=1.
 *
 * Runs scripted trials per condition (A–F) and the false-accept soak (G),
 * logs per-trial transcripts + matched intents + timing, shows per-intent
 * recall live, and exports one JSON per device to documents/voice-spike/.
 * Raw transcripts ARE kept in the exported dev results file for diagnosis —
 * that is explicitly a dev-tool exception; production stores intents only.
 */

import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

import {
  ExpoVoiceCommandsModule,
  getOnDeviceAvailabilityAsync,
  getVoicePermissionsAsync,
  requestVoicePermissionsAsync,
  startListeningAsync,
  stopListeningAsync,
  type OnDeviceAvailability,
  type TranscriptEventPayload,
  type VoicePermissionResponse,
} from '../../modules/expo-voice-commands';
import { VoiceChannel } from '../audio/voicePlayer';
import { voicePriority } from '../audio/cues';
import { matchIntent, VoiceIntent } from '../voice/intents';
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { colors, spacing } from '../theme';

const ALL_INTENTS: readonly VoiceIntent[] = ['ready', 'done', 'skip', 'repeat', 'pause', 'resume'];

/** Conditions from the frozen criteria doc §3. */
const CONDITIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
type Condition = (typeof CONDITIONS)[number];

const CONDITION_LABELS: Record<Condition, string> = {
  A: 'A quiet room',
  B: 'B TTS coexistence',
  C: 'C background TV',
  D: 'D breathless done',
  E: 'E quiet-voice done',
  F: 'F 2.5–3 m (info)',
  G: 'G false-accept soak',
};

const TRIAL_WINDOW_TIMEOUT_MS = 8000;
const SOAK_DURATION_MS = 10 * 60 * 1000;

interface TrialRecord {
  condition: Condition;
  expectedIntent: VoiceIntent | null; // null in the soak
  transcripts: { transcript: string; isFinal: boolean; atMs: number }[];
  matchedIntent: VoiceIntent | null;
  windowOpenedAtMs: number;
  firstEventAtMs: number | null;
  matchedAtMs: number | null;
  endedAtMs: number;
}

interface RecallCell {
  hits: number;
  trials: number;
}

export function VoiceSpikeScreen(): React.ReactElement {
  const [permission, setPermission] = React.useState<VoicePermissionResponse | null>(null);
  const [availability, setAvailability] = React.useState<OnDeviceAvailability | null>(null);
  const [condition, setCondition] = React.useState<Condition>('A');
  const [expected, setExpected] = React.useState<VoiceIntent>('done');
  const [trials, setTrials] = React.useState<TrialRecord[]>([]);
  const [live, setLive] = React.useState<string>('idle');
  const [soakEndsAtMs, setSoakEndsAtMs] = React.useState<number | null>(null);
  const [exportedTo, setExportedTo] = React.useState<string | null>(null);

  const voiceRef = React.useRef<VoiceChannel | null>(null);
  const trialRef = React.useRef<TrialRecord | null>(null);
  const trialTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    getVoicePermissionsAsync().then(setPermission);
    getOnDeviceAvailabilityAsync('en-GB').then(setAvailability);
    voiceRef.current = new VoiceChannel();
    return () => {
      stopListeningAsync();
      if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    const sub = ExpoVoiceCommandsModule.addListener(
      'onTranscript',
      (payload: TranscriptEventPayload) => {
        const trial = trialRef.current;
        if (!trial) return;
        const atMs = Date.now();
        trial.transcripts.push({ transcript: payload.transcript, isFinal: payload.isFinal, atMs });
        if (trial.firstEventAtMs === null) trial.firstEventAtMs = atMs;
        setLive(`${payload.isFinal ? 'final' : 'partial'}: ${payload.transcript}`);
        if (!payload.isFinal) return;
        const match = matchIntent(payload.transcript, ALL_INTENTS);
        if (match && trial.matchedIntent === null) {
          trial.matchedIntent = match.intent;
          trial.matchedAtMs = atMs;
        }
        // Single-shot trials close on the final transcript; the soak keeps
        // its continuous window open and logs every (false) fire.
        if (trial.condition !== 'G') finishTrial();
      }
    );
    const errSub = ExpoVoiceCommandsModule.addListener('onVoiceError', (e) => {
      setLive(`error ${e.code}: ${e.message}`);
    });
    return () => {
      sub.remove();
      errSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishTrial = React.useCallback(() => {
    const trial = trialRef.current;
    if (!trial) return;
    trialRef.current = null;
    if (trialTimerRef.current) {
      clearTimeout(trialTimerRef.current);
      trialTimerRef.current = null;
    }
    trial.endedAtMs = Date.now();
    stopListeningAsync();
    setTrials((prev) => [...prev, trial]);
    setLive(
      trial.matchedIntent
        ? `matched: ${trial.matchedIntent}${trial.expectedIntent && trial.matchedIntent !== trial.expectedIntent ? ' (WRONG)' : ''}`
        : 'no intent matched'
    );
  }, []);

  const startTrial = React.useCallback(async () => {
    if (trialRef.current) return;
    // Condition B: play a real bundled line first; the window opens only when
    // playback completes — the exact production sequencing under test.
    if (condition === 'B' && voiceRef.current) {
      const request = voiceRef.current.speakTracked(['framing-ready'], {
        scopeId: 'voice-spike',
        priority: voicePriority('framing-ready'),
        required: true,
      });
      await request.completion;
    }
    const trial: TrialRecord = {
      condition,
      expectedIntent: condition === 'G' ? null : expected,
      transcripts: [],
      matchedIntent: null,
      windowOpenedAtMs: Date.now(),
      firstEventAtMs: null,
      matchedAtMs: null,
      endedAtMs: 0,
    };
    trialRef.current = trial;
    setLive('listening…');
    await startListeningAsync({ locale: 'en-GB', continuous: condition === 'G' });
    if (condition === 'G') {
      setSoakEndsAtMs(Date.now() + SOAK_DURATION_MS);
      trialTimerRef.current = setTimeout(() => {
        setSoakEndsAtMs(null);
        finishTrial();
      }, SOAK_DURATION_MS);
    } else {
      trialTimerRef.current = setTimeout(finishTrial, TRIAL_WINDOW_TIMEOUT_MS);
    }
  }, [condition, expected, finishTrial]);

  const stopSoak = React.useCallback(() => {
    setSoakEndsAtMs(null);
    finishTrial();
  }, [finishTrial]);

  const exportResults = React.useCallback(async () => {
    const dir = new Directory(Paths.document, 'voice-spike');
    if (!dir.exists) dir.create({ intermediates: true });
    const name = `voice-spike-${Platform.OS}-${Date.now()}.json`;
    const file = new File(dir, name);
    file.write(
      JSON.stringify(
        {
          platform: Platform.OS,
          osVersion: String(Platform.Version),
          availability,
          permission,
          criteriaDoc: 'docs/specs/VOICE_KWS_SPIKE_GO_NO_GO.md',
          exportedAt: new Date().toISOString(),
          trials,
        },
        null,
        2
      )
    );
    setExportedTo(file.uri);
  }, [availability, permission, trials]);

  const recall = React.useMemo(() => {
    const byIntent = new Map<string, RecallCell>();
    for (const trial of trials) {
      if (!trial.expectedIntent) continue;
      const key = `${trial.condition}:${trial.expectedIntent}`;
      const cell = byIntent.get(key) ?? { hits: 0, trials: 0 };
      cell.trials += 1;
      if (trial.matchedIntent === trial.expectedIntent) cell.hits += 1;
      byIntent.set(key, cell);
    }
    return [...byIntent.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [trials]);

  const soakFires = React.useMemo(
    () =>
      trials
        .filter((trial) => trial.condition === 'G')
        .reduce(
          (count, trial) =>
            count + trial.transcripts.filter((t) => t.isFinal && matchIntent(t.transcript, ALL_INTENTS)).length,
          0
        ),
    [trials]
  );

  return (
    <Screen>
      <ScreenHeader title="Voice KWS spike" subtitle="Dev harness — criteria are frozen in docs/specs" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.status}>
          permission: {permission?.status ?? '…'} · on-device: {availability ? `${availability.available} (${availability.reason})` : '…'}
        </Text>
        {!permission?.granted ? (
          <PrimaryButton title="Request mic + speech permission" onPress={() => requestVoicePermissionsAsync().then(setPermission)} />
        ) : null}

        <Text style={styles.sectionLabel}>Condition</Text>
        <View style={styles.chipRow}>
          {CONDITIONS.map((key) => (
            <SecondaryButton
              key={key}
              title={CONDITION_LABELS[key]}
              onPress={() => setCondition(key)}
              style={[styles.chip, condition === key && styles.chipActive]}
            />
          ))}
        </View>

        {condition !== 'G' ? (
          <>
            <Text style={styles.sectionLabel}>Expected intent</Text>
            <View style={styles.chipRow}>
              {ALL_INTENTS.map((intent) => (
                <SecondaryButton
                  key={intent}
                  title={intent}
                  onPress={() => setExpected(intent)}
                  style={[styles.chip, expected === intent && styles.chipActive]}
                />
              ))}
            </View>
          </>
        ) : null}

        {soakEndsAtMs ? (
          <PrimaryButton title={`Stop soak (fires so far: ${soakFires})`} onPress={stopSoak} />
        ) : (
          <PrimaryButton
            title={condition === 'G' ? 'Start 10-min soak' : `Run trial (${trials.length} logged)`}
            onPress={startTrial}
          />
        )}
        <Text style={styles.live}>{live}</Text>

        <Text style={styles.sectionLabel}>Recall (hits/trials per condition:intent)</Text>
        {recall.length === 0 ? (
          <Text style={styles.rowText}>No trials yet.</Text>
        ) : (
          recall.map(([key, cell]) => (
            <Text key={key} style={styles.rowText}>
              {key} — {cell.hits}/{cell.trials} ({cell.trials > 0 ? Math.round((100 * cell.hits) / cell.trials) : 0}%)
            </Text>
          ))
        )}
        <Text style={styles.rowText}>Soak false fires: {soakFires}</Text>

        <PrimaryButton title="Export results JSON" onPress={exportResults} />
        {exportedTo ? <Text style={styles.rowText}>exported → {exportedTo}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 48, gap: spacing.sm },
  status: { color: colors.textSecondary, fontSize: 13 },
  sectionLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minWidth: 90 },
  chipActive: { borderColor: colors.accent, borderWidth: 2 },
  live: { color: colors.textSecondary, fontStyle: 'italic', marginVertical: spacing.sm },
  rowText: { color: colors.textSecondary, fontSize: 13 },
});

export default VoiceSpikeScreen;
