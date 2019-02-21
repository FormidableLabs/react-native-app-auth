# Fitbit

Fitbit provides an OAuth 2.0 endpoint for logging in with a Fitbit user's credentials. You'll need to first [register your Fitbit application here](https://dev.fitbit.com/apps/new).

Please note:

* Fitbit does not provide a OIDC discovery endpoint, so `serviceConfiguration` is used instead.
* Fitbit OAuth requires a [client secret](#note-about-client-secrets).

```js
const config = {
  clientId: 'your-client-id-generated-by-fitbit',
  clientSecret: 'your-client-secret-generated-by-fitbit',
  redirectUrl: 'com.whatever.url.you.configured.in.fitbit.oauth://redirect', //note: path is required
  scopes: ['activity', 'sleep'],
  serviceConfiguration: {
    authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
    tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
    revocationEndpoint: 'https://api.fitbit.com/oauth2/revoke'
  }
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});

// Revoke token
await revoke(config, {
  tokenToRevoke: refreshedState.refreshToken
});
```
