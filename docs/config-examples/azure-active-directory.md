# Azure Active Directory

Azure Active directory has two OAuth endpoints - [v1 and v2](https://docs.microsoft.com/en-us/azure/active-directory/develop/azure-ad-endpoint-comparison). Ideally, you'd want to use v2, but it has [some limitations](https://docs.microsoft.com/en-us/azure/active-directory/develop/azure-ad-endpoint-comparison#limitations), e.g. if your application relies on SAML, you'll have to use v1.

## V1

The main difference between v1 and v2 is that v2 uses _resources_ and v2 uses _scopes_ for access management.

V1 [does not specify a revocation endpoint](https://docs.microsoft.com/en-us/azure/active-directory/active-directory-configurable-token-lifetimes#access-tokens) because the access token are not revokable. Therefore `revoke` functionality doesn't work.

See the [Azure docs on requesting an access token](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-protocols-oauth-code#request-an-authorization-code) for more info on additional parameters.

Please Note:

* The [Azure docs](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-protocols-oauth-code#request-an-authorization-code) recommend `'urn:ietf:wg:oauth:2.0:oob'` as the `redirectUrl`.
* `Scopes` is ignored.
* `additionalParameters.resource` may be required based on the tenant settings.

```js
const config = {
  issuer: 'https://login.microsoftonline.com/your-tenant-id',
  clientId: 'your-client-id',
  redirectUrl: 'urn:ietf:wg:oauth:2.0:oob',
  additionalParameters: {
    resource: 'your-resource'
  }
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});
```

## V2

The V2 endpoint follows the standard OAuth protocol with scopes. Detailed documentation [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-overview).

```js
const config = {
  issuer: 'https://login.microsoftonline.com/your-tenant-id/v2.0',
  clientId: 'your-client-id',
  redirectUrl: 'urn:ietf:wg:oauth:2.0:oob',
  scopes: ['openid', 'profile', 'email', 'offline_access']
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});
```
