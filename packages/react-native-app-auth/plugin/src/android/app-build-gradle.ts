import * as fs from 'fs';
import { AndroidConfig, withDangerousMod, ConfigPlugin } from '@expo/config-plugins';
import { AppAuthProps } from '../types';
import { assertSupportedExpoSdk } from '../expo-version';

const codeModAndroid = require('@expo/config-plugins/build/android/codeMod');

const APP_AUTH_PLACEHOLDER_KEY = 'appAuthRedirectScheme';

// Preserve offsets and line breaks so edits apply to the original text.
// Quoted strings are consumed before looking for comments inside them.
const maskGradleSyntax = (contents: string, maskStrings = false): string =>
  contents.replace(
    /\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    token => token.startsWith('/') || maskStrings ? token.replace(/[^\r\n]/g, ' ') : token
  );

const setAppAuthRedirectSchemeManifestPlaceholder = (
  contents: string,
  appAuthRedirectScheme: string
): string => {
  const code = maskGradleSyntax(contents, true);
  const escapedScheme = appAuthRedirectScheme.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const assignmentPattern = new RegExp(
    `(\\bmanifestPlaceholders\\s*\\.\\s*${APP_AUTH_PLACEHOLDER_KEY}\\s*=\\s*)("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`,
    'g'
  );
  for (const match of maskGradleSyntax(contents).matchAll(assignmentPattern)) {
    // Only reuse an active assignment at the end of defaultConfig. Earlier
    // assignments can be overwritten by a later map replacement or addition.
    const startsStatement = /(?:^|[;{}\r\n])\s*$/.test(code.slice(0, match.index!));
    const endsBlock = /^;?\s*}$/.test(code.slice(match.index! + match[0].length).trim());
    if (code[match.index!] !== 'm' || !startsStatement || !endsBlock) {
      continue;
    }
    const valueStart = match.index! + match[1].length;
    const valueEnd = valueStart + match[2].length;
    return `${contents.slice(0, valueStart)}'${escapedScheme}'${contents.slice(valueEnd)}`;
  }

  // Let Gradle evaluate its maps/expressions, then change only our key. This
  // preserves unrelated placeholders and supports both '=' and '+=' syntax.
  const closingIndent = contents.match(/(?:^|\n)([ \t]*)}$/)?.[1] || '';
  const prefix = contents.slice(0, -1 - closingIndent.length);
  const newline = contents.includes('\r\n') ? '\r\n' : '\n';
  const separator = prefix.endsWith('\n') ? '' : newline;
  return `${prefix}${separator}${closingIndent}    manifestPlaceholders.${APP_AUTH_PLACEHOLDER_KEY} = '${escapedScheme}'${newline}${closingIndent}}`;
};

export const applyAppAuthRedirectSchemeManifestPlaceholder = (
  contents: string,
  appAuthRedirectScheme?: string
): string => {
  if (!appAuthRedirectScheme) {
    return contents;
  }
  const defaultConfig = codeModAndroid.findGradlePluginCodeBlock(maskGradleSyntax(contents, true), 'defaultConfig');
  if (!defaultConfig) {
    throw new Error('react-native-app-auth could not find defaultConfig in app/build.gradle.');
  }
  const patched = setAppAuthRedirectSchemeManifestPlaceholder(contents.slice(defaultConfig.start, defaultConfig.end + 1), appAuthRedirectScheme);
  return `${contents.slice(0, defaultConfig.start)}${patched}${contents.slice(defaultConfig.end + 1)}`;
};

export const withAppAuthAppBuildGradle: ConfigPlugin<AppAuthProps | undefined> = (rootConfig, props) =>
  withDangerousMod(rootConfig, [
    'android',
    config => {
      assertSupportedExpoSdk(config, config.modRequest.projectRoot);

      // find the app/build.gradle file and checks its format
      const appBuildGradlePath = AndroidConfig.Paths.getAppBuildGradleFilePath(
        config.modRequest.projectRoot
      );

      // BEWARE: we update the app/build.gradle file *outside* of the standard Expo config procedure !
      let contents = fs.readFileSync(appBuildGradlePath, 'utf8');

      contents = applyAppAuthRedirectSchemeManifestPlaceholder(
        contents,
        props?.android?.appAuthRedirectScheme
      );

      // and finally we write the file back to the disk
      fs.writeFileSync(appBuildGradlePath, contents, 'utf8');

      return config;
    },
  ]);
