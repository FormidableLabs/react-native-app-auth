# Imgur

Imgur provides an OAuth 2.0 endpoint for logging in with a Imgur user's credentials. You'll need to first [register your Imgur application here](https://api.imgur.com/oauth2/addclient). See [this comment](https://github.com/FormidableLabs/react-native-app-auth/issues/516#issuecomment-2115465572) for detailed setup guide.

Please note:

* Imgur does not provide a OIDC discovery endpoint, so `serviceConfiguration` is used instead.

```js
// your configuration should look something like this
const config = {
  issuer: 'https://api.imgur.com/oauth2/',
  clientId: 'abc79a5abcdb30e', // your client id
  redirectUrl: encodeURIComponent('com.myapp://oauth/callback'), // must wrap it in encodeURIComponent 
  scopes: [],
  serviceConfiguration: {
    authorizationEndpoint: 'https://api.imgur.com/oauth2/authorize',
    tokenEndpoint: 'https://api.imgur.com/oauth2/token',
  },
};

// Log in to get an authentication token
const authState = await authorize(config);
```
