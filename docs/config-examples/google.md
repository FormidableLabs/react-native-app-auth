# Google

Full support out of the box.

```js
const config = {
  issuer: 'https://accounts.google.com',
  clientId: 'GOOGLE_OAUTH_APP_GUID.apps.googleusercontent.com',
  redirectUrl: 'com.googleusercontent.apps.GOOGLE_OAUTH_APP_GUID:/oauth2redirect/google',
  scopes: ['openid', 'profile']
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken
});

// Revoke token
await revoke(config, {
  tokenToRevoke: refreshedState.refreshToken
});
```


### Note for Android
- You need to check custom URI scheme under APIs & Services -> Credentials -> OAuth 2.0 Client IDs -> Your Client Name -> Advanced Settings
- It may take 5 minutes to a few hours for settings to take effect.
