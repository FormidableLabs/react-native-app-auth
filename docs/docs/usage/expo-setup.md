---
sidebar_position: 1
---

# Expo Setup

React Native App Auth provides seamless integration with Expo through our config plugin, supporting **Expo SDK 53+** with Continuous Native Generation (CNG).

## Prerequisites

- Expo SDK 53 or later
- CNG workflow (not Expo Go)
- `expo prebuild` capability

## Quick Start

### 1. Install the Library

```bash
npm install react-native-app-auth
# or
yarn add react-native-app-auth
```

### 2. Configure the Plugin

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-app-auth",
        {
          "redirectUrls": ["com.yourapp.scheme://oauth"]
        }
      ]
    ]
  }
}
```

**Configuration Options:**

- `redirectUrls` (required): Array of OAuth redirect URLs for your app
  - The URL scheme (before `://`) will be automatically configured for both iOS and Android
  - Example: `"com.myapp://oauth"` → scheme is `com.myapp`

### 3. Generate Native Projects

Run prebuild to generate iOS and Android projects with OAuth configuration:

```bash
npx expo prebuild --clean
```

This automatically:
- **iOS**: Adds URL scheme to `Info.plist` and configures bridging headers
- **Android**: Sets up manifest placeholders in `build.gradle`

### 4. Use the Library

```typescript
import { authorize, AuthConfiguration } from 'react-native-app-auth';

const config: AuthConfiguration = {
  issuer: 'https://your-oauth-provider.com',
  clientId: 'your-client-id',
  redirectUrl: 'com.yourapp.scheme://oauth', // Must match app.json
  scopes: ['openid', 'profile', 'email'],
};

// Perform authentication
try {
  const result = await authorize(config);
  console.log('Access token:', result.accessToken);
} catch (error) {
  console.error('Auth error:', error);
}
```

## Validation

After running `expo prebuild`, verify the configuration was applied correctly:

### iOS Configuration

Check that your URL scheme was added to `ios/YourApp/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.yourapp.scheme</string>
    </array>
  </dict>
</array>
```

### Android Configuration

Check that the manifest placeholder was added to `android/app/build.gradle`:

```gradle
android {
  defaultConfig {
    manifestPlaceholders = [
      appAuthRedirectScheme: 'com.yourapp.scheme',
    ]
  }
}
```

## TypeScript Support

The plugin is built with TypeScript and provides full type safety. Import types as needed:

```typescript
import { 
  AuthConfiguration, 
  AuthorizeResult, 
  RefreshResult 
} from 'react-native-app-auth';
```

## Example App

Check out our working example in [`examples/expo-cng/`](https://github.com/FormidableLabs/react-native-app-auth/tree/main/examples/expo-cng) which demonstrates:

- Complete TypeScript implementation
- Expo config plugin setup
- OAuth flow with Duende IdentityServer demo
- Native project generation validation

## Troubleshooting

### Plugin Not Found

If you see "Package 'react-native-app-auth' does not contain a valid config plugin":

1. Ensure you're using the latest version of the library
2. Clear your cache: `npx expo install --fix`
3. Try `npx expo prebuild --clean` to regenerate projects

### URL Scheme Conflicts

If you have React Navigation deep linking, ensure your OAuth scheme is different:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-app-auth", 
        { "redirectUrls": ["com.myapp.auth://oauth"] }
      ]
    ]
  }
}
```


## Migration from Manual Setup

If you're migrating from manual iOS/Android setup:

1. Remove manual URL scheme configurations from `Info.plist` and `build.gradle`
2. Remove manual AppDelegate modifications (the plugin handles this automatically for Expo SDK 53+)
3. Add the plugin configuration to `app.json`
4. Run `npx expo prebuild --clean`

## Limitations

- **Expo SDK 53+ only**: Earlier versions require [manual setup](../#manual-setup)
- **CNG workflow only**: Expo Go is not supported (OAuth requires native configuration)
- **First-party providers**: Some OAuth providers may require additional native configuration

For advanced use cases or non-Expo projects, see the [Manual Setup Guide](../#manual-setup).