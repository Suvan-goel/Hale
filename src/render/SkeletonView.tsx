/**
 * Skeleton-on-black renderer. Imperative by design: the frame path calls
 * update() at ~30fps, which pokes new path strings into the three SVG <Path>
 * nodes via setNativeProps — zero React re-renders, zero state. (Product law:
 * never show camera video; the skeleton IS the UI.)
 */

import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { PipelineFrameOutput } from '../pose/pipeline';
import {
  buildSkeletonPaths,
  clearSkeletonPaths,
  emptySkeletonPaths,
} from './skeletonGeometry';

export interface SkeletonViewHandle {
  /** Feed one pipeline output frame. Safe to call at full frame rate. */
  update(output: PipelineFrameOutput, sourceAspect: number): void;
}

interface Props {
  mirrored?: boolean;
}

const BRIGHT = '#9FE2BF';
const DIM = '#3A4A42';

export const SkeletonView = React.forwardRef<SkeletonViewHandle, Props>(
  function SkeletonView({ mirrored = true }, ref) {
    const brightRef = React.useRef<React.ComponentRef<typeof Path>>(null);
    const dimRef = React.useRef<React.ComponentRef<typeof Path>>(null);
    const jointsRef = React.useRef<React.ComponentRef<typeof Path>>(null);
    const sizeRef = React.useRef({ width: 0, height: 0 });
    const pathsRef = React.useRef(emptySkeletonPaths());
    const visibleRef = React.useRef(true);

    React.useImperativeHandle(ref, () => ({
      update(output: PipelineFrameOutput, sourceAspect: number) {
        const paths = pathsRef.current;
        const { width, height } = sizeRef.current;
        const show =
          output.frame.hasPose &&
          width > 0 &&
          (output.state === 'tracking' || output.state === 'warmup');
        if (show) {
          buildSkeletonPaths(
            output.frame,
            output.chainReliability,
            { width, height, sourceAspect, mirrored },
            paths
          );
          visibleRef.current = true;
        } else {
          if (!visibleRef.current) return; // already cleared — skip bridge calls
          clearSkeletonPaths(paths);
          visibleRef.current = false;
        }
        brightRef.current?.setNativeProps({ d: paths.bright || 'M-9-9' });
        dimRef.current?.setNativeProps({ d: paths.dim || 'M-9-9' });
        jointsRef.current?.setNativeProps({ d: paths.joints || 'M-9-9' });
      },
    }));

    return (
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        onLayout={(e) => {
          sizeRef.current = {
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          };
        }}
      >
        <Svg style={StyleSheet.absoluteFill}>
          <Path ref={dimRef} d="M-9-9" stroke={DIM} strokeWidth={6} strokeLinecap="round" />
          <Path
            ref={brightRef}
            d="M-9-9"
            stroke={BRIGHT}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <Path ref={jointsRef} d="M-9-9" fill={BRIGHT} />
        </Svg>
      </View>
    );
  }
);
