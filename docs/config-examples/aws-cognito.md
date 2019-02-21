# AWS Cognito

First, set up a your user pool in [the AWS console](https://eu-west-1.console.aws.amazon.com/cognito). In the details of your new user pool, go down to `App clients` to create a new client. Make sure you create a client **without** a client secret (it's redundant on mobile). You should get an alphanumeric string which is your `<CLIENT_ID>`.

Now you need to set up your domain name. This will be on the left menu in your pool details page, under App Integration -> Domain Name. What this is depends on your preference. E.g. for AppAuth demo, mine is `https://app-auth-test.auth.eu-west-1.amazoncognito.com` as I chose `app-auth-test` as the domain and `eu-west-1` as the region.

Finally, you need to configure your app client. Go to App Integration -> App Client Settings.

1. Enable your newly created user pool under Enabled Identity Providers.
2. Add the callback url (must be same as in your config, e.g. `com.myclientapp://myclient/redirect`)
3. Enable the Authorization code grant
4. Enable openid scope

```js
const config = {
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: 'com.myclientapp://myclient/redirect',
  serviceConfiguration: {
    authorizationEndpoint: '<YOUR_DOMAIN_NAME>/oauth2/authorize',
    tokenEndpoint: '<YOUR_DOMAIN_NAME>/oauth2/token',
    revocationEndpoint: '<YOUR_DOMAIN_NAME>/oauth2/revoke'
  }
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
