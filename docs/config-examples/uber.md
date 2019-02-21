# Uber

Uber provides an OAuth 2.0 endpoint for logging in with a Uber user's credentials. You'll need to first [create an Uber OAuth application here](https://developer.uber.com/docs/riders/guides/authentication/introduction).

Please note:

* Uber does not provide a OIDC discovery endpoint, so `serviceConfiguration` is used instead.
* Uber OAuth requires a [client secret](#note-about-client-secrets).

```js
const config = {
  clientId: 'your-client-id-generated-by-uber',
  clientSecret: 'your-client-secret-generated-by-uber',
  redirectUrl: 'com.whatever.url.you.configured.in.uber.oauth://redirect', //note: path is required
  scopes: ['profile', 'delivery'], // whatever scopes you configured in Uber OAuth portal
  serviceConfiguration: {
    authorizationEndpoint: 'https://login.uber.com/oauth/v2/authorize',
    tokenEndpoint: 'https://login.uber.com/oauth/v2/token',
    revocationEndpoint: 'https://login.uber.com/oauth/v2/revoke'
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
