---
'react-native-app-auth': patch
---

Fix iOS sending `NSNull` as the OAuth `state` when `additionalParameters.state` is null.
