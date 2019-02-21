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

* [Identity Server4](https://demo.identityserver.io/) ([Example configuration](./docs/config-examples/identity-server-4.md))
* [Identity Server3](https://github.com/IdentityServer/IdentityServer3.md) ([Example configuration](./docs/config-examples/identity-server-3.md))
* [Google](https://developers.google.com/identity/protocols/OAuth2)
  ([Example configuration](./docs/config-examples/google.md))
* [Okta](https://developer.okta.com) ([Example configuration](./docs/config-examples/okta.md))
* [Keycloak](http://www.keycloak.org/) ([Example configuration](./docs/config-examples/keycloak.md))
* [Azure Active Directory](https://docs.microsoft.com/en-us/azure/active-directory) ([Example configuration](./docs/config-examples/azure-active-directory.md))
* [AWS Cognito](https://eu-west-1.console.aws.amazon.com/cognito) ([Example configuration](./docs/config-examples/aws-cognito.md))

### Tested OAuth2 providers:

These providers implement the OAuth2 spec, but are not OpenID providers, which means you must configure the authorization and token endpoints yourself.

* [Uber](https://developer.uber.com/docs/deliveries/guides/three-legged-oauth.md) ([Example configuration](./docs/config-examples/uber))
* [Fitbit](https://dev.fitbit.com/build/reference/web-api/oauth2/) ([Example configuration](./docs/config-examples/fitbit.md))
* [Dropbox](https://www.dropbox.com/developers/reference/oauth-guide) ([Example configuration](./docs/config-examples/dropbox.md))

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
* **useNonce** - (`boolean`) _IOS_ (default: true) optionally allows not sending the nonce parameter, to support non-compliant providers
* **usePKCE** - (`boolean`) _IOS_ (default: true) optionally allows not sending the code_challenge parameter and skipping PKCE code verification, to support non-compliant providers.

#### result

This is the result from the auth server

* **accessToken** - (`string`) the access token
* **accessTokenExpirationDate** - (`string`) the token expiration date
* **authorizeAdditionalParameters** - (`Object`) additional url parameters from the authorizationEndpoint response.
* **tokenAdditionalParameters** - (`Object`) additional url parameters from the tokenEndpoint response.
* **additionalParameters** - (`Object`) :warning: _DEPRECATED_ legacy implementation. Will be removed in a future release. Returns just `tokenAdditionalParameters` for Android and `authorizeAdditionalParameters` on iOS
* **idToken** - (`string`) the id token
* **refreshToken** - (`string`) the refresh token
* **tokenType** - (`string`) the token type, e.g. Bearer
* **scopes** - ([`string`]) the scopes the user has agreed to be granted

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

**Note:** for RN >= 0.57, you will get a warning about compile being obsolete. To get rid of this warning, use [patch-package](https://github.com/ds300/patch-package) to replace compile with implementation [as in this PR](https://github.com/FormidableLabs/react-native-app-auth/pull/242) - we're not deploying this right now, because it would break the build for RN < 57.

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
g
