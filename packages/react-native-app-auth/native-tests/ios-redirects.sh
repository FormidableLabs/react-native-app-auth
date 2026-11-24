#!/bin/bash
set -euo pipefail

package_dir="$(cd "$(dirname "$0")/.." && pwd)"
test_dir="$(mktemp -d "${TMPDIR:-/tmp}/rnaa-ios-redirects.XXXXXX")"
trap 'rm -rf "$test_dir"' EXIT

xcrun clang -fobjc-arc -framework Foundation -I "$package_dir/ios" \
  "$package_dir/ios/RNAppAuthRedirects.m" "$package_dir/native-tests/ios-redirects.m" \
  -o "$test_dir/redirect-tests"
"$test_dir/redirect-tests"
