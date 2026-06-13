/**
 * __DEV__-only diagnostics overlay. Receives a snapshot at ~10fps from the
 * screen (never per-frame) — this is the only React state on the live screen.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CHAIN_IDS } from '../pose/chains';
import type { TrackingState } from '../pose/pipeline';

export interface OverlaySnapshot {
  state: TrackingState;
  fps: number;
  inferenceMs: number;
  chainReliability: number[];
  bodyUnit: number | null;
  recording: boolean;
  recordedFrames: number;
}

interface Props {
  snapshot: OverlaySnapshot;
  onToggleRecording: () => void;
}

function bar(value: number): string {
  const filled = Math.round(value * 8);
  return '█'.repeat(filled) + '░'.repeat(8 - filled);
}

export function DevOverlay({ snapshot, onToggleRecording }: Props) {
  if (!__DEV__) return null;
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Text style={styles.line}>
        {snapshot.state} · {snapshot.fps.toFixed(0)}fps · infer{' '}
        {snapshot.inferenceMs.toFixed(0)}ms
      </Text>
      {CHAIN_IDS.map((id, i) => (
        <Text key={id} style={styles.line}>
          {bar(snapshot.chainReliability[i] ?? 0)} {(snapshot.chainReliability[i] ?? 0).toFixed(2)}{' '}
          {id}
        </Text>
      ))}
      <Text style={styles.line}>
        bodyUnit: {snapshot.bodyUnit === null ? '—' : snapshot.bodyUnit.toFixed(4)}
      </Text>
      <Pressable onPress={onToggleRecording} style={styles.button}>
        <Text style={styles.buttonText}>
          {snapshot.recording
            ? `■ stop rec (${snapshot.recordedFrames})`
            : '● record landmarks'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    padding: 8,
  },
  line: {
    color: '#9FE2BF',
    fontFamily: 'monospace' as const,
    fontSize: 11,
    lineHeight: 15,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#1E2B25',
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#E8F4EA',
    fontSize: 12,
  },
});
