# React Native App Auth Example

![Demo](demo.gif)

## Running the example apps

After cloning the repository, run the following:

```sh
cd react-native-app-auth/Example
yarn
# Install the pods for the iOS example app
cd ios && pod install
# Install the pods for the macOS example app
cd macos && pod install

# From here on, you'll need two terminals.

# [In terminal A]
# Start the Metro bundler
yarn start

# [In terminal B]
# Run the iOS app
yarn ios

# or:
# Run the Android app
yarn android

# or:
# Run the macOS app
yarn macos
```

### Notes
* You have to have the emulator open before running the last command. If you have difficulty getting the emulator to connect, open the project from Android Studio and run it through there.
* ANDROID: When integrating with a project that utilizes deep linking (e.g. [React Navigation deep linking](https://reactnavigation.org/docs/deep-linking/#set-up-with-bare-react-native-projects)), update the redirectUrl in your config and the `appAuthRedirectScheme` value in build.gradle to use a custom scheme so that it differs from the scheme used in your deep linking intent-filter [as seen here](https://github.com/FormidableLabs/react-native-app-auth/issues/494#issuecomment-797394994).

Example:
```
// build.gradle
android {
  defaultConfig {
    manifestPlaceholders = [
      appAuthRedirectScheme: 'io.identityserver.demo.auth'
    ]
  }
}
```
