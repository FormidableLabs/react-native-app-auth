# React Native App Auth

React Native bridge for ![AppAuth-iOS](https://github.com/openid/AppAuth-iOS) and ![AppAuth-Android](https://github.com/openid/AppAuth-Android) - an SDK for communicating with OAuth2 providers. It also supports the PKCE extension to OAuth.

This library *should* support any OAuth provider that implements the ![OAuth2 spec](https://tools.ietf.org/html/rfc6749#section-2.2) but it has only been tested with:

- ![Identity Server4](https://demo.identityserver.io/)
- ![Google](https://developers.google.com/identity/protocols/OAuth2)

The library uses auto-discovery which mean it relies on the the ![.well-known/openid-configuration](https://openid.net/specs/openid-connect-discovery-1_0.html) endpoint to discover all auth endpoints automatically. It will be possible to extend the library later to add custom configuration.

# Supported methods:

### authorize
This is the main function to use for authentication. Evoking this function will do the whole login flow and returns the access token, refresh token and access token expiry date when successful, or it throws an error when not successful.
```js
import AppAuth from 'react-native-app-auth';

const appAuth = new AppAuth(config);
const result = await appAuth.authorize(scopes);
// returns accessToken, accessTokenExpirationDate and refreshToken
```

### refresh
This method will refresh the accessToken using the refreshToken. Some auth providers will also give you a new refreshToken
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

# Getting started

`$ npm install react-native-app-auth --save`

### Mostly automatic installation

`$ react-native link react-native-app-auth`


### Manual installation

#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-app-auth` and add `RNAppAuth.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNAppAuth.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.reactlibrary.RNAppAuthPackage;` to the imports at the top of the file
  - Add `new RNAppAuthPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-app-auth'
  	project(':react-native-app-auth').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-app-auth/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-app-auth')
  	```

## Configuration - iOS

Install the AppAuth dependency. Create a `Podfile` if one didn't exist yet
```
cd ios
pod init
```

Add the AppAuth pod to your `Podfile`
```
target '<appName>' do
  pod 'AppAuth'
end
```

Install it
```
pod install
```

You need to have a property in your AppDelegate to hold the auth session, in order to continue the authorization flow from the redirect. To add this, open `AppDelegate.h` and add

```objective-c.
@protocol OIDAuthorizationFlowSession;
@property(nonatomic, strong, nullable) id<OIDAuthorizationFlowSession> currentAuthorizationFlow;
```

The authorization response URL is returned to the app via the iOS openURL app delegate method, so you need to pipe this through to the current authorization session (created in the previous instruction). To do this, open `AppDelegate.m` and add an import statement:
```objective-c.
#import "AppAuth.h"
```

And in the bottom of the file, add:
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

## Configuration - Android
Make sure you've added `google()` to the `repositories` in `android/build.gradle`

In `android/app/build.gradle`, make sure the appcompat version is
```
compile "com.android.support:appcompat-v7:25.3.1"
```
And update when necessary (you may need to update the `compileSdkVersion` to 25 as well)

Still in `android/app/build.gradle`, add the following property to the defaultConfig:
```
manifestPlaceholders = [
        'appAuthRedirectScheme': '<YOUR_REDIRECT_SCHEME>'
]
```



# Usage
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

# Support

## Identity Server 4
This library supports authenticating for Identity Server 4 out of the box. Some quirks:
1. In order to enable `offline_access`, it must be passed in as a scope variable
2. In order to revoke the access token, must sent client id in the method body of the request. This is not part of the OAuth spec.

## Google
Full support out of the box

## Contributors

Thanks goes to these wonderful people
([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://avatars0.githubusercontent.com/u/6534400?v=4" width="100px;"/><br /><sub><b>Kadi Kraman</b></sub>](https://github.com/kadikraman)<br />[💻](https://github.com/FormidableLabs/react-native-app-auth/commits?author=kadikraman "Code") [📖](https://github.com/FormidableLabs/react-native-app-auth/commits?author=kadikraman "Documentation") [🚇](#infra-kadikraman "Infrastructure (Hosting, Build-Tools, etc)") [⚠️](https://github.com/FormidableLabs/react-native-app-auth/commits?author=kadikraman "Tests") [👀](#review-kadikraman "Reviewed Pull Requests") [💡](#example-kadikraman "Examples") | [<img src="https://avatars1.githubusercontent.com/u/1203949?v=4" width="100px;"/><br /><sub><b>Jani Eväkallio</b></sub>](https://twitter.com/jevakallio)<br />[💡](#example-jevakallio "Examples") [📖](https://github.com/FormidableLabs/react-native-app-auth/commits?author=jevakallio "Documentation") [⚠️](https://github.com/FormidableLabs/react-native-app-auth/commits?author=jevakallio "Tests") [👀](#review-jevakallio "Reviewed Pull Requests") [🤔](#ideas-jevakallio "Ideas, Planning, & Feedback") | [<img src="https://avatars0.githubusercontent.com/u/2041385?v=4" width="100px;"/><br /><sub><b>Phil Plückthun</b></sub>](https://twitter.com/_philpl)<br />[📖](https://github.com/FormidableLabs/react-native-app-auth/commits?author=philpl "Documentation") [👀](#review-philpl "Reviewed Pull Requests") [🤔](#ideas-philpl "Ideas, Planning, & Feedback") | [<img src="https://avatars1.githubusercontent.com/u/4206028?v=4" width="100px;"/><br /><sub><b>Imran Sulemanji</b></sub>](https://github.com/imranolas)<br />[🤔](#ideas-imranolas "Ideas, Planning, & Feedback") [👀](#review-imranolas "Reviewed Pull Requests") | [<img src="https://avatars3.githubusercontent.com/u/2393035?v=4" width="100px;"/><br /><sub><b>JP</b></sub>](http://twitter.com/jpdriver)<br />[🤔](#ideas-jpdriver "Ideas, Planning, & Feedback") [👀](#review-jpdriver "Reviewed Pull Requests") | [<img src="https://avatars2.githubusercontent.com/u/6714912?v=4" width="100px;"/><br /><sub><b>Matt Cubitt</b></sub>](https://github.com/mattcubitt)<br />[🤔](#ideas-mattcubitt "Ideas, Planning, & Feedback") [👀](#review-mattcubitt "Reviewed Pull Requests") |
| :---: | :---: | :---: | :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the
[all-contributors](https://github.com/kentcdodds/all-contributors)
specification. Contributions of any kind are welcome!
