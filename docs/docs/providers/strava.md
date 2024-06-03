# Strava

Strava is not 100% spec compliant, but it is still possible to get this to work with this library.

If you don't already have an app, create one [here](https://www.strava.com/settings/apps).

Now add a redirect uri [here](https://www.strava.com/settings/api). Unlike most providers that ask you to define the entire callback uri, here you need to add the "Authorization Callback Domain", e.g. `oauthredirect` (it can be anything really, in this case the redirect uri in used in the config will be `com.myapp://oauthredirect`).

Now go to the app page to find the client id and secret and use them in your config like so:

```js
config = {
  clientId: '<client_id>',
  clientSecret: '<client_secret>',
  redirectUrl: 'myapp://oauthredirect',
  serviceConfiguration: {
    authorizationEndpoint: 'https://www.strava.com/oauth/mobile/authorize',
    tokenEndpoint:
      'https://www.strava.com/oauth/token?client_id=<client_id>&client_secret=<client_secret>',
  },
  scopes: ['activity:read_all'],
};

const authState = await authorize(config);
```

Note, they require the client secret and id being passed in the token endpoint. This is not in the spec and thus is not supported. But we can get around it by adding them to the tokenEndpoint as url params.

## Revocation

The built in token revocation also won't work for Strava, because they use the param `access_token` instead of `token`, but you can easily implement it yourself using `fetch`

```js
const res = await fetch(`https://www.strava.com/oauth/deauthorize?access_token=${accessToken}`, {
  method: 'POST',
});
```
