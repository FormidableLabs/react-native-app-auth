# Keycloak

Keycloak [does not specify a revocation endpoint](http://keycloak-user.88327.x6.nabble.com/keycloak-user-Revoking-an-OAuth-Token-td3041.html) so revoke functionality doesn't work.

If you use [JHipster](http://www.jhipster.tech/)'s default Keycloak Docker image, everything will work with the following settings, except for revoke.

```js
const config = {
  issuer: 'http://localhost:9080/auth/realms/jhipster',
  clientId: 'web_app',
  redirectUrl: '<YOUR_REDIRECT_SCHEME>:/callback'
  scopes: ['openid', 'profile']
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});
```
