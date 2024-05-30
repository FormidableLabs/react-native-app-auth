# GitHub

Go to [OAuth Apps](https://github.com/settings/developers) to create your app.

For the Authorization callback URL, choose something like `com.myapp://oauthredirect` and ensure you use `com.myapp` in your `appAuthRedirectScheme` in `android/app/build.gradle`.

```js
const config = {
  redirectUrl: 'com.my.auth.app://oauthredirect',
  clientId: '<client-id>',
  clientSecret: '<client-secret>',
  scopes: ['identity'],
  additionalHeaders: { Accept: 'application/json' },
  serviceConfiguration: {
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    revocationEndpoint: 'https://github.com/settings/connections/applications/<client-id>',
  },
};

// Log in to get an authentication token
const authState = await authorize(config);
```
