# Reddit

Log in and go to [apps](https://www.reddit.com/prefs/apps) to create your app.

Choose "installed app" and give it a name, description and about url of your choosing.

For the redirect uri, choose something like `com.myapp//oauth2redirect/reddit` and make sure that you use `com.myapp` in your `appAuthRedirectScheme` in `android/app/build.gradle`.

Reddit requires for you to add a [basic auth header](https://github.com/reddit-archive/reddit/wiki/oauth2#retrieving-the-access-token) to the token request.

```js
const config = {
  redirectUrl: 'com.myapp://oauth2redirect/reddit',
  clientId: '<client-id>',
  clientSecret: '', // empty string - needed for iOS
  scopes: ['identity'],
  serviceConfiguration: {
    authorizationEndpoint: 'https://www.reddit.com/api/v1/authorize.compact',
    tokenEndpoint: 'https://www.reddit.com/api/v1/access_token',
  },
  customHeaders: {
    token: {
      Authorization: 'Basic <base64encoded clientID:>',
    },
  },
};

// Log in to get an authentication token
const authState = await authorize(config);
```
