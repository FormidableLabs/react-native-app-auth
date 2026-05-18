const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const path = require('path');

const packagePath = path.resolve(
  path.join(process.cwd(), '..', '..', 'packages', 'react-native-app-auth'),
);

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const extraNodeModules = {
  'react-native-app-auth': packagePath,
};
const watchFolders = [monorepoRoot, packagePath];

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
          : path.join(process.cwd(), '..', '..', 'node_modules', name),
    }),
    unstable_enableSymlinks: true,
  },
  watchFolders,
};

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
