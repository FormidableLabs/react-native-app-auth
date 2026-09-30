import { withInfoPlist, ConfigPlugin } from '@expo/config-plugins';
import { AppAuthProps } from '../types';

interface InfoPlistWithUrlTypes {
  CFBundleURLTypes?: {
    CFBundleURLName?: string;
    CFBundleURLSchemes?: (string | undefined)[];
  }[];
  [key: string]: any;
}

export const addUrlScheme = (
  infoPlist: InfoPlistWithUrlTypes,
  urlScheme?: string
): InfoPlistWithUrlTypes => {
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
    if (!cfg.ios) {
      cfg.ios = {};
    }
    if (!cfg.ios.infoPlist) {
      cfg.ios.infoPlist = {};
    }

    cfg.ios.infoPlist = addUrlScheme(cfg.ios.infoPlist, props?.ios?.urlScheme);

    return cfg;
  });
};
