# FusionAuth

FusionAuth does not specify a revocation endpoint so revoke functionality doesn't work. Other than that, full functionality is available.

- [Install FusionAuth](https://fusionauth.io/docs/v1/tech/installation-guide).
- Create an application in the admin screen. Note the client id.
- Set the redirect_uri for the application to be a value like `fusionauth.demo:/oauthredirect` where `fusionauth.demo` is a scheme you've registered in your application.

Use the following configuration (replacing the `clientId` with your application id and `fusionAuth.demo` with your scheme):

```js
const config = {
  issuer: 'http://localhost:9011',
  clientId: '253eb7aa-687a-4bf3-b12b-26baa40eecbf',
  redirectUrl: 'fusionauth.demo:/callback',
  scopes: ['offline_access', 'openid'],
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});
```

Check out a full tutorial here: https://fusionauth.io/blog/2020/08/19/securing-react-native-with-oauth
