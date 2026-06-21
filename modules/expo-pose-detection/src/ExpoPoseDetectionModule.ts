import { NativeModule, requireNativeModule } from 'expo';

import type { CameraFacing, PermissionResponse } from './ExpoPoseDetection.types';

declare class ExpoPoseDetectionNativeModule extends NativeModule {
  requestCameraPermissionsAsync(): Promise<PermissionResponse>;
  getCameraPermissionsAsync(): Promise<PermissionResponse>;
  isCameraAvailableAsync?(cameraFacing: CameraFacing): Promise<boolean>;
}

const ExpoPoseDetectionModule = requireNativeModule<ExpoPoseDetectionNativeModule>(
  'ExpoPoseDetection'
);

export default ExpoPoseDetectionModule;

export function requestCameraPermissionsAsync(): Promise<PermissionResponse> {
  return ExpoPoseDetectionModule.requestCameraPermissionsAsync();
}

export function getCameraPermissionsAsync(): Promise<PermissionResponse> {
  return ExpoPoseDetectionModule.getCameraPermissionsAsync();
}

export function isCameraAvailableAsync(cameraFacing: CameraFacing = 'front'): Promise<boolean> {
  if (typeof ExpoPoseDetectionModule.isCameraAvailableAsync !== 'function') {
    return Promise.resolve(true);
  }
  return ExpoPoseDetectionModule.isCameraAvailableAsync(cameraFacing);
}
