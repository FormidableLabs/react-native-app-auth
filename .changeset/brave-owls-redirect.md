---
"react-native-app-auth": patch
---

Stop native OAuth endpoint redirects when custom headers are present so credential-bearing headers cannot be forwarded to another origin.
