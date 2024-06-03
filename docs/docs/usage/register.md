---
sidebar_position: 4
---

# Registration

This will perform [dynamic client registration](https://openid.net/specs/openid-connect-registration-1_0.html) on the given provider.
If the provider supports dynamic client registration, it will generate a `clientId` for you to use in subsequent calls to this library.

```js
import { register } from 'react-native-app-auth';

const registerConfig = {
  issuer: '<YOUR_ISSUER_URL>',
  redirectUrls: ['<YOUR_REDIRECT_URL>', '<YOUR_OTHER_REDIRECT_URL>'],
};

const registerResult = await register(registerConfig);
```

#### registerConfig

- **issuer** - (`string`) same as in authorization config
- **serviceConfiguration** - (`object`) same as in authorization config
- **redirectUrls** - (`array<string>`) _REQUIRED_ specifies all of the redirect urls that your client will use for authentication
- **responseTypes** - (`array<string>`) an array that specifies which [OAuth 2.0 response types](https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html) your client will use. The default value is `['code']`
- **grantTypes** - (`array<string>`) an array that specifies which [OAuth 2.0 grant types](https://oauth.net/2/grant-types/) your client will use. The default value is `['authorization_code']`
- **subjectType** - (`string`) requests a specific [subject type](https://openid.net/specs/openid-connect-core-1_0.html#SubjectIDTypes) for your client
- **tokenEndpointAuthMethod** (`string`) specifies which `clientAuthMethod` your client will use for authentication. The default value is `'client_secret_basic'`
- **additionalParameters** - (`object`) additional parameters that will be passed in the registration request.
  Must be string values! E.g. setting `additionalParameters: { hello: 'world', foo: 'bar' }` would add
  `hello=world&foo=bar` to the authorization request.
- **dangerouslyAllowInsecureHttpRequests** - (`boolean`) _ANDROID_ same as in authorization config
- **customHeaders** - (`object`) _ANDROID_ same as in authorization config
- **connectionTimeoutSeconds** - (`number`) configure the request timeout interval in seconds. This must be a positive number. The default values are 60 seconds on iOS and 15 seconds on Android.

#### registerResult

This is the result from the auth server

- **clientId** - (`string`) the assigned client id
- **clientIdIssuedAt** - (`string`) _OPTIONAL_ date string of when the client id was issued
- **clientSecret** - (`string`) _OPTIONAL_ the assigned client secret
- **clientSecretExpiresAt** - (`string`) date string of when the client secret expires, which will be provided if `clientSecret` is provided. If `new Date(clientSecretExpiresAt).getTime() === 0`, then the secret never expires
- **registrationClientUri** - (`string`) _OPTIONAL_ uri that can be used to perform subsequent operations on the registration
- **registrationAccessToken** - (`string`) token that can be used at the endpoint given by `registrationClientUri` to perform subsequent operations on the registration. Will be provided if `registrationClientUri` is provided
