import { withAppDelegate, ConfigPlugin } from '@expo/config-plugins';
import { isExpo53OrLater } from '../expo-version';

const codeModIOs = require('@expo/config-plugins/build/ios/codeMod');

const withAppDelegateSwift: ConfigPlugin = rootConfig => {
  return withAppDelegate(rootConfig, config => {
    let { contents } = config.modResults;

    if (!contents.includes('RNAppAuthAuthorizationFlowManager')) {
      const replaceText = 'public class AppDelegate: ExpoAppDelegate';
      contents = contents.replace(replaceText, `${replaceText}, RNAppAuthAuthorizationFlowManager`);

      const replaceText2 =
        'return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)';
      contents = contents.replace(
        replaceText2,
        `if let authorizationFlowManagerDelegate = self.authorizationFlowManagerDelegate {
      if authorizationFlowManagerDelegate.resumeExternalUserAgentFlow(with: url) {
         return true
      }
    }
    ${replaceText2}`
      );

      const replaceText3 = 'var reactNativeFactory: RCTReactNativeFactory?';
      contents = contents.replace(
        replaceText3,
        `${replaceText3}\n\n  public weak var authorizationFlowManagerDelegate: RNAppAuthAuthorizationFlowManagerDelegate?`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};

export const withAppAuthAppDelegate: ConfigPlugin = rootConfig => {
  if (isExpo53OrLater(rootConfig)) {
    return withAppDelegateSwift(rootConfig);
  }

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