---
"react-native-app-auth": patch
---

Fix Expo config plugin support for Swift AppDelegate templates that omit `public` before the AppDelegate class declaration, and correctly extract URL schemes from AppAuth redirect URLs that use a single slash.
