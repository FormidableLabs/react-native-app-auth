import { withInfoPlist, ConfigPlugin } from '@expo/config-plugins';
import { AppAuthProps } from '../types';

export const withUrlSchemes: ConfigPlugin<AppAuthProps | undefined> = (config, props) => {
  const scheme = props?.ios?.urlScheme;
  if (!scheme) {
    return config;
  }
  if (typeof scheme !== 'string' || !/^[A-Za-z][A-Za-z0-9+.-]*$/.test(scheme)) {
    throw new Error('ios.urlScheme must be a valid URL scheme');
  }

  return withInfoPlist(config, cfg => {
    const urlTypes = cfg.modResults.CFBundleURLTypes ?? [];
    if (!urlTypes.some(type => type.CFBundleURLSchemes?.includes(scheme))) {
      cfg.modResults.CFBundleURLTypes = [
        ...urlTypes,
        {
          CFBundleURLName: '$(PRODUCT_BUNDLE_IDENTIFIER)',
          CFBundleURLSchemes: [scheme],
        },
      ];
    }

    return cfg;
  });
};
