const { withAppAuthAppDelegateHeader } = require('./app-delegate-header');
const { withAppAuthAppDelegate } = require('./app-delegate');
const { withUrlSchemes } = require('./info-plist');
const { withBridgingHeader, withXcodeBuildSettings } = require('./bridging-header');

module.exports = {
  withAppAuthAppDelegate,
  withAppAuthAppDelegateHeader,
  withUrlSchemes,
  withBridgingHeader,
  withXcodeBuildSettings,
};
