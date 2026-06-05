---
'react-native-app-auth': minor
---

iOS: natively intercept https (universal link) redirect URIs on iOS 17.4+ using the ASWebAuthenticationSession https callback, so the authorization flow no longer depends on universal-link activation from inside the auth session — which is not triggered by server redirects and sporadically leaves authorize() pending forever (#987, #932).
