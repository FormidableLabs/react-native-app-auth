/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const path = require('path');

// As the example project uses `link:../` for react-native-owl, which creates a symlink, we need to manually map the project so it is properly used my Metro.
// This will not be required by other projects using react-native-owl installed from a package repository.

const extraNodeModules = {
  'react-native-app-auth': path.resolve(path.join(__dirname, '..')),
};
const watchFolders = [path.resolve(path.join(__dirname, '..'))];

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
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
