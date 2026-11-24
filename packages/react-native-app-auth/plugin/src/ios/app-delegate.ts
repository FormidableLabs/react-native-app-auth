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

class UnreadableSwift extends Error {
  constructor(readonly what: string) {
    super(what);
  }
}

// Reads the comment or string literal that starts at `i` as Swift's lexer does, and returns the index
// of its last character, or null when neither starts there. `//` runs to the end of the line, and
// `/* */` comments nest. Only single-line strings are read: a form the scan does not model (a
// multi-line or raw string, a string inside an interpolation) or an unterminated string throws.
const readCommentOrString = (contents: string, i: number): { end: number } | null => {
  if (contents.startsWith('//', i)) {
    const lineEnd = contents.indexOf('\n', i);
    return { end: (lineEnd === -1 ? contents.length : lineEnd) - 1 };
  }
  if (contents.startsWith('/*', i)) {
    let depth = 0;
    for (let j = i; j < contents.length; j++) {
      if (contents.startsWith('/*', j)) {
        depth++;
        j++;
      } else if (contents.startsWith('*/', j)) {
        depth--;
        j++;
        if (depth === 0) {
          return { end: j };
        }
      }
    }
    return { end: contents.length - 1 };
  }
  if (contents[i] === '#' && /^#+"/.test(contents.slice(i))) {
    throw new UnreadableSwift('a raw string literal');
  }
  if (contents[i] !== '"') {
    return null;
  }
  if (contents.startsWith('"""', i)) {
    throw new UnreadableSwift('a multi-line string literal');
  }
  i++;
  while (contents[i] !== '"') {
    if (i >= contents.length || contents[i] === '\n') {
      throw new UnreadableSwift('an unterminated string literal');
    }
    if (contents[i] === '\\' && contents[i + 1] === '(') {
      // Interpolation: skip to its closing parenthesis; a string inside it is not read.
      let parens = 0;
      for (i++; i < contents.length; i++) {
        if (contents[i] === '"') {
          throw new UnreadableSwift('a string inside an interpolation');
        }
        if (contents[i] === '\n') {
          throw new UnreadableSwift('an unterminated string literal');
        }
        if (contents[i] === '(') {
          parens++;
        } else if (contents[i] === ')' && --parens === 0) {
          break;
        }
      }
      i++;
    } else {
      i += contents[i] === '\\' ? 2 : 1;
    }
  }
  return { end: i };
};

// Index of the brace that closes the AppDelegate class, skipping comments and single-line string
// literals, or -1 when there is no Expo AppDelegate class. Anything the scan cannot read for certain
// throws, so the plugin never adds methods inside a comment or a string.
const findAppDelegateClassEnd = (contents: string): number => {
  const declaration = APP_DELEGATE_CLASS_PATTERN.exec(contents);
  if (!declaration) {
    return -1;
  }

  let depth = 0;
  for (let i = declaration.index + declaration[0].length - 1; i < contents.length; i++) {
    const char = contents[i];
    let token: ReturnType<typeof readCommentOrString>;
    try {
      token = readCommentOrString(contents, i);
    } catch (error) {
      if (!(error instanceof UnreadableSwift)) {
        throw error;
      }
      throw new Error(
        `react-native-app-auth could not find the end of the AppDelegate class (it holds ${error.what}). Add application(_:open:options:) and application(_:continue:restorationHandler:) to AppDelegate.swift by hand, as shown in the Manual Setup section of the react-native-app-auth docs`
      );
    }
    if (token) {
      i = token.end;
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
