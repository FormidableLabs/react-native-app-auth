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

    Then run `carthage update --platform iOS --use-xcframeworks`.

    Drag and drop `AppAuth.xcframework` from `ios/Carthage/Build` under `Frameworks` in `Xcode`.

    Add a copy files build step for `AppAuth.xcframework`: open Build Phases on Xcode, add a new "Copy Files" phase, choose "Frameworks" as destination, add `AppAuth.xcframework` and ensure "Code Sign on Copy" is checked.

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

###### For react-native >= 0.77

As of `react-native@0.77`, the `AppDelegate` template is now written in Swift.

In order to bridge to the existing Objective-C code that this package utilizes, you need to create a bridging header file. To do so:

1. Create a new file in your project called `AppDelegate+RNAppAuth.h`. (It can be called anything, but it must end with `.h`)
2. Add the following code to the file:

```
#import "RNAppAuthAuthorizationFlowManager.h"
```

3. Ensure that your XCode "Build Settings" has the following `Objective-C Bridging Header` path set to the file you just created. For example, it make look something like: `$(SRCROOT)/AppDelegate+RNAppAuth.h`

4. Add the following code to `AppDelegate.swift` to support React Navigation deep linking and overriding browser behavior in the authorization process

```swift
@main
class AppDelegate: UIResponder, UIApplicationDelegate,
  RNAppAuthAuthorizationFlowManager {
  //... existing code...
  // Required by RNAppAuthAuthorizationFlowManager protocol
  public weak var authorizationFlowManagerDelegate:
    RNAppAuthAuthorizationFlowManagerDelegate?
  //... existing code...

  // Handle OAuth redirect URL
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    if let authorizationFlowManagerDelegate = self
      .authorizationFlowManagerDelegate
    {
      if authorizationFlowManagerDelegate.resumeExternalUserAgentFlow(with: url)
      {
        return true
      }
    }
    return false
  }
}
```

5. Add the following code to `AppDelegate.swift` to support universal links:

```swift


  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {

    // Handle Universal-Link–style OAuth redirects first
    if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
      let delegate = authorizationFlowManagerDelegate,
      delegate.resumeExternalUserAgentFlow(with: userActivity.webpageURL)
    {
      return true
    }

    // Fall back to React Native’s own Linking logic
    return RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }
```

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

### Android Setup

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

#### App Links

If your OAuth Redirect URL is an [App Links](https://developer.android.com/training/app-links), you need to add the following code to your `AndroidManifest.xml`:

```xml
<activity
  android:name="net.openid.appauth.RedirectUriReceiverActivity"
  android:exported="true">
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    <data android:scheme="https" android:host=example.domain />
  </intent-filter>
</activity>
```

Replace `android:host` with the domain of your redirect uri.

You need to add the `manifestPlaceholders` as described in the section above:

```
android {
  defaultConfig {
    manifestPlaceholders = [
      appAuthRedirectScheme: 'example.domain'
    ]
  }
}
```
