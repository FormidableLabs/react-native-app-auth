# Microsoft Entra ID

If you're using Microsoft Identity platform and want to add App Auth to your React Native application, you'll need an Entra application to authorize against.

Microsoft offers mupltiple different PLatform configurations you could setup for your application. In this example, we are using the `Mobile and desktop applications` platform configuration.

You can find detailed instructions on registering a new Entra application [here](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app?tabs=certificate).

NOTES:

- Microsoft Entra ID does not have a `revocationEndpoint`.
- Application ID can be viewed in your Entra application's dashboard.
- Authorization and Token endpoints can be found under the `Endpoints` link at the top of the page in your Entra application's dashboard.

```js
const config = {
  serviceConfiguration: {
    authorizationEndpoint: 'https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token',
  },
  clientId: '<APPLICATION_ID>',
  redirectUrl: 'com.my-app://oauth/redirect', // 'com.my-app' should correspond to your app name
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});
```
