#!/bin/bash
set -euo pipefail

simulator_id="${1:?Pass the UDID of a booted iOS simulator}"
package_dir="$(cd "$(dirname "$0")/.." && pwd)"
test_dir="$(mktemp -d "${TMPDIR:-/tmp}/rnaa-ios-presentation.XXXXXX")"
sdk_path="$(xcrun --sdk iphonesimulator --show-sdk-path)"
architecture="$(uname -m)"
trap 'rm -rf "$test_dir"' EXIT

# Check availability independently of the runtime simulator's OS version.
for minimum_ios in 10.0 12.0 14.0 15.0; do
  xcrun clang -fsyntax-only -fobjc-arc -Werror=unguarded-availability-new \
    -target "$architecture-apple-ios$minimum_ios-simulator" -isysroot "$sdk_path" \
    "$package_dir/ios/RNAppAuthPresentation.m"
done

mkdir "$test_dir/PresenterTests.app"
cat > "$test_dir/PresenterTests.app/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>com.rnappauth.presenter-tests</string>
<key>CFBundleExecutable</key><string>PresenterTests</string>
<key>CFBundleName</key><string>PresenterTests</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>1.0</string>
<key>MinimumOSVersion</key><string>13.0</string>
<key>UIApplicationSceneManifest</key><dict>
<key>UIApplicationSupportsMultipleScenes</key><false/>
<key>UISceneConfigurations</key><dict>
<key>UIWindowSceneSessionRoleApplication</key><array><dict>
<key>UISceneConfigurationName</key><string>Default</string>
<key>UISceneDelegateClassName</key><string>RunnerSceneDelegate</string>
</dict></array></dict></dict>
</dict></plist>
PLIST

xcrun clang -fobjc-arc -target "$architecture-apple-ios13.0-simulator" \
  -isysroot "$sdk_path" -framework UIKit -framework Foundation \
  -I "$package_dir/ios" "$package_dir/ios/RNAppAuthPresentation.m" \
  "$package_dir/native-tests/ios-presentation.m" \
  -o "$test_dir/PresenterTests.app/PresenterTests"
xcrun simctl uninstall "$simulator_id" com.rnappauth.presenter-tests || true
xcrun simctl install "$simulator_id" "$test_dir/PresenterTests.app"
xcrun simctl launch --console "$simulator_id" com.rnappauth.presenter-tests
data_dir="$(xcrun simctl get_app_container "$simulator_id" com.rnappauth.presenter-tests data)"
cat "$data_dir/Documents/presenter-results.txt"
