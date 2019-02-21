# Dropbox

Dropbox provides an OAuth 2.0 endpoint for logging in with a Dropbox user's credentials. You'll need to first [register your Dropbox application here](https://www.dropbox.com/developers/apps/create).

Please note:

* Dropbox does not provide a OIDC discovery endpoint, so `serviceConfiguration` is used instead.
* Dropbox OAuth requires a [client secret](#note-about-client-secrets).
* Dropbox OAuth does not allow non-https redirect URLs, so you'll need to use a [Universal Link on iOS](https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/UniversalLinks.html) or write a HTTPS endpoint.
* Dropbox OAuth does not provide refresh tokens or a revoke endpoint.

```js
const config = {
  clientId: 'your-client-id-generated-by-dropbox',
  clientSecret: 'your-client-secret-generated-by-dropbox',
  redirectUrl: 'https://native-redirect-endpoint/oauth/dropbox',
  scopes: [],
  serviceConfiguration: {
    authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
    tokenEndpoint: `https://www.dropbox.com/oauth2/token`,
  },
  useNonce: false,
  usePKCE: false,
};

// Log in to get an authentication token
const authState = await authorize(config);
const dropboxUID = authState.tokenAdditionalParameters.account_id;
```
