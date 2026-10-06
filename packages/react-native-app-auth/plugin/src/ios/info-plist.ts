import { withInfoPlist, ConfigPlugin, InfoPlist } from '@expo/config-plugins';
import { AppAuthProps } from '../types';

export const addUrlScheme = (
  infoPlist: InfoPlist,
  urlScheme?: string
): InfoPlist => {
  if (!urlScheme) {
    return infoPlist;
  }

  if (!infoPlist.CFBundleURLTypes) {
    infoPlist.CFBundleURLTypes = [];
  }

  const hasScheme = infoPlist.CFBundleURLTypes.some(urlType =>
    urlType.CFBundleURLSchemes?.includes(urlScheme)
  );

  if (!hasScheme) {
    infoPlist.CFBundleURLTypes.push({
      CFBundleURLName: '$(PRODUCT_BUNDLE_IDENTIFIER)',
      CFBundleURLSchemes: [urlScheme],
    });
  }

  return infoPlist;
};

export const withUrlSchemes: ConfigPlugin<AppAuthProps | undefined> = (config, props) => {
  return withInfoPlist(config, cfg => {
    cfg.modResults = addUrlScheme(cfg.modResults, props?.ios?.urlScheme);

    return cfg;
  });
};
