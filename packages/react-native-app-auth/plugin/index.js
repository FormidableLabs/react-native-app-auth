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
  // Transform redirectUrls configuration to platform-specific format
  const transformedProps = props?.redirectUrls ? {
    ios: {
      urlScheme: props.redirectUrls[0]?.split('://')[0], // Extract scheme from first URL
    },
    android: {
      appAuthRedirectScheme: props.redirectUrls[0]?.split('://')[0], // Extract scheme from first URL
    },
    ...props,
  } : props;

  return withPlugins(config, [
    // iOS
    withBridgingHeader,
    withXcodeBuildSettings,
    withAppAuthAppDelegate,
    withAppAuthAppDelegateHeader,
    [withUrlSchemes, transformedProps],

    // Android
    [withAppAuthAppBuildGradle, transformedProps],
  ]);
};

module.exports = createRunOncePlugin(withAppAuth, packageJson.name, packageJson.version);
