const { AndroidConfig, withDangerousMod } = require('@expo/config-plugins');
const {
  createGeneratedHeaderComment,
  removeContents,
} = require('@expo/config-plugins/build/utils/generateCode');
const codeModAndroid = require('@expo/config-plugins/build/android/codeMod');
const fs = require('fs');

const withAppAuthAppBuildGradle = (rootConfig, options) =>
  withDangerousMod(rootConfig, [
    'android',
    config => {
      // detauls to app scheme
      const authScheme = options?.authScheme ?? config.scheme ?? '';

      // find the app/build.gradle file and checks its format
      const appBuildGradlePath = AndroidConfig.Paths.getAppBuildGradleFilePath(
        config.modRequest.projectRoot
      );

      // BEWARE: we update the app/build.gradle file *outside* of the standard Expo config procedure !
      let contents = fs.readFileSync(appBuildGradlePath, 'utf-8');

      if (contents.includes('manifestPlaceholders')) {
        throw new Error(
          'app/build.gradle already contains manifestPlaceholders, cannot update automatically !'
        );
      }

      // let's add the manifestPlaceholders section !
      contents = removeContents({
        src: contents,
        tag: 'react-native-app-auth',
      }).contents;
      contents = codeModAndroid.appendContentsInsideDeclarationBlock(
        contents,
        'defaultConfig',
        `
        ${createGeneratedHeaderComment(contents, 'react-native-app-auth', '//')}
        manifestPlaceholders = [
          'appAuthRedirectScheme': '${authScheme}',
        ]
        // @generated end react-native-app-auth
`
      );

      // and finally we write the file back to the disk
      fs.writeFileSync(appBuildGradlePath, contents, 'utf-8');

      return config;
    },
  ]);

module.exports = { withAppAuthAppBuildGradle };
