# Keycloak

Keycloak versions [prior to May 2020](https://github.com/keycloak/keycloak/pull/7106) do not specify a revocation endpoint so revoke functionality doesn't work. If you require the ability to call `revoke` you'll need to ensure you're on a modern version of Keycloak.

If you use [JHipster](http://www.jhipster.tech/)'s default Keycloak Docker image, everything will work with the following settings.

```js
const config = {
  issuer: 'http://localhost:9080/auth/realms/jhipster',
  clientId: 'web_app',
  redirectUrl: '<YOUR_REDIRECT_SCHEME>:/callback',
  scopes: ['openid', 'profile'],
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});
```
