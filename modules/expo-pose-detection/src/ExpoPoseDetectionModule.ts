import { NativeModule, requireNativeModule } from 'expo';

import type { AndroidNavigationMode, CameraFacing, PermissionResponse } from './ExpoPoseDetection.types';

declare class ExpoPoseDetectionNativeModule extends NativeModule {
  requestCameraPermissionsAsync(): Promise<PermissionResponse>;
  getCameraPermissionsAsync(): Promise<PermissionResponse>;
  isCameraAvailableAsync?(cameraFacing: CameraFacing): Promise<boolean>;
  getAndroidNavigationModeAsync?(): Promise<AndroidNavigationMode>;
  setAndroidNavigationBarVisibleAsync?(visible: boolean): Promise<void>;
}

const unavailablePermissionResponse: PermissionResponse = {
  status: 'undetermined',
  granted: false,
  canAskAgain: false,
};

const fallbackExpoPoseDetectionModule = {
  requestCameraPermissionsAsync: () => Promise.resolve(unavailablePermissionResponse),
  getCameraPermissionsAsync: () => Promise.resolve(unavailablePermissionResponse),
  isCameraAvailableAsync: () => Promise.resolve(false),
  getAndroidNavigationModeAsync: () => Promise.resolve('unknown' as AndroidNavigationMode),
  setAndroidNavigationBarVisibleAsync: () => Promise.resolve(),
} as unknown as ExpoPoseDetectionNativeModule;

function requireOptionalExpoPoseDetectionModule(): ExpoPoseDetectionNativeModule {
  try {
    return requireNativeModule<ExpoPoseDetectionNativeModule>('ExpoPoseDetection');
  } catch {
    return fallbackExpoPoseDetectionModule;
  }
}

const ExpoPoseDetectionModule = requireOptionalExpoPoseDetectionModule();

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

export function getAndroidNavigationModeAsync(): Promise<AndroidNavigationMode> {
  if (typeof ExpoPoseDetectionModule.getAndroidNavigationModeAsync !== 'function') {
    return Promise.resolve('unknown');
  }
  return ExpoPoseDetectionModule.getAndroidNavigationModeAsync();
}

export function setAndroidNavigationBarVisibleAsync(visible: boolean): Promise<void> {
  if (typeof ExpoPoseDetectionModule.setAndroidNavigationBarVisibleAsync !== 'function') {
    return Promise.resolve();
  }
  return ExpoPoseDetectionModule.setAndroidNavigationBarVisibleAsync(visible);
}
