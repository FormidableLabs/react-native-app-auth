#!/bin/bash
set -euo pipefail

simulator_id="${1:?Pass the UDID of a booted iOS simulator}"
package_dir="$(cd "$(dirname "$0")/.." && pwd)"
appauth_dir="${APP_AUTH_SOURCE_DIR:-$package_dir/../../examples/demo/ios/Pods/AppAuth}"
test_dir="$(mktemp -d "${TMPDIR:-/tmp}/rnaa-ios-session.XXXXXX")"
trap 'rm -rf "$test_dir"' EXIT
sdk_path="$(xcrun --sdk iphonesimulator --show-sdk-path)"
architecture="$(uname -m)"

if [[ ! -f "$appauth_dir/Sources/AppAuthCore/OIDAuthState.m" ]]; then
  echo 'Install the demo CocoaPods first, or set APP_AUTH_SOURCE_DIR to AppAuth sources.' >&2
  exit 1
fi

# Only React bridge declarations are stubbed. Compile the real RNAppAuth and AppAuth code.
mkdir -p "$test_dir/React" "$test_dir/SessionTests.app"
cat > "$test_dir/React/RCTBridgeModule.h" <<'HEADER'
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
typedef void (^RCTPromiseResolveBlock)(id result);
typedef void (^RCTPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);
@protocol RCTBridgeModule <NSObject>
@end
#define RCT_EXPORT_MODULE(...)
#define RCT_REMAP_METHOD(js_name, ...) - (void)__VA_ARGS__
HEADER
touch "$test_dir/React/RCTLog.h" "$test_dir/React/RCTConvert.h"

cat > "$test_dir/SessionTests.app/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>com.rnappauth.session-tests</string>
<key>CFBundleExecutable</key><string>SessionTests</string>
<key>CFBundleName</key><string>SessionTests</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>1.0</string>
<key>MinimumOSVersion</key><string>13.0</string>
<key>UIApplicationSceneManifest</key><dict>
<key>UIApplicationSupportsMultipleScenes</key><false/>
<key>UISceneConfigurations</key><dict>
<key>UIWindowSceneSessionRoleApplication</key><array><dict>
<key>UISceneConfigurationName</key><string>Default</string>
<key>UISceneDelegateClassName</key><string>SessionSceneDelegate</string>
</dict></array></dict></dict>
</dict></plist>
PLIST

appauth_sources=("$appauth_dir"/Sources/AppAuthCore/*.m "$appauth_dir"/Sources/AppAuth/iOS/*.m)
xcrun clang -fobjc-arc -fblocks -Wno-deprecated-declarations \
  -target "$architecture-apple-ios13.0-simulator" -isysroot "$sdk_path" \
  -framework UIKit -framework Foundation -framework SafariServices \
  -framework AuthenticationServices -framework Security \
  -I "$test_dir" -I "$package_dir/ios" -I "$appauth_dir/Sources" \
  -I "$appauth_dir/Sources/AppAuthCore" -I "$appauth_dir/Sources/AppAuth/iOS" \
  "${appauth_sources[@]}" "$package_dir/ios/RNAppAuth.m" \
  "$package_dir/ios/RNAppAuthPresentation.m" "$package_dir/native-tests/ios-session.m" \
  -o "$test_dir/SessionTests.app/SessionTests"

xcrun simctl uninstall "$simulator_id" com.rnappauth.session-tests >/dev/null 2>&1 || true
xcrun simctl install "$simulator_id" "$test_dir/SessionTests.app"
xcrun simctl launch --console "$simulator_id" com.rnappauth.session-tests
data_dir="$(xcrun simctl get_app_container "$simulator_id" com.rnappauth.session-tests data)"
cat "$data_dir/Documents/session-results.txt"
