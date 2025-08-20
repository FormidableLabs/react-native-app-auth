import { withPlugins, createRunOncePlugin } from '@expo/config-plugins';
import { AppAuthConfigPlugin, AppAuthProps } from './types';
import {
  withAppAuthAppDelegate,
  withAppAuthAppDelegateHeader,
  withUrlSchemes,
  withBridgingHeader,
  withXcodeBuildSettings,
} from './ios';
import { withAppAuthAppBuildGradle } from './android';

const packageJson = require('../../package.json');

const withAppAuth: AppAuthConfigPlugin = (config, props) => {
  // Transform redirectUrls configuration to platform-specific format
  const transformedProps: AppAuthProps = props?.redirectUrls ? {
    ios: {
      urlScheme: props.redirectUrls[0]?.split('://')[0], // Extract scheme from first URL
    },
    android: {
      appAuthRedirectScheme: props.redirectUrls[0]?.split('://')[0], // Extract scheme from first URL
    },
    ...props,
  } : (props || {});

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

export default createRunOncePlugin(withAppAuth, packageJson.name, packageJson.version);