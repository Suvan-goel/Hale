#!/usr/bin/env bash
# Downloads MediaPipe PoseLandmarker model binaries into the native module.
# Models are gitignored — run this once after clone, BEFORE `npx expo prebuild`
# / `pod install`, or the app will fail at runtime with model-not-bundled.
set -euo pipefail

cd "$(dirname "$0")/.."

BASE_URL="https://storage.googleapis.com/mediapipe-models/pose_landmarker"
ANDROID_ASSETS="modules/expo-pose-detection/android/src/main/assets"
IOS_ASSETS="modules/expo-pose-detection/ios/assets"

mkdir -p "$ANDROID_ASSETS" "$IOS_ASSETS"

download() {
  local variant="$1" # lite | full
  local file="pose_landmarker_${variant}.task"
  local url="$BASE_URL/pose_landmarker_${variant}/float16/latest/$file"
  if [[ -f "$ANDROID_ASSETS/$file" && -f "$IOS_ASSETS/$file" ]]; then
    echo "✓ $file already present"
    return
  fi
  echo "Downloading $file ..."
  curl -fsSL "$url" -o "$ANDROID_ASSETS/$file"
  cp "$ANDROID_ASSETS/$file" "$IOS_ASSETS/$file"
  echo "✓ $file → android assets + ios assets"
}

# V1 defaults to full for stronger landmark quality, while keeping lite bundled
# for explicit overrides and profiling comparisons.
download lite
download full

echo "Done."
