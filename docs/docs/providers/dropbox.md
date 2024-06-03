# Dropbox

Dropbox provides an OAuth 2.0 endpoint for logging in with a Dropbox user's credentials. You'll need to first [register your Dropbox application here](https://www.dropbox.com/developers/apps/create).

Please note:

- Dropbox does not provide a OIDC discovery endpoint, so `serviceConfiguration` is used instead.
- Dropbox OAuth requires a [client secret](/docs/client-secrets).
- Dropbox access tokens are short lived and will expire after a short period of time. To update your access token a separate call needs to be made to [/oauth2/token](https://www.dropbox.com/developers/documentation/http/documentation#oauth2-token) to obtain a new access token.

```js
const config = {
  clientId: 'your-client-id-generated-by-dropbox',
  clientSecret: 'your-client-secret-generated-by-dropbox',
  redirectUrl: 'your.app.bundle.id://oauth',
  scopes: [],
  serviceConfiguration: {
    authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
    tokenEndpoint: `https://www.dropbox.com/oauth2/token`,
  },
  additionalParameters: {
    token_access_type: 'offline',
  },
};

// Log in to get an authentication token
const authState = await authorize(config);
const dropboxUID = authState.tokenAdditionalParameters.account_id;
```
