**WORK IN PROGRESS**

### Done:
- iOS bridge with ![AppAuth-iOS](https://github.com/openid/AppAuth-iOS)
- Android bridge with ![AppAuth-Android](https://github.com/openid/AppAuth-Android)


### To Do:
- revoke token method (will be in JS only, no bridge)

# react-native-app-auth

React Native bridge for ![AppAuth-iOS](https://github.com/openid/AppAuth-iOS) and ![AppAuth-Android](https://github.com/openid/AppAuth-Android) which implement OAuth2 with PKCE support.

Supported methods:

### authorize()
```
await AppAuth.authorize(scopes);
// returns accessToken, accessTokenExpirationDate and refreshToken
```

### refresh()
```
await AppAuth.refresh(refreshToken, scopes);
// returns accessTokenExpirationDate
```

### revokeToken()
```
await AppAuth.revokeToken();
```

## Getting started

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



## Usage
```javascript
import AppAuth from 'react-native-app-auth';

// initialise the client with your configuration
const appAuth = new AppAuth({
  issuer: '<YOUR_ISSUER_URL>',
  clientId: '<YOUR_CLIENT_ID',
  redirectUrl: '<YOUR_REDIRECT_URL>',
  revokeTokenUrl: '<YOUR_REVOKE_TOKEN_URL>',
  allowOfflineAccess: true,
});

// use the client to make the auth request and receive the authState
try {
  const scopes = ['profile'];
  const authState = await appAuth.authorize(scopes);
  // authState includes accessToken, accessTokenExpirationDate and refreshToken
} catch (error) {
  console.log(error);
}
```
