---
'react-native-app-auth': patch
---

#1063 Updated getCustomBrowser: in RNAppAuth.m to explicitly check the return value of browser. If the value is not in the dictionary, it will return nil to trigger an ephemeral session.
