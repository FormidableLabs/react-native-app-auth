---
"react-native-app-auth": patch
---

Keep each iOS request on its originating URL session so concurrent OAuth calls cannot mix additional headers or timeout settings.
