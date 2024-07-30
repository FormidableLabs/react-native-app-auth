---
sidebar_position: 1
slug: /
---

# Introduction

Get started by installing the dependencies in your application

```sh
yarn add react-native-app-auth
```
Or
```sh
npm install react-native-app-auth --save
```

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

#### Register redirect URL scheme

If you intend to support iOS 10 and older, you need to define the supported redirect URL schemes in
your `Info.plist` as follows:

```xml
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

#### Define openURL callback in AppDelegate

You need to retain the auth session, in order to continue the
authorization flow from the redirect. Follow these steps:

`RNAppAuth` will call on the given app's delegate via `[UIApplication sharedApplication].delegate`.
Furthermore, `RNAppAuth` expects the delegate instance to conform to the protocol `RNAppAuthAuthorizationFlowManager`.
Make `AppDelegate` conform to `RNAppAuthAuthorizationFlowManager` with the following changes to `AppDelegate.h`:

##### For react-native >= 0.68

```diff
+ #import <React/RCTLinkingManager.h>
+ #import "RNAppAuthAuthorizationFlowManager.h"

- @interface AppDelegate : RCTAppDelegate
+ @interface AppDelegate : RCTAppDelegate <RNAppAuthAuthorizationFlowManager>

+ @property(nonatomic, weak) id<RNAppAuthAuthorizationFlowManagerDelegate> authorizationFlowManagerDelegate;
```

Add the following code to `AppDelegate.mm` to support React Navigation deep linking and overriding browser behavior in the authorization process

```diff
+ - (BOOL) application: (UIApplication *)application
+              openURL: (NSURL *)url
+              options: (NSDictionary<UIApplicationOpenURLOptionsKey, id> *) options
+ {
+   if ([self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
+     return YES;
+   }
+   return [RCTLinkingManager application:application openURL:url options:options];
+ }
```

If you want to support universal links, add the following to `AppDelegate.mm` under `continueUserActivity`

```diff
+ - (BOOL) application: (UIApplication *) application
+ continueUserActivity: (nonnull NSUserActivity *)userActivity
+   restorationHandler: (nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
+ {
+   if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
+     if (self.authorizationFlowManagerDelegate) {
+       BOOL resumableAuth = [self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:userActivity.webpageURL];
+       if (resumableAuth) {
+         return YES;
+       }
+     }
+   }
+   return [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
+ }
```

##### For react-native < 0.68

```diff
+ #import "RNAppAuthAuthorizationFlowManager.h"

- @interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>
+ @interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, RNAppAuthAuthorizationFlowManager>

+ @property(nonatomic, weak)id<RNAppAuthAuthorizationFlowManagerDelegate>authorizationFlowManagerDelegate;
```

Add the following code to `AppDelegate.m` (to support iOS 10, React Navigation deep linking and overriding browser behavior in the authorization process)

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

2. `AppDelegate.swift` should implement the `RNAppAuthAuthorizationFlowManager` protocol and have a handler for url deep linking. The result should look something like this:

```swift
@UIApplicationMain
class AppDelegate: UIApplicationDelegate, RNAppAuthAuthorizationFlowManager { //<-- note the additional RNAppAuthAuthorizationFlowManager protocol
  public weak var authorizationFlowManagerDelegate: RNAppAuthAuthorizationFlowManagerDelegate? // <-- this property is required by the protocol
  //"open url" delegate function for managing deep linking needs to call the resumeExternalUserAgentFlowWithURL method
  func application(
      _ app: UIApplication,
      open url: URL,
      options: [UIApplicationOpenURLOptionsKey: Any] = [:]) -> Bool {
      return authorizationFlowManagerDelegate?.resumeExternalUserAgentFlow(with: url) ?? false
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
