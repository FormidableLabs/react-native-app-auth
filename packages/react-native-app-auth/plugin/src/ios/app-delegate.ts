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
  const appDelegatePattern =
    /^(\s*(?:(?:public|open|final)\s+)*class\s+AppDelegate\s*:\s*ExpoAppDelegate)([^{]*)(\{)/m;
  if (!appDelegatePattern.test(contents)) {
    throw new Error('Unable to find the Expo AppDelegate declaration; configure AppAuth manually');
  }
  contents = contents.replace(
    appDelegatePattern,
    (match, declaration, conformances, openingBrace) => {
      if (conformances.split(',').some((protocol: string) => protocol.trim() === APP_AUTH_PROTOCOL)) {
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
    contents = contents.replace(
      appDelegatePattern,
      match => `${match}\n  ${APP_AUTH_DELEGATE_PROPERTY}\n`
    );
  }

  if (!contents.includes('resumeExternalUserAgentFlow(with: url)')) {
    const openUrlPattern =
      /((?:public\s+)?override\s+func\s+application\s*\([^)]*\bopen\s+url\s*:\s*URL[^)]*\)\s*->\s*Bool\s*\{)/m;
    if (!openUrlPattern.test(contents)) {
      throw new Error('Unable to find the AppDelegate open URL handler; configure AppAuth manually');
    }
    contents = contents.replace(
      openUrlPattern,
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
