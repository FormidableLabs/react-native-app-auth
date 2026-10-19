---
"react-native-app-auth": patch
---

Clear Android custom request headers before parsing each call so omitted header groups cannot reuse credentials from an earlier provider.
