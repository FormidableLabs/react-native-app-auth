interface ExpoConfig {
  sdkVersion?: string;
}

const EXPO_SDK_MAJOR_VERSION = 53;

export const isExpo53OrLater = (config: ExpoConfig): boolean => {
  const expoSdkVersion = config.sdkVersion || '0.0.0';
  const [major] = expoSdkVersion.split('.');
  return Number.parseInt(major, 10) >= EXPO_SDK_MAJOR_VERSION;
};