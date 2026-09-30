---
sidebar_position: 7
---

# Revoke Token

This method will revoke a token. The tokenToRevoke can be either an accessToken or a refreshToken

```js
import { revoke } from 'react-native-app-auth';

const config = {
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  // Only if your provider requires Basic client authentication:
  // clientSecret: '<YOUR_CLIENT_SECRET>',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  scopes: ['<YOUR_SCOPES_ARRAY>'],
};

const result = await revoke(config, {
  tokenToRevoke: `<TOKEN_TO_REVOKE>`,
  includeBasicAuth: false,
  sendClientId: true,
});
```

Set `includeBasicAuth` only when required by your provider; it uses `clientId` and `clientSecret`
(an omitted secret is empty). Embedded client secrets cannot be kept confidential in a native app;
see [Client Secrets](/docs/client-secrets).

Pass raw token and credential values, not pre-encoded strings. The library applies form encoding to
the request body and Basic authentication components, including reserved characters and Unicode.
An issuer's trailing slash is handled when requesting discovery. Failed discovery HTTP responses reject
before revocation is attempted, and revocation network failures retain the original error as `cause`.

The runtime result is the fetch response. Inspect its `ok` or `status` to confirm revocation succeeded;
a resolved HTTP error response does not mean the provider revoked the token.
