import * as fs from 'fs';
import * as path from 'path';

interface ExpoConfig {
  sdkVersion?: string;
  _internal?: {
    [key: string]: any;
    projectRoot?: string;
  };
}

export const MIN_EXPO_SDK_MAJOR_VERSION = 53;

const parseMajorVersion = (version?: string): number | null => {
  if (!version) {
    return null;
  }

  const match = version.match(/\d+/);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[0], 10);
};

const readExpoPackageVersion = (projectRoot?: string): string | undefined => {
  if (!projectRoot) {
    return undefined;
  }

  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return undefined;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.dependencies?.expo || packageJson.devDependencies?.expo;
};

export const getExpoSdkMajorVersion = (
  config: ExpoConfig,
  projectRoot = config._internal?.projectRoot
): number | null => {
  return (
    parseMajorVersion(config.sdkVersion) ??
    parseMajorVersion(readExpoPackageVersion(projectRoot))
  );
};

export const isExpo53OrLater = (config: ExpoConfig, projectRoot?: string): boolean => {
  const major = getExpoSdkMajorVersion(config, projectRoot);
  return major != null && major >= MIN_EXPO_SDK_MAJOR_VERSION;
};

export const assertExpo53OrLater = (config: ExpoConfig, projectRoot?: string): void => {
  const major = getExpoSdkMajorVersion(config, projectRoot);
  if (major != null && major < MIN_EXPO_SDK_MAJOR_VERSION) {
    throw new Error(
      `react-native-app-auth config plugin requires Expo SDK ${MIN_EXPO_SDK_MAJOR_VERSION} or later. Detected Expo SDK ${major}.`
    );
  }
};
