const { getDefaultConfig } = require('@react-native/metro-config');

const path = require('path');

const projectRoot = __dirname;

// If you have a monorepo, the workspace root may be above the project root.
const workspaceRoot = path.resolve(projectRoot, "../..");
const appAuthPackageRoot = path.resolve(workspaceRoot, "packages", "react-native-app-auth");

const packagePath = path.resolve(
  path.join(process.cwd(), '..', '..', 'packages', 'react-native-app-auth'),
);

/**
 * A crude flag to force Metro to resolve one or another fork of react-native.
 * Set to "macos" to resolve react-native-macos.
 * Set to "ios" to resolve react-native.
 * Welcoming a fully automatic solution by anyone more familiar with Metro!
 * @type {"macos" | "ios"}
 */
const applePlatform = "ios";

const extraNodeModules = {
  'react-native': path.resolve(
    projectRoot,
    "node_modules",
    applePlatform === 'macos' ? "react-native-macos" : "react-native"
  ),
  'react-native-app-auth': packagePath,
};
const watchFolders = [monorepoRoot, packagePath];

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    disableHierarchicalLookup: true,
    nodeModulesPaths: [
      path.resolve(workspaceRoot, "node_modules"),
      path.resolve(projectRoot, "node_modules"),
      // Resolve the node modules of the react-native-app-auth workspace to find
      // react-native-base-64.
      path.resolve(appAuthPackageRoot, "node_modules"),
    ],

    extraNodeModules: new Proxy(extraNodeModules, {
      get: (target, name) =>
        name in target
          ? target[name]
          : path.join(process.cwd(), '..', '..', 'node_modules', name),
    }),
    unstable_enableSymlinks: true,

    resolveRequest: (context, moduleName, platform) => {
      if (
        platform === "macos" &&
        (moduleName === "react-native" ||
          moduleName.startsWith("react-native/"))
      ) {
        const newModuleName = moduleName.replace(
          "react-native",
          "react-native-macos",
        );
        return context.resolveRequest(context, newModuleName, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },

  serializer: {
    ...config.serializer,
    getModulesRunBeforeMainModule() {
      return [
        require.resolve("react-native/Libraries/Core/InitializeCore"),
        require.resolve("react-native-macos/Libraries/Core/InitializeCore"),
        ...config.serializer.getModulesRunBeforeMainModule(),
      ];
    },
  },
  watchFolders,
};

