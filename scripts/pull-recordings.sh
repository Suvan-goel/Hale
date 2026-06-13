#!/usr/bin/env bash
# Pulls dev landmark recordings off a connected Android device/emulator into
# ./recordings/ (used by the noise-floor experiment; see
# docs/noise-floor-report.md).
set -euo pipefail

PKG="com.suvangoel.longevityapp"
DEST="$(dirname "$0")/../recordings"
mkdir -p "$DEST"

if ! adb get-state >/dev/null 2>&1; then
  echo "no Android device connected" >&2
  exit 1
fi

if ! adb shell run-as "$PKG" ls files/recordings >/dev/null 2>&1; then
  echo "no recordings directory in $PKG (record a session first: dev overlay → REC)" >&2
  exit 1
fi

adb shell run-as "$PKG" tar -cf - -C files recordings | tar -xf - -C "$DEST" --strip-components=1
echo "pulled into $DEST:"
ls -l "$DEST"/*.jsonl
