# Coinbase

Create a new OAuth application in the [console](https://www.coinbase.com/oauth/applications/new).

After the application is created, note down the clientId and secret (the secret will only be shown once. If you forgot to take note of it, you'll have to recreate your OAuth application).

```js
const config = {
  clientId: '<your-client-id>',
  clientSecret: '<your-client-secret>',
  redirectUrl: 'myapp://redirect', // this can be any valid uri as long as it's the same as what you configured
  scopes: ['wallet:accounts:read'], // https://developers.coinbase.com/docs/wallet/permissions
  serviceConfiguration: {
    authorizationEndpoint: 'https://www.coinbase.com/oauth/authorize',
    tokenEndpoint: 'https://api.coinbase.com/oauth/token',
    revocationEndpoint: 'https://api.coinbase.com/oauth/revoke',
  },
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});

// Revoke token
await revoke(config, {
  tokenToRevoke: refreshedState.refreshToken,
});
```
