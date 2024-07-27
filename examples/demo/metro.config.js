const path = require('node:path');
const { makeMetroConfig } = require('@rnx-kit/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(__dirname, "../..");
const packageRoot = path.resolve(monorepoRoot, "packages/react-native-app-auth");

module.exports = makeMetroConfig({
  watchFolders: [projectRoot, packageRoot],
  resolver: {
    resolverMainFields: ['main', 'react-native'],
    extraNodeModules: {
      'react-native-app-auth': packageRoot,
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
});
