const fs = require('fs');
const path = require('path');

const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');

const { isExpo53OrLater } = require('../expo-version');

const BRIDGING_HEADER_NAME = 'AppDelegate+RNAppAuth.h';
const BRIDGING_HEADER_CONTENT = '#import "RNAppAuthAuthorizationFlowManager.h"\n';

const findBridgingHeader = dir => {
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

const withBridgingHeader = rootConfig => {
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
      let headerPath;

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
        config._createdBridgingHeader = BRIDGING_HEADER_NAME;
      }

      return config;
    },
  ]);
};

const withXcodeBuildSettings = rootConfig =>
  withXcodeProject(rootConfig, config => {
    const project = config.modResults;
    const target = project.getFirstTarget().uuid;

    const currentSetting = project.getBuildProperty('SWIFT_OBJC_BRIDGING_HEADER', target);

    if (!currentSetting && config._createdBridgingHeader) {
      project.addBuildProperty(
        'SWIFT_OBJC_BRIDGING_HEADER',
        `$(SRCROOT)/${config._createdBridgingHeader}`,
        target
      );
    }

    return config;
  });

module.exports = {
  withBridgingHeader,
  withXcodeBuildSettings,
};
