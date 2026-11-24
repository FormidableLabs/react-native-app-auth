import { withAppDelegate, ConfigPlugin } from '@expo/config-plugins';
import { assertSupportedExpoSdk, isSupportedExpoSdk } from '../expo-version';

const codeModIOs = require('@expo/config-plugins/build/ios/codeMod');

const APP_AUTH_PROTOCOL = 'RNAppAuthAuthorizationFlowManager';
const APP_AUTH_DELEGATE_PROPERTY =
  'public weak var authorizationFlowManagerDelegate: RNAppAuthAuthorizationFlowManagerDelegate?';
const APP_AUTH_DELEGATE_PROPERTY_PATTERN =
  /\bvar\s+authorizationFlowManagerDelegate\s*:\s*RNAppAuthAuthorizationFlowManagerDelegate\??/;
const APP_AUTH_USER_ACTIVITY_BLOCK = `if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
      let webpageURL = userActivity.webpageURL,
      let authorizationFlowManagerDelegate = self.authorizationFlowManagerDelegate,
      authorizationFlowManagerDelegate.resumeExternalUserAgentFlow(with: webpageURL) {
      return true
    }`;
const APP_AUTH_RESUME_BLOCK = `if let authorizationFlowManagerDelegate = self.authorizationFlowManagerDelegate {
      if authorizationFlowManagerDelegate.resumeExternalUserAgentFlow(with: url) {
        return true
      }
    }`;

const APP_DELEGATE_CLASS_PATTERN = /^(\s*(?:public\s+)?class\s+AppDelegate\s*:\s*ExpoAppDelegate)([^{]*)(\{)/m;
const OPEN_URL_PATTERN =
  /((?:public\s+)?override\s+func\s+application\s*\(\s*_\s+\w+\s*:\s*UIApplication\s*,\s*open\s+url\s*:\s*URL[^{]*\{)/m;
const USER_ACTIVITY_PATTERN =
  /((?:public\s+)?(?:override\s+)?func\s+application\s*\(\s*_\s+\w+\s*:\s*UIApplication\s*,\s*continue\s+userActivity\s*:\s*NSUserActivity[^{]*\{)/m;

// Expo SDK 58 templates no longer override these; ExpoAppSceneDelegate still routes
// scene URLs and user activities through them, so the plugin adds them when missing.
const OPEN_URL_OVERRIDE = `  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    ${APP_AUTH_RESUME_BLOCK}

    return super.application(app, open: url, options: options)
  }`;
const USER_ACTIVITY_OVERRIDE = `  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    ${APP_AUTH_USER_ACTIVITY_BLOCK}

    return super.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }`;

// Index of the brace that closes the AppDelegate class, skipping comments and string literals.
const findAppDelegateClassEnd = (contents: string): number => {
  const declaration = APP_DELEGATE_CLASS_PATTERN.exec(contents);
  if (!declaration) {
    return -1;
  }

  let depth = 0;
  for (let i = declaration.index + declaration[0].length - 1; i < contents.length; i++) {
    const char = contents[i];
    if (char === '/' && contents[i + 1] === '/') {
      const lineEnd = contents.indexOf('\n', i);
      i = lineEnd === -1 ? contents.length : lineEnd;
    } else if (char === '/' && contents[i + 1] === '*') {
      const commentEnd = contents.indexOf('*/', i + 2);
      i = commentEnd === -1 ? contents.length : commentEnd + 1;
    } else if (char === '"') {
      i++;
      while (i < contents.length && contents[i] !== '"' && contents[i] !== '\n') {
        i += contents[i] === '\\' ? 2 : 1;
      }
    } else if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
};

const appendToAppDelegateClass = (contents: string, member: string, description: string): string => {
  const classEnd = findAppDelegateClassEnd(contents);
  if (classEnd === -1) {
    throw new Error(
      `react-native-app-auth could not add ${description} because it could not find the Expo AppDelegate class`
    );
  }

  return `${contents.slice(0, classEnd).replace(/\s*$/, '')}\n\n${member}\n${contents.slice(classEnd)}`;
};

export const applyExpoAppDelegatePatch = (contents: string): string => {
  contents = contents.replace(
    APP_DELEGATE_CLASS_PATTERN,
    (match, declaration, conformances, openingBrace) => {
      if (conformances.includes(APP_AUTH_PROTOCOL)) {
        return match;
      }

      const trailingWhitespace = conformances.match(/\s*$/)?.[0] ?? '';
      const existingConformances = conformances.slice(
        0,
        conformances.length - trailingWhitespace.length
      );

      return `${declaration}${existingConformances}, ${APP_AUTH_PROTOCOL}${trailingWhitespace}${openingBrace}`;
    }
  );

  if (!APP_AUTH_DELEGATE_PROPERTY_PATTERN.test(contents)) {
    const reactNativeFactoryPattern =
      /^(\s*)(?:public\s+)?var\s+reactNativeFactory\s*:\s*RCTReactNativeFactory\?\s*$/m;
    const factoryMatch = contents.match(reactNativeFactoryPattern);
    if (factoryMatch) {
      const indent = factoryMatch[1];
      contents = contents.replace(
        reactNativeFactoryPattern,
        match => `${match}\n\n${indent}${APP_AUTH_DELEGATE_PROPERTY}`
      );
    }
  }

  if (!contents.includes('resumeExternalUserAgentFlow(with: url)')) {
    contents = OPEN_URL_PATTERN.test(contents)
      ? contents.replace(OPEN_URL_PATTERN, match => `${match}\n    ${APP_AUTH_RESUME_BLOCK}\n`)
      : appendToAppDelegateClass(contents, OPEN_URL_OVERRIDE, 'application(_:open:options:)');
  }

  if (!contents.includes('resumeExternalUserAgentFlow(with: webpageURL)')) {
    contents = USER_ACTIVITY_PATTERN.test(contents)
      ? contents.replace(USER_ACTIVITY_PATTERN, match => `${match}\n    ${APP_AUTH_USER_ACTIVITY_BLOCK}\n`)
      : appendToAppDelegateClass(
          contents,
          USER_ACTIVITY_OVERRIDE,
          'application(_:continue:restorationHandler:)'
        );
  }

  return contents;
};

const withAppDelegateSwift: ConfigPlugin = rootConfig => {
  return withAppDelegate(rootConfig, config => {
    assertSupportedExpoSdk(config, config.modRequest.projectRoot);
    config.modResults.contents = applyExpoAppDelegatePatch(config.modResults.contents);
    return config;
  });
};

export const withLegacyAppAuthAppDelegate: ConfigPlugin = rootConfig => {
  return withAppDelegate(rootConfig, config => {
    let { contents } = config.modResults;

    // insert the code that handles the custom scheme redirections
    contents = codeModIOs.insertContentsInsideObjcFunctionBlock(
      contents,
      'application:openURL:options:',
      `// react-native-app-auth
  if ([self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
    return YES;
  }
`,
      { position: 'head' }
    );

    config.modResults.contents = contents;
    return config;
  });
};

export const withAppAuthAppDelegate: ConfigPlugin = rootConfig => {
  if (isSupportedExpoSdk(rootConfig)) {
    return withAppDelegateSwift(rootConfig);
  }

  return withLegacyAppAuthAppDelegate(rootConfig);
};
