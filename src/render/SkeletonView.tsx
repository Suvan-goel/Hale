import * as React from 'react';

import {
  PoseAvatarRenderer,
  type PoseAvatarRendererHandle,
  type PoseAvatarRendererProps,
} from './PoseAvatarRenderer';

export type SkeletonViewHandle = PoseAvatarRendererHandle;

// Temporary latency test: make live recording overlays use only the raw MediaPipe skeleton.
const LATENCY_TEST_RENDERER_MODE: PoseAvatarRendererProps['mode'] = 'mediapipe_skeleton';

/** Compatibility facade for existing camera screens. */
export const SkeletonView = React.forwardRef<SkeletonViewHandle, PoseAvatarRendererProps>(
  function SkeletonView(props, ref) {
    return (
      <PoseAvatarRenderer
        ref={ref}
        {...props}
        mode={props.mode ?? LATENCY_TEST_RENDERER_MODE}
      />
    );
  }
);
