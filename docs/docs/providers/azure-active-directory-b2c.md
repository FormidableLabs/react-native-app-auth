# Azure Active Directory B2C

Detailed documentation [here](https://docs.microsoft.com/en-us/azure/active-directory-b2c/openid-connect).

```js
const config = {
  issuer: 'https://<TENANT_NAME>.b2clogin.com/<TENANT_NAME>.onmicrosoft.com/<USER_FLOW_NAME>/v2.0',
  clientId: '<APPLICATION_ID>',
  redirectUrl: 'com.myapp://redirect/url/', // the redirectUrl must end with a slash
  scopes: ['openid', 'offline_access'],
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});
```
