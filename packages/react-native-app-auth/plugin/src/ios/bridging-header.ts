import * as fs from 'fs';
import * as path from 'path';
import { IOSConfig, withXcodeProject, ConfigPlugin } from '@expo/config-plugins';
import { isExpo53OrLater } from '../expo-version';

const BRIDGING_HEADER_NAME = 'AppDelegate+RNAppAuth.h';
const BRIDGING_HEADER_IMPORT = '#import "RNAppAuthAuthorizationFlowManager.h"';

export const withBridgingHeader: ConfigPlugin = rootConfig => {
  if (!isExpo53OrLater(rootConfig)) {
    return rootConfig;
  }

  return withXcodeProject(rootConfig, config => {
    const project = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const iosRoot = path.join(projectRoot, 'ios');
    const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
    const { target } = IOSConfig.XcodeUtils.getApplicationNativeTarget({ project, projectName });
    const configurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      project,
      target.buildConfigurationList
    );
    const projectConfigurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      project,
      project.getFirstProject().firstProject.buildConfigurationList
    );
    const defaultHeader = path.join(
      path.dirname(IOSConfig.Paths.getAppDelegateFilePath(projectRoot)),
      BRIDGING_HEADER_NAME
    );
    const headers = new Map<string, string>();

    for (const [, configuration] of configurations) {
      const inherited = projectConfigurations.find(([, item]) => item.name === configuration.name)?.[1].buildSettings ?? {};
      const settings = { ...inherited, ...configuration.buildSettings };
      const configuredHeader = settings.SWIFT_OBJC_BRIDGING_HEADER;
      let headerPath = defaultHeader;

      if (configuredHeader) {
        const variables: Record<string, string> = {
          ...settings,
          SRCROOT: iosRoot,
          PROJECT_DIR: iosRoot,
          PROJECT_NAME: projectName,
          TARGET_NAME: IOSConfig.XcodeUtils.unquote(target.name),
          CONFIGURATION: IOSConfig.XcodeUtils.unquote(configuration.name),
          inherited: inherited.SWIFT_OBJC_BRIDGING_HEADER ?? '',
        };
        const resolved = IOSConfig.XcodeUtils.resolveXcodeBuildSetting(
          IOSConfig.XcodeUtils.unquote(configuredHeader).replace(/\$\{([^}]+)\}/g, '$($1)'),
          name => {
            const value = variables[name];
            if (value === undefined) {
              throw new Error(`Unable to resolve bridging header build setting: ${name}`);
            }
            return IOSConfig.XcodeUtils.unquote(String(value));
          }
        );
        if (!resolved || resolved.includes('$')) {
          throw new Error('Unable to resolve SWIFT_OBJC_BRIDGING_HEADER; configure the AppAuth import manually');
        }
        headerPath = path.resolve(iosRoot, resolved);
        if (!fs.existsSync(headerPath)) {
          throw new Error(`Configured bridging header does not exist: ${headerPath}`);
        }
      } else {
        configuration.buildSettings.SWIFT_OBJC_BRIDGING_HEADER = JSON.stringify(
          path.relative(iosRoot, headerPath)
        );
      }

      if (!headers.has(headerPath)) {
        const contents = fs.existsSync(headerPath) ? fs.readFileSync(headerPath, 'utf8') : '';
        headers.set(headerPath, contents);
      }
    }

    for (const [headerPath, contents] of headers) {
      if (!contents.includes(BRIDGING_HEADER_IMPORT)) {
        fs.writeFileSync(headerPath, `${BRIDGING_HEADER_IMPORT}\n${contents}`, 'utf8');
      }
    }
    return config;
  });
};
