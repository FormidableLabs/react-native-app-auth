import { withAppBuildGradle, ConfigPlugin } from '@expo/config-plugins';
import {
  createGeneratedHeaderComment,
  removeGeneratedContents,
} from '@expo/config-plugins/build/utils/generateCode';
import { AppAuthProps } from '../types';

const codeModAndroid = require('@expo/config-plugins/build/android/codeMod');
const TAG = 'react-native-app-auth';

export const withAppAuthAppBuildGradle: ConfigPlugin<AppAuthProps | undefined> = (rootConfig, props) => {
  const scheme = props?.android?.appAuthRedirectScheme;
  if (!scheme) {
    return rootConfig;
  }
  if (typeof scheme !== 'string' || !/^[A-Za-z][A-Za-z0-9+.-]*$/.test(scheme)) {
    throw new Error('appAuthRedirectScheme must be a valid URL scheme');
  }

  return withAppBuildGradle(rootConfig, config => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('react-native-app-auth requires a Groovy app/build.gradle');
    }
    const contents = removeGeneratedContents(config.modResults.contents, TAG) ?? config.modResults.contents;
    const assignment = `    manifestPlaceholders.appAuthRedirectScheme = '${scheme}'`;
    const insertion = [
      createGeneratedHeaderComment(assignment, TAG, '//'),
      assignment,
      `// @generated end ${TAG}`,
      '',
    ].join('\n');
    config.modResults.contents = codeModAndroid.appendContentsInsideDeclarationBlock(
      contents,
      'defaultConfig',
      insertion
    );
    return config;
  });
};
