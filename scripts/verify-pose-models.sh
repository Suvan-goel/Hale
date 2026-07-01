#!/usr/bin/env bash
# Fails fast when MediaPipe model assets are missing from the local Expo module.
# EAS cloud builds run this after scripts/download-models.sh so missing ignored
# binaries do not become confusing runtime "camera unavailable" failures.
set -euo pipefail

cd "$(dirname "$0")/.."

ANDROID_ASSETS="modules/expo-pose-detection/android/src/main/assets"
IOS_ASSETS="modules/expo-pose-detection/ios/assets"
MIN_BYTES=1000000

missing=0

check_model() {
  local variant="$1"
  local file="pose_landmarker_${variant}.task"
  local android_file="$ANDROID_ASSETS/$file"
  local ios_file="$IOS_ASSETS/$file"

  for path in "$android_file" "$ios_file"; do
    if [[ ! -f "$path" ]]; then
      echo "Missing MediaPipe model asset: $path" >&2
      missing=1
      continue
    fi

    local bytes
    bytes="$(wc -c < "$path" | tr -d '[:space:]')"
    if [[ "$bytes" -lt "$MIN_BYTES" ]]; then
      echo "MediaPipe model asset is unexpectedly small ($bytes bytes): $path" >&2
      missing=1
    fi
  done

  if [[ -f "$android_file" && -f "$ios_file" ]] && ! cmp -s "$android_file" "$ios_file"; then
    echo "Android/iOS MediaPipe model assets differ for $file" >&2
    missing=1
  fi
}

check_model lite
check_model full

if [[ "$missing" -ne 0 ]]; then
  echo "Run ./scripts/download-models.sh before building." >&2
  exit 1
fi

echo "Pose model assets verified."
