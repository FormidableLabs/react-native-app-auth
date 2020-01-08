## Token Storage

Once the user has successfully authenticated, you'll have a JWT and possibly a refresh token that should be stored securely.

❗️ __Do not use Async Storage for storing sensitive information__

Async Storage is the simplest method of persisting data across application launches in React Native. However, it is an _unencrypted_ key-value store and should therefore not be used for token storage.

✅ __DO use Secure Storage__

React Native does not come bundled with any way of storing sensitive data, however there are pre-existing solutions for both platforms.

### iOS - Keychain Services
Keychain Services allows you to securely store small chunks of sensitive info for the user. This is an ideal place to store certificates, tokens, passwords, and any other sensitive information that doesn’t belong in Async Storage.

### Android - Secure Shared Preferences
Shared Preferences is the Android equivalent for a persistent key-value data store. Data in Shared Preferences is not encrypted by default. Encrypted Shared Preferences wraps the Shared Preferences class for Android, and automatically encrypts keys and values.

In order to use iOS Keychain services or Android Secure Shared Preferences, you can either write a bridge yourself or use a library which wraps them for you and provides a unified API (at your own risk).

## Related OSS libraries

- [react-native-keychain](https://github.com/oblador/react-native-keychain)
- [react-native-sensitive-info](https://github.com/mCodex/react-native-sensitive-info)
- [redux-persist-sensitive-storage](https://github.com/CodingZeal/redux-persist-sensitive-storage)
- [rn-secure-storage](https://github.com/talut/rn-secure-storage)
