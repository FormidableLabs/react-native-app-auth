import * as fs from 'fs';
import * as path from 'path';
import { IOSConfig, withXcodeProject, ConfigPlugin } from '@expo/config-plugins';
import { assertSupportedExpoSdk } from '../expo-version';

type XcodeProject = Parameters<typeof IOSConfig.XcodeUtils.getBuildConfigurationsForListId>[0];

const BRIDGING_HEADER_NAME = 'AppDelegate+RNAppAuth.h';
const BRIDGING_HEADER_IMPORT = '#import "RNAppAuthAuthorizationFlowManager.h"';
const XCODE_BRIDGING_HEADER_SETTING = 'SWIFT_OBJC_BRIDGING_HEADER';

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

const getTargetConfigurations = (project: XcodeProject, target: string) =>
  IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
    project,
    project.pbxNativeTargetSection()[target].buildConfigurationList
  );

const getInheritedSettings = (
  project: XcodeProject,
  configuration: ReturnType<typeof getTargetConfigurations>[number][1]
) => {
  const projectConfigurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
    project,
    project.getFirstProject().firstProject.buildConfigurationList
  );
  return projectConfigurations.find(([, entry]) => entry.name === configuration.name)?.[1].buildSettings;
};

const getConfiguredBridgingHeader = (
  project: XcodeProject,
  configuration: ReturnType<typeof getTargetConfigurations>[number][1]
): string | undefined => {
  return configuration.buildSettings[XCODE_BRIDGING_HEADER_SETTING] ||
    getInheritedSettings(project, configuration)?.[XCODE_BRIDGING_HEADER_SETTING];
};

export const ensureXcodeBridgingHeaderBuildSetting = (
  project: XcodeProject,
  target: string,
  relativeHeaderPath?: string,
  iosPath = path.dirname(path.dirname(project.filepath))
): boolean => {
  if (!relativeHeaderPath) {
    return false;
  }

  let added = false;
  for (const [, configuration] of getTargetConfigurations(project, target)) {
    const setting = getConfiguredBridgingHeader(project, configuration);
    if (!setting || !resolveConfiguredHeaderPath(setting, iosPath, project, configuration)) {
      configuration.buildSettings[XCODE_BRIDGING_HEADER_SETTING] =
        createXcodeBridgingHeaderBuildSetting(relativeHeaderPath);
      added = true;
    }
  }
  return added;
};

const resolveConfiguredHeaderPath = (
  setting: string,
  iosPath: string,
  project: XcodeProject,
  configuration: ReturnType<typeof getTargetConfigurations>[number][1]
): string | undefined => {
  const variables: Record<string, unknown> = {
    ...getInheritedSettings(project, configuration),
    ...configuration.buildSettings,
    SRCROOT: iosPath,
    PROJECT_DIR: iosPath,
    PROJECT_NAME: path.basename(path.dirname(project.filepath), '.xcodeproj'),
    TARGET_NAME: project.getFirstTarget().firstTarget.name,
    inherited: getInheritedSettings(project, configuration)?.[XCODE_BRIDGING_HEADER_SETTING] || '',
  };
  let headerPath = setting.replace(/^"|"$/g, '');
  for (let pass = 0; pass < 10 && headerPath.includes('$'); pass++) {
    const expanded = headerPath.replace(/\$\((\w+)\)|\$\{(\w+)\}/g, (match, parenthesized, braced) => {
      const value = variables[parenthesized || braced];
      return typeof value === 'string' ? value.replace(/^"|"$/g, '') : match;
    });
    if (expanded === headerPath) break;
    headerPath = expanded;
  }
  if (headerPath.includes('$')) {
    throw new Error(`react-native-app-auth cannot resolve SWIFT_OBJC_BRIDGING_HEADER: ${setting}`);
  }
  return headerPath.trim() ? path.resolve(iosPath, headerPath) : undefined;
};

export const withBridgingHeader: ConfigPlugin = rootConfig =>
  withXcodeProject(rootConfig, config => {
    assertSupportedExpoSdk(config, config.modRequest.projectRoot);

    const iosPath = config.modRequest.platformProjectRoot;
    const project = config.modResults;
    const target = project.getFirstTarget().uuid;
    const configurations = getTargetConfigurations(project, target);
    const configuredHeaders = configurations
      .map(([, configuration]) => {
        const setting = getConfiguredBridgingHeader(project, configuration);
        return setting ? resolveConfiguredHeaderPath(setting, iosPath, project, configuration) : undefined;
      })
      .filter((headerPath): headerPath is string => Boolean(headerPath));
    const fallbackHeader = configuredHeaders[0] || findBridgingHeader(iosPath) ||
      path.join(iosPath, BRIDGING_HEADER_NAME);

    ensureXcodeBridgingHeaderBuildSetting(project, target, path.relative(iosPath, fallbackHeader), iosPath);
    for (const headerPath of new Set([...configuredHeaders, fallbackHeader])) {
      const contents = fs.existsSync(headerPath) ? fs.readFileSync(headerPath, 'utf8') : '';
      fs.mkdirSync(path.dirname(headerPath), { recursive: true });
      fs.writeFileSync(headerPath, ensureBridgingHeaderImport(contents), 'utf8');
    }

    return config;
  });
