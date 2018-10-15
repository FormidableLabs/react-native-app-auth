<p align="center"><img src="https://raw.githubusercontent.com/FormidableLabs/react-native-app-auth/master/docs/react-native-app-auth-logo.png" width=224></p>
<h2 align="center">React Native App Auth</h2>
<p align="center">
<strong>React native bridge for AppAuth - an SDK for communicating with OAuth2 providers</strong>
<br><br>

[![npm package version](https://badge.fury.io/js/react-native-app-auth.svg)](https://badge.fury.io/js/react-native-app-auth)

#### This is the API documentation for `react-native-app-auth >= 4.0.`

Past documentation: [`3.1`](https://github.com/FormidableLabs/react-native-app-auth/tree/v3.1.0) [`3.0`](https://github.com/FormidableLabs/react-native-app-auth/tree/v3.0.0) [`2.x`](https://github.com/FormidableLabs/react-native-app-auth/tree/v2.0.0) [`1.x`](https://github.com/FormidableLabs/react-native-app-auth/tree/v1.0.1).


React Native bridge for [AppAuth-iOS](https://github.com/openid/AppAuth-iOS) and
[AppAuth-Android](https://github.com/openid/AppAuth-Android) SDKS for communicating with
[OAuth 2.0](https://tools.ietf.org/html/rfc6749) and
[OpenID Connect](http://openid.net/specs/openid-connect-core-1_0.html) providers.

This library _should_ support any OAuth provider that implements the
[OAuth2 spec](https://tools.ietf.org/html/rfc6749#section-2.2).

### Tested OpenID providers:

These providers are OpenID compliant, which means you can use [autodiscovery](https://openid.net/specs/openid-connect-discovery-1_0.html).

* [Identity Server4](https://demo.identityserver.io/) ([Example configuration](#identity-server-4))
* [Identity Server3](https://github.com/IdentityServer/IdentityServer3) ([Example configuration](#identity-server-3))
* [Google](https://developers.google.com/identity/protocols/OAuth2)
  ([Example configuration](#google))
* [Okta](https://developer.okta.com) ([Example configuration](#okta))
* [Keycloak](http://www.keycloak.org/) ([Example configuration](#keycloak))
* [Azure Active Directory](https://docs.microsoft.com/en-us/azure/active-directory) ([Example configuration](#azure-active-directory))
* [AWS Cognito](https://eu-west-1.console.aws.amazon.com/cognito) ([Example configuration](#aws-cognito))

### Tested OAuth2 providers:

These providers implement the OAuth2 spec, but are not OpenID providers, which means you must configure the authorization and token endpoints yourself.

* [Uber](https://developer.uber.com/docs/deliveries/guides/three-legged-oauth) ([Example configuration](#uber))
* [Fitbit](https://dev.fitbit.com/build/reference/web-api/oauth2/) ([Example configuration](#fitbit))

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

#### config

This is your configuration object for the client. The config is passed into each of the methods
with optional overrides.

* **issuer** - (`string`) base URI of the authentication server. If no `serviceConfiguration` (below) is provided, issuer is a mandatory field, so that the configuration can be fetched from the issuer's [OIDC discovery endpoint](https://openid.net/specs/openid-connect-discovery-1_0.html).
* **serviceConfiguration** - (`object`) you may manually configure token exchange endpoints in cases where the issuer does not support the OIDC discovery protocol, or simply to avoid an additional round trip to fetch the configuration. If no `issuer` (above) is provided, the service configuration is mandatory.
  * **authorizationEndpoint** - (`string`) _REQUIRED_ fully formed url to the OAuth authorization endpoint
  * **tokenEndpoint** - (`string`) _REQUIRED_ fully formed url to the OAuth token exchange endpoint
  * **revocationEndpoint** - (`string`) fully formed url to the OAuth token revocation endpoint. If you want to be able to revoke a token and no `issuer` is specified, this field is mandatory.
  * **registrationEndpoint** - (`string`) fully formed url to your OAuth/OpenID Connect registration endpoint. Only necessary for servers that require client registration.
* **clientId** - (`string`) _REQUIRED_ your client id on the auth server
* **clientSecret** - (`string`) client secret to pass to token exchange requests. :warning: Read more about [client secrets](#note-about-client-secrets)
* **redirectUrl** - (`string`) _REQUIRED_ the url that links back to your app with the auth code
* **scopes** - (`array<string>`) the scopes for your token, e.g. `['email', 'offline_access']`.
* **additionalParameters** - (`object`) additional parameters that will be passed in the authorization request.
  Must be string values! E.g. setting `additionalParameters: { hello: 'world', foo: 'bar' }` would add
  `hello=world&foo=bar` to the authorization request.
* **dangerouslyAllowInsecureHttpRequests** - (`boolean`) _ANDROID_ whether to allow requests over plain HTTP or with self-signed SSL certificates. :warning: Can be useful for testing against local server, _should not be used in production._ This setting has no effect on iOS; to enable insecure HTTP requests, add a [NSExceptionAllowsInsecureHTTPLoads exception](https://cocoacasts.com/how-to-add-app-transport-security-exception-domains) to your App Transport Security settings.

#### result

This is the result from the auth server

* **accessToken** - (`string`) the access token
* **accessTokenExpirationDate** - (`string`) the token expiration date
* **additionalParameters** - (`Object`) additional url parameters from the auth server
* **idToken** - (`string`) the id token
* **refreshToken** - (`string`) the refresh token
* **tokenType** - (`string`) the token type, e.g. Bearer

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
  refreshToken: `<REFRESH_TOKEN>`
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
  tokenToRevoke: `<TOKEN_TO_REVOKE>`
});
```

## Getting started

```sh
npm install react-native-app-auth --save
react-native link react-native-app-auth
```

**Then follow the [Setup](#setup) steps to configure the native iOS and Android projects.**

If you are not using `react-native link`, perform the [Manual installation](#manual-installation)
steps instead.

### Manual installation

#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-app-auth` and add `RNAppAuth.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNAppAuth.a` to your project's
   `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainApplication.java`

* Add `import com.rnappauth.RNAppAuthPackage;` to the imports at the top of the file
* Add `new RNAppAuthPackage()` to the list returned by the `getPackages()` method

2. Append the following lines to `android/settings.gradle`:
   ```
   include ':react-native-app-auth'
   project(':react-native-app-auth').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-app-auth/android')
   ```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
   ```
     compile project(':react-native-app-auth')
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

1. **CocoaPods**

   With [CocoaPods](https://guides.cocoapods.org/using/getting-started.html), add the following line to
   your `Podfile`:

       pod 'AppAuth', '>= 0.94'

   Then run `pod install`. Note that version 0.94 is the first of the library to support iOS 11.

2. **Carthage**

   With [Carthage](https://github.com/Carthage/Carthage), add the following line to your `Cartfile`:

       github "openid/AppAuth-iOS" "master"

   Then run `carthage update --platform iOS`.

   Drag and drop `AppAuth.framework` from `ios/Carthage/Build/iOS` under `Frameworks` in `Xcode`.

   Add a copy files build step for `AppAuth.framework`: open Build Phases on Xcode, add a new "Cope Files" phase, choose "Frameworks" as destination, add `AppAuth.framework` and ensure "Code Sign on Copy" is checked.

3. **Static Library**

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

* `CFBundleURLName` is any globally unique string. A common practice is to use your app identifier.
* `CFBundleURLSchemes` is an array of URL schemes your app needs to handle. The scheme is the
  beginning of your OAuth Redirect URL, up to the scheme separator (`:`) character.

##### Define openURL callback in AppDelegate

You need to retain the auth session, in order to continue the
authorization flow from the redirect. Follow these steps:

`RNAppAuth` will call on the given app's delegate via `[UIApplication sharedApplication].delegate`.
Furthermore, `RNAppAuth` expects the delegate instance to conform to the protocol `RNAppAuthAuthorizationFlowManager`.
Make `AppDelegate` conform to `RNAppAuthAuthorizationFlowManager` with the following changes to `AppDelegate.h`:

```diff
+ #import "RNAppAuthAuthorizationFlowManager.h"

- @interface AppDelegate : UIResponder <UIApplicationDelegate>
+ @interface AppDelegate : UIResponder <UIApplicationDelegate, RNAppAuthAuthorizationFlowManager>

+ @property(nonatomic, weak)id<RNAppAuthAuthorizationFlowManagerDelegate>authorizationFlowManagerDelegate;
```

The authorization response URL is returned to the app via the iOS openURL app delegate method, so
you need to pipe this through to the current authorization session (created in the previous
instruction). Thus, implement the following method from `UIApplicationDelegate` in `AppDelegate.m`:

```swift
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options {
 return [self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url];
}
```

#### Integration of the library with a Swift iOS project

The approach mentioned above should also be possible to employ with Swift. In this case one should have to import `RNAppAuth`
and make `AppDelegate` conform to `RNAppAuthAuthorizationFlowManager`. Note that this has not been tested.
`AppDelegate.swift` should look something like this:

```swift
@import RNAppAuth
class AppDelegate: UIApplicationDelegate, RNAppAuthAuthorizationFlowManager {
  public weak var authorizationFlowManagerDelegate: RNAppAuthAuthorizationFlowManagerDelegate?
  func application(
      _ app: UIApplication,
      open url: URL,
      options: [UIApplicationOpenURLOptionsKey: Any] = [:]) -> Bool {
      return authorizationFlowManagerDelegate?.resumeExternalUserAgentFlowWithURL(with: url) ?? false
  }
}
```

### Android Setup

To setup the Android project, you need to perform two steps:

1. [Install Android support libraries](#install-android-support-libraries)
2. [Add redirect scheme manifest placeholder](#add-redirect-scheme-manifest-placeholder)

##### Install Android support libraries

This library depends on the [AppAuth-Android](https://github.com/openid/AppAuth-android) project.
The native dependencies for Android are automatically installed by Gradle, but you need to add the
correct Android Support library version to your project:

1. Add the Google Maven repository in your `android/build.gradle`
   ```
   repositories {
     google()
   }
   ```
2. Make sure the appcompat version in `android/app/build.gradle` matches the one expected by
   AppAuth. If you generated your project using `react-native init`, you may have an older version
   of the appcompat libraries and need to upgdrade:
   ```
   dependencies {
     compile "com.android.support:appcompat-v7:25.3.1"
   }
   ```
3. If necessary, update the `compileSdkVersion` to 25:
   ```
   android {
     compileSdkVersion 25
   }
   ```

##### Add redirect scheme manifest placeholder

To
[capture the authorization redirect](https://github.com/openid/AppAuth-android#capturing-the-authorization-redirect),
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

The scheme is the beginning of your OAuth Redirect URL, up to the scheme separator (`:`) character.

## Usage

```javascript
import { authorize } from 'react-native-app-auth';

// base config
const config = {
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  scopes: ['<YOUR_SCOPES_ARRAY>'],
};

// use the client to make the auth request and receive the authState
try {
  const result = await authorize(config);
  // result includes accessToken, accessTokenExpirationDate and refreshToken
} catch (error) {
  console.log(error);
}
```

See example configurations for different providers below.

#### Note about client secrets

Some authentication providers, including examples cited below, require you to provide a client secret. The authors of the AppAuth library

> [strongly recommend](https://github.com/openid/AppAuth-Android#utilizing-client-secrets-dangerous) you avoid using static client secrets in your native applications whenever possible. Client secrets derived via a dynamic client registration are safe to use, but static client secrets can be easily extracted from your apps and allow others to impersonate your app and steal user data. If client secrets must be used by the OAuth2 provider you are integrating with, we strongly recommend performing the code exchange step on your backend, where the client secret can be kept hidden.

Having said this, in some cases using client secrets is unavoidable. In these cases, a `clientSecret` parameter can be provided to `authorize`/`refresh` calls when performing a token request.

### Identity Server 4

This library supports authenticating for Identity Server 4 out of the box. Some quirks:

1. In order to enable refresh tokens, `offline_access` must be passed in as a scope variable
2. In order to revoke the access token, we must sent client id in the method body of the request.
   This is not part of the OAuth spec.

```js
// Note "offline_access" scope is required to get a refresh token
const config = {
  issuer: 'https://demo.identityserver.io',
  clientId: 'native.code',
  redirectUrl: 'io.identityserver.demo:/oauthredirect',
  scopes: ['openid', 'profile', 'offline_access']
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh({
  ...config,
  refreshToken: authState.refreshToken,
});

// Revoke token, note that Identity Server expects a client id on revoke
await revoke(config, {
  tokenToRevoke: refreshedState.refreshToken,
  sendClientId: true
});
```

<details>
  <summary>Example server configuration</summary>

```
var client = new Client
{
  ClientId = "native.code",
  ClientName = "Native Client (Code with PKCE)",
  RequireClientSecret = false,
  RedirectUris = { "io.identityserver.demo:/oauthredirect" },
  AllowedGrantTypes = GrantTypes.Code,
  RequirePkce = true,
  AllowedScopes = { "openid", "profile" },
  AllowOfflineAccess = true
};
```

</details>

### Identity Server 3

This library supports authenticating with Identity Server 3. The only difference from
Identity Server 4 is that it requires a `clientSecret` and there is no way to opt out of it.

```js
// You must include a clientSecret
const config = {
  issuer: 'your-identityserver-url',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUrl: 'com.your.app.name:/oauthredirect',
  scopes: ['openid', 'profile', 'offline_access']
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh({
  ...config,
  refreshToken: authState.refreshToken,
});

// Revoke token, note that Identity Server expects a client id on revoke
await revoke(config, {
  tokenToRevoke: refreshedState.refreshToken,
  sendClientId: true
});
```

<details>
  <summary>Example server configuration</summary>

```
var client = new Client
{
  ClientId = "native.code",
  ClientName = "Native Client (Code with PKCE)",
  Flow = Flows.AuthorizationCodeWithProofKey,
  RedirectUris = { "com.your.app.name:/oauthredirect" },
  ClientSecrets = new List<Secret> { new Secret("your-client-secret".Sha256()) },
  AllowAccessToAllScopes = true
};
```

</details>

### Google

Full support out of the box.

```js
const config = {
  issuer: 'https://accounts.google.com',
  clientId: 'GOOGLE_OAUTH_APP_GUID.apps.googleusercontent.com',
  redirectUrl: 'com.googleusercontent.apps.GOOGLE_OAUTH_APP_GUID:/oauth2redirect/google',
  scopes: ['openid', 'profile', 'offline_access']
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken
});

// Revoke token
await revoke(config, {
  tokenToRevoke: refreshedState.refreshToken
});
```

### Okta

Full support out of the box.

> If you're using Okta and want to add App Auth to your React Native application, you'll need an application to authorize against. If you don't have an Okta Developer account, [you can signup for free](https://developer.okta.com/signup/).
>
> Log in to your Okta Developer account and navigate to **Applications** > **Add Application**. Click **Native** and click the **Next** button. Give the app a name you’ll remember (e.g., `React Native`), select `Refresh Token` as a grant type, in addition to the default `Authorization Code`. Copy the **Login redirect URI** (e.g., `com.oktapreview.dev-158606:/callback`) and save it somewhere. You'll need this value when configuring your app.
>
> Click **Done** and you'll see a client ID on the next screen. Copy the redirect URI and clientId values into your App Auth config.

```js
const config = {
  issuer: 'https://{yourOktaDomain}.com/oauth2/default',
  clientId: '{clientId}',
  redirectUrl: 'com.{yourReversedOktaDomain}:/callback',
  scopes: ['openid', 'profile']
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});

// Revoke token
await revoke(config, {
  tokenToRevoke: refreshedState.refreshToken
});
```

### Keycloak

Keycloak [does not specify a revocation endpoint](http://keycloak-user.88327.x6.nabble.com/keycloak-user-Revoking-an-OAuth-Token-td3041.html) so revoke functionality doesn't work.

If you use [JHipster](http://www.jhipster.tech/)'s default Keycloak Docker image, everything will work with the following settings, except for revoke.

```js
const config = {
  issuer: 'http://localhost:9080/auth/realms/jhipster',
  clientId: 'web_app',
  redirectUrl: '<YOUR_REDIRECT_SCHEME>:/callback'
  scopes: ['openid', 'profile']
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});
```

### Azure Active Directory

Azure Active Directory [does not specify a revocation endpoint](https://docs.microsoft.com/en-us/azure/active-directory/active-directory-configurable-token-lifetimes#access-tokens) because the access token are not revokable. Therefore `revoke` functionality doesn't work.

See the [Azure docs on requesting an access token](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-protocols-oauth-code#request-an-authorization-code) for more info on additional parameters.

Please Note:

* The [Azure docs](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-protocols-oauth-code#request-an-authorization-code) recommend `'urn:ietf:wg:oauth:2.0:oob'` as the `redirectUrl`.
* `Scopes` is ignored.
* `additionalParameters.resource` may be required based on the tenant settings.

```js
const config = {
  issuer: 'https://login.microsoftonline.com/your-tenant-id',
  clientId: 'your-client-id',
  redirectUrl: 'urn:ietf:wg:oauth:2.0:oob',
  scopes: [], // ignored by Azure AD
  additionalParameters: {
    resource: 'your-resource'
  }
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});
```

### Uber

Uber provides an OAuth 2.0 endpoint for logging in with a Uber user's credentials. You'll need to first [create an Uber OAuth application here](https://developer.uber.com/docs/riders/guides/authentication/introduction).

Please note:

* Uber does not provide a OIDC discovery endpoint, so `serviceConfiguration` is used instead.
* Uber OAuth requires a [client secret](#note-about-client-secrets).

```js
const config = {
  clientId: 'your-client-id-generated-by-uber',
  clientSecret: 'your-client-secret-generated-by-uber',
  redirectUrl: 'com.whatever.url.you.configured.in.uber.oauth://redirect', //note: path is required
  scopes: ['profile', 'delivery'], // whatever scopes you configured in Uber OAuth portal
  serviceConfiguration: {
    authorizationEndpoint: 'https://login.uber.com/oauth/v2/authorize',
    tokenEndpoint: 'https://login.uber.com/oauth/v2/token',
    revocationEndpoint: 'https://login.uber.com/oauth/v2/revoke'
  }
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});

// Revoke token
await revoke(config, {
  tokenToRevoke: refreshedState.refreshToken
});
```

### Fitbit

Fitbit provides an OAuth 2.0 endpoint for logging in with a Fitbit user's credentials. You'll need to first [register your Fitbit application here](https://dev.fitbit.com/apps/new).

Please note:

* Fitbit does not provide a OIDC discovery endpoint, so `serviceConfiguration` is used instead.
* Fitbit OAuth requires a [client secret](#note-about-client-secrets).

```js
const config = {
  clientId: 'your-client-id-generated-by-uber',
  clientSecret: 'your-client-secret-generated-by-fitbit',
  redirectUrl: 'com.whatever.url.you.configured.in.uber.oauth://redirect', //note: path is required
  scopes: ['activity', 'sleep'],
  serviceConfiguration: {
    authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
    tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
    revocationEndpoint: 'https://api.fitbit.com/oauth2/revoke'
  }
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});

// Revoke token
await revoke(config, {
  tokenToRevoke: refreshedState.refreshToken
});
```

### AWS Cognito

First, set up a your user pool in [the AWS console](https://eu-west-1.console.aws.amazon.com/cognito). In the details of your new user pool, go down to `App clients` to create a new client. Make sure you create a client **without** a client secret (it's redundant on mobile). You should get an alphanumeric string which is your `<CLIENT_ID>`.

Now you need to set up your domain name. This will be on the left menu in your pool details page, under App Integration -> Domain Name. What this is depends on your preference. E.g. for AppAuth demo, mine is `https://app-auth-test.auth.eu-west-1.amazoncognito.com` as I chose `app-auth-test` as the domain and `eu-west-1` as the region.

Finally, you need to configure your app client. Go to App Integration -> App Client Settings.
1. Enable your newly created user pool under Enabled Identity Providers.
2. Add the callback url (must be same as in your config, e.g. `com.myclientapp://myclient/redirect`)
3. Enable the Authorization code grant
4. Enable openid scope


```js
const config = {
  clientId: '<YOUR_CLIENT_ID>',
  redirectUrl: 'com.myclientapp://myclient/redirect',
  serviceConfiguration: {
    authorizationEndpoint: '<YOUR_DOMAIN_NAME>/oauth2/authorize',
    tokenEndpoint: '<YOUR_DOMAIN_NAME>/oauth2/token',
    revocationEndpoint: '<YOUR_DOMAIN_NAME>/oauth2/revoke'
  }
};

// Log in to get an authentication token
const authState = await authorize(config);

// Refresh token
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});

// Revoke token
await revoke(config, {
  tokenToRevoke: refreshedState.refreshToken
});
```

## Contributors

Thanks goes to these wonderful people
([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->

<!-- prettier-ignore -->
| [<img src="https://avatars0.githubusercontent.com/u/6534400?v=4" width="100px;"/><br /><sub><b>Kadi Kraman</b></sub>](https://github.com/kadikraman)<br />[💻](https://github.com/FormidableLabs/react-native-app-auth/commits?author=kadikraman "Code") [📖](https://github.com/FormidableLabs/react-native-app-auth/commits?author=kadikraman "Documentation") [🚇](#infra-kadikraman "Infrastructure (Hosting, Build-Tools, etc)") [⚠️](https://github.com/FormidableLabs/react-native-app-auth/commits?author=kadikraman "Tests") [👀](#review-kadikraman "Reviewed Pull Requests") [💡](#example-kadikraman "Examples") | [<img src="https://avatars1.githubusercontent.com/u/1203949?v=4" width="100px;"/><br /><sub><b>Jani Eväkallio</b></sub>](https://twitter.com/jevakallio)<br />[💡](#example-jevakallio "Examples") [📖](https://github.com/FormidableLabs/react-native-app-auth/commits?author=jevakallio "Documentation") [⚠️](https://github.com/FormidableLabs/react-native-app-auth/commits?author=jevakallio "Tests") [👀](#review-jevakallio "Reviewed Pull Requests") [🤔](#ideas-jevakallio "Ideas, Planning, & Feedback") | [<img src="https://avatars0.githubusercontent.com/u/2041385?v=4" width="100px;"/><br /><sub><b>Phil Plückthun</b></sub>](https://twitter.com/_philpl)<br />[📖](https://github.com/FormidableLabs/react-native-app-auth/commits?author=philpl "Documentation") [👀](#review-philpl "Reviewed Pull Requests") [🤔](#ideas-philpl "Ideas, Planning, & Feedback") | [<img src="https://avatars1.githubusercontent.com/u/4206028?v=4" width="100px;"/><br /><sub><b>Imran Sulemanji</b></sub>](https://github.com/imranolas)<br />[🤔](#ideas-imranolas "Ideas, Planning, & Feedback") [👀](#review-imranolas "Reviewed Pull Requests") | [<img src="https://avatars3.githubusercontent.com/u/2393035?v=4" width="100px;"/><br /><sub><b>JP</b></sub>](http://twitter.com/jpdriver)<br />[🤔](#ideas-jpdriver "Ideas, Planning, & Feedback") [👀](#review-jpdriver "Reviewed Pull Requests") | [<img src="https://avatars2.githubusercontent.com/u/6714912?v=4" width="100px;"/><br /><sub><b>Matt Cubitt</b></sub>](https://github.com/mattcubitt)<br />[🤔](#ideas-mattcubitt "Ideas, Planning, & Feedback") [👀](#review-mattcubitt "Reviewed Pull Requests") |
| :---: | :---: | :---: | :---: | :---: | :---: |

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors)
specification. Contributions of any kind are welcome!
