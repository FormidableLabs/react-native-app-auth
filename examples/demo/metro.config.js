const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const packagePath = path.join(monorepoRoot, 'packages/react-native-app-auth');

const extraNodeModules = {
  'react-native-app-auth': packagePath,
};
const watchFolders = [path.join(monorepoRoot, 'node_modules'), packagePath];

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules,
    disableHierarchicalLookup: true,
  },
  watchFolders,
};

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
  path.join(packagePath, 'node_modules'),
];

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
