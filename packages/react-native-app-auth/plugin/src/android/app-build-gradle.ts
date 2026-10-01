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

// Preserve offsets and line breaks so edits apply to the original text.
// Quoted strings are consumed before looking for comments inside them.
const maskGradleSyntax = (contents: string, maskStrings = false): string =>
  contents.replace(
    /\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    token => token.startsWith('/') || maskStrings ? token.replace(/[^\r\n]/g, ' ') : token
  );

const mergeAppAuthRedirectSchemeManifestPlaceholder = (
  contents: string,
  appAuthRedirectScheme: string
): string => {
  const code = maskGradleSyntax(contents, true);
  const declaration = /\bmanifestPlaceholders\s*=\s*\[/.exec(code);
  if (!declaration) {
    return `${contents.slice(0, -1)}${createManifestPlaceholderBlock(appAuthRedirectScheme)}}`;
  }

  const entriesStart = declaration.index + declaration[0].length;
  let depth = 1;
  let entriesEnd = entriesStart;
  for (; entriesEnd < code.length; entriesEnd++) {
    if (code[entriesEnd] === '[') depth++;
    if (code[entriesEnd] === ']' && --depth === 0) break;
  }
  if (depth !== 0) {
    throw new Error('react-native-app-auth could not find the end of manifestPlaceholders.');
  }

  const entries = contents.slice(entriesStart, entriesEnd);
  const existingPlaceholderPattern = new RegExp(
    `(["']?${APP_AUTH_PLACEHOLDER_KEY}["']?\\s*:\\s*)("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`,
    'g'
  );
  for (const match of maskGradleSyntax(entries).matchAll(existingPlaceholderPattern)) {
    // A key in a quoted value is not an active map entry.
    const colon = match.index! + match[1].indexOf(':');
    if (code[entriesStart + colon] !== ':') continue;
    const valueStart = entriesStart + match.index! + match[1].length;
    const valueEnd = valueStart + match[2].length;
    const escapedScheme = appAuthRedirectScheme.replace(/'/g, "\\'");
    return `${contents.slice(0, valueStart)}'${escapedScheme}'${contents.slice(valueEnd)}`;
  }

  const escapedScheme = appAuthRedirectScheme.replace(/'/g, "\\'");
  let patchedEntries: string;
  if (!entries.trim()) {
    patchedEntries = `\n            ${APP_AUTH_PLACEHOLDER_KEY}: '${escapedScheme}',\n        `;
  } else if (entries.includes('\n')) {
    const closingIndent = entries.match(/\n(\s*)$/)?.[1] || '        ';
    // Add our entry first so trailing commas and comments remain untouched.
    patchedEntries = `\n${closingIndent}    ${APP_AUTH_PLACEHOLDER_KEY}: '${escapedScheme}',${entries}`;
  } else {
    patchedEntries = `${APP_AUTH_PLACEHOLDER_KEY}: '${escapedScheme}', ${entries.trim()}`;
  }
  return `${contents.slice(0, entriesStart)}${patchedEntries}${contents.slice(entriesEnd)}`;
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
  const patched = mergeAppAuthRedirectSchemeManifestPlaceholder(contents.slice(defaultConfig.start, defaultConfig.end + 1), appAuthRedirectScheme);
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
