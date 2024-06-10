const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const path = require('path');

const packagePath = path.resolve(
  path.join(__dirname, '..', 'packages', 'react-native-app-auth'),
);

const extraNodeModules = {
  'react-native-app-auth': packagePath,
};
const watchFolders = [packagePath];

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: new Proxy(extraNodeModules, {
      get: (target, name) =>
        name in target
          ? target[name]
          : path.join(process.cwd(), `node_modules/${name}`),
    }),
  },
  watchFolders,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
