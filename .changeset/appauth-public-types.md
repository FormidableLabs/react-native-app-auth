---
"react-native-app-auth": patch
---

Add registration timeout, logout custom-browser options and revocation clientSecret to the declarations. Correct revoke() from Promise<void> to the fetch Response it already returns at runtime.
