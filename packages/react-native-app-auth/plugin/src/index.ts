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

export const getRedirectUrlScheme = (redirectUrl?: string): string | undefined => {
  return redirectUrl?.split(':')[0];
};

const withAppAuth: AppAuthConfigPlugin = (config, props) => {
  const redirectUrlScheme = getRedirectUrlScheme(props?.redirectUrls?.[0]);

  // Transform redirectUrls configuration to platform-specific format
  const transformedProps: AppAuthProps = props?.redirectUrls ? {
    ios: {
      urlScheme: redirectUrlScheme,
    },
    android: {
      appAuthRedirectScheme: redirectUrlScheme,
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
