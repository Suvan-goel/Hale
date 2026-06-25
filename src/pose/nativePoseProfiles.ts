import type {
  AndroidPoseAnalysisResolution,
  AndroidPosePipelineMode,
  AndroidPoseRotationMode,
} from '../../modules/expo-pose-detection';

type AndroidPoseProfileProps = {
  androidPipelineMode: AndroidPosePipelineMode;
  androidRotationMode: AndroidPoseRotationMode;
  androidAnalysisResolution: AndroidPoseAnalysisResolution;
};

export const ANDROID_VIDEO_ROT_640_POSE_PROFILE: AndroidPoseProfileProps = {
  androidPipelineMode: 'full-video-sync',
  androidRotationMode: 'rotated-bitmap',
  androidAnalysisResolution: '640x480',
};
