# Identity Server 3

This library supports authenticating with Identity Server 3. The only difference from
Identity Server 4 is that it requires a `clientSecret` and there is no way to opt out of it.

```js
// You must include a clientSecret
const config = {
  issuer: 'your-identityserver-url',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUrl: 'com.your.app.name:/oauthredirect',
  scopes: ['openid', 'profile', 'offline_access']
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});

// Revoke token, note that Identity Server expects a client id on revoke
await revoke(config, {
  tokenToRevoke: refreshedState.refreshToken,
  sendClientId: true
});
```

<details>
  <summary>Example server configuration</summary>

```
var client = new Client
{
  ClientId = "native.code",
  ClientName = "Native Client (Code with PKCE)",
  Flow = Flows.AuthorizationCodeWithProofKey,
  RedirectUris = { "com.your.app.name:/oauthredirect" },
  ClientSecrets = new List<Secret> { new Secret("your-client-secret".Sha256()) },
  AllowAccessToAllScopes = true
};
```

</details>
