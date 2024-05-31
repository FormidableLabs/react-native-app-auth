---
sidebar_position: 5
---

# Revoke Token

This method will revoke a token. The tokenToRevoke can be either an accessToken or a refreshToken

```js
import { revoke } from 'react-native-app-auth';

const config = {
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  scopes: ['<YOUR_SCOPES_ARRAY>'],
};

const result = await revoke(config, {
  tokenToRevoke: `<TOKEN_TO_REVOKE>`,
  includeBasicAuth: true,
  sendClientId: true,
});
```
