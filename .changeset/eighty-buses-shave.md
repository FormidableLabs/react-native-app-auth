---
'react-native-app-auth': patch
---

Fix Android Custom Tabs service binding leak. `AuthorizationService` binds to the browser's `CustomTabsService` in its constructor and was never disposed, so every `refresh`, `register` and code exchange leaked a `ServiceConnection`. After roughly 1000 calls within a single process, Android refused further binds with `IllegalStateException: Too many bind requests(999+)`, permanently breaking token refresh until the app was force-stopped. The warm-up connection created by `prefetchConfiguration({ warmAndPrefetchChrome: true })` was also never unbound.
