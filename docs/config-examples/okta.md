# Okta

Full support out of the box.

> If you're using Okta and want to add App Auth to your React Native application, you'll need an application to authorize against. If you don't have an Okta Developer account, [you can signup for free](https://developer.okta.com/signup/).
>
> Log in to your Okta Developer account and navigate to **Applications** > **Add Application**. Click **Native** and click the **Next** button. Give the app a name you’ll remember (e.g., `React Native`), select `Refresh Token` as a grant type, in addition to the default `Authorization Code`. Copy the **Login redirect URI** (e.g., `com.oktapreview.dev-158606:/callback`) and save it somewhere. You'll need this value when configuring your app.
>
> Click **Done** and you'll see a client ID on the next screen. Copy the redirect URI and clientId values into your App Auth config.

```js
const config = {
  issuer: 'https://{yourOktaDomain}.com/oauth2/default',
  clientId: '{clientId}',
  redirectUrl: 'com.{yourReversedOktaDomain}:/callback',
  scopes: ['openid', 'profile']
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
