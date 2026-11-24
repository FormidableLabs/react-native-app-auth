---
'react-native-app-auth': minor
---

Support Expo SDK 58. On iOS, an Expo AppDelegate subscriber now forwards redirect URLs and universal links to the library, so the config plugin no longer edits `AppDelegate.swift` or adds a bridging header. This fixes `expo prebuild` on SDK 58, whose AppDelegate template has no URL callbacks (#1158). Expo autolinking adds the subscriber's `ExpoAdapterRNAppAuth` pod; bare React Native apps are unchanged and keep their manual AppDelegate setup. On SDK 58 and later, `expo-build-properties` with `ios.enableSceneSupport` is no longer needed. After you upgrade an Expo app, run `npx expo prebuild --clean` to remove the `AppDelegate.swift` and bridging-header changes that the earlier plugin made.
