import { withAppDelegate, ConfigPlugin } from '@expo/config-plugins';
import { assertExpo53OrLater, isExpo53OrLater } from '../expo-version';

const codeModIOs = require('@expo/config-plugins/build/ios/codeMod');

const APP_AUTH_PROTOCOL = 'RNAppAuthAuthorizationFlowManager';
const APP_AUTH_DELEGATE_PROPERTY =
  'public weak var authorizationFlowManagerDelegate: RNAppAuthAuthorizationFlowManagerDelegate?';
const APP_AUTH_DELEGATE_PROPERTY_PATTERN =
  /\bvar\s+authorizationFlowManagerDelegate\s*:\s*RNAppAuthAuthorizationFlowManagerDelegate\??/;
const APP_AUTH_RESUME_BLOCK = `if let authorizationFlowManagerDelegate = self.authorizationFlowManagerDelegate {
      if authorizationFlowManagerDelegate.resumeExternalUserAgentFlow(with: url) {
        return true
      }
    }`;

export const applyExpo53AppDelegatePatch = (contents: string): string => {
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

  return contents;
};

const withAppDelegateSwift: ConfigPlugin = rootConfig => {
  return withAppDelegate(rootConfig, config => {
    assertExpo53OrLater(config, config.modRequest.projectRoot);
    config.modResults.contents = applyExpo53AppDelegatePatch(config.modResults.contents);
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
  if (isExpo53OrLater(rootConfig)) {
    return withAppDelegateSwift(rootConfig);
  }

  return withLegacyAppAuthAppDelegate(rootConfig);
};
