import { NativeModule, requireNativeModule } from 'expo';

import type { PermissionResponse } from './ExpoPoseDetection.types';

declare class ExpoPoseDetectionNativeModule extends NativeModule {
  requestCameraPermissionsAsync(): Promise<PermissionResponse>;
  getCameraPermissionsAsync(): Promise<PermissionResponse>;
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
