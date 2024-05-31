---
sidebar_position: 3
---

# Refresh Token

This method will refresh the accessToken using the refreshToken. Some auth providers will also give
you a new refreshToken

```js
import { refresh } from 'react-native-app-auth';

const config = {
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  scopes: ['<YOUR_SCOPES_ARRAY>'],
};

const result = await refresh(config, {
  refreshToken: `<REFRESH_TOKEN>`,
});
```
