# Spotify

If you don't already have a slack app, create it [here](https://developer.spotify.com/dashboard/applications).

Open your app, go to settings and add a redirect uri, e.g. `com.myapp://oauth`.

```js
const config = {
  clientId: '<client_id>', // available on the app page
  clientSecret: '<client_secret>', // click "show client secret" to see this
  redirectUrl: 'com.myapp://oauth', // the redirect you defined after creating the app
  scopes: ['user-read-email', 'playlist-modify-public', 'user-read-private'], // the scopes you need to access
  serviceConfiguration: {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
  },
};

const authState = await authorize(config);
```
