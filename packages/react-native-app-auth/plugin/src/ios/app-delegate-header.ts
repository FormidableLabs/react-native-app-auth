import * as fs from 'fs';
import { IOSConfig, withDangerousMod, ConfigPlugin } from '@expo/config-plugins';
import { isExpo53OrLater } from '../expo-version';
import { insertProtocolDeclaration } from './utils/insert-protocol-declaration';

const codeModIOs = require('@expo/config-plugins/build/ios/codeMod');

export const withAppAuthAppDelegateHeader: ConfigPlugin = rootConfig => {
  if (isExpo53OrLater(rootConfig)) {
    return rootConfig;
  }

  return withDangerousMod(rootConfig, [
    'ios',
    config => {
      // find the AppDelegate.h file in the project
      const headerFilePath = IOSConfig.Paths.getAppDelegateObjcHeaderFilePath(
        config.modRequest.projectRoot
      );

      // BEWARE: we update the AppDelegate.h file *outside* of the standard Expo config procedure !
      let contents = fs.readFileSync(headerFilePath, 'utf8');

      const importExpoHeader = '#import <Expo/Expo.h>';
      const importRNAppAuthHeaders =
        '#import <React/RCTLinkingManager.h>\n#import "RNAppAuthAuthorizationFlowManager.h"';

      contents = contents.replace(
        importExpoHeader,
        `${importExpoHeader}\n${importRNAppAuthHeaders}`
      );

      // adds a new protocol to the AppDelegate interface (unless it already exists)
      contents = insertProtocolDeclaration({
        source: contents,
        interfaceName: 'AppDelegate',
        protocolName: 'RNAppAuthAuthorizationFlowManager',
        baseClassName: 'EXAppDelegateWrapper',
      });

      contents = codeModIOs.insertContentsInsideObjcInterfaceBlock(
        contents,
        '@interface AppDelegate',
        `\n
@property(nonatomic, weak) id<RNAppAuthAuthorizationFlowManagerDelegate> authorizationFlowManagerDelegate;`,
        { position: 'head' }
      );

      // and finally we write the file back to the disk
      fs.writeFileSync(headerFilePath, contents, 'utf8');

      return config;
    },
  ]);
};