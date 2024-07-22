---
'react-native-app-auth': minor
'rnaa-demo': minor
---

Added [react-native-macOS](https://github.com/microsoft/react-native-macos) support. See `examples/demo/README.md` for how to run the demo app. To consume in a `react-native-macos` project, install the npm package usual (e.g. `yarn add react-native-app-auth`) and just make sure to re-install pods (e.g. `cd macos && pod install`). The macOS implementation implements all the same features as iOS, including `iosPrefersEphemeralSession`, but excluding `iosCustomBrowser`, which is implicitly treated as `null`.
