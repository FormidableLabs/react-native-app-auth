---
sidebar_position: 2
---

# Token Storage

Once the user has successfully authenticated, you'll have a JWT and possibly a refresh token that should be stored securely.

❗️ **Do not use Async Storage for storing sensitive information**

Async Storage is the simplest method of persisting data across application launches in React Native. However, it is an _unencrypted_ key-value store and should therefore not be used for token storage.

✅ **DO use Secure Storage**

React Native does not come bundled with any way of storing sensitive data, so it is necessary to rely on the underlying platform-specific solutions.

### iOS - Keychain Services

Keychain Services allows you to securely store small chunks of sensitive info for the user. This is an ideal place to store certificates, tokens, passwords, and any other sensitive information that doesn’t belong in Async Storage.

### Android - Secure Shared Preferences

Shared Preferences is the Android equivalent for a persistent key-value data store. Data in Shared Preferences is not encrypted by default. Encrypted Shared Preferences wraps the Shared Preferences class for Android, and automatically encrypts keys and values.

In order to use iOS's Keychain services or Android's Secure Shared Preferences, you either can write a JS < - > native interface yourself or use a library which wraps them for you. Some even provide a unified API.

## Related OSS libraries

- [react-native-keychain](https://github.com/oblador/react-native-keychain) - we've had good experiences using this on projects
- [react-native-sensitive-info](https://github.com/mCodex/react-native-sensitive-info) - secure for iOS, but uses Android Shared Preferences for Android (which is not secure). There is however a fork that uses [Android Keystore](https://github.com/mCodex/react-native-sensitive-info/tree/keystore) which is secure
- [redux-persist-sensitive-storage](https://github.com/CodingZeal/redux-persist-sensitive-storage) - wraps `react-native-sensitive-info`, see comments above
- [rn-secure-storage](https://github.com/talut/rn-secure-storage)
- [expo-secure-store](https://github.com/expo/expo/tree/master/packages/expo-secure-store) - secure for iOS by using keychain services, secure for Android by using values in SharedPreferences encrypted with Android's Keystore system. This Expo library can be used in "Managed" and "Bare" workflow apps, but note that when using this Expo library with React Native App Auth, only the bare workflow is supported.
