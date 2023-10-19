const { IOSConfig, withDangerousMod } = require('@expo/config-plugins');
const codeModIOs = require('@expo/config-plugins/build/ios/codeMod');
const {
  createGeneratedHeaderComment,
  removeContents,
} = require('@expo/config-plugins/build/utils/generateCode');
const fs = require('fs');
const { insertProtocolDeclaration } = require('./utils/insert-protocol-declaration');

const withAppAuthAppDelegateHeader = rootConfig =>
  withDangerousMod(rootConfig, [
    'ios',
    config => {
      // find the AppDelegate.h file in the project
      const headerFilePath = IOSConfig.Paths.getAppDelegateObjcHeaderFilePath(
        config.modRequest.projectRoot
      );

      // BEWARE: we update the AppDelegate.h file *outside* of the standard Expo config procedure !
      let contents = fs.readFileSync(headerFilePath, 'utf-8');

      // add a new import (unless it already exists)
      contents = codeModIOs.addObjcImports(contents, ['"RNAppAuthAuthorizationFlowManager.h"']);

      // adds a new protocol to the AppDelegate interface (unless it already exists)
      contents = insertProtocolDeclaration({
        source: contents,
        interfaceName: 'AppDelegate',
        protocolName: 'RNAppAuthAuthorizationFlowManager',
        baseClassName: 'EXAppDelegateWrapper',
      });

      // add a new property to the AppDelegate interface (unless it already exists)
      contents = removeContents({
        src: contents,
        tag: 'react-native-app-auth',
      }).contents;
      contents = codeModIOs.insertContentsInsideObjcInterfaceBlock(
        contents,
        '@interface AppDelegate',
        `
${createGeneratedHeaderComment(contents, 'react-native-app-auth', '//')}
@property(nonatomic, weak) id<RNAppAuthAuthorizationFlowManagerDelegate> authorizationFlowManagerDelegate;
// @generated end react-native-app-auth`,
        { position: 'head' }
      );

      // and finally we write the file back to the disk
      fs.writeFileSync(headerFilePath, contents, 'utf-8');

      return config;
    },
  ]);

module.exports = {
  withAppAuthAppDelegateHeader,
};
