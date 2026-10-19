# iOS native checks

With Xcode installed and an iOS simulator booted:

```sh
yarn workspace react-native-app-auth test:ios-presenter SIMULATOR_UDID
yarn workspace react-native-app-auth test:ios-session SIMULATOR_UDID
```

The session checks also require AppAuth sources from the demo's installed CocoaPods.
Set `APP_AUTH_SOURCE_DIR` to use another checkout of AppAuth instead. AppAuth 2.0.0
exercises the completed-session exception fixed by the module.

The session runner compiles the actual `RNAppAuth.m`, scene presenter, and AppAuth
sources into a small simulator app. Only React bridge declarations are stubbed.
A controlled browser and URL protocol exercise failed presentation, code-only login,
wrong-state rejection, cancellation, token exchange with a duplicate redirect, and
logout. No credentials, real browser, or live identity provider are used.

These checks verify native session lifecycle behavior; they do not replace testing
browser integration or a provider's login/logout flow in a React Native app.
