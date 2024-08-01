---
sidebar_position: 1
---

# Configuration

This is your configuration object for the client. The config is passed into each of the methods
with optional overrides.

```js
const config = {
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  scopes: ['<YOUR_SCOPE_ARRAY>'],
};

const result = await authorize(config);
```

See specific example [configurations for your provider](/docs/category/providers)

## API

- **issuer** - (`string`) base URI of the authentication server. If no `serviceConfiguration` (below) is provided, issuer is a mandatory field, so that the configuration can be fetched from the issuer's [OIDC discovery endpoint](https://openid.net/specs/openid-connect-discovery-1_0.html).
- **serviceConfiguration** - (`object`) you may manually configure token exchange endpoints in cases where the issuer does not support the OIDC discovery protocol, or simply to avoid an additional round trip to fetch the configuration. If no `issuer` (above) is provided, the service configuration is mandatory.
  - **authorizationEndpoint** - (`string`) _REQUIRED_ fully formed url to the OAuth authorization endpoint
  - **tokenEndpoint** - (`string`) _REQUIRED_ fully formed url to the OAuth token exchange endpoint
  - **revocationEndpoint** - (`string`) fully formed url to the OAuth token revocation endpoint. If you want to be able to revoke a token and no `issuer` is specified, this field is mandatory.
  - **registrationEndpoint** - (`string`) fully formed url to your OAuth/OpenID Connect registration endpoint. Only necessary for servers that require client registration.
  - **endSessionEndpoint** - (`string`) fully formed url to your OpenID Connect end session endpoint. If you want to be able to end a user's session and no `issuer` is specified, this field is mandatory.
- **clientId** - (`string`) _REQUIRED_ your client id on the auth server
- **clientSecret** - (`string`) client secret to pass to token exchange requests. :warning: Read more about [client secrets](/docs/client-secrets)
- **redirectUrl** - (`string`) _REQUIRED_ the url that links back to your app with the auth code. Depending on your [provider](/docs/category/providers), you may find that you need to add a trailing slash to your redirect URL.
- **scopes** - (`array<string>`) the scopes for your token, e.g. `['email', 'offline_access']`.
- **additionalParameters** - (`object`) additional parameters that will be passed in the authorization request.
  Must be string values! E.g. setting `additionalParameters: { hello: 'world', foo: 'bar' }` would add
  `hello=world&foo=bar` to the authorization request.
- **clientAuthMethod** - (`string`) _ANDROID_ Client Authentication Method. Can be either `basic` (default) for [Basic Authentication](https://github.com/openid/AppAuth-Android/blob/master/library/java/net/openid/appauth/ClientSecretBasic.java) or `post` for [HTTP POST body Authentication](https://github.com/openid/AppAuth-Android/blob/master/library/java/net/openid/appauth/ClientSecretPost.java)
- **dangerouslyAllowInsecureHttpRequests** - (`boolean`) _ANDROID_ whether to allow requests over plain HTTP or with self-signed SSL certificates. :warning: Can be useful for testing against local server, _should not be used in production._ This setting has no effect on iOS; to enable insecure HTTP requests, add a [NSExceptionAllowsInsecureHTTPLoads exception](https://cocoacasts.com/how-to-add-app-transport-security-exception-domains) to your App Transport Security settings.
- **customHeaders** - (`object`) _ANDROID_ you can specify custom headers to pass during authorize request and/or token request.
  - **authorize** - (`{ [key: string]: value }`) headers to be passed during authorization request.
  - **token** - (`{ [key: string]: value }`) headers to be passed during token retrieval request.
  - **register** - (`{ [key: string]: value }`) headers to be passed during registration request.
- **additionalHeaders** - (`{ [key: string]: value }`) _IOS_ you can specify additional headers to be passed for all authorize, refresh, and register requests.
- **useNonce** - (`boolean`) (default: true) optionally allows not sending the nonce parameter, to support non-compliant providers. To specify custom nonce, provide it in `additionalParameters` under the `nonce` key.
- **usePKCE** - (`boolean`) (default: true) optionally allows not sending the code_challenge parameter and skipping PKCE code verification, to support non-compliant providers.
- **skipCodeExchange** - (`boolean`) (default: false) just return the authorization response, instead of automatically exchanging the authorization code. This is useful if this exchange needs to be done manually (not client-side)
- **iosCustomBrowser** - (`string | null`) (default: `null`) _IOS_ override the used browser for authorization, used to open an external browser. If no value is provided, the `ASWebAuthenticationSession` or `SFSafariViewController` are used by the `AppAuth-iOS` library. On Mac Catalyst and macOS AppKit, this option has no effect and is implicitly treated as `null`.
- **iosPrefersEphemeralSession** - (`boolean`) (default: `false`) _IOS_ and _MACOS_ indicates whether the session should ask the browser for a private authentication session.
- **androidAllowCustomBrowsers** - (`string[]`) (default: undefined) _ANDROID_ override the used browser for authorization. If no value is provided, all browsers are allowed.
- **androidTrustedWebActivity** - (`boolean`) (default: `false`) _ANDROID_ Use [`EXTRA_LAUNCH_AS_TRUSTED_WEB_ACTIVITY`](https://developer.chrome.com/docs/android/trusted-web-activity/) when opening web view.
- **connectionTimeoutSeconds** - (`number`) configure the request timeout interval in seconds. This must be a positive number. The default values are 60 seconds on iOS and 15 seconds on Android.
