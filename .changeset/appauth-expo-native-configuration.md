---
"react-native-app-auth": patch
---

Write callback schemes through Info.plist modResults, deduplicate them, and skip missing schemes. Use the standard Android Gradle mod, preserve unrelated placeholders, and update one generated assignment at the end of defaultConfig. Resolve each app target build configuration’s actual bridging header instead of recursively editing an arbitrary .h file; configure a new header for both Debug and Release when needed. Support final Swift AppDelegate declarations and missing factory properties, fail clearly on unsupported entry points, and detect installed Expo versions for workspace dependencies.
