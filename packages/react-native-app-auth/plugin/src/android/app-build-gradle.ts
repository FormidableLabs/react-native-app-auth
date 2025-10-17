import * as fs from 'fs';
import { AndroidConfig, withDangerousMod, ConfigPlugin } from '@expo/config-plugins';
import { AppAuthProps } from '../types';

const codeModAndroid = require('@expo/config-plugins/build/android/codeMod');

export const withAppAuthAppBuildGradle: ConfigPlugin<AppAuthProps | undefined> = (rootConfig, props) =>
  withDangerousMod(rootConfig, [
    'android',
    config => {
      // find the app/build.gradle file and checks its format
      const appBuildGradlePath = AndroidConfig.Paths.getAppBuildGradleFilePath(
        config.modRequest.projectRoot
      );

      // BEWARE: we update the app/build.gradle file *outside* of the standard Expo config procedure !
      let contents = fs.readFileSync(appBuildGradlePath, 'utf8');

      if (contents.includes('manifestPlaceholders')) {
        throw new Error(
          'app/build.gradle already contains manifestPlaceholders, cannot update automatically !'
        );
      }

      contents = codeModAndroid.appendContentsInsideDeclarationBlock(
        contents,
        'defaultConfig',
        `    manifestPlaceholders = [
            appAuthRedirectScheme: '${props?.android?.appAuthRedirectScheme}',
        ]
    `
      );

      // and finally we write the file back to the disk
      fs.writeFileSync(appBuildGradlePath, contents, 'utf8');

      return config;
    },
  ]);