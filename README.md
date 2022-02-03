<p align="center"><img src="https://raw.githubusercontent.com/FormidableLabs/react-native-app-auth/main/docs/react-native-app-auth-logo.png" width=224></p>
<h2 align="center">React Native App Auth</h2>
<p align="center">
<strong>React native bridge for AppAuth - an SDK for communicating with OAuth2 providers</strong>
<br><br>

[![npm package version](https://badge.fury.io/js/react-native-app-auth.svg)](https://badge.fury.io/js/react-native-app-auth)
[![Maintenance Status][maintenance-image]](#maintenance-status)
![Workflow Status](https://github.com/FormidableLabs/react-native-app-auth/actions/workflows/main.yml/badge.svg?branch=main)

This versions supports `react-native@0.63+`. The last pre-0.63 compatible version is [`v5.1.3`](https://github.com/FormidableLabs/react-native-app-auth/tree/v5.1.3).

React Native bridge for [AppAuth-iOS](https://github.com/openid/AppAuth-iOS) and
[AppAuth-Android](https://github.com/openid/AppAuth-Android) SDKS for communicating with
[OAuth 2.0](https://tools.ietf.org/html/rfc6749) and
[OpenID Connect](http://openid.net/specs/openid-connect-core-1_0.html) providers.

This library _should_ support any OAuth provider that implements the
[OAuth2 spec](https://tools.ietf.org/html/rfc6749#section-2.2).

We only support the [Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/).

### Tested OpenID providers

These providers are OpenID compliant, which means you can use [autodiscovery](https://openid.net/specs/openid-connect-discovery-1_0.html).

- [Identity Server4](https://demo.identityserver.io/) ([Example configuration](./docs/config-examples/identity-server-4.md))
- [Identity Server3](https://github.com/IdentityServer/IdentityServer3.md) ([Example configuration](./docs/config-examples/identity-server-3.md))
- [FusionAuth](https://fusionauth.io) ([Example configuration](./docs/config-examples/fusionauth.md))
- [Google](https://developers.google.com/identity/protocols/OAuth2)
  ([Example configuration](./docs/config-examples/google.md))
- [Okta](https://developer.okta.com) ([Example configuration](./docs/config-examples/okta.md))
- [Keycloak](http://www.keycloak.org/) ([Example configuration](./docs/config-examples/keycloak.md))
- [Azure Active Directory](https://docs.microsoft.com/en-us/azure/active-directory) ([Example configuration](./docs/config-examples/azure-active-directory.md))
- [AWS Cognito](https://eu-west-1.console.aws.amazon.com/cognito) ([Example configuration](./docs/config-examples/aws-cognito.md))

### Tested OAuth2 providers

These providers implement the OAuth2 spec, but are not OpenID providers, which means you must configure the authorization and token endpoints yourself.

- [Uber](https://developer.uber.com/docs/deliveries/guides/three-legged-oauth.md) ([Example configuration](./docs/config-examples/uber.md))
- [Fitbit](https://dev.fitbit.com/build/reference/web-api/oauth2/) ([Example configuration](./docs/config-examples/fitbit.md))
- [Dropbox](https://www.dropbox.com/developers/reference/oauth-guide) ([Example configuration](./docs/config-examples/dropbox.md))
- [Reddit](https://github.com/reddit-archive/reddit/wiki/oauth2) ([Example configuration](./docs/config-examples/reddit.md))
- [Coinbase](https://developers.coinbase.com/docs/wallet/coinbase-connect/integrating) ([Example configuration](./docs/config-examples/coinbase.md))
- [GitHub](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/) ([Example configuration](./docs/config-examples/github.md))
- [Slack](https://api.slack.com/authentication/oauth-v2) ([Example configuration](./docs/config-examples/slack.md))
- [Strava](https://developers.strava.com/docs/authentication) ([Example configuration](./docs/config-examples/strava.md))
- [Spotify](https://developer.spotify.com/documentation/general/guides/authorization-guide/) ([Example configuration](./docs/config-examples/spotify.md))
- [Unsplash](https://unsplash.com/documentation) ([Example configuration](./docs/config-examples/unsplash.md))

## Why you may want to use this library

AppAuth is a mature OAuth client implementation that follows the best practices set out in
[RFC 8252 - OAuth 2.0 for Native Apps](https://tools.ietf.org/html/rfc8252) including using
`SFAuthenticationSession` and `SFSafariViewController` on iOS, and
[Custom Tabs](http://developer.android.com/tools/support-library/features.html#custom-tabs) on
Android. `WebView`s are explicitly _not_ supported due to the security and usability reasons
explained in [Section 8.12 of RFC 8252](https://tools.ietf.org/html/rfc8252#section-8.12).

AppAuth also supports the [PKCE](https://tools.ietf.org/html/rfc7636) ("Pixy") extension to OAuth
which was created to secure authorization codes in public clients when custom URI scheme redirects
are used.

To learn more, read [this short introduction to OAuth and PKCE](https://formidable.com/blog/2018/oauth-and-pkce-with-react-native) on the Formidable blog.

## Supported methods

See [Usage](#usage) for example configurations, and the included [Example](Example) application for
a working sample.

### `authorize`

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

### `prefetchConfiguration`

ANDROID This will prefetch the authorization service configuration. Invoking this function is optional
and will speed up calls to authorize. This is only supported on Android.

```js
import { prefetchConfiguration } from 'react-native-app-auth';

const config = {
  warmAndPrefetchChrome: true,
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  scopes: ['<YOUR_SCOPES_ARRAY>'],
};

prefetchConfiguration(config);
```

#### config

This is your configuration object for the client. The config is passed into each of the methods
with optional overrides.

- **issuer** - (`string`) base URI of the authentication server. If no `serviceConfiguration` (below) is provided, issuer is a mandatory field, so that the configuration can be fetched from the issuer's [OIDC discovery endpoint](https://openid.net/specs/openid-connect-discovery-1_0.html).
- **serviceConfiguration** - (`object`) you may manually configure token exchange endpoints in cases where the issuer does not support the OIDC discovery protocol, or simply to avoid an additional round trip to fetch the configuration. If no `issuer` (above) is provided, the service configuration is mandatory.
  - **authorizationEndpoint** - (`string`) _REQUIRED_ fully formed url to the OAuth authorization endpoint
  - **tokenEndpoint** - (`string`) _REQUIRED_ fully formed url to the OAuth token exchange endpoint
  - **revocationEndpoint** - (`string`) fully formed url to the OAuth token revocation endpoint. If you want to be able to revoke a token and no `issuer` is specified, this field is mandatory.
  - **registrationEndpoint** - (`string`) fully formed url to your OAuth/OpenID Connect registration endpoint. Only necessary for servers that require client registration.
  - **endSessionEndpoint** - (`string`) fully formed url to your OpenID Connect end session endpoint. If you want to be able to end a user's session and no `issuer` is specified, this field is mandatory.
- **clientId** - (`string`) _REQUIRED_ your client id on the auth server
- **clientSecret** - (`string`) client secret to pass to token exchange requests. :warning: Read more about [client secrets](#note-about-client-secrets)
- **redirectUrl** - (`string`) _REQUIRED_ the url that links back to your app with the auth code
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
- **useNonce** - (`boolean`) (default: true) optionally allows not sending the nonce parameter, to support non-compliant providers
- **usePKCE** - (`boolean`) (default: true) optionally allows not sending the code_challenge parameter and skipping PKCE code verification, to support non-compliant providers.
- **skipCodeExchange** - (`boolean`) (default: false) just return the authorization response, instead of automatically exchanging the authorization code. This is useful if this exchange needs to be done manually (not client-side)
- **connectionTimeoutSeconds** - (`number`) configure the request timeout interval in seconds. This must be a positive number. The default values are 60 seconds on iOS and 15 seconds on Android.

#### result

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

### `refresh`

This method will refresh the accessToken using the refreshToken. Some auth providers will also give
you a new refreshToken

```js
import { refresh } from 'react-native-app-auth';

const config = {
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  scopes: ['<YOUR_SCOPES_ARRAY>'],
};

const result = await refresh(config, {
  refreshToken: `<REFRESH_TOKEN>`,
});
```

### `revoke`

This method will revoke a token. The tokenToRevoke can be either an accessToken or a refreshToken

```js
import { revoke } from 'react-native-app-auth';

const config = {
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  scopes: ['<YOUR_SCOPES_ARRAY>'],
};

const result = await revoke(config, {
  tokenToRevoke: `<TOKEN_TO_REVOKE>`,
  includeBasicAuth: true,
  sendClientId: true,
});
```

### `logout`

This method will logout a user, as per the [OpenID Connect RP Initiated Logout](https://openid.net/specs/openid-connect-rpinitiated-1_0.html) specification. It requires an `idToken`, obtained after successfully authenticating with OpenID Connect, and a URL to redirect back after the logout has been performed.

```js
import { logout } from 'react-native-app-auth';

const config = {
  issuer: '<YOUR_ISSUER_URL>',
};

const result = await logout(config, {
  idToken: '<ID_TOKEN>',
  postLogoutRedirectUrl: '<POST_LOGOUT_URL>',
});
```

### `register`

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

## Getting started

```sh
npm install react-native-app-auth --save
```

## Setup

### iOS Setup

To setup the iOS project, you need to perform three steps:

1. [Install native dependencies](#install-native-dependencies)
2. [Register redirect URL scheme](#register-redirect-url-scheme)
3. [Define openURL callback in AppDelegate](#define-openurl-callback-in-appdelegate)

##### Install native dependencies

This library depends on the native [AppAuth-ios](https://github.com/openid/AppAuth-iOS) project. To
keep the React Native library agnostic of your dependency management method, the native libraries
are not distributed as part of the bridge.

AppAuth supports three options for dependency management.

1.  **CocoaPods**

    ```sh
    cd ios
    pod install
    ```

2.  **Carthage**

    With [Carthage](https://github.com/Carthage/Carthage), add the following line to your `Cartfile`:

        github "openid/AppAuth-iOS" "master"

    Then run `carthage update --platform iOS`.

    Drag and drop `AppAuth.framework` from `ios/Carthage/Build/iOS` under `Frameworks` in `Xcode`.

    Add a copy files build step for `AppAuth.framework`: open Build Phases on Xcode, add a new "Copy Files" phase, choose "Frameworks" as destination, add `AppAuth.framework` and ensure "Code Sign on Copy" is checked.

3.  **Static Library**

    You can also use [AppAuth-iOS](https://github.com/openid/AppAuth-iOS) as a static library. This
    requires linking the library and your project and including the headers. Suggested configuration:

    1. Create an XCode Workspace.
    2. Add `AppAuth.xcodeproj` to your Workspace.
    3. Include libAppAuth as a linked library for your target (in the "General -> Linked Framework and
       Libraries" section of your target).
    4. Add `AppAuth-iOS/Source` to your search paths of your target ("Build Settings -> "Header Search
       Paths").

##### Register redirect URL scheme

If you intend to support iOS 10 and older, you need to define the supported redirect URL schemes in
your `Info.plist` as follows:

```
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.your.app.identifier</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>io.identityserver.demo</string>
    </array>
  </dict>
</array>
```

- `CFBundleURLName` is any globally unique string. A common practice is to use your app identifier.
- `CFBundleURLSchemes` is an array of URL schemes your app needs to handle. The scheme is the
  beginning of your OAuth Redirect URL, up to the scheme separator (`:`) character. E.g. if your redirect uri
  is `com.myapp://oauth`, then the url scheme will is `com.myapp`.

##### Define openURL callback in AppDelegate

You need to retain the auth session, in order to continue the
authorization flow from the redirect. Follow these steps:

`RNAppAuth` will call on the given app's delegate via `[UIApplication sharedApplication].delegate`.
Furthermore, `RNAppAuth` expects the delegate instance to conform to the protocol `RNAppAuthAuthorizationFlowManager`.
Make `AppDelegate` conform to `RNAppAuthAuthorizationFlowManager` with the following changes to `AppDelegate.h`:

```diff
+ #import "RNAppAuthAuthorizationFlowManager.h"

- @interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>
+ @interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, RNAppAuthAuthorizationFlowManager>

+ @property(nonatomic, weak)id<RNAppAuthAuthorizationFlowManagerDelegate>authorizationFlowManagerDelegate;
```

Add the following code to `AppDelegate.m` (to support iOS <= 10 and React Navigation deep linking)

```diff
+ - (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *) options {
+  if ([self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
+    return YES;
+  }
+  return [RCTLinkingManager application:app openURL:url options:options];
+ }
```

If you want to support universal links, add the following to `AppDelegate.m` under `continueUserActivity`

```diff
+ if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
+   if (self.authorizationFlowManagerDelegate) {
+     BOOL resumableAuth = [self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:userActivity.webpageURL];
+     if (resumableAuth) {
+       return YES;
+     }
+   }
+ }
```

#### Integration of the library with a Swift iOS project

The approach mentioned should work with Swift. In this case one should make `AppDelegate` conform to `RNAppAuthAuthorizationFlowManager`. Note that this is not tested/guaranteed by the maintainers.

Steps:

1. `swift-Bridging-Header.h` should include a reference to `#import "RNAppAuthAuthorizationFlowManager.h`, like so:

```h
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTBridgeDelegate.h>
#import <React/RCTBridge.h>
#import "RNAppAuthAuthorizationFlowManager.h" // <-- Add this header
#if DEBUG
#import <FlipperKit/FlipperClient.h>
// etc...
```

2. `AppDelegate.swift` should implement the `RNAppAuthorizationFlowManager` protocol and have a handler for url deep linking. The result should look something like this:

```swift
@UIApplicationMain
class AppDelegate: UIApplicationDelegate, RNAppAuthAuthorizationFlowManager { //<-- note the additional RNAppAuthAuthorizationFlowManager protocol
  public weak var authorizationFlowManagerDelegate: RNAppAuthAuthorizationFlowManagerDelegate? // <-- this property is required by the protocol
  //"open url" delegate function for managing deep linking needs to call the resumeExternalUserAgentFlowWithURL method
  func application(
      _ app: UIApplication,
      open url: URL,
      options: [UIApplicationOpenURLOptionsKey: Any] = [:]) -> Bool {
      return authorizationFlowManagerDelegate?.resumeExternalUserAgentFlowWithURL(with: url) ?? false
  }
}
```

### Android Setup

**Note:** for RN >= 0.57, you will get a warning about compile being obsolete. To get rid of this warning, use [patch-package](https://github.com/ds300/patch-package) to replace compile with implementation [as in this PR](https://github.com/FormidableLabs/react-native-app-auth/pull/242) - we're not deploying this right now, because it would break the build for RN < 57.

To setup the Android project, you need to add redirect scheme manifest placeholder:

To [capture the authorization redirect](https://github.com/openid/AppAuth-android#capturing-the-authorization-redirect),
add the following property to the defaultConfig in `android/app/build.gradle`:

```
android {
  defaultConfig {
    manifestPlaceholders = [
      appAuthRedirectScheme: 'io.identityserver.demo'
    ]
  }
}
```

The scheme is the beginning of your OAuth Redirect URL, up to the scheme separator (`:`) character. E.g. if your redirect uri
is `com.myapp://oauth`, then the url scheme will is `com.myapp`. The scheme must be in lowercase.

NOTE: When integrating with [React Navigation deep linking](https://reactnavigation.org/docs/deep-linking/#set-up-with-bare-react-native-projects), be sure to make this scheme (and the scheme in the config's redirectUrl) unique from the scheme defined in the deep linking intent-filter. E.g. if the scheme in your intent-filter is set to `com.myapp`, then update the above scheme/redirectUrl to be `com.myapp.auth` [as seen here](https://github.com/FormidableLabs/react-native-app-auth/issues/494#issuecomment-797394994).

## Usage

```javascript
import { authorize } from 'react-native-app-auth';

// base config
const config = {
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  scopes: ['<YOUR_SCOPE_ARRAY>'],
};

// use the client to make the auth request and receive the authState
try {
  const result = await authorize(config);
  // result includes accessToken, accessTokenExpirationDate and refreshToken
} catch (error) {
  console.log(error);
}
```

## Error messages

Values are in the `code` field of the rejected Error object.

- OAuth Authorization [error codes](https://tools.ietf.org/html/rfc6749#section-4.1.2.1)
- OAuth Access Token [error codes](https://tools.ietf.org/html/rfc6749#section-5.2)
- OpendID Connect Registration [error codes](https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationError)
- `service_configuration_fetch_error` - could not fetch the service configuration
- `authentication_failed` - user authentication failed
- `token_refresh_failed` - could not exchange the refresh token for a new JWT
- `registration_failed` - could not register
- `browser_not_found` (Android only) - no suitable browser installed

#### Note about client secrets

Some authentication providers, including examples cited below, require you to provide a client secret. The authors of the AppAuth library

> [strongly recommend](https://github.com/openid/AppAuth-Android#utilizing-client-secrets-dangerous) you avoid using static client secrets in your native applications whenever possible. Client secrets derived via a dynamic client registration are safe to use, but static client secrets can be easily extracted from your apps and allow others to impersonate your app and steal user data. If client secrets must be used by the OAuth2 provider you are integrating with, we strongly recommend performing the code exchange step on your backend, where the client secret can be kept hidden.

Having said this, in some cases using client secrets is unavoidable. In these cases, a `clientSecret` parameter can be provided to `authorize`/`refresh` calls when performing a token request.

#### Token Storage

Recommendations on secure token storage can be found [here](./docs/token-storage.md).

#### Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.

[maintenance-image]: https://img.shields.io/badge/maintenance-active-green.svg
