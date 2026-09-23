---
sidebar_position: 4
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

## Resuming an interrupted authorization (Android)

On Android, the OS can kill your app's process while the user is away in the browser completing
the login (e.g. under memory pressure). When the user returns, React Native drops the resulting
activity result because it arrives before the JS context is ready
([facebook/react-native#30277](https://github.com/facebook/react-native/issues/30277)), so the
in-flight `authorize()` promise never resolves or rejects.

`resumePendingAuthorize` lets you recover from this: it claims the stashed result and completes
the token exchange. It resolves `null` when there is nothing to resume, so it's safe to call
unconditionally on every app start, and it always resolves `null` on iOS.

```js
import { resumePendingAuthorize } from 'react-native-app-auth';

const result = await resumePendingAuthorize(config);
if (result) {
  // an interrupted authorize() was completed
}
```

This requires your `MainActivity` to forward the raw activity result to
`RNAppAuthModule` before React Native's normal handling has a chance to drop it:

```kotlin
import com.rnappauth.RNAppAuthModule

class MainActivity : ReactActivity() {
  // ...

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode == RNAppAuthModule.AUTHORIZATION_REQUEST_CODE) {
      RNAppAuthModule.stashAuthorizationResult(data)
    }
    super.onActivityResult(requestCode, resultCode, data)
  }
}
```

#### `config`

Accepts the same `additionalParameters`, `dangerouslyAllowInsecureHttpRequests`, `customHeaders`
and `connectionTimeoutSeconds` options as `authorize`.
