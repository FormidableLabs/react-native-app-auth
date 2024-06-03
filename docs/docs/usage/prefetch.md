---
sidebar_position: 8
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

prefetchConfiguration(config);
```
