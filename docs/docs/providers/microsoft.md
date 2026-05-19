# Microsoft

1. Supplying "issuer" fails, because Microsoft returns `issuer` with the literal string `https://login.microsoftonline.com/{tenantid}/v2.0` when `https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration` is queried.. We need to manually specify `serviceConfiguration`.

2. `REDIRECT_URL` varies based on platform:

   - iOS: msauth.com.example.app://auth/
   - Android: com.example.app://msauth/`<SIGNATURE_HASH>`/

3. Microsoft does not have. revocationEndpoint.

```js
const config = {
  serviceConfiguration: {
    authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  },
  clientId: '<APPLICATION_ID>',
  redirectUrl: '<REDIRECT_URL>',
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});
```
