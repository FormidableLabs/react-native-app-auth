const { withPlugins, createRunOncePlugin } = require('@expo/config-plugins');
const { withAppAuthAppDelegate, withAppAuthAppDelegateHeader } = require('./ios');

const withAppAuth = config => {
  return withPlugins(config, [
    // iOS
    withAppAuthAppDelegate,
    withAppAuthAppDelegateHeader, // 👈 ️this one uses withDangerousMod !
  ]);
};

const packageJson = require('../package.json');
module.exports = createRunOncePlugin(withAppAuth, packageJson.name, packageJson.version);
