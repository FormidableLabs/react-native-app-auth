# Expo CNG TypeScript Example for react-native-app-auth

This example demonstrates how to use the `react-native-app-auth` Expo config plugin with Continuous Native Generation (CNG) in a TypeScript project.

## What This Example Tests

1. **Config Plugin Integration**: Validates that the plugin properly configures native projects
2. **TypeScript Support**: Demonstrates full type safety with react-native-app-auth
3. **URL Scheme Configuration**: Tests that OAuth redirect URLs are correctly configured
4. **Platform-specific Setup**: Ensures both iOS and Android native configurations work
5. **CNG Compatibility**: Validates the plugin works with Expo's continuous native generation

## Setup Instructions

### 1. Install Dependencies

From the repository root:
```bash
yarn install
```

### 2. Generate Native Code

Since this is a CNG (Continuous Native Generation) project, you need to generate the native code:

```bash
cd examples/expo-cng
npx expo prebuild
```

This will:
- Generate the `ios/` and `android/` directories
- Apply the react-native-app-auth config plugin
- Configure URL schemes and native project settings

### 3. Run the App

For iOS:
```bash
npx expo run:ios
```

For Android:
```bash
npx expo run:android
```

## TypeScript Benefits

This example showcases:

- **Type-safe Configuration**: `AuthConfiguration` interface ensures correct config
- **Typed Results**: `AuthorizeResult` provides IntelliSense for auth responses
- **Error Handling**: Proper TypeScript error handling with type assertions
- **IDE Support**: Full autocomplete and type checking in development

## What the Plugin Should Configure

### iOS Configuration
- **URL Schemes**: Adds the redirect URL scheme to `Info.plist`
- **Bridging Header**: Configures Objective-C bridging for React Native
- **Build Settings**: Adds necessary Xcode build settings
- **App Delegate**: Configures the app delegate to handle OAuth callbacks

### Android Configuration
- **Manifest Placeholders**: Adds URL scheme handling to `AndroidManifest.xml`
- **Build Gradle**: Configures the app-level build.gradle file

## Validation Steps

To validate the plugin is working correctly:

1. **Check Native Files**: After running `npx expo prebuild`, inspect the generated native files:
   - iOS: Check `ios/expocng/Info.plist` for URL schemes containing `com.example.expo-cng`
   - Android: Check `android/app/build.gradle` for `appAuthRedirectScheme: 'com.example.expo-cng'`

2. **TypeScript Compilation**: The app should compile without TypeScript errors

3. **Build Verification**: The app should build successfully without manual native configuration

## Troubleshooting

### Plugin Not Applied
If the plugin doesn't seem to be working:
```bash
# Clean and regenerate
npx expo prebuild --clean
```

### TypeScript Errors
If you see TypeScript errors related to react-native-app-auth:
- Ensure the library is properly installed: `yarn install`
- Check that types are imported correctly from the main library

### URL Scheme Issues
The example uses a demo OAuth provider. For production use, configure your own OAuth provider and update the `config` object in `App.tsx`.

### Build Errors
If you encounter build errors:
1. Ensure all dependencies are installed: `yarn install`
2. Clean and rebuild: `npx expo prebuild --clean`
3. Check that the plugin version matches the library version

## Plugin Configuration Options

The plugin accepts these options in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-app-auth",
        {
          "redirectUrls": ["your-app-scheme://oauth"]
        }
      ]
    ]
  }
}
```

Currently, only `redirectUrls` is configurable. The plugin will automatically set up all necessary native configurations based on this URL scheme.

## TypeScript Types

The example imports and uses these types from react-native-app-auth:

```typescript
import { 
  authorize, 
  AuthConfiguration, 
  AuthorizeResult 
} from 'react-native-app-auth';
```

This ensures full type safety throughout the authentication flow.