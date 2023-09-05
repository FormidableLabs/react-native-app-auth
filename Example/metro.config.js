const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

const path = require('path');

const extraNodeModules = {
  'react-native-app-auth': path.resolve(path.join(__dirname, '..')),
};
const watchFolders = [path.resolve(path.join(__dirname, '..'))];

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
