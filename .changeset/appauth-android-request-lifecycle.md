---
"react-native-app-auth": patch
---

Snapshot token headers, TLS policy, timeout, parameters, client authentication, PKCE verifier and promise per interactive flow. Keep refresh/registration independent, reject overlapping browser flows without replacing the first, and settle late token failures on their originating promise. Replace the blocking/global prefetch latch with per-issuer asynchronous completion; expose native prefetch completion and errors through the JS promise.
