# Identity Server 4

This library supports authenticating for Identity Server 4 out of the box. Some quirks:

1. In order to enable refresh tokens, `offline_access` must be passed in as a scope variable
2. In order to revoke the access token, we must sent client id in the method body of the request.
   This is not part of the OAuth spec.

```js
// Note "offline_access" scope is required to get a refresh token
const config = {
  issuer: 'https://demo.identityserver.io',
  clientId: 'native.code',
  redirectUrl: 'io.identityserver.demo:/oauthredirect',
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
  RequireClientSecret = false,
  RedirectUris = { "io.identityserver.demo:/oauthredirect" },
  AllowedGrantTypes = GrantTypes.Code,
  RequirePkce = true,
  AllowedScopes = { "openid", "profile" },
  AllowOfflineAccess = true
};
```

</details>
