import * as fs from 'fs';
import * as path from 'path';
import { withDangerousMod, withXcodeProject, ConfigPlugin } from '@expo/config-plugins';
import { assertSupportedExpoSdk } from '../expo-version';

const BRIDGING_HEADER_NAME = 'AppDelegate+RNAppAuth.h';
const BRIDGING_HEADER_IMPORT = '#import "RNAppAuthAuthorizationFlowManager.h"';
const XCODE_BRIDGING_HEADER_SETTING = 'SWIFT_OBJC_BRIDGING_HEADER';

interface ConfigWithBridgingHeader {
  _appAuthBridgingHeaderPath?: string;
  [key: string]: any;
}

interface XcodeProjectLike {
  getBuildProperty(name: string, target: string): string | undefined;
  addBuildProperty(name: string, value: string, target: string): void;
}

const ignoredDirectoryNames = new Set([
  'Pods',
  'build',
  'DerivedData',
  '.git',
]);

export const findBridgingHeader = (dir: string): string | null => {
  if (!fs.existsSync(dir)) {
    return null;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const headerInCurrentDir = entries.find(
    entry => entry.isFile() && entry.name.endsWith('-Bridging-Header.h')
  );

  if (headerInCurrentDir) {
    return path.join(dir, headerInCurrentDir.name);
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || ignoredDirectoryNames.has(entry.name)) {
      continue;
    }

    if (entry.name.endsWith('.xcodeproj') || entry.name.endsWith('.xcworkspace')) {
      continue;
    }

    const found = findBridgingHeader(path.join(dir, entry.name));
    if (found) {
      return found;
    }
  }

  return null;
};

export const ensureBridgingHeaderImport = (contents: string): string => {
  if (contents.includes(BRIDGING_HEADER_IMPORT)) {
    return contents;
  }

  return `${BRIDGING_HEADER_IMPORT}\n${contents}`;
};

export const createBridgingHeaderContents = (): string => `${BRIDGING_HEADER_IMPORT}\n`;

export const createXcodeBridgingHeaderBuildSetting = (relativeHeaderPath: string): string =>
  `$(SRCROOT)/${relativeHeaderPath}`;

export const ensureXcodeBridgingHeaderBuildSetting = (
  project: XcodeProjectLike,
  target: string,
  relativeHeaderPath?: string
): boolean => {
  if (!relativeHeaderPath) {
    return false;
  }

  const currentSetting = project.getBuildProperty(XCODE_BRIDGING_HEADER_SETTING, target);
  if (currentSetting) {
    return false;
  }

  project.addBuildProperty(
    XCODE_BRIDGING_HEADER_SETTING,
    createXcodeBridgingHeaderBuildSetting(relativeHeaderPath),
    target
  );
  return true;
};

export const withBridgingHeader: ConfigPlugin = rootConfig => {
  return withDangerousMod(rootConfig, [
    'ios',
    config => {
      assertSupportedExpoSdk(config, config.modRequest.projectRoot);

      const iosPath = path.join(config.modRequest.projectRoot, 'ios');
      const existingHeaderPath = findBridgingHeader(iosPath);
      let headerPath: string;

      if (existingHeaderPath) {
        headerPath = existingHeaderPath;
        const content = fs.readFileSync(headerPath, 'utf8');
        fs.writeFileSync(headerPath, ensureBridgingHeaderImport(content), 'utf8');
      } else {
        headerPath = path.join(iosPath, BRIDGING_HEADER_NAME);
        fs.writeFileSync(headerPath, createBridgingHeaderContents(), 'utf8');
      }

      (config as ConfigWithBridgingHeader)._appAuthBridgingHeaderPath = path.relative(
        iosPath,
        headerPath
      );

      return config;
    },
  ]);
};

export const withXcodeBuildSettings: ConfigPlugin = rootConfig =>
  withXcodeProject(rootConfig, config => {
    assertSupportedExpoSdk(config, config.modRequest.projectRoot);

    const project = config.modResults;
    const target = project.getFirstTarget().uuid;

    ensureXcodeBridgingHeaderBuildSetting(
      project,
      target,
      (config as ConfigWithBridgingHeader)._appAuthBridgingHeaderPath
    );

    return config;
  });
