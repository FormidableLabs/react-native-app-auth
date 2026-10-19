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

export const applyExpoAppDelegatePatch = (contents: string): string => {
  contents = contents.replace(
    /^(\s*(?:public\s+)?class\s+AppDelegate\s*:\s*ExpoAppDelegate)([^{]*)(\{)/m,
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
    contents = contents.replace(
      /((?:public\s+)?override\s+func\s+application\s*\([\s\S]*?open\s+url\s*:\s*URL[\s\S]*?\)\s*->\s*Bool\s*\{)/m,
      match => `${match}\n    ${APP_AUTH_RESUME_BLOCK}\n`
    );
  }

  if (!contents.includes('resumeExternalUserAgentFlow(with: webpageURL)')) {
    const userActivityPattern =
      /((?:public\s+)?(?:override\s+)?func\s+application\s*\([\s\S]*?continue\s+userActivity\s*:\s*NSUserActivity[\s\S]*?\)\s*->\s*Bool\s*\{)/m;
    if (!userActivityPattern.test(contents)) {
      throw new Error(
        'react-native-app-auth could not find application(_:continue:restorationHandler:) in the Expo AppDelegate'
      );
    }
    contents = contents.replace(
      userActivityPattern,
      match => `${match}\n    ${APP_AUTH_USER_ACTIVITY_BLOCK}\n`
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
