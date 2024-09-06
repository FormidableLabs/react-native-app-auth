const { withAppDelegate } = require('@expo/config-plugins');
const codeModIOs = require('@expo/config-plugins/build/ios/codeMod');
const {
  createGeneratedHeaderComment,
  removeContents,
} = require('@expo/config-plugins/build/utils/generateCode');

const withAppAuthAppDelegate = (rootConfig) =>
  withAppDelegate(rootConfig, (config) => {
    let { contents } = config.modResults;

    // generation tags & headers
    const tag1 = 'react-native-app-auth custom scheme';
    const tag2 = 'react-native-app-auth deep linking';
    const header1 = createGeneratedHeaderComment(contents, tag1, '//');
    const header2 = createGeneratedHeaderComment(contents, tag2, '//');

    // insert the code that handles the custom scheme redirections
    contents = removeContents({ src: contents, tag: tag1 }).contents;
    contents = codeModIOs.insertContentsInsideObjcFunctionBlock(
      contents,
      'application:openURL:options:',
      `  ${header1}
      if ([self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:url]) {
        return YES;
      }
      // @generated end ${tag1}`,
      { position: 'head' }
    );

    // insert the code that handles the deep linking continuation
    contents = removeContents({ src: contents, tag: tag2 }).contents;
    contents = codeModIOs.insertContentsInsideObjcFunctionBlock(
      contents,
      'application:continueUserActivity:restorationHandler:',
      `  ${header2}
      if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
        if (self.authorizationFlowManagerDelegate) {
          BOOL resumableAuth = [self.authorizationFlowManagerDelegate resumeExternalUserAgentFlowWithURL:userActivity.webpageURL];
          if (resumableAuth) {
            return YES;
          }
        }
      }
      // @generated end ${tag2}`,
      { position: 'head' }
    );

    config.modResults.contents = contents;
    return config;
  });

module.exports = {
  withAppAuthAppDelegate,
};
