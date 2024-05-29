# Asgardeo

To add authentication to your app using Asgardeo, you will first need to [create an application](https://wso2.com/asgardeo/docs/guides/applications/register-mobile-app/) in the Asgardeo console. If you don't have an Asgardeo account, [you can signup for one free](https://asgardeo.io/signup).

After creating an application, take note of the configuration values listed in the **Quick Start** and **Info** tabs. You will be using those values as follows.

```js
export const config = {
  issuer: 'https://api.asgardeo.io/t/<your_org_name>/oauth2/token',
  clientId: '<your_application_id>',
  redirectUrl: '<your_appAuthRedirectScheme>://example',
  scopes: ['openid', 'profile'],
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

// End session
await logout(config, {
  idToken: authState.idToken,
  postLogoutRedirectUrl: '<your_appAuthRedirectScheme>:/logout',
});
```
