const { withInfoPlist } = require('@expo/config-plugins');

const withUrlSchemes = (config, props) => {
  return withInfoPlist(config, cfg => {
    cfg.ios.infoPlist.CFBundleURLTypes.push({
      CFBundleURLName: '$(PRODUCT_BUNDLE_IDENTIFIER)',
      CFBundleURLSchemes: [props?.ios?.urlScheme],
    });

    return cfg;
  });
};

module.exports = {
  withUrlSchemes,
};
