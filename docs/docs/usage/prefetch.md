---
sidebar_position: 10
---

# Android Prefetch

This will prefetch the authorization service configuration. Invoking this function is optional and will speed up calls to authorize. This is only supported on Android.

```js
import { prefetchConfiguration } from 'react-native-app-auth';

const config = {
  warmAndPrefetchChrome: true,
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  scopes: ['<YOUR_SCOPES_ARRAY>'],
};

try {
  await prefetchConfiguration(config);
} catch (error) {
  // Prefetch is optional. authorize() can retry discovery when needed.
}
```

The promise resolves only after configuration is available and rejects when discovery fails.
Cached issuers resolve immediately; prefetching a different issuer fetches its own configuration.
Calls on iOS remain a no-op. Handle rejection if you previously called this method without awaiting it.
