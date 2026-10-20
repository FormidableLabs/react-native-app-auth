---
"react-native-app-auth": patch
---

Reject null/array custom header groups and array additionalHeaders with the normal configuration error. Validate finite non-negative timeouts before native conversion. Use every() instead of allocating filtered arrays for header value checks.
