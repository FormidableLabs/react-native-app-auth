import * as fs from 'fs';
import { AndroidConfig, withDangerousMod, ConfigPlugin } from '@expo/config-plugins';
import { AppAuthProps } from '../types';
import { assertSupportedExpoSdk } from '../expo-version';

const codeModAndroid = require('@expo/config-plugins/build/android/codeMod');

const APP_AUTH_PLACEHOLDER_KEY = 'appAuthRedirectScheme';

const createManifestPlaceholderBlock = (appAuthRedirectScheme: string): string => `    manifestPlaceholders = [
            ${APP_AUTH_PLACEHOLDER_KEY}: '${appAuthRedirectScheme}',
        ]
    `;

const mergeAppAuthRedirectSchemeManifestPlaceholder = (
  contents: string,
  appAuthRedirectScheme: string
): string => {
  const existingPlaceholderPattern = new RegExp(
    `(["']?${APP_AUTH_PLACEHOLDER_KEY}["']?\\s*:\\s*)["'][^"']*["']`
  );

  if (existingPlaceholderPattern.test(contents)) {
    return contents.replace(
      existingPlaceholderPattern,
      `$1'${appAuthRedirectScheme.replace(/'/g, "\\'")}'`
    );
  }

  const manifestPlaceholdersPattern = /(manifestPlaceholders\s*=\s*\[)([\s\S]*?)(\])/m;
  if (manifestPlaceholdersPattern.test(contents)) {
    return contents.replace(
      manifestPlaceholdersPattern,
      (match, opening, entries, closing) => {
        const escapedScheme = appAuthRedirectScheme.replace(/'/g, "\\'");

        if (!entries.trim()) {
          return `${opening}\n            ${APP_AUTH_PLACEHOLDER_KEY}: '${escapedScheme}',\n        ${closing}`;
        }

        if (entries.includes('\n')) {
          const closingIndent = match.match(/\n(\s*)\]$/)?.[1] || '        ';
          const entryIndent = `${closingIndent}    `;
          // Add our entry first so trailing commas and comments remain untouched.
          return `${opening}\n${entryIndent}${APP_AUTH_PLACEHOLDER_KEY}: '${escapedScheme}',${entries}${closing}`;
        }

        return `${opening}${APP_AUTH_PLACEHOLDER_KEY}: '${escapedScheme}', ${entries.trim()}${closing}`;
      }
    );
  }

  return `${contents.slice(0, -1)}${createManifestPlaceholderBlock(appAuthRedirectScheme)}}`;
};

export const applyAppAuthRedirectSchemeManifestPlaceholder = (
  contents: string,
  appAuthRedirectScheme?: string
): string => {
  if (!appAuthRedirectScheme) {
    return contents;
  }
  const defaultConfig = codeModAndroid.findGradlePluginCodeBlock(contents, 'defaultConfig');
  if (!defaultConfig) {
    throw new Error('react-native-app-auth could not find defaultConfig in app/build.gradle.');
  }
  const patched = mergeAppAuthRedirectSchemeManifestPlaceholder(defaultConfig.code, appAuthRedirectScheme);
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
