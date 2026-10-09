---
"react-native-app-auth": patch
---

Fix an iOS crash ("An OAuth redirect was sent to a OIDExternalUserAgentSession after it already completed") by not keeping an authorization or logout session that completed synchronously, and by forwarding at most one redirect to each session.
