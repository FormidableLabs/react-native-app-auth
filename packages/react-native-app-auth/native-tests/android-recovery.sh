#!/bin/bash
set -euo pipefail

device_id="${1:?Pass the serial of a booted Android emulator}"
package_dir="$(cd "$(dirname "$0")/.." && pwd)"
demo_dir="$package_dir/../../examples/demo/android"
architecture="$(adb -s "$device_id" shell getprop ro.product.cpu.abi | tr -d '\r')"

(cd "$demo_dir" && ./gradlew :app:assembleDebug :app:assembleDebugAndroidTest \
  -PreactNativeArchitectures="$architecture" -PreactNativeDevServerPort="${RCT_METRO_PORT:-8081}")
adb -s "$device_id" install --no-streaming -r "$demo_dir/app/build/outputs/apk/debug/app-debug.apk"
adb -s "$device_id" install --no-streaming -r "$demo_dir/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk"
test_output="$(adb -s "$device_id" shell am instrument -w com.example.test/com.example.RNAppAuthRecoveryInstrumentation)"
printf '%s\n' "$test_output"
# am instrument can exit zero even when the runner reports a failure.
printf '%s\n' "$test_output" | grep -Eq 'All [1-9][0-9]* Android recovery cases passed\.'
