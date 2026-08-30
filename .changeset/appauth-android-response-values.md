---
"react-native-app-auth": patch
---

Decode JSON objects and arrays once, preserve nested null values, accept null native values without a crash, and retain scalar/malformed strings. Iterate map entries directly and share the base authorization response serializer when adding a PKCE verifier.
