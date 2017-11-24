[![Build Status](https://travis-ci.org/kadikraman/draftjs-md-converter.svg?branch=master)](https://travis-ci.org/kadikraman/draftjs-md-converter)
[![npm version](https://badge.fury.io/js/react-native-app-auth.svg)](https://badge.fury.io/js/react-native-app-auth)

# React Native App Auth

React Native bridge for [AppAuth-iOS](https://github.com/openid/AppAuth-iOS) and
[AppAuth-Android](https://github.com/openid/AppAuth-Android) SDKS for communicating with
[OAuth 2.0](https://tools.ietf.org/html/rfc6749) and
[OpenID Connect](http://openid.net/specs/openid-connect-core-1_0.html) providers.

This library _should_ support any OAuth provider that implements the
[OAuth2 spec](https://tools.ietf.org/html/rfc6749#section-2.2) and it has been tested with:

* [Identity Server4](https://demo.identityserver.io/) ([Example configuration](#identity-server-4))
* [Google](https://developers.google.com/identity/protocols/OAuth2)
  ([Example configuration](#google))

The library uses auto-discovery which mean it relies on the the
[.well-known/openid-configuration](https://openid.net/specs/openid-connect-discovery-1_0.html)
endpoint to discover all auth endpoints automatically. It will be possible to extend the library
later to add custom configuration.

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

## Supported methods

See [Usage](#usage) for example configurations, and the included [Example](Example) application for
a working sample.

### authorize

This is the main function to use for authentication. Invoking this function will do the whole login
flow and returns the access token, refresh token and access token expiry date when successful, or it
throws an error when not successful.

```js
import AppAuth from 'react-native-app-auth';

const appAuth = new AppAuth(config);
const result = await appAuth.authorize(scopes);
// returns accessToken, accessTokenExpirationDate and refreshToken
```

### refresh

This method will refresh the accessToken using the refreshToken. Some auth providers will also give
you a new refreshToken

```js
const result = await appAuth.refresh(refreshToken, scopes);
// returns accessToken, accessTokenExpirationDate and (maybe) refreshToken
```

### revokeToken

This method will revoke a token. The tokenToRevoke can be either an accessToken or a refreshToken

```js
// note, sendClientId=true will only be required when using IdentityServer
const result = await appAuth.revokeToken(tokenToRevoke, sendClientId);
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

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's
   name]`
2. Go to `node_modules` ➜ `react-native-app-auth` and add `RNAppAuth.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNAppAuth.a` to your project's
   `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`

* Add `import com.reactlibrary.RNAppAuthPackage;` to the imports at the top of the file
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

#### Install native dependencies

This library depends on the native [AppAuth-ios](https://github.com/openid/AppAuth-iOS) project. To
keep the React Native library agnostic of your dependency management method, the native libraries
are not distributed as part of the bridge.

AppAuth supports three options for dependency management.

##### CocoaPods

With [CocoaPods](https://guides.cocoapods.org/using/getting-started.html), add the following line to
your `Podfile`:

    pod 'AppAuth', '>= 0.91'

Then run `pod install`. Note that version 0.91 is the first of the library to support iOS 11.

##### Carthage

With [Carthage](https://github.com/Carthage/Carthage), add the following line to your `Cartfile`:

    github "openid/AppAuth-iOS" "master"

Then run `carthage bootstrap`.

##### Static Library

You can also use [AppAuth-iOS](https://github.com/openid/AppAuth-iOS) as a static library. This
requires linking the library and your project and including the headers. Suggested configuration:

1. Create an XCode Workspace.
2. Add `AppAuth.xcodeproj` to your Workspace.
3. Include libAppAuth as a linked library for your target (in the "General -> Linked Framework and
   Libraries" section of your target).
4. Add `AppAuth-iOS/Source` to your search paths of your target ("Build Settings -> "Header Search
   Paths").

#### Register redirect URL scheme

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

#### Define openURL callback in AppDelegate

You need to have a property in your AppDelegate to hold the auth session, in order to continue the
authorization flow from the redirect. To add this, open `AppDelegate.h` in your project and add the
following lines:

```diff
+ @protocol OIDAuthorizationFlowSession;

  @interface AppDelegate : UIResponder <UIApplicationDelegate>
+ @property(nonatomic, strong, nullable) id<OIDAuthorizationFlowSession> currentAuthorizationFlow;
  @property (nonatomic, strong) UIWindow *window;
  @end
```

The authorization response URL is returned to the app via the iOS openURL app delegate method, so
you need to pipe this through to the current authorization session (created in the previous
instruction). To do this, open `AppDelegate.m` and add an import statement:

```objective-c.
#import "AppAuth.h"
```

And in the bottom of the class, add the following handler:

```objective-c.
- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<NSString *, id> *)options {
  if ([_currentAuthorizationFlow resumeAuthorizationFlowWithURL:url]) {
    _currentAuthorizationFlow = nil;
    return YES;
  }
  return NO;
}
```

### Android Setup

To setup the Android project, you need to perform two steps:

1. [Install Android support libraries](#install-android-support-libraries)
2. [Add redirect scheme manifest placeholder](#add-redirect-scheme-manifest-placeholder)

#### Install Android support libraries

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

#### Add redirect scheme manifest placeholder

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
import AppAuth from 'react-native-app-auth';

// initialise the client with your configuration
const appAuth = new AppAuth({
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID',
  redirectUrl: '<YOUR_REDIRECT_URL>',
});

// use the client to make the auth request and receive the authState
try {
  const scopes = ['profile'];
  const result = await appAuth.authorize(scopes);
  // result includes accessToken, accessTokenExpirationDate and refreshToken
} catch (error) {
  console.log(error);
}
```

See example configurations for different providers below.

### Identity Server 4

This library supports authenticating for Identity Server 4 out of the box. Some quirks:

1. In order to enable refresh tokens, `offline_access` must be passed in as a scope variable
2. In order to revoke the access token, we must sent client id in the method body of the request.
   This is not part of the OAuth spec.

```js
// Note "offline_access" scope is required to get a refresh token
const scopes = ["openid", "profile", "offline_access"];
const appAuth = new AppAuth({
  issuer: "https://demo.identityserver.io",
  clientId: "native.code",
  redirectUrl: "io.identityserver.demo:/oauthredirect"
});

// Log in to get an authentication token
const authState = await appAuth.authorize(scopes);

// Refresh token
const refreshedState = appAuth.refresh(authState.refreshToken, scopes);

// Revoke token, note that Identity Server expects a client id on revoke
const sendClientIdOnRevoke = true;
await appAuth.revokeToken(refreshedState.refreshToken, sendClientIdOnRevoke);
```

## Google

Full support out of the box.

```js
const scopes = ["openid", "profile"];
const appAuth = new AppAuth({
  issuer: "https://accounts.google.com",
  clientId: "GOOGLE_OAUTH_APP_GUID.apps.googleusercontent.com",
  redirectUrl: "com.googleusercontent.apps.GOOGLE_OAUTH_APP_GUID:/oauth2redirect/google"
});

// Log in to get an authentication token
const authState = await appAuth.authorize(scopes);

// Refresh token
const refreshedState = appAuth.refresh(authState.refreshToken, scopes);

// Revoke token
await appAuth.revokeToken(refreshedState.refreshToken);
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
