import * as fs from 'fs';
import * as path from 'path';
import { withDangerousMod, withXcodeProject, ConfigPlugin } from '@expo/config-plugins';
import { isExpo53OrLater } from '../expo-version';

const BRIDGING_HEADER_NAME = 'AppDelegate+RNAppAuth.h';
const BRIDGING_HEADER_CONTENT = '#import "RNAppAuthAuthorizationFlowManager.h"\n';

interface ConfigWithBridgingHeader {
  _createdBridgingHeader?: string;
  [key: string]: any;
}

const findBridgingHeader = (dir: string): string | null => {
  const files = fs.readdirSync(dir);

  // First check current directory
  const headerInCurrentDir = files.find(f => f.endsWith('-Bridging-Header.h') || f.endsWith('.h'));
  if (headerInCurrentDir) {
    return path.join(dir, headerInCurrentDir);
  }

  // Then check subdirectories
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const found = findBridgingHeader(fullPath);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

export const withBridgingHeader: ConfigPlugin = rootConfig => {
  if (!isExpo53OrLater(rootConfig)) {
    return rootConfig;
  }

  return withDangerousMod(rootConfig, [
    'ios',
    config => {
      const iosPath = path.join(config.modRequest.projectRoot, 'ios');

      // Search for existing bridging header in the project and subfolders
      const existingHeaderPath = findBridgingHeader(iosPath);
      const importLine = BRIDGING_HEADER_CONTENT;
      let headerPath: string;

      if (existingHeaderPath) {
        headerPath = existingHeaderPath;
        const content = fs.readFileSync(headerPath, 'utf8');

        if (!content.includes(importLine)) {
          fs.writeFileSync(headerPath, `${importLine}\n${content}`);
        }
      } else {
        // Default to new file if none found
        headerPath = path.join(iosPath, BRIDGING_HEADER_NAME);
        fs.writeFileSync(headerPath, `${importLine}\n`);
        (config as ConfigWithBridgingHeader)._createdBridgingHeader = BRIDGING_HEADER_NAME;
      }

      return config;
    },
  ]);
};

export const withXcodeBuildSettings: ConfigPlugin = rootConfig =>
  withXcodeProject(rootConfig, config => {
    const project = config.modResults;
    const target = project.getFirstTarget().uuid;

    const currentSetting = project.getBuildProperty('SWIFT_OBJC_BRIDGING_HEADER', target);

    if (!currentSetting && (config as ConfigWithBridgingHeader)._createdBridgingHeader) {
      project.addBuildProperty(
        'SWIFT_OBJC_BRIDGING_HEADER',
        `$(SRCROOT)/${(config as ConfigWithBridgingHeader)._createdBridgingHeader}`,
        target
      );
    }

    return config;
  });