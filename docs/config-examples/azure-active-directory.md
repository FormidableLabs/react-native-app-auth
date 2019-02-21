# Azure Active Directory

Azure Active Directory [does not specify a revocation endpoint](https://docs.microsoft.com/en-us/azure/active-directory/active-directory-configurable-token-lifetimes#access-tokens) because the access token are not revokable. Therefore `revoke` functionality doesn't work.

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
  scopes: [], // ignored by Azure AD
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
