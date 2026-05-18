import { withInfoPlist, ConfigPlugin } from '@expo/config-plugins';
import { AppAuthProps } from '../types';

export const withUrlSchemes: ConfigPlugin<AppAuthProps | undefined> = (config, props) => {
  return withInfoPlist(config, cfg => {
    if (!cfg.ios) {
      cfg.ios = {};
    }
    if (!cfg.ios.infoPlist) {
      cfg.ios.infoPlist = {};
    }
    if (!cfg.ios.infoPlist.CFBundleURLTypes) {
      cfg.ios.infoPlist.CFBundleURLTypes = [];
    }
    
    cfg.ios.infoPlist.CFBundleURLTypes.push({
      CFBundleURLName: '$(PRODUCT_BUNDLE_IDENTIFIER)',
      CFBundleURLSchemes: [props?.ios?.urlScheme],
    });

    return cfg;
  });
};