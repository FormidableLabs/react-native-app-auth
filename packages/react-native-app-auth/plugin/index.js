const { withPlugins, createRunOncePlugin } = require('@expo/config-plugins');

const packageJson = require('../package.json');

const {
  withAppAuthAppDelegate,
  withAppAuthAppDelegateHeader,
  withUrlSchemes,
  withBridgingHeader,
  withXcodeBuildSettings,
} = require('./ios');
const { withAppAuthAppBuildGradle } = require('./android');

const withAppAuth = (config, props) => {
  return withPlugins(config, [
    // iOS
    withBridgingHeader,
    withXcodeBuildSettings,
    withAppAuthAppDelegate,
    withAppAuthAppDelegateHeader,
    [withUrlSchemes, props],

    // Android
    [withAppAuthAppBuildGradle, props],
  ]);
};

module.exports = createRunOncePlugin(withAppAuth, packageJson.name, packageJson.version);
