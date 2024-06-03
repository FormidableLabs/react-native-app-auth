---
sidebar_position: 2
---

# Authorization

This is the main function to use for authentication. Invoking this function will do the whole login
flow and returns the access token, refresh token and access token expiry date when successful, or it
throws an error when not successful.

```js
import { authorize } from 'react-native-app-auth';

const config = {
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  scopes: ['<YOUR_SCOPES_ARRAY>'],
};

const result = await authorize(config);
```

#### `result`

This is the result from the auth server:

- **accessToken** - (`string`) the access token
- **accessTokenExpirationDate** - (`string`) the token expiration date
- **authorizeAdditionalParameters** - (`Object`) additional url parameters from the authorizationEndpoint response.
- **tokenAdditionalParameters** - (`Object`) additional url parameters from the tokenEndpoint response.
- **idToken** - (`string`) the id token
- **refreshToken** - (`string`) the refresh token
- **tokenType** - (`string`) the token type, e.g. Bearer
- **scopes** - ([`string`]) the scopes the user has agreed to be granted
- **authorizationCode** - (`string`) the authorization code (only if `skipCodeExchange=true`)
- **codeVerifier** - (`string`) the codeVerifier value used for the PKCE exchange (only if both `skipCodeExchange=true` and `usePKCE=true`)
