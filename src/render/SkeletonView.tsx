import * as React from 'react';

import {
  PoseAvatarRenderer,
  type PoseAvatarRendererHandle,
  type PoseAvatarRendererProps,
} from './PoseAvatarRenderer';

export type SkeletonViewHandle = PoseAvatarRendererHandle;

/** Compatibility facade for existing camera screens. */
export const SkeletonView = React.forwardRef<SkeletonViewHandle, PoseAvatarRendererProps>(
  function SkeletonView(props, ref) {
    return <PoseAvatarRenderer ref={ref} {...props} />;
  }
);
