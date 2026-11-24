---
'react-native-app-auth': patch
---

Fix `expo prebuild` on Expo SDK 58. The SDK 58 AppDelegate template has no `application(_:open:options:)` or `application(_:continue:restorationHandler:)`, so the config plugin now adds them, with the AppAuth redirect handling, instead of failing. On SDK 58 and later, `expo-build-properties` with `ios.enableSceneSupport` is no longer needed.
